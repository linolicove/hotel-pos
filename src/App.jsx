import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCU84gJirHE9c1s7Bqh90pzyOtjdaR5uus",
  authDomain: "hotel-pos-app.firebaseapp.com",
  databaseURL: "https://hotel-pos-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-pos-app",
  storageBucket: "hotel-pos-app.firebasestorage.app",
  messagingSenderId: "44475111004",
  appId: "1:44475111004:web:58cc62ea1e050e2f767899",
  measurementId: "G-KWG9FMP5Q7"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics not initialized in this environment:", e);
  }
}
const db = getFirestore(app);
const auth = getAuth(app);

// Initial Rooms Data
const INITIAL_ROOMS = [
  { id: '101', number: 'Villa 101', type: 'Beachfront Surf Villa', tier: 'VILLA', rate: 48000, capacity: '2-4 Guests', status: 'Clean', guest: 'Jack Higgins', nights: 4, checkIn: '2026-09-26', checkOut: '2026-09-30', folioBalance: 192000, occupied: true },
  { id: '102', number: 'Villa 102', type: 'Beachfront Surf Villa', tier: 'VILLA', rate: 48000, capacity: '2-4 Guests', status: 'Clean', guest: null, nights: 0, checkIn: '', checkOut: '', folioBalance: 0, occupied: false },
  { id: '201', number: 'Suite 201', type: 'Ocean Panorama Suite', tier: 'SUITE', rate: 36000, capacity: '2 Guests', status: 'Dirty', guest: null, nights: 0, checkIn: '', checkOut: '', folioBalance: 0, occupied: false },
  { id: '204', number: 'Suite 204', type: 'Ocean Panorama Suite', tier: 'SUITE', rate: 36000, capacity: '2 Guests', status: 'Clean', guest: 'Elena Rostova', nights: 3, checkIn: '2026-09-28', checkOut: '2026-10-01', folioBalance: 108000, occupied: true },
  { id: '301', number: 'Cabana 301', type: 'Garden Palm Cabana', tier: 'CABANA', rate: 24000, capacity: '2 Guests', status: 'Clean', guest: 'Marcus & Zoe Sterling', nights: 5, checkIn: '2026-09-25', checkOut: '2026-09-30', folioBalance: 120000, occupied: true },
  { id: '302', number: 'Cabana 302', type: 'Garden Palm Cabana', tier: 'CABANA', rate: 24000, capacity: '2 Guests', status: 'Inspect', guest: null, nights: 0, checkIn: '', checkOut: '', folioBalance: 0, occupied: false },
  { id: '401', number: 'Room 401', type: 'Deluxe Surf King', tier: 'DELUXE', rate: 18500, capacity: '2 Guests', status: 'Clean', guest: 'Liam Vance', nights: 2, checkIn: '2026-09-28', checkOut: '2026-09-30', folioBalance: 37000, occupied: true },
  { id: '402', number: 'Room 402', type: 'Deluxe Surf King', tier: 'DELUXE', rate: 18500, capacity: '2 Guests', status: 'Dirty', guest: null, nights: 0, checkIn: '', checkOut: '', folioBalance: 0, occupied: false }
];

