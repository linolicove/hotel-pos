import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Monitor,
  Building,
  Bed,
  KeyRound,
  Receipt,
  Grid,
  Package,
  BookOpen,
  DollarSign,
  BarChart3,
  ClipboardList,
  Trash2,
  Users,
  Settings,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronRight,
  Send,
  X,
  CreditCard,
  Banknote,
  LogOut,
  Calendar,
  Lock,
  ShieldCheck,
  Percent,
  TrendingUp,
  RefreshCw,
  Sliders,
  Check,
  Layers,
  Coffee,
  Coins,
  Usb,
  Volume2,
  Zap,
  ShoppingBag,
  Upload,
  Menu,
  Edit3,
  LayoutGrid,
  Download,
  HardDrive,
  Mail,
  UserCheck,
  DoorOpen
} from 'lucide-react';
import { syncToCloud, subscribeToCloud } from './firebase';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for client-side PDF tariff/rate parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const HOTEL_ROLE_PERMISSIONS = {
  'General Manager': ['pos', 'rooms', 'housekeeping', 'folios', 'inventory', 'tariffs', 'night_audit', 'reports', 'service_admin', 'staff', 'settings'],
  'Front Desk Lead': ['pos', 'rooms', 'folios', 'night_audit', 'reports', 'service_admin', 'settings'],
  'Night Auditor': ['pos', 'rooms', 'folios', 'night_audit', 'reports'],
  'Concierge & Reservations': ['pos', 'rooms', 'folios'],
  'Housekeeping Supervisor': ['rooms', 'housekeeping', 'inventory']
};

const INITIAL_HOTEL_STAFF = [
  { id: 'usr_gm', name: 'Alina Vance (GM)', role: 'General Manager', pin: '2024', avatar: 'AV', email: 'gm@grandazurehotel.com' },
  { id: 'usr_fd', name: 'Devon Lee', role: 'Front Desk Lead', pin: '1111', avatar: 'DL', email: 'frontdesk@grandazurehotel.com' },
  { id: 'usr_na', name: 'Samir Patel', role: 'Night Auditor', pin: '2222', avatar: 'SP', email: 'nightaudit@grandazurehotel.com' },
  { id: 'usr_hk', name: 'Elena Ramos', role: 'Housekeeping Supervisor', pin: '3333', avatar: 'ER', email: 'housekeeping@grandazurehotel.com' }
];

const INITIAL_HOUSEKEEPING_INVENTORY = [
  { id: 'inv_linen_king', name: 'Egyptian Cotton King Sheet', category: 'Bedding & Linen', stock: 120, unit: 'pcs', cost: 45.00, threshold: 25 },
  { id: 'inv_towel_bath', name: 'Plush Bath Sheet 800GSM', category: 'Towels & Linen', stock: 240, unit: 'pcs', cost: 18.50, threshold: 40 },
  { id: 'inv_pillow_slip', name: 'Sateen Pillow Slip', category: 'Bedding & Linen', stock: 350, unit: 'pcs', cost: 8.00, threshold: 60 },
  { id: 'inv_bathrobe', name: 'Velour Hotel Robe', category: 'Amenities', stock: 65, unit: 'pcs', cost: 38.00, threshold: 15 },
  { id: 'inv_keycards', name: 'RFID High-Freq Keycards', category: 'Front Desk Consumables', stock: 480, unit: 'pcs', cost: 1.20, threshold: 100 },
  { id: 'inv_toiletries_kit', name: 'Luxury Botanicals Amenity Set', category: 'Toiletries', stock: 450, unit: 'kits', cost: 4.80, threshold: 80 },
  { id: 'inv_slippers', name: 'Waffle Spa Slippers', category: 'Amenities', stock: 280, unit: 'pairs', cost: 2.10, threshold: 50 },
  { id: 'inv_sparkling_water', name: 'Pellegrino 750ml Minibar', category: 'Minibar Stock', stock: 180, unit: 'bottles', cost: 2.90, threshold: 30 },
  { id: 'inv_champagne', name: 'Veuve Clicquot 375ml', category: 'Minibar Stock', stock: 42, unit: 'bottles', cost: 42.00, threshold: 10 },
  { id: 'inv_artisan_choc', name: 'Swiss Dark Truffles Box', category: 'Minibar Stock', stock: 95, unit: 'boxes', cost: 6.50, threshold: 20 }
];

