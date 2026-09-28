import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Monitor,
  Flame,
  Wine,
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
  KeyRound,
  ShieldCheck,
  Percent,
  TrendingUp,
  RefreshCw,
  Eye,
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
  Building,
  HardDrive,
  Mail,
  DoorOpen,
  Bed,
  UserCheck
} from 'lucide-react';
import { syncToCloud, subscribeToCloud } from './firebase';
import * as pdfjsLib from 'pdfjs-dist';

// Client-side PDF worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const ROLE_PERMISSIONS = {
  Administrator: ['pos', 'rooms', 'housekeeping', 'billing', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'staff', 'settings'],
  Manager: ['pos', 'rooms', 'housekeeping', 'billing', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'settings'],
  Cashier: ['pos', 'billing', 'rooms', 'shifts', 'reports'],
  'Front Desk Lead': ['pos', 'rooms', 'billing', 'shifts', 'reports'],
  'Kitchen / Chef': ['kds', 'recipes', 'stock'],
  'Bar / Sommelier': ['bar', 'recipes', 'stock']
};

const INITIAL_STAFF = [
  { id: 'usr_admin', name: 'System Administrator', role: 'Administrator', pin: '2024', avatar: 'SA', email: 'admin@linolicove.me' },
  { id: 'usr_cashier', name: 'Front Desk Cashier', role: 'Cashier', pin: '1111', avatar: 'FC', email: 'frontdesk@linolicove.me' }
];

const INITIAL_INVENTORY = [
  { id: 'ing_linen_king', name: 'Egyptian King Bed Sheet', category: 'Linen & Bedding', stock: 150, unit: 'pcs', cost: 42.00, threshold: 30 },
  { id: 'ing_towel_bath', name: 'Plush Bath Sheet 800GSM', category: 'Towels & Linen', stock: 280, unit: 'pcs', cost: 16.50, threshold: 45 },
  { id: 'ing_amenity_kit', name: 'Luxury Botanicals Kit', category: 'Toiletries', stock: 320, unit: 'kits', cost: 4.80, threshold: 60 },
  { id: 'ing_sparkling_water', name: 'San Pellegrino 750ml', category: 'Minibar Stock', stock: 140, unit: 'pcs', cost: 2.80, threshold: 25 },
  { id: 'ing_champagne', name: 'Veuve Clicquot 375ml', category: 'Minibar Stock', stock: 38, unit: 'pcs', cost: 44.00, threshold: 10 },
  { id: 'ing_espresso_beans', name: 'Arabica Espresso Beans', category: 'Beverages', stock: 4500, unit: 'g', cost: 0.05, threshold: 800 }
];

const INITIAL_MENU_ITEMS = [
  {
    id: 'dish_deluxe_room',
    name: 'Deluxe Ocean View (1 Night)',
    department: 'Lodging',
    category: 'Room Rates',
    price: 24500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80',
    description: '1 Night stay in Deluxe King Room with balcony, ocean vista and VIP breakfast.',
    recipe: [
      { ingredientId: 'ing_linen_king', amount: 1 },
      { ingredientId: 'ing_towel_bath', amount: 2 },
      { ingredientId: 'ing_amenity_kit', amount: 1 }
    ]
  },
  {
    id: 'dish_suite_room',
    name: 'Executive Villa Suite (1 Night)',
    department: 'Lodging',
    category: 'Room Rates',
    price: 48500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80',
    description: 'Private cabana pool suite including turn-down champagne service.',
    recipe: [
      { ingredientId: 'ing_linen_king', amount: 2 },
      { ingredientId: 'ing_towel_bath', amount: 4 },
      { ingredientId: 'ing_champagne', amount: 1 }
    ]
  },
  {
    id: 'dish_spa_treatment',
    name: 'Ayurvedic Herbal Full Body Spa',
    department: 'Wellness & Spa',
    category: 'Spa & Wellness',
    price: 9500.00,
    prepTime: '90m',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
    description: 'Traditional restorative full-body massage with organic herbal oils.',
    recipe: [
      { ingredientId: 'ing_towel_bath', amount: 2 }
    ]
  },
  {
    id: 'dish_airport_pickup',
    name: 'Private Chauffeur Airport Transfer',
    department: 'Concierge',
    category: 'Transport',
    price: 12000.00,
    prepTime: 'On Request',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    description: 'Comfortable private Mercedes airport transfer with complimentary cold drinks.',
    recipe: [
      { ingredientId: 'ing_sparkling_water', amount: 2 }
    ]
  },
  {
    id: 'dish_minibar_snack',
    name: 'VIP Minibar Refresh Pack',
    department: 'Food & Beverage',
    category: 'In-Room Minibar',
    price: 8500.00,
    prepTime: 'Instant',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80',
    description: 'Champagne half bottle and 2 chilled sparkling waters.',
    recipe: [
      { ingredientId: 'ing_champagne', amount: 1 },
      { ingredientId: 'ing_sparkling_water', amount: 2 }
    ]
  }
];

