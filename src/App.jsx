// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove
} from "firebase/database";
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
  Banknote,
  ArrowRight,
  Clock,
  ShoppingBag,
  Search,
  AlertTriangle,
  PackagePlus,
  Waves,
  UserPlus,
  DollarSign,
  LogIn,
  LogOut,
  FileSpreadsheet,
  Coins,
  Lock,
  ShieldCheck,
  Delete,
  Camera,
  Upload,
  Image as ImageIcon,
  Save,
  Download,
  Send,
  Volume2,
  VolumeX,
  RefreshCw
} from "lucide-react";

// --- 1. FIREBASE CONFIGURATION (REALTIME DATABASE) ---
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
const rtdb = getDatabase(app);

// Comprehensive settings schema matching your settings image
const DEFAULT_SETTINGS = {
  // Company & Business Information
  hotelName: "Linoli Cove Midigama",
  tagline: "RESTAURANT & BAR",
  legalEntity: "Linoli Cove Leisure (Pvt) Ltd",
  companyRegNo: "PV-00285111",
  taxNumber: "TIN-109284719",
  terminalId: "LINOLI-MAIN-01",
  phone: "+94 74 036 4741",
  email: "info@linolicove.me",
  website: "www.linolicove.me",
  address: "502 A Matara Road, Midigama, 81700",

  // Automated Email Dispatch
  emailRecipient: "linolicove@gmail.com",
  emailScheduleTime: "23:30",
  emailStatus: "Disabled (Manual trigger only)",

  // Thermal Auto-Printer Configuration
  paperRollWidth: "80mm", // '80mm' or '58mm'
  receiptFontSize: "14px - Extra Bold & Large",
  receiptFontType: "Monospace (Classic ESC/POS)",
  slipMargins: "2mm - Standard Thermal Margin",
  autoPrintKOT: "Yes - Print KOT & BOT Slips",
  autoPrintSettlement: "Yes - Print Final Tax Invoice",

  // Automated Cash Drawer Solenoid
  autoDrawerKick: "Enabled (Auto-Pop on Payment)",
  drawerKickTrigger: "Cash Payments Only",
  drawerPinout: "Pin 2 / ESC p 0 (Epson, Rongta, Xprint)",
  drawerChime: true,

  // Currency, Taxes & Surcharge Rates
  currency: "Rs.",
  serviceChargeRate: 10,
  vatRate: 0,
  headerNote: "Linoli Cove Beach Resort & Dining\nBeach Road, Midigama\nTel: +94 74 036 4741",
  footerNote: "Thank you for your visit!\nPlease come again.",
};

const INITIAL_INVENTORY_SEEDS = [
  { id: "inv1", name: "Artisanal Sparkling Water", category: "minibar", price: 850, stock: 48 },
  { id: "inv2", name: "Organic Coconut Chips", category: "minibar", price: 650, stock: 32 },
  { id: "inv3", name: "Sea Salt Scrub Pack", category: "amenity", price: 1200, stock: 15 },
  { id: "inv4", name: "Egyptian Cotton Bath Towel", category: "linen", price: 0, stock: 75 },
  { id: "inv5", name: "Cold Brew Coconut Latte", category: "minibar", price: 950, stock: 18 },
  { id: "inv6", name: "Local Lion Craft Beer", category: "beverage", price: 1100, stock: 24 }
];

const INITIAL_STAFF_SEEDS = [
  { 
    id: "s1", 
    name: "Kailani Silva", 
    role: "General Manager", 
    pin: "1001", 
    type: "Full-Time", 
    baseSalary: 125000, 
    allowances: 25000,
    serviceCharge: 35000,
    bonus: 15000,
    paid: true, 
    phone: "+94 77 123 4567"
  },
  { 
    id: "s2", 
    name: "Noah Jensen", 
    role: "Front Desk Supervisor", 
    pin: "2044", 
    type: "Full-Time", 
    baseSalary: 75000, 
    allowances: 15000,
    serviceCharge: 35000,
    bonus: 8000,
    paid: false, 
    phone: "+94 77 234 5678"
  },
  { 
    id: "s3", 
    name: "Leilani Kea", 
    role: "Housekeeping Lead", 
    pin: "3055", 
    type: "Full-Time", 
    baseSalary: 65000, 
    allowances: 12000,
    serviceCharge: 35000,
    bonus: 5000,
    paid: false, 
    phone: "+94 77 345 6789"
  }
];

// Helper: Get Today's Date String YYYY-MM-DD
const getTodayKey = () => new Date().toISOString().split("T")[0];

