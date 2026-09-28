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
  ArrowUpRight,
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
  FileSpreadsheet,
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
  Bed,
  DoorOpen,
  UserCheck
} from 'lucide-react';
import { syncToCloud, subscribeToCloud } from './firebase';
import * as pdfjsLib from 'pdfjs-dist';

// Worker configuration for client-side PDF tariff and menu parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const ROLE_PERMISSIONS = {
  Administrator: ['pos', 'kds', 'bar', 'billing', 'tables', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'staff', 'settings'],
  Manager: ['pos', 'kds', 'bar', 'billing', 'tables', 'stock', 'recipes', 'shifts', 'reports', 'menu_admin', 'cancelled', 'settings'],
  Cashier: ['pos', 'billing', 'tables', 'shifts', 'reports'],
  'Kitchen Chef': ['kds', 'recipes', 'stock'],
  Bartender: ['bar', 'recipes', 'stock'],
  'Floor Server': ['pos', 'tables', 'billing']
};

const INITIAL_STAFF = [
  { id: 'usr_admin', name: 'System Administrator', role: 'Administrator', pin: '2022', avatar: 'SA', email: 'admin@linolicove.com' }
];

const INITIAL_RAW_INVENTORY = [
  { id: 'ing_rice', name: 'Egyptian King Bed Sheet Set', category: 'Housekeeping & Linen', stock: 150, unit: 'sets', cost: 1200.00, threshold: 25 },
  { id: 'ing_seafood_mix', name: 'Plush Bath Sheet 800GSM', category: 'Housekeeping & Linen', stock: 320, unit: 'pcs', cost: 450.00, threshold: 40 },
  { id: 'ing_eggs', name: 'Luxury Guest Amenity Kit', category: 'Toiletries & Supplies', stock: 450, unit: 'kits', cost: 180.00, threshold: 50 },
  { id: 'ing_espresso_beans', name: 'In-Room Arabica Espresso Beans', category: 'Beverages', stock: 4320, unit: 'g', cost: 4.50, threshold: 1000 },
  { id: 'ing_milk', name: 'Fresh Whole Milk', category: 'Dairy & Eggs', stock: 11800, unit: 'ml', cost: 0.30, threshold: 2500 },
  { id: 'ing_beef_patty', name: 'RFID Smart Keycards', category: 'Front Desk Supplies', stock: 500, unit: 'cards', cost: 85.00, threshold: 100 },
  { id: 'ing_burger_bun', name: 'Velour Hotel Bathrobe', category: 'Housekeeping & Linen', stock: 65, unit: 'pcs', cost: 1850.00, threshold: 15 },
  { id: 'ing_cheddar', name: 'Artisan Dark Truffle Chocolates', category: 'Minibar Supplies', stock: 140, unit: 'boxes', cost: 350.00, threshold: 30 },
  { id: 'ing_calamari', name: 'San Pellegrino Sparkling 750ml', category: 'Minibar Supplies', stock: 200, unit: 'bottles', cost: 220.00, threshold: 40 },
  { id: 'ing_rum', name: 'Premium White Rum 750ml', category: 'Bar Supplies', stock: 4500, unit: 'ml', cost: 3.20, threshold: 1000 },
  { id: 'ing_lime', name: 'Fresh Lime Juice', category: 'Produce', stock: 3200, unit: 'ml', cost: 0.80, threshold: 500 },
  { id: 'ing_mint', name: 'Garden Fresh Mint', category: 'Produce', stock: 850, unit: 'g', cost: 1.50, threshold: 200 },
  { id: 'ing_soda', name: 'Sparkling Soda Water', category: 'Beverages', stock: 9500, unit: 'ml', cost: 0.15, threshold: 2000 },
  { id: 'ing_lion_lager', name: 'Lion Lager 625ml', category: 'Bar Supplies', stock: 54, unit: 'pcs', cost: 650.00, threshold: 15 }
];

// SWAPPED ONLY FROM FOOD ITEMS TO HOTEL ROOMS & STAY PACKAGES
const INITIAL_MENU_ITEMS = [
  {
    id: 'dish_seafood_rice',
    name: 'DELUXE OCEAN VIEW ROOM (1 NIGHT)',
    department: 'Kitchen',
    category: 'Deluxe Rooms',
    price: 24500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80',
    description: '1 Night stay in Deluxe King Room with ocean panorama, terrace balcony & breakfast.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 1 },
      { ingredientId: 'ing_seafood_mix', amount: 2 },
      { ingredientId: 'ing_eggs', amount: 2 }
    ]
  },
  {
    id: 'dish_classic_burger',
    name: 'Executive Ocean Villa Suite',
    department: 'Kitchen',
    category: 'Suites & Villas',
    price: 48500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80',
    description: 'Private cabana pool villa suite with turn-down champagne service and private jacuzzi.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 2 },
      { ingredientId: 'ing_seafood_mix', amount: 4 },
      { ingredientId: 'ing_burger_bun', amount: 2 }
    ]
  },
  {
    id: 'dish_hot_butter_calamari',
    name: 'Standard Garden King Room',
    department: 'Kitchen',
    category: 'Standard Rooms',
    price: 18500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80',
    description: 'Peaceful garden view king room with rain shower, smart desk, and high-speed Wi-Fi.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 1 },
      { ingredientId: 'ing_seafood_mix', amount: 2 }
    ]
  },
  {
    id: 'drink_mojito',
    name: 'Presidential Royal Penthouse',
    department: 'Bar',
    category: 'Luxury Penthouses',
    price: 85000.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
    description: 'Top-floor presidential suite with 360-degree panoramic ocean views and private plunge pool.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 2 },
      { ingredientId: 'ing_burger_bun', amount: 2 },
      { ingredientId: 'ing_cheddar', amount: 2 }
    ]
  },
  {
    id: 'drink_lion_beer',
    name: 'Standard Twin Bed Room',
    department: 'Bar',
    category: 'Standard Rooms',
    price: 16500.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=400&q=80',
    description: 'Two luxury twin beds, garden patio, high-speed WiFi and luxury bath amenities.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 2 },
      { ingredientId: 'ing_seafood_mix', amount: 2 }
    ]
  },
  {
    id: 'drink_cappuccino',
    name: 'Family Poolside Suite',
    department: 'Bar',
    category: 'Suites & Villas',
    price: 36000.00,
    prepTime: '24h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80',
    description: 'Direct pool lagoon walk-out access, two king beds, separate living room & kitchenette.',
    recipe: [
      { ingredientId: 'ing_rice', amount: 2 },
      { ingredientId: 'ing_seafood_mix', amount: 4 }
    ]
  },
  {
    id: 'drink_espresso',
    name: 'Day-Use Transit Room (6 Hours)',
    department: 'Bar',
    category: 'Day-Use Tariffs',
    price: 9500.00,
    prepTime: '6h Stay',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
    description: 'Flexible 6-hour stay room for day transit travelers with shower and pool access.',
    recipe: [
      { ingredientId: 'ing_seafood_mix', amount: 2 },
      { ingredientId: 'ing_eggs', amount: 1 }
    ]
  }
];

