import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Utensils,
  Flame,
  Wine,
  CreditCard,
  LayoutGrid,
  Boxes,
  BookOpen,
  Clock,
  BarChart3,
  BookPlus,
  Ban,
  Users,
  Settings,
  LogOut,
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  DollarSign,
  Coffee,
  Check,
  Send,
  AlertTriangle,
  Receipt,
  BedDouble,
  RefreshCw,
  ShoppingBag,
  Cloud,
  CloudOff,
  Radio,
  Sparkles,
  Wifi,
  ShieldCheck,
  Building
} from 'lucide-react';

const userProvidedFirebaseConfig = {
  apiKey: "AIzaSyCU84gJirHE9c1s7Bqh90pzyOtjdaR5uus",
  authDomain: "hotel-pos-app.firebaseapp.com",
  databaseURL: "https://hotel-pos-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-pos-app",
  storageBucket: "hotel-pos-app.firebasestorage.app",
  messagingSenderId: "44475111004",
  appId: "1:44475111004:web:58cc62ea1e050e2f767899",
  measurementId: "G-KWG9FMP5Q7"
};

// Check environment config override or fall back to user provided config
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : userProvidedFirebaseConfig;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hotel-pos-app';

const INITIAL_CATEGORIES = [
  'ALL',
  'RICE DISHES',
  'ROTTI',
  'NOODLES',
  'MONGOLIAN RICE',
  'PASTA',
  'LION',
  'SOFT DR.',
  'COCKTAILS',
  'ROOM SERVICE'
];

const INITIAL_MENU_ITEMS = [
  { id: 'RC-01', name: 'Sri Lankan Rice and Curry (Mixed Fish)', category: 'RICE DISHES', tag: 'KITCHEN', price: 1850, code: 'RICE SL-1', stock: '99+ sup', isAvail: true },
  { id: 'RC-02', name: 'Vegetable Rice', category: 'RICE DISHES', tag: 'KITCHEN', price: 1350, code: 'RICE VEG', stock: '99+ sup', isAvail: true },
  { id: 'RC-03', name: 'Chicken Fried Rice', category: 'RICE DISHES', tag: 'KITCHEN', price: 1750, code: 'RICE CHK', stock: '7 left', isAvail: true },
  { id: 'RC-04', name: 'Seafood Fried Rice', category: 'RICE DISHES', tag: 'KITCHEN', price: 2150, code: 'RICE SEA', stock: '99+ sup', isAvail: true },
  { id: 'RC-05', name: 'Mix Fried Rice (Chef Special)', category: 'RICE DISHES', tag: 'KITCHEN', price: 2350, code: 'RICE MIX', stock: '99+ sup', isAvail: true },
  { id: 'KT-01', name: 'Chicken Kottu Rotti', category: 'ROTTI', tag: 'KITCHEN', price: 1750, code: 'KOTTI CHK', stock: '99+ sup', isAvail: true },
  { id: 'KT-02', name: 'Seafood Kottu Rotti', category: 'ROTTI', tag: 'KITCHEN', price: 2100, code: 'KOTTI SEA', stock: '99+ sup', isAvail: true },
  { id: 'KT-03', name: 'Mix Cheese Kottu', category: 'ROTTI', tag: 'KITCHEN', price: 2450, code: 'KOTTI CHZ', stock: '99+ sup', isAvail: true },
  { id: 'ND-01', name: 'Vegetable Wok Noodles', category: 'NOODLES', tag: 'KITCHEN', price: 1350, code: 'NDL VEG', stock: '99+ sup', isAvail: true },
  { id: 'ND-02', name: 'Egg Noodles with Crispy Garlic', category: 'NOODLES', tag: 'KITCHEN', price: 1450, code: 'NDL EGG', stock: '99+ sup', isAvail: true },
  { id: 'ND-03', name: 'Seafood Singapore Noodles', category: 'NOODLES', tag: 'KITCHEN', price: 2200, code: 'NDL SEA', stock: '99+ sup', isAvail: true },
  { id: 'MG-01', name: 'Vegetable Mongolian Rice', category: 'MONGOLIAN RICE', tag: 'KITCHEN', price: 1550, code: 'MNG VEG', stock: '99+ sup', isAvail: true },
  { id: 'MG-02', name: 'Sausage with Omelet Mongolian', category: 'MONGOLIAN RICE', tag: 'KITCHEN', price: 1750, code: 'MNG SSG', stock: '99+ sup', isAvail: true },
  { id: 'MG-03', name: 'Chicken Mongolian Rice', category: 'MONGOLIAN RICE', tag: 'KITCHEN', price: 1850, code: 'MNG CHK', stock: '99+ sup', isAvail: true },
  { id: 'MG-04', name: 'Seafood Mongolian Rice', category: 'MONGOLIAN RICE', tag: 'KITCHEN', price: 2350, code: 'MNG SEA', stock: '99+ sup', isAvail: true },
  { id: 'PS-01', name: 'Creamy Chicken Penne Pasta', category: 'PASTA', tag: 'KITCHEN', price: 2100, code: 'PST CHK', stock: '99+ sup', isAvail: true },
  { id: 'PS-02', name: 'Spaghetti Carbonara con Pancetta', category: 'PASTA', tag: 'KITCHEN', price: 2450, code: 'PST CRB', stock: '99+ sup', isAvail: true },
  { id: 'PS-03', name: 'Seafood Marinara Pasta', category: 'PASTA', tag: 'KITCHEN', price: 2750, code: 'PST MAR', stock: '99+ sup', isAvail: true },
  { id: 'BV-01', name: 'Fresh King Coconut (Thambili)', category: 'SOFT DR.', tag: 'BAR', price: 650, code: 'BAR COCO', stock: '99+ sup', isAvail: true },
  { id: 'BV-02', name: 'Mango Sunshine Lassi', category: 'SOFT DR.', tag: 'BAR', price: 950, code: 'BAR MGO', stock: '99+ sup', isAvail: true },
  { id: 'BV-03', name: 'Passion Fruit Basil Cooler', category: 'SOFT DR.', tag: 'BAR', price: 950, code: 'BAR PSN', stock: '99+ sup', isAvail: true },
  { id: 'BV-04', name: 'Mineral Water (Large 1500ml)', category: 'SOFT DR.', tag: 'BAR', price: 450, code: 'BAR H2O', stock: '99+ sup', isAvail: true },
  { id: 'CK-01', name: 'Arrack Sour (Ceylon Cinnamon)', category: 'COCKTAILS', tag: 'BAR', price: 1850, code: 'CKT ARK', stock: '99+ sup', isAvail: true },
  { id: 'CK-02', name: 'Midigama Sunset Passion Mojito', category: 'COCKTAILS', tag: 'BAR', price: 1950, code: 'CKT MOJ', stock: '99+ sup', isAvail: true },
  { id: 'CK-03', name: 'Lion Lager Draught Pint', category: 'LION', tag: 'BAR', price: 900, code: 'LION DRAFT', stock: '99+ sup', isAvail: true },
  { id: 'RM-01', name: 'Midnight Wagyu Club Sandwich', category: 'ROOM SERVICE', tag: 'KITCHEN', price: 2850, code: 'RMS WAG', stock: '12 left', isAvail: true },
  { id: 'RM-02', name: 'Tropical Fruit Plate & Honey', category: 'ROOM SERVICE', tag: 'KITCHEN', price: 1450, code: 'RMS FRT', stock: '99+ sup', isAvail: true }
];