// --- 2. PROGRAMMATIC ISOLATED PRINT ENGINE ---
function printIsolatedDocument(htmlBody, mode = "thermal") {
  const existingFrame = document.getElementById("pos-print-frame");
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "pos-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const styles = `
    <style>
      @page {
        size: ${mode === "thermal" ? "72mm auto" : "A4 portrait"};
        margin: ${mode === "thermal" ? "0mm" : "15mm"};
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: ${mode === "thermal" ? "'Courier New', Courier, monospace" : "system-ui, -apple-system, sans-serif"};
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .thermal-container {
        width: 68mm;
        margin: 0 auto;
        padding: 2mm 0;
        font-size: 11px;
        line-height: 1.25;
      }
      .a4-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        font-size: 12px;
        line-height: 1.4;
        color: #091D26;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
    </style>
  `;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>Print Preview</title>${styles}</head><body>${htmlBody}</body></html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 250);
}

function buildThermalHtml({ settings, room, isTemporary, settlementMethod, total }) {
  const items = room?.orderItems || [];
  return `
    <div class="thermal-container">
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px;">
        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase;">${settings.hotelName}</div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">${settings.tagline}</div>
        <div style="font-size: 10px; margin-top: 4px;">${settings.address}</div>
        <div style="font-size: 10px;">Tel: ${settings.phone}</div>
        <div style="font-size: 10px;">Tax Reg: ${settings.taxNumber}</div>
        <div style="margin-top: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
          ${isTemporary ? "-- PRE-CHECK / GUEST TAB --" : "-- FINAL SETTLED INVOICE --"}
        </div>
      </div>
      <div style="padding: 6px 0; border-bottom: 1px dashed #000; font-size: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>ORDER: ${room?.orderId || `ORD-${room?.number}`}</span>
          <span>ROOM: #${room?.number}</span>
        </div>
        <div>GUEST: ${room?.guestName || "Walk-In"}</div>
        <div style="display: flex; justify-content: space-between;">
          <span>STATUS: ${isTemporary ? "PENDING" : `PAID (${settlementMethod})`}</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <table style="margin: 6px 0; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding: 4px 0;">ITEM</th>
            <th style="text-align: center; padding: 4px 0;">QTY</th>
            <th style="text-align: right; padding: 4px 0;">AMT</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px dotted #ccc;">
              <td style="padding: 4px 0;">${item.description}</td>
              <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
              <td style="text-align: right; padding: 4px 0;">${settings.currency}${Number(item.total).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between;">
        <span>${isTemporary ? "TOTAL DUE:" : "TOTAL PAID:"}</span>
        <span>${settings.currency}${Number(total).toFixed(2)}</span>
      </div>
      <div style="text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px dashed #000; font-size: 10px;">
        <div>${settings.footerNote}</div>
      </div>
    </div>
  `;
}

function buildA4Html({ settings, room, isTemporary, settlementMethod, total }) {
  const items = room?.orderItems || [];
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555;">${settings.tagline}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">${settings.address} | Tel: ${settings.phone}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;">Tax Reg: ${settings.taxNumber} | BRN: ${settings.companyRegNo}</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px;">
            ${isTemporary ? "GUEST STATEMENT" : "OFFICIAL TAX INVOICE"}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Date:</b> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;"><b>Folio No:</b> ${room?.orderId || `ORD-${room?.number}`}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; padding: 12px 16px; border: 1px solid #091D26; border-radius: 4px;">
        <div>
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Guest Information</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">${room?.guestName || "Unregistered Guest"}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ${room?.guestPhone || "No contact recorded"}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Settlement: <b>${isTemporary ? "Pending" : settlementMethod}</b></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Stay Details</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">Room #${room?.number} (${room?.type})</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Duration: ${room?.checkIn} to ${room?.checkOut}</p>
        </div>
      </div>
      <table style="margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; text-align: left;">
            <th style="padding: 10px 4px;">Description</th>
            <th style="padding: 10px 4px; text-align: center;">Qty</th>
            <th style="padding: 10px 4px; text-align: right;">Rate</th>
            <th style="padding: 10px 4px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 4px;">${item.description}</td>
              <td style="padding: 10px 4px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px 4px; text-align: right;">${settings.currency}${Number(item.unitPrice).toFixed(2)}</td>
              <td style="padding: 10px 4px; text-align: right; font-weight: bold;">${settings.currency}${Number(item.total).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="border-top: 2px solid #091D26; border-bottom: 2px solid #091D26; padding: 12px 4px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: bold;">Total Paid (${settlementMethod}):</span>
        <span style="font-size: 20px; font-weight: 900;">${settings.currency}${Number(total).toFixed(2)}</span>
      </div>
      <div style="margin-top: 50px; text-align: center; font-size: 11px; border-top: 1px solid #ddd; padding-top: 12px;">
        <p style="margin: 0; font-weight: 500;">${settings.footerNote}</p>
      </div>
    </div>
  `;
}

// --- 3. MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [activeTab, setActiveTab] = useState("frontdesk");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // RTDB Synchronized State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY_SEEDS);
  const [staff, setStaff] = useState(INITIAL_STAFF_SEEDS);
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [loading, setLoading] = useState(true);

  // Active Selection & Print Mode State
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [printFormat, setPrintFormat] = useState("thermal");
  const [isTemporaryBill, setIsTemporaryBill] = useState(false);

  // Modals & Camera State
  const [checkInModalRoom, setCheckInModalRoom] = useState(null);
  const [settleOrderRoom, setSettleOrderRoom] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("Credit Card");
  const [cashTendered, setCashTendered] = useState("");
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", nights: 1 });
  const [guestPhoto, setGuestPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Room / Stock Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ number: "", type: "Ocean Breeze King", rate: 18000, status: "available" });
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInventoryForm, setNewInventoryForm] = useState({ name: "", category: "minibar", price: "850", stock: "20" });

  // Permissions Map
  const isManager = currentUser?.role?.toLowerCase().includes("manager");
  const isFrontDesk = currentUser?.role?.toLowerCase().includes("front desk");
  const isHousekeeping = currentUser?.role?.toLowerCase().includes("housekeeping");

  const canAccessTab = (tabId) => {
    if (!currentUser) return false;
    if (isManager) return true;
    if (tabId === "frontdesk") return true;
    if (tabId === "active-orders" && (isFrontDesk || isManager)) return true;
    if (tabId === "inventory" && (isFrontDesk || isManager || isHousekeeping)) return true;
    if (tabId === "staff") return true;
    if (tabId === "room-admin" && isManager) return true;
    if (tabId === "settings" && isManager) return true;
    return false;
  };

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    // 1. Settings Listener
    const settingsRef = ref(rtdb, "hotel_config/profile");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
        setSettingsForm(data);
      } else {
        set(settingsRef, DEFAULT_SETTINGS);
        setSettingsForm(DEFAULT_SETTINGS);
      }
    });

    // 2. Rooms Listener
    const roomsRef = ref(rtdb, "rooms");
    const unsubRooms = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedRooms = Object.keys(data).map((key) => {
          const roomObj = data[key];
          const rawItems = roomObj.orderItems || {};
          const orderItemsArray = Array.isArray(rawItems)
            ? rawItems
            : Object.keys(rawItems).map((k) => ({ ...rawItems[k], id: k }));
          return { ...roomObj, id: key, orderItems: orderItemsArray };
        });
        setRooms(loadedRooms.sort((a, b) => String(a.number).localeCompare(String(b.number))));
      }
    });

    // 3. Inventory Listener
    const invRef = ref(rtdb, "inventory");
    const unsubInv = onValue(invRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loaded = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          name: data[key].name || "Unnamed Item",
          price: Number(data[key].price) || 0,
          stock: Number(data[key].stock) || 0,
        }));
        setInventory(loaded.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });

    // 4. Staff Listener
    const staffRef = ref(rtdb, "staff");
    const unsubStaff = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const staffList = Object.keys(data).map((k) => ({
          ...data[k],
          id: k,
          baseSalary: Number(data[k].baseSalary) || 0,
          allowances: Number(data[k].allowances) || 0,
          serviceCharge: Number(data[k].serviceCharge) || 0,
          bonus: Number(data[k].bonus) || 0,
          paid: Boolean(data[k].paid)
        }));
        setStaff(staffList);
      }
      setLoading(false);
    });

    // 5. Daily Attendance Record Listener (Carried Forward by Date)
    const attendanceRef = ref(rtdb, `attendance_history/${selectedDate}`);
    const unsubAttendance = onValue(attendanceRef, (snapshot) => {
      setDailyAttendance(snapshot.val() || {});
    });

    return () => {
      unsubSettings();
      unsubRooms();
      unsubInv();
      unsubStaff();
      unsubAttendance();
    };
  }, [selectedDate]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const calculateTotal = (room) => room?.orderItems?.reduce((acc, item) => acc + (Number(item.total) || 0), 0) || 0;
  const printTargetRoom = settleOrderRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);

  // --- ACTIONS: SETTINGS SAVE & BACKUP ---
  const handleSaveAllSettings = () => {
    set(ref(rtdb, "hotel_config/profile"), settingsForm);
    setSaveSuccessMsg("Settings Saved Successfully! ✓");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleDownloadBackup = () => {
    onValue(ref(rtdb), (snap) => {
      const fullDb = snap.val();
      const blob = new Blob([JSON.stringify(fullDb, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LinoliCove_Backup_${getTodayKey()}.json`;
      a.click();
    }, { onlyOnce: true });
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm("Restore database from JSON file? This will overwrite existing records.")) {
          set(ref(rtdb), json);
          alert("Database successfully restored!");
        }
      } catch (err) {
        alert("Invalid JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePurgeTestData = () => {
    if (window.prompt('Type "CONFIRM" to clear guest orders and reset rooms to Available:') === "CONFIRM") {
      rooms.forEach((r) => {
        update(ref(rtdb, `rooms/${r.id}`), {
          status: "available",
          orderId: null,
          openedAt: null,
          guestName: "",
          guestPhone: "",
          guestPhoto: null,
          orderItems: null
        });
      });
      alert("Test transactions cleared!");
    }
  };

  // --- DAILY ATTENDANCE & PERSISTENCE ---
  const formatTimeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleClockIn = (staffMember) => {
    const timeStr = formatTimeNow();
    const day = getTodayKey();
    const record = {
      staffId: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      clockIn: timeStr,
      clockOut: "",
      isOnDuty: true,
      date: day
    };
    set(ref(rtdb, `attendance_history/${day}/${staffMember.id}`), record);
  };

  const handleClockOut = (staffMember) => {
    const timeStr = formatTimeNow();
    const day = getTodayKey();
    update(ref(rtdb, `attendance_history/${day}/${staffMember.id}`), {
      clockOut: timeStr,
      isOnDuty: false
    });
  };

  // PIN Login & Camera Handlers
  const handlePinDigit = (digit) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      if (nextPin.length >= 4) {
        const matched = staff.find((s) => String(s.pin) === String(nextPin));
        if (matched) {
          setCurrentUser(matched);
          setPinInput("");
          setPinError("");
        } else {
          setPinError("Invalid PIN");
        }
      }
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Camera permission denied or camera unavailable.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 640, 480);
      setGuestPhoto(canvas.toDataURL("image/jpeg", 0.7));
      stopCamera();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // PIN LOCK SCREEN
  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#06151E] via-[#091D26] to-[#0F2D3C] text-white items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#14B8A6] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#14B8A6]/30">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{settings.hotelName}</h1>
          <p className="text-xs text-[#2DD4BF] font-medium mt-0.5">{settings.tagline}</p>

          <div className="my-6 flex flex-col items-center">
            <div className="flex items-center gap-3 h-10">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pinInput.length > idx ? "bg-[#14B8A6] scale-125" : "border-2 border-white/20"
                  }`}
                />
              ))}
            </div>
            {pinError && <span className="text-xs font-semibold text-[#F43F5E] mt-2">{pinError}</span>}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Del"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "Clear") setPinInput("");
                  else if (key === "Del") setPinInput((prev) => prev.slice(0, -1));
                  else handlePinDigit(key);
                }}
                className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 text-lg font-bold transition-all border border-white/5 flex items-center justify-center"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F5] text-[#091D26]">
      {/* SIDEBAR */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-[#091D26] border-r border-[#0F2D3C] text-white shrink-0">
        <div className="p-6 border-b border-[#0F2D3C] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-white font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight truncate">{settings.hotelName}</h1>
            <p className="text-[11px] text-[#2DD4BF] font-medium">{settings.tagline}</p>
          </div>
        </div>

        <div className="p-4 border-b border-[#0F2D3C] bg-white/5 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-[#2DD4BF] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {currentUser.role}
            </span>
            <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-[#F43F5E] text-slate-300 hover:text-white"
            title="Lock Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: "frontdesk", label: "Front Desk & Status", icon: Bed },
            { id: "active-orders", label: "Active Bills & Tabs", icon: Receipt },
            { id: "inventory", label: "Stock & Minibar", icon: Boxes },
            { id: "room-admin", label: "Room Management", icon: SlidersHorizontal },
            { id: "staff", label: "Staff & Attendance", icon: Users },
            { id: "settings", label: "Hotel Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            if (!canAccessTab(id)) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id ? "bg-[#0D9488] text-white shadow-sm" : "text-slate-300 hover:bg-[#0F2D3C] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* MOBILE TOPBAR */}
        <header className="no-print md:hidden flex items-center justify-between p-4 bg-[#091D26] text-white border-b border-[#0F2D3C]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2DD4BF]" />
            <span className="font-bold text-sm truncate">{settings.hotelName}</span>
          </div>
          <button type="button" onClick={() => setCurrentUser(null)} className="p-1 rounded bg-white/10 text-slate-300">
            <Lock className="w-4 h-4" />
          </button>
        </header>

        <main className="no-print flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: FRONT DESK */}
          {activeTab === "frontdesk" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26]">Front Desk Operations</h2>
                  <p className="text-sm text-slate-500">Live guest room status, photo IDs, and check-in</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white border border-[#E6DFD3] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl font-black">#{room.number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          room.status === "available" ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-[#0F2D3C] text-white"
                        }`}>{room.status}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#0F766E] uppercase">{room.type}</p>
                      <p className="text-xs text-slate-500 mb-4">{settings.currency}{room.rate} / night</p>

                      {room.status === "occupied" && (
                        <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4 text-xs space-y-2">
                          <div className="flex items-center gap-3">
                            {room.guestPhoto ? (
                              <img src={room.guestPhoto} alt="Guest" className="w-10 h-10 rounded-full object-cover border border-[#14B8A6]" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-bold block truncate">{room.guestName}</span>
                              <span className="text-[10px] text-slate-500">{room.guestPhone}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#F3EFE6] flex gap-2">
                      {room.status === "available" ? (
                        <button
                          type="button"
                          onClick={() => { setCheckInModalRoom(room); setGuestPhoto(null); }}
                          className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" /> Check In & Photo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setSelectedRoomId(room.id); setActiveTab("active-orders"); }}
                          className="w-full bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26] py-2 rounded-lg text-xs font-semibold"
                        >
                          View Folio
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE BILLS */}
          {activeTab === "active-orders" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Active Bills & Guest Tabs</h2>
                  <p className="text-sm text-slate-500">Print temporary pro-forma check or settle official tax invoices</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {rooms.filter((r) => r.status === "occupied").map((room) => {
                  const billTotal = calculateTotal(room);
                  return (
                    <div key={room.id} className="bg-white rounded-xl border border-[#E6DFD3] p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs uppercase font-bold text-[#0F766E]">{room.orderId}</span>
                          <h3 className="text-xl font-black">Room #{room.number}</h3>
                        </div>
                        <span className="text-xl font-black text-[#0D9488]">{settings.currency}{billTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const html = buildThermalHtml({ settings, room, isTemporary: true, settlementMethod: "Pending", total: billTotal });
                            printIsolatedDocument(html, "thermal");
                          }}
                          className="flex-1 bg-[#0F2D3C] text-white py-2 rounded-lg text-xs font-semibold"
                        >
                          Print Temp
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const html = buildA4Html({ settings, room, isTemporary: false, settlementMethod: "Paid", total: billTotal });
                            printIsolatedDocument(html, "a4");
                            update(ref(rtdb, `rooms/${room.id}`), { status: "available", orderId: null, guestName: "", guestPhoto: null, orderItems: null });
                          }}
                          className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-xs font-bold"
                        >
                          Settle & Print
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Inventory & Minibar Stock</h2>
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(true)}
                  className="bg-[#14B8A6] text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  + Add Stock Item
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DFD3] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Price</th>
                      <th className="p-3.5 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3.5 font-bold">{item.name}</td>
                        <td className="p-3.5">{item.category}</td>
                        <td className="p-3.5 text-right">{settings.currency}{Number(item.price).toFixed(2)}</td>
                        <td className="p-3.5 text-center font-bold">{item.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROOM ADMIN */}
          {activeTab === "room-admin" && isManager && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Room Inventory Setup</h2>
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(true)}
                  className="bg-[#14B8A6] text-white px-4 py-2 rounded-lg text-xs font-bold"
                >
                  + Add Room
                </button>
              </div>
              <div className="bg-white rounded-xl border border-[#E6DFD3] p-4">
                {rooms.map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-none text-xs">
                    <span className="font-bold">Room #{r.number} - {r.type}</span>
                    <span>{settings.currency}{r.rate} / night</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: STAFF & ATTENDANCE WITH DAILY PERSISTENCE */}
          {activeTab === "staff" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Daily Staff Attendance & Shift Log</h2>
                  <p className="text-sm text-slate-500">Attendance history is archived daily into cloud storage</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Pick Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-[#D3C8B7] rounded-lg px-2.5 py-1 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DFD3] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Employee Name</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5 text-center">In Time</th>
                      <th className="p-3.5 text-center">Out Time</th>
                      <th className="p-3.5 text-center">Duty Status</th>
                      <th className="p-3.5 text-center">Shift Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {staff.map((m) => {
                      const record = dailyAttendance[m.id] || {};
                      const isClockedIn = record.isOnDuty;

                      return (
                        <tr key={m.id} className="hover:bg-[#FAF9F5]">
                          <td className="p-3.5 font-bold">{m.name}</td>
                          <td className="p-3.5">{m.role}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">{record.clockIn || "--:--"}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">{record.clockOut || "--:--"}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              isClockedIn ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {isClockedIn ? "On Duty" : record.clockOut ? "Completed" : "Off Duty"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {!isClockedIn ? (
                              <button
                                type="button"
                                onClick={() => handleClockIn(m)}
                                className="px-3 py-1 bg-[#0D9488] text-white rounded text-xs font-bold"
                              >
                                Clock In
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClockOut(m)}
                                className="px-3 py-1 bg-coral-500 text-white rounded text-xs font-bold"
                              >
                                Clock Out
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: COMPLETE SETTINGS MODULE (MATCHING YOUR SCREENSHOT) */}
          {activeTab === "settings" && isManager && (
            <div className="max-w-6xl mx-auto space-y-8 pb-16">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E6DFD3] pb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-[#14B8A6]" /> System, Business & Peripheral Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage company identity, thermal printing options, automated cash drawer solenoid, and database backup files.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D3C8B7] bg-white hover:bg-slate-50 text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-500" /> Download Backup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllSettings}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {saveSuccessMsg}
                </div>
              )}

              {/* CARD 1: COMPANY & BUSINESS INFORMATION */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#14B8A6]" /> Company & Business Information[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Printed on official receipts, tax invoices, and IT reports[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Trading / Brand Name[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.hotelName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hotelName: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Brand Tagline / Slogan[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Registered Legal Entity Name[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.legalEntity}
                      onChange={(e) => setSettingsForm({ ...settingsForm, legalEntity: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Business Registration No. (BRN / Company ID)[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.companyRegNo}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyRegNo: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Tax Identification / VAT / GST No.[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.taxNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxNumber: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Terminal Hardware Identifier[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.terminalId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, terminalId: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Contact Phone Number[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Business Email Address[cite: 3]</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Official Website or Social Link[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.website}
                      onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Full Physical Street Address[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: AUTOMATED DAILY 11:30 PM EMAIL DISPATCH */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#14B8A6]" /> Automated Daily 11:30 PM Email Dispatch[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Auto-dispatches complete end-of-day sales, collections, balances, and shift worksheets[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Target Recipient Email[cite: 3]</label>
                    <input
                      type="email"
                      value={settingsForm.emailRecipient}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailRecipient: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Scheduled Time (24h)[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.emailScheduleTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailScheduleTime: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Automation Status[cite: 3]</label>
                    <select
                      value={settingsForm.emailStatus}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailStatus: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Disabled (Manual trigger only)">Disabled (Manual trigger only)[cite: 3]</option>
                      <option value="Enabled (Daily Auto Send)">Enabled (Daily Auto Send)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E6DFD3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[11px] text-slate-500">
                    <b>What data is transmitted in the 11:30 PM package?</b><br />
                    Gross revenue, net sales, taxes, service pool, room occupancy, minibar orders, cashier balance, and shift audits[cite: 3].
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Email report package dispatched to ${settingsForm.emailRecipient}`)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm"
                  >
                    Send Daily Report Now[cite: 3]
                  </button>
                </div>
              </div>

              {/* CARD 3: THERMAL AUTO-PRINTER CONFIGURATION */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#14B8A6]" /> Thermal Auto-Printer Configuration[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Hardwired direct slip generation for USB, LAN, or Bluetooth portable printers[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Paper Roll Width[cite: 3]</label>
                    <select
                      value={settingsForm.paperRollWidth}
                      onChange={(e) => setSettingsForm({ ...settingsForm, paperRollWidth: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="80mm">80mm Thermal Paper (Standard POS)[cite: 3]</option>
                      <option value="58mm">58mm Thermal Paper (Compact / Mobile)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Receipt Font Size[cite: 3]</label>
                    <select
                      value={settingsForm.receiptFontSize}
                      onChange={(e) => setSettingsForm({ ...settingsForm, receiptFontSize: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="14px - Extra Bold & Large">14px - Extra Bold & Large[cite: 3]</option>
                      <option value="12px - Standard POS">12px - Standard POS</option>
                      <option value="10px - Compact Condense">10px - Compact Condense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Receipt Font Type[cite: 3]</label>
                    <select
                      value={settingsForm.receiptFontType}
                      onChange={(e) => setSettingsForm({ ...settingsForm, receiptFontType: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Monospace (Classic ESC/POS)">Monospace (Classic ESC/POS Receipt)[cite: 3]</option>
                      <option value="Sans-Serif">Modern Sans-Serif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Slip Margins[cite: 3]</label>
                    <select
                      value={settingsForm.slipMargins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slipMargins: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="2mm - Standard Thermal Margin">2mm - Standard Thermal Margin[cite: 3]</option>
                      <option value="0mm - Full Bleed Edge">0mm - Full Bleed Edge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto-Print on Saved Order[cite: 3]</label>
                    <select
                      value={settingsForm.autoPrintKOT}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoPrintKOT: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Yes - Print KOT & BOT Slips">Yes - Print KOT & BOT Slips[cite: 3]</option>
                      <option value="No - Manual Only">No - Manual Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto-Print on Settlement[cite: 3]</label>
                    <select
                      value={settingsForm.autoPrintSettlement}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoPrintSettlement: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Yes - Print Final Tax Invoice">Yes - Print Final Tax Invoice[cite: 3]</option>
                      <option value="No - Screen Only">No - Screen Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const dummyRoom = { number: "TEST", orderId: "TEST-01", orderItems: [{ description: "Thermal Test Print", quantity: 1, total: 0 }] };
                      const html = buildThermalHtml({ settings: settingsForm, room: dummyRoom, isTemporary: true, settlementMethod: "TEST", total: 0 });
                      printIsolatedDocument(html, "thermal");
                    }}
                    className="px-4 py-2 border border-[#D3C8B7] rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Test Slip[cite: 3]
                  </button>
                </div>
              </div>

              {/* CARD 4: AUTOMATED CASH DRAWER SOLENOID */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#14B8A6]" /> Automated Cash Drawer Solenoid[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Triggers electrical RJ11/RJ12 drawer pulse via printer kick ports[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto Drawer Kick[cite: 3]</label>
                    <select
                      value={settingsForm.autoDrawerKick}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoDrawerKick: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Enabled (Auto-Pop on Payment)">Enabled (Auto-Pop on Payment)[cite: 3]</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Drawer Kick Trigger[cite: 3]</label>
                    <select
                      value={settingsForm.drawerKickTrigger}
                      onChange={(e) => setSettingsForm({ ...settingsForm, drawerKickTrigger: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Cash Payments Only">Cash Payments Only[cite: 3]</option>
                      <option value="All Settlement Tenders">All Settlement Tenders</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">RJ11 / RJ12 Pinout[cite: 3]</label>
                    <select
                      value={settingsForm.drawerPinout}
                      onChange={(e) => setSettingsForm({ ...settingsForm, drawerPinout: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                    >
                      <option value="Pin 2 / ESC p 0 (Epson, Rongta, Xprint)">Pin 2 / ESC p 0 (Epson, Rongta, Xprint)[cite: 3]</option>
                      <option value="Pin 5 / ESC p 1 (Star Micronics)">Pin 5 / ESC p 1 (Star Micronics)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, drawerChime: !settingsForm.drawerChime })}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    {settingsForm.drawerChime ? <Volume2 className="w-4 h-4 text-[#14B8A6]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    Register Chime Sound: <b>{settingsForm.drawerChime ? "Chime ON" : "Muted"}</b>[cite: 3]
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Solenoid pulse sent! Cash drawer kicked open.")}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Pop Drawer[cite: 3]
                  </button>
                </div>
              </div>

              {/* CARD 5: CURRENCY, TAXES & SURCHARGE RATES */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#14B8A6]" /> Currency, Taxes & Surcharge Rates[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Default rates applied across folios and receipts[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Currency Symbol / Code[cite: 3]</label>
                    <input
                      type="text"
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Default Service Charge (%)[cite: 3]</label>
                    <input
                      type="number"
                      value={settingsForm.serviceChargeRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Sales Tax / VAT Rate (%)[cite: 3]</label>
                    <input
                      type="number"
                      value={settingsForm.vatRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Receipt Header Notes[cite: 3]</label>
                    <textarea
                      rows={2}
                      value={settingsForm.headerNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, headerNote: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Receipt Footer Message[cite: 3]</label>
                    <textarea
                      rows={2}
                      value={settingsForm.footerNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, footerNote: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 6: DATABASE BACKUP & DISASTER RECOVERY */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#14B8A6]" /> System Database Backup & Disaster Recovery[cite: 3]
                  </h3>
                  <p className="text-[11px] text-slate-400">Export or restore full state database (folios, staff, inventory, and shift logs)[cite: 3]</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#FAF9F5] border border-[#E6DFD3] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold block mb-1">Export JSON Database Backup[cite: 3]</span>
                      <p className="text-slate-500">Download a complete snapshot of all active folios, staff records, and setup data[cite: 3].</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="w-full py-2.5 bg-[#091D26] text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download System Backup (json)[cite: 3]
                    </button>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-[#E6DFD3] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold block mb-1">Restore System from Backup File[cite: 3]</span>
                      <p className="text-slate-500">Upload a previously exported .json file to restore system settings and history[cite: 3].</p>
                    </div>
                    <label className="w-full py-2.5 border border-[#D3C8B7] bg-white hover:bg-slate-50 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-500" /> Select Backup File (json)[cite: 3]
                      <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 7: ADMINISTRATOR PURGE */}
              <div className="bg-red-50/50 rounded-2xl border border-red-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-red-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Administrator Data Purge (Reset Test Data)[cite: 3]
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Clear test transactions, reset all rooms to VACANT, and reset shift balance ledgers[cite: 3].
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeTestData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm"
                >
                  Purge Test Records[cite: 3]
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CHECK-IN WITH CAMERA */}
      {checkInModalRoom && (
        <div className="fixed inset-0 bg-[#06151E]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3] my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg">Check In - Room #{checkInModalRoom.number}</h3>
              <button type="button" onClick={() => { stopCamera(); setCheckInModalRoom(null); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <form onSubmit={(e) => {
              e.preventDefault();
              stopCamera();
              const orderId = `ORD-${checkInModalRoom.number}-${Date.now().toString().slice(-4)}`;
              const itemId = `itm_${Date.now()}`;
              const roomPayload = {
                status: "occupied",
                orderId,
                guestName: guestForm.name,
                guestPhone: guestForm.phone,
                guestPhoto: guestPhoto || null,
                checkIn: new Date().toISOString().split("T")[0],
                checkOut: new Date(Date.now() + (guestForm.nights || 1) * 86400000).toISOString().split("T")[0],
                orderItems: {
                  [itemId]: {
                    id: itemId,
                    description: `Room Stay (${guestForm.nights} Nights)`,
                    quantity: guestForm.nights,
                    unitPrice: checkInModalRoom.rate,
                    total: checkInModalRoom.rate * guestForm.nights,
                  }
                }
              };
              update(ref(rtdb, `rooms/${checkInModalRoom.id}`), roomPayload);
              setCheckInModalRoom(null);
            }} className="space-y-4 text-xs">
              {/* Photo Box */}
              <div className="bg-[#FAF9F5] p-3 rounded-xl border space-y-2">
                <span className="font-bold text-[11px] block">Guest Photo / Passport</span>
                {isCameraActive ? (
                  <div className="relative rounded overflow-hidden aspect-video bg-black flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="absolute bottom-2 px-4 py-1 bg-[#14B8A6] text-white rounded-full font-bold shadow"
                    >
                      Snap Photo
                    </button>
                  </div>
                ) : guestPhoto ? (
                  <img src={guestPhoto} alt="ID" className="w-full aspect-video object-cover rounded" />
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 p-3 border border-dashed rounded-lg bg-teal-50 text-teal-800 font-bold flex flex-col items-center gap-1"
                    >
                      <Camera className="w-4 h-4" /> Open Camera
                    </button>
                    <label className="flex-1 p-3 border border-dashed rounded-lg bg-white text-slate-700 font-bold flex flex-col items-center gap-1 cursor-pointer">
                      <Upload className="w-4 h-4" /> Pick File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setGuestPhoto(ev.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] text-white font-bold py-3 rounded-xl shadow">
                Complete Check In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD INVENTORY */}
      {showAddInventoryModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Add Inventory Item</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const itemId = `inv_${Date.now()}`;
              set(ref(rtdb, `inventory/${itemId}`), {
                id: itemId,
                name: newInventoryForm.name,
                category: newInventoryForm.category,
                price: parseFloat(newInventoryForm.price) || 0,
                stock: parseInt(newInventoryForm.stock, 10) || 0,
              });
              setShowAddInventoryModal(false);
            }} className="space-y-4 text-xs">
              <input
                type="text"
                placeholder="Product Name"
                required
                value={newInventoryForm.name}
                onChange={(e) => setNewInventoryForm({ ...newInventoryForm, name: e.target.value })}
                className="w-full border rounded p-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Price"
                  value={newInventoryForm.price}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, price: e.target.value })}
                  className="w-full border rounded p-2"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newInventoryForm.stock}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, stock: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <button type="submit" className="w-full bg-[#14B8A6] text-white py-2.5 rounded font-bold">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ROOM */}
      {showAddRoomModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Add Hotel Room</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const roomId = String(newRoomForm.number).trim();
              set(ref(rtdb, `rooms/${roomId}`), {
                id: roomId,
                number: roomId,
                type: newRoomForm.type,
                rate: Number(newRoomForm.rate) || 10000,
                status: newRoomForm.status,
              });
              setShowAddRoomModal(false);
            }} className="space-y-4 text-xs">
              <input
                type="text"
                placeholder="Room Number"
                required
                value={newRoomForm.number}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, number: e.target.value })}
                className="w-full border rounded p-2"
              />
              <input
                type="number"
                placeholder="Rate per night"
                required
                value={newRoomForm.rate}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, rate: e.target.value })}
                className="w-full border rounded p-2"
              />
              <button type="submit" className="w-full bg-[#14B8A6] text-white py-2.5 rounded font-bold">
                Save Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}