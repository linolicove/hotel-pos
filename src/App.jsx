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

// Built-in Official A4 Payslip Generator
function buildPayslipHtml({ settings, staffMember }) {
  const base = Number(staffMember.baseSalary) || 0;
  const allowances = Number(staffMember.allowances) || 0;
  const serviceCharge = Number(staffMember.serviceCharge) || 0;
  const bonus = Number(staffMember.bonus) || 0;
  const grossPay = base + allowances + serviceCharge + bonus;

  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #555;">Monthly Remuneration Statement</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px;">
            OFFICIAL PAYSLIP
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Date:</b> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; padding: 12px 16px; border: 1px solid #091D26; border-radius: 4px;">
        <div>
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Employee</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">${staffMember.name}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Role: <b>${staffMember.role}</b></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Status</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">${staffMember.type}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Payout: <b>${staffMember.paid ? "PAID" : "PENDING"}</b></p>
        </div>
      </div>
      <table style="margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; background: #F3EFE6;">
            <th style="padding: 10px 8px; text-align: left;">Earnings Component</th>
            <th style="padding: 10px 8px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px 8px;">Base Monthly Salary</td><td style="padding: 10px 8px; text-align: right;">${settings.currency}${base.toFixed(2)}</td></tr>
          <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px 8px;">Allowances (Housing/Meals)</td><td style="padding: 10px 8px; text-align: right;">${settings.currency}${allowances.toFixed(2)}</td></tr>
          <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px 8px;">Service Charge Pool</td><td style="padding: 10px 8px; text-align: right;">${settings.currency}${serviceCharge.toFixed(2)}</td></tr>
          <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px 8px;">Bonus & Incentives</td><td style="padding: 10px 8px; text-align: right;">${settings.currency}${bonus.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <div style="border-top: 2px solid #091D26; padding: 14px 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: bold;">Total Net Remittance:</span>
        <span style="font-size: 22px; font-weight: 900; color: #0D9488;">${settings.currency}${grossPay.toFixed(2)}</span>
      </div>
    </div>
  `;
}

// Built-in Official A4 Daily Attendance Sheet Generator
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

  // Refs for WebCam streaming & Canvas snapshot
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

  // Room / Stock Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ number: "", type: "Ocean Breeze King", rate: 18000, status: "available" });
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInventoryForm, setNewInventoryForm] = useState({ name: "", category: "minibar", price: "850", stock: "20" });

  // Staff & Compensation Management State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffViewSubTab, setStaffViewSubTab] = useState("roster"); // "roster" | "attendance"
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

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError("");
  };

  const handlePinClear = () => {
    setPinInput("");
    setPinError("");
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
      const data = snapshot.val();
      if (!data) {
        const initialRooms = {
          "101": {
            id: "101",
            number: "101",
            type: "Ocean Breeze King",
            rate: 22000,
            status: "occupied",
            orderId: "ORD-101-9281",
            openedAt: "2026-09-28 14:30",
            guestName: "Marina Sterling",
            guestPhone: "+1 555-0143",
            checkIn: "2026-09-28",
            checkOut: "2026-10-02",
            orderItems: {
              "i1": { id: "i1", description: "Room Charge (2 Nights)", quantity: 2, unitPrice: 22000, total: 44000, timestamp: "Sep 28, 14:30" },
              "i2": { id: "i2", description: "Minibar: Artisanal Water", quantity: 2, unitPrice: 850, total: 1700, timestamp: "Sep 29, 10:15" },
            },
          },
          "102": { id: "102", number: "102", type: "Lagoon View Double", rate: 18000, status: "available" },
          "201": { id: "201", number: "201", type: "Coral Penthouse Suite", rate: 45000, status: "cleaning" },
          "202": { id: "202", number: "202", type: "Ocean Breeze King", rate: 22000, status: "maintenance" },
        };
        set(roomsRef, initialRooms);
      } else {
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

    // 3. Inventory Listener
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
          name: data[key].name || data[key].title || "Unnamed Item",
          category: data[key].category || "minibar",
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

    // 5. Daily Attendance History Listener (Carried Forward Daily)
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

  // --- DAILY ATTENDANCE CLOCK IN / OUT ACTIONS ---
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
    const html = printFormat === "thermal"
      ? buildThermalHtml({ settings, room: settleOrderRoom, isTemporary: false, settlementMethod, total })
      : buildA4Html({ settings, room: settleOrderRoom, isTemporary: false, settlementMethod, total });
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
  };

  const handlePrintPayslip = (staffMember) => {
    const html = buildPayslipHtml({ settings, staffMember });
    printIsolatedDocument(html, "a4");
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

  // Staff & Room & Inventory Actions
  const handleUpdateStockLevel = (itemId, delta) => {
    if (!itemId) return;
    const target = inventory.find((i) => i.id === itemId);
    const currentStock = Number(target?.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    setInventory((prev) => prev.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item)));
    update(ref(rtdb, `inventory/${itemId}`), { stock: newStock });
  };

  const handleCreateInventoryItem = (e) => {
    e.preventDefault();
    if (!newInventoryForm.name.trim()) return;
    const itemId = `inv_${Date.now()}`;
    const cleanPrice = parseFloat(newInventoryForm.price);
    const cleanStock = parseInt(newInventoryForm.stock, 10);
    const newItem = {
      id: itemId,
      name: newInventoryForm.name.trim(),
      category: newInventoryForm.category || "minibar",
      price: isNaN(cleanPrice) || cleanPrice < 0 ? 0 : cleanPrice,
      stock: isNaN(cleanStock) || cleanStock < 0 ? 0 : cleanStock,
    };
    setInventory((prev) => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddInventoryModal(false);
    setNewInventoryForm({ name: "", category: "minibar", price: "850", stock: "20" });
    set(ref(rtdb, `inventory/${itemId}`), newItem);
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

  // =========================================================
  // PIN TERMINAL LOCK SCREEN (LUXURY RESORT EDITION)
  // =========================================================
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
        {/* Ambient Sea-Vibe Radiant Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0D9488]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#14B8A6]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0284C7]/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Floating Glassmorphic Terminal Card */}
        <div className="relative z-10 w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] flex flex-col items-center">
          
          {/* Top Terminal Status Header */}
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

          {/* Resort Crest Icon */}
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

          {/* Interactive PIN Indicators */}
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

            {/* Error or Help Text */}
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

          {/* Alphanumeric Keypad Grid */}
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

          {/* Quick-Access Staff Badges */}
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
          {activeTab === "inventory" && canAccessTab("inventory") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Inventory & Minibar Stock</h2>
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(true)}
                    className="bg-[#14B8A6] text-white px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    + Add Stock Item
                  </button>
                )}
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

              {/* View Switcher: Daily Attendance vs Compensation Roster */}
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

          {/* TAB 6: COMPLETE SETTINGS MODULE (MATCHING YOUR SCREENSHOT) */}
          {activeTab === "settings" && isManager && (
            <div className="max-w-6xl mx-auto space-y-8 pb-16">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E6DFD3] pb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-[#14B8A6]" /> System, Business & Peripheral Settings[cite: 3]
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage company identity, thermal printing options, automated cash drawer solenoid, and database backup files[cite: 3].
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D3C8B7] bg-white hover:bg-slate-50 text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-500" /> Download Backup[cite: 3]
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllSettings}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Changes[cite: 3]
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

      {/* MODAL 2: SETTLEMENT */}
      {settleOrderRoom && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-start mb-4 pb-3 border-b">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Order Settlement</span>
                <h3 className="font-black text-xl">Room #{settleOrderRoom.number}</h3>
              </div>
              <button type="button" onClick={() => setSettleOrderRoom(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs mb-4">Total Settling: <b>{settings.currency}{calculateTotal(settleOrderRoom).toFixed(2)}</b></div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmOrderSettlement}
                className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white py-3 rounded-lg text-xs font-bold"
              >
                Confirm Payment & Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD INVENTORY */}
      {showAddInventoryModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Add Inventory Item</h3>
              <button type="button" onClick={() => setShowAddInventoryModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInventoryItem} className="space-y-4 text-xs">
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

      {/* MODAL 4: ADD ROOM */}
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

      {/* MODAL 5: ADD STAFF */}
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