const INITIAL_TABLES = [
  { id: 'T-01', label: 'T1 Outdoor Wave Deck - 2 Seats', capacity: 2, status: 'Occupied', guest: 'Jack & Sally (Rm 104)', bill: 4850 },
  { id: 'T-02', label: 'T2 Ocean Beachfront - 4 Seats', capacity: 4, status: 'Occupied', guest: 'Surfers Group', bill: 9600 },
  { id: 'T-03', label: 'T3 Beach Cabana Lounge - 6 Seats', capacity: 6, status: 'Available', guest: '', bill: 0 },
  { id: 'T-04', label: 'T4 Garden Gazebo - 4 Seats', capacity: 4, status: 'Available', guest: '', bill: 0 },
  { id: 'T-05', label: 'T5 Sunset Bar Counter - 2 Seats', capacity: 2, status: 'Occupied', guest: 'Julian M.', bill: 3800 },
  { id: 'T-06', label: 'T6 Poolside Pavilion - 8 Seats', capacity: 8, status: 'Reserved', guest: 'VIP Reservation 8pm', bill: 0 },
  { id: 'T-07', label: 'T7 Ocean Terrace High Table - 2 Seats', capacity: 2, status: 'Available', guest: '', bill: 0 },
  { id: 'T-08', label: 'T8 Private Garden Dining - 4 Seats', capacity: 4, status: 'Available', guest: '', bill: 0 }
];

const INITIAL_ROOMS = [
  { roomNumber: '101', type: 'Deluxe Garden Suite', guestName: 'Eleanor Vance', status: 'Occupied', balance: 3450 },
  { roomNumber: '104', type: 'Beachfront Surf Villa', guestName: 'Jack Higgins', status: 'Occupied', balance: 7200 },
  { roomNumber: '202', type: 'Ocean Panorama Suite', guestName: 'Liam & Olivia Ross', status: 'Occupied', balance: 14800 },
  { roomNumber: '204', type: 'Executive Sunset Penthouse', guestName: 'Marcus Sterling', status: 'Occupied', balance: 22100 },
  { roomNumber: '301', type: 'Royal Lagoon Bungalow', guestName: 'Claire Redfield', status: 'Occupied', balance: 1200 },
  { roomNumber: '305', type: 'Presidential Cliff Villa', guestName: 'Julian Dupont', status: 'Occupied', balance: 34200 }
];

const INITIAL_STAFF = [
  { id: 'EMP-01', name: 'Chaminda Silva', role: 'Head Cashier', pin: '1234', onShift: true, station: 'Main Cashier Terminal' },
  { id: 'EMP-02', name: 'Nalinda Perera', role: 'Executive Chef', pin: '5678', onShift: true, station: 'Kitchen Display 1' },
  { id: 'EMP-03', name: 'Kasun Bandara', role: 'Head Mixologist', pin: '9900', onShift: true, station: 'Midigama Beach Bar' },
  { id: 'EMP-04', name: 'Amara Jayawardena', role: 'F&B Shift Supervisor', pin: '4321', onShift: true, station: 'Floor Operations' },
  { id: 'EMP-05', name: 'Dinesh Fernando', role: 'Front Office Auditor', pin: '7788', onShift: false, station: 'PMS & Guest Folio' }
];

const INITIAL_KDS_ORDERS = [
  {
    ticketId: 'KOT-1082',
    table: 'T1 Outdoor Wave Deck',
    time: '19:42',
    type: 'Dine-In',
    status: 'In-Progress',
    items: [
      { name: 'Sri Lankan Rice and Curry (Mixed Fish)', qty: 2, note: 'Extra spicy coconut sambal' },
      { name: 'Mix Cheese Kottu', qty: 1, note: 'Green chili on side' }
    ]
  },
  {
    ticketId: 'KOT-1083',
    table: 'T2 Ocean Beachfront',
    time: '19:48',
    type: 'Dine-In',
    status: 'Pending',
    items: [
      { name: 'Seafood Singapore Noodles', qty: 2, note: 'No shell garnishes' },
      { name: 'Creamy Chicken Penne Pasta', qty: 1, note: 'Well seasoned' }
    ]
  },
  {
    ticketId: 'KOT-1084',
    table: 'Room 204 - Marcus',
    time: '19:51',
    type: 'Room Delivery',
    status: 'Ready',
    items: [
      { name: 'Midnight Wagyu Club Sandwich', qty: 2, note: 'Truffle fries warm' }
    ]
  }
];

