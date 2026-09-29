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

const DEFAULT_SETTINGS = {
  hotelName: "Azure Cove Boutique Resort",
  taxNumber: "TX-998234-CY",
  phone: "+1 (808) 555-0199",
  email: "concierge@azurecove.com",
  address: "104 Ocean Drive, Kailua-Kona, HI",
  currency: "$",
  footerNote: "Mahalo for staying with us at Azure Cove. Safe travels!",
};

const INITIAL_INVENTORY_SEEDS = [
  { id: "inv1", name: "Artisanal Sparkling Water", category: "minibar", price: 6, stock: 48 },
  { id: "inv2", name: "Organic Coconut Chips", category: "minibar", price: 5, stock: 32 },
  { id: "inv3", name: "Sea Salt Scrub Pack", category: "amenity", price: 12, stock: 15 },
  { id: "inv4", name: "Egyptian Cotton Bath Towel", category: "linen", price: 0, stock: 75 },
  { id: "inv5", name: "Cold Brew Coconut Latte", category: "minibar", price: 7, stock: 18 },
  { id: "inv6", name: "Local Island Craft Beer", category: "beverage", price: 8, stock: 24 },
  { id: "inv7", name: "Macadamia Nut Cookie Tin", category: "snack", price: 9, stock: 14 }
];

const INITIAL_STAFF_SEEDS = [
  { 
    id: "s1", 
    name: "Kailani Silva", 
    role: "General Manager", 
    pin: "1001", 
    type: "Full-Time", 
    baseSalary: 4200, 
    allowances: 600,
    serviceCharge: 450,
    bonus: 300,
    paid: true, 
    phone: "+1 808-555-0112",
    clockIn: "08:00 AM",
    clockOut: "04:30 PM",
    isOnDuty: false
  },
  { 
    id: "s2", 
    name: "Noah Jensen", 
    role: "Front Desk", 
    pin: "2044", 
    type: "Full-Time", 
    baseSalary: 2800, 
    allowances: 350,
    serviceCharge: 380,
    bonus: 150,
    paid: false, 
    phone: "+1 808-555-0123",
    clockIn: "07:30 AM",
    clockOut: "",
    isOnDuty: true
  },
  { 
    id: "s3", 
    name: "Leilani Kea", 
    role: "Housekeeping", 
    pin: "3055", 
    type: "Full-Time", 
    baseSalary: 2400, 
    allowances: 300,
    serviceCharge: 350,
    bonus: 100,
    paid: false, 
    phone: "+1 808-555-0145",
    clockIn: "09:00 AM",
    clockOut: "",
    isOnDuty: true
  }
];

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
        <div style="font-size: 11px;">* * * * * * * * * * * * * * * * *</div>
        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase; margin: 4px 0 2px 0;">
          ${settings.hotelName}
        </div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">
          COASTAL RESORT & SUITES
        </div>
        <div style="font-size: 10px; margin-top: 4px;">${settings.address}</div>
        <div style="font-size: 10px;">Tel: ${settings.phone}</div>
        <div style="font-size: 10px;">Tax Reg / VAT: ${settings.taxNumber}</div>
        <div style="font-size: 11px; margin-top: 4px;">* * * * * * * * * * * * * * * * *</div>
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
              <td style="padding: 4px 0; max-width: 38mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${item.description}
              </td>
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
        <div>${isTemporary ? "Please review before settlement" : settings.footerNote}</div>
      </div>
    </div>
  `;
}

function buildA4Html({ settings, room, isTemporary, settlementMethod, total }) {
  const items = room?.orderItems || [];
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #091D26;">
            ${settings.hotelName}
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">${settings.address} | Tel: ${settings.phone}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;">Tax ID / VAT: ${settings.taxNumber}</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
            ${isTemporary ? "INTERIM GUEST STATEMENT" : "OFFICIAL TAX INVOICE"}
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
          <p style="margin: 2px 0 0 0; font-size: 12px;">Payment: <b>${isTemporary ? "Pending" : settlementMethod}</b></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Stay Information</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">Room #${room?.number} (${room?.type})</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Period: ${room?.checkIn} to ${room?.checkOut}</p>
        </div>
      </div>
      <table style="margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; text-align: left;">
            <th style="padding: 10px 4px;">Description</th>
            <th style="padding: 10px 4px; text-align: center;">Qty</th>
            <th style="padding: 10px 4px; text-align: right;">Unit Rate</th>
            <th style="padding: 10px 4px; text-align: right;">Amount</th>
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
        <span style="font-size: 14px; font-weight: bold;">${isTemporary ? "Total Due:" : `Total Paid (${settlementMethod}):`}</span>
        <span style="font-size: 20px; font-weight: 900;">${settings.currency}${Number(total).toFixed(2)}</span>
      </div>
    </div>
  `;
}