const INITIAL_HOTEL_SERVICES = [
  {
    id: 'srv_deluxe_night',
    name: 'Deluxe Room Stay (1 Night)',
    department: 'Lodging',
    category: 'Room Rates',
    price: 220.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80',
    description: '1 Night stay in Deluxe King Room with ocean panorama and complimentary WiFi.',
    recipe: [
      { ingredientId: 'inv_linen_king', amount: 1 },
      { ingredientId: 'inv_towel_bath', amount: 2 },
      { ingredientId: 'inv_toiletries_kit', amount: 1 }
    ]
  },
  {
    id: 'srv_suite_night',
    name: 'Executive Suite Stay (1 Night)',
    department: 'Lodging',
    category: 'Room Rates',
    price: 480.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80',
    description: 'Luxury Executive Suite including lounge access, turn-down gift, and VIP breakfast.',
    recipe: [
      { ingredientId: 'inv_linen_king', amount: 2 },
      { ingredientId: 'inv_towel_bath', amount: 4 },
      { ingredientId: 'inv_bathrobe', amount: 2 },
      { ingredientId: 'inv_artisan_choc', amount: 1 }
    ]
  },
  {
    id: 'srv_spa_massage',
    name: 'Signature Deep Tissue Spa (90m)',
    department: 'Wellness & Spa',
    category: 'Guest Wellness',
    price: 140.00,
    prepTime: '90m',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
    description: 'Holistic restorative massage session with organic essential oils and steam sauna.',
    recipe: [
      { ingredientId: 'inv_towel_bath', amount: 2 },
      { ingredientId: 'inv_slippers', amount: 1 }
    ]
  },
  {
    id: 'srv_airport_transfer',
    name: 'Private Chauffeur Airport Transfer',
    department: 'Concierge',
    category: 'Transportation',
    price: 85.00,
    prepTime: 'On Request',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    description: 'Luxury Mercedes S-Class airport pickup or departure service with bottled refreshments.',
    recipe: [
      { ingredientId: 'inv_sparkling_water', amount: 2 }
    ]
  },
  {
    id: 'srv_minibar_vip',
    name: 'VIP Minibar Refresh & Champagne',
    department: 'Food & Beverage',
    category: 'In-Room Minibar',
    price: 110.00,
    prepTime: 'Instant',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80',
    description: 'Chilled Champagne bottle, artisanal dark chocolate box, and sparkling spring water.',
    recipe: [
      { ingredientId: 'inv_champagne', amount: 1 },
      { ingredientId: 'inv_artisan_choc', amount: 1 },
      { ingredientId: 'inv_sparkling_water', amount: 2 }
    ]
  },
  {
    id: 'srv_breakfast_buffet',
    name: 'Grand Azure Champagne Breakfast',
    department: 'Food & Beverage',
    category: 'Dining & Room Service',
    price: 35.00,
    prepTime: '6:30-11:00 AM',
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80',
    description: 'Full continental buffet or in-room tray delivery with fresh pastries and barista coffee.',
    recipe: []
  }
];