const INITIAL_PAST_ORDERS = [
  {
    id: 'TXN-8801',
    time: '2026-09-28 18:20',
    type: 'Dine-In',
    target: 'T5 Sunset Bar Counter',
    total: 3800,
    subtotal: 3454.54,
    serviceCharge: 345.46,
    taxAmount: 0,
    payment: 'Credit Card',
    staff: 'Chaminda Silva (SA)',
    itemsCount: 3
  },
  {
    id: 'TXN-8802',
    time: '2026-09-28 18:45',
    type: 'Room Charge',
    target: 'Room 204 (Marcus Sterling)',
    total: 9400,
    subtotal: 8545.45,
    serviceCharge: 854.55,
    taxAmount: 0,
    payment: 'Room Charge',
    staff: 'Chaminda Silva (SA)',
    itemsCount: 5
  },
  {
    id: 'TXN-8803',
    time: '2026-09-28 19:10',
    type: 'Dine-In',
    target: 'T1 Outdoor Wave Deck',
    total: 6150,
    subtotal: 5590.90,
    serviceCharge: 559.10,
    taxAmount: 0,
    payment: 'Cash',
    staff: 'Chaminda Silva (SA)',
    itemsCount: 4
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connected' | 'connecting' | 'local' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // POS State
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'room_charge' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState('T1 Outdoor Wave Deck - 2 Seats (T-01)');
  const [selectedRoom, setSelectedRoom] = useState('101');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Entities loaded either from Firestore or locally seeded
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [kdsOrders, setKdsOrders] = useState(INITIAL_KDS_ORDERS);
  const [pastOrders, setPastOrders] = useState(INITIAL_PAST_ORDERS);
  const [staffList, setStaffList] = useState(INITIAL_STAFF);

  // System Settings
  const [settings, setSettings] = useState({
    businessName: 'Linoli Cove Midigama',
    subTitle: 'RESTAURANT & BAR',
    currency: 'Rs.',
    serviceChargePercent: 10,
    taxPercent: 0,
    receiptFooter: 'Thank you for visiting Linoli Cove. Ride the waves & see you soon!',
    kotPrinter: '192.168.1.200 (Kitchen Thermal)',
    barPrinter: '192.168.1.201 (Beach Bar Thermal)'
  });

  // Modal dialog states
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [lastFinishedOrder, setLastFinishedOrder] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState('card');
  const [tenderCashAmount, setTenderCashAmount] = useState('');

  // Form input states
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Cashier',
    pin: '1234',
    station: 'Main Cashier Terminal'
  });
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: 'RICE DISHES',
    price: 1850,
    code: 'NEW-DSH',
    tag: 'KITCHEN'
  });

  useEffect(() => {
    let unsubscribeAuth = () => {};

    const authenticate = async () => {
      try {
        setSyncStatus('connecting');
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Firebase Auth anonymous login note: Operating in resilient local/offline mode.', err);
        setSyncStatus('local');
      }
    };

    authenticate();
    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setFirebaseUser(null);
        setSyncStatus('local');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    let unsubOrders = () => {};
    let unsubKDS = () => {};

    try {
      // 1. Real-time Orders Listener (Scoped to public artifact collection path)
      const ordersCol = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
      unsubOrders = onSnapshot(
        ordersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPastOrders(remoteOrders);
          }
          setSyncStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString());
        },
        (error) => {
          console.info('Firestore orders live listener fallback active:', error.message);
          setSyncStatus('local');
        }
      );

      // 2. Real-time KDS Kitchen Tickets Listener
      const kdsCol = collection(db, 'artifacts', appId, 'public', 'data', 'kds_tickets');
      unsubKDS = onSnapshot(
        kdsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteKds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKdsOrders(remoteKds);
          }
        },
        (error) => {
          console.info('Firestore KDS live listener fallback active:', error.message);
        }
      );
    } catch (err) {
      console.warn('Realtime sync initialized in graceful offline mode.');
      setSyncStatus('local');
    }

    return () => {
      unsubOrders();
      unsubKDS();
    };
  }, [firebaseUser]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (cartSubtotal * discountPercent) / 100;
  }, [cartSubtotal, discountPercent]);

  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);

  const serviceCharge = useMemo(() => {
    return (discountedSubtotal * settings.serviceChargePercent) / 100;
  }, [discountedSubtotal, settings.serviceChargePercent]);

  const taxAmount = useMemo(() => {
    return (discountedSubtotal * settings.taxPercent) / 100;
  }, [discountedSubtotal, settings.taxPercent]);

  const grandTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    return discountedSubtotal + serviceCharge + taxAmount;
  }, [discountedSubtotal, serviceCharge, taxAmount, cart.length]);

  const filteredProducts = useMemo(() => {
    return menuItems.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQty = (itemId, delta) => {
    setCart(prev =>
      prev
        .map(p => {
          if (p.id === itemId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => prev.filter(p => p.id !== itemId));
  };

  const handleClearTicket = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;

    const newKot = {
      ticketId: `KOT-${Math.floor(1000 + Math.random() * 9000)}`,
      table:
        orderType === 'room_charge'
          ? `Room ${selectedRoom}`
          : orderType === 'takeaway'
          ? 'Takeaway Counter'
          : selectedTable.split(' (')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: orderType === 'room_charge' ? 'Room Delivery' : orderType === 'takeaway' ? 'Takeaway' : 'Dine-In',
      status: 'In-Progress',
      items: cart.map(i => ({ name: i.name, qty: i.quantity, note: i.notes || 'Standard' }))
    };

    // Update local state immediately for seamless responsiveness
    setKdsOrders(prev => [newKot, ...prev]);

    // Push to Firestore if online
    if (firebaseUser) {
      try {
        const kdsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'kds_tickets', newKot.ticketId);
        await setDoc(kdsDocRef, newKot);
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Realtime KDS push fallback handled locally:', err);
      }
    }
  };

  const handleExecutePayment = async () => {
    if (cart.length === 0) return;

    const targetLabel =
      orderType === 'room_charge'
        ? `Room ${selectedRoom} (${rooms.find(r => r.roomNumber === selectedRoom)?.guestName || 'Guest'})`
        : orderType === 'takeaway'
        ? 'Takeaway'
        : selectedTable.split(' (')[0];

    const orderRecord = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: orderType === 'room_charge' ? 'Room Charge' : orderType === 'takeaway' ? 'Takeaway' : 'Dine-In',
      target: targetLabel,
      total: grandTotal,
      subtotal: discountedSubtotal,
      serviceCharge: serviceCharge,
      taxAmount: taxAmount,
      payment: paymentChoice === 'room_folio' ? 'Room Charge' : paymentChoice === 'cash' ? 'Cash' : 'Credit Card',
      staff: 'Chaminda Silva (SA)',
      items: [...cart],
      itemsCount: cart.reduce((s, i) => s + i.quantity, 0)
    };

    // If charged to room, increase room folio balance
    if (paymentChoice === 'room_folio' || orderType === 'room_charge') {
      setRooms(prev =>
        prev.map(r => (r.roomNumber === selectedRoom ? { ...r, balance: r.balance + grandTotal } : r))
      );
    }

    // Local ledger update
    setPastOrders(prev => [orderRecord, ...prev]);
    setLastFinishedOrder(orderRecord);
    setIsSettleModalOpen(false);
    setIsReceiptModalOpen(true);
    setCart([]);
    setDiscountPercent(0);
    setTenderCashAmount('');

    // Persist to Firebase Firestore
    if (firebaseUser) {
      try {
        setSyncStatus('connecting');
        const orderDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderRecord.id);
        await setDoc(orderDocRef, orderRecord);
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Realtime transaction sync fell back gracefully:', err);
        setSyncStatus('local');
      }
    }
  };

  const handleBumpKdsStatus = async (ticketId) => {
    let updatedStatus = 'Completed';
    setKdsOrders(prev =>
      prev
        .map(t => {
          if (t.ticketId === ticketId) {
            const next = t.status === 'Pending' ? 'In-Progress' : t.status === 'In-Progress' ? 'Ready' : 'Completed';
            updatedStatus = next;
            return { ...t, status: next };
          }
          return t;
        })
        .filter(t => t.status !== 'Completed')
    );

    if (firebaseUser) {
      try {
        const kdsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'kds_tickets', ticketId);
        if (updatedStatus === 'Completed') {
          await deleteDoc(kdsDocRef);
        } else {
          await updateDoc(kdsDocRef, { status: updatedStatus });
        }
      } catch (e) {
        console.warn('KDS status bump synced in memory.');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Time', 'Order Type', 'Location / Guest', 'Items Count', 'Payment Method', 'Total (Rs.)'];
    const rows = pastOrders.map(o => [
      o.id,
      o.time,
      o.type,
      `"${o.target}"`,
      o.itemsCount,
      o.payment,
      o.total.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LinoliCove_SalesReport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen w-full bg-[#0D1117] font-sans text-slate-200 antialiased overflow-hidden select-none">
      
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="w-[230px] bg-[#11141E] border-r border-[#1C2132] flex flex-col justify-between shrink-0 z-20">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#1A1F30]">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#FF5B22] flex items-center justify-center font-black text-white text-base tracking-tighter shadow-md shadow-[#FF5B22]/30">
                LC
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[13px] text-white tracking-tight">Linoli Cove</span>
                <span className="font-bold text-[12px] text-white tracking-tight">Midigama</span>
                <span className="text-[8.5px] font-bold text-[#FF5B22] tracking-wider uppercase mt-0.5">
                  RESTAURANT & BAR
                </span>
              </div>
            </div>
            <button className="text-slate-500 hover:text-slate-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 text-[13px] font-medium overflow-y-auto max-h-[calc(100vh-170px)] no-scrollbar">
            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'pos'
                  ? 'bg-[#FF5B22] text-white font-semibold shadow-md shadow-[#FF5B22]/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>POS Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab('kds')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'kds'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Kitchen Display</span>
              {kdsOrders.length > 0 && (
                <span className="ml-auto bg-[#FF5B22] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {kdsOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bar')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'bar'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Wine className="w-4 h-4" />
              <span>Bar Display</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'billing'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Billing & Settlement</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'tables'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Table Management</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span className="flex-1 text-left">Stock & Inventory</span>
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'recipes'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Recipes & Portions</span>
            </button>

            <button
              onClick={() => setActiveTab('shifts')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'shifts'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Cashier Shifts</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales Reports</span>
            </button>

            {/* ADMINISTRATION Sub-Header */}
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                ADMINISTRATION
              </span>
            </div>

            <button
              onClick={() => setActiveTab('menu_admin')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'menu_admin'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <BookPlus className="w-4 h-4" />
              <span className="flex-1 text-left">Menu Management</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddMenuModalOpen(true);
                }}
                className="bg-[#FF5B22]/20 border border-[#FF5B22]/40 text-[#FF5B22] hover:bg-[#FF5B22] hover:text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
              >
                +Add
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'cancelled'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>Cancelled Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'staff'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Management</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#FF5B22] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181D2D]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        {/* User Profile Pill at Bottom */}
        <div className="p-3 border-t border-[#1C2132] bg-[#0E121B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-full bg-[#1F2536] border border-slate-700 flex items-center justify-center text-[11px] font-bold text-[#FF5B22]">
                SA
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-semibold text-slate-200">System Administrator</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Online
                </span>
              </div>
            </div>
            <button title="Logout" className="text-slate-500 hover:text-red-400 p-1 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEW */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0E121A] overflow-hidden">
        
        {/* TOP STATUS BAR WITH FIREBASE SYNC INDICATOR */}
        <header className="h-11 border-b border-[#1A1F30] bg-[#101420] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#FF5B22]" /> {settings.businessName}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Station: Main Cashier POS</span>
          </div>

          {/* Real-time Firebase Sync Status Pill */}
          <div className="flex items-center space-x-3 text-xs">
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                syncStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              {syncStatus === 'connected' ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Firebase Synced</span>
                </>
              ) : syncStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Syncing with Cloud...</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-blue-300" />
                  <span>Local Memory Mode</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Refreshed: {lastSyncTime}
            </span>
          </div>
        </header>

        {/* ======================================================== */}
        {/* VIEW 1: POS TERMINAL VIEW */}
        {/* ======================================================== */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Center Items Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-[#1B2030]">
              
              {/* Category Ribbon and Search Bar */}
              <div className="p-3 border-b border-[#1A1F2F] bg-[#121622] flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
                  {INITIAL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold tracking-wide whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#1E2538] text-white border border-[#FF5B22]/60 shadow-sm'
                          : 'bg-[#151A27] text-slate-400 hover:text-slate-200 hover:bg-[#1A2031] border border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-52 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search menu or item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151A27] border border-[#232A3E] rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
              </div>

              {/* Items Card Grid */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 content-start">
                {filteredProducts.map(product => {
                  const isKitchen = product.tag === 'KITCHEN';
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#141926] border border-[#1F263A] hover:border-[#FF5B22] rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:shadow-lg hover:shadow-[#FF5B22]/5 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                              isKitchen
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {product.tag}
                          </span>
                          <span className="font-mono font-black text-sm text-[#FF5B22]">
                            {settings.currency} {product.price.toFixed(2)}
                          </span>
                        </div>

                        <h4 className="font-bold text-[13px] text-slate-100 group-hover:text-[#FF5B22] transition-colors leading-snug">
                          {product.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          {product.code}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1C2337] flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> {product.stock}
                        </span>
                        <span className="text-slate-400 group-hover:text-white font-medium text-[10.5px]">
                          + Add
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-600">
                    <Utensils className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-30" />
                    <p className="text-xs">No items match your search.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT ORDER TICKET / CART PANEL */}
            <div className="w-[340px] bg-[#111520] flex flex-col justify-between shrink-0 border-l border-[#1B2031]">
              <div>
                <div className="p-3 border-b border-[#1A1F2F]">
                  <div className="grid grid-cols-3 gap-1 bg-[#161B29] p-1 rounded-lg">
                    <button
                      onClick={() => setOrderType('dine_in')}
                      className={`py-1.5 rounded-md text-[11.5px] font-bold transition-all ${
                        orderType === 'dine_in'
                          ? 'bg-[#FF5B22] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Dine-In
                    </button>
                    <button
                      onClick={() => setOrderType('room_charge')}
                      className={`py-1.5 rounded-md text-[11.5px] font-bold transition-all ${
                        orderType === 'room_charge'
                          ? 'bg-[#FF5B22] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Room Folio
                    </button>
                    <button
                      onClick={() => setOrderType('takeaway')}
                      className={`py-1.5 rounded-md text-[11.5px] font-bold transition-all ${
                        orderType === 'takeaway'
                          ? 'bg-[#FF5B22] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Takeaway
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>{orderType === 'room_charge' ? 'Hotel Room Folio' : 'Assigned Table'}</span>
                      <span className="text-[#FF5B22] text-[10px]">
                        {orderType === 'room_charge' ? 'Resident PMS' : 'Floor Map'}
                      </span>
                    </div>

                    {orderType === 'room_charge' ? (
                      <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="w-full bg-[#171D2B] border border-[#232B3E] rounded-md px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#FF5B22]"
                      >
                        {rooms.map(r => (
                          <option key={r.roomNumber} value={r.roomNumber}>
                            Room {r.roomNumber} - {r.guestName} ({r.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full bg-[#171D2B] border border-[#232B3E] rounded-md px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-[#FF5B22]"
                      >
                        {tables.map(t => (
                          <option key={t.id} value={`${t.label} (${t.id})`}>
                            {t.label} • [{t.status}]
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    <button className="py-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Service {settings.serviceChargePercent}% Auto
                    </button>
                    <button className="py-1 px-2 rounded bg-[#171D2B] border border-[#232B3E] text-slate-400 text-[10px] font-bold">
                      Tax Exempt: Off
                    </button>
                  </div>
                </div>

                {/* Quick Discounts */}
                <div className="px-3 py-2 bg-[#0E121B] border-b border-[#1A1F2F] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Quick Disc:</span>
                  <div className="flex space-x-1.5">
                    {[0, 5, 10, 15, 20].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition-all ${
                          discountPercent === pct
                            ? 'bg-[#FF5B22] text-white'
                            : 'bg-[#171C2B] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10">
                    <ShoppingBag className="w-10 h-10 stroke-1 mb-2 opacity-30 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-400">Ticket is empty</p>
                    <p className="text-[10px] text-slate-600">Select dishes or cocktails from catalog</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="bg-[#161B29] border border-[#20273A] rounded-lg p-2.5 text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-200 leading-tight">{item.name}</span>
                        <span className="font-mono font-bold text-slate-100 ml-2">
                          {settings.currency} {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1F273B]">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {settings.currency} {item.price.toFixed(2)} ea
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="h-5 w-5 rounded bg-[#1F263A] hover:bg-[#2A334E] text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold px-1.5 text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="h-5 w-5 rounded bg-[#1F263A] hover:bg-[#2A334E] text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="h-5 w-5 ml-1 text-slate-500 hover:text-red-400 flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculations and Actions */}
              <div className="p-3 bg-[#0E121B] border-t border-[#1C2132] space-y-2">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {settings.currency} {cartSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-mono font-semibold">
                        -{settings.currency} {discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge ({settings.serviceChargePercent}%)</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {settings.currency} {serviceCharge.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-black pt-1.5 border-t border-[#1F263A] text-white">
                    <span>Grand Total</span>
                    <span className="font-mono text-[#FF5B22] text-base">
                      {settings.currency} {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={cart.length === 0}
                    onClick={handleSendToKitchen}
                    className="py-2.5 px-2 rounded-lg bg-[#1B2134] hover:bg-[#232B42] text-slate-200 border border-[#27314D] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FF5B22]" /> Send to KOT
                  </button>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setIsSettleModalOpen(true)}
                    className="py-2.5 px-2 rounded-lg bg-[#FF5B22] hover:bg-[#FF6F3B] text-white font-extrabold text-xs shadow-lg shadow-[#FF5B22]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Settle / Bill
                  </button>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={handleClearTicket}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-red-400 pt-1"
                  >
                    Void Active Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: KITCHEN DISPLAY SYSTEM (KDS) */}
        {/* ======================================================== */}
        {activeTab === 'kds' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2538]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF5B22]" /> Live Kitchen Order Tickets (KDS)
                </h2>
                <p className="text-xs text-slate-400">Real-time synchronized orders for hot wok, grills, and room service</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF5B22]/20 border border-[#FF5B22]/30 text-[#FF5B22] px-3 py-1 rounded text-xs font-bold">
                  {kdsOrders.length} Active Tickets
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {kdsOrders.map(kot => (
                <div
                  key={kot.ticketId}
                  className="bg-[#141926] border border-[#21283D] rounded-xl overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="p-3.5 border-b border-[#20273C] flex items-center justify-between bg-[#171D2D]">
                    <div>
                      <span className="font-mono font-black text-sm text-[#FF5B22]">{kot.ticketId}</span>
                      <h4 className="font-bold text-xs text-white">{kot.table}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">{kot.time}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          kot.status === 'Ready'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {kot.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 flex-1">
                    {kot.items.map((item, idx) => (
                      <div key={idx} className="border-b border-[#1C2337] pb-2 text-xs">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>{item.qty}x {item.name}</span>
                        </div>
                        {item.note && (
                          <span className="text-[10.5px] text-[#FF5B22] italic block mt-0.5">
                            Note: {item.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-[#0F131D] border-t border-[#1C2234] flex gap-2">
                    <button
                      onClick={() => handleBumpKdsStatus(kot.ticketId)}
                      className="w-full py-2 rounded-lg bg-[#FF5B22] hover:bg-[#FF6F3B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {kot.status === 'In-Progress' ? 'Mark as Ready' : 'Complete / Clear Ticket'}
                    </button>
                  </div>
                </div>
              ))}

              {kdsOrders.length === 0 && (
                <div className="col-span-full py-24 text-center text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto stroke-1 mb-2 text-emerald-500/60" />
                  <p className="text-sm font-bold text-slate-300">All kitchen orders cleared!</p>
                  <p className="text-xs text-slate-500">No active tickets pending in queue.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: BAR DISPLAY */}
        {/* ======================================================== */}
        {activeTab === 'bar' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2538]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wine className="w-5 h-5 text-blue-400" /> Midigama Beach Bar Terminal
                </h2>
                <p className="text-xs text-slate-400">Cocktail recipes, draught beer meters, and drink order display</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#141926] border border-[#21283D] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-[#20273C] pb-2">
                  <span className="font-mono text-sm font-bold text-blue-400">BAR-501</span>
                  <span className="text-[10px] text-slate-400">Table 05 Sunset Bar</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-200">2x Arrack Sour (Ceylon Cinnamon)</p>
                  <p className="font-bold text-slate-200">1x Lion Lager Draught Pint</p>
                </div>
                <button className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold mt-2">
                  Dispense & Serve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: TABLE MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'tables' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2538]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#FF5B22]" /> Restaurant & Beach Floor Layout
                </h2>
                <p className="text-xs text-slate-400">Live floor overview of tables, seats, and resident room charges</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#171D2C] border border-[#21283D] rounded-md text-xs font-bold text-emerald-400">
                  {tables.filter(t => t.status === 'Available').length} Vacant Tables
                </span>
                <span className="px-3 py-1 bg-[#FF5B22]/10 border border-[#FF5B22]/30 rounded-md text-xs font-bold text-[#FF5B22]">
                  {tables.filter(t => t.status === 'Occupied').length} Occupied
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map(table => {
                const isOccupied = table.status === 'Occupied';
                return (
                  <div
                    key={table.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isOccupied
                        ? 'bg-[#151A27] border-[#FF5B22]/50 shadow-md shadow-[#FF5B22]/5'
                        : 'bg-[#111520] border-[#1D2335] opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{table.label.split(' - ')[0]}</h4>
                        <span className="text-[10px] text-slate-400">{table.capacity} Guests Max</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isOccupied
                            ? 'bg-[#FF5B22] text-white'
                            : table.status === 'Reserved'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1F263A] text-xs space-y-1">
                      {isOccupied ? (
                        <>
                          <div className="flex justify-between text-slate-400">
                            <span>Guest:</span>
                            <span className="font-bold text-slate-200">{table.guest}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Current Tab:</span>
                            <span className="font-mono font-bold text-[#FF5B22]">
                              {settings.currency} {table.bill.toFixed(2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-500">Ready for walk-in or resident seating</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: SALES REPORTS & FISCAL AUDIT */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2538]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#FF5B22]" /> Sales & Revenue Reports
                </h2>
                <p className="text-xs text-slate-400">Cloud-synced transaction journals, payment breakdowns, and CSV data export</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-lg bg-[#FF5B22] hover:bg-[#FF6F3B] text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-[#FF5B22]/20"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Sales CSV
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#141926] border border-[#20273C] rounded-xl p-4">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Gross Shift Revenue</span>
                <p className="text-2xl font-mono font-black text-[#FF5B22] mt-1">
                  {settings.currency} {pastOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}
                </p>
                <span className="text-[10px] text-emerald-400 mt-1 block">Active cash & room charges</span>
              </div>

              <div className="bg-[#141926] border border-[#20273C] rounded-xl p-4">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Room Folio Posts</span>
                <p className="text-2xl font-mono font-black text-white mt-1">
                  {settings.currency}{' '}
                  {pastOrders.filter(o => o.payment === 'Room Charge').reduce((s, o) => s + o.total, 0).toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">Reconciled at front desk checkout</span>
              </div>

              <div className="bg-[#141926] border border-[#20273C] rounded-xl p-4">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Orders Settled</span>
                <p className="text-2xl font-mono font-black text-white mt-1">{pastOrders.length}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">Zero cancelled during shift</span>
              </div>

              <div className="bg-[#141926] border border-[#20273C] rounded-xl p-4">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Average Check</span>
                <p className="text-2xl font-mono font-black text-amber-400 mt-1">
                  {settings.currency}{' '}
                  {pastOrders.length > 0
                    ? (pastOrders.reduce((s, o) => s + o.total, 0) / pastOrders.length).toFixed(2)
                    : '0.00'}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">Resort restaurant average</span>
              </div>
            </div>

            {/* Past Orders Table */}
            <div className="bg-[#141926] border border-[#20273C] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#1E253A] flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Shift Transaction Ledger</h3>
                <span className="text-xs text-slate-400">{pastOrders.length} transactions recorded</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111520] text-slate-400 uppercase text-[10px] border-b border-[#1F263B]">
                    <tr>
                      <th className="py-3 px-4">Transaction</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Table / Room</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D2437] font-medium">
                    {pastOrders.map(order => (
                      <tr key={order.id} className="hover:bg-[#181E2E] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#FF5B22] font-bold">{order.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{order.time}</td>
                        <td className="py-3 px-4 text-slate-200 font-bold">{order.target}</td>
                        <td className="py-3 px-4 text-slate-300">{order.type}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.payment === 'Room Charge'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-[#1D2438] text-slate-300'
                            }`}
                          >
                            {order.payment}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {settings.currency} {order.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 6: STAFF MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'staff' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2538]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF5B22]" /> Resort Staff & Crew Authorization
                </h2>
                <p className="text-xs text-slate-400">Manage cashier credentials, shift clocks, and terminal permissions</p>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#FF5B22] hover:bg-[#FF6F3B] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#FF5B22]/20"
              >
                <Plus className="w-4 h-4" /> Add Crew Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {staffList.map(emp => (
                <div key={emp.id} className="bg-[#141926] border border-[#20273C] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-[#1B2134] border border-[#26304A] flex items-center justify-center font-black text-sm text-[#FF5B22]">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{emp.name}</h4>
                          <span className="text-[11px] text-slate-400">{emp.role}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          emp.onShift ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {emp.onShift ? 'On Shift' : 'Clocked Out'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1C2337] space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Staff ID:</span>
                        <span className="font-mono text-slate-200">{emp.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Terminal:</span>
                        <span className="text-slate-200">{emp.station}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auth PIN:</span>
                        <span className="font-mono text-slate-400">•••• ({emp.pin})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1C2337] flex gap-2">
                    <button
                      onClick={() => {
                        setStaffList(prev =>
                          prev.map(s => (s.id === emp.id ? { ...s, onShift: !s.onShift } : s))
                        );
                      }}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        emp.onShift
                          ? 'bg-[#1E253A] text-red-400 hover:bg-[#252E47]'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {emp.onShift ? 'Clock Out of Shift' : 'Clock In to Shift'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 7: SYSTEM SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 max-w-3xl">
            <div className="pb-4 border-b border-[#1E2538]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FF5B22]" /> System & POS Configuration
              </h2>
              <p className="text-xs text-slate-400">Configure taxes, service charges, hardware IPs, and receipts</p>
            </div>

            <div className="bg-[#141926] border border-[#20273C] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#FF5B22] uppercase tracking-wider">Property & Outlets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Subtitle / Descriptor</label>
                  <input
                    type="text"
                    value={settings.subTitle}
                    onChange={(e) => setSettings({ ...settings, subTitle: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    value={settings.serviceChargePercent}
                    onChange={(e) => setSettings({ ...settings, serviceChargePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#141926] border border-[#20273C] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#FF5B22] uppercase tracking-wider">Receipt & Thermal Printers</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Receipt Footer Note</label>
                  <input
                    type="text"
                    value={settings.receiptFooter}
                    onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kitchen KOT Thermal Network IP</label>
                  <input
                    type="text"
                    value={settings.kotPrinter}
                    onChange={(e) => setSettings({ ...settings, kotPrinter: e.target.value })}
                    className="w-full bg-[#10141F] border border-[#21283D] rounded-lg p-2 text-slate-200 font-mono focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER VIEW STUBS: Stock, Recipes, Cancelled, Shifts */}
        {(activeTab === 'inventory' || activeTab === 'recipes' || activeTab === 'shifts' || activeTab === 'cancelled' || activeTab === 'menu_admin' || activeTab === 'billing') && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="pb-4 border-b border-[#1E2538] mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white capitalize">{activeTab.replace('_', ' ')} System</h2>
                <p className="text-xs text-slate-400">Integrated operational module synchronized with POS engine</p>
              </div>
            </div>

            <div className="bg-[#141926] border border-[#20273C] rounded-xl p-8 text-center max-w-xl mx-auto my-12">
              <Boxes className="w-12 h-12 text-[#FF5B22] mx-auto mb-3 stroke-1" />
              <h3 className="font-bold text-base text-white capitalize">{activeTab.replace('_', ' ')} Module Active</h3>
              <p className="text-xs text-slate-400 mt-2">
                All records in this module link directly into POS order depletion, kitchen displays, and guest checkout folios.
              </p>
              <button
                onClick={() => setActiveTab('pos')}
                className="mt-6 px-4 py-2 bg-[#FF5B22] text-white rounded-lg font-bold text-xs hover:bg-[#FF6F3B] transition-colors"
              >
                Return to POS Terminal
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: SETTLE & BILL PAYMENT */}
      {/* ======================================================== */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131826] border border-[#212A3F] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1F273D] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Settle & Close Bill</h3>
                <span className="text-xs text-slate-400">
                  Total Payable:{' '}
                  <span className="font-mono font-bold text-[#FF5B22]">
                    {settings.currency} {grandTotal.toFixed(2)}
                  </span>
                </span>
              </div>
              <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentChoice('card')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentChoice === 'card'
                      ? 'bg-[#FF5B22] text-white border-[#FF5B22]'
                      : 'bg-[#171D2D] border-[#222A3F] text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card / POS</span>
                </button>

                <button
                  onClick={() => setPaymentChoice('room_folio')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentChoice === 'room_folio'
                      ? 'bg-[#FF5B22] text-white border-[#FF5B22]'
                      : 'bg-[#171D2D] border-[#222A3F] text-slate-400 hover:text-white'
                  }`}
                >
                  <BedDouble className="w-4 h-4" />
                  <span>Charge Room</span>
                </button>

                <button
                  onClick={() => setPaymentChoice('cash')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentChoice === 'cash'
                      ? 'bg-[#FF5B22] text-white border-[#FF5B22]'
                      : 'bg-[#171D2D] border-[#222A3F] text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cash</span>
                </button>
              </div>

              {paymentChoice === 'room_folio' && (
                <div className="bg-[#171D2E] border border-[#242D42] rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="font-bold text-slate-300 block">Select Hotel Room Folio</span>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full bg-[#101420] border border-[#252F47] rounded-lg p-2 text-white font-bold focus:outline-none focus:border-[#FF5B22]"
                  >
                    {rooms.map(r => (
                      <option key={r.roomNumber} value={r.roomNumber}>
                        Room {r.roomNumber} - {r.guestName}
                      </option>
                    ))}
                  </select>
                  <div className="pt-2 text-[11px] text-slate-400 border-t border-[#20273C] flex justify-between">
                    <span>Current Folio Balance:</span>
                    <span className="font-mono text-[#FF5B22] font-bold">
                      {settings.currency} {rooms.find(r => r.roomNumber === selectedRoom)?.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentChoice === 'cash' && (
                <div className="bg-[#171D2E] border border-[#242D42] rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="font-bold text-slate-300 block">Cash Tendered by Guest</span>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono">{settings.currency}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={tenderCashAmount}
                      onChange={(e) => setTenderCashAmount(e.target.value)}
                      className="w-full bg-[#101420] border border-[#252F47] rounded-lg pl-9 pr-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#FF5B22]"
                    />
                  </div>
                  {parseFloat(tenderCashAmount) >= grandTotal && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded flex justify-between text-xs text-emerald-400 font-bold">
                      <span>Change Due:</span>
                      <span className="font-mono">
                        {settings.currency} {(parseFloat(tenderCashAmount) - grandTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1F273D] bg-[#0F131F] flex justify-end gap-2">
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                className="px-5 py-2.5 bg-[#FF5B22] hover:bg-[#FF6F3B] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#FF5B22]/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Authorize & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THERMAL PRINT RECEIPT */}
      {/* ======================================================== */}
      {isReceiptModalOpen && lastFinishedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 font-mono text-xs flex flex-col space-y-3">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h2 className="font-black text-sm tracking-tight uppercase text-black">{settings.businessName}</h2>
              <p className="text-[10px] text-slate-600 font-bold">{settings.subTitle}</p>
              <p className="text-[10px] text-slate-500">Midigama Bay, Ahangama, Southern Province</p>
              <p className="text-[10px] text-slate-500">VAT/TIN: LK-99201948</p>
            </div>

            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{lastFinishedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{lastFinishedOrder.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-bold">{lastFinishedOrder.target}</span>
              </div>
              <div className="flex justify-between">
                <span>Server / Cashier:</span>
                <span>{lastFinishedOrder.staff}</span>
              </div>
            </div>

            <div className="py-2 border-y border-dashed border-slate-400 space-y-1 text-[11px]">
              {lastFinishedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold">{settings.currency} {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currency} {lastFinishedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service ({settings.serviceChargePercent}%):</span>
                <span>{settings.currency} {lastFinishedOrder.serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-400 text-black">
                <span>TOTAL:</span>
                <span>{settings.currency} {lastFinishedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{lastFinishedOrder.payment}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-500 pt-3 border-t border-dashed border-slate-400">
              {settings.receiptFooter}
            </p>

            <div className="pt-3 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-black text-white rounded font-sans text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Bill
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded font-sans text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD CREW MEMBER */}
      {/* ======================================================== */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131826] border border-[#212A3F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1F273D] flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Add Staff / Cashier</h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStaffList([
                  ...staffList,
                  {
                    id: `EMP-${String(staffList.length + 1).padStart(2, '0')}`,
                    name: newStaff.name,
                    role: newStaff.role,
                    pin: newStaff.pin,
                    station: newStaff.station,
                    onShift: true
                  }
                ]);
                setIsAddStaffModalOpen(false);
                setNewStaff({ name: '', role: 'Cashier', pin: '1234', station: 'Main Cashier Terminal' });
              }}
              className="p-4 space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roshan Gunawardena"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white focus:outline-none focus:border-[#FF5B22]"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white focus:outline-none focus:border-[#FF5B22]"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Bartender">Bartender</option>
                  <option value="Kitchen Chef">Kitchen Chef</option>
                  <option value="Floor Captain">Floor Captain</option>
                  <option value="Front Office">Front Office</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newStaff.pin}
                  onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
                  className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white font-mono tracking-widest focus:outline-none focus:border-[#FF5B22]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF5B22] text-white rounded-lg font-bold"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADD MENU ITEM */}
      {/* ======================================================== */}
      {isAddMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131826] border border-[#212A3F] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1F273D] flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Create New Menu Item</h3>
              <button onClick={() => setIsAddMenuModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newItem = {
                  id: `MI-${Date.now().toString().slice(-4)}`,
                  name: newMenuItem.name,
                  category: newMenuItem.category,
                  tag: newMenuItem.tag,
                  price: parseFloat(newMenuItem.price) || 0,
                  code: newMenuItem.code || 'CUSTOM',
                  stock: '99+ sup',
                  isAvail: true
                };
                setMenuItems([newItem, ...menuItems]);
                setIsAddMenuModalOpen(false);
                setNewMenuItem({ name: '', category: 'RICE DISHES', price: 1850, code: 'NEW-DSH', tag: 'KITCHEN' });
              }}
              className="p-4 space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-400 block mb-1">Item / Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Devilled Prawns with Naan"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white focus:outline-none focus:border-[#FF5B22]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                    className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white focus:outline-none focus:border-[#FF5B22]"
                  >
                    {INITIAL_CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Dispensary Tag</label>
                  <select
                    value={newMenuItem.tag}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, tag: e.target.value })}
                    className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white focus:outline-none focus:border-[#FF5B22]"
                  >
                    <option value="KITCHEN">KITCHEN</option>
                    <option value="BAR">BAR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white font-mono focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DEV-PRW"
                    value={newMenuItem.code}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, code: e.target.value })}
                    className="w-full bg-[#101420] border border-[#232B40] rounded-lg p-2 text-white font-mono focus:outline-none focus:border-[#FF5B22]"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMenuModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF5B22] text-white rounded-lg font-bold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}