const INITIAL_FLOOR_TABLES = [
  { id: 'RM-101', name: 'Room 101 - King Deluxe', zone: 'East Wing - Floor 1', capacity: 2, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-102', name: 'Room 102 - King Deluxe', zone: 'East Wing - Floor 1', capacity: 2, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-103', name: 'Room 103 - Garden Standard', zone: 'East Wing - Floor 1', capacity: 2, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-201', name: 'Suite 201 - Executive Suite', zone: 'Ocean Tower - Floor 2', capacity: 4, status: 'VACANT', currentOrderRef: null },
  { id: 'RM-202', name: 'Suite 202 - Executive Suite', zone: 'Ocean Tower - Floor 2', capacity: 4, status: 'VACANT', currentOrderRef: null },
  { id: 'PH-301', name: 'Penthouse 301 - Royal Suite', zone: 'Penthouse Deck', capacity: 6, status: 'VACANT', currentOrderRef: null },
  { id: 'VIL-01', name: 'Ocean Villa 01 - Private Pool', zone: 'Beachfront Garden', capacity: 4, status: 'VACANT', currentOrderRef: null },
  { id: 'VIL-02', name: 'Ocean Villa 02 - Private Pool', zone: 'Beachfront Garden', capacity: 4, status: 'VACANT', currentOrderRef: null }
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

const extractMenuFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const rawTokens = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (let i = 0; i < content.items.length; i++) {
      const str = (content.items[i].str || '').trim();
      if (!str || str === '|' || str.startsWith('Page ') || str.includes('Linoli Cove POS Menu Import File')) {
        continue;
      }
      rawTokens.push(str);
    }
  }

  const parsedItems = [];
  const priceRegex = /^(?:Rs\.?|LKR|\$)?\s*([0-9]{3,5}(?:\.[0-9]{2})?)$/i;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    const match = token.match(priceRegex);

    if (match) {
      const priceVal = parseFloat(match[1]);
      let name = '';
      let category = 'Room Rates';
      let department = 'Kitchen';

      const prev1 = rawTokens[i - 1] || '';
      const prev2 = rawTokens[i - 2] || '';
      const next1 = rawTokens[i + 1] || '';

      if (token.toLowerCase().includes('price') || prev1.toLowerCase().includes('item name')) {
        continue;
      }

      if (prev2 && !prev2.toLowerCase().includes('item name') && !prev2.toLowerCase().includes('price')) {
        name = prev2;
        category = prev1;
      } else {
        name = prev1;
      }

      if (next1 && (next1.toLowerCase() === 'kitchen' || next1.toLowerCase() === 'bar')) {
        department = next1.charAt(0).toUpperCase() + next1.slice(1).toLowerCase();
      }

      name = name.replace(/^[|•\-\s]+|[|•\-\s]+$/g, '').trim();
      category = category.replace(/^[|•\-\s]+|[|•\-\s]+$/g, '').trim();

      if (name.length >= 2 && !isNaN(priceVal) && priceVal > 0) {
        parsedItems.push({
          id: `dish_${Date.now()}_${Math.floor(Math.random() * 100000)}_${parsedItems.length}`,
          name: name,
          department: department,
          category: category || 'Room Rates',
          price: priceVal,
          prepTime: '24h Stay',
          imageUrl: '',
          description: `Imported Tariff: ${category}`
        });
      }
    }
  }

  return parsedItems;
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
  const [inventory, setInventory] = usePersistentState('linoli_inventory', INITIAL_RAW_INVENTORY);
  const [menuItems, setMenuItems] = usePersistentState('linoli_menu_items', INITIAL_MENU_ITEMS);
  const [floorTables, setFloorTables] = usePersistentState('linoli_floor_tables', INITIAL_FLOOR_TABLES);
  const [activeOrders, setActiveOrders] = usePersistentState('linoli_active_orders', []);
  const [transactions, setTransactions] = usePersistentState('linoli_transactions', []);
  const [auditLogs, setAuditLogs] = usePersistentState('linoli_audit_logs', []);
  const [cancelledTickets, setCancelledTickets] = usePersistentState('linoli_cancelled_tickets', []);
  const [seqCounters, setSeqCounters] = usePersistentState('linoli_seq_counters', {
    order: 1,
    invoice: 1,
    cashOut: 1
  });

  const getNextOrderNumber = () => {
    let nextNum = seqCounters.order || 1;
    const maxActive = activeOrders.reduce((max, o) => {
      const match = (o.orderId || '').match(/ORD-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const maxTrans = transactions.reduce((max, t) => {
      const match = (t.orderRef || '').match(/ORD-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    nextNum = Math.max(nextNum, maxActive + 1, maxTrans + 1);

    setSeqCounters(prev => ({ ...prev, order: nextNum + 1 }));
    return `ORD-${String(nextNum).padStart(5, '0')}`;
  };

  const getNextInvoiceNumber = () => {
    let nextNum = seqCounters.invoice || 1;
    const maxInv = transactions.reduce((max, t) => {
      const match = (t.invoiceNo || '').match(/INV-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    nextNum = Math.max(nextNum, maxInv + 1);

    setSeqCounters(prev => ({ ...prev, invoice: nextNum + 1 }));
    return `INV-${String(nextNum).padStart(5, '0')}`;
  };

  const getNextCashOutNumber = () => {
    let nextNum = seqCounters.cashOut || 1;
    const allPayouts = Array.isArray(expenses) ? expenses : [];
    const maxCo = allPayouts.reduce((max, c) => {
      const match = (c.id || '').match(/CO-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    nextNum = Math.max(nextNum, maxCo + 1);

    setSeqCounters(prev => ({ ...prev, cashOut: nextNum + 1 }));
    return `CO-${String(nextNum).padStart(5, '0')}`;
  };

  const [unsettledVariance, setUnsettledVariance] = usePersistentState('linoli_unsettled_variance', 0);
  const [stockLogs, setStockLogs] = usePersistentState('linoli_stock_logs', []);
  
  const [settings, setSettings] = usePersistentState('linoli_system_settings', {
    restaurantName: 'Linoli Cove Midigama',
    tagline: 'HOTEL & LUXURY RESORT',
    legalName: 'Linoli Cove Leisure (Pvt) Ltd',
    businessRegNo: 'PV-00289144',
    taxId: 'TIN-109284719',
    terminalId: 'LINOLI-MAIN-01',
    phone: '+94 74 036 6741',
    email: 'info@linolicove.me',
    website: 'www.linolicove.me',
    address: '380 A Matara Road, Midigama, 81700',
    currency: 'Rs.',
    serviceChargeRate: 10,
    taxRate: 8,
    receiptRollWidth: '80mm',
    receiptFontSize: '11px',
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

  const [currentShift, setCurrentShift] = usePersistentState('linoli_current_shift', {
    shiftId: `SHIFT-${getLocalDateStr().replace(/-/g, '')}-01`,
    openedDate: getLocalDateStr(),
    openedAt: '09:00 AM',
    openedBy: 'System Administrator',
    startingFloat: 10000.00,
    status: 'OPEN',
    payouts: []
  });

  const [runningFloat, setRunningFloat] = usePersistentState('linoli_running_float', 10000.00);
  const [shiftHistory, setShiftHistory] = usePersistentState('linoli_shift_history', []);
  const [denominations, setDenominations] = usePersistentState('linoli_denominations', {
    5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0
  });

  const [cashOutForm, setCashOutForm] = useState({
    amount: '',
    category: 'Supplier / Vendor',
    reason: '',
    recipient: ''
  });
  const [cashOutApprovalModal, setCashOutApprovalModal] = useState({
    open: false,
    item: null,
    managerPin: '',
    error: ''
  });

  // POS State
  const [orderMode, setOrderMode] = useState('DINING');
  const [selectedTable, setSelectedTable] = useState(INITIAL_FLOOR_TABLES[0]);
  const [takeawayInfo, setTakeawayInfo] = useState({ name: 'Walk-in Guest', phone: '', token: 'TK-101' });
  const [guestCount, setGuestCount] = useState(2);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [serviceChargeActive, setServiceChargeActive] = useState(true);
  const [taxActive, setTaxActive] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [reportStartDate, setReportStartDate] = useState(getLocalDateStr());
  const [reportEndDate, setReportEndDate] = useState(getLocalDateStr());

  const [pairedUsbDevice, setPairedUsbDevice] = useState(null);
  const [usbStatusMessage, setUsbStatusMessage] = useState('');
  const [settingsNotice, setSettingsNotice] = useState(null);

  const [emailSettings, setEmailSettings] = usePersistentState('linoli_email_settings', {
    enabled: true,
    recipient: 'linolicove@gmail.com',
    scheduledTime: '23:30',
    webhookUrl: '',
    emailjsServiceId: '',
    emailjsTemplateId: '',
    emailjsPublicKey: '',
    lastSentDate: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [activePrintSlip, setActivePrintSlip] = useState(null);
  const [printNotice, setPrintNotice] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'Cashier', pin: '', email: '' });
  const [staffFormError, setStaffFormError] = useState('');
  const [addTableModalOpen, setAddTableModalOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ name: '', zone: 'Indoor Main Hall', capacity: 4 });
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [editBillModalOpen, setEditBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [newInventoryForm, setNewInventoryForm] = useState({ name: '', category: 'Housekeeping & Linen', stock: '', unit: 'sets', cost: '', threshold: '10' });
  const [receiveStockModalOpen, setReceiveStockModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [editInventoryModalOpen, setEditInventoryModalOpen] = useState(false);
  const [receiveStockForm, setReceiveStockForm] = useState({ ingredientId: '', quantity: '', supplier: '', invoiceRef: '', newCost: '' });
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDishForm, setNewDishForm] = useState({
    name: '',
    department: 'Kitchen',
    category: 'Deluxe Rooms',
    customCategory: '',
    price: '',
    prepTime: '24h Stay',
    description: '',
    imageUrl: '',
    recipeIngredients: []
  });
  const [recipeConfigModalOpen, setRecipeConfigModalOpen] = useState(false);
  const [editingDishForRecipe, setEditingDishForRecipe] = useState(null);
  const [currentRecipeIngredients, setCurrentRecipeIngredients] = useState([]);
  const [tempIngredientSelect, setTempIngredientSelect] = useState({ ingredientId: '', amount: '' });

  const isCloudSynced = useRef(false);
  const prevOrdersRef = useRef('');
  const prevTransRef = useRef('');
  const prevTablesRef = useRef('');
  const prevAuditsRef = useRef('');
  const prevMenuRef = useRef('');
  const prevInventoryRef = useRef('');
  const prevExpensesRef = useRef('');
  const prevStaffRef = useRef('');
  const prevShiftRef = useRef('');
  const prevDenomRef = useRef('');
  
  const [expenses, setExpenses] = useState(() => {
    try {
      const local = localStorage.getItem('linoli_expenses');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  });

  // REAL-TIME CLOUD LISTENERS
  useEffect(() => {
    const unsubOrders = subscribeToCloud('active_orders', (remoteOrders) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteOrders)) {
        const serialized = JSON.stringify(remoteOrders);
        if (prevOrdersRef.current === serialized) return;
        prevOrdersRef.current = serialized;
        setActiveOrders(remoteOrders);
        localStorage.setItem('linoli_active_orders', serialized);
      }
    });

    const unsubTrans = subscribeToCloud('transactions', (remoteTrans) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteTrans)) {
        const serialized = JSON.stringify(remoteTrans);
        if (prevTransRef.current === serialized) return;
        prevTransRef.current = serialized;
        setTransactions(remoteTrans);
        localStorage.setItem('linoli_transactions', serialized);
      }
    });

    const unsubTables = subscribeToCloud('floor_tables', (remoteTables) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteTables)) {
        const serialized = JSON.stringify(remoteTables);
        if (prevTablesRef.current === serialized) return;
        prevTablesRef.current = serialized;
        setFloorTables(remoteTables);
        localStorage.setItem('linoli_floor_tables', serialized);
      }
    });

    const unsubAudits = subscribeToCloud('audit_logs', (remoteAudits) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteAudits)) {
        const serialized = JSON.stringify(remoteAudits);
        if (prevAuditsRef.current === serialized) return;
        prevAuditsRef.current = serialized;
        setAuditLogs(remoteAudits);
        localStorage.setItem('linoli_audit_logs', serialized);
      }
    });

    const unsubMenu = subscribeToCloud('menu_items', (remoteMenu) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteMenu)) {
        const serialized = JSON.stringify(remoteMenu);
        if (prevMenuRef.current === serialized) return;
        prevMenuRef.current = serialized;
        setMenuItems(remoteMenu);
        localStorage.setItem('linoli_menu_items', serialized);
      }
    });

    const unsubInventory = subscribeToCloud('inventory', (remoteInv) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteInv)) {
        const serialized = JSON.stringify(remoteInv);
        if (prevInventoryRef.current === serialized) return;
        prevInventoryRef.current = serialized;
        setInventory(remoteInv);
        localStorage.setItem('linoli_inventory', serialized);
      }
    });

    const unsubExpenses = subscribeToCloud('expenses', (remoteExp) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteExp)) {
        const serialized = JSON.stringify(remoteExp);
        if (prevExpensesRef.current === serialized) return;
        prevExpensesRef.current = serialized;
        setExpenses(remoteExp);
        localStorage.setItem('linoli_expenses', serialized);
      }
    });

    const unsubShift = subscribeToCloud('current_shift', (remoteShift) => {
      isCloudSynced.current = true;
      if (remoteShift && typeof remoteShift === 'object') {
        const serialized = JSON.stringify(remoteShift);
        if (prevShiftRef.current === serialized) return;
        prevShiftRef.current = serialized;
        setCurrentShift(remoteShift);
        localStorage.setItem('linoli_current_shift', serialized);
      }
    });

    const unsubStaff = subscribeToCloud('staff_list', (remoteStaff) => {
      isCloudSynced.current = true;
      if (Array.isArray(remoteStaff) && remoteStaff.length > 0) {
        const serialized = JSON.stringify(remoteStaff);
        if (prevStaffRef.current === serialized) return;
        prevStaffRef.current = serialized;
        setStaffList(remoteStaff);
        localStorage.setItem('linoli_staff_list', serialized);
      }
    });

    const unsubDenominations = subscribeToCloud('denominations', (remoteDenom) => {
      isCloudSynced.current = true;
      if (remoteDenom && typeof remoteDenom === 'object') {
        const serialized = JSON.stringify(remoteDenom);
        if (prevDenomRef.current === serialized) return;
        prevDenomRef.current = serialized;
        setDenominations(remoteDenom);
        localStorage.setItem('linoli_denominations', serialized);
      }
    });

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubTrans === 'function') unsubTrans();
      if (typeof unsubTables === 'function') unsubTables();
      if (typeof unsubAudits === 'function') unsubAudits();
      if (typeof unsubMenu === 'function') unsubMenu();
      if (typeof unsubInventory === 'function') unsubInventory();
      if (typeof unsubExpenses === 'function') unsubExpenses();
      if (typeof unsubShift === 'function') unsubShift();
      if (typeof unsubStaff === 'function') unsubStaff();
      if (typeof unsubDenominations === 'function') unsubDenominations();
    };
  }, []);

  // BROADCAST LOCAL CHANGES UP TO FIREBASE
  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (activeOrders !== undefined) {
      const current = JSON.stringify(activeOrders);
      if (current !== prevOrdersRef.current) {
        prevOrdersRef.current = current;
        syncToCloud('active_orders', activeOrders);
      }
    }
  }, [activeOrders]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (transactions !== undefined) {
      const current = JSON.stringify(transactions);
      if (current !== prevTransRef.current) {
        prevTransRef.current = current;
        syncToCloud('transactions', transactions);
      }
    }
  }, [transactions]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (floorTables !== undefined) {
      const current = JSON.stringify(floorTables);
      if (current !== prevTablesRef.current) {
        prevTablesRef.current = current;
        syncToCloud('floor_tables', floorTables);
      }
    }
  }, [floorTables]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (auditLogs !== undefined) {
      const current = JSON.stringify(auditLogs);
      if (current !== prevAuditsRef.current) {
        prevAuditsRef.current = current;
        syncToCloud('audit_logs', auditLogs);
      }
    }
  }, [auditLogs]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (menuItems !== undefined && menuItems.length > 0) {
      const current = JSON.stringify(menuItems);
      if (current !== prevMenuRef.current) {
        prevMenuRef.current = current;
        syncToCloud('menu_items', menuItems);
      }
    }
  }, [menuItems]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (inventory !== undefined && inventory.length > 0) {
      const current = JSON.stringify(inventory);
      if (current !== prevInventoryRef.current) {
        prevInventoryRef.current = current;
        syncToCloud('inventory', inventory);
      }
    }
  }, [inventory]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (expenses !== undefined) {
      const current = JSON.stringify(expenses);
      if (current !== prevExpensesRef.current) {
        prevExpensesRef.current = current;
        syncToCloud('expenses', expenses);
      }
    }
  }, [expenses]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (currentShift !== undefined) {
      const current = JSON.stringify(currentShift);
      if (current !== prevShiftRef.current) {
        prevShiftRef.current = current;
        syncToCloud('current_shift', currentShift);
      }
    }
  }, [currentShift]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (staffList !== undefined && staffList.length > 0) {
      const current = JSON.stringify(staffList);
      if (current !== prevStaffRef.current) {
        prevStaffRef.current = current;
        syncToCloud('staff_list', staffList);
      }
    }
  }, [staffList]);

  useEffect(() => {
    if (!isCloudSynced.current) return;
    if (denominations && typeof denominations === 'object') {
      const current = JSON.stringify(denominations);
      if (current !== prevDenomRef.current) {
        prevDenomRef.current = current;
        syncToCloud('denominations', denominations);
      }
    }
  }, [denominations]);

  const handleCreateStaff = (e) => {
    e.preventDefault();
    setStaffFormError('');
    if (!newStaffForm.name.trim()) {
      setStaffFormError('Staff name is required.');
      return;
    }
    const cleanPin = newStaffForm.pin.trim();
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setStaffFormError('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (staffList.some(s => s.pin === cleanPin)) {
      setStaffFormError('This 4-digit PIN is already in use by another employee.');
      return;
    }

    const nameParts = newStaffForm.name.trim().split(' ');
    const initials = nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : newStaffForm.name.trim().substring(0, 2).toUpperCase();

    const newStaff = {
      id: `usr_${Date.now().toString().slice(-6)}`,
      name: newStaffForm.name.trim(),
      role: newStaffForm.role,
      pin: cleanPin,
      avatar: initials || 'ST',
      email: newStaffForm.email.trim() || `${newStaffForm.name.trim().toLowerCase().replace(/\s+/g, '')}@linolicove.me`
    };

    setStaffList(prev => [...prev, newStaff]);
    recordAuditLog('STAFF_CREATED', newStaff.id, `Created staff member ${newStaff.name} with role ${newStaff.role} (PIN: ${newStaff.pin})`);
    setAddStaffModalOpen(false);
    setNewStaffForm({ name: '', role: 'Cashier', pin: '', email: '' });
    setStaffFormError('');
  };

  const handleCreateInventoryItem = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const cleanName = (newInventoryForm.name || '').trim();
    const parsedCost = parseFloat(newInventoryForm.cost);
    const parsedStock = parseFloat(newInventoryForm.stock) || 0;
    const parsedThreshold = parseFloat(newInventoryForm.threshold) || 10;

    if (!cleanName) {
      alert('Please enter a name for the raw material.');
      return;
    }

    if (isNaN(parsedCost) || parsedCost <= 0) {
      alert('Please enter a valid unit cost greater than 0.');
      return;
    }

    const newItem = {
      id: `ing_${Date.now().toString().slice(-6)}`,
      name: cleanName,
      category: newInventoryForm.category || 'Housekeeping & Linen',
      stock: parsedStock,
      unit: newInventoryForm.unit || 'sets',
      cost: parsedCost,
      threshold: parsedThreshold
    };

    setInventory(prev => [...prev, newItem]);
    recordAuditLog('INVENTORY_ITEM_CREATED', newItem.id, `Added raw material ${newItem.name}`);
    setAddInventoryModalOpen(false);
    setNewInventoryForm({ name: '', category: 'Housekeeping & Linen', stock: '', unit: 'sets', cost: '', threshold: '10' });
  };

  const handleReceiveStock = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!receiveStockForm.ingredientId || !receiveStockForm.quantity) {
      alert('Please select an ingredient and enter a quantity.');
      return;
    }

    const qtyToAdd = parseFloat(receiveStockForm.quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    const targetItem = inventoryMap[receiveStockForm.ingredientId];
    const oldStock = targetItem ? targetItem.stock : 0;
    const newStock = Number((oldStock + qtyToAdd).toFixed(2));
    const parsedNewCost = parseFloat(receiveStockForm.newCost);
    const hasValidNewCost = !isNaN(parsedNewCost) && parsedNewCost > 0;

    setInventory(prev => prev.map(item => {
      if (item.id === receiveStockForm.ingredientId) {
        return {
          ...item,
          stock: newStock,
          cost: hasValidNewCost ? parsedNewCost : item.cost
        };
      }
      return item;
    }));

    recordAuditLog('STOCK_RECEIVED', receiveStockForm.ingredientId, `Received ${qtyToAdd} units of ${targetItem?.name || receiveStockForm.ingredientId}`);
    setReceiveStockModalOpen(false);
    setReceiveStockForm({ ingredientId: '', quantity: '', supplier: '', invoiceRef: '', newCost: '' });
  };

  const handleCreateTable = (e) => {
    e.preventDefault();
    if (!newTableForm.name.trim()) return;

    const count = floorTables.length + 1;
    const tableId = `T-${String(count).padStart(2, '0')}`;
    const newTable = {
      id: tableId,
      name: newTableForm.name.trim(),
      zone: newTableForm.zone || 'Indoor Main Hall',
      capacity: parseInt(newTableForm.capacity) || 4,
      status: 'VACANT',
      currentOrderRef: null
    };

    setFloorTables(prev => [...prev, newTable]);
    recordAuditLog('TABLE_CREATED', newTable.id, `Created room unit "${newTable.name}" in ${newTable.zone}`);
    setAddTableModalOpen(false);
    setNewTableForm({ name: '', zone: 'Indoor Main Hall', capacity: 4 });
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'Linoli Cove POS & ERP',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      settings,
      staffList,
      inventory,
      menuItems,
      floorTables,
      activeOrders,
      transactions,
      auditLogs,
      cancelledTickets,
      currentShift,
      shiftHistory
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linoli_cove_backup_${getLocalDateStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordAuditLog('BACKUP_EXPORTED', 'DATABASE', `Full system backup file downloaded by ${currentUser.name}`);
    setSettingsNotice({
      title: 'Backup Downloaded Successfully',
      detail: 'All room packages, staff, inventory, invoices & audit records exported to JSON.'
    });
    setTimeout(() => setSettingsNotice(null), 4000);
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
        if (parsed.floorTables) setFloorTables(parsed.floorTables);
        if (parsed.activeOrders) setActiveOrders(parsed.activeOrders);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.cancelledTickets) setCancelledTickets(parsed.cancelledTickets);
        if (parsed.currentShift) setCurrentShift(parsed.currentShift);
        if (parsed.shiftHistory) setShiftHistory(parsed.shiftHistory);

        recordAuditLog('BACKUP_RESTORED', file.name, `System restored from backup file by ${currentUser.name}`);
        setSettingsNotice({
          title: 'Database Restored Successfully',
          detail: `System data loaded from ${file.name}.`
        });
        setTimeout(() => setSettingsNotice(null), 4500);
      } catch (err) {
        alert('Could not parse backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

  const recordStockMovement = (type, ingredientId, ingredientName, diffQty, oldStock, newStock, unit, unitCost, reason, reference = '') => {
    const numericDiff = Number(diffQty) || 0;
    const numericCost = Number(unitCost) || 0;

    const newStockEntry = {
      id: `STK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString(),
      date: getLocalDateStr(),
      type,
      ingredientId,
      ingredientName,
      diffQty: numericDiff,
      oldStock: Number(oldStock) || 0,
      newStock: Number(newStock) || 0,
      unit: unit || 'units',
      unitCost: numericCost,
      totalCostImpact: Number((Math.abs(numericDiff) * numericCost).toFixed(2)),
      reason: reason || 'Stock level updated',
      reference: reference || 'N/A',
      staff: currentUser?.name || 'System'
    };

    setStockLogs(prev => [newStockEntry, ...(Array.isArray(prev) ? prev : [])]);
  };

  const inventoryMap = useMemo(() => {
    const map = {};
    (inventory || []).forEach(item => { if (item) map[item.id] = item; });
    return map;
  }, [inventory]);

  const inventoryValuation = useMemo(() => {
    const list = Array.isArray(inventory) ? inventory : [];
    let totalStockValue = 0;
    let lowStockCount = 0;
    const categoryTotals = {};

    list.forEach(item => {
      if (!item) return;
      const stock = Number(item.stock) || 0;
      const cost = Number(item.cost) || 0;
      const threshold = Number(item.threshold) || 0;
      const itemVal = stock * cost;

      totalStockValue += itemVal;
      if (stock <= threshold) lowStockCount += 1;

      const cat = item.category || 'General';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + itemVal;
    });

    let topCat = 'None';
    let maxCatVal = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxCatVal) {
        maxCatVal = val;
        topCat = cat;
      }
    });

    return { totalStockValue, totalItems: list.length, lowStockCount, topCat, maxCatVal };
  }, [inventory]);

  const calculateDishAvailability = (recipe) => {
    if (!recipe || !Array.isArray(recipe) || recipe.length === 0) {
      return { cogs: 0, portions: 999, isSoldOut: false };
    }
    let cogs = 0;
    let minPortions = Infinity;

    recipe.forEach(r => {
      const ing = inventoryMap[r.ingredientId];
      if (ing) {
        cogs += (ing.cost * r.amount);
        const available = r.amount > 0 ? Math.floor(ing.stock / r.amount) : 0;
        if (available < minPortions) minPortions = available;
      } else {
        minPortions = 0;
      }
    });

    if (minPortions === Infinity) minPortions = 0;
    return { cogs, portions: minPortions, isSoldOut: minPortions <= 0 };
  };

  const triggerAutoPrint = (slipConfig, noticeText = 'Printing thermal receipt...') => {
    setActivePrintSlip(slipConfig);
    setPrintNotice({
      title: slipConfig.type === 'FINAL_BILL' ? 'Bill Settled • Tax Invoice Auto-Printed' : 'Auto-Printing...',
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

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartDiscountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableBasis = Math.max(0, cartSubtotal - cartDiscountAmount);
  const cartServiceCharge = serviceChargeActive ? (taxableBasis * settings.serviceChargeRate) / 100 : 0;
  const cartTax = taxActive ? (taxableBasis * settings.taxRate) / 100 : 0;
  const cartGrandTotal = taxableBasis + cartServiceCharge + cartTax;

  const calculateOrderFinancials = (order) => {
    if (!order || !order.items) return { subtotal: 0, discount: 0, service: 0, tax: 0, total: 0 };
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = (subtotal * (order.discountPercent || 0)) / 100;
    const basis = Math.max(0, subtotal - discount);
    const service = order.serviceChargeActive ? (basis * settings.serviceChargeRate) / 100 : 0;
    const tax = order.taxActive ? (basis * settings.taxRate) / 100 : 0;
    const total = basis + service + tax;
    return { subtotal, discount, service, tax, total };
  };

  const handleAddToCart = (dish) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === dish.id);
      if (existing) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
      }
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      return [...prev, { ...dish, cartItemId, qty: 1, notes: '' }];
    });
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newOrderId = getNextOrderNumber();

    const orderPayload = {
      orderId: newOrderId,
      mode: orderMode,
      tableId: orderMode === 'DINING' ? selectedTable.id : null,
      tableName: orderMode === 'DINING' ? selectedTable.name : takeawayInfo.token,
      zone: orderMode === 'DINING' ? selectedTable.zone : 'Walk-in Guest',
      guestCount: orderMode === 'DINING' ? guestCount : 1,
      customerName: orderMode === 'TAKEAWAY' ? takeawayInfo.name : undefined,
      server: currentUser.name,
      sentAt: nowTime,
      status: 'BOOKED',
      serviceChargeActive,
      taxActive,
      discountPercent,
      items: [...cart]
    };

    setActiveOrders(prev => [orderPayload, ...prev]);

    if (orderMode === 'DINING') {
      setFloorTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'OCCUPIED', currentOrderRef: newOrderId } : t));
    }

    recordAuditLog('ORDER_DISPATCHED', newOrderId, `Dispatched stay booking for ${orderPayload.tableName}`);
    triggerAutoPrint({ type: 'KOT_BOT_DISPATCH', data: { order: orderPayload, kitchenItems: cart, barItems: [] } }, `${orderPayload.tableName} Stay Ticket`);
    setCart([]);
  };

  const handleCompleteSettlement = () => {
    const targetOrder = settlingOrder || {
      orderId: getNextOrderNumber(),
      mode: orderMode,
      tableName: orderMode === 'DINING' ? selectedTable.name : takeawayInfo.token,
      tableId: orderMode === 'DINING' ? selectedTable.id : null,
      items: cart,
      serviceChargeActive,
      taxActive,
      discountPercent
    };

    if (!targetOrder.items || targetOrder.items.length === 0) return;
    const { subtotal, discount, service, tax, total } = calculateOrderFinancials(targetOrder);

    const deductions = {};
    let orderRawCost = 0;

    targetOrder.items.forEach(cartItem => {
      const dish = menuItems.find(m => m.id === cartItem.id) || cartItem;
      if (dish.recipe && Array.isArray(dish.recipe)) {
        dish.recipe.forEach(r => {
          const needed = r.amount * cartItem.qty;
          deductions[r.ingredientId] = (deductions[r.ingredientId] || 0) + needed;
          const ing = inventoryMap[r.ingredientId];
          if (ing) orderRawCost += (ing.cost * needed);
        });
      }
    });

    setInventory(prev => prev.map(item => {
      if (deductions[item.id]) {
        return { ...item, stock: Math.max(0, Number((item.stock - deductions[item.id]).toFixed(2))) };
      }
      return item;
    }));

    const newInvoice = {
      invoiceNo: getNextInvoiceNumber(),
      orderRef: targetOrder.orderId,
      shiftId: currentShift.shiftId,
      date: `${getLocalDateStr()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      table: targetOrder.tableName,
      mode: targetOrder.mode,
      cashier: currentUser.name,
      items: targetOrder.items.map(i => ({ id: i.id, name: i.name, department: i.department, category: i.category || 'General', qty: i.qty, price: i.price })),
      subtotal,
      serviceCharge: service,
      tax,
      discount,
      total,
      paymentMethod,
      cogs: orderRawCost,
      cashTendered: paymentMethod === 'CASH' ? (parseFloat(cashTendered) || total) : undefined,
      changeDue: paymentMethod === 'CASH' ? Math.max(0, (parseFloat(cashTendered) || total) - total) : 0
    };

    setTransactions(prev => [newInvoice, ...prev]);
    setActiveOrders(prev => prev.filter(o => o.orderId !== targetOrder.orderId));

    if (targetOrder.tableId) {
      setFloorTables(prev => prev.map(t => t.id === targetOrder.tableId ? { ...t, status: 'VACANT', currentOrderRef: null } : t));
    }

    recordAuditLog('BILL_SETTLED', newInvoice.invoiceNo, `Settled ${newInvoice.invoiceNo} for ${settings.currency} ${total.toFixed(2)}`);
    triggerAutoPrint({ type: 'FINAL_BILL', data: newInvoice }, `${newInvoice.table} • ${settings.currency} ${total.toFixed(2)}`);

    setSettlingOrder(null);
    setCheckoutModalOpen(false);
    setCashTendered('');
    setCart([]);
  };

  const handlePinSubmit = (pinVal) => {
    const pin = pinVal || loginPinInput;
    setLoginError('');
    const found = staffList.find(s => s.pin === pin);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setLoginPinInput('');
      const allowed = ROLE_PERMISSIONS[found.role] || [];
      setActiveTab(allowed.includes('pos') ? 'pos' : (allowed[0] || 'pos'));
    } else {
      setLoginError('Invalid PIN.');
    }
  };

  const categoriesList = useMemo(() => {
    const cats = new Set(['All']);
    menuItems.forEach(m => cats.add(m.category));
    return Array.from(cats);
  }, [menuItems]);

  const salesMetrics = useMemo(() => {
    let grossRevenue = 0;
    let itemSubtotal = 0;
    let serviceCharge = 0;
    let taxes = 0;
    let discounts = 0;
    const paymentMethods = {};
    const itemSalesMap = {};

    transactions.forEach(t => {
      grossRevenue += Number(t.total) || 0;
      itemSubtotal += Number(t.subtotal) || 0;
      serviceCharge += Number(t.serviceCharge) || 0;
      taxes += Number(t.tax) || 0;
      discounts += Number(t.discount) || 0;

      const m = t.paymentMethod || 'CASH';
      paymentMethods[m] = (paymentMethods[m] || { count: 0, total: 0 });
      paymentMethods[m].count += 1;
      paymentMethods[m].total += t.total;

      (t.items || []).forEach(item => {
        if (!itemSalesMap[item.name]) {
          itemSalesMap[item.name] = { name: item.name, category: item.category || 'General', unitPrice: item.price, sold: 0, revenue: 0 };
        }
        itemSalesMap[item.name].sold += item.qty;
        itemSalesMap[item.name].revenue += (item.price * item.qty);
      });
    });

    const topItems = Object.values(itemSalesMap).sort((a, b) => b.sold - a.sold);
    return { grossRevenue, itemSubtotal, serviceCharge, taxes, discounts, paymentMethods, topItems, paidBillsCount: transactions.length };
  }, [transactions]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b14] p-4 font-sans select-none antialiased">
        <div className="w-full max-w-[390px] rounded-[32px] border border-[#1b253b] bg-[#0c1424]/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ff5500] to-[#ff6a00] text-2xl font-black text-white shadow-lg shadow-orange-600/40">
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
                    if (next.length === 4) handlePinSubmit(next);
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
                  if (next.length === 4) handlePinSubmit(next);
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

      {/* DRAWER SIDEBAR */}
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
              { id: 'pos', name: 'Room Bookings POS', icon: Monitor, badge: cart.reduce((a, b) => a + b.qty, 0) },
              { id: 'billing', name: 'Billing & Settlement', icon: Receipt, badge: activeOrders.length },
              { id: 'tables', name: 'Room Units Map', icon: Grid },
              { id: 'stock', name: 'Linen & Housekeeping Stock', icon: Package },
              { id: 'recipes', name: 'Tariffs & COGS', icon: BookOpen },
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
            <button onClick={() => setIsAuthenticated(false)} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* VIEW 1: POS TERMINAL */}
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
                    value={menuSearchQuery}
                    onChange={e => setMenuSearchQuery(e.target.value)}
                    placeholder="Search rooms..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#ff5500]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <div className="bg-slate-100/80 p-3.5 rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {menuItems
                      .filter(dish => (selectedCategory === 'All' || dish.category === selectedCategory) && dish.name.toLowerCase().includes(menuSearchQuery.toLowerCase()))
                      .map(dish => (
                        <div
                          key={dish.id}
                          onClick={() => handleAddToCart(dish)}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#ff5500] cursor-pointer overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
                        >
                          {dish.imageUrl && (
                            <div className="relative h-28 w-full bg-slate-100 overflow-hidden shrink-0 border-b border-slate-200">
                              <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
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
                            <span className="text-[#ff5500] font-bold">+ Add Stay</span>
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
                <span className="text-[10px] font-black uppercase text-slate-400 block">Assigned Unit</span>
                <select
                  value={selectedTable.id}
                  onChange={(e) => {
                    const tbl = floorTables.find(t => t.id === e.target.value);
                    if (tbl) setSelectedTable(tbl);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                >
                  {floorTables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.zone}) [{t.status}]</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                    <Receipt className="h-10 w-10 mb-2 stroke-[1]" />
                    <p className="text-xs font-bold text-slate-600">Ticket is empty</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tap room packages to build booking.</p>
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
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
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
                  <span>Confirm Stay Booking</span>
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

        {/* VIEW 2: BILLING & SETTLEMENT QUEUE */}
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
                  <p className="text-xs mt-1">Bookings sent from the POS terminal will appear here.</p>
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
                            <p className="text-xs text-slate-500">Staff: {order.server} • {order.sentAt}</p>
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

        {/* VIEW 3: ROOM UNITS MAP */}
        {activeTab === 'tables' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Room Units &amp; Floor Map</h2>
                <p className="text-xs text-slate-500">Live room occupancy, suites, and guest allocations.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {floorTables.map(tbl => (
                <div key={tbl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{tbl.id}</span>
                        <h3 className="text-base font-black text-slate-900">{tbl.name}</h3>
                        <p className="text-xs text-slate-500">{tbl.zone}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tbl.status === 'OCCUPIED' ? 'bg-orange-100 text-[#ff5500]' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {tbl.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-mono">Capacity: {tbl.capacity} Guests</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => { setSelectedTable(tbl); setActiveTab('pos'); }}
                      className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                    >
                      {tbl.status === 'OCCUPIED' ? 'Open Order' : 'Assign Room'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: STOCK & INVENTORY */}
        {activeTab === 'stock' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Linen, Supplies &amp; Amenities Stock</h2>
                <p className="text-xs text-slate-500">Track housekeeping supplies, minibar stock, and amenity kits.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddInventoryModalOpen(true)}
                className="px-3.5 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Stock Material
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.stock} {item.unit}</td>
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

        {/* VIEW 5: RECIPES & TARIFFS */}
        {activeTab === 'recipes' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-900">Tariff Packages &amp; Housekeeping BOM</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(dish => (
                <div key={dish.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                  <h3 className="text-base font-black text-slate-900">{dish.name}</h3>
                  <p className="text-xs text-slate-500">{dish.description}</p>
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Nightly Rate:</span>
                    <span className="text-base font-black text-[#ff5500]">{settings.currency} {dish.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 6: CASHIER SHIFTS */}
        {activeTab === 'shifts' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Cashier Shifts &amp; Drawer Balancing</h2>
                <p className="text-xs text-slate-500">Active Shift: {currentShift.shiftId} • Opened by {currentShift.openedBy}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Starting Float</p>
                <p className="text-2xl font-black font-mono text-slate-900 mt-1">{settings.currency} {currentShift.startingFloat.toFixed(2)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Settled Invoices</p>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">{transactions.length} Bills</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Drawer Revenue</p>
                <p className="text-2xl font-black font-mono text-[#ff5500] mt-1">
                  {settings.currency} {transactions.reduce((acc, t) => acc + (Number(t.total) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: SALES REPORTS */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-900">Hotel Sales &amp; Revenue Reports</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(t => (
                    <tr key={t.invoiceNo} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{t.invoiceNo}</td>
                      <td className="py-2.5 px-3 text-slate-500">{t.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.table}</td>
                      <td className="py-2.5 px-3">{t.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">{settings.currency} {t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 8: MENU MANAGEMENT */}
        {activeTab === 'menu_admin' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Room Tariffs &amp; Package Rates</h2>
                <p className="text-xs text-slate-500">Configure room nights, villas, and suites.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(true)}
                className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
              >
                <Plus className="h-4 w-4" /> Add Room Tariff
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Room Tariff</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Nightly Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#ff5500]">{settings.currency} {item.price.toFixed(2)}</td>
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

        {/* VIEW 9: CANCELLED TICKETS */}
        {activeTab === 'cancelled' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-xl font-black text-slate-900">Cancelled Tickets &amp; Voids</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Room Package</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancelledTickets.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">No cancelled tickets logged.</td>
                    </tr>
                  ) : (
                    cancelledTickets.map(voidItem => (
                      <tr key={voidItem.id}>
                        <td className="py-3 px-4 text-slate-500">{voidItem.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{voidItem.itemName}</td>
                        <td className="py-3 px-4 italic">{voidItem.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 10: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Staff Credentials &amp; Security Roles</h2>
                <p className="text-xs text-slate-500">Configure terminal staff members and 4-digit security PINs.</p>
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

        {/* VIEW 11: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
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
                    setSettingsNotice({ title: 'Settings Saved', detail: `Configuration for ${settings.restaurantName} updated.` });
                    setTimeout(() => setSettingsNotice(null), 3500);
                  }}
                  className="px-4 py-2 bg-[#008f5d] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {/* CARD 1: COMPANY & BUSINESS INFORMATION */}
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

            {/* CARD 2: AUTOMATED DAILY 11:30 PM EMAIL DISPATCH */}
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Time (24h)</label>
                  <input
                    type="text"
                    value={emailSettings.scheduledTime}
                    onChange={e => setEmailSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
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
                  <p className="text-[11px] text-slate-500">Gross revenue, net sales, taxes, discounts, cashier drawer counts &amp; audit records.</p>
                </div>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => {
                    setIsSendingEmail(true);
                    setTimeout(() => {
                      setIsSendingEmail(false);
                      setSettingsNotice({ title: 'Report Dispatched', detail: `Sent to ${emailSettings.recipient}` });
                      setTimeout(() => setSettingsNotice(null), 3000);
                    }, 1200);
                  }}
                  className="px-4 py-2 bg-[#ff5500] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingEmail ? 'Dispatching...' : 'Send Daily Report Now'}</span>
                </button>
              </div>
            </div>

            {/* CARD 3: THERMAL AUTO-PRINTER CONFIGURATION */}
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
                    <option value="YES">Yes - Print Stay Slip</option>
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
            </div>

            {/* CARD 4: AUTOMATED CASH DRAWER SOLENOID */}
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

            {/* CARD 5: CURRENCY, TAXES & SURCHARGE RATES */}
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Service Charge (%)</label>
                  <input
                    type="number"
                    value={settings.serviceChargeRate}
                    onChange={e => setSettings(prev => ({ ...prev, serviceChargeRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sales Tax / VAT Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff5500]"
                  />
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

            {/* CARD 6: SYSTEM DATABASE BACKUP & DISASTER RECOVERY */}
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
                    <p className="text-[11px] text-slate-500 mt-1">Download complete snapshot of tariffs, inventory, and ledger history.</p>
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
                    <p className="text-[11px] text-slate-500 mt-1">Upload a previously exported `.json` file to restore system records.</p>
                  </div>
                  <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5 text-slate-600" />
                    <span>Select Backup File (.json)</span>
                    <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 7: ADMINISTRATOR DATA PURGE */}
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
                      setFloorTables(prev => prev.map(t => ({ ...t, status: 'VACANT', currentOrderRef: null })));
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
      </main>

      {/* CHECKOUT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Settle Room Bill</h3>
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
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex justify-between font-black text-sm">
                  <span>Total Due</span>
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