// Room Amenities & Extra Hotel Charges (No Food)
const HOTEL_AMENITIES = [
  { id: 'AM-01', code: 'TRF-VAN', name: 'Airport Private Van Transfer', category: 'TRANSFER', price: 14500, desc: 'Colombo BIA to Midigama Direct' },
  { id: 'AM-02', code: 'TRF-TUK', name: 'Galle Fort Excursion Driver', category: 'TRANSFER', price: 6500, desc: 'Full Day Dedicated Tuk-Tuk' },
  { id: 'AM-03', code: 'SRF-BRD', name: 'Custom Surfboard Daily Rental', category: 'ACTIVITIES', price: 4000, desc: 'Torq / Firewire Pro Quiver' },
  { id: 'AM-04', code: 'SRF-GUD', name: 'Private Surf Guide (Lazy Left)', category: 'ACTIVITIES', price: 9500, desc: '2h Spot Guide & Ocean Coaching' },
  { id: 'AM-05', code: 'LND-KGS', name: 'Express Laundry Wash & Fold', category: 'SERVICE', price: 3200, desc: 'Up to 5kg Same-Day Service' },
  { id: 'AM-06', code: 'LATE-CO', name: 'Late Checkout Guaranteed (4 PM)', category: 'SERVICE', price: 12000, desc: 'Subject to Next Check-in Slot' },
  { id: 'AM-07', code: 'EXT-BED', name: 'Rollaway Extra Luxury Bed', category: 'ROOM_ADDON', price: 8500, desc: 'Includes Luxury Egyptian Linens' },
  { id: 'AM-08', code: 'YGA-PSS', name: 'Rooftop Yoga Sunset Pass', category: 'ACTIVITIES', price: 3000, desc: '90m Vinyasa Flow with Master' }
];