function buildPayslipHtml({ settings, staffMember }) {
  const base = Number(staffMember.baseSalary) || 0;
  const allowances = Number(staffMember.allowances) || 0;
  const serviceCharge = Number(staffMember.serviceCharge) || 0;
  const bonus = Number(staffMember.bonus) || 0;
  const grossPay = base + allowances + serviceCharge + bonus;

  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #091D26;">
            ${settings.hotelName}
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555;">
            Monthly Remuneration Statement
          </p>
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

function buildDailyAttendanceHtml({ settings, staffList }) {
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #555;">Daily Staff Shift & Attendance Sheet</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px;"><b>Date:</b> ${new Date().toLocaleDateString()}</p>
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
  // Authentication & Permission State
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
  const [guestPhoto, setGuestPhoto] = useState(null); // Captured / Uploaded photo
  const [isCameraActive, setIsCameraActive] = useState(false); // Live WebCam Stream Flag

  // Refs for WebCam streaming & Canvas snapshot
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Custom Item Inputs for Folio
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Room Management State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    number: "",
    type: "Ocean Breeze King",
    rate: 180,
    status: "available",
  });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomRate, setEditRoomRate] = useState("");

  // Inventory Management State
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [newInventoryForm, setNewInventoryForm] = useState({
    name: "",
    category: "minibar",
    price: "6",
    stock: "20",
  });
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [editInventoryForm, setEditInventoryForm] = useState({
    name: "",
    category: "minibar",
    price: "",
    stock: "",
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
    baseSalary: "2500",
    allowances: "300",
    serviceCharge: "350",
    bonus: "100",
    phone: "",
  });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    name: "",
    role: "Front Desk",
    pin: "",
    type: "Full-Time",
    baseSalary: "",
    allowances: "",
    serviceCharge: "",
    bonus: "",
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
    if (tabId === "staff" && isHousekeeping) return true;
    if (tabId === "staff" && isManager) return true;
    if (tabId === "room-admin" && isManager) return true;
    if (tabId === "settings" && isManager) return true;
    return false;
  };

  // --- CAMERA & FILE UPLOAD ENGINE ---
  // Start tablet / device camera stream
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
      console.error("Camera access error:", err);
      alert("Unable to open device camera. Please check camera permissions in browser.");
      setIsCameraActive(false);
    }
  };

  // Stop camera stream safely
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture snapshot from live video element
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.7); // Compressed JPEG
      setGuestPhoto(base64Image);
      stopCamera();
    }
  };

  // Handle traditional image file upload / gallery pick
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read and compress
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
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setGuestPhoto(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Clean camera up when check-in modal closes
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
    const settingsRef = ref(rtdb, "hotel_config/profile");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings(data);
      else set(settingsRef, DEFAULT_SETTINGS);
    });

    const roomsRef = ref(rtdb, "rooms");
    const unsubRooms = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        const initialRooms = {
          "101": {
            id: "101",
            number: "101",
            type: "Ocean Breeze King",
            rate: 220,
            status: "occupied",
            orderId: "ORD-101-9281",
            openedAt: "2026-09-28 14:30",
            guestName: "Marina Sterling",
            guestPhone: "+1 555-0143",
            checkIn: "2026-09-28",
            checkOut: "2026-10-02",
            orderItems: {
              "i1": { id: "i1", description: "Room Charge (2 Nights)", quantity: 2, unitPrice: 220, total: 440, timestamp: "Sep 28, 14:30" },
              "i2": { id: "i2", description: "Minibar: Artisanal Water", quantity: 2, unitPrice: 6, total: 12, timestamp: "Sep 29, 10:15" },
            },
          },
          "102": { id: "102", number: "102", type: "Lagoon View Double", rate: 180, status: "available" },
          "201": { id: "201", number: "201", type: "Coral Penthouse Suite", rate: 450, status: "cleaning" },
          "202": { id: "202", number: "202", type: "Ocean Breeze King", rate: 220, status: "maintenance" },
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
          baseSalary: Number(data[k].baseSalary) || 2400,
          allowances: Number(data[k].allowances) || 0,
          serviceCharge: Number(data[k].serviceCharge) || 0,
          bonus: Number(data[k].bonus) || 0,
          paid: Boolean(data[k].paid),
          clockIn: data[k].clockIn || "",
          clockOut: data[k].clockOut || "",
          isOnDuty: Boolean(data[k].isOnDuty)
        }));
        setStaff(staffList);
      }
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubRooms();
      unsubInv();
      unsubStaff();
      stopCamera();
    };
  }, [selectedRoomId]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const calculateTotal = (room) => room?.orderItems?.reduce((acc, item) => acc + (Number(item.total) || 0), 0) || 0;
  const printTargetRoom = settleOrderRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);
  const calculateStaffGross = (s) => (Number(s.baseSalary) || 0) + (Number(s.allowances) || 0) + (Number(s.serviceCharge) || 0) + (Number(s.bonus) || 0);

  // --- ACTIONS ---
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
    const html = buildDailyAttendanceHtml({ settings, staffList: staff });
    printIsolatedDocument(html, "a4");
  };

  const formatTimeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleClockIn = (staffId) => {
    const timeStr = formatTimeNow();
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, clockIn: timeStr, clockOut: "", isOnDuty: true } : s))
    );
    update(ref(rtdb, `staff/${staffId}`), { clockIn: timeStr, clockOut: "", isOnDuty: true });
  };

  const handleClockOut = (staffId) => {
    const timeStr = formatTimeNow();
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, clockOut: timeStr, isOnDuty: false } : s))
    );
    update(ref(rtdb, `staff/${staffId}`), { clockOut: timeStr, isOnDuty: false });
  };

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
    setNewInventoryForm({ name: "", category: "minibar", price: "6", stock: "20" });
    set(ref(rtdb, `inventory/${itemId}`), newItem);
  };

  const handleStartEditInventory = (item) => {
    setEditingInventoryId(item.id);
    setEditInventoryForm({
      name: item.name || "",
      category: item.category || "minibar",
      price: String(item.price ?? 0),
      stock: String(item.stock ?? 0),
    });
  };

  const handleSaveInventoryEdit = (itemId) => {
    if (!editInventoryForm.name.trim()) return;
    const cleanPrice = parseFloat(editInventoryForm.price);
    const cleanStock = parseInt(editInventoryForm.stock, 10);
    const updatedPayload = {
      name: editInventoryForm.name.trim(),
      category: editInventoryForm.category || "minibar",
      price: isNaN(cleanPrice) || cleanPrice < 0 ? 0 : cleanPrice,
      stock: isNaN(cleanStock) || cleanStock < 0 ? 0 : cleanStock,
    };
    setInventory((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updatedPayload } : item)));
    setEditingInventoryId(null);
    update(ref(rtdb, `inventory/${itemId}`), updatedPayload);
  };

  const handleDeleteInventoryItem = (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    remove(ref(rtdb, `inventory/${item.id}`));
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
      clockIn: "",
      clockOut: "",
      isOnDuty: false
    };
    setStaff((prev) => [...prev, newStaff]);
    setShowAddStaffModal(false);
    setNewStaffForm({
      name: "",
      role: "Front Desk",
      pin: "1234",
      type: "Full-Time",
      baseSalary: "2500",
      allowances: "300",
      serviceCharge: "350",
      bonus: "100",
      phone: "",
    });
    set(ref(rtdb, `staff/${staffId}`), newStaff);
  };

  const handleStartEditStaff = (member) => {
    setEditingStaffId(member.id);
    setEditStaffForm({
      name: member.name || "",
      role: member.role || "Front Desk",
      pin: member.pin || "1234",
      type: member.type || "Full-Time",
      baseSalary: String(member.baseSalary ?? 0),
      allowances: String(member.allowances ?? 0),
      serviceCharge: String(member.serviceCharge ?? 0),
      bonus: String(member.bonus ?? 0),
      phone: member.phone || "",
    });
  };

  const handleSaveStaffEdit = (staffId) => {
    if (!editStaffForm.name.trim()) return;
    const updatedPayload = {
      name: editStaffForm.name.trim(),
      role: editStaffForm.role,
      pin: editStaffForm.pin || "0000",
      type: editStaffForm.type,
      baseSalary: parseFloat(editStaffForm.baseSalary) || 0,
      allowances: parseFloat(editStaffForm.allowances) || 0,
      serviceCharge: parseFloat(editStaffForm.serviceCharge) || 0,
      bonus: parseFloat(editStaffForm.bonus) || 0,
      phone: editStaffForm.phone || "",
    };
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...updatedPayload } : s)));
    setEditingStaffId(null);
    update(ref(rtdb, `staff/${staffId}`), updatedPayload);
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

  const handleSaveSettings = (updated) => {
    setSettings(updated);
    set(ref(rtdb, "hotel_config/profile"), updated);
  };

  const updateRoomStatus = (roomId, status) => {
    update(ref(rtdb, `rooms/${roomId}`), { status });
  };

  // CHECK-IN WITH CAMERA / UPLOADED GUEST IMAGE
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
      guestPhoto: guestPhoto || null, // Saves the captured Base64 image
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
      rate: Number(newRoomForm.rate) || 100,
      status: newRoomForm.status,
    };
    set(ref(rtdb, `rooms/${roomId}`), newRoomData);
    setShowAddRoomModal(false);
    setNewRoomForm({ number: "", type: "Ocean Breeze King", rate: 180, status: "available" });
  };

  const handleSaveRoomRate = (roomId) => {
    const rateVal = parseFloat(editRoomRate);
    if (!isNaN(rateVal) && rateVal > 0) {
      update(ref(rtdb, `rooms/${roomId}`), { rate: rateVal });
    }
    setEditingRoomId(null);
  };

  const handleDeleteRoom = (roomId, roomNumber) => {
    if (window.confirm(`Delete Room #${roomNumber}?`)) {
      remove(ref(rtdb, `rooms/${roomId}`));
    }
  };

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
  const onDutyCount = staff.filter((s) => s.isOnDuty).length;

  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - printTargetTotal);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#091D26] font-semibold text-sm">Loading Thalassa Resort Cloud...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // SCREEN: PIN-PAD TERMINAL LOCK SCREEN
  // =========================================================
  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#06151E] via-[#091D26] to-[#0F2D3C] text-white items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#14B8A6] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#14B8A6]/30">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{settings.hotelName}</h1>
          <p className="text-xs text-[#2DD4BF] font-medium mt-0.5">Staff POS & PMS Terminal Lock</p>

          <div className="my-6 flex flex-col items-center w-full">
            <div className="flex items-center gap-3 h-10">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    pinInput.length > idx
                      ? "bg-[#14B8A6] scale-125 shadow-md shadow-[#14B8A6]/50"
                      : "border-2 border-white/20"
                  }`}
                />
              ))}
            </div>

            {pinError ? (
              <span className="text-xs font-semibold text-[#F43F5E] mt-2 animate-shake">
                {pinError}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 mt-2">Enter 4-Digit Staff PIN</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handlePinDigit(digit)}
                className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-lg font-bold transition-all border border-white/5 flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handlePinClear}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold transition-all border border-white/5 text-slate-400 flex items-center justify-center uppercase tracking-wider"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handlePinDigit("0")}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-lg font-bold transition-all border border-white/5 flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handlePinDelete}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-base font-bold transition-all border border-white/5 text-slate-400 flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 w-full text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Demo Staff PIN Codes:</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => verifyPin(s.pin)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/15 rounded text-[10px] font-mono text-[#2DD4BF] border border-white/5"
                >
                  {s.name.split(" ")[0]} ({s.pin})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN WORKSPACE
  // =========================================================
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F5] text-[#091D26]">
      {/* DESKTOP SIDEBAR */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-[#091D26] border-r border-[#0F2D3C] text-white shrink-0">
        <div className="p-6 border-b border-[#0F2D3C] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-white font-bold shadow-md shadow-[#14B8A6]/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">Thalassa</h1>
            <p className="text-[11px] text-[#2DD4BF] font-medium">Hotel OS & POS</p>
          </div>
        </div>

        {/* Current Authenticated Staff Card */}
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
            className="p-1.5 rounded-lg bg-white/10 hover:bg-[#F43F5E] text-slate-300 hover:text-white transition-colors"
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

        <div className="p-4 border-t border-[#0F2D3C] bg-[#06151E]/40 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono text-[10px]">Session Active</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] text-[#F43F5E] hover:underline font-semibold"
          >
            Lock Screen
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Mobile Header Bar */}
        <header className="no-print md:hidden flex items-center justify-between p-4 bg-[#091D26] text-white border-b border-[#0F2D3C]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2DD4BF]" />
            <span className="font-bold text-sm">Thalassa POS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 rounded bg-white/10 text-slate-300"
              title="Lock Terminal"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden bg-[#091D26] border-b border-[#0F2D3C] p-4 space-y-2 z-50 text-white shadow-xl">
            <div className="text-xs pb-2 border-b border-white/10 text-[#2DD4BF] font-semibold">
              Logged in: {currentUser.name} ({currentUser.role})
            </div>
            {[
              { id: "frontdesk", label: "Front Desk" },
              { id: "active-orders", label: "Active Bills & Tabs" },
              { id: "inventory", label: "Stock & Minibar" },
              { id: "room-admin", label: "Room Management" },
              { id: "staff", label: "Staff & Attendance" },
              { id: "settings", label: "Hotel Settings" },
            ].map((item) => {
              if (!canAccessTab(item.id)) return null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2 px-3 rounded text-sm ${activeTab === item.id ? "bg-[#0D9488]" : ""}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        <main className="no-print flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: FRONT DESK */}
          {activeTab === "frontdesk" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Front Desk Operations</h2>
                  <p className="text-sm text-slate-500">Live guest room status, photo IDs, check-ins, and turnover</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white border border-[#E6DFD3] px-3 py-1.5 rounded-lg shadow-sm">
                    Total Rooms: <b>{rooms.length}</b>
                  </span>
                  <span className="bg-[#F0FDF4] border border-[#CCFBF1] text-[#0F766E] px-3 py-1.5 rounded-lg">
                    Active Bills: <b>{rooms.filter((r) => r.status === "occupied").length}</b>
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
                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4 text-xs space-y-2">
                            <div className="flex items-center gap-3">
                              {/* Guest Image Thumbnail if captured */}
                              {room.guestPhoto ? (
                                <img
                                  src={room.guestPhoto}
                                  alt="Guest ID"
                                  className="w-10 h-10 rounded-full object-cover border border-[#14B8A6] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="truncate">
                                <span className="font-bold text-[#091D26] block truncate">{room.guestName}</span>
                                <span className="text-[10px] text-slate-500">{room.guestPhone || "No contact"}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                              <span className="text-[11px] text-[#0F766E] font-mono">{room.orderId}</span>
                              <span className="font-black text-[#0D9488]">{settings.currency}{billTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Checkout: {room.checkOut}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#F3EFE6] flex gap-2">
                        {room.status === "available" && (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckInModalRoom(room);
                              setGuestPhoto(null);
                            }}
                            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" /> Check In & Photo
                          </button>
                        )}
                        {room.status === "occupied" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoomId(room.id);
                                setActiveTab("active-orders");
                              }}
                              className="flex-1 bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26] py-2 rounded-lg text-xs font-semibold"
                            >
                              Tab / Items
                            </button>
                            {(isManager || isFrontDesk) && (
                              <button
                                type="button"
                                onClick={() => handleInitiateSettleOrder(room)}
                                className="flex-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white py-2 rounded-lg text-xs font-bold"
                              >
                                Settle Order
                              </button>
                            )}
                          </>
                        )}
                        {room.status === "cleaning" && (
                          <button
                            type="button"
                            onClick={() => updateRoomStatus(room.id, "available")}
                            className="w-full bg-[#CCFBF1]/40 hover:bg-[#CCFBF1] text-[#0F766E] border border-[#2DD4BF] py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
                          </button>
                        )}
                        {room.status === "maintenance" && isManager && (
                          <button
                            type="button"
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

          {/* TAB 2: ACTIVE BILLS */}
          {activeTab === "active-orders" && canAccessTab("active-orders") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26]">Active Bills & Guest Tabs</h2>
                  <p className="text-sm text-slate-500">
                    Print temporary guest check bills, add minibar items, settle invoices, or void orders.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#E6DFD3] p-1.5 rounded-lg text-xs">
                  <span className="font-semibold text-slate-500 pl-1 text-[11px] uppercase">Print Mode:</span>
                  <button
                    type="button"
                    onClick={() => setPrintFormat("thermal")}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      printFormat === "thermal" ? "bg-[#0F2D3C] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    80mm Thermal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat("a4")}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      printFormat === "a4" ? "bg-[#0F2D3C] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Official A4
                  </button>
                </div>
              </div>

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
                              <div className="flex items-center gap-1.5 text-xs text-[#0F766E] font-bold">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{room.orderId || `ORD-${room.number}`}</span>
                              </div>
                              <h3 className="text-xl font-black text-[#091D26] mt-0.5">Room #{room.number}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Due</span>
                              <span className="text-xl font-black text-[#0D9488]">
                                {settings.currency}{billTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            {room.guestPhoto ? (
                              <img
                                src={room.guestPhoto}
                                alt="Guest"
                                className="w-12 h-12 rounded-xl object-cover border border-[#14B8A6] shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="text-xs">
                              <p className="font-bold text-[#091D26]">{room.guestName}</p>
                              <p className="text-slate-500">{room.guestPhone}</p>
                              <p className="text-[10px] text-slate-400">{room.checkIn} → {room.checkOut}</p>
                            </div>
                          </div>

                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4">
                            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                              Items on Bill ({room.orderItems?.length || 0})
                            </span>
                            <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs">
                              {room.orderItems?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-slate-600">
                                  <div className="truncate pr-2">
                                    <span className="font-bold text-[#091D26] mr-1">{item.quantity}x</span>
                                    <span>{item.description}</span>
                                  </div>
                                  <span className="font-semibold text-[#091D26] shrink-0">
                                    {settings.currency}{Number(item.total).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#F3EFE6]">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintTemporaryBill(room)}
                              className="flex-1 bg-[#0F2D3C] hover:bg-[#091D26] text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#2DD4BF]" /> Print Temp Bill
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRoomId(room.id)}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                isSelected ? "bg-[#14B8A6] text-white" : "bg-[#F3EFE6] hover:bg-[#E6DFD3] text-[#091D26]"
                              }`}
                            >
                              {isSelected ? "Posting Items" : "Add Items"}
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleInitiateSettleOrder(room)}
                              className="flex-3 bg-[#0D9488] hover:bg-[#0F766E] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                            >
                              Settle Bill <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            {isManager && (
                              <button
                                type="button"
                                onClick={() => handleDeleteActiveBill(room)}
                                className="p-2 border border-coral-200 text-coral-600 hover:bg-coral-50 rounded-lg text-xs transition-colors"
                                title="Delete / Void this active bill"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* POST CHARGES CONSOLE */}
              {currentRoom && currentRoom.status === "occupied" && (
                <div className="mt-8 pt-8 border-t border-[#E6DFD3]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#091D26]">
                        Posting Charges to Room #{currentRoom.number} ({currentRoom.guestName})
                      </h3>
                      <p className="text-xs text-slate-500">Post extra amenities, food orders, or minibar consumables</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-[#E6DFD3] shadow-sm p-6">
                      <form onSubmit={handleAddItemToOrder} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
                        <input
                          type="text"
                          placeholder="Item or service name..."
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          className="sm:col-span-2 border border-[#D3C8B7] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
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
                            <th className="py-2.5 text-right">Unit Rate</th>
                            <th className="py-2.5 text-right">Total</th>
                            <th className="py-2.5 text-center">Del</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3EFE6]">
                          {currentRoom.orderItems?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 font-medium text-[#091D26]">
                                <div>{item.description}</div>
                                {item.timestamp && <span className="text-[10px] text-slate-400">{item.timestamp}</span>}
                              </td>
                              <td className="py-3 text-center">{item.quantity}</td>
                              <td className="py-3 text-right">{settings.currency}{Number(item.unitPrice).toFixed(2)}</td>
                              <td className="py-3 text-right font-semibold">{settings.currency}{Number(item.total).toFixed(2)}</td>
                              <td className="py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(item.id)}
                                  className="text-[#F43F5E] hover:text-[#E11D48]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm p-6 space-y-3">
                      <h4 className="font-bold text-sm text-[#091D26] uppercase">Instant Minibar Dispatch</h4>
                      <div className="space-y-2">
                        {inventory.filter((i) => i.price > 0).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleQuickAddMinibar(item)}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E6DFD3] hover:border-[#14B8A6] bg-[#FAF9F5] text-xs transition-colors"
                          >
                            <div className="text-left">
                              <span className="font-medium text-[#091D26] block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400">Stock: {item.stock}</span>
                            </div>
                            <span className="font-bold text-[#0F766E]">{settings.currency}{Number(item.price).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === "inventory" && canAccessTab("inventory") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26]">Inventory & Minibar Management</h2>
                  <p className="text-sm text-slate-500">Realtime Database synchronization for room minibar consumables and amenities.</p>
                </div>
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <PackagePlus className="w-4 h-4" /> Add Inventory Item
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Billable Price</th>
                      <th className="p-3.5 text-center">Stock Level</th>
                      <th className="p-3.5 text-center">Quick Adjust</th>
                      {isManager && <th className="p-3.5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {filteredInventory.map((item) => {
                      const isEditing = editingInventoryId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="p-3.5 font-bold text-[#091D26]">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full border border-[#14B8A6] rounded px-2 py-1 text-xs focus:outline-none bg-white"
                                value={editInventoryForm.name}
                                onChange={(e) => setEditInventoryForm({ ...editInventoryForm, name: e.target.value })}
                              />
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="p-3.5">{item.category}</td>
                          <td className="p-3.5 text-right font-medium">
                            {item.price > 0 ? `${settings.currency}${Number(item.price).toFixed(2)}` : "Free"}
                          </td>
                          <td className="p-3.5 text-center font-bold">{item.stock}</td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, -1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6] text-xs font-bold"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, 1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6] text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {isManager && (
                            <td className="p-3.5 text-center">
                              {isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveInventoryEdit(item.id)}
                                  className="p-1 bg-[#14B8A6] text-white rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInventory(item)}
                                  className="text-slate-400 hover:text-[#0D9488] p-1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* TAB 4: ROOM MANAGEMENT (MANAGER ONLY) */}
          {activeTab === "room-admin" && isManager && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Room Catalog & Configuration</h2>
                  <p className="text-sm text-slate-500">Add, re-price, change status, and decommission rooms</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(true)}
                  className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add New Room
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Room #</th>
                      <th className="p-3.5">Room Type</th>
                      <th className="p-3.5">Rate / Night</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="p-3.5 font-black text-base text-[#091D26]">#{room.number}</td>
                        <td className="p-3.5 font-medium text-slate-700">{room.type}</td>
                        <td className="p-3.5 font-bold text-slate-900">{settings.currency}{room.rate}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize bg-[#CCFBF1] text-[#0F766E]">
                            {room.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id, room.number)}
                            className="p-1.5 rounded text-[#F43F5E] hover:bg-[#FFE4E6]"
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

          {/* TAB 5: STAFF & ATTENDANCE */}
          {activeTab === "staff" && canAccessTab("staff") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Staff, Attendance & Remuneration</h2>
                  <p className="text-sm text-slate-500">
                    Track daily in/out shift attendance, base monthly salaries, service charge share, and bonuses.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintDailyAttendance}
                    className="inline-flex items-center gap-2 bg-[#0F2D3C] hover:bg-[#091D26] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2DD4BF]" /> Print Attendance
                  </button>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(true)}
                      className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4" /> Add Team Member
                    </button>
                  )}
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex bg-[#F3EFE6] p-1 rounded-lg border border-[#E6DFD3]">
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
                      <Coins className="w-3.5 h-3.5 text-[#2DD4BF]" /> Payroll & Remuneration
                    </button>
                  )}
                </div>
              </div>

              {/* ATTENDANCE SHEET */}
              {staffViewSubTab === "attendance" && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="p-3.5">Employee</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5 text-center">Clock-In</th>
                        <th className="p-3.5 text-center">Clock-Out</th>
                        <th className="p-3.5 text-center">Duty Status</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EFE6]">
                      {filteredStaff.map((member) => (
                        <tr key={member.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="p-3.5 font-bold text-[#091D26]">{member.name}</td>
                          <td className="p-3.5">{member.role}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">{member.clockIn || "--:--"}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">{member.clockOut || "--:--"}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              member.isOnDuty ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-slate-100 text-slate-600"
                            }`}>
                              {member.isOnDuty ? "On Duty" : "Off Duty"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {!member.isOnDuty ? (
                              <button
                                type="button"
                                onClick={() => handleClockIn(member.id)}
                                className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold"
                              >
                                Clock In
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClockOut(member.id)}
                                className="px-3 py-1.5 bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-lg text-xs font-bold"
                              >
                                Clock Out
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAYROLL VIEW (MANAGER ONLY) */}
              {staffViewSubTab === "roster" && isManager && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="p-3.5">Staff & Role</th>
                        <th className="p-3.5 text-right">Base</th>
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

          {/* TAB 6: SETTINGS (MANAGER ONLY) */}
          {activeTab === "settings" && isManager && (
            <div className="max-w-3xl mx-auto bg-white border border-[#E6DFD3] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#091D26]">Hotel Details & Letterhead Configuration</h2>
                <p className="text-sm text-slate-500">Legal details printed directly on receipts, invoices, and letterheads</p>
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

      {/* =========================================================
          CHECK-IN MODAL WITH INTEGRATED CAMERA & FILE UPLOAD
          ========================================================= */}
      {checkInModalRoom && (
        <div className="fixed inset-0 bg-[#06151E]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E6DFD3] my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Guest Registration & ID</span>
                <h3 className="font-bold text-lg text-[#091D26]">Check In - Room #{checkInModalRoom.number}</h3>
              </div>
              <button type="button" onClick={handleCloseCheckInModal} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden Canvas used for taking high-res snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            <form onSubmit={handleOpenOrderAndCheckIn} className="space-y-4 text-xs">
              {/* CAMERA / IMAGE CAPTURE INTERFACE */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E6DFD3] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] text-[#091D26] uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#0F766E]" /> Guest Photo / Passport ID
                  </span>
                  {guestPhoto && (
                    <button
                      type="button"
                      onClick={() => setGuestPhoto(null)}
                      className="text-[10px] text-coral-600 font-bold hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* 1. Live Camera Stream Viewport */}
                {isCameraActive ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#14B8A6]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-4 py-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-full font-bold shadow-lg flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Snap Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-black/60 hover:bg-black text-white rounded-full font-semibold text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : guestPhoto ? (
                  /* 2. Photo Preview Once Taken / Uploaded */
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center border border-[#14B8A6]">
                    <img src={guestPhoto} alt="Captured Guest ID" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Photo Attached ✓
                    </div>
                  </div>
                ) : (
                  /* 3. Action Buttons to Open Camera or Pick File */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-3 rounded-xl border border-dashed border-[#14B8A6] bg-[#CCFBF1]/30 hover:bg-[#CCFBF1]/60 text-[#0F766E] font-bold flex flex-col items-center justify-center gap-1.5 transition-all"
                    >
                      <Camera className="w-5 h-5 text-[#0D9488]" />
                      <span>Take Photo (Camera)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl border border-dashed border-[#D3C8B7] bg-white hover:bg-slate-50 text-slate-600 font-bold flex flex-col items-center justify-center gap-1.5 transition-all"
                    >
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span>Upload ID / File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Guest Details Form Fields */}
              <div>
                <label className="block font-semibold mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Sterling"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
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
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] flex justify-between items-center">
                <span className="text-slate-500">Initial Billable Order Value:</span>
                <span className="font-black text-sm text-[#0D9488]">
                  {settings.currency}{(checkInModalRoom.rate * (guestForm.nights || 1)).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Complete Registration & Check In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SETTLEMENT MODAL */}
      {settleOrderRoom && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E6DFD3]">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Order Settlement</span>
                <h3 className="font-black text-xl text-[#091D26]">Room #{settleOrderRoom.number}</h3>
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

      {/* ADD ROOM MODAL */}
      {showAddRoomModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add Hotel Room</h3>
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={newRoomForm.number}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, number: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Nightly Rate</label>
                <input
                  type="number"
                  required
                  value={newRoomForm.rate}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, rate: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>
              <button type="submit" className="w-full bg-[#14B8A6] text-white font-bold py-3 rounded-lg">
                Register Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD INVENTORY MODAL */}
      {showAddInventoryModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add Inventory Item</h3>
              <button type="button" onClick={() => setShowAddInventoryModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInventoryItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newInventoryForm.name}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInventoryForm.price}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, price: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stock</label>
                  <input
                    type="number"
                    value={newInventoryForm.stock}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, stock: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#14B8A6] text-white font-bold py-3 rounded-lg">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && isManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add Team Member</h3>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white"
                  >
                    <option value="General Manager">General Manager</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">PIN (4-digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newStaffForm.pin}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Base Monthly Salary ({settings.currency})</label>
                  <input
                    type="number"
                    value={newStaffForm.baseSalary}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, baseSalary: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Allowances ({settings.currency})</label>
                  <input
                    type="number"
                    value={newStaffForm.allowances}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, allowances: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                  />
                </div>
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