import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Monitor,
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
  Percent,
  TrendingUp,
  RefreshCw,
  Sliders,
  Check,
  Layers,
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
  Bed,
  ShieldCheck
} from 'lucide-react';
import { syncToCloud, subscribeToCloud } from './firebase';

const ROLE_PERMISSIONS = {
  Administrator: ['pos', 'rooms', 'billing', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'staff', 'settings'],
  Manager: ['pos', 'rooms', 'billing', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'settings'],
  Cashier: ['pos', 'billing', 'rooms', 'shifts', 'reports'],
  'Front Desk': ['pos', 'rooms', 'billing', 'shifts', 'reports']
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
    description: '1 Night stay in Deluxe King Room with balcony, ocean vista and breakfast.',
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
    description: 'Comfortable private Mercedes airport transfer with cold drinks.',
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
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Local write error: ${key}`);
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPinInput, setLoginPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data
  const [staffList, setStaffList] = usePersistentState('hotel_staff', INITIAL_STAFF);
  const [currentUser, setCurrentUser] = useState(INITIAL_STAFF[0]);
  const [inventory, setInventory] = usePersistentState('hotel_inventory', INITIAL_INVENTORY);
  const [menuItems, setMenuItems] = usePersistentState('hotel_menu', INITIAL_MENU_ITEMS);
  const [floorRooms, setFloorRooms] = usePersistentState('hotel_rooms', INITIAL_ROOMS);
  const [activeOrders, setActiveOrders] = usePersistentState('hotel_active_orders', []);
  const [transactions, setTransactions] = usePersistentState('hotel_transactions', []);
  const [auditLogs, setAuditLogs] = usePersistentState('hotel_audits', []);
  const [stockLogs, setStockLogs] = usePersistentState('hotel_stock_movements', []);
  const [cancelledTickets, setCancelledTickets] = usePersistentState('hotel_cancelled_tickets', []);
  const [seqCounters, setSeqCounters] = usePersistentState('hotel_seq', { order: 1001, invoice: 5001, cashOut: 101 });

  // System Settings State
  const [settings, setSettings] = usePersistentState('hotel_settings', {
    restaurantName: 'Linoli Cove Midigama',
    tagline: 'HOTEL & LUXURY RESORT',
    legalName: 'Linoli Cove Leisure (Pvt) Ltd',
    businessRegNo: 'PV-00289144',
    taxId: 'TIN-109284719',
    terminalId: 'HOTEL-FRONTDESK-01',
    phone: '+94 74 036 6741',
    email: 'info@linolicove.me',
    website: 'www.linolicove.me',
    address: '380 A Matara Road, Midigama, 81700',
    currency: 'Rs .',
    serviceChargeRate: 10,
    taxRate: 8,
    receiptRollWidth: '80mm',
    receiptFontSize: '12px',
    receiptFontFamily: 'monospace',
    receiptMargin: '2mm',
    autoPrintOrder: true,
    autoPrintBill: true,
    autoDrawerKick: 'ENABLED',
    drawerKickTrigger: 'CASH_ONLY',
    drawerPinout: 'PIN_2',
    chimeAudio: true,
    receiptHeader: 'Linoli Cove Beach Resort\nBeach Road, Midigama\nTel: +94 74 036 6741',
    receiptFooter: 'Thank you for staying with us!\nPlease visit again.'
  });

  // Shift & Cashier State
  const [currentShift, setCurrentShift] = usePersistentState('hotel_current_shift', {
    shiftId: `SHIFT-${getLocalDateStr().replace(/-/g, '')}-01`,
    openedDate: getLocalDateStr(),
    openedAt: '08:00 AM',
    openedBy: 'Marco Rossi',
    startingFloat: 15000.00,
    status: 'OPEN',
    payouts: []
  });

  const [denominations, setDenominations] = usePersistentState('hotel_denominations', {
    5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0
  });

  // Report Date Filter
  const [reportStartDate, setReportStartDate] = useState(getLocalDateStr(new Date(Date.now() - 6 * 86400000)));
  const [reportEndDate, setReportEndDate] = useState(getLocalDateStr());

  // POS State
  const [orderMode, setOrderMode] = useState('ROOM');
  const [selectedRoom, setSelectedRoom] = useState(INITIAL_ROOMS[0]);
  const [guestInfo, setGuestInfo] = useState({ name: 'Walk-in Guest', passport: '', nights: 1 });
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceChargeActive, setServiceChargeActive] = useState(true);
  const [taxActive, setTaxActive] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [newInventoryForm, setNewInventoryForm] = useState({ name: '', category: 'Linen & Bedding', stock: '', unit: 'pcs', cost: '', threshold: '10' });
  const [receiveStockModalOpen, setReceiveStockModalOpen] = useState(false);
  const [receiveStockForm, setReceiveStockForm] = useState({ ingredientId: '', quantity: '', supplier: '', invoiceRef: '', newCost: '' });
  const [cashOutModalOpen, setCashOutModalOpen] = useState(false);
  const [cashOutForm, setCashOutForm] = useState({ amount: '', category: 'Vendor Supplier', reason: '', recipient: '' });
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newDishForm, setNewDishForm] = useState({ name: '', department: 'Lodging', category: 'Room Rates', price: '', prepTime: '24h Stay', description: '', imageUrl: '' });
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'Cashier', pin: '', email: '' });

  // Thermal Printing Engine State
  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [printNotice, setPrintNotice] = useState(null);

  // Helpers
  const getNextOrderNumber = () => {
    const next = (seqCounters.order || 1000) + 1;
    setSeqCounters(prev => ({ ...prev, order: next }));
    return `ORD-${next}`;
  };

  const getNextInvoiceNumber = () => {
    const next = (seqCounters.invoice || 5000) + 1;
    setSeqCounters(prev => ({ ...prev, invoice: next }));
    return `INV-${next}`;
  };

  const getNextCashOutNumber = () => {
    const next = (seqCounters.cashOut || 100) + 1;
    setSeqCounters(prev => ({ ...prev, cashOut: next }));
    return `CO-${next}`;
  };

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

  const recordStockMovement = (type, ingredientId, ingredientName, diffQty, oldStock, newStock, unit, unitCost, reason, reference = '') => {
    const entry = {
      id: `STK-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      date: getLocalDateStr(),
      type,
      ingredientId,
      ingredientName,
      diffQty: Number(diffQty),
      oldStock: Number(oldStock),
      newStock: Number(newStock),
      unit,
      unitCost: Number(unitCost),
      totalCostImpact: Number((Math.abs(diffQty) * unitCost).toFixed(2)),
      reason,
      reference,
      staff: currentUser.name
    };
    setStockLogs(prev => [entry, ...prev]);
  };

  const triggerAutoPrint = (slipConfig, noticeText = 'Spooling document...') => {
    setActivePrintSlip(slipConfig);
    setPrintNotice({
      title: slipConfig.type === 'FINAL_BILL' ? 'Tax Invoice Spooled' : 'Document Printed',
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

  // Financial Computations
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

  // Stock Valuation Metrics
  const inventoryMetrics = useMemo(() => {
    let totalStockValue = 0;
    let lowStockCount = 0;
    inventory.forEach(item => {
      const stock = Number(item.stock) || 0;
      const cost = Number(item.cost) || 0;
      totalStockValue += (stock * cost);
      if (stock <= (item.threshold || 10)) lowStockCount++;
    });
    return { totalStockValue, totalItems: inventory.length, lowStockCount };
  }, [inventory]);

  // Sales Analytics & Chart Metrics
  const filteredSales = useMemo(() => {
    return transactions.filter(t => {
      const datePart = (t.date || '').split(' ')[0];
      if (reportStartDate && datePart < reportStartDate) return false;
      if (reportEndDate && datePart > reportEndDate) return false;
      return true;
    });
  }, [transactions, reportStartDate, reportEndDate]);

  const salesAnalytics = useMemo(() => {
    let grossRevenue = 0;
    let totalTax = 0;
    let totalService = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let splitTotal = 0;
    const dateMap = {};

    filteredSales.forEach(t => {
      grossRevenue += Number(t.total) || 0;
      totalTax += Number(t.tax) || 0;
      totalService += Number(t.serviceCharge) || 0;

      const method = (t.paymentMethod || 'CASH').toUpperCase();
      if (method === 'CASH') cashTotal += t.total;
      else if (method === 'CARD') cardTotal += t.total;
      else splitTotal += t.total;

      const dayKey = (t.date || '').split(' ')[0];
      if (dayKey) {
        dateMap[dayKey] = (dateMap[dayKey] || 0) + Number(t.total);
      }
    });

    const dailyBars = Object.entries(dateMap).map(([day, val]) => ({ day, val })).sort((a, b) => a.day.localeCompare(b.day));
    const maxDayVal = Math.max(...dailyBars.map(b => b.val), 1);

    return {
      grossRevenue,
      totalTax,
      totalService,
      billsCount: filteredSales.length,
      cashTotal,
      cardTotal,
      splitTotal,
      dailyBars,
      maxDayVal
    };
  }, [filteredSales]);

  // Cashier Drawer Balancing Calculations
  const shiftMetrics = useMemo(() => {
    const shiftCashInflow = transactions
      .filter(t => (t.paymentMethod || 'CASH').toUpperCase() === 'CASH' && (t.date || '').includes(currentShift.openedDate))
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const shiftApprovedCashOut = (currentShift.payouts || [])
      .filter(p => p.status === 'APPROVED' || !p.status)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const expectedCash = (currentShift.startingFloat || 0) + shiftCashInflow - shiftApprovedCashOut;

    const countedCash = Object.entries(denominations).reduce((sum, [denom, count]) => {
      return sum + (Number(denom) * (Number(count) || 0));
    }, 0);

    const variance = countedCash > 0 ? (countedCash - expectedCash) : 0;

    return {
      shiftCashInflow,
      shiftApprovedCashOut,
      expectedCash,
      countedCash,
      variance,
      hasCounted: countedCash > 0
    };
  }, [transactions, currentShift, denominations]);

  // Handlers
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

    recordAuditLog('ORDER_POSTED', orderId, `Dispatched order for ${orderPayload.tableName}`);
    triggerAutoPrint({ type: 'KOT_BOT_DISPATCH', data: { order: orderPayload, items: cart } }, `Order ${orderId}`);
    setCart([]);
  };

  const handleCompleteSettlement = () => {
    const target = settlingOrder || {
      orderId: getNextOrderNumber(),
      mode: orderMode,
      tableName: orderMode === 'ROOM' ? selectedRoom.name : guestInfo.name,
      roomId: orderMode === 'ROOM' ? selectedRoom.id : null,
      items: cart,
      serviceChargeActive,
      taxActive,
      discountPercent
    };

    if (!target.items || target.items.length === 0) return;
    const { subtotal, discount, service, tax, total } = calculateOrderFinancials(target);

    // Deduct stock linked in recipe BOM
    const deductions = {};
    target.items.forEach(cartItem => {
      const match = menuItems.find(m => m.id === cartItem.id) || cartItem;
      if (match.recipe && Array.isArray(match.recipe)) {
        match.recipe.forEach(r => {
          deductions[r.ingredientId] = (deductions[r.ingredientId] || 0) + (r.amount * cartItem.qty);
        });
      }
    });

    setInventory(prev => prev.map(invItem => {
      if (deductions[invItem.id]) {
        const cur = Number(invItem.stock) || 0;
        const next = Math.max(0, Number((cur - deductions[invItem.id]).toFixed(2)));
        recordStockMovement('SALE_DEPLETION', invItem.id, invItem.name, -deductions[invItem.id], cur, next, invItem.unit, invItem.cost, `Bill settlement ${target.orderId}`, target.orderId);
        return { ...invItem, stock: next };
      }
      return invItem;
    }));

    const newInvoice = {
      invoiceNo: getNextInvoiceNumber(),
      orderRef: target.orderId,
      date: `${getLocalDateStr()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      table: target.tableName,
      cashier: currentUser.name,
      items: target.items,
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
    setActiveOrders(prev => prev.filter(o => o.orderId !== target.orderId));

    if (target.roomId) {
      setFloorRooms(prev => prev.map(r => r.id === target.roomId ? { ...r, status: 'DIRTY / REFRESH', currentOrderRef: null } : r));
    }

    recordAuditLog('BILL_SETTLED', newInvoice.invoiceNo, `Settled ${newInvoice.invoiceNo} for ${settings.currency}${total.toFixed(2)} via ${paymentMethod}`);
    triggerAutoPrint({ type: 'FINAL_BILL', data: newInvoice }, `Tax Invoice #${newInvoice.invoiceNo}`);

    setSettlingOrder(null);
    setCheckoutModalOpen(false);
    setCashTendered('');
    setCart([]);
  };

  // Login View
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
                        setLoginError('Invalid PIN. Default Admin: 2024, Cashier: 1111');
                      }
                    }
                  }
                }}
                className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-base font-bold text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLoginPinInput('')}
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-xs font-bold text-zinc-400 hover:bg-zinc-800 cursor-pointer"
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
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-base font-bold text-white hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setLoginPinInput(prev => prev.slice(0, -1))}
              className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-[#10192b] text-xs font-bold text-zinc-400 hover:bg-zinc-800 cursor-pointer"
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
      {/* PERFECT THERMAL PRINTER FORMATTING ENGINE CSS */}
      <style>{`
        select, option { color: #0f172a !important; background-color: #ffffff !important; }
        @media print {
          @page {
            margin: ${settings.receiptMargin || '2mm'};
            size: auto;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible !important;
          }
          #thermal-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${settings.receiptRollWidth === '58mm' ? '58mm' : '80mm'} !important;
            max-width: 100% !important;
            font-size: ${settings.receiptFontSize || '12px'} !important;
            font-family: ${settings.receiptFontFamily || 'monospace'} !important;
            line-height: 1.2 !important;
            color: #000000 !important;
            background: #ffffff !important;
            padding: 2mm !important;
          }
          .thermal-divider {
            border-top: 1px dashed #000000 !important;
            margin: 4px 0 !important;
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

      {/* SLIDE-OUT DRAWER SIDEBAR */}
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
              { id: 'rooms', name: 'Room & Suite Map', icon: Bed, badge: floorRooms.filter(r => r.status === 'OCCUPIED').length },
              { id: 'stock', name: 'Stock & Inventory', icon: Package, alert: inventoryMetrics.lowStockCount > 0 },
              { id: 'shifts', name: 'Cashier Shifts', icon: DollarSign },
              { id: 'reports', name: 'Sales Reports & Charts', icon: BarChart3 }
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
          <button onClick={() => setIsAuthenticated(false)} title="Lock Terminal" className="p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN PMS WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
        <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase flex items-center gap-2.5 shadow-md cursor-pointer"
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
            <button onClick={() => setIsAuthenticated(false)} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Lock className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            VIEW 1: POS TERMINAL
            ========================================================================= */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-5 overflow-hidden min-h-0">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 mb-4 shrink-0 shadow-md flex items-center gap-3">
                <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-2">
                  {['All', ...new Set(menuItems.map(m => m.category))].map((cat) => {
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
                    placeholder="Search menu & rates..."
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

            {/* Right Ticket Bar */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg min-h-0">
              <div className="p-3.5 border-b border-slate-200 space-y-2.5 shrink-0 bg-white">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">
                  Assignment Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderMode('ROOM')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orderMode === 'ROOM' ? 'bg-orange-50 border-[#ff5500] text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>Room / Suite</span>
                    {orderMode === 'ROOM' && <Check className="h-3 w-3 text-[#ff5500] stroke-[3]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('WALKIN')}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                    <p className="text-[11px] text-slate-400 mt-1">Tap items to build charges.</p>
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
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                        >-</button>
                        <span className="text-xs font-mono font-bold w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, qty: i.qty + 1 } : i))}
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-xs font-bold cursor-pointer"
                        >+</button>
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId))}
                          className="h-6 w-6 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
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
                  className="w-full py-3 bg-[#ff5500] hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Send &amp; Print Order Voucher</span>
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => { setPaymentMethod('CASH'); setCheckoutModalOpen(true); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Direct Settle ({settings.currency} {cartGrandTotal.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: BILLING & SETTLEMENT QUEUE
            ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Billing &amp; Settlement Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage open room folios, print proforma bills, and execute final payment settlements.</p>
              </div>
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                {activeOrders.length} Open Bills
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.length === 0 ? (
                <div className="col-span-full h-64 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Receipt className="h-10 w-10 mb-2 stroke-[1]" />
                  <p className="text-sm font-bold text-slate-700">No active bills in queue</p>
                  <p className="text-xs mt-1">Orders sent from the POS terminal will appear here.</p>
                </div>
              ) : (
                activeOrders.map(order => {
                  const fin = calculateOrderFinancials(order);
                  return (
                    <div key={order.orderId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#ff5500]">
                              {order.orderId}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">{order.tableName}</h3>
                            <p className="text-xs text-slate-500">Waitstaff: {order.server} • {order.sentAt}</p>
                          </div>
                          <span className="text-lg font-black font-mono text-[#ff5500]">
                            {settings.currency} {fin.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 my-3 space-y-1.5 text-xs max-h-40 overflow-y-auto border border-slate-100">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-bold text-slate-800">{item.qty}x {item.name}</span>
                              <span className="font-mono text-slate-500">{settings.currency} {(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerAutoPrint({
                              type: 'TEMP_BILL',
                              data: {
                                table: order.tableName,
                                server: order.server,
                                items: order.items,
                                subtotal: fin.subtotal,
                                service: fin.service,
                                tax: fin.tax,
                                total: fin.total
                              }
                            }, `Proforma Bill for ${order.tableName}`);
                          }}
                          className="py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" /> Temp Bill
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSettlingOrder(order);
                            setPaymentMethod('CASH');
                            setCheckoutModalOpen(true);
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Settle Bill
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: STOCK & INVENTORY WITH LEDGER
            ========================================================================= */}
        {activeTab === 'stock' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Stock &amp; Raw Inventory Valuation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Asset values, stock depletion, and Good Receipt Notes (GRN).</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReceiveStockForm({ ingredientId: inventory[0]?.id || '', quantity: '', supplier: '', invoiceRef: '', newCost: '' });
                    setReceiveStockModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Receive Stock (GRN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddInventoryModalOpen(true)}
                  className="px-3.5 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Material</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Stock Asset Value</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {settings.currency} {inventoryMetrics.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Tracked Items</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">{inventoryMetrics.totalItems} Materials</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Low Par Alerts</p>
                <p className={`text-2xl font-black font-mono mt-1 ${inventoryMetrics.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {inventoryMetrics.lowStockCount} Items Low
                </p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Material / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">In-Stock</th>
                    <th className="py-3 px-4">Par Alert</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
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
                          <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded font-bold">Low</span>
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

            {/* Stock Movement Difference Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-900">Stock Movement &amp; Difference Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date &amp; Time</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-center">Qty Diff</th>
                      <th className="py-2.5 px-3 text-right">New Level</th>
                      <th className="py-2.5 px-3">Reason / Ref</th>
                      <th className="py-2.5 px-3">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">No movements recorded yet.</td>
                      </tr>
                    ) : (
                      stockLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{log.timestamp}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{log.ingredientName}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'INTAKE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-center font-mono font-bold ${log.diffQty > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.diffQty > 0 ? `+${log.diffQty}` : log.diffQty} {log.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{log.newStock} {log.unit}</td>
                          <td className="py-2.5 px-3 text-slate-600">{log.reason}</td>
                          <td className="py-2.5 px-3 text-slate-700">{log.staff}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4: SALES REPORTS WITH DYNAMIC SVG CHARTS
            ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Sales Reports &amp; Revenue Analytics</h2>
                <p className="text-xs text-slate-500">Track multi-day income trends, invoice settlements, and tender splits.</p>
              </div>
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

            {/* KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Gross Sales Revenue</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {settings.currency} {salesAnalytics.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-1">{salesAnalytics.billsCount} Settled Invoices</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Cash Payments</p>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {settings.currency} {salesAnalytics.cashTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Card &amp; Digital Payments</p>
                <p className="text-2xl font-black font-mono text-sky-600 mt-1">
                  {settings.currency} {salesAnalytics.cardTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Taxes &amp; Service Gratuity</p>
                <p className="text-2xl font-black font-mono text-indigo-600 mt-1">
                  {settings.currency} {(salesAnalytics.totalTax + salesAnalytics.totalService).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* VISUAL CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Sales Bar Chart (SVG) */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Daily Revenue Trend</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Dynamic Period Aggregation</span>
                </div>

                <div className="h-56 flex items-end gap-3 pt-6 px-2 border-b border-slate-100">
                  {salesAnalytics.dailyBars.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">
                      No sales data recorded in this selected range.
                    </div>
                  ) : (
                    salesAnalytics.dailyBars.map(bar => {
                      const heightPercent = Math.max(12, Math.round((bar.val / salesAnalytics.maxDayVal) * 100));
                      return (
                        <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="text-[9px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {settings.currency}{bar.val.toFixed(0)}
                          </div>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[42px] bg-gradient-to-t from-[#ff5500] to-orange-400 rounded-t-lg transition-all group-hover:brightness-110 shadow-xs"
                          />
                          <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">{bar.day.slice(5)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Payment Tender Split Donut Chart (SVG) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Payment Breakdown</h3>

                <div className="flex items-center justify-center my-4">
                  <svg width="150" height="150" viewBox="0 0 42 42" className="rotate-[-90deg]">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                    {salesAnalytics.grossRevenue > 0 && (
                      <>
                        <circle
                          cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6"
                          strokeDasharray={`${(salesAnalytics.cashTotal / salesAnalytics.grossRevenue) * 100} ${100 - (salesAnalytics.cashTotal / salesAnalytics.grossRevenue) * 100}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="21" cy="21" r="15.915" fill="transparent" stroke="#0284c7" strokeWidth="6"
                          strokeDasharray={`${(salesAnalytics.cardTotal / salesAnalytics.grossRevenue) * 100} ${100 - (salesAnalytics.cardTotal / salesAnalytics.grossRevenue) * 100}`}
                          strokeDashoffset={`-${(salesAnalytics.cashTotal / salesAnalytics.grossRevenue) * 100}`}
                        />
                      </>
                    )}
                  </svg>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Cash:</span>
                    <span className="font-mono font-bold">{settings.currency} {salesAnalytics.cashTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Card / Digital:</span>
                    <span className="font-mono font-bold">{settings.currency} {salesAnalytics.cardTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-black uppercase text-slate-900 mb-3">Settled Invoices Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Target</th>
                      <th className="py-2.5 px-3">Cashier</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Grand Total</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map(t => (
                      <tr key={t.invoiceNo} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{t.invoiceNo}</td>
                        <td className="py-2.5 px-3 text-slate-500">{t.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{t.table}</td>
                        <td className="py-2.5 px-3 text-slate-600">{t.cashier}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{t.paymentMethod}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {settings.currency} {t.total.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => triggerAutoPrint({ type: 'FINAL_BILL', data: t }, `Reprint #${t.invoiceNo}`)}
                            className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 5: CASHIER SHIFTS & DRAWER RECONCILIATION
            ========================================================================= */}
        {activeTab === 'shifts' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Cashier Shift &amp; Drawer Balancing</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active Shift: <strong className="font-mono text-slate-800">{currentShift.shiftId}</strong> • Opened by {currentShift.openedBy} at {currentShift.openedAt}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCashOutModalOpen(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Request Cash Out</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const closedData = {
                      ...currentShift,
                      closedDate: getLocalDateStr(),
                      closedAt: new Date().toLocaleTimeString(),
                      metrics: { ...shiftMetrics, denominations }
                    };
                    triggerAutoPrint({ type: 'Z_REPORT', data: closedData }, `Shift ${currentShift.shiftId} Closed`);
                    alert('Shift balancing finalized. Z-Report printed.');
                  }}
                  className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Close Shift &amp; Print Z-Report</span>
                </button>
              </div>
            </div>

            {/* Reconciliation KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Starting Float</p>
                <p className="text-xl font-black font-mono text-slate-900 mt-1">
                  {settings.currency} {currentShift.startingFloat.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">+ Cash Inflow</p>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  +{settings.currency} {shiftMetrics.shiftCashInflow.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">- Cash Payouts</p>
                <p className="text-xl font-black font-mono text-rose-600 mt-1">
                  -{settings.currency} {shiftMetrics.shiftApprovedCashOut.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border-2 border-orange-200 bg-orange-50/20 shadow-xs">
                <p className="text-[10px] font-black uppercase text-[#ff5500]">Expected in Drawer</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {settings.currency} {shiftMetrics.expectedCash.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Physical Denomination Breakdown Matrix */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-[#ff5500]" /> Physical Note Count Breakdown
                  </h3>
                  <p className="text-[10px] text-slate-400">Count cash bundles to determine overage or shortage.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-900 text-white rounded-xl">
                    Actual Counted: {settings.currency} {shiftMetrics.countedCash.toFixed(2)}
                  </span>
                  {shiftMetrics.hasCounted && (
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl ${
                      shiftMetrics.variance === 0 ? 'bg-emerald-100 text-emerald-800' : shiftMetrics.variance > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {shiftMetrics.variance === 0 ? '✓ Balanced' : shiftMetrics.variance > 0 ? `+${shiftMetrics.variance.toFixed(2)} Overage` : `${shiftMetrics.variance.toFixed(2)} Shortage`}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {[5000, 1000, 500, 100, 50, 20].map(denom => (
                  <div key={denom} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-mono text-xs font-bold text-slate-700">{settings.currency}{denom}</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ''}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setDenominations(prev => ({ ...prev, [denom]: val }));
                      }}
                      placeholder="0 notes"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <span className="text-[10px] font-mono text-slate-400 block text-right">
                      ={settings.currency}{((denominations[denom] || 0) * denom).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: SETTINGS (Full 7 Sections)
            ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#ff5500]" /> System, Business &amp; Peripheral Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">Configure restaurant & hotel details, printer margins, and cash drawer kick.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Settings synchronized.')}
                className="px-4 py-2 bg-[#008f5d] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" /> Save Changes
              </button>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900">COMPANY &amp; BUSINESS INFORMATION</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trading Name</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={e => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={e => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Registration / TIN</label>
                  <input
                    type="text"
                    value={settings.taxId}
                    onChange={e => setSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Thermal Print Tuning */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900">THERMAL AUTO-PRINTER CONFIGURATION</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paper Roll Width</label>
                  <select
                    value={settings.receiptRollWidth}
                    onChange={e => setSettings(prev => ({ ...prev, receiptRollWidth: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                  >
                    <option value="80mm">80mm Thermal Paper (Standard POS)</option>
                    <option value="58mm">58mm Thermal Paper (Compact Mini)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Font Size</label>
                  <select
                    value={settings.receiptFontSize}
                    onChange={e => setSettings(prev => ({ ...prev, receiptFontSize: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                  >
                    <option value="11px">11px - Standard Compact</option>
                    <option value="12px">12px - Balanced Sharp</option>
                    <option value="14px">14px - Extra Bold &amp; Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Printer Test Slip</label>
                  <button
                    type="button"
                    onClick={() => triggerAutoPrint({
                      type: 'FINAL_BILL',
                      data: {
                        invoiceNo: 'TEST-001',
                        date: new Date().toLocaleString(),
                        table: 'ALIGNMENT TEST',
                        cashier: currentUser.name,
                        items: [{ name: 'Thermal Slip Alignment OK', qty: 1, price: 0 }],
                        subtotal: 0,
                        serviceCharge: 0,
                        tax: 0,
                        total: 0,
                        paymentMethod: 'TEST'
                      }
                    })}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" /> Test Print Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: RECEIVE STOCK (GRN) */}
      {receiveStockModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Receive Stock Intake (GRN)</h3>
              <button onClick={() => setReceiveStockModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qty = parseFloat(receiveStockForm.quantity);
                if (isNaN(qty) || qty <= 0) return;
                const match = inventory.find(i => i.id === receiveStockForm.ingredientId);
                if (match) {
                  const oldStk = Number(match.stock) || 0;
                  const newStk = oldStk + qty;
                  const newCst = parseFloat(receiveStockForm.newCost) || match.cost;
                  setInventory(prev => prev.map(i => i.id === match.id ? { ...i, stock: newStk, cost: newCst } : i));
                  recordStockMovement('INTAKE', match.id, match.name, qty, oldStk, newStk, match.unit, newCst, receiveStockForm.supplier || 'Vendor Delivery', receiveStockForm.invoiceRef || 'GRN');
                  setReceiveStockModalOpen(false);
                }
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Material</label>
                <select
                  value={receiveStockForm.ingredientId}
                  onChange={e => setReceiveStockForm(prev => ({ ...prev, ingredientId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit} available)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Received</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={receiveStockForm.quantity}
                    onChange={e => setReceiveStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Unit Cost ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveStockForm.newCost}
                    onChange={e => setReceiveStockForm(prev => ({ ...prev, newCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs mt-2">
                Confirm Good Receipt Intake
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
              <button onClick={() => setCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'SPLIT'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPaymentMethod(type)}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
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
                className="w-full py-3 bg-[#008f5d] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Confirm Settlement &amp; Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL PRINT SLIP RENDER CONTAINER (OPTIMIZED FOR 80mm & 58mm) */}
      <div id="thermal-print-area" className="hidden print:block w-full bg-white text-black leading-tight">
        {activePrintSlip && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <div style={{ fontWeight: '900', fontSize: '15px' }}>{settings.restaurantName}</div>
              <div style={{ fontSize: '10px' }}>{settings.tagline}</div>
              <div style={{ fontSize: '10px', whiteSpace: 'pre-line', margin: '3px 0' }}>{settings.receiptHeader}</div>
              <div className="thermal-divider" />
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {activePrintSlip.type === 'FINAL_BILL' ? `TAX INVOICE #${activePrintSlip.data.invoiceNo}` : `PROFORMA BILL`}
              </div>
              <div style={{ fontSize: '10px' }}>Date: {activePrintSlip.data.date}</div>
              <div style={{ fontSize: '10px' }}>Target: {activePrintSlip.data.table}</div>
              <div className="thermal-divider" />
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '6px' }}>
              {(activePrintSlip.data.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '2px 0' }}>
                  <span>{item.qty}x {item.name}</span>
                  <span style={{ fontWeight: 'bold' }}>{settings.currency}{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="thermal-divider" />

            {/* Totals */}
            <div style={{ fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{settings.currency}{(activePrintSlip.data.subtotal || 0).toFixed(2)}</span>
              </div>
              {activePrintSlip.data.serviceCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service ({settings.serviceChargeRate}%):</span>
                  <span>+{settings.currency}{activePrintSlip.data.serviceCharge.toFixed(2)}</span>
                </div>
              )}
              {activePrintSlip.data.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes ({settings.taxRate}%):</span>
                  <span>+{settings.currency}{activePrintSlip.data.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="thermal-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '13px' }}>
                <span>TOTAL DUE:</span>
                <span>{settings.currency}{(activePrintSlip.data.total || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px' }}>
                <span>Payment:</span>
                <span style={{ fontWeight: 'bold' }}>{activePrintSlip.data.paymentMethod || 'CASH'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="thermal-divider" />
            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '6px', whiteSpace: 'pre-line' }}>
              {settings.receiptFooter}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}