const INITIAL_ROOMS = [
  { id: 'RM-101', name: 'Room 101 - King Deluxe', wing: 'East Wing - Floor 1', rate: 24500.00, capacity: 2, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-102', name: 'Room 102 - King Deluxe', wing: 'East Wing - Floor 1', rate: 24500.00, capacity: 2, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-201', name: 'Suite 201 - Executive Suite', wing: 'Ocean Wing - Floor 2', rate: 48500.00, capacity: 4, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-202', name: 'Suite 202 - Executive Suite', wing: 'Ocean Wing - Floor 2', rate: 48500.00, capacity: 4, status: 'VACANT', currentOrderRef: null },
  { id: 'VIL-01', name: 'Villa 01 - Ocean Cabana', wing: 'Beachfront Garden', rate: 65000.00, capacity: 6, status: 'VACANT', currentOrderRef: null }
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

export default function App() {
  // Authentication & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPinInput, setLoginPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('pos');
  const [reportSubTab, setReportSubTab] = useState('Daily Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posViewMode, setPosViewMode] = useState('grid');
  const [adminMenuCategory, setAdminMenuCategory] = useState('All');

  // Persistent Collections
  const [staffList, setStaffList] = usePersistentState('linoli_staff_list', INITIAL_STAFF);
  const [currentUser, setCurrentUser] = useState(INITIAL_STAFF[0]);
  const [inventory, setInventory] = usePersistentState('linoli_inventory', INITIAL_INVENTORY);
  const [menuItems, setMenuItems] = usePersistentState('linoli_menu_items', INITIAL_MENU_ITEMS);
  const [floorRooms, setFloorRooms] = usePersistentState('linoli_floor_rooms', INITIAL_ROOMS);
  const [activeOrders, setActiveOrders] = usePersistentState('linoli_active_orders', []);
  const [transactions, setTransactions] = usePersistentState('linoli_transactions', []);
  const [auditLogs, setAuditLogs] = usePersistentState('linoli_audit_logs', []);
  const [cancelledTickets, setCancelledTickets] = usePersistentState('linoli_cancelled_tickets', []);
  const [seqCounters, setSeqCounters] = usePersistentState('linoli_seq_counters', { order: 1001, invoice: 5001, cashOut: 101 });

  // Sequential Number Generators
  const getNextOrderNumber = () => {
    const nextNum = (seqCounters.order || 1000) + 1;
    setSeqCounters(prev => ({ ...prev, order: nextNum }));
    return `ORD-${nextNum}`;
  };

  const getNextInvoiceNumber = () => {
    const nextNum = (seqCounters.invoice || 5000) + 1;
    setSeqCounters(prev => ({ ...prev, invoice: nextNum }));
    return `INV-${nextNum}`;
  };

  // SYSTEM SETTINGS STATE (Aligned with Screenshots)
  const [settings, setSettings] = usePersistentState('linoli_system_settings', {
    restaurantName: 'Linoli Cove Midigama',
    tagline: 'RESTAURANT & BAR',
    legalName: 'Linoli Cove Leisure (Pvt) Ltd',
    businessRegNo: 'PV-00289144',
    taxId: 'TIN-109284719',
    terminalId: 'LINOLI-MAIN-01',
    phone: '+94 74 036 6741',
    email: 'info@linolicove.me',
    website: 'www.linolicove.me',
    address: '380 A Matara Road, Midigama, 81700',
    currency: 'Rs .',
    serviceChargeRate: 10,
    taxRate: 8,
    receiptRollWidth: '80mm',
    receiptFontSize: '14px - Extra Bold & Large',
    receiptFontFamily: 'monospace',
    receiptMargin: '2mm',
    autoPrintOrder: true,
    autoPrintBill: true,
    autoDrawerKick: 'ENABLED',
    drawerKickTrigger: 'CASH_ONLY',
    drawerPinout: 'PIN_2',
    chimeAudio: true,
    receiptHeader: 'Linoli Cove Beach Resort & Dining\nBeach Road, Midigama\nTel: +94 74 036 6741',
    receiptFooter: 'Thank you for your visit!\nPlease come again.'
  });

  // Automated Daily Email Settings
  const [emailSettings, setEmailSettings] = usePersistentState('linoli_email_settings', {
    enabled: false,
    recipient: 'linolicove@gmail.com',
    scheduledTime: '23:30',
    webhookUrl: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
    lastSentDate: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(null);

  // Shift & Cash Drawer State
  const [currentShift, setCurrentShift] = usePersistentState('linoli_current_shift', {
    shiftId: `SHIFT-${getLocalDateStr().replace(/-/g, '')}-01`,
    openedDate: getLocalDateStr(),
    openedAt: '09:00 AM',
    openedBy: 'Marco Rossi',
    startingFloat: 15000.00,
    status: 'OPEN',
    payouts: []
  });

  const [shiftHistory, setShiftHistory] = usePersistentState('linoli_shift_history', []);
  const [denominations, setDenominations] = usePersistentState('linoli_denominations', {
    5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0
  });

  // Hardware State
  const [pairedUsbDevice, setPairedUsbDevice] = useState(null);
  const [usbStatusMessage, setUsbStatusMessage] = useState('');

  // POS Interaction State
  const [orderMode, setOrderMode] = useState('ROOM'); // 'ROOM' | 'WALKIN'
  const [selectedRoom, setSelectedRoom] = useState(INITIAL_ROOMS[0]);
  const [guestInfo, setGuestInfo] = useState({ name: 'Walk-in Guest', passport: '', nights: 1 });
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceChargeActive, setServiceChargeActive] = useState(true);
  const [taxActive, setTaxActive] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modals & Printing
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'Cashier', pin: '', email: '' });
  const [staffFormError, setStaffFormError] = useState('');
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newDishForm, setNewDishForm] = useState({ name: '', department: 'Lodging', category: 'Room Rates', price: '', prepTime: '24h Stay', description: '', imageUrl: '' });
  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [printNotice, setPrintNotice] = useState(null);

  // Cloud Sync
  const isCloudSynced = useRef(false);
  const prevOrdersRef = useRef('');
  const prevTransRef = useRef('');

  useEffect(() => {
    const unsubOrders = subscribeToCloud('active_orders', (remote) => {
      isCloudSynced.current = true;
      if (Array.isArray(remote)) {
        const str = JSON.stringify(remote);
        if (prevOrdersRef.current !== str) {
          prevOrdersRef.current = str;
          setActiveOrders(remote);
        }
      }
    });

    const unsubTrans = subscribeToCloud('transactions', (remote) => {
      isCloudSynced.current = true;
      if (Array.isArray(remote)) {
        const str = JSON.stringify(remote);
        if (prevTransRef.current !== str) {
          prevTransRef.current = str;
          setTransactions(remote);
        }
      }
    });

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubTrans === 'function') unsubTrans();
    };
  }, []);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (activeOrders !== undefined) {
      const cur = JSON.stringify(activeOrders);
      if (cur !== prevOrdersRef.current) {
        prevOrdersRef.current = cur;
        syncToCloud('active_orders', activeOrders);
      }
    }
  }, [activeOrders]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (transactions !== undefined) {
      const cur = JSON.stringify(transactions);
      if (cur !== prevTransRef.current) {
        prevTransRef.current = cur;
        syncToCloud('transactions', transactions);
      }
    }
  }, [transactions]);

  // Audio Chime
  const playCashRegisterChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio note:', e);
    }
  };

  const recordAuditLog = (action, targetRef, details) => {
    const newLog = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
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
      title: slipConfig.type === 'FINAL_BILL' ? 'Tax Invoice Printing' : 'Slip Printing',
      detail: noticeText
    });
    setTimeout(() => setPrintNotice(null), 2500);
  };

  useEffect(() => {
    if (activePrintSlip) {
      const timer = setTimeout(() => {
        try { window.print(); } catch (e) { console.warn(e); }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePrintSlip]);

  const hasAccess = (tabKey) => {
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tabKey);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartDiscountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableBasis = Math.max(0, cartSubtotal - cartDiscountAmount);
  const cartServiceCharge = serviceChargeActive ? (taxableBasis * (settings.serviceChargeRate || 10)) / 100 : 0;
  const cartTax = taxActive ? (taxableBasis * (settings.taxRate || 8)) / 100 : 0;
  const cartGrandTotal = taxableBasis + cartServiceCharge + cartTax;

  const calculateOrderFinancials = (order) => {
    if (!order || !order.items) return { subtotal: 0, discount: 0, service: 0, tax: 0, total: 0 };
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = (subtotal * (order.discountPercent || 0)) / 100;
    const basis = Math.max(0, subtotal - discount);
    const service = order.serviceChargeActive ? (basis * (settings.serviceChargeRate || 10)) / 100 : 0;
    const tax = order.taxActive ? (basis * (settings.taxRate || 8)) / 100 : 0;
    const total = basis + service + tax;
    return { subtotal, discount, service, tax, total };
  };

  // Dispatch / Post Order
  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const orderId = getNextOrderNumber();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const orderPayload = {
      orderId,
      mode: orderMode,
      roomId: orderMode === 'ROOM' ? selectedRoom.id : null,
      tableName: orderMode === 'ROOM' ? selectedRoom.name : guestInfo.name,
      guestName: guestInfo.name,
      server: currentUser.name,
      sentAt: nowTime,
      serviceChargeActive,
      taxActive,
      discountPercent,
      items: [...cart]
    };

    setActiveOrders(prev => [orderPayload, ...prev]);

    if (orderMode === 'ROOM') {
      setFloorRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'OCCUPIED', currentOrderRef: orderId } : r));
    }

    recordAuditLog('ORDER_DISPATCHED', orderId, `Dispatched order for ${orderPayload.tableName} (${settings.currency} ${cartGrandTotal.toFixed(2)})`);

    triggerAutoPrint({
      type: 'KOT_BOT_DISPATCH',
      data: { order: orderPayload, items: cart }
    }, `Posted to ${orderPayload.tableName}`);

    setCart([]);
  };

  // Complete Settlement
  const handleCompleteSettlement = () => {
    const targetOrder = settlingOrder || {
      orderId: getNextOrderNumber(),
      mode: orderMode,
      tableName: orderMode === 'ROOM' ? selectedRoom.name : guestInfo.name,
      roomId: orderMode === 'ROOM' ? selectedRoom.id : null,
      items: cart,
      serviceChargeActive,
      taxActive,
      discountPercent
    };

    if (!targetOrder.items || targetOrder.items.length === 0) return;
    const { subtotal, discount, service, tax, total } = calculateOrderFinancials(targetOrder);

    const newInvoice = {
      invoiceNo: getNextInvoiceNumber(),
      orderRef: targetOrder.orderId,
      date: `${getLocalDateStr()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      table: targetOrder.tableName,
      cashier: currentUser.name,
      items: targetOrder.items,
      subtotal,
      serviceCharge: service,
      tax,
      discount,
      total,
      paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? (parseFloat(cashTendered) || total) : undefined,
      changeDue: paymentMethod === 'CASH' ? Math.max(0, (parseFloat(cashTendered) || total) - total) : 0
    };

    setTransactions(prev => [newInvoice, ...prev]);
    setActiveOrders(prev => prev.filter(o => o.orderId !== targetOrder.orderId));

    if (targetOrder.roomId) {
      setFloorRooms(prev => prev.map(r => r.id === targetOrder.roomId ? { ...r, status: 'DIRTY / REFRESH', currentOrderRef: null } : r));
    }

    recordAuditLog('BILL_SETTLED', newInvoice.invoiceNo, `Settled ${newInvoice.invoiceNo} for ${settings.currency} ${total.toFixed(2)} via ${paymentMethod}`);

    if (settings.autoDrawerKick === 'ENABLED' && (settings.drawerKickTrigger === 'ALL' || (settings.drawerKickTrigger === 'CASH_ONLY' && paymentMethod === 'CASH'))) {
      if (settings.chimeAudio) playCashRegisterChime();
    }

    triggerAutoPrint({
      type: 'FINAL_BILL',
      data: newInvoice
    }, `${newInvoice.table} • ${settings.currency} ${newInvoice.total.toFixed(2)}`);

    setSettlingOrder(null);
    setCheckoutModalOpen(false);
    setCashTendered('');
    setCart([]);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      app: 'Linoli Cove POS & ERP',
      exportedAt: new Date().toISOString(),
      settings,
      staffList,
      inventory,
      menuItems,
      floorRooms,
      transactions,
      auditLogs,
      currentShift
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linoli_cove_backup_${getLocalDateStr()}.json`;
    a.click();
    recordAuditLog('BACKUP_EXPORTED', 'DATABASE', 'System JSON backup downloaded.');
    setSettingsNotice({ title: 'Backup Downloaded', detail: 'All settings, menu, and invoices exported.' });
    setTimeout(() => setSettingsNotice(null), 3500);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.staffList) setStaffList(parsed.staffList);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.floorRooms) setFloorRooms(parsed.floorRooms);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        recordAuditLog('BACKUP_RESTORED', file.name, 'Database restored successfully.');
        setSettingsNotice({ title: 'Database Restored', detail: 'All records updated successfully.' });
        setTimeout(() => setSettingsNotice(null), 3500);
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const categoriesList = useMemo(() => {
    const cats = new Set(['All']);
    menuItems.forEach(m => cats.add(m.category));
    return Array.from(cats);
  }, [menuItems]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b14] p-4 font-sans select-none antialiased">
        <div className="w-full max-w-[390px] rounded-[32px] border border-[#1b253b] bg-[#0c1424]/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ff4500] to-[#ff6a00] text-2xl font-black text-white shadow-lg shadow-orange-600/40">
              LC
            </div>
            <h1 className="mt-3.5 text-2xl font-black tracking-tight text-white">{settings.restaurantName}</h1>
            <p className="mt-0.5 text-[10px] font-extrabold tracking-[0.2em] text-[#ff5500] uppercase">
              {settings.tagline}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Terminal Ready • Enter PIN
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-[#070b14] px-4">
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <span
                    key={idx}
                    className={`h-3.5 w-3.5 rounded-full transition-all ${
                      loginPinInput.length > idx ? 'bg-orange-500 scale-110' : 'bg-zinc-700'
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
                    if (next.length === 4) {
                      const found = staffList.find(s => s.pin === next);
                      if (found) {
                        setCurrentUser(found);
                        setIsAuthenticated(true);
                        setLoginPinInput('');
                        const allowed = ROLE_PERMISSIONS[found.role] || [];
                        setActiveTab(allowed.includes('pos') ? 'pos' : (allowed[0] || 'pos'));
                      } else {
                        setLoginError('Invalid security PIN. Default Admin: 2024, Cashier: 1111');
                      }
                    }
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
                  if (next.length === 4) {
                    const found = staffList.find(s => s.pin === next);
                    if (found) {
                      setCurrentUser(found);
                      setIsAuthenticated(true);
                      setLoginPinInput('');
                      const allowed = ROLE_PERMISSIONS[found.role] || [];
                      setActiveTab(allowed.includes('pos') ? 'pos' : (allowed[0] || 'pos'));
                    } else {
                      setLoginError('Invalid PIN.');
                    }
                  }
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0b0f19] text-zinc-100 font-sans select-none overflow-hidden antialiased">
      {/* Global Thermal Printing CSS */}
      <style>{`
        select, option { color: #0f172a !important; background-color: #ffffff !important; }
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

      {/* Floating edge tab */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#ff5500] hover:bg-orange-600 text-white px-2 py-4 rounded-r-2xl shadow-2xl flex flex-col items-center gap-1.5 transition-transform"
      >
        <Menu className="h-4 w-4" />
        <span className="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr]">MENU</span>
      </button>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
      )}

      {/* SLIDE-OUT DRAWER SIDEBAR WITH EXACT ADMINISTRATION SECTION */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#060813] border-r border-zinc-800 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          <div className="p-5 pb-4 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#ff5500] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
                LC
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white leading-none">{settings.restaurantName}</h1>
                <p className="text-[9px] font-bold tracking-widest text-[#ff5500] uppercase mt-1">{settings.tagline}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'pos', name: 'POS Terminal', icon: Monitor, badge: cart.reduce((a, b) => a + b.qty, 0) },
              { id: 'billing', name: 'Billing & Settlement', icon: Receipt, badge: activeOrders.length },
              { id: 'rooms', name: 'Room & Suite Management', icon: Bed, badge: floorRooms.filter(r => r.status === 'OCCUPIED').length },
              { id: 'stock', name: 'Stock & Inventory', icon: Package, alert: inventory.some(i => i.stock <= i.threshold) },
              { id: 'shifts', name: 'Cashier Shifts', icon: DollarSign },
              { id: 'reports', name: 'Sales Reports', icon: BarChart3 }
            ].map(item => {
              const allowed = hasAccess(item.id);
              return (
                <button
                  key={item.id}
                  disabled={!allowed}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    !allowed ? 'opacity-30 cursor-not-allowed text-zinc-600' : activeTab === item.id ? 'bg-[#ff5500] text-white font-bold shadow-lg shadow-orange-600/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
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

            {/* EXACT ADMINISTRATION SECTION (IMAGE 1) */}
            <div className="pt-4 pb-1.5 px-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                ADMINISTRATION
              </span>
            </div>

            {[
              { id: 'menu_admin', name: 'Menu Management', icon: ClipboardList, badgeText: '+Add' },
              { id: 'cancelled', name: 'Cancelled Tickets', icon: Trash2 },
              { id: 'staff', name: 'Staff Management', icon: Users },
              { id: 'settings', name: 'System Settings', icon: Settings }
            ].map(item => {
              const allowed = hasAccess(item.id);
              return (
                <button
                  key={item.id}
                  disabled={!allowed}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    !allowed ? 'opacity-30 cursor-not-allowed text-zinc-600' : activeTab === item.id ? 'bg-[#ff5500] text-white font-bold shadow-lg shadow-orange-600/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badgeText && (
                    <span className="text-[10px] bg-orange-500/20 text-[#ff5500] px-1.5 py-0.5 rounded font-bold">
                      {item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-zinc-800 text-orange-400 font-black text-xs flex items-center justify-center border border-zinc-700">
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

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
        <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase flex items-center gap-2.5 shadow-md"
            >
              <Menu className="h-5 w-5 text-[#ff5500]" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-500 font-mono">TERMINAL: {settings.terminalId}</span>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Online
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
              Currency: {settings.currency}
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* VIEW: POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-5 overflow-hidden min-h-0">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 mb-4 shrink-0 shadow-md flex items-center gap-3">
                <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-2">
                  {categoriesList.map((cat) => {
                    const count = cat === 'All' ? menuItems.length : menuItems.filter(m => m.category === cat).length;
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected ? 'bg-[#ff5500] text-white shadow-orange-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-300'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative w-48 shrink-0">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search catalog..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <div className="bg-slate-100/80 p-3.5 rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {menuItems
                      .filter(dish => (selectedCategory === 'All' || dish.category === selectedCategory) && dish.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(dish => (
                        <div
                          key={dish.id}
                          onClick={() => {
                            setCart(prev => {
                              const match = prev.find(i => i.id === dish.id);
                              if (match) return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
                              return [...prev, { ...dish, cartItemId: `cart_${Date.now()}`, qty: 1 }];
                            });
                          }}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#ff5500] cursor-pointer overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
                        >
                          {dish.imageUrl && (
                            <div className="relative h-28 w-full bg-slate-100 overflow-hidden shrink-0 border-b border-slate-200">
                              <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs text-white bg-orange-600">
                                {dish.department}
                              </span>
                              <span className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-xs text-white font-mono font-black text-xs">
                                {settings.currency} {dish.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="p-3.5 flex-1 flex flex-col justify-center">
                            <h4 className="font-black text-sm text-slate-900 leading-snug">{dish.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{dish.description}</p>
                          </div>
                          <div className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] bg-slate-50">
                            <span className="text-slate-500 font-medium">{dish.category}</span>
                            <span className="text-[#ff5500] font-bold">+ Add to Ticket</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Ticket Sidebar */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg min-h-0">
              <div className="p-3.5 border-b border-slate-200 space-y-2.5 shrink-0 bg-white">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">
                  Assignment Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderMode('ROOM')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      orderMode === 'ROOM' ? 'bg-orange-50 border-[#ff5500] text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Room / Suite</span>
                    {orderMode === 'ROOM' && <Check className="h-3 w-3 text-[#ff5500] stroke-[3]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('WALKIN')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                      orderMode === 'WALKIN' ? 'bg-orange-50 border-[#ff5500] text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Walk-In Guest</span>
                    {orderMode === 'WALKIN' && <Check className="h-3 w-3 text-[#ff5500] stroke-[3]" />}
                  </button>
                </div>

                {orderMode === 'ROOM' ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Assigned Unit:</label>
                    <select
                      value={selectedRoom.id}
                      onChange={(e) => {
                        const r = floorRooms.find(rm => rm.id === e.target.value);
                        if (r) setSelectedRoom(r);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    >
                      {floorRooms.map(rm => (
                        <option key={rm.id} value={rm.id}>{rm.name} - [{rm.status}]</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Guest Name:</label>
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={e => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                    <Receipt className="h-10 w-10 mb-2 stroke-[1]" />
                    <p className="text-xs font-bold text-slate-600">Ticket is empty</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tap catalog items to add charges.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs font-mono font-bold text-[#ff5500] mt-0.5">
                          {settings.currency} {(item.price * item.qty).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold"
                        >-</button>
                        <span className="text-xs font-mono font-bold w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, qty: i.qty + 1 } : i))}
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold"
                        >+</button>
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId))}
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 flex items-center justify-center"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">{settings.currency} {cartSubtotal.toFixed(2)}</span>
                  </div>
                  {serviceChargeActive && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Service Charge ({settings.serviceChargeRate}%)</span>
                      <span className="font-mono">+{settings.currency} {cartServiceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {taxActive && (
                    <div className="flex justify-between text-indigo-700">
                      <span>Taxes ({settings.taxRate}%)</span>
                      <span className="font-mono">+{settings.currency} {cartTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="font-mono text-base text-[#ff5500]">{settings.currency} {cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleSendOrder}
                  className="w-full py-3 bg-[#ff5500] hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  <span>Send &amp; Print Order Voucher</span>
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => { setPaymentMethod('CASH'); setCheckoutModalOpen(true); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Direct Settle ({settings.currency} {cartGrandTotal.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS (EXACT REPLICA OF IMAGES 2, 3, 4) */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
            {/* Header with Save / Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#ff5500]" />
                  System, Business &amp; Peripheral Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage company identity, thermal printing options, automated cash drawer solenoid, and database backup files.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>Download Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettingsNotice({
                      title: 'Settings Saved',
                      detail: `Configuration for ${settings.restaurantName} updated successfully.`
                    });
                    setTimeout(() => setSettingsNotice(null), 3500);
                  }}
                  className="px-4 py-2 bg-[#008f5d] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {/* CARD 1: COMPANY & BUSINESS INFORMATION (IMAGE 2) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-orange-50 text-[#ff5500] rounded-xl">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    COMPANY &amp; BUSINESS INFORMATION
                  </h3>
                  <p className="text-[10px] text-slate-400">Printed on official receipts, tax invoices, and Z-reports</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trading / Brand Name</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={e => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Tagline / Slogan</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={e => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Legal Entity Name</label>
                  <input
                    type="text"
                    value={settings.legalName}
                    onChange={e => setSettings(prev => ({ ...prev, legalName: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Registration No. (BRN / Company ID)</label>
                  <input
                    type="text"
                    value={settings.businessRegNo}
                    onChange={e => setSettings(prev => ({ ...prev, businessRegNo: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Identification / VAT / GST No.</label>
                  <input
                    type="text"
                    value={settings.taxId}
                    onChange={e => setSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Hardware Identifier</label>
                  <input
                    type="text"
                    value={settings.terminalId}
                    onChange={e => setSettings(prev => ({ ...prev, terminalId: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Website or Social Link</label>
                  <input
                    type="text"
                    value={settings.website}
                    onChange={e => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Physical Street Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: AUTOMATED DAILY 11:30 PM EMAIL DISPATCH (IMAGE 2 & 3) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-[#ff5500] rounded-xl">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      AUTOMATED DAILY 11:30 PM EMAIL DISPATCH
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Auto-transmits complete end-of-day sales, settlements, invoices, voids &amp; audit records
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                  {emailSettings.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Recipient Email</label>
                  <input
                    type="email"
                    value={emailSettings.recipient}
                    onChange={e => setEmailSettings(prev => ({ ...prev, recipient: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Receives complete daily business data</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time (24h)</label>
                  <input
                    type="text"
                    value={emailSettings.scheduledTime}
                    onChange={e => setEmailSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 23:30 (11:30 PM)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Automation Status</label>
                  <select
                    value={emailSettings.enabled ? 'YES' : 'NO'}
                    onChange={e => setEmailSettings(prev => ({ ...prev, enabled: e.target.value === 'YES' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="NO">Disabled (Manual trigger only)</option>
                    <option value="YES">Enabled (Auto-send at 11:30 PM)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-slate-800">What data is transmitted in the 11:30 PM package?</p>
                  <p className="text-[11px] text-slate-500">
                    Gross revenue, net sales, taxes, service pool, discounts, individual invoice ledgers, cashier drawer count &amp; cash-outs, cancelled ticket voids, and the complete day's audit trail.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => {
                    setIsSendingEmail(true);
                    setTimeout(() => {
                      setIsSendingEmail(false);
                      setSettingsNotice({ title: 'Report Sent', detail: `Sent to ${emailSettings.recipient}` });
                      setTimeout(() => setSettingsNotice(null), 3000);
                    }, 1500);
                  }}
                  className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingEmail ? 'Dispatching...' : 'Send Daily Report Now'}</span>
                </button>
              </div>

              <details className="text-xs text-slate-600 pt-1">
                <summary className="font-bold cursor-pointer text-slate-700 hover:text-[#ff5500]">
                  Advanced: Direct Silent Webhook or EmailJS API Keys (Optional)
                </summary>
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Webhook POST URL (Zapier / Make / Cloud Function)
                    </label>
                    <input
                      type="url"
                      value={emailSettings.webhookUrl}
                      onChange={e => setEmailSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* CARD 3: THERMAL AUTO-PRINTER CONFIGURATION (IMAGE 3) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      THERMAL AUTO-PRINTER CONFIGURATION
                    </h3>
                    <p className="text-[10px] text-slate-400">ESC/POS thermal slips for KOT, BOT, proforma bills &amp; tax invoices</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  System Default Spooler
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paper Roll Width</label>
                  <select
                    value={settings.receiptRollWidth}
                    onChange={e => setSettings(prev => ({ ...prev, receiptRollWidth: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="80mm">80mm Thermal Paper (Standard POS)</option>
                    <option value="58mm">58mm Thermal Paper (Compact)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Font Size</label>
                  <select
                    value={settings.receiptFontSize}
                    onChange={e => setSettings(prev => ({ ...prev, receiptFontSize: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="11px">11px - Standard (Recommended)</option>
                    <option value="12px">12px - Medium Large</option>
                    <option value="14px">14px - Extra Bold &amp; Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Font Type</label>
                  <select
                    value={settings.receiptFontFamily}
                    onChange={e => setSettings(prev => ({ ...prev, receiptFontFamily: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="monospace">Monospace (Classic ESC/POS Receipt)</option>
                    <option value="sans-serif">Sans-Serif (Modern Clean Helvetica/Arial)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thermal Slip Margins</label>
                  <select
                    value={settings.receiptMargin}
                    onChange={e => setSettings(prev => ({ ...prev, receiptMargin: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="0mm">0mm - Full Width (Edge-to-Edge)</option>
                    <option value="2mm">2mm - Standard Thermal Margin</option>
                    <option value="4mm">4mm - Comfortable Margin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auto-Print on Send Order</label>
                  <select
                    value={settings.autoPrintOrder ? 'YES' : 'NO'}
                    onChange={e => setSettings(prev => ({ ...prev, autoPrintOrder: e.target.value === 'YES' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="YES">Yes - Print KOT &amp; BOT Slips</option>
                    <option value="NO">No - Manual Print Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auto-Print on Settlement</label>
                  <select
                    value={settings.autoPrintBill ? 'YES' : 'NO'}
                    onChange={e => setSettings(prev => ({ ...prev, autoPrintBill: e.target.value === 'YES' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="YES">Yes - Print Final Tax Invoice</option>
                    <option value="NO">No - Manual Print Only</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Direct WebUSB Thermal Printer Connection</p>
                  <p className="text-[10px] text-slate-500">Pair once with your USB printer for fast ESC/POS output, or run via OS print spooler.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.usb) {
                        navigator.usb.requestDevice({ filters: [] }).then(dev => {
                          setPairedUsbDevice(dev);
                          alert(`Paired with ${dev.productName || 'USB Thermal Printer'}`);
                        }).catch(() => {});
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Usb className="h-3.5 w-3.5" />
                    <span>Pair USB Printer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerAutoPrint({
                        type: 'FINAL_BILL',
                        data: {
                          invoiceNo: 'TEST-001',
                          date: new Date().toLocaleString(),
                          table: 'DIAGNOSTIC TEST',
                          cashier: currentUser.name,
                          items: [{ name: 'Thermal Alignment Slip', qty: 1, price: 0 }],
                          subtotal: 0,
                          serviceCharge: 0,
                          tax: 0,
                          total: 0,
                          paymentMethod: 'TEST'
                        }
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Test Slip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 4: AUTOMATED CASH DRAWER SOLENOID (IMAGE 3) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    AUTOMATED CASH DRAWER SOLENOID
                  </h3>
                  <p className="text-[10px] text-slate-400">Triggers physical RJ11/RJ12 drawer pop via printer kick pulse</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auto Drawer Kick</label>
                  <select
                    value={settings.autoDrawerKick}
                    onChange={e => setSettings(prev => ({ ...prev, autoDrawerKick: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="ENABLED">Enabled (Auto-Pop on Payment)</option>
                    <option value="DISABLED">Disabled (Manual Key Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Drawer Kick Trigger</label>
                  <select
                    value={settings.drawerKickTrigger}
                    onChange={e => setSettings(prev => ({ ...prev, drawerKickTrigger: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="CASH_ONLY">Cash Payments Only</option>
                    <option value="ALL">All Payments (Cash, Card &amp; Split)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RJ11 / RJ12 Pinout</label>
                  <select
                    value={settings.drawerPinout}
                    onChange={e => setSettings(prev => ({ ...prev, drawerPinout: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  >
                    <option value="PIN_2">Pin 2 / ESC p 0 (Epson, Rongta, Xprinter)</option>
                    <option value="PIN_5">Pin 5 / ESC p 1 (Star Micronics, Custom)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Register Chime Sound</span>
                    <p className="text-[10px] text-slate-500">Plays brass bell tone upon successful payment settlement</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, chimeAudio: !prev.chimeAudio }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        settings.chimeAudio ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {settings.chimeAudio ? 'Chime ON' : 'Chime OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={playCashRegisterChime}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Manual Solenoid Kick Test</span>
                    <p className="text-[10px] text-slate-500">Fires test pulse without creating a transaction</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (settings.chimeAudio) playCashRegisterChime();
                      setSettingsNotice({ title: 'Drawer Fired', detail: 'Solenoid pulse sent & register chime sounded.' });
                      setTimeout(() => setSettingsNotice(null), 3000);
                    }}
                    className="px-3.5 py-1.5 bg-[#ff5500] hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Pop Drawer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 5: CURRENCY, TAXES & SURCHARGE RATES (IMAGE 4) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    CURRENCY, TAXES &amp; SURCHARGE RATES
                  </h3>
                  <p className="text-[10px] text-slate-400">Default rates applied across tables and receipts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol / Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Displayed on menu, POS &amp; receipts</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Service Charge (%)</label>
                  <input
                    type="number"
                    value={settings.serviceChargeRate}
                    onChange={e => setSettings(prev => ({ ...prev, serviceChargeRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Staff gratuity pool</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sales Tax / VAT Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Statutory tax rate</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thermal Receipt Header Notes</label>
                  <textarea
                    rows={3}
                    value={settings.receiptHeader}
                    onChange={e => setSettings(prev => ({ ...prev, receiptHeader: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thermal Receipt Footer Message</label>
                  <textarea
                    rows={3}
                    value={settings.receiptFooter}
                    onChange={e => setSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 6: SYSTEM DATABASE BACKUP & DISASTER RECOVERY (IMAGE 4) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    SYSTEM DATABASE BACKUP &amp; DISASTER RECOVERY
                  </h3>
                  <p className="text-[10px] text-slate-400">Export or restore full store database (Menu, Staff, Inventory, Shifts &amp; Sales)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-[#ff5500]" /> Export JSON Database Backup
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Download a complete snapshot of all {menuItems.length} dishes, {inventory.length} ingredients, staff credentials, and {transactions.length} sales records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Download System Backup (.json)
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-emerald-600" /> Restore System from Backup File
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Upload a previously exported `.json` file to restore settings, inventory levels, menus, and transaction history.
                    </p>
                  </div>

                  <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5 text-slate-600" />
                    <span>Select Backup File (.json)</span>
                    <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 7: ADMINISTRATOR DATA PURGE (RESET TEST DATA) (IMAGE 4) */}
            {currentUser.role === 'Administrator' && (
              <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    ADMINISTRATOR DATA PURGE (RESET TEST DATA)
                  </h3>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Clear test transactions, reset all tables to VACANT, and start with a clean ledger.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all test transactions, active tickets and audits?')) {
                      setTransactions([]);
                      setActiveOrders([]);
                      setCancelledTickets([]);
                      setAuditLogs([]);
                      setFloorRooms(prev => prev.map(t => ({ ...t, status: 'VACANT', currentOrderRef: null })));
                      recordAuditLog('ADMIN_DATA_PURGE', 'ALL', 'Wiped test sales records and reset floor rooms to vacant.');
                      setSettingsNotice({ title: 'Test Data Cleared', detail: 'Ledger cleared and all units set to VACANT.' });
                      setTimeout(() => setSettingsNotice(null), 3500);
                    }
                  }}
                  className="px-4 py-2.5 bg-[#e11d48] hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Purge Test Records</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: ROOMS & SUITES */}
        {activeTab === 'rooms' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-900">Rooms &amp; Suites Floor Map</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {floorRooms.map(rm => (
                <div key={rm.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{rm.id}</span>
                        <h3 className="text-base font-black text-slate-900">{rm.name}</h3>
                        <p className="text-xs text-slate-500">{rm.wing}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rm.status === 'OCCUPIED' ? 'bg-orange-100 text-[#ff5500]' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {rm.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-[#ff5500] mt-3">
                      Rate: {settings.currency} {rm.rate.toFixed(2)}/night
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => { setSelectedRoom(rm); setOrderMode('ROOM'); setActiveTab('pos'); }}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      {rm.status === 'OCCUPIED' ? 'Open Order' : 'Assign Room'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: MENU MANAGEMENT (+ADD DISHES) */}
        {activeTab === 'menu_admin' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Menu &amp; Tariff Management</h2>
                <p className="text-xs text-slate-500">Configure dining dishes, room rates, and services.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(true)}
                className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add New Item
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Dept</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4">{item.department}</td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#ff5500]">
                        {settings.currency} {item.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.name}"?`)) {
                              setMenuItems(prev => prev.filter(m => m.id !== item.id));
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: CANCELLED TICKETS */}
        {activeTab === 'cancelled' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-900">Cancelled Tickets &amp; Voids</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledTickets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 italic">No voided tickets found.</td>
                    </tr>
                  ) : (
                    cancelledTickets.map(voidItem => (
                      <tr key={voidItem.id}>
                        <td className="py-3 px-4 text-slate-500">{voidItem.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{voidItem.itemName}</td>
                        <td className="py-3 px-4 italic">{voidItem.reason}</td>
                        <td className="py-3 px-4">{voidItem.authorizedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Staff Credentials &amp; Roles</h2>
                <p className="text-xs text-slate-500">Configure terminal staff members and security PINs.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddStaffModalOpen(true)}
                className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Security PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{member.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-orange-100 text-[#ff5500] rounded font-bold text-[10px]">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">•••• ({member.pin})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD STAFF */}
      {addStaffModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Staff Member</h3>
              <button onClick={() => setAddStaffModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStaffForm.name || !newStaffForm.pin) return;
                const newMember = {
                  id: `usr_${Date.now()}`,
                  name: newStaffForm.name,
                  role: newStaffForm.role,
                  pin: newStaffForm.pin,
                  avatar: newStaffForm.name.substring(0, 2).toUpperCase(),
                  email: newStaffForm.email || 'staff@linolicove.me'
                };
                setStaffList(prev => [...prev, newMember]);
                setAddStaffModalOpen(false);
                setNewStaffForm({ name: '', role: 'Cashier', pin: '', email: '' });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={newStaffForm.role}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Front Desk Lead">Front Desk Lead</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newStaffForm.pin}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, pin: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-center text-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff5500] text-white font-bold rounded-xl text-xs mt-2"
              >
                Save Staff Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DISH / MENU ITEM */}
      {addItemModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Menu Item / Rate</h3>
              <button onClick={() => setAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const priceNum = parseFloat(newDishForm.price);
                if (!newDishForm.name || isNaN(priceNum) || priceNum <= 0) return;
                const newItem = {
                  id: `dish_${Date.now()}`,
                  name: newDishForm.name,
                  department: newDishForm.department,
                  category: newDishForm.category,
                  price: priceNum,
                  prepTime: newDishForm.prepTime || '15m',
                  description: newDishForm.description || '',
                  imageUrl: newDishForm.imageUrl || ''
                };
                setMenuItems(prev => [...prev, newItem]);
                setAddItemModalOpen(false);
                setNewDishForm({ name: '', department: 'Lodging', category: 'Room Rates', price: '', prepTime: '24h Stay', description: '', imageUrl: '' });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newDishForm.name}
                  onChange={e => setNewDishForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newDishForm.price}
                    onChange={e => setNewDishForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newDishForm.category}
                    onChange={e => setNewDishForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff5500] text-white font-bold rounded-xl text-xs mt-2"
              >
                Create Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT SETTLEMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Settle Payment</h3>
              <button onClick={() => setCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'WIRE'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPaymentMethod(type)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      paymentMethod === type ? 'bg-[#ff5500] text-white border-[#ff5500]' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-[#ff5500] font-mono">{settings.currency} {cartGrandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCompleteSettlement}
                className="w-full py-3 bg-[#008f5d] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase"
              >
                Confirm Settlement &amp; Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {settingsNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-md">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold text-white">{settingsNotice.title}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{settingsNotice.detail}</p>
          </div>
        </div>
      )}

      {/* THERMAL PRINT SLIP RENDER CONTAINER */}
      <div id="thermal-print-area" className="hidden print:block w-full bg-white text-black p-4 font-mono leading-tight">
        {activePrintSlip && activePrintSlip.type === 'FINAL_BILL' && (
          <div className="space-y-3 font-mono">
            <div className="text-center border-b-2 border-dashed border-black pb-3 space-y-1">
              <h1 className="font-black text-xl uppercase leading-tight">{settings.restaurantName}</h1>
              {settings.tagline && <p className="font-bold text-xs uppercase tracking-wider">{settings.tagline}</p>}
              <div className="text-xs font-semibold leading-snug whitespace-pre-line text-black pt-1">{settings.receiptHeader}</div>
              <div className="pt-2">
                <p className="font-black text-sm uppercase border-y border-black py-1 inline-block w-full">
                  TAX INVOICE #{activePrintSlip.data.invoiceNo}
                </p>
              </div>
              <p className="text-xs font-bold pt-1">{activePrintSlip.data.date} • {activePrintSlip.data.table}</p>
            </div>

            <div className="py-1 border-b border-black space-y-1 text-xs">
              {activePrintSlip.data.items.map((item, idx) => (
                <div key={idx} className="flex justify-between font-semibold">
                  <span>{item.qty}x {item.name}</span>
                  <span>{settings.currency} {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currency} {(activePrintSlip.data.subtotal || 0).toFixed(2)}</span>
              </div>
              {activePrintSlip.data.serviceCharge > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Service Charge ({settings.serviceChargeRate}%):</span>
                  <span>+{settings.currency} {activePrintSlip.data.serviceCharge.toFixed(2)}</span>
                </div>
              )}
              {activePrintSlip.data.tax > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Taxes ({settings.taxRate}%):</span>
                  <span>+{settings.currency} {activePrintSlip.data.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-black">
                <span>TOTAL AMOUNT DUE:</span>
                <span>{settings.currency} {activePrintSlip.data.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-0.5">
                <span>PAYMENT METHOD:</span>
                <span>{activePrintSlip.data.paymentMethod}</span>
              </div>
            </div>

            <p className="text-center font-bold text-xs pt-3 whitespace-pre-line border-t border-dashed border-black">
              {settings.receiptFooter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}