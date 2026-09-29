// src/App.jsx
import React, { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import {
  Bed,
  Receipt,
  Boxes,
  Users,
  Settings,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Menu,
  X,
  Building2,
  SlidersHorizontal,
  Edit2,
  Check,
  CreditCard,
  ArrowRight,
  DollarSign
} from "lucide-react";

// --- 1. FIREBASE CONFIGURATION ---
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const DEFAULT_SETTINGS = {
  hotelName: "Azure Cove Boutique Resort",
  taxNumber: "TX-998234-CY",
  phone: "+1 (808) 555-0199",
  email: "concierge@azurecove.com",
  address: "104 Ocean Drive, Kailua-Kona, HI",
  currency: "$",
  footerNote: "Mahalo for staying with us at Azure Cove. Safe travels!",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("frontdesk");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore Synchronized State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Folio, Active Room & Print State
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [printFormat, setPrintFormat] = useState("a4");

  // Front Desk Check-in & Settlement Modals
  const [checkInModalRoom, setCheckInModalRoom] = useState(null);
  const [settleModalRoom, setSettleModalRoom] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("Credit Card");
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", nights: 1 });

  // Custom Line Item Inputs
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Room Management / Admin State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    number: "",
    type: "Ocean Breeze King",
    rate: 180,
    status: "available",
  });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomRate, setEditRoomRate] = useState("");

  // --- 2. REAL-TIME FIRESTORE HOOKS ---
  useEffect(() => {
    // Hotel Profile Sync
    const settingsRef = doc(db, "hotel_config", "profile");
    const unsubSettings = onSnapshot(settingsRef, async (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        await setDoc(settingsRef, DEFAULT_SETTINGS);
      }
    });

    // Rooms Real-time Sync
    const roomsCol = collection(db, "rooms");
    const unsubRooms = onSnapshot(roomsCol, async (snap) => {
      if (snap.empty) {
        const seedRooms = [
          {
            id: "101",
            number: "101",
            type: "Ocean Breeze King",
            rate: 220,
            status: "occupied",
            guestName: "Marina Sterling",
            guestPhone: "+1 555-0143",
            checkIn: "2026-09-28",
            checkOut: "2026-10-02",
            folio: [
              { id: "f1", description: "Room Charge (2 Nights)", quantity: 2, unitPrice: 220, total: 440 },
              { id: "f2", description: "Minibar: Artisanal Sparkling Water", quantity: 2, unitPrice: 6, total: 12 },
            ],
          },
          { id: "102", number: "102", type: "Lagoon View Double", rate: 180, status: "available", folio: [] },
          { id: "201", number: "201", type: "Coral Penthouse Suite", rate: 450, status: "cleaning", folio: [] },
          { id: "202", number: "202", type: "Ocean Breeze King", rate: 220, status: "maintenance", folio: [] },
        ];
        for (const r of seedRooms) {
          await setDoc(doc(db, "rooms", r.id), r);
        }
      } else {
        const loaded = [];
        snap.forEach((d) => loaded.push(d.data()));
        setRooms(loaded.sort((a, b) => a.number.localeCompare(b.number)));
        if (!selectedRoomId && loaded.length > 0) {
          const firstOccupied = loaded.find(r => r.status === "occupied");
          setSelectedRoomId(firstOccupied ? firstOccupied.id : loaded[0].id);
        }
      }
    });

    // Inventory Real-time Sync
    const invCol = collection(db, "inventory");
    const unsubInv = onSnapshot(invCol, async (snap) => {
      if (snap.empty) {
        const seedInv = [
          { id: "inv1", name: "Artisanal Sparkling Water", category: "minibar", price: 6, stock: 48 },
          { id: "inv2", name: "Organic Coconut Chips", category: "minibar", price: 5, stock: 32 },
          { id: "inv3", name: "Sea Salt Scrub Pack", category: "amenity", price: 12, stock: 15 },
          { id: "inv4", name: "Egyptian Cotton Bath Towel", category: "linen", price: 0, stock: 75 },
        ];
        for (const item of seedInv) {
          await setDoc(doc(db, "inventory", item.id), item);
        }
      } else {
        const loaded = [];
        snap.forEach((d) => loaded.push(d.data()));
        setInventory(loaded);
      }
    });

    // Staff Real-time Sync
    const staffCol = collection(db, "staff");
    const unsubStaff = onSnapshot(staffCol, async (snap) => {
      if (snap.empty) {
        const seedStaff = [
          { id: "s1", name: "Kailani Silva", role: "Manager", pin: "1001", active: true },
          { id: "s2", name: "Noah Jensen", role: "Front Desk", pin: "2044", active: true },
          { id: "s3", name: "Leilani Kea", role: "Housekeeping", pin: "3055", active: true },
        ];
        for (const member of seedStaff) {
          await setDoc(doc(db, "staff", member.id), member);
        }
      } else {
        const loaded = [];
        snap.forEach((d) => loaded.push(d.data()));
        setStaff(loaded);
      }
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubRooms();
      unsubInv();
      unsubStaff();
    };
  }, [selectedRoomId]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // --- 3. FIRESTORE ACTIONS ---
  const handleSaveSettings = async (updated) => {
    setSettings(updated);
    await setDoc(doc(db, "hotel_config", "profile"), updated);
  };

  const updateRoomStatus = async (roomId, status) => {
    await updateDoc(doc(db, "rooms", roomId), { status });
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomForm.number) return;

    const roomId = newRoomForm.number.trim();
    const newRoomData = {
      id: roomId,
      number: newRoomForm.number.trim(),
      type: newRoomForm.type,
      rate: Number(newRoomForm.rate) || 100,
      status: newRoomForm.status,
      folio: [],
    };

    await setDoc(doc(db, "rooms", roomId), newRoomData);
    setShowAddRoomModal(false);
    setNewRoomForm({
      number: "",
      type: "Ocean Breeze King",
      rate: 180,
      status: "available",
    });
  };

  const handleSaveRoomRate = async (roomId) => {
    const rateVal = parseFloat(editRoomRate);
    if (!isNaN(rateVal) && rateVal > 0) {
      await updateDoc(doc(db, "rooms", roomId), { rate: rateVal });
    }
    setEditingRoomId(null);
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (window.confirm(`Permanently remove Room #${roomNumber} from database?`)) {
      await deleteDoc(doc(db, "rooms", roomId));
    }
  };

  const handleCompleteCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInModalRoom || !guestForm.name) return;

    const nights = guestForm.nights || 1;
    const initialFolio = [
      {
        id: Date.now().toString(),
        description: `Room Charge (${nights} Night${nights > 1 ? "s" : ""})`,
        quantity: nights,
        unitPrice: checkInModalRoom.rate,
        total: checkInModalRoom.rate * nights,
      },
    ];

    await updateDoc(doc(db, "rooms", checkInModalRoom.id), {
      status: "occupied",
      guestName: guestForm.name,
      guestPhone: guestForm.phone,
      checkIn: new Date().toISOString().split("T")[0],
      checkOut: new Date(Date.now() + nights * 86400000).toISOString().split("T")[0],
      folio: initialFolio,
    });

    setCheckInModalRoom(null);
    setGuestForm({ name: "", phone: "", nights: 1 });
  };

  // Navigates to Front Desk and triggers settlement modal
  const handleInitiateSettle = (room) => {
    setSelectedRoomId(room.id);
    setActiveTab("frontdesk");
    setSettleModalRoom(room);
  };

  // Finalizes settlement, updates room status to cleaning, resets folio
  const handleConfirmSettleAndRelease = async () => {
    if (!settleModalRoom) return;

    await updateDoc(doc(db, "rooms", settleModalRoom.id), {
      status: "cleaning",
      guestName: "",
      guestPhone: "",
      checkIn: "",
      checkOut: "",
      folio: [],
    });

    setSettleModalRoom(null);
  };

  const handleAddFolioItem = async (e) => {
    e.preventDefault();
    if (!newItemDesc || !newItemPrice || !currentRoom) return;

    const unitPrice = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQty, 10) || 1;
    const newItem = {
      id: Date.now().toString(),
      description: newItemDesc,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };

    const updatedFolio = [...(currentRoom.folio || []), newItem];
    await updateDoc(doc(db, "rooms", currentRoom.id), { folio: updatedFolio });

    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const handleQuickAddMinibar = async (item) => {
    if (!currentRoom) return;

    const newItem = {
      id: Date.now().toString(),
      description: item.name,
      quantity: 1,
      unitPrice: item.price,
      total: item.price,
    };

    const updatedFolio = [...(currentRoom.folio || []), newItem];
    await updateDoc(doc(db, "rooms", currentRoom.id), { folio: updatedFolio });

    if (item.stock > 0) {
      await updateDoc(doc(db, "inventory", item.id), { stock: item.stock - 1 });
    }
  };

  const handleRemoveFolioItem = async (itemId) => {
    if (!currentRoom) return;
    const updatedFolio = currentRoom.folio.filter((item) => item.id !== itemId);
    await updateDoc(doc(db, "rooms", currentRoom.id), { folio: updatedFolio });
  };

  const handlePrint = (format) => {
    setPrintFormat(format);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper calculation for room totals
  const calculateTotal = (room) => room?.folio?.reduce((acc, item) => acc + item.total, 0) || 0;
  const printTargetRoom = settleModalRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#091D26] font-semibold text-sm">Connecting to Hotel POS Real-Time Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F5] text-[#091D26]">
      {/* DESKTOP SIDEBAR */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-[#091D26] border-r border-[#0F2D3C] text-white">
        <div className="p-6 border-b border-[#0F2D3C] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-white font-bold shadow-md shadow-[#14B8A6]/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">Thalassa</h1>
            <p className="text-[11px] text-[#2DD4BF] font-medium">Hotel OS & POS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: "frontdesk", label: "Front Desk & Status", icon: Bed },
            { id: "billing", label: "Active Bills & Folios", icon: Receipt },
            { id: "room-admin", label: "Room Management", icon: SlidersHorizontal },
            { id: "inventory", label: "Stock & Minibar", icon: Boxes },
            { id: "staff", label: "Staff & Access", icon: Users },
            { id: "settings", label: "Hotel Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? "bg-[#0D9488] text-white shadow-sm" : "text-slate-300 hover:bg-[#0F2D3C] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#0F2D3C] bg-[#06151E]/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connected Project</p>
          <p className="text-xs text-[#2DD4BF] font-mono truncate mt-0.5">hotel-pos-app</p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="no-print md:hidden flex items-center justify-between p-4 bg-[#091D26] text-white border-b border-[#0F2D3C]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2DD4BF]" />
            <span className="font-bold text-sm">Thalassa POS</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded text-slate-300">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden bg-[#091D26] border-b border-[#0F2D3C] p-4 space-y-2 z-50 text-white">
            {[
              { id: "frontdesk", label: "Front Desk" },
              { id: "billing", label: "Active Bills & Folios" },
              { id: "room-admin", label: "Room Management" },
              { id: "inventory", label: "Stock & Minibar" },
              { id: "staff", label: "Staff & Access" },
              { id: "settings", label: "Hotel Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded text-sm ${activeTab === item.id ? "bg-[#0D9488]" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <main className="no-print flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: FRONT DESK */}
          {activeTab === "frontdesk" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Front Desk Operations</h2>
                  <p className="text-sm text-slate-500">Live guest room status, check-ins, and checkout settlements</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white border border-[#E6DFD3] px-3 py-1.5 rounded-lg shadow-sm">
                    Total: <b>{rooms.length}</b>
                  </span>
                  <span className="bg-[#F0FDF4] border border-[#CCFBF1] text-[#0F766E] px-3 py-1.5 rounded-lg">
                    Occupied: <b>{rooms.filter((r) => r.status === "occupied").length}</b>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rooms.map((room) => {
                  const billTotal = calculateTotal(room);
                  return (
                    <div
                      key={room.id}
                      className="bg-white border border-[#E6DFD3] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl font-black text-[#091D26]">#{room.number}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              room.status === "available"
                                ? "bg-[#CCFBF1] text-[#0F766E]"
                                : room.status === "occupied"
                                ? "bg-[#0F2D3C] text-white"
                                : room.status === "cleaning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-[#FFE4E6] text-[#F43F5E]"
                            }`}
                          >
                            {room.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#0F766E] uppercase">{room.type}</p>
                        <p className="text-xs text-slate-500 mb-4">{settings.currency}{room.rate} / night</p>

                        {room.status === "occupied" && (
                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[#091D26]">{room.guestName}</span>
                              <span className="font-black text-[#0D9488]">{settings.currency}{billTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-slate-500">{room.guestPhone}</p>
                            <p className="text-[11px] text-slate-400">Out: {room.checkOut}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#F3EFE6] flex gap-2">
                        {room.status === "available" && (
                          <button
                            onClick={() => setCheckInModalRoom(room)}
                            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2 rounded-lg text-xs font-medium"
                          >
                            Check In Guest
                          </button>
                        )}
                        {room.status === "occupied" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRoomId(room.id);
                                setActiveTab("billing");
                              }}
                              className="flex-1 bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26] py-2 rounded-lg text-xs font-medium"
                            >
                              Folio
                            </button>
                            <button
                              onClick={() => handleInitiateSettle(room)}
                              className="flex-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white py-2 rounded-lg text-xs font-bold"
                            >
                              Settle
                            </button>
                          </>
                        )}
                        {room.status === "cleaning" && (
                          <button
                            onClick={() => updateRoomStatus(room.id, "available")}
                            className="w-full bg-[#CCFBF1]/40 hover:bg-[#CCFBF1] text-[#0F766E] border border-[#2DD4BF] py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
                          </button>
                        )}
                        {room.status === "maintenance" && (
                          <button
                            onClick={() => updateRoomStatus(room.id, "available")}
                            className="w-full bg-[#E6DFD3] hover:bg-[#D3C8B7] text-[#091D26] py-2 rounded-lg text-xs font-medium"
                          >
                            Clear Maintenance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SEPARATED ACTIVE BILLS BY ROOM */}
          {activeTab === "billing" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26]">Active Bills & Room Folios</h2>
                  <p className="text-sm text-slate-500">Each occupied room holds an active bill. Settle directly or inspect line items.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#E6DFD3]">
                    Active Invoices: <b>{rooms.filter((r) => r.status === "occupied").length}</b>
                  </span>
                </div>
              </div>

              {/* ACTIVE BILLS BY ROOM CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms
                  .filter((r) => r.status === "occupied")
                  .map((room) => {
                    const billTotal = calculateTotal(room);
                    const isSelected = selectedRoomId === room.id;

                    return (
                      <div
                        key={room.id}
                        className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                          isSelected ? "border-[#14B8A6] ring-2 ring-[#14B8A6]/20" : "border-[#E6DFD3] hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 pb-2 border-b border-[#F3EFE6]">
                            <div>
                              <span className="text-xs uppercase font-bold text-[#0F766E]">{room.type}</span>
                              <h3 className="text-xl font-black text-[#091D26]">Room #{room.number}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Folio</span>
                              <span className="text-xl font-black text-[#0D9488]">
                                {settings.currency}{billTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1 mb-4">
                            <p className="font-bold text-[#091D26]">{room.guestName}</p>
                            <p className="text-slate-500">{room.guestPhone}</p>
                            <p className="text-[11px] text-slate-400">Duration: {room.checkIn} → {room.checkOut}</p>
                          </div>

                          {/* Mini Line-item Breakdown */}
                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4">
                            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                              Line Items ({room.folio?.length || 0})
                            </span>
                            <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                              {room.folio?.map((item) => (
                                <div key={item.id} className="flex justify-between text-slate-600">
                                  <span className="truncate pr-2">{item.quantity}x {item.description}</span>
                                  <span className="font-semibold text-[#091D26] shrink-0">
                                    {settings.currency}{item.total.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {(!room.folio || room.folio.length === 0) && (
                                <p className="text-slate-400 italic">No charges posted yet</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Room Bill Actions */}
                        <div className="flex gap-2 pt-2 border-t border-[#F3EFE6]">
                          <button
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                              isSelected
                                ? "bg-[#0F2D3C] text-white"
                                : "bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26]"
                            }`}
                          >
                            {isSelected ? "Editing Charges" : "Manage Charges"}
                          </button>
                          <button
                            onClick={() => handleInitiateSettle(room)}
                            className="flex-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                          >
                            Settle & Checkout <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {rooms.filter((r) => r.status === "occupied").length === 0 && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] p-12 text-center">
                  <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-[#091D26]">No Active Bills</h3>
                  <p className="text-xs text-slate-500 mt-1">There are no occupied rooms with outstanding folios right now.</p>
                </div>
              )}

              {/* DETAILED CHARGE MANAGER FOR SELECTED ACTIVE ROOM */}
              {currentRoom && currentRoom.status === "occupied" && (
                <div className="mt-8 pt-8 border-t border-[#E6DFD3]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#091D26]">
                        Posting Charges to Room #{currentRoom.number} ({currentRoom.guestName})
                      </h3>
                      <p className="text-xs text-slate-500">Post minibar or custom services before settlement</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-[#E6DFD3] shadow-sm p-6">
                      <form onSubmit={handleAddFolioItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
                        <input
                          type="text"
                          placeholder="Item or service..."
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          className="sm:col-span-2 border border-[#D3C8B7] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          className="border border-[#D3C8B7] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(e.target.value)}
                            className="w-14 border border-[#D3C8B7] rounded-lg px-2 py-2 text-xs text-center focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="flex-1 bg-[#0F2D3C] text-white rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#091D26]"
                          >
                            <Plus className="w-3.5 h-3.5" /> Post
                          </button>
                        </div>
                      </form>

                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E6DFD3] text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="py-2.5">Item</th>
                            <th className="py-2.5 text-center">Qty</th>
                            <th className="py-2.5 text-right">Rate</th>
                            <th className="py-2.5 text-right">Total</th>
                            <th className="py-2.5 text-center">Del</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3EFE6]">
                          {currentRoom.folio?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 font-medium text-[#091D26]">{item.description}</td>
                              <td className="py-3 text-center">{item.quantity}</td>
                              <td className="py-3 text-right">{settings.currency}{item.unitPrice.toFixed(2)}</td>
                              <td className="py-3 text-right font-semibold">{settings.currency}{item.total.toFixed(2)}</td>
                              <td className="py-3 text-center">
                                <button onClick={() => handleRemoveFolioItem(item.id)} className="text-[#F43F5E] hover:text-[#E11D48]">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Minibar */}
                    <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm p-6 space-y-3">
                      <h4 className="font-bold text-sm text-[#091D26] uppercase">Quick Dispatch Minibar</h4>
                      <div className="space-y-2">
                        {inventory
                          .filter((i) => i.price > 0)
                          .map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleQuickAddMinibar(item)}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E6DFD3] hover:border-[#14B8A6] bg-[#FAF9F5] text-xs transition-colors"
                            >
                              <span className="font-medium text-[#091D26] truncate">{item.name}</span>
                              <span className="font-bold text-[#0F766E]">{settings.currency}{item.price.toFixed(2)}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOM MANAGEMENT */}
          {activeTab === "room-admin" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Room Inventory & Configuration</h2>
                  <p className="text-sm text-slate-500">Add, re-price, change status, and decommission rooms</p>
                </div>
                <button
                  onClick={() => setShowAddRoomModal(true)}
                  className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New Room
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">Total Rooms</p>
                  <p className="text-2xl font-black text-[#091D26] mt-1">{rooms.length}</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#0F766E]">Available</p>
                  <p className="text-2xl font-black text-[#0F766E] mt-1">
                    {rooms.filter((r) => r.status === "available").length}
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-amber-700">Cleaning</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {rooms.filter((r) => r.status === "cleaning").length}
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#F43F5E]">Maintenance</p>
                  <p className="text-2xl font-black text-[#F43F5E] mt-1">
                    {rooms.filter((r) => r.status === "maintenance").length}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Room #</th>
                      <th className="p-3.5">Room Type</th>
                      <th className="p-3.5">Rate / Night</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5 text-center">Change Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="p-3.5 font-black text-base text-[#091D26]">#{room.number}</td>
                        <td className="p-3.5 font-medium text-slate-700">{room.type}</td>
                        <td className="p-3.5">
                          {editingRoomId === room.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                className="w-20 border border-[#14B8A6] rounded px-2 py-1 text-xs focus:outline-none"
                                value={editRoomRate}
                                onChange={(e) => setEditRoomRate(e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRoomRate(room.id)}
                                className="p-1 bg-[#14B8A6] text-white rounded hover:bg-[#0D9488]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingRoomId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{settings.currency}{room.rate}</span>
                              <button
                                onClick={() => {
                                  setEditingRoomId(room.id);
                                  setEditRoomRate(room.rate);
                                }}
                                className="text-slate-400 hover:text-[#0D9488]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                              room.status === "available"
                                ? "bg-[#CCFBF1] text-[#0F766E]"
                                : room.status === "occupied"
                                ? "bg-[#0F2D3C] text-white"
                                : room.status === "cleaning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-[#FFE4E6] text-[#F43F5E]"
                            }`}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex rounded-lg border border-[#E6DFD3] p-0.5 bg-[#FAF9F5] gap-1">
                            <button
                              onClick={() => updateRoomStatus(room.id, "available")}
                              className={`px-2 py-1 rounded text-[10px] font-semibold ${
                                room.status === "available" ? "bg-[#14B8A6] text-white" : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Ready
                            </button>
                            <button
                              onClick={() => updateRoomStatus(room.id, "cleaning")}
                              className={`px-2 py-1 rounded text-[10px] font-semibold ${
                                room.status === "cleaning" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Clean
                            </button>
                            <button
                              onClick={() => updateRoomStatus(room.id, "maintenance")}
                              className={`px-2 py-1 rounded text-[10px] font-semibold ${
                                room.status === "maintenance" ? "bg-[#F43F5E] text-white" : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              Out of Order
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.number)}
                            disabled={room.status === "occupied"}
                            className={`p-1.5 rounded transition-colors ${
                              room.status === "occupied"
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-[#F43F5E] hover:bg-[#FFE4E6]"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#091D26]">Inventory & Amenities</h2>
                <p className="text-sm text-slate-500">Live storage stock synchronized across devices</p>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Price</th>
                      <th className="p-3.5 text-center">Stock</th>
                      <th className="p-3.5 text-center">Quick Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3.5 font-bold text-[#091D26]">{item.name}</td>
                        <td className="p-3.5 uppercase">{item.category}</td>
                        <td className="p-3.5 text-right font-medium">{settings.currency}{item.price.toFixed(2)}</td>
                        <td className="p-3.5 text-center font-bold text-[#091D26]">{item.stock}</td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => updateDoc(doc(db, "inventory", item.id), { stock: Math.max(0, item.stock - 1) })}
                              className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6]"
                            >
                              -
                            </button>
                            <button
                              onClick={() => updateDoc(doc(db, "inventory", item.id), { stock: item.stock + 1 })}
                              className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6]"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF */}
          {activeTab === "staff" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#091D26]">Staff & Shifts</h2>
                <p className="text-sm text-slate-500">Active hotel staff & PIN identification</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {staff.map((member) => (
                  <div key={member.id} className="bg-white border border-[#E6DFD3] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-[#0F2D3C] text-[#2DD4BF] font-bold flex items-center justify-center text-sm">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="bg-[#CCFBF1] text-[#0F766E] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        {member.role}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#091D26] mt-3">{member.name}</h3>
                    <p className="text-xs text-slate-400">PIN: ****{member.pin.slice(-2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto bg-white border border-[#E6DFD3] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#091D26]">Hotel Details & Print Configuration</h2>
                <p className="text-sm text-slate-500">Legal details printed directly on receipts and invoices</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Hotel / Resort Name</label>
                  <input
                    type="text"
                    value={settings.hotelName}
                    onChange={(e) => handleSaveSettings({ ...settings, hotelName: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tax / VAT ID</label>
                  <input
                    type="text"
                    value={settings.taxNumber}
                    onChange={(e) => handleSaveSettings({ ...settings, taxNumber: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleSaveSettings({ ...settings, phone: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => handleSaveSettings({ ...settings, currency: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Property Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleSaveSettings({ ...settings, address: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Thermal Receipt Footer Note</label>
                  <input
                    type="text"
                    value={settings.footerNote}
                    onChange={(e) => handleSaveSettings({ ...settings, footerNote: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CHECK-IN */}
      {checkInModalRoom && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Check In - Room #{checkInModalRoom.number}</h3>
              <button onClick={() => setCheckInModalRoom(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Sterling"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nights</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={guestForm.nights}
                  onChange={(e) => setGuestForm({ ...guestForm, nights: parseInt(e.target.value, 10) || 1 })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg">
                Confirm & Open Folio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SETTLEMENT & FINAL INVOICE PRINT (Opens in Front Desk) */}
      {settleModalRoom && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Settlement & Checkout</span>
                <h3 className="font-black text-xl text-[#091D26]">Room #{settleModalRoom.number}</h3>
                <p className="text-xs text-slate-500">Guest: {settleModalRoom.guestName || "Walk-In"}</p>
              </div>
              <button onClick={() => setSettleModalRoom(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Table */}
            <div className="max-h-48 overflow-y-auto border border-[#E6DFD3] rounded-lg p-3 bg-[#FAF9F5] mb-4 text-xs space-y-1">
              {settleModalRoom.folio?.map((item) => (
                <div key={item.id} className="flex justify-between py-1 border-b border-slate-100 last:border-none">
                  <span className="text-slate-700">{item.quantity}x {item.description}</span>
                  <span className="font-semibold text-[#091D26]">{settings.currency}{item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-black text-sm text-[#091D26]">
                <span>Total Settling Amount:</span>
                <span className="text-[#0D9488] text-base">
                  {settings.currency}{calculateTotal(settleModalRoom).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Payment Method Settled With:</label>
              <div className="grid grid-cols-3 gap-2">
                {["Credit Card", "Cash", "Bank Transfer"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSettlementMethod(m)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      settlementMethod === m
                        ? "bg-[#0F2D3C] text-white border-[#0F2D3C]"
                        : "bg-white text-slate-700 border-[#E6DFD3] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Final Invoice Options */}
            <div className="bg-[#CCFBF1]/30 p-3 rounded-xl border border-[#2DD4BF]/50 mb-6">
              <span className="text-[11px] font-bold uppercase text-[#0F766E] block mb-2">
                Print Final Invoice for Guest
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint("thermal")}
                  className="flex items-center justify-center gap-1.5 bg-[#0F2D3C] hover:bg-[#091D26] text-white py-2 rounded-lg text-xs font-bold shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#2DD4BF]" /> 80mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint("a4")}
                  className="flex items-center justify-center gap-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2 rounded-lg text-xs font-bold shadow-sm"
                >
                  <Receipt className="w-3.5 h-3.5" /> Official A4
                </button>
              </div>
            </div>

            {/* Final Settle Confirmation */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettleModalRoom(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSettleAndRelease}
                className="flex-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white py-3 px-6 rounded-lg text-xs font-bold shadow-md"
              >
                Confirm Payment & Release Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW ROOM */}
      {showAddRoomModal && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add New Hotel Room</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 301, 302, PH-A"
                  value={newRoomForm.number}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, number: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Room Category / Type</label>
                <select
                  value={newRoomForm.type}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, type: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="Ocean Breeze King">Ocean Breeze King</option>
                  <option value="Lagoon View Double">Lagoon View Double</option>
                  <option value="Coral Penthouse Suite">Coral Penthouse Suite</option>
                  <option value="Family Beachside Villa">Family Beachside Villa</option>
                  <option value="Standard Coastal Queen">Standard Coastal Queen</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Base Nightly Rate ({settings.currency})</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newRoomForm.rate}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, rate: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Status</label>
                <select
                  value={newRoomForm.status}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, status: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="available">Available</option>
                  <option value="cleaning">Needs Cleaning</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                Register Room to Cloud
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINT ENGINE CONTAINER */}
      <div className="printable-area hidden">
        {printFormat === "thermal" ? (
          <div className="thermal-mode">
            <div style={{ textAlign: "center", marginBottom: "8px", borderBottom: "1px dashed #000", paddingBottom: "8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "14px", textTransform: "uppercase" }}>{settings.hotelName}</div>
              <div>{settings.address}</div>
              <div>Tel: {settings.phone}</div>
              <div>Tax ID: {settings.taxNumber}</div>
            </div>

            <div style={{ borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
              <div>ROOM: #{printTargetRoom?.number}</div>
              <div>GUEST: {printTargetRoom?.guestName || "Walk-In"}</div>
              <div>OUT: {printTargetRoom?.checkOut || "N/A"}</div>
              <div>METHOD: {settlementMethod}</div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
            </div>

            <table style={{ width: "100%", textAlign: "left", marginBottom: "8px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th>ITEM</th>
                  <th style={{ textAlign: "center" }}>QTY</th>
                  <th style={{ textAlign: "right" }}>AMT</th>
                </tr>
              </thead>
              <tbody>
                {printTargetRoom?.folio?.map((item) => (
                  <tr key={item.id}>
                    <td style={{ maxWidth: "38mm", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.description}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{settings.currency}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", fontWeight: "bold" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span>TOTAL SETTLED:</span>
                <span>{settings.currency}{printTargetTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "12px", fontSize: "10px" }}>
              <div>{settings.footerNote}</div>
            </div>
          </div>
        ) : (
          <div className="a4-mode">
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0D9488", paddingBottom: "18px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0F2D3C", margin: 0 }}>{settings.hotelName}</h1>
                <p style={{ margin: "4px 0", color: "#64748B" }}>{settings.address}</p>
                <p style={{ margin: 0, color: "#64748B" }}>Tax Reg: {settings.taxNumber} | Tel: {settings.phone}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ background: "#CCFBF1", color: "#0F766E", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px" }}>
                  FINAL TAX FOLIO / RECEIPT
                </span>
                <p style={{ fontWeight: "bold", margin: "8px 0 0 0" }}>Room #{printTargetRoom?.number}</p>
                <p style={{ margin: 0, color: "#64748B" }}>Date: {new Date().toLocaleDateString()}</p>
                <p style={{ margin: 0, color: "#64748B" }}>Settled By: {settlementMethod}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", margin: "24px 0", padding: "12px", background: "#FAF9F5", borderRadius: "8px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", textTransform: "uppercase" }}>Guest Information</p>
                <p style={{ margin: "2px 0 0 0", fontWeight: "bold", fontSize: "14px" }}>{printTargetRoom?.guestName || "Unregistered"}</p>
                <p style={{ margin: 0, color: "#64748B" }}>{printTargetRoom?.guestPhone}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", textTransform: "uppercase" }}>Stay Duration</p>
                <p style={{ margin: "2px 0 0 0", fontWeight: "bold" }}>{printTargetRoom?.checkIn} to {printTargetRoom?.checkOut}</p>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #0F2D3C", textAlign: "left", color: "#0F2D3C" }}>
                  <th style={{ padding: "8px 0" }}>Description</th>
                  <th style={{ padding: "8px 0", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "8px 0", textAlign: "right" }}>Unit Rate</th>
                  <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printTargetRoom?.folio?.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "10px 0" }}>{item.description}</td>
                    <td style={{ padding: "10px 0", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "10px 0", textAlign: "right" }}>{settings.currency}{item.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold" }}>{settings.currency}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: "2px solid #0F2D3C", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>Total Settled ({settlementMethod}):</span>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0D9488" }}>
                {settings.currency}{printTargetTotal.toFixed(2)}
              </span>
            </div>

            <div style={{ marginTop: "40px", textAlign: "center", color: "#94A3B8", fontSize: "11px" }}>
              <p>{settings.footerNote}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}