const INITIAL_HOTEL_ROOMS = [
  { id: 'RM-101', name: 'Room 101 - King Deluxe', wing: 'East Wing - Floor 1', type: 'Deluxe', rate: 220.00, status: 'VACANT', currentGuestRef: null },
  { id: 'RM-102', name: 'Room 102 - King Deluxe', wing: 'East Wing - Floor 1', type: 'Deluxe', rate: 220.00, status: 'VACANT', currentGuestRef: null },
  { id: 'RM-103', name: 'Room 103 - Twin Premium', wing: 'East Wing - Floor 1', type: 'Premium Twin', rate: 240.00, status: 'VACANT', currentGuestRef: null },
  { id: 'RM-201', name: 'Suite 201 - Exec Ocean Suite', wing: 'Tower Wing - Floor 2', type: 'Executive Suite', rate: 480.00, status: 'VACANT', currentGuestRef: null },
  { id: 'RM-202', name: 'Suite 202 - Exec Ocean Suite', wing: 'Tower Wing - Floor 2', type: 'Executive Suite', rate: 480.00, status: 'VACANT', currentGuestRef: null },
  { id: 'RM-301', name: 'Penthouse 301 - Royal Suite', wing: 'Penthouse Level', type: 'Presidential Penthouse', rate: 950.00, status: 'VACANT', currentGuestRef: null },
  { id: 'VIL-01', name: 'Ocean Villa 01 - Private Pool', wing: 'Beachfront Garden', type: 'Luxury Pool Villa', rate: 750.00, status: 'VACANT', currentGuestRef: null },
  { id: 'VIL-02', name: 'Ocean Villa 02 - Private Pool', wing: 'Beachfront Garden', type: 'Luxury Pool Villa', rate: 750.00, status: 'VACANT', currentGuestRef: null }
];

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (e) {
      console.warn(`LocalStorage read error for ${key}:`, e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`LocalStorage write error for ${key}:`, e);
    }
  }, [key, state]);

  return [state, setState];
}

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HotelPOSApp() {
  // Authentication & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPinInput, setLoginPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('pos');
  const [reportSubTab, setReportSubTab] = useState('Daily Revenue');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posViewMode, setPosViewMode] = useState('grid');
  const [adminServiceCategory, setAdminServiceCategory] = useState('All');

  // Core Hotel State
  const [staffList, setStaffList] = usePersistentState('hotel_staff_list', INITIAL_HOTEL_STAFF);
  const [currentUser, setCurrentUser] = useState(INITIAL_HOTEL_STAFF[0]);
  const [inventory, setInventory] = usePersistentState('hotel_inventory', INITIAL_HOUSEKEEPING_INVENTORY);
  const [serviceCatalog, setServiceCatalog] = usePersistentState('hotel_services', INITIAL_HOTEL_SERVICES);
  const [hotelRooms, setHotelRooms] = usePersistentState('hotel_rooms', INITIAL_HOTEL_ROOMS);
  const [activeFolios, setActiveFolios] = usePersistentState('hotel_active_folios', []);
  const [folioTransactions, setFolioTransactions] = usePersistentState('hotel_transactions', []);
  const [auditLogs, setAuditLogs] = usePersistentState('hotel_audit_logs', []);
  const [stockLogs, setStockLogs] = usePersistentState('hotel_stock_logs', []);

  // Sequential Counters
  const [seqCounters, setSeqCounters] = usePersistentState('hotel_counters', {
    folio: 1001,
    invoice: 5001,
    cashOut: 101
  });

  const getNextFolioNumber = () => {
    const next = (seqCounters.folio || 1000) + 1;
    setSeqCounters(prev => ({ ...prev, folio: next }));
    return `FOL-${next}`;
  };

  const getNextInvoiceNumber = () => {
    const next = (seqCounters.invoice || 5000) + 1;
    setSeqCounters(prev => ({ ...prev, invoice: next }));
    return `INV-${next}`;
  };

  // Hotel System Configurations
  const [settings, setSettings] = usePersistentState('hotel_settings', {
    hotelName: 'The Grand Azure Hotel & Resort',
    tagline: 'LUXURY SUITES & OCEAN RESORT',
    legalEntity: 'Azure Hospitality Group Ltd',
    hotelLicenseNo: 'HTL-89472-EU',
    taxRegNo: 'VAT-99201948',
    terminalId: 'FRONTDESK-MAIN-01',
    phone: '+1 (800) 555-AZURE',
    email: 'reservations@grandazurehotel.com',
    website: 'www.grandazurehotel.com',
    address: '100 Ocean Promenade, Paradise Bay, CA 90210',
    currency: '$',
    cityTaxRate: 4.5, // Occupancy / City Bed Tax
    salesTaxRate: 8.0, // State / Value Added Tax
    resortFee: 25.00, // Daily Resort Amenities Fee
    receiptRollWidth: '80mm',
    receiptFontSize: '11px',
    receiptFontFamily: 'monospace',
    receiptMargin: '2mm',
    autoPrintOrder: true,
    autoPrintFolio: true,
    chimeAudio: true,
    invoiceHeader: 'The Grand Azure Hotel & Ocean Villas\n100 Ocean Promenade, Paradise Bay\nTel: +1 (800) 555-AZURE',
    invoiceFooter: 'Thank you for choosing Grand Azure Hotel.\nWe look forward to welcoming you back.'
  });

  // Shift & Night Audit State
  const [currentAuditShift, setCurrentAuditShift] = usePersistentState('hotel_current_shift', {
    shiftId: `SHIFT-DAY-${getLocalDateStr().replace(/-/g, '')}`,
    openedDate: getLocalDateStr(),
    openedAt: '07:00 AM',
    openedBy: 'Alina Vance (GM)',
    startingDrawer: 2500.00,
    status: 'OPEN',
    payouts: []
  });

  const [shiftHistory, setShiftHistory] = usePersistentState('hotel_shift_history', []);
  const [denominations, setDenominations] = usePersistentState('hotel_denominations', {
    100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0
  });

  // Current POS Booking & Folio Builder State
  const [bookingMode, setBookingMode] = useState('ROOM_FOLIO'); // 'ROOM_FOLIO' | 'DIRECT_WALKIN'
  const [selectedRoom, setSelectedRoom] = useState(INITIAL_HOTEL_ROOMS[0]);
  const [guestDetails, setGuestDetails] = useState({
    name: 'Alexander Wright',
    passportOrId: 'P-9847120',
    contact: '+1 555-019-2834',
    reservationRef: 'RES-8921',
    nights: 2
  });
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [resortFeeActive, setResortFeeActive] = useState(true);
  const [cityTaxActive, setCityTaxActive] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Settlement & Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [settlingFolio, setSettlingFolio] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cashTendered, setCashTendered] = useState('');
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [printNotice, setPrintNotice] = useState(null);
  const [reportStartDate, setReportStartDate] = useState(getLocalDateStr());
  const [reportEndDate, setReportEndDate] = useState(getLocalDateStr());

  // Cloud Synchronization References
  const isCloudSynced = useRef(false);
  const prevFoliosRef = useRef('');
  const prevTransRef = useRef('');
  const prevRoomsRef = useRef('');

  useEffect(() => {
    const unsubFolios = subscribeToCloud('active_folios', (remote) => {
      isCloudSynced.current = true;
      if (Array.isArray(remote)) {
        const str = JSON.stringify(remote);
        if (prevFoliosRef.current === str) return;
        prevFoliosRef.current = str;
        setActiveFolios(remote);
        localStorage.setItem('hotel_active_folios', str);
      }
    });

    const unsubTrans = subscribeToCloud('hotel_transactions', (remote) => {
      isCloudSynced.current = true;
      if (Array.isArray(remote)) {
        const str = JSON.stringify(remote);
        if (prevTransRef.current === str) return;
        prevTransRef.current = str;
        setFolioTransactions(remote);
        localStorage.setItem('hotel_transactions', str);
      }
    });

    const unsubRooms = subscribeToCloud('hotel_rooms', (remote) => {
      isCloudSynced.current = true;
      if (Array.isArray(remote)) {
        const str = JSON.stringify(remote);
        if (prevRoomsRef.current === str) return;
        prevRoomsRef.current = str;
        setHotelRooms(remote);
        localStorage.setItem('hotel_rooms', str);
      }
    });

    return () => {
      if (typeof unsubFolios === 'function') unsubFolios();
      if (typeof unsubTrans === 'function') unsubTrans();
      if (typeof unsubRooms === 'function') unsubRooms();
    };
  }, []);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (activeFolios !== undefined) {
      const cur = JSON.stringify(activeFolios);
      if (cur !== prevFoliosRef.current) {
        prevFoliosRef.current = cur;
        syncToCloud('active_folios', activeFolios);
      }
    }
  }, [activeFolios]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (folioTransactions !== undefined) {
      const cur = JSON.stringify(folioTransactions);
      if (cur !== prevTransRef.current) {
        prevTransRef.current = cur;
        syncToCloud('hotel_transactions', folioTransactions);
      }
    }
  }, [folioTransactions]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (hotelRooms !== undefined) {
      const cur = JSON.stringify(hotelRooms);
      if (cur !== prevRoomsRef.current) {
        prevRoomsRef.current = cur;
        syncToCloud('hotel_rooms', hotelRooms);
      }
    }
  }, [hotelRooms]);

  // Inventory Map & Availability
  const inventoryMap = useMemo(() => {
    const map = {};
    (inventory || []).forEach(i => { if (i) map[i.id] = i; });
    return map;
  }, [inventory]);

  const recordAuditLog = (action, targetRef, details) => {
    const newLog = {
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString(),
      action,
      targetRef,
      staff: currentUser.name,
      role: currentUser.role,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const triggerAutoPrint = (slipConfig, noticeText = 'Spooling document...') => {
    setActivePrintSlip(slipConfig);
    setPrintNotice({
      title: slipConfig.type === 'GUEST_FOLIO_INVOICE' ? 'Checking Out Guest • Printing Folio' : 'Printing Hotel Voucher',
      detail: noticeText
    });
    setTimeout(() => setPrintNotice(null), 3000);
  };

  useEffect(() => {
    if (activePrintSlip) {
      const timer = setTimeout(() => {
        try { window.print(); } catch (e) { console.warn('Printer Spooler Notice:', e); }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePrintSlip]);

  const hasAccess = (tabKey) => {
    const allowed = HOTEL_ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tabKey);
  };

  // Cart Financials for Folios
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartDiscountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableBasis = Math.max(0, cartSubtotal - cartDiscountAmount);
  const cartResortFee = resortFeeActive && bookingMode === 'ROOM_FOLIO' ? (settings.resortFee * Math.max(1, guestDetails.nights)) : 0;
  const cartCityTax = cityTaxActive ? (taxableBasis * settings.cityTaxRate) / 100 : 0;
  const cartSalesTax = (taxableBasis * settings.salesTaxRate) / 100;
  const cartGrandTotal = taxableBasis + cartResortFee + cartCityTax + cartSalesTax;

  const calculateFolioFinancials = (folio) => {
    if (!folio || !folio.items) return { subtotal: 0, discount: 0, resortFee: 0, cityTax: 0, salesTax: 0, total: 0 };
    const subtotal = folio.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = (subtotal * (folio.discountPercent || 0)) / 100;
    const basis = Math.max(0, subtotal - discount);
    const resortFee = folio.resortFeeActive ? (settings.resortFee * (folio.nights || 1)) : 0;
    const cityTax = folio.cityTaxActive ? (basis * settings.cityTaxRate) / 100 : 0;
    const salesTax = (basis * settings.salesTaxRate) / 100;
    const total = basis + resortFee + cityTax + salesTax;
    return { subtotal, discount, resortFee, cityTax, salesTax, total };
  };

  // Post or Update Folio Charge
  const handlePostFolioCharge = () => {
    if (cart.length === 0) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const folioId = getNextFolioNumber();

    const folioPayload = {
      folioId,
      mode: bookingMode,
      roomId: bookingMode === 'ROOM_FOLIO' ? selectedRoom.id : 'WALK-IN',
      roomName: bookingMode === 'ROOM_FOLIO' ? selectedRoom.name : 'Walk-in Guest Services',
      guestName: guestDetails.name || 'Incidental Guest',
      passportOrId: guestDetails.passportOrId,
      contact: guestDetails.contact,
      nights: guestDetails.nights,
      agent: currentUser.name,
      postedAt: `${getLocalDateStr()} ${nowTime}`,
      status: 'OPEN',
      resortFeeActive,
      cityTaxActive,
      discountPercent,
      items: [...cart]
    };

    setActiveFolios(prev => [folioPayload, ...prev]);

    if (bookingMode === 'ROOM_FOLIO') {
      setHotelRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'OCCUPIED', currentGuestRef: folioId } : r));
    }

    recordAuditLog('CHARGE_POSTED_TO_FOLIO', folioId, `Posted ${cart.length} charges to ${folioPayload.roomName} (${folioPayload.guestName}) for ${settings.currency}${cartGrandTotal.toFixed(2)}`);

    triggerAutoPrint({
      type: 'ROOM_SERVICE_VOUCHER',
      data: folioPayload
    }, `Posted to ${folioPayload.roomName}`);

    setCart([]);
  };

  // Complete Folio Settlement and Room Check-Out
  const handleSettleFolio = () => {
    const target = settlingFolio || {
      folioId: getNextFolioNumber(),
      mode: bookingMode,
      roomId: bookingMode === 'ROOM_FOLIO' ? selectedRoom.id : null,
      roomName: bookingMode === 'ROOM_FOLIO' ? selectedRoom.name : 'Walk-in Guest Services',
      guestName: guestDetails.name,
      items: cart,
      nights: guestDetails.nights,
      resortFeeActive,
      cityTaxActive,
      discountPercent
    };

    if (!target.items || target.items.length === 0) return;
    const fin = calculateFolioFinancials(target);

    // Housekeeping Stock Depletion
    const deductions = {};
    target.items.forEach(item => {
      const match = serviceCatalog.find(s => s.id === item.id) || item;
      if (match.recipe && Array.isArray(match.recipe)) {
        match.recipe.forEach(r => {
          deductions[r.ingredientId] = (deductions[r.ingredientId] || 0) + (r.amount * item.qty);
        });
      }
    });

    setInventory(prev => prev.map(invItem => {
      if (deductions[invItem.id]) {
        return {
          ...invItem,
          stock: Math.max(0, Number((invItem.stock - deductions[invItem.id]).toFixed(2)))
        };
      }
      return invItem;
    }));

    const newInvoice = {
      invoiceNo: getNextInvoiceNumber(),
      folioRef: target.folioId,
      date: `${getLocalDateStr()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      room: target.roomName,
      guest: target.guestName,
      agent: currentUser.name,
      items: target.items,
      subtotal: fin.subtotal,
      discount: fin.discount,
      resortFee: fin.resortFee,
      cityTax: fin.cityTax,
      salesTax: fin.salesTax,
      total: fin.total,
      paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? (parseFloat(cashTendered) || fin.total) : undefined,
      changeDue: paymentMethod === 'CASH' ? Math.max(0, (parseFloat(cashTendered) || fin.total) - fin.total) : 0
    };

    setFolioTransactions(prev => [newInvoice, ...prev]);
    setActiveFolios(prev => prev.filter(f => f.folioId !== target.folioId));

    if (target.roomId) {
      // Free room and mark as CLEANING PENDING
      setHotelRooms(prev => prev.map(r => r.id === target.roomId ? { ...r, status: 'DIRTY / REFRESH', currentGuestRef: null } : r));
    }

    recordAuditLog('FOLIO_SETTLED_CHECKOUT', newInvoice.invoiceNo, `Settled Folio for ${target.roomName} (${target.guestName}) via ${paymentMethod} for ${settings.currency}${newInvoice.total.toFixed(2)}`);

    triggerAutoPrint({
      type: 'GUEST_FOLIO_INVOICE',
      data: newInvoice
    }, `Folio #${newInvoice.invoiceNo} - ${target.guestName}`);

    setSettlingFolio(null);
    setCheckoutModalOpen(false);
    setCashTendered('');
    setCart([]);
  };

  const handlePinLogin = (pinVal) => {
    const pin = pinVal || loginPinInput;
    setLoginError('');
    const found = staffList.find(s => s.pin === pin);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setLoginPinInput('');
      const allowed = HOTEL_ROLE_PERMISSIONS[found.role] || [];
      setActiveTab(allowed.includes('pos') ? 'pos' : (allowed[0] || 'pos'));
      recordAuditLog('STAFF_LOGIN', found.id, `Agent ${found.name} logged into Front Desk terminal.`);
    } else {
      setLoginError('Invalid Employee PIN. GM Default: 2024, Front Desk: 1111');
    }
  };

  const categoriesList = useMemo(() => {
    const cats = new Set(['All']);
    serviceCatalog.forEach(s => cats.add(s.category));
    return Array.from(cats);
  }, [serviceCatalog]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b14] p-4 font-sans select-none antialiased">
        <div className="w-full max-w-[400px] rounded-[32px] border border-[#1b253b] bg-[#0c1424]/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-2xl font-black text-white shadow-lg shadow-sky-600/40">
              <Building className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-xl font-black tracking-tight text-white">{settings.hotelName}</h1>
            <p className="mt-0.5 text-[10px] font-extrabold tracking-[0.2em] text-sky-400 uppercase">
              HOTEL PMS &amp; FRONT DESK POS
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-400 border border-sky-500/20">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Terminal Ready • Enter Security PIN
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-[#070b14] px-4">
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <span
                    key={idx}
                    className={`h-3.5 w-3.5 rounded-full transition-all ${
                      loginPinInput.length > idx ? 'bg-sky-400 scale-110' : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {loginError && <p className="mt-2 text-center text-xs font-bold text-rose-500">{loginError}</p>}

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (loginPinInput.length < 4) {
                    const next = loginPinInput + num;
                    setLoginPinInput(next);
                    if (next.length === 4) handlePinLogin(next);
                  }
                }}
                className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-base font-bold text-white hover:bg-zinc-800 active:scale-95 transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLoginPinInput('')}
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-xs font-bold text-zinc-400 hover:bg-zinc-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (loginPinInput.length < 4) {
                  const next = loginPinInput + '0';
                  setLoginPinInput(next);
                  if (next.length === 4) handlePinLogin(next);
                }
              }}
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-base font-bold text-white hover:bg-zinc-800 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setLoginPinInput(prev => prev.slice(0, -1))}
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-xs font-bold text-zinc-400 hover:bg-zinc-800"
            >
              Del
            </button>
          </div>

          <div className="mt-5 border-t border-zinc-800/80 pt-3 text-center">
            <p className="text-[10px] text-zinc-500">
              Default PINs: General Manager (2024) • Front Desk (1111) • Night Audit (2222)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-zinc-100 font-sans select-none overflow-hidden antialiased">
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          @page { margin: ${settings.receiptMargin || '2mm'}; size: auto; }
          body { background: #ffffff !important; color: #000000 !important; }
          body * { visibility: hidden !important; }
          #thermal-print-area, #thermal-print-area * { visibility: visible !important; }
          #thermal-print-area {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: ${settings.receiptRollWidth || '80mm'} !important;
            font-size: ${settings.receiptFontSize || '11px'} !important;
            font-family: ${settings.receiptFontFamily || 'monospace'} !important;
          }
        }
      `}</style>

      {/* Floating menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-sky-600 hover:bg-sky-500 text-white px-2 py-4 rounded-r-2xl shadow-2xl flex flex-col items-center gap-1.5"
      >
        <Menu className="h-4 w-4" />
        <span className="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr]">MENU</span>
      </button>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#070b14] border-r border-zinc-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          <div className="p-5 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-sky-600/30">
                GA
              </div>
              <div>
                <h1 className="text-xs font-black text-white leading-none">{settings.hotelName}</h1>
                <p className="text-[9px] font-bold tracking-widest text-sky-400 uppercase mt-1">HOTEL &amp; RESORT PMS</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'pos', name: 'Front Desk POS', icon: Monitor, badge: cart.reduce((a, b) => a + b.qty, 0) },
              { id: 'rooms', name: 'Room Inventory & Keys', icon: Bed, badge: hotelRooms.filter(r => r.status === 'OCCUPIED').length },
              { id: 'folios', name: 'Guest Billing Folios', icon: Receipt, badge: activeFolios.length },
              { id: 'housekeeping', name: 'Housekeeping & Clean', icon: DoorOpen, alert: hotelRooms.some(r => r.status.includes('DIRTY')) },
              { id: 'inventory', name: 'Linen & Amenities Stock', icon: Package, alert: inventory.some(i => i.stock <= i.threshold) },
              { id: 'night_audit', name: 'Night Audit & Drawer', icon: DollarSign },
              { id: 'reports', name: 'Hotel Revenue Reports', icon: BarChart3 },
              { id: 'service_admin', name: 'Tariffs & Amenity Rates', icon: ClipboardList },
              { id: 'staff', name: 'Front Desk Staff', icon: Users },
              { id: 'settings', name: 'Hotel & Tax Settings', icon: Settings }
            ].map(item => {
              const allowed = hasAccess(item.id);
              return (
                <button
                  key={item.id}
                  disabled={!allowed}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    !allowed ? 'opacity-30 cursor-not-allowed text-zinc-600' : activeTab === item.id ? 'bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-white text-zinc-900">{item.badge}</span>
                  )}
                  {item.alert && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-zinc-800 text-sky-400 font-black text-xs flex items-center justify-center border border-zinc-700">
              {currentUser.avatar}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
              <span className="text-[10px] text-zinc-400">{currentUser.role}</span>
            </div>
          </div>
          <button onClick={() => setIsAuthenticated(false)} title="Lock Terminal" className="p-1.5 text-zinc-400 hover:text-rose-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN PMS DESK AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
        <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase flex items-center gap-2 shadow-sm"
            >
              <Menu className="h-4 w-4 text-sky-400" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-500 font-mono">HOTEL PMS: {settings.terminalId}</span>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> PMS Online
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
              Folio Currency: {settings.currency}
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Lock
            </button>
          </div>
        </header>

        {/* TAB 1: FRONT DESK POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Catalog Grid Area */}
            <div className="flex-1 flex flex-col p-5 overflow-hidden min-h-0">
              {/* Category Selector Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 mb-4 shrink-0 shadow-md flex items-center gap-3">
                <div className="flex-1 min-w-0 overflow-x-auto pb-1 pt-0.5 flex items-center gap-2">
                  {categoriesList.map((cat) => {
                    const count = cat === 'All' ? serviceCatalog.length : serviceCatalog.filter(m => m.category === cat).length;
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                          isSelected ? 'bg-sky-600 text-white shadow-sky-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-300'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="h-8 w-px bg-slate-800 shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-48">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      placeholder="Search Hotel Services..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <div className="bg-slate-100 p-3.5 rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {serviceCatalog
                      .filter(item => (selectedCategory === 'All' || item.category === selectedCategory) && item.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map(service => (
                        <div
                          key={service.id}
                          onClick={() => {
                            setCart(prev => {
                              const match = prev.find(i => i.id === service.id);
                              if (match) {
                                return prev.map(i => i.id === service.id ? { ...i, qty: i.qty + 1 } : i);
                              }
                              return [...prev, { ...service, cartItemId: `srv_${Date.now()}`, qty: 1, notes: '' }];
                            });
                          }}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-sky-500 cursor-pointer overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
                        >
                          {service.imageUrl && (
                            <div className="relative h-28 w-full bg-slate-100 overflow-hidden shrink-0 border-b border-slate-200">
                              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs text-white bg-sky-600">
                                {service.department}
                              </span>
                              <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-xs text-white font-mono font-black text-xs">
                                {settings.currency} {service.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="p-3.5 flex-1 flex flex-col justify-center">
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{service.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{service.description}</p>
                          </div>
                          <div className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] bg-slate-50">
                            <span className="text-slate-500 font-medium">{service.category}</span>
                            <span className="text-sky-600 font-bold">+ Add to Folio</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Folio & Guest Ledger Sidebar */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg min-h-0">
              <div className="p-3.5 border-b border-slate-200 space-y-2.5 shrink-0 bg-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Guest Billing Assignment
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingMode('ROOM_FOLIO')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      bookingMode === 'ROOM_FOLIO' ? 'bg-sky-50 border-sky-600 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5 text-sky-600" />
                      <span>Room Folio</span>
                    </div>
                    {bookingMode === 'ROOM_FOLIO' && <Check className="h-3.5 w-3.5 text-sky-600 stroke-[3]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingMode('DIRECT_WALKIN')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      bookingMode === 'DIRECT_WALKIN' ? 'bg-sky-50 border-sky-600 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                      <span>Walk-In Guest</span>
                    </div>
                    {bookingMode === 'DIRECT_WALKIN' && <Check className="h-3.5 w-3.5 text-sky-600 stroke-[3]" />}
                  </button>
                </div>

                {bookingMode === 'ROOM_FOLIO' ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Assigned Room Unit:</label>
                    <select
                      value={selectedRoom.id}
                      onChange={(e) => {
                        const r = hotelRooms.find(rm => rm.id === e.target.value);
                        if (r) setSelectedRoom(r);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    >
                      {hotelRooms.map(rm => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name} - {rm.wing} [{rm.status}]
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={guestDetails.name}
                        onChange={e => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Guest Name"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        value={guestDetails.nights}
                        onChange={e => setGuestDetails(prev => ({ ...prev, nights: parseInt(e.target.value) || 1 }))}
                        placeholder="Nights"
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Walk-In / Spa Guest Name:</label>
                    <input
                      type="text"
                      value={guestDetails.name}
                      onChange={e => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Guest Name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResortFeeActive(!resortFeeActive)}
                    className={`py-1 px-2 rounded-lg border text-xs font-bold ${
                      resortFeeActive ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    Resort Fee (${settings.resortFee}): {resortFeeActive ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCityTaxActive(!cityTaxActive)}
                    className={`py-1 px-2 rounded-lg border text-xs font-bold ${
                      cityTaxActive ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    City Tax ({settings.cityTaxRate}%): {cityTaxActive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Folio Cart Line Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                    <Building className="h-10 w-10 mb-2 stroke-[1]" />
                    <p className="text-xs font-bold text-slate-600">Guest folio ticket is empty</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tap room rates, dining or spa services to post.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs font-mono font-bold text-sky-600 mt-0.5">
                            {settings.currency} {(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                            className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold"
                          >-</button>
                          <span className="text-xs font-bold w-5 text-center font-mono">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, qty: i.qty + 1 } : i))}
                            className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold"
                          >+</button>
                          <button
                            type="button"
                            onClick={() => setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId))}
                            className="h-6 w-6 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 flex items-center justify-center"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Totals & Post Charges */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{settings.currency} {cartSubtotal.toFixed(2)}</span>
                  </div>
                  {resortFeeActive && bookingMode === 'ROOM_FOLIO' && (
                    <div className="flex justify-between text-sky-700">
                      <span>Resort Amenities Fee</span>
                      <span className="font-mono">+{settings.currency} {cartResortFee.toFixed(2)}</span>
                    </div>
                  )}
                  {cityTaxActive && (
                    <div className="flex justify-between text-indigo-700">
                      <span>Occupancy / City Tax ({settings.cityTaxRate}%)</span>
                      <span className="font-mono">+{settings.currency} {cartCityTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>State Sales Tax ({settings.salesTaxRate}%)</span>
                    <span className="font-mono">+{settings.currency} {cartSalesTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Folio Charge</span>
                    <span className="font-mono text-base text-sky-600">{settings.currency} {cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handlePostFolioCharge}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  <span>Post Charges to Room Folio</span>
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setPaymentMethod('CARD');
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Direct Check-Out &amp; Settle</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROOM MANAGEMENT & OCCUPANCY */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hotel Rooms &amp; Suite Inventory</h2>
                <p className="text-xs text-slate-500">Live room occupancy, suite keys, and housekeeping refresh alerts.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddRoomModalOpen(true)}
                  className="px-3.5 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Room Unit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {hotelRooms.map(rm => {
                const isOccupied = rm.status === 'OCCUPIED';
                const isDirty = rm.status.includes('DIRTY');
                return (
                  <div
                    key={rm.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                      isOccupied ? 'border-sky-300 ring-2 ring-sky-500/10' : isDirty ? 'border-amber-300' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{rm.id}</span>
                          <h3 className="text-base font-black text-slate-900">{rm.name}</h3>
                          <p className="text-xs text-slate-500">{rm.wing}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOccupied ? 'bg-sky-100 text-sky-700' : isDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {rm.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-600 mt-3">
                        Base Rate: {settings.currency}{rm.rate.toFixed(2)}/night
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(rm);
                          setBookingMode('ROOM_FOLIO');
                          setActiveTab('pos');
                        }}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                      >
                        {isOccupied ? 'Open Guest Folio' : 'Assign / Check-In'}
                      </button>
                      {isDirty && (
                        <button
                          onClick={() => {
                            setHotelRooms(prev => prev.map(r => r.id === rm.id ? { ...r, status: 'VACANT' } : r));
                            recordAuditLog('HOUSEKEEPING_CLEARED', rm.id, `Room ${rm.name} marked inspected & ready for guests.`);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200"
                        >
                          Mark Clean
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GUEST FOLIOS & SETTLEMENT */}
        {activeTab === 'folios' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Active Guest Folios &amp; Check-Out Queue</h2>
                <p className="text-xs text-slate-500">Live guest ledgers, room charges, and final hotel checkout billing.</p>
              </div>
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                {activeFolios.length} Active Folios
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeFolios.length === 0 ? (
                <div className="col-span-full h-64 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Receipt className="h-10 w-10 mb-2 stroke-[1]" />
                  <p className="text-sm font-bold text-slate-700">No open guest folios</p>
                  <p className="text-xs mt-1">Post room nights or guest charges from the Front Desk POS.</p>
                </div>
              ) : (
                activeFolios.map(folio => {
                  const fin = calculateFolioFinancials(folio);
                  return (
                    <div key={folio.folioId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                              {folio.mode} • {folio.folioId}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">{folio.roomName}</h3>
                            <p className="text-xs text-slate-500">Guest: {folio.guestName} ({folio.nights || 1} Nights)</p>
                          </div>
                          <span className="text-lg font-black font-mono text-sky-600">
                            {settings.currency} {fin.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 my-3 space-y-1.5 text-xs max-h-40 overflow-y-auto border border-slate-100">
                          {folio.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-bold text-slate-800">{item.qty}x {item.name}</span>
                              <span className="font-mono text-slate-500">{settings.currency} {(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSettlingFolio(folio);
                            setPaymentMethod('CARD');
                            setCheckoutModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Check-Out &amp; Settle
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LINEN, AMENITIES & MINIBAR STOCK */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hotel Linen, Housekeeping &amp; Minibar Inventory</h2>
                <p className="text-xs text-slate-500">Track par levels for luxury bed sheets, bathrobes, keycards, and minibar refreshments.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4">Min. Threshold</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Asset Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {item.stock} {item.unit}
                        {item.stock <= item.threshold && (
                          <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded font-bold">Low Par</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.threshold} {item.unit}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{settings.currency} {item.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {settings.currency} {(item.stock * item.cost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: NIGHT AUDIT & CASHIER RECONCILIATION */}
        {activeTab === 'night_audit' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Night Audit &amp; Front Desk Balancing</h2>
                <p className="text-xs text-slate-500">Reconcile room revenues, city taxes, cash drawer floats, and roll over hotel business day.</p>
              </div>
              <button
                onClick={() => {
                  const closedShift = {
                    ...currentAuditShift,
                    closedAt: new Date().toLocaleTimeString(),
                    status: 'CLOSED'
                  };
                  triggerAutoPrint({
                    type: 'NIGHT_AUDIT_REPORT',
                    data: closedShift
                  }, `Shift ${closedShift.shiftId} Closed`);
                  alert('Night Audit completed. Z-Report printed.');
                }}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <Lock className="h-4 w-4" /> Run Night Audit &amp; Close Business Day
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Front Desk Float</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {settings.currency} {currentAuditShift.startingDrawer.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Settled Folios</p>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {folioTransactions.length} Invoices
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Revenue Collected</p>
                <p className="text-2xl font-black font-mono text-sky-600 mt-1">
                  {settings.currency} {folioTransactions.reduce((acc, t) => acc + t.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: HOTEL REVENUE REPORTS */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-black text-slate-900">Hotel Revenue &amp; Occupancy Reports</h2>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Settled Guest Check-Out Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date &amp; Time</th>
                      <th className="py-2.5 px-3">Room / Suite</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {folioTransactions.map(inv => (
                      <tr key={inv.invoiceNo} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{inv.invoiceNo}</td>
                        <td className="py-3 px-3 text-slate-500">{inv.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{inv.room}</td>
                        <td className="py-3 px-3 text-slate-700">{inv.guest}</td>
                        <td className="py-3 px-3">{inv.paymentMethod}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-sky-600">
                          {settings.currency} {inv.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CHECKOUT MODAL: FOLIO SETTLEMENT */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Settle Folio: {settlingFolio ? settlingFolio.roomName : selectedRoom.name}
              </h3>
              <button onClick={() => setCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const currentRef = settlingFolio || {
                items: cart,
                nights: guestDetails.nights,
                resortFeeActive,
                cityTaxActive,
                discountPercent
              };
              const fin = calculateFolioFinancials(currentRef);

              return (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['CARD', 'CASH', 'WIRE'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentMethod(type)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          paymentMethod === type ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Services Subtotal:</span>
                      <span className="font-mono">{settings.currency} {fin.subtotal.toFixed(2)}</span>
                    </div>
                    {fin.resortFee > 0 && (
                      <div className="flex justify-between text-sky-700">
                        <span>Resort Amenities Fee:</span>
                        <span className="font-mono">+{settings.currency} {fin.resortFee.toFixed(2)}</span>
                      </div>
                    )}
                    {fin.cityTax > 0 && (
                      <div className="flex justify-between text-indigo-700">
                        <span>City Bed Tax ({settings.cityTaxRate}%):</span>
                        <span className="font-mono">+{settings.currency} {fin.cityTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700">
                      <span>Sales Tax ({settings.salesTaxRate}%):</span>
                      <span className="font-mono">+{settings.currency} {fin.salesTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount Due:</span>
                      <span className="text-base font-mono text-sky-600">{settings.currency} {fin.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSettleFolio}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase"
                  >
                    Confirm Check-Out &amp; Print Final Folio
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* THERMAL PRINT SLIP RENDER CONTAINER */}
      <div id="thermal-print-area" className="hidden print:block w-full bg-white text-black p-4 font-mono leading-tight">
        {activePrintSlip && activePrintSlip.type === 'GUEST_FOLIO_INVOICE' && (
          <div className="space-y-3">
            <div className="text-center border-b-2 border-dashed border-black pb-2">
              <h2 className="font-black text-lg">{settings.hotelName}</h2>
              <p className="text-xs uppercase">{settings.tagline}</p>
              <p className="text-[10px] whitespace-pre-line mt-1">{settings.invoiceHeader}</p>
              <h3 className="font-black text-sm uppercase mt-2 border-y border-black py-1">
                GUEST FOLIO &amp; TAX INVOICE #{activePrintSlip.data.invoiceNo}
              </h3>
              <p className="text-xs font-bold mt-1">Room: {activePrintSlip.data.room} &bull; Guest: {activePrintSlip.data.guest}</p>
              <p className="text-[10px]">{activePrintSlip.data.date}</p>
            </div>

            <div className="py-2 border-b border-black space-y-1 text-xs">
              {activePrintSlip.data.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.qty}x {item.name}</span>
                  <span>{settings.currency} {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currency} {activePrintSlip.data.subtotal.toFixed(2)}</span>
              </div>
              {activePrintSlip.data.resortFee > 0 && (
                <div className="flex justify-between">
                  <span>Resort Fee:</span>
                  <span>+{settings.currency} {activePrintSlip.data.resortFee.toFixed(2)}</span>
                </div>
              )}
              {activePrintSlip.data.cityTax > 0 && (
                <div className="flex justify-between">
                  <span>City / Lodging Tax:</span>
                  <span>+{settings.currency} {activePrintSlip.data.cityTax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax:</span>
                <span>+{settings.currency} {activePrintSlip.data.salesTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-black">
                <span>TOTAL SETTLED:</span>
                <span>{settings.currency} {activePrintSlip.data.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span>PAYMENT METHOD:</span>
                <span>{activePrintSlip.data.paymentMethod}</span>
              </div>
            </div>

            <p className="text-center text-xs whitespace-pre-line pt-4 border-t border-dashed border-black">
              {settings.invoiceFooter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}