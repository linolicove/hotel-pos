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
  RefreshCw,
  Sparkles,
  Tag
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

// Comprehensive settings schema matching your settings dashboard
const DEFAULT_SETTINGS = {
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

  emailRecipient: "linolicove@gmail.com",
  emailScheduleTime: "23:30",
  emailStatus: "Disabled (Manual trigger only)",

  paperRollWidth: "80mm",
  receiptFontSize: "14px - Extra Bold & Large",
  receiptFontType: "Monospace (Classic ESC/POS)",
  slipMargins: "2mm - Standard Thermal Margin",
  autoPrintKOT: "Yes - Print KOT & BOT Slips",
  autoPrintSettlement: "Yes - Print Final Tax Invoice",

  autoDrawerKick: "Enabled (Auto-Pop on Payment)",
  drawerKickTrigger: "Cash Payments Only",
  drawerPinout: "Pin 2 / ESC p 0 (Epson, Rongta, Xprint)",
  drawerChime: true,

  currency: "Rs.",
  serviceChargeRate: 10,
  vatRate: 0,
  headerNote: "Linoli Cove Beach Resort & Dining\nBeach Road, Midigama\nTel: +94 74 036 4741",
  footerNote: "Thank you for your visit!\nPlease come again.",
};

// Seed inventory with Unit Cost & Selling Price
const INITIAL_INVENTORY_SEEDS = [
  { id: "inv1", name: "Artisanal Sparkling Water", category: "minibar", cost: 450, price: 850, stock: 48 },
  { id: "inv2", name: "Organic Coconut Chips", category: "minibar", cost: 320, price: 650, stock: 32 },
  { id: "inv3", name: "Sea Salt Scrub Pack", category: "amenity", cost: 600, price: 1200, stock: 15 },
  { id: "inv4", name: "Egyptian Cotton Bath Towel", category: "linen", cost: 1800, price: 0, stock: 75 },
  { id: "inv5", name: "Cold Brew Coconut Latte", category: "minibar", cost: 500, price: 950, stock: 18 },
  { id: "inv6", name: "Local Lion Craft Beer", category: "beverage", cost: 650, price: 1100, stock: 24 }
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

function buildThermalHtml({ settings, room, isTemporary, settlementMethod, total, cashTendered = 0, changeDue = 0 }) {
  const items = room?.orderItems || [];
  const isCash = settlementMethod === "Cash" && !isTemporary;

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

      <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
          <span>${isTemporary ? "TOTAL DUE:" : "BILL TOTAL:"}</span>
          <span>${settings.currency}${Number(total).toFixed(2)}</span>
        </div>
        ${isCash ? `
          <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px;">
            <span>CASH TENDERED:</span>
            <span>${settings.currency}${Number(cashTendered).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px; font-size: 12px; border-top: 1px dotted #000; padding-top: 3px;">
            <span>CHANGE DUE / RETURNED:</span>
            <span>${settings.currency}${Number(changeDue).toFixed(2)}</span>
          </div>
        ` : ""}
      </div>

      <div style="text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px dashed #000; font-size: 10px;">
        <div>${settings.footerNote}</div>
      </div>
    </div>
  `;
}

function buildA4Html({ settings, room, isTemporary, settlementMethod, total, cashTendered = 0, changeDue = 0 }) {
  const items = room?.orderItems || [];
  const isCash = settlementMethod === "Cash" && !isTemporary;

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

      <div style="border-top: 2px solid #091D26; border-bottom: 2px solid #091D26; padding: 12px 4px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; font-weight: bold;">Total Bill Amount:</span>
          <span style="font-size: 20px; font-weight: 900;">${settings.currency}${Number(total).toFixed(2)}</span>
        </div>
        ${isCash ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 13px; color: #444;">
            <span>Amount Given (Cash Tendered):</span>
            <span style="font-weight: bold;">${settings.currency}${Number(cashTendered).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 14px; font-weight: bold; border-top: 1px dotted #ccc; padding-top: 6px; color: #0D9488;">
            <span>Balance Returned (Change Due):</span>
            <span style="font-size: 18px; font-weight: 900;">${settings.currency}${Number(changeDue).toFixed(2)}</span>
          </div>
        ` : `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 12px; color: #666;">
            <span>Payment Method:</span>
            <span style="font-weight: bold;">${settlementMethod}</span>
          </div>
        `}
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 11px; border-top: 1px solid #ddd; padding-top: 12px;">
        <p style="margin: 0; font-weight: 500;">${settings.footerNote}</p>
      </div>
    </div>
  `;
}

function buildDailyAttendanceHtml({ settings, staffList, dateStr }) {
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #555;">Daily Staff Shift & Attendance Sheet</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px;"><b>Date:</b> ${dateStr}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; background: #F3EFE6;">
            <th style="padding: 10px 6px; text-align: left;">Employee Name</th>
            <th style="padding: 10px 6px; text-align: left;">Role</th>
            <th style="padding: 10px 6px; text-align: center;">In</th>
            <th style="padding: 10px 6px; text-align: center;">Out</th>
            <th style="padding: 10px 6px; text-align: center;">Duty Status</th>
          </tr>
        </thead>
        <tbody>
          ${staffList.map((m) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 6px; font-weight: bold;">${m.name}</td>
              <td style="padding: 10px 6px;">${m.role}</td>
              <td style="padding: 10px 6px; text-align: center;">${m.clockIn || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center;">${m.clockOut || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center;">${m.isOnDuty ? "ON DUTY" : m.clockOut ? "COMPLETED" : "OFF DUTY"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// --- 3. MAIN COMPONENT ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [activeTab, setActiveTab] = useState("frontdesk");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Front Desk Room Status Filter State
  const [frontDeskFilter, setFrontDeskFilter] = useState("all");

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

  // Front Desk Modals & Camera/File State
  const [checkInModalRoom, setCheckInModalRoom] = useState(null);
  const [settleOrderRoom, setSettleOrderRoom] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("Credit Card");
  const [cashTendered, setCashTendered] = useState("");
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", nights: 1 });
  const [guestPhoto, setGuestPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Custom Item Inputs for Folio
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Room / Stock Modals & Edit States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ number: "", type: "Ocean Breeze King", rate: 18000, status: "available" });
  
  // Inventory Form with Cost Price
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [newInventoryForm, setNewInventoryForm] = useState({ 
    name: "", 
    category: "minibar", 
    cost: "450", 
    price: "850", 
    stock: "20" 
  });
  
  // Dedicated Edit Inventory Modal State
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [editInventoryForm, setEditInventoryForm] = useState({ 
    name: "", 
    category: "minibar", 
    cost: "0", 
    price: "0", 
    stock: "0" 
  });

  // Staff & Compensation Management State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffViewSubTab, setStaffViewSubTab] = useState("roster");
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "Front Desk",
    pin: "1234",
    type: "Full-Time",
    baseSalary: "75000",
    allowances: "15000",
    serviceCharge: "35000",
    bonus: "8000",
    phone: "",
  });

  // Role Permissions
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

  // --- CAMERA & FILE UPLOAD ENGINE ---
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Unable to open device camera. Please check camera permissions in browser.");
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
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.7);
      setGuestPhoto(base64Image);
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setGuestPhoto(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCloseCheckInModal = () => {
    stopCamera();
    setGuestPhoto(null);
    setCheckInModalRoom(null);
  };

  // PIN Operations
  const handlePinDigit = (digit) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError("");
      if (nextPin.length >= 4) verifyPin(nextPin);
    }
  };

  const verifyPin = (candidatePin) => {
    const matched = staff.find((s) => String(s.pin) === String(candidatePin));
    if (matched) {
      setCurrentUser(matched);
      setPinInput("");
      setPinError("");
      setActiveTab("frontdesk");
    } else {
      if (candidatePin.length >= 4) setPinError("Invalid Access PIN");
    }
  };

  const handleLogout = () => {
    stopCamera();
    setCurrentUser(null);
    setPinInput("");
    setPinError("");
  };

  // --- REALTIME DATABASE LISTENERS ---
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
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedRooms = Object.keys(data).map((key) => {
          const roomObj = data[key];
          const rawItems = roomObj.orderItems || {};
          const orderItemsArray = Array.isArray(rawItems)
            ? rawItems
            : Object.keys(rawItems).map((k) => ({ ...rawItems[k], id: k }));
          return { ...roomObj, id: key, orderItems: orderItemsArray };
        });
        setRooms(loadedRooms.sort((a, b) => String(a.number).localeCompare(String(b.number))));
        if (!selectedRoomId && loadedRooms.length > 0) {
          const firstOccupied = loadedRooms.find((r) => r.status === "occupied");
          setSelectedRoomId(firstOccupied ? firstOccupied.id : loadedRooms[0].id);
        }
      }
    });

    // 3. Inventory Listener (Tracks Cost & Selling Price)
    const invRef = ref(rtdb, "inventory");
    const unsubInv = onValue(invRef, (snapshot) => {
      if (!snapshot.exists()) {
        const seedMap = {};
        INITIAL_INVENTORY_SEEDS.forEach((i) => { seedMap[i.id] = i; });
        update(invRef, seedMap);
      } else {
        const data = snapshot.val();
        const loaded = Object.keys(data).map((key) => ({
          ...data[key],
          id: key,
          name: data[key].name || "Unnamed Item",
          category: data[key].category || "minibar",
          cost: Number(data[key].cost) || 0,
          price: Number(data[key].price) || 0,
          stock: Number(data[key].stock) || 0,
        }));
        setInventory(loaded.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });

    // 4. Staff & Compensation Listener
    const staffRef = ref(rtdb, "staff");
    const unsubStaff = onValue(staffRef, (snapshot) => {
      if (!snapshot.exists()) {
        const seedStaffMap = {};
        INITIAL_STAFF_SEEDS.forEach((s) => { seedStaffMap[s.id] = s; });
        set(staffRef, seedStaffMap);
      } else {
        const data = snapshot.val();
        const staffList = Object.keys(data).map((k) => ({
          ...data[k],
          id: k,
          baseSalary: Number(data[k].baseSalary) || 65000,
          allowances: Number(data[k].allowances) || 0,
          serviceCharge: Number(data[k].serviceCharge) || 0,
          bonus: Number(data[k].bonus) || 0,
          paid: Boolean(data[k].paid)
        }));
        setStaff(staffList);
      }
      setLoading(false);
    });

    // 5. Daily Attendance History Listener
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
      stopCamera();
    };
  }, [selectedRoomId, selectedDate]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const calculateTotal = (room) => room?.orderItems?.reduce((acc, item) => acc + (Number(item.total) || 0), 0) || 0;
  const printTargetRoom = settleOrderRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);
  const calculateStaffGross = (s) => (Number(s.baseSalary) || 0) + (Number(s.allowances) || 0) + (Number(s.serviceCharge) || 0) + (Number(s.bonus) || 0);

  // --- ACTIONS: INVENTORY CREATE, EDIT, DELETE & STOCK ---
  const handleCreateInventoryItem = (e) => {
    e.preventDefault();
    if (!newInventoryForm.name.trim()) return;

    const itemId = `inv_${Date.now()}`;
    const cleanCost = parseFloat(newInventoryForm.cost) || 0;
    const cleanPrice = parseFloat(newInventoryForm.price) || 0;
    const cleanStock = parseInt(newInventoryForm.stock, 10) || 0;

    const newItem = {
      id: itemId,
      name: newInventoryForm.name.trim(),
      category: newInventoryForm.category || "minibar",
      cost: cleanCost,
      price: cleanPrice,
      stock: cleanStock,
    };

    setInventory((prev) => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddInventoryModal(false);
    setNewInventoryForm({ name: "", category: "minibar", cost: "450", price: "850", stock: "20" });
    set(ref(rtdb, `inventory/${itemId}`), newItem);
  };

  const handleStartEditInventory = (item) => {
    setEditingInventoryItem(item);
    setEditInventoryForm({
      name: item.name || "",
      category: item.category || "minibar",
      cost: String(item.cost ?? 0),
      price: String(item.price ?? 0),
      stock: String(item.stock ?? 0),
    });
  };

  const handleSaveInventoryEdit = (e) => {
    e.preventDefault();
    if (!editingInventoryItem || !editInventoryForm.name.trim()) return;

    const cleanCost = parseFloat(editInventoryForm.cost) || 0;
    const cleanPrice = parseFloat(editInventoryForm.price) || 0;
    const cleanStock = parseInt(editInventoryForm.stock, 10) || 0;

    const updated = {
      name: editInventoryForm.name.trim(),
      category: editInventoryForm.category || "minibar",
      cost: cleanCost,
      price: cleanPrice,
      stock: cleanStock,
    };

    setInventory((prev) =>
      prev.map((i) => (i.id === editingInventoryItem.id ? { ...i, ...updated } : i))
    );
    update(ref(rtdb, `inventory/${editingInventoryItem.id}`), updated);
    setEditingInventoryItem(null);
  };

  const handleDeleteInventoryItem = (item) => {
    if (window.confirm(`Permanently remove "${item.name}" from inventory?`)) {
      setInventory((prev) => prev.filter((i) => i.id !== item.id));
      remove(ref(rtdb, `inventory/${item.id}`));
    }
  };

  const handleUpdateStockLevel = (itemId, delta) => {
    if (!itemId) return;
    const target = inventory.find((i) => i.id === itemId);
    const currentStock = Number(target?.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    setInventory((prev) => prev.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item)));
    update(ref(rtdb, `inventory/${itemId}`), { stock: newStock });
  };

  const handleQuickAddMinibar = (item) => {
    if (!currentRoom) return;
    const now = new Date();
    const itemId = `itm_${Date.now()}`;
    const newItem = {
      id: itemId,
      description: `Minibar: ${item.name}`,
      quantity: 1,
      unitPrice: item.price,
      total: item.price,
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
    set(ref(rtdb, `rooms/${currentRoom.id}/orderItems/${itemId}`), newItem);
    if (item.stock > 0) handleUpdateStockLevel(item.id, -1);
  };

  // --- ACTIONS: SETTINGS & BACKUP ---
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
      a.download = `${settings.hotelName.replace(/\s+/g, '_')}_Backup_${getTodayKey()}.json`;
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

  // Attendance Clock In / Out Actions
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

  // Print Handlers
  const handlePrintTemporaryBill = (room) => {
    setSelectedRoomId(room.id);
    const total = calculateTotal(room);
    const html = printFormat === "thermal"
      ? buildThermalHtml({ settings, room, isTemporary: true, settlementMethod: "Pending", total })
      : buildA4Html({ settings, room, isTemporary: true, settlementMethod: "Pending", total });
    printIsolatedDocument(html, printFormat);
  };

  const handleConfirmOrderSettlement = () => {
    if (!settleOrderRoom) return;
    const total = calculateTotal(settleOrderRoom);
    const tenderAmount = parseFloat(cashTendered) || total;
    const balanceReturned = Math.max(0, tenderAmount - total);

    const html = printFormat === "thermal"
      ? buildThermalHtml({
          settings,
          room: settleOrderRoom,
          isTemporary: false,
          settlementMethod,
          total,
          cashTendered: tenderAmount,
          changeDue: balanceReturned
        })
      : buildA4Html({
          settings,
          room: settleOrderRoom,
          isTemporary: false,
          settlementMethod,
          total,
          cashTendered: tenderAmount,
          changeDue: balanceReturned
        });

    printIsolatedDocument(html, printFormat);

    update(ref(rtdb, `rooms/${settleOrderRoom.id}`), {
      status: "cleaning",
      orderId: null,
      openedAt: null,
      guestName: "",
      guestPhone: "",
      guestPhoto: null,
      checkIn: "",
      checkOut: "",
      orderItems: null,
    });
    setSettleOrderRoom(null);
    setCashTendered("");
  };

  const handlePrintDailyAttendance = () => {
    const combinedList = staff.map(m => {
      const record = dailyAttendance[m.id] || {};
      return {
        ...m,
        clockIn: record.clockIn || "",
        clockOut: record.clockOut || "",
        isOnDuty: Boolean(record.isOnDuty)
      };
    });
    const html = buildDailyAttendanceHtml({ settings, staffList: combinedList, dateStr: selectedDate });
    printIsolatedDocument(html, "a4");
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) return;
    const staffId = `stf_${Date.now()}`;
    const newStaff = {
      id: staffId,
      name: newStaffForm.name.trim(),
      role: newStaffForm.role || "Front Desk",
      pin: newStaffForm.pin || "0000",
      type: newStaffForm.type || "Full-Time",
      baseSalary: parseFloat(newStaffForm.baseSalary) || 0,
      allowances: parseFloat(newStaffForm.allowances) || 0,
      serviceCharge: parseFloat(newStaffForm.serviceCharge) || 0,
      bonus: parseFloat(newStaffForm.bonus) || 0,
      paid: false,
      phone: newStaffForm.phone || "",
    };
    setStaff((prev) => [...prev, newStaff]);
    setShowAddStaffModal(false);
    set(ref(rtdb, `staff/${staffId}`), newStaff);
  };

  const handleToggleStaffPayout = (staffId, currentStatus) => {
    const nextStatus = !currentStatus;
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, paid: nextStatus } : s)));
    update(ref(rtdb, `staff/${staffId}`), { paid: nextStatus });
  };

  const handleDeleteStaff = (member) => {
    if (!window.confirm(`Permanently remove ${member.name}?`)) return;
    setStaff((prev) => prev.filter((s) => s.id !== member.id));
    remove(ref(rtdb, `staff/${member.id}`));
  };

  const updateRoomStatus = (roomId, status) => {
    update(ref(rtdb, `rooms/${roomId}`), { status });
  };

  const handleOpenOrderAndCheckIn = (e) => {
    e.preventDefault();
    if (!checkInModalRoom || !guestForm.name) return;
    stopCamera();

    const nights = guestForm.nights || 1;
    const now = new Date();
    const orderId = `ORD-${checkInModalRoom.number}-${Date.now().toString().slice(-4)}`;
    const itemId = `itm_${Date.now()}`;
    const initialOrderItem = {
      id: itemId,
      description: `Room Stay (${nights} Night${nights > 1 ? "s" : ""})`,
      quantity: nights,
      unitPrice: checkInModalRoom.rate,
      total: checkInModalRoom.rate * nights,
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
    const roomPayload = {
      status: "occupied",
      orderId,
      openedAt: now.toLocaleString(),
      guestName: guestForm.name,
      guestPhone: guestForm.phone,
      guestPhoto: guestPhoto || null,
      checkIn: now.toISOString().split("T")[0],
      checkOut: new Date(Date.now() + nights * 86400000).toISOString().split("T")[0],
      orderItems: { [itemId]: initialOrderItem },
    };
    update(ref(rtdb, `rooms/${checkInModalRoom.id}`), roomPayload);
    setGuestPhoto(null);
    setCheckInModalRoom(null);
    setGuestForm({ name: "", phone: "", nights: 1 });
  };

  const handleAddItemToOrder = (e) => {
    e.preventDefault();
    if (!newItemDesc || !newItemPrice || !currentRoom) return;
    const unitPrice = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQty, 10) || 1;
    const now = new Date();
    const itemId = `itm_${Date.now()}`;
    const newItem = {
      id: itemId,
      description: newItemDesc,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
    set(ref(rtdb, `rooms/${currentRoom.id}/orderItems/${itemId}`), newItem);
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const handleRemoveOrderItem = (itemId) => {
    if (!currentRoom) return;
    remove(ref(rtdb, `rooms/${currentRoom.id}/orderItems/${itemId}`));
  };

  const handleInitiateSettleOrder = (room) => {
    setSelectedRoomId(room.id);
    setActiveTab("frontdesk");
    setSettleOrderRoom(room);
    setCashTendered("");
  };

  const handleDeleteActiveBill = (room) => {
    if (window.confirm(`Void active bill for Room #${room.number}?`)) {
      update(ref(rtdb, `rooms/${room.id}`), {
        status: "available",
        orderId: null,
        openedAt: null,
        guestName: "",
        guestPhone: "",
        guestPhoto: null,
        checkIn: "",
        checkOut: "",
        orderItems: null,
      });
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomForm.number) return;
    const roomId = String(newRoomForm.number).trim();
    const newRoomData = {
      id: roomId,
      number: roomId,
      type: newRoomForm.type,
      rate: Number(newRoomForm.rate) || 18000,
      status: newRoomForm.status,
    };
    set(ref(rtdb, `rooms/${roomId}`), newRoomData);
    setShowAddRoomModal(false);
    setNewRoomForm({ number: "", type: "Ocean Breeze King", rate: 18000, status: "available" });
  };

  const handleDeleteRoom = (roomId, roomNumber) => {
    if (window.confirm(`Delete Room #${roomNumber}?`)) {
      remove(ref(rtdb, `rooms/${roomId}`));
    }
  };

  // Filtered queries
  const filteredInventory = inventory.filter((item) => {
    const matchesCategory = inventoryCategoryFilter === "all" || item.category === inventoryCategoryFilter;
    const matchesSearch = (item.name || "").toLowerCase().includes(inventorySearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredStaff = staff.filter((s) => {
    const q = staffSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const totalPayrollGross = staff.reduce((acc, s) => acc + calculateStaffGross(s), 0);
  const totalServiceCharges = staff.reduce((acc, s) => acc + (Number(s.serviceCharge) || 0), 0);
  const onDutyCount = staff.filter((s) => {
    const record = dailyAttendance[s.id];
    return record && record.isOnDuty;
  }).length;

  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - printTargetTotal);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // PIN TERMINAL LOCK SCREEN
  if (!currentUser) {
    const keypadButtons = [
      { key: "1", sub: "" },
      { key: "2", sub: "ABC" },
      { key: "3", sub: "DEF" },
      { key: "4", sub: "GHI" },
      { key: "5", sub: "JKL" },
      { key: "6", sub: "MNO" },
      { key: "7", sub: "PQRS" },
      { key: "8", sub: "TUV" },
      { key: "9", sub: "WXYZ" },
      { key: "Clear", sub: "" },
      { key: "0", sub: "+" },
      { key: "Del", sub: "" },
    ];

    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#040D14] text-white select-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0D9488]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#14B8A6]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0284C7]/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono tracking-wider text-slate-300">
                {settings.terminalId || "TERMINAL-01"}
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-0.5 rounded-full border border-[#2DD4BF]/20">
              System Ready
            </span>
          </div>

          <div className="relative mb-3 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F766E] to-[#2DD4BF] p-[2px] shadow-lg shadow-[#14B8A6]/25 transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#071923] rounded-[14px] flex items-center justify-center">
                <Waves className="w-8 h-8 text-[#2DD4BF]" />
              </div>
            </div>
          </div>

          <h1 className="text-xl font-black tracking-tight text-white text-center">
            {settings.hotelName || "Thalassa Resort"}
          </h1>
          <p className="text-[10px] font-bold text-[#2DD4BF] uppercase tracking-widest mt-0.5">
            {settings.tagline || "Hospitality OS & POS"}
          </p>

          <div className="my-6 flex flex-col items-center w-full">
            <div className="flex items-center gap-3.5 h-10">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`transition-all duration-200 rounded-full flex items-center justify-center ${
                      isFilled
                        ? "w-4 h-4 bg-[#14B8A6] shadow-[0_0_16px_#14B8A6] scale-125 border-none"
                        : "w-3.5 h-3.5 border-2 border-white/20 bg-transparent"
                    }`}
                  />
                );
              })}
            </div>
            <div className="h-5 flex items-center mt-2">
              {pinError ? (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pinError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Enter 4-Digit Staff Security PIN
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            {keypadButtons.map(({ key, sub }) => {
              const isAction = key === "Clear" || key === "Del";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === "Clear") {
                      setPinInput("");
                      setPinError("");
                    } else if (key === "Del") {
                      setPinInput((prev) => prev.slice(0, -1));
                      setPinError("");
                    } else {
                      handlePinDigit(key);
                    }
                  }}
                  className={`h-15 rounded-2xl active:scale-95 transition-all flex flex-col items-center justify-center border shadow-sm ${
                    isAction
                      ? "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-slate-400 hover:text-white"
                      : "bg-white/[0.06] hover:bg-white/[0.14] active:bg-[#14B8A6]/20 border-white/10 hover:border-white/20 text-slate-100"
                  }`}
                >
                  {key === "Del" ? (
                    <Delete className="w-5 h-5 text-slate-300" />
                  ) : (
                    <>
                      <span className={`font-bold ${isAction ? "text-xs uppercase tracking-wider text-rose-300" : "text-xl leading-none"}`}>
                        {key}
                      </span>
                      {sub && (
                        <span className="text-[8px] font-semibold tracking-widest text-slate-400 mt-1">
                          {sub}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {staff && staff.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/[0.08] w-full">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Access Roster:
                </span>
                <span className="text-[10px] text-slate-500">Tap to test</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {staff.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setPinInput(String(s.pin));
                      verifyPin(s.pin);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#14B8A6]/40 transition-all text-left group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#0F766E]/50 border border-[#2DD4BF]/30 flex items-center justify-center text-[10px] font-bold text-[#2DD4BF] shrink-0 group-hover:scale-105 transition-transform">
                      {s.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] font-bold text-slate-200 truncate group-hover:text-white leading-tight">
                        {s.name.split(" ")[0]}
                      </div>
                      <div className="text-[8px] text-[#2DD4BF] font-mono leading-none">
                        PIN: {s.pin}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F5] text-[#091D26]">
      {/* DESKTOP SIDEBAR */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-[#091D26] border-r border-[#0F2D3C] text-white shrink-0">
        <div className="p-6 border-b border-[#0F2D3C] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-white font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-base font-bold leading-tight truncate">{settings.hotelName}</h1>
            <p className="text-[11px] text-[#2DD4BF] font-medium truncate">{settings.tagline}</p>
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
            onClick={handleLogout}
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
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleLogout} className="p-1 rounded bg-white/10 text-slate-300">
              <Lock className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded text-slate-300">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <main className="no-print flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* =========================================================
              TAB 1: FRONT DESK & LIVE STATUS WITH DIRECT SETTLEMENT
              ========================================================= */}
          {activeTab === "frontdesk" && (
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              {/* Executive Overview Banner */}
              <div className="bg-gradient-to-r from-[#091D26] via-[#0F2D3C] to-[#0A3042] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-[#2DD4BF] uppercase tracking-widest flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5" /> Front Desk Executive Operations
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                      Room Management & Direct Settlement
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Live guest folios, instant check-in with tablet camera identification, turnover status, and direct one-click settlement.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="text-xl font-black text-white">{rooms.length}</span>
                    </div>
                    <div className="bg-[#14B8A6]/10 backdrop-blur-md border border-[#14B8A6]/30 rounded-2xl p-3 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-[#2DD4BF] block">Available</span>
                      <span className="text-xl font-black text-[#2DD4BF]">
                        {rooms.filter((r) => r.status === "available").length}
                      </span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-300 block">Occupied</span>
                      <span className="text-xl font-black text-white">
                        {rooms.filter((r) => r.status === "occupied").length}
                      </span>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-3 text-center min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-amber-300 block">Turnover</span>
                      <span className="text-xl font-black text-amber-300">
                        {rooms.filter((r) => r.status === "cleaning").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E6DFD3] rounded-2xl shadow-sm overflow-x-auto max-w-full">
                  {[
                    { id: "all", label: "All Rooms", count: rooms.length },
                    { id: "available", label: "Available", count: rooms.filter((r) => r.status === "available").length },
                    { id: "occupied", label: "Occupied", count: rooms.filter((r) => r.status === "occupied").length },
                    { id: "cleaning", label: "Cleaning", count: rooms.filter((r) => r.status === "cleaning").length },
                    { id: "maintenance", label: "Maintenance", count: rooms.filter((r) => r.status === "maintenance").length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFrontDeskFilter(filter.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        frontDeskFilter === filter.id
                          ? "bg-[#091D26] text-white shadow-sm"
                          : "text-slate-600 hover:text-black hover:bg-[#FAF9F5]"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        frontDeskFilter === filter.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {isManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddRoomModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Room Unit
                  </button>
                )}
              </div>

              {/* Enhanced Room Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rooms
                  .filter((room) => {
                    if (frontDeskFilter === "all") return true;
                    return room.status === frontDeskFilter;
                  })
                  .map((room) => {
                    const billTotal = calculateTotal(room);
                    const isOccupied = room.status === "occupied";
                    const isAvailable = room.status === "available";
                    const isCleaning = room.status === "cleaning";
                    const isMaintenance = room.status === "maintenance";

                    return (
                      <div
                        key={room.id}
                        className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                          isOccupied
                            ? "border-[#0F2D3C]/40 ring-1 ring-[#0F2D3C]/10"
                            : isAvailable
                            ? "border-emerald-200 hover:border-emerald-400"
                            : isCleaning
                            ? "border-amber-200 hover:border-amber-400"
                            : "border-rose-200 hover:border-rose-400"
                        }`}
                      >
                        <div className="p-5 pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl font-black text-[#091D26] tracking-tight">
                                #{room.number}
                              </span>
                              {isOccupied && (
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Active Guest Stay" />
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isAvailable
                                  ? "bg-[#CCFBF1] text-[#0F766E] border border-[#2DD4BF]/40"
                                  : isOccupied
                                  ? "bg-[#091D26] text-white shadow-sm"
                                  : isCleaning
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {room.status}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider truncate">
                            {room.type}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {settings.currency}{Number(room.rate).toLocaleString()} <span className="text-[10px] text-slate-400">/ night</span>
                          </p>

                          {isOccupied && (
                            <div className="mt-4 p-3.5 bg-gradient-to-br from-[#FAF9F5] to-[#F4EFE6] rounded-2xl border border-[#E6DFD3] space-y-2.5 shadow-inner">
                              <div className="flex items-center gap-3">
                                {room.guestPhoto ? (
                                  <img
                                    src={room.guestPhoto}
                                    alt="Guest ID"
                                    className="w-11 h-11 rounded-2xl object-cover border-2 border-[#14B8A6] shadow-sm shrink-0"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#D3C8B7] flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                                    <ImageIcon className="w-5 h-5 text-slate-400" />
                                  </div>
                                )}
                                <div className="truncate min-w-0">
                                  <span className="font-extrabold text-[#091D26] text-xs block truncate leading-tight">
                                    {room.guestName || "Walk-In Guest"}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                    {room.guestPhone || "No contact logged"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                    Out: {room.checkOut || "Today"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-300/50">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Folio Bill</span>
                                  <span className="text-[10px] font-mono font-semibold text-[#0F766E]">{room.orderId}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-black text-[#0D9488]">
                                    {settings.currency}{billTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {isCleaning && (
                            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Housekeeping in progress. Needs linen change & minibar restock.</span>
                            </div>
                          )}

                          {isMaintenance && (
                            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-800 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Out of order for scheduled engineering inspection.</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Action Bar with Direct Settle Button */}
                        <div className="p-4 pt-0">
                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() => {
                                setCheckInModalRoom(room);
                                setGuestPhoto(null);
                              }}
                              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                              <Camera className="w-4 h-4" /> Check In & Photo ID
                            </button>
                          )}

                          {isOccupied && (
                            <div className="space-y-2 pt-2">
                              {(isManager || isFrontDesk) && (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateSettleOrder(room)}
                                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] hover:from-[#0F766E] hover:to-[#091D26] active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-between px-3.5 transition-all"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-[#2DD4BF]" />
                                    <span>Direct Settle Bill</span>
                                  </span>
                                  <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                                    {settings.currency}{billTotal.toFixed(0)}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoomId(room.id);
                                    setActiveTab("active-orders");
                                  }}
                                  className="flex-1 bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-slate-500" /> Folio Items
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintTemporaryBill(room)}
                                  className="flex-1 bg-white border border-[#D3C8B7] hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                                  title="Print Pro-Forma Interim Statement"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" /> Temp Slip
                                </button>
                              </div>
                            </div>
                          )}

                          {isCleaning && (
                            <button
                              type="button"
                              onClick={() => updateRoomStatus(room.id, "available")}
                              className="w-full bg-[#CCFBF1] hover:bg-[#99F6E4] text-[#0F766E] border border-[#2DD4BF] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Mark Clean & Ready
                            </button>
                          )}

                          {isMaintenance && isManager && (
                            <button
                              type="button"
                              onClick={() => updateRoomStatus(room.id, "available")}
                              className="w-full bg-[#E6DFD3] hover:bg-[#D3C8B7] text-[#091D26] py-2.5 rounded-xl text-xs font-bold transition-colors"
                            >
                              Clear Maintenance Lock
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE BILLS */}
          {activeTab === "active-orders" && canAccessTab("active-orders") && (
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
                          onClick={() => handleInitiateSettleOrder(room)}
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

          {/* =========================================================
              TAB 3: INVENTORY (WITH COST PRICE, EDIT, DELETE & STOCK)
              ========================================================= */}
          {activeTab === "inventory" && canAccessTab("inventory") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Inventory & Minibar Stock</h2>
                  <p className="text-sm text-slate-500">Manage item wholesale cost, retail billable price, and stock levels.</p>
                </div>
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <PackagePlus className="w-4 h-4" /> Add Inventory Item
                  </button>
                )}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                  {["all", "minibar", "beverage", "snack", "amenity", "linen"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                        inventoryCategoryFilter === cat
                          ? "bg-[#091D26] text-white shadow-sm"
                          : "bg-white border border-[#E6DFD3] text-slate-600 hover:bg-[#FAF9F5]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stock item..."
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E6DFD3] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>

              {/* Table with Cost, Selling Price, Edit & Delete */}
              <div className="bg-white rounded-3xl border border-[#E6DFD3] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] uppercase font-semibold text-slate-500 border-b border-[#E6DFD3]">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Cost Price</th>
                      <th className="p-3.5 text-right">Selling Price</th>
                      <th className="p-3.5 text-right">Gross Margin</th>
                      <th className="p-3.5 text-center">Stock Level</th>
                      <th className="p-3.5 text-center">Quick Adjust</th>
                      {isManager && <th className="p-3.5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {filteredInventory.map((item) => {
                      const cost = Number(item.cost) || 0;
                      const price = Number(item.price) || 0;
                      const margin = price - cost;

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="p-3.5 font-bold text-[#091D26]">
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                              {item.stock < 10 && (
                                <span className="flex items-center gap-0.5 text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                                  Low Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-medium text-slate-500">
                            {settings.currency}{cost.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-[#091D26]">
                            {price > 0 ? `${settings.currency}${price.toFixed(2)}` : "Complimentary"}
                          </td>
                          <td className="p-3.5 text-right font-bold">
                            <span className={margin >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {settings.currency}{margin.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-sm">
                            <span className={item.stock < 10 ? "text-rose-600" : "text-slate-800"}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, -1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-slate-100 text-xs font-bold"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, 1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-slate-100 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {isManager && (
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInventory(item)}
                                  className="p-1.5 text-slate-400 hover:text-[#0D9488] rounded hover:bg-slate-100"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInventoryItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
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

          {/* TAB 5: STAFF & ATTENDANCE WITH DAILY PERSISTENCE & SALARY */}
          {activeTab === "staff" && canAccessTab("staff") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Daily Staff Attendance & Payroll</h2>
                  <p className="text-sm text-slate-500">Attendance history is archived daily into cloud storage</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500">Pick Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-[#D3C8B7] rounded-lg px-2.5 py-1 text-xs bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handlePrintDailyAttendance}
                    className="inline-flex items-center gap-2 bg-[#0F2D3C] text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2DD4BF]" /> Print Attendance
                  </button>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(true)}
                      className="inline-flex items-center gap-2 bg-[#14B8A6] text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Staff
                    </button>
                  )}
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex bg-[#F3EFE6] p-1 rounded-lg border border-[#E6DFD3] w-fit">
                <button
                  type="button"
                  onClick={() => setStaffViewSubTab("attendance")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    staffViewSubTab === "attendance" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" /> Daily In/Out Attendance
                </button>
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setStaffViewSubTab("roster")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                      staffViewSubTab === "roster" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-[#2DD4BF]" /> Salary, Allowances & Bonuses
                  </button>
                )}
              </div>

              {/* ATTENDANCE SHEET */}
              {staffViewSubTab === "attendance" && (
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
              )}

              {/* SALARY & COMPENSATION VIEW (MANAGER ONLY) */}
              {staffViewSubTab === "roster" && isManager && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="p-3.5">Staff & Role</th>
                        <th className="p-3.5 text-right">Base Monthly</th>
                        <th className="p-3.5 text-right">Allowances</th>
                        <th className="p-3.5 text-right">Service Charge</th>
                        <th className="p-3.5 text-right">Bonus</th>
                        <th className="p-3.5 text-right">Total Gross</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EFE6]">
                      {filteredStaff.map((member) => (
                        <tr key={member.id}>
                          <td className="p-3.5 font-bold text-[#091D26]">
                            {member.name}
                            <div className="text-[10px] text-slate-400 font-mono">{member.role}</div>
                          </td>
                          <td className="p-3.5 text-right">{settings.currency}{Number(member.baseSalary).toFixed(2)}</td>
                          <td className="p-3.5 text-right">{settings.currency}{Number(member.allowances).toFixed(2)}</td>
                          <td className="p-3.5 text-right">{settings.currency}{Number(member.serviceCharge).toFixed(2)}</td>
                          <td className="p-3.5 text-right">{settings.currency}{Number(member.bonus).toFixed(2)}</td>
                          <td className="p-3.5 text-right font-black text-[#0D9488]">{settings.currency}{calculateStaffGross(member).toFixed(2)}</td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffPayout(member.id, member.paid)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                member.paid ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-[#FFE4E6] text-[#F43F5E]"
                              }`}
                            >
                              {member.paid ? "Paid" : "Pending"}
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handlePrintPayslip(member)}
                              className="p-1 bg-[#0F2D3C] text-white rounded text-xs"
                            >
                              Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COMPLETE SETTINGS MODULE */}
          {activeTab === "settings" && isManager && (
            <div className="max-w-6xl mx-auto space-y-8 pb-16">
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

              {/* Company Information Card */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#14B8A6]" /> Company & Business Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Trading / Brand Name</label>
                    <input
                      type="text"
                      value={settingsForm.hotelName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hotelName: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Brand Tagline / Slogan</label>
                    <input
                      type="text"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Registered Legal Entity Name</label>
                    <input
                      type="text"
                      value={settingsForm.legalEntity}
                      onChange={(e) => setSettingsForm({ ...settingsForm, legalEntity: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Business Registration No. (BRN)</label>
                    <input
                      type="text"
                      value={settingsForm.companyRegNo}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyRegNo: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Tax Identification / VAT No.</label>
                    <input
                      type="text"
                      value={settingsForm.taxNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxNumber: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Terminal Hardware Identifier</label>
                    <input
                      type="text"
                      value={settingsForm.terminalId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, terminalId: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Contact Phone Number</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Business Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700">Full Physical Street Address</label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Currency & Tax Setup */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#14B8A6]" /> Currency, Taxes & Surcharge Rates
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Currency Symbol</label>
                    <input
                      type="text"
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Default Service Charge (%)</label>
                    <input
                      type="number"
                      value={settingsForm.serviceChargeRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Sales Tax / VAT (%)</label>
                    <input
                      type="number"
                      value={settingsForm.vatRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CHECK-IN WITH CAMERA */}
      {checkInModalRoom && (
        <div className="fixed inset-0 bg-[#06151E]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3] my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg">Check In - Room #{checkInModalRoom.number}</h3>
              <button type="button" onClick={handleCloseCheckInModal} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <form onSubmit={handleOpenOrderAndCheckIn} className="space-y-4 text-xs">
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
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
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

              <div>
                <label className="block font-semibold mb-1">Nights Duration</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={guestForm.nights}
                  onChange={(e) => setGuestForm({ ...guestForm, nights: parseInt(e.target.value, 10) || 1 })}
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

      {/* MODAL: DIRECT BILL SETTLEMENT CONSOLE */}
      {settleOrderRoom && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Direct Order Settlement</span>
                <h3 className="font-black text-xl text-[#091D26]">Room #{settleOrderRoom.number}</h3>
                <p className="text-xs text-slate-500">Guest: {settleOrderRoom.guestName || "Walk-In"}</p>
              </div>
              <button type="button" onClick={() => setSettleOrderRoom(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto border border-[#E6DFD3] rounded-2xl p-3 bg-[#FAF9F5] mb-4 text-xs space-y-1.5">
              {settleOrderRoom.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between py-1 border-b border-slate-100 last:border-none">
                  <div>
                    <span className="font-semibold text-slate-800">{item.quantity}x {item.description}</span>
                  </div>
                  <span className="font-semibold text-[#091D26]">{settings.currency}{Number(item.total).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-black text-sm text-[#091D26]">
                <span>Total Balance Due:</span>
                <span className="text-[#0D9488] text-base">
                  {settings.currency}{calculateTotal(settleOrderRoom).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Tender Method:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Credit Card", icon: CreditCard },
                  { id: "Cash", icon: Banknote },
                  { id: "Transfer", icon: Building2 },
                ].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSettlementMethod(id)}
                    className={`py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      settlementMethod === id
                        ? "bg-[#0F2D3C] text-white border-[#0F2D3C]"
                        : "bg-white text-slate-700 border-[#E6DFD3] hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {id}
                  </button>
                ))}
              </div>
            </div>

            {settlementMethod === "Cash" && (
              <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#E6DFD3] mb-4 flex items-center gap-3 text-xs">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cash Tendered:</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full border border-[#D3C8B7] rounded-lg px-2.5 py-1.5 font-bold text-sm focus:outline-none"
                  />
                </div>
                <div className="flex-1 text-right">
                  <span className="block text-[11px] font-semibold text-slate-600">Change Due:</span>
                  <span className="text-base font-black text-[#0D9488]">
                    {settings.currency}{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettleOrderRoom(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOrderSettlement}
                className="flex-2 bg-[#0D9488] hover:bg-[#0F766E] text-white py-3 px-6 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm & Auto-Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVENTORY ITEM (WITH COST & SELLING PRICE) */}
      {showAddInventoryModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Inventory Item</h3>
              <button type="button" onClick={() => setShowAddInventoryModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInventoryItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Artisanal Sparkling Water"
                  required
                  value={newInventoryForm.name}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={newInventoryForm.category}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, category: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white"
                >
                  <option value="minibar">Minibar</option>
                  <option value="beverage">Beverage</option>
                  <option value="snack">Snack</option>
                  <option value="amenity">Amenity</option>
                  <option value="linen">Linen</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit Cost Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cost"
                    required
                    value={newInventoryForm.cost}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, cost: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Retail Price"
                    required
                    value={newInventoryForm.price}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, price: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Stock Units</label>
                <input
                  type="number"
                  placeholder="Stock"
                  required
                  value={newInventoryForm.stock}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, stock: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 rounded-xl font-bold">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVENTORY ITEM (NEW) */}
      {editingInventoryItem && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F766E]">Update Catalog Item</span>
                <h3 className="font-bold text-lg">Edit {editingInventoryItem.name}</h3>
              </div>
              <button type="button" onClick={() => setEditingInventoryItem(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInventoryEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editInventoryForm.name}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={editInventoryForm.category}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, category: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white"
                >
                  <option value="minibar">Minibar</option>
                  <option value="beverage">Beverage</option>
                  <option value="snack">Snack</option>
                  <option value="amenity">Amenity</option>
                  <option value="linen">Linen</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Unit Cost Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editInventoryForm.cost}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, cost: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editInventoryForm.price}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, price: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Current Stock Units</label>
                <input
                  type="number"
                  required
                  value={editInventoryForm.stock}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, stock: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInventoryItem(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white py-3 rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROOM */}
      {showAddRoomModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Hotel Room</h3>
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
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

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add Team Member & Remuneration</h3>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={newStaffForm.name}
                onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                className="w-full border rounded p-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newStaffForm.role}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="General Manager">General Manager</option>
                  <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                  <option value="Front Desk Agent">Front Desk Agent</option>
                  <option value="Housekeeping Lead">Housekeeping Lead</option>
                  <option value="Maintenance Technician">Maintenance Technician</option>
                </select>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="PIN (4 Digits)"
                  required
                  value={newStaffForm.pin}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Base Monthly Salary"
                  value={newStaffForm.baseSalary}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, baseSalary: e.target.value })}
                  className="w-full border rounded p-2"
                />
                <input
                  type="number"
                  placeholder="Allowances"
                  value={newStaffForm.allowances}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, allowances: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <button type="submit" className="w-full bg-[#14B8A6] text-white font-bold py-3 rounded-lg">
                Register Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}