export default function HotelRoomPMS() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'rooms', 'housekeeping', 'reports', 'staff', 'settings'
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState('102');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Front Desk Booking Cart
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [stayNights, setStayNights] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cashTendered, setCashTendered] = useState('');

  // Sync & Cloud State
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting to Firebase...');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [printReceiptModal, setPrintReceiptModal] = useState(null);

  // Staff State
  const [staffList, setStaffList] = useState([
    { id: 'ST-01', name: 'Kamal Perera', role: 'Front Office Manager', pin: '1092', onDuty: true, shift: 'Morning 07:00 - 15:30' },
    { id: 'ST-02', name: 'Dilani Silva', role: 'Front Desk Cashier', pin: '4481', onDuty: true, shift: 'Morning 07:00 - 15:30' },
    { id: 'ST-03', name: 'Chaminda Dias', role: 'Chief Concierge', pin: '8832', onDuty: false, shift: 'Evening 15:00 - 23:30' },
    { id: 'ST-04', name: 'Nayana Kumari', role: 'Head Housekeeper', pin: '2019', onDuty: true, shift: 'Day 08:00 - 16:30' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Front Desk Cashier');
  const [newStaffPin, setNewStaffPin] = useState('');

  // Connect & listen to Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    async function initFb() {
      try {
        await signInAnonymously(auth);
        setFirebaseConnected(true);
        setSyncStatus('Firebase Real-Time Online');

        const q = query(
          collection(db, "hotel_room_transactions"),
          orderBy("timestamp", "desc"),
          limit(20)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          if (list.length > 0) {
            setRecentTransactions(list);
          }
        }, (err) => {
          console.warn("Firestore listener restricted or offline fallback:", err.message);
          setSyncStatus('Local Memory Mode (Firebase Ready)');
        });
      } catch (err) {
        console.warn("Firebase Anonymous Auth fallback:", err.message);
        setSyncStatus('Local Memory Mode');
      }
    }
    initFb();
    return () => unsubscribe();
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Pricing calculations
  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const roomChargeTotal = (selectedRoom.occupied ? 0 : selectedRoom.rate * stayNights);
  const amenitiesSubtotal = calculateCartSubtotal();
  const rawTotal = roomChargeTotal + amenitiesSubtotal;
  const discountAmount = (rawTotal * discountPercent) / 100;
  const netBeforeTax = rawTotal - discountAmount;
  const serviceCharge = netBeforeTax * 0.10; // 10% Hotel Service Charge
  const totalDue = netBeforeTax + serviceCharge;

  const addItemToCart = (amenity) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === amenity.id);
      if (existing) {
        return prev.map(i => i.id === amenity.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...amenity, quantity: 1 }];
    });
  };

  const updateItemQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleProcessFolio = async () => {
    if (!guestName && !selectedRoom.guest) {
      alert("Please enter the Guest's Name for room assignment.");
      return;
    }

    const currentGuest = selectedRoom.guest || guestName;
    const invoiceNo = `INV-LC-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx = {
      invoiceNo,
      roomNumber: selectedRoom.number,
      guestName: currentGuest,
      roomType: selectedRoom.type,
      nights: selectedRoom.occupied ? selectedRoom.nights : stayNights,
      amenities: cart,
      subtotal: rawTotal,
      discount: discountAmount,
      serviceCharge: serviceCharge,
      totalDue: totalDue,
      paymentMethod,
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('en-GB')
    };

    // Update Room State
    setRooms(prev => prev.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          occupied: true,
          guest: currentGuest,
          nights: selectedRoom.occupied ? selectedRoom.nights : stayNights,
          status: 'Dirty',
          folioBalance: selectedRoom.folioBalance + totalDue
        };
      }
      return r;
    }));

    // Firestore Sync
    try {
      if (firebaseConnected) {
        await addDoc(collection(db, "hotel_room_transactions"), {
          ...newTx,
          serverCreated: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Recorded transaction locally:", e.message);
    }

    setRecentTransactions(prev => [newTx, ...prev]);
    setPrintReceiptModal(newTx);
    setCart([]);
    setGuestName('');
  };

  const handleCheckoutRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.occupied) return;

    if (confirm(`Check-out guest ${room.guest} from ${room.number}?\nTotal Folio Settled: Rs.${room.folioBalance.toLocaleString()}`)) {
      setRooms(prev => prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            occupied: false,
            guest: null,
            nights: 0,
            folioBalance: 0,
            status: 'Dirty'
          };
        }
        return r;
      }));
    }
  };

  const handleHousekeepingToggle = (roomId) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const nextStatus = r.status === 'Clean' ? 'Dirty' : r.status === 'Dirty' ? 'Inspect' : 'Clean';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPin) return;
    const newMember = {
      id: `ST-0${staffList.length + 1}`,
      name: newStaffName,
      role: newStaffRole,
      pin: newStaffPin,
      onDuty: true,
      shift: 'Day Shift'
    };
    setStaffList([...staffList, newMember]);
    setNewStaffName('');
    setNewStaffPin('');
  };

  // Filter amenities
  const filteredAmenities = HOTEL_AMENITIES.filter(item => {
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate Metrics for Reports
  const occupancyRate = Math.round((rooms.filter(r => r.occupied).length / rooms.length) * 100);
  const totalFolioRevenue = recentTransactions.reduce((acc, curr) => acc + (curr.totalDue || 0), 0);
  const adr = rooms.filter(r => r.occupied).length > 0 
    ? Math.round(totalFolioRevenue / rooms.filter(r => r.occupied).length) 
    : 32000;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D1117] text-[#E6EDF3] font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#11141E] border-r border-[#1F2430] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5B22] flex items-center justify-center font-bold text-white shadow-lg shadow-[#FF5B22]/20 text-lg">
                LC
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white leading-tight">Linoli Cove</h1>
                <p className="text-[10px] text-[#FF5B22] font-semibold tracking-wider uppercase">Midigama Surf Resort</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-2">Front Desk & Operations</div>
            
            <button 
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'pos' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <span>🏨</span>
              <span className="font-semibold">Room Check-In & Folio</span>
            </button>

            <button 
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'rooms' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <div className="flex items-center space-x-3">
                <span>🔑</span>
                <span className="font-semibold">Rooms Directory</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2333] text-[#FF5B22] font-bold">
                {rooms.filter(r => r.occupied).length}/{rooms.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('housekeeping')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'housekeeping' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <div className="flex items-center space-x-3">
                <span>🧹</span>
                <span className="font-semibold">Housekeeping Board</span>
              </div>
              {rooms.some(r => r.status === 'Dirty') && (
                <span className="w-2 h-2 rounded-full bg-[#FF5B22] animate-pulse"></span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'reports' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <span>📊</span>
              <span className="font-semibold">RevPAR & Sales Reports</span>
            </button>

            <div className="pt-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-2">Management</div>

            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'staff' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <span>👥</span>
              <span className="font-semibold">Staff & Rosters</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${activeTab === 'settings' ? 'bg-[#FF5B22] text-white shadow-md' : 'text-gray-400 hover:bg-[#181D2A] hover:text-white'}`}
            >
              <span>⚙️</span>
              <span className="font-semibold">Resort Settings</span>
            </button>
          </nav>
        </div>

        {/* Current Operator Profile */}
        <div className="p-3 border-t border-[#1F2430] bg-[#0E1118]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                FD
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">Front Desk System</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-gray-400">{syncStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0D1117]">
        
        {/* Top Operational Bar */}
        <header className="h-14 border-b border-[#1F2430] bg-[#11141E] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected Room:</span>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="bg-[#181D2A] border border-[#272E3F] text-xs font-bold text-white rounded-lg px-3 py-1.5 focus:border-[#FF5B22] focus:outline-none"
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.number} - {room.type} ({room.occupied ? `Booked: ${room.guest}` : 'Available'})
                  </option>
                ))}
              </select>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedRoom.occupied ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                {selectedRoom.occupied ? 'OCCUPIED' : 'VACANT'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-400">
              Resort Occupancy: <span className="font-bold text-white">{occupancyRate}%</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-700"></div>
            <div className="text-xs text-gray-400">
              ADR: <span className="font-bold text-[#FF5B22]">Rs. {adr.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Catalog & Room Charge Center */}
            <section className="flex-1 flex flex-col p-5 overflow-y-auto">
              
              {/* Selected Room Banner */}
              <div className="bg-gradient-to-r from-[#181E2C] to-[#121622] border border-[#22293C] rounded-2xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white">{selectedRoom.number}</h2>
                    <span className="text-xs text-gray-400">• {selectedRoom.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Standard Nightly Rate: <span className="text-white font-semibold">Rs. {selectedRoom.rate.toLocaleString()}</span> + 10% Service Surcharge
                  </p>
                </div>

                {!selectedRoom.occupied ? (
                  <div className="flex items-center space-x-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Guest Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Jack Higgins"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="bg-[#0D1117] border border-[#2B344A] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FF5B22]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Nights</label>
                      <input 
                        type="number" 
                        min="1"
                        max="30"
                        value={stayNights}
                        onChange={(e) => setStayNights(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-[#0D1117] border border-[#2B344A] rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#FF5B22]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">Current In-House Guest</p>
                    <p className="text-sm font-semibold text-white">{selectedRoom.guest}</p>
                    <p className="text-[10px] text-gray-400">{selectedRoom.nights} Nights Registered • Balance: Rs. {selectedRoom.folioBalance.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Amenity / Add-on Category Filters */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {['ALL', 'TRANSFER', 'ACTIVITIES', 'SERVICE', 'ROOM_ADDON'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${categoryFilter === cat ? 'bg-[#FF5B22] text-white shadow-sm' : 'bg-[#151A26] text-gray-400 hover:text-white'}`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <input 
                  type="text"
                  placeholder="Search amenities or extras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#151A26] border border-[#22293C] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5B22] w-56"
                />
              </div>

              {/* Amenities Grid (No Food) */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredAmenities.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => addItemToCart(item)}
                    className="group bg-[#131722] border border-[#1E2536] hover:border-[#FF5B22] rounded-xl p-3.5 cursor-pointer transition transform active:scale-95 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold bg-[#1C2333] text-gray-400 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="text-[9px] font-bold text-[#FF5B22] uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-xs text-white mt-2 group-hover:text-[#FF5B22] transition">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.desc}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-[#1C2333] flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Rs. {item.price.toLocaleString()}</span>
                      <span className="text-[10px] bg-[#FF5B22]/10 text-[#FF5B22] px-2 py-0.5 rounded font-bold group-hover:bg-[#FF5B22] group-hover:text-white transition">
                        + Add to Folio
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Folio Checkout Terminal (Right Panel) */}
            <aside className="w-80 bg-[#121623] border-l border-[#1F2430] flex flex-col justify-between shrink-0">
              
              <div className="p-4 border-b border-[#1F2430]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Folio Billing Summary</h3>
                <p className="text-[11px] text-gray-400">{selectedRoom.number} • {selectedRoom.occupied ? `Guest: ${selectedRoom.guest}` : 'New Booking / Folio'}</p>
              </div>

              {/* Itemized charges list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Room Night Charges if New Booking */}
                {!selectedRoom.occupied && (
                  <div className="bg-[#181E2C] rounded-lg p-2.5 border border-[#22293C]">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>Room Nights ({stayNights}x)</span>
                      <span>Rs. {(selectedRoom.rate * stayNights).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">@ Rs. {selectedRoom.rate.toLocaleString()} / night</span>
                  </div>
                )}

                {/* Amenity items */}
                {cart.length === 0 && selectedRoom.occupied && (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    Select amenities or guest services from the left to add to room bill.
                  </div>
                )}

                {cart.map((item) => (
                  <div key={item.id} className="bg-[#161B28] rounded-lg p-2.5 border border-[#202636] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-gray-400">Rs. {item.price.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateItemQty(item.id, -1)}
                        className="w-5 h-5 bg-[#212738] rounded text-gray-300 flex items-center justify-center hover:bg-gray-700 text-xs font-bold"
                      >-</button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQty(item.id, 1)}
                        className="w-5 h-5 bg-[#212738] rounded text-gray-300 flex items-center justify-center hover:bg-gray-700 text-xs font-bold"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Settlement Totals */}
              <div className="p-4 bg-[#0E121B] border-t border-[#1F2430] space-y-2.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">Rs. {rawTotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Discount</span>
                  <div className="flex items-center space-x-1">
                    {[0, 5, 10, 15].map((pct) => (
                      <button 
                        key={pct}
                        onClick={() => setDiscountPercent(pct)}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${discountPercent === pct ? 'bg-[#FF5B22] text-white font-bold' : 'bg-[#1C2333] text-gray-400'}`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Service Surcharge (10%)</span>
                  <span className="font-semibold text-white">Rs. {Math.round(serviceCharge).toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-[#1F2430] flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase text-white">Total Due</span>
                  <span className="text-lg font-black text-[#FF5B22]">Rs. {Math.round(totalDue).toLocaleString()}</span>
                </div>

                {/* Payment Selector */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {['CARD', 'CASH', 'TRANSFER'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`text-[10px] py-1.5 rounded font-bold border transition ${paymentMethod === method ? 'bg-[#FF5B22] text-white border-[#FF5B22]' : 'bg-[#161B28] text-gray-400 border-[#22293C] hover:text-white'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Submit Action */}
                <button
                  disabled={rawTotal === 0}
                  onClick={handleProcessFolio}
                  className="w-full mt-2 bg-[#FF5B22] hover:bg-[#e04f1d] disabled:opacity-40 disabled:pointer-events-none text-white font-bold py-2.5 rounded-xl shadow-lg shadow-[#FF5B22]/20 text-xs transition"
                >
                  Post Folio & Print Invoice
                </button>
              </div>

            </aside>
          </div>
        )}

        {/* ROOMS DIRECTORY TAB */}
        {activeTab === 'rooms' && (
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Resort Accommodations Directory</h2>
                <p className="text-xs text-gray-400">Real-time status of surf villas, ocean suites, and garden cabanas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="bg-[#121622] border border-[#1E2536] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-white">{room.number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${room.occupied ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {room.occupied ? 'OCCUPIED' : 'VACANT'}
                      </span>
                    </div>
                    <p className="text-xs text-[#FF5B22] font-semibold mt-1">{room.type}</p>
                    <p className="text-[11px] text-gray-400 mt-2">Rate: Rs. {room.rate.toLocaleString()} / night</p>
                    
                    {room.occupied && (
                      <div className="mt-3 p-2 bg-[#181E2C] rounded-lg border border-[#22293C]">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Guest In-House</p>
                        <p className="text-xs font-bold text-white">{room.guest}</p>
                        <p className="text-[11px] text-amber-400 font-semibold mt-1">Balance: Rs. {room.folioBalance.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1C2333] flex items-center justify-between">
                    <button 
                      onClick={() => handleHousekeepingToggle(room.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border ${room.status === 'Clean' ? 'border-emerald-500 text-emerald-400' : room.status === 'Dirty' ? 'border-rose-500 text-rose-400' : 'border-amber-500 text-amber-400'}`}
                    >
                      {room.status}
                    </button>

                    {room.occupied ? (
                      <button 
                        onClick={() => handleCheckoutRoom(room.id)}
                        className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white px-2.5 py-1 rounded transition"
                      >
                        Settle & Check-Out
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedRoomId(room.id); setActiveTab('pos'); }}
                        className="text-[10px] font-bold bg-[#FF5B22] text-white px-2.5 py-1 rounded shadow hover:bg-[#e04f1d] transition"
                      >
                        Check-In Guest
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOUSEKEEPING TAB */}
        {activeTab === 'housekeeping' && (
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Housekeeping Turnover Board</h2>
            <p className="text-xs text-gray-400 mb-6">Manage room cleaning rotations and room readiness prior to guest check-ins.</p>

            <div className="grid grid-cols-3 gap-6">
              {['Clean', 'Dirty', 'Inspect'].map(statusType => (
                <div key={statusType} className="bg-[#121622] rounded-xl border border-[#1E2536] p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-white">{statusType} Rooms</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1C2333] text-gray-300">
                      {rooms.filter(r => r.status === statusType).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rooms.filter(r => r.status === statusType).map(r => (
                      <div key={r.id} className="bg-[#181E2C] p-3 rounded-lg border border-[#22293C] flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">{r.number}</p>
                          <p className="text-[10px] text-gray-400">{r.type}</p>
                        </div>
                        <button 
                          onClick={() => handleHousekeepingToggle(r.id)}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-[#202738] text-gray-300 hover:text-white border border-[#2A334A]"
                        >
                          Change Status
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALES & REVPAR REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Hospitality Sales & RevPAR Reports</h2>
            <p className="text-xs text-gray-400 mb-6">Audited folio accounts, room night sales, and amenity distributions.</p>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#121622] border border-[#1E2536] rounded-xl p-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Gross Folio Sales</span>
                <p className="text-lg font-bold text-white mt-1">Rs. {totalFolioRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-[#121622] border border-[#1E2536] rounded-xl p-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Occupancy Rate</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">{occupancyRate}%</p>
              </div>
              <div className="bg-[#121622] border border-[#1E2536] rounded-xl p-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Average Daily Rate (ADR)</span>
                <p className="text-lg font-bold text-[#FF5B22] mt-1">Rs. {adr.toLocaleString()}</p>
              </div>
              <div className="bg-[#121622] border border-[#1E2536] rounded-xl p-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">RevPAR</span>
                <p className="text-lg font-bold text-blue-400 mt-1">Rs. {Math.round(adr * (occupancyRate / 100)).toLocaleString()}</p>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div className="bg-[#121622] border border-[#1E2536] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#1E2536] font-bold text-xs text-white uppercase tracking-wider">
                Recent Folio Invoices
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161B28] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Total Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2333] text-gray-300">
                  {recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#161C2A]">
                      <td className="p-3 font-semibold text-white">{tx.invoiceNo}</td>
                      <td className="p-3">{tx.roomNumber}</td>
                      <td className="p-3">{tx.guestName}</td>
                      <td className="p-3">{tx.paymentMethod}</td>
                      <td className="p-3 text-right font-bold text-[#FF5B22]">Rs. {Math.round(tx.totalDue).toLocaleString()}</td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">No transactions recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Staff Roster & Shift Authorization</h2>
            <p className="text-xs text-gray-400 mb-6">Manage front desk receptionists, managers, and housekeeping staff.</p>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-3">
                {staffList.map((member) => (
                  <div key={member.id} className="bg-[#121622] border border-[#1E2536] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white text-xs">{member.name}</h4>
                        <span className="text-[10px] bg-[#1C2333] text-gray-400 px-1.5 py-0.5 rounded font-mono">PIN: ****</span>
                      </div>
                      <p className="text-[11px] text-[#FF5B22] font-semibold mt-0.5">{member.role}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{member.shift}</p>
                    </div>

                    <button 
                      onClick={() => setStaffList(prev => prev.map(s => s.id === member.id ? { ...s, onDuty: !s.onDuty } : s))}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${member.onDuty ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                    >
                      {member.onDuty ? 'On Duty' : 'Off Duty'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Staff */}
              <div className="bg-[#121622] border border-[#1E2536] rounded-xl p-5 h-fit">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-3">Add Team Member</h3>
                <form onSubmit={handleAddStaff} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kasun Fernando"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5B22] mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Role</label>
                    <select 
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5B22] mt-1"
                    >
                      <option value="Front Desk Cashier">Front Desk Cashier</option>
                      <option value="Front Office Manager">Front Office Manager</option>
                      <option value="Night Auditor">Night Auditor</option>
                      <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">POS Security PIN</label>
                    <input 
                      type="password" 
                      maxLength="4"
                      required
                      placeholder="4 Digits"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value)}
                      className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5B22] mt-1"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#FF5B22] hover:bg-[#e04f1d] text-white font-bold py-2 rounded-lg text-xs mt-2 transition"
                  >
                    Authorize Staff
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* RESORT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Resort System Configuration</h2>
            <p className="text-xs text-gray-400 mb-6">Manage currency, resort surcharge, and Firebase cloud integrations.</p>

            <div className="max-w-xl bg-[#121622] border border-[#1E2536] rounded-xl p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300">Property Legal Name</label>
                <input 
                  type="text" 
                  defaultValue="Linoli Cove Midigama Surf Resort & Villas"
                  className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300">Resort Service Surcharge (%)</label>
                <input 
                  type="number" 
                  defaultValue="10"
                  className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300">Currency Display</label>
                <input 
                  type="text" 
                  defaultValue="LKR (Rs.)"
                  className="w-full bg-[#181D2A] border border-[#272E3F] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="pt-2">
                <button className="bg-[#FF5B22] hover:bg-[#e04f1d] text-white font-bold px-4 py-2 rounded-lg text-xs transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* INVOICE / RECEIPT MODAL */}
      {printReceiptModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl font-mono text-xs">
            <div className="text-center pb-4 border-b border-dashed border-gray-300">
              <h3 className="font-black text-sm uppercase">Linoli Cove Midigama</h3>
              <p className="text-[10px] text-gray-600">Surf Resort & Luxury Accommodations</p>
              <p className="text-[9px] text-gray-500">Ahangama Road, Midigama, Sri Lanka</p>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{printReceiptModal.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>ROOM:</span>
                <span className="font-bold">{printReceiptModal.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>GUEST:</span>
                <span className="font-bold">{printReceiptModal.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{printReceiptModal.dateStr}</span>
              </div>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5">
              {printReceiptModal.nights > 0 && (
                <div className="flex justify-between">
                  <span>Room Charge ({printReceiptModal.nights} nights)</span>
                  <span className="font-bold">Rs. {printReceiptModal.subtotal.toLocaleString()}</span>
                </div>
              )}
              {printReceiptModal.amenities.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.quantity}x {item.name}</span>
                  <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="py-3 space-y-1">
              <div className="flex justify-between">
                <span>Service Surcharge (10%):</span>
                <span>Rs. {Math.round(printReceiptModal.serviceCharge).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300">
                <span>TOTAL SETTLED:</span>
                <span>Rs. {Math.round(printReceiptModal.totalDue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Payment Method:</span>
                <span>{printReceiptModal.paymentMethod}</span>
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-gray-500 border-t border-dashed border-gray-300">
              Thank you for staying at Linoli Cove!
            </div>

            <div className="mt-5 flex space-x-2">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-sans font-bold hover:bg-black transition"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => setPrintReceiptModal(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-sans font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}