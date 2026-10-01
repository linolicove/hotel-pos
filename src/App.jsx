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
  Tag,
  TrendingUp,
  Percent,
  CalendarCheck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Usb,
  Calendar,
  CalendarRange,
  Filter,
  Eye,
  ShieldAlert
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

// Sanitization & Security Helper Functions
function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/onload=/gi, "")
    .trim();
}

function isValidImageDataUri(dataUri) {
  if (!dataUri || typeof dataUri !== "string") return false;
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(dataUri);
}

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
  webhookUrl: "",

  paperRollWidth: "80mm Thermal Paper (Standard POS)",
  receiptFontSize: "14px - Extra Bold & Large",
  receiptFontType: "Monospace (Classic ESC/POS Receipt)",
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
    overtimePay: 0,
    epfDeduction: 10000,
    taxDeduction: 5000,
    advanceDeduction: 0,
    bankAccount: "Commercial Bank - 8009234123",
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
    overtimePay: 4500,
    epfDeduction: 6000,
    taxDeduction: 0,
    advanceDeduction: 5000,
    bankAccount: "HNB Bank - 003010482912",
    paid: false, 
    phone: "+94 77 234 5678"
  },
  { 
    id: "s3", 
    name: "Leilani Kea", 
    role: "Housekeeping Staff", 
    pin: "3055", 
    type: "Full-Time", 
    baseSalary: 65000, 
    allowances: 12000,
    serviceCharge: 35000,
    bonus: 5000,
    overtimePay: 3000,
    epfDeduction: 5200,
    taxDeduction: 0,
    advanceDeduction: 0,
    bankAccount: "Sampath Bank - 100958291039",
    paid: false, 
    phone: "+94 77 345 6789"
  }
];

const getTodayKey = () => new Date().toISOString().split("T")[0];

const formatTimeClean = (dateObj = new Date()) => {
  return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
};

const calculateDurationFromMs = (inMs, outMs) => {
  if (!inMs) return "--";
  const end = outMs || Date.now();
  const diffMs = end - inMs;
  if (diffMs <= 0) return "0.0 hrs";
  const hrs = diffMs / (1000 * 60 * 60);
  return `${hrs.toFixed(1)} hrs`;
};

// --- 2. PROGRAMMATIC ISOLATED PRINT ENGINE ---
function printIsolatedDocument(htmlBody, mode = "thermal") {
  try {
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
          margin: ${mode === "thermal" ? "0mm" : "12mm"};
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
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print invocation error:", err);
      }
      setTimeout(() => {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1500);
    }, 300);
  } catch (e) {
    console.error("Failed to generate isolated print frame:", e);
  }
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
            <span>CHANGE RETURNED:</span>
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

// --- RESTORED & OPTIMIZED PAYSLIP GENERATION ENGINE ---
function buildPayslipHtml({ settings, staffMember, payPeriodStr = "Current Pay Period" }) {
  const base = Number(staffMember.baseSalary) || 0;
  const allowances = Number(staffMember.allowances) || 0;
  const serviceCharge = Number(staffMember.serviceCharge) || 0;
  const bonus = Number(staffMember.bonus) || 0;
  const overtime = Number(staffMember.overtimePay) || 0;
  const totalEarnings = base + allowances + serviceCharge + bonus + overtime;

  const epfEmployee = Number(staffMember.epfDeduction) || Math.round(base * 0.08);
  const taxWithholding = Number(staffMember.taxDeduction) || 0;
  const advances = Number(staffMember.advanceDeduction) || 0;
  const totalDeductions = epfEmployee + taxWithholding + advances;

  const netPay = Math.max(0, totalEarnings - totalDeductions);
  const epfEmployer = Math.round(base * 0.12);
  const etfEmployer = Math.round(base * 0.03);

  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555;">${settings.tagline}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">${settings.address} | Tel: ${settings.phone}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;">Tax ID / VAT: ${settings.taxNumber} | BRN: ${settings.companyRegNo}</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; text-transform: uppercase; background: #F3EFE6;">
            CONFIDENTIAL PAYSLIP
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Pay Cycle:</b> ${payPeriodStr}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;"><b>Date:</b> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;"><b>Ref:</b> PAY-${String(staffMember.id).toUpperCase()}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 18px 0; padding: 12px 16px; border: 1px solid #091D26; border-radius: 4px; background: #FAF9F5;">
        <div>
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Employee Information</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #091D26;">${staffMember.name}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Designation: <b>${staffMember.role}</b></p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Employment Type: <b>${staffMember.type || "Full-Time"}</b></p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Bank A/C: <b>${staffMember.bankAccount || "Cash Remittance / Check"}</b></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Employment Details</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #091D26;">${staffMember.id}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Contact: <b>${staffMember.phone || "--"}</b></p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Payment Status: <b>${staffMember.paid ? "DISBURSED / PAID" : "PENDING DISBURSEMENT"}</b></p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #091D26; background: #E6DFD3;">
              <th style="padding: 8px 6px; text-align: left;">Earnings</th>
              <th style="padding: 8px 6px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Basic Salary</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${base.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Fixed Allowances</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${allowances.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Service Charge Pool Share</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${serviceCharge.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Performance Bonus</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${bonus.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Overtime Pay</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${overtime.toFixed(2)}</td></tr>
            <tr style="border-top: 2px solid #091D26; font-weight: bold; background: #FAF9F5;">
              <td style="padding: 8px 6px;">Total Gross Earnings:</td>
              <td style="padding: 8px 6px; text-align: right;">${settings.currency}${totalEarnings.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #091D26; background: #FFE4E6;">
              <th style="padding: 8px 6px; text-align: left; color: #9F1239;">Deductions</th>
              <th style="padding: 8px 6px; text-align: right; color: #9F1239;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">EPF (Employee 8%)</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${epfEmployee.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Tax / PAYE Withholding</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${taxWithholding.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 6px;">Salary Advance / Loans</td><td style="padding: 8px 6px; text-align: right;">${settings.currency}${advances.toFixed(2)}</td></tr>
            <tr style="border-bottom: 1px solid #eee; height: 35px;"><td style="padding: 8px 6px;"></td><td></td></tr>
            <tr style="border-bottom: 1px solid #eee; height: 35px;"><td style="padding: 8px 6px;"></td><td></td></tr>
            <tr style="border-top: 2px solid #091D26; font-weight: bold; background: #FFF1F2; color: #9F1239;">
              <td style="padding: 8px 6px;">Total Deductions:</td>
              <td style="padding: 8px 6px; text-align: right;">${settings.currency}${totalDeductions.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border: 2px solid #091D26; background: #CCFBF1; padding: 14px 18px; margin: 18px 0; display: flex; justify-content: space-between; align-items: center; border-radius: 4px;">
        <div>
          <span style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0F766E;">NET TAKE-HOME PAYABLE:</span>
          <span style="display: block; font-size: 10px; color: #555;">(Gross Earnings - Total Deductions)</span>
        </div>
        <span style="font-size: 26px; font-weight: 900; color: #0D9488;">${settings.currency}${netPay.toFixed(2)}</span>
      </div>

      <div style="background: #F8FAFC; border: 1px dashed #94A3B8; padding: 10px 14px; margin: 16px 0; font-size: 11px; display: flex; justify-content: space-between;">
        <span><b>Employer Statutory:</b></span>
        <span>EPF (12%): <b>${settings.currency}${epfEmployer.toFixed(2)}</b></span>
        <span>ETF (3%): <b>${settings.currency}${etfEmployer.toFixed(2)}</b></span>
        <span>Total Contributions: <b>${settings.currency}${(epfEmployer + etfEmployer).toFixed(2)}</b></span>
      </div>

      <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px;">
        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Employee Acknowledgment:</p>
          <div style="border-bottom: 1px solid #000; width: 85%;"></div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Authorized General Manager / HR:</p>
          <div style="border-bottom: 1px solid #000; width: 85%; margin-left: auto;"></div>
        </div>
      </div>
    </div>
  `;
}

function buildDailyAttendanceReportHtml({ settings, reportList, titleStr }) {
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #555;">Daily Staff Shift & Attendance Audit Sheet</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; background: #F3EFE6;">
            ATTENDANCE LOG
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Scope:</b> ${titleStr}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; background: #F3EFE6;">
            <th style="padding: 10px 6px; text-align: left;">Date</th>
            <th style="padding: 10px 6px; text-align: left;">Employee Name</th>
            <th style="padding: 10px 6px; text-align: left;">Role</th>
            <th style="padding: 10px 6px; text-align: center;">In Time</th>
            <th style="padding: 10px 6px; text-align: center;">Out Time</th>
            <th style="padding: 10px 6px; text-align: center;">Shift Hours</th>
            <th style="padding: 10px 6px; text-align: center;">Duty Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportList.map((m) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 6px; font-family: monospace;">${m.date || "--"}</td>
              <td style="padding: 10px 6px; font-weight: bold;">${m.name}</td>
              <td style="padding: 10px 6px;">${m.role}</td>
              <td style="padding: 10px 6px; text-align: center; font-family: monospace;">${m.clockIn || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center; font-family: monospace;">${m.clockOut || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center; font-weight: bold;">${m.hoursLogged || "--"}</td>
              <td style="padding: 10px 6px; text-align: center; font-weight: bold; color: ${m.isOnDuty ? '#0D9488' : '#64748B'};">
                ${m.isOnDuty ? "ON DUTY" : m.clockOut ? "COMPLETED" : "OFF DUTY"}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function buildSalesReportHtml({ settings, salesList, prebookingsList, titleStr, totalSales }) {
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #091D26;">${settings.hotelName}</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #555;">Executive Sales, Turnover & Prebooking Report</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; background: #F3EFE6;">
            REVENUE AUDIT
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Scope:</b> ${titleStr}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0;">
        <div style="border: 1px solid #091D26; padding: 12px; background: #FAF9F5; border-radius: 4px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555;">Gross Settled Revenue</div>
          <div style="font-size: 20px; font-weight: 900; color: #0D9488; margin-top: 4px;">${settings.currency}${Number(totalSales).toLocaleString()}</div>
        </div>
        <div style="border: 1px solid #091D26; padding: 12px; background: #FAF9F5; border-radius: 4px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555;">Settled Transactions</div>
          <div style="font-size: 20px; font-weight: 900; color: #091D26; margin-top: 4px;">${salesList.length} Folios</div>
        </div>
        <div style="border: 1px solid #091D26; padding: 12px; background: #FAF9F5; border-radius: 4px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555;">Pre-Bookings Manifest</div>
          <div style="font-size: 20px; font-weight: 900; color: #6366F1; margin-top: 4px;">${prebookingsList.length} Stays</div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 24px; border-bottom: 2px solid #091D26; padding-bottom: 4px;">
        1. Settled Revenue & Folios Ledger
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; background: #F3EFE6;">
            <th style="padding: 8px 6px; text-align: left;">Date & Time</th>
            <th style="padding: 8px 6px; text-align: left;">Folio / Bill #</th>
            <th style="padding: 8px 6px; text-align: left;">Room</th>
            <th style="padding: 8px 6px; text-align: left;">Guest Name</th>
            <th style="padding: 8px 6px; text-align: center;">Tender</th>
            <th style="padding: 8px 6px; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${salesList.map((s) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 6px; font-family: monospace;">${s.date} ${s.settledAt || ""}</td>
              <td style="padding: 8px 6px; font-family: monospace; font-weight: bold;">${s.orderId}</td>
              <td style="padding: 8px 6px;">#${s.roomNumber}</td>
              <td style="padding: 8px 6px; font-weight: bold;">${s.guestName}</td>
              <td style="padding: 8px 6px; text-align: center;">${s.settlementMethod}</td>
              <td style="padding: 8px 6px; text-align: right; font-weight: bold;">${settings.currency}${Number(s.totalAmount).toLocaleString()}</td>
            </tr>
          `).join("")}
          ${salesList.length === 0 ? `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #888;">No sales records found for this period.</td></tr>` : ""}
        </tbody>
      </table>
    </div>
  `;
}

// --- 3. DYNAMIC PRICING ENGINE ---
function getDynamicRoomRate(room, allRooms = []) {
  if (!room) return 0;
  const baseRate = Number(room.rate) || 18000;
  const weekendRate = Number(room.weekendRate) || Math.round(baseRate * 1.2);
  const peakRate = Number(room.peakRate) || Math.round(baseRate * 1.4);
  const strategy = room.rateStrategy || "standard";

  if (strategy === "weekend") return weekendRate;
  if (strategy === "peak") return peakRate;
  if (strategy === "auto") {
    const totalRooms = allRooms.length || 1;
    const occupiedCount = allRooms.filter(r => r.status === "occupied").length;
    const occupancyPercent = (occupiedCount / totalRooms) * 100;

    if (occupancyPercent >= 75) return peakRate;
    if (occupancyPercent >= 50) return weekendRate;
    return baseRate;
  }
  return baseRate;
}

// --- 4. MAIN COMPONENT ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [pinLockoutUntil, setPinLockoutUntil] = useState(0);

  const [activeTab, setActiveTab] = useState("frontdesk");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Front Desk Room Status Filter State
  const [frontDeskFilter, setFrontDeskFilter] = useState("all");

  // RTDB Synchronized State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY_SEEDS);
  const [staff, setStaff] = useState(INITIAL_STAFF_SEEDS);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState({});
  const [salesRecords, setSalesRecords] = useState({});
  const [prebookings, setPrebookings] = useState({});
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [filterAllDates, setFilterAllDates] = useState(false);
  const [loading, setLoading] = useState(true);

  // Attendance Monitor Filter State
  const [attendanceStaffFilter, setAttendanceStaffFilter] = useState("all");

  // Reports & Analytics Sub-tab & Filter States
  const [reportsSubTab, setReportsSubTab] = useState("sales");
  const [reportDateFrom, setReportDateFrom] = useState(getTodayKey());
  const [reportDateTo, setReportDateTo] = useState(getTodayKey());
  const [reportPaymentMethodFilter, setReportPaymentMethodFilter] = useState("all");
  const [reportBookingStatusFilter, setReportBookingStatusFilter] = useState("all");

  // Modal to preview guest photo from sales report or check-in
  const [viewPhotoModalData, setViewPhotoModalData] = useState(null);

  // Pre-Booking Creation Modal State
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    guestName: "",
    guestPhone: "",
    roomNumber: "",
    checkInDate: getTodayKey(),
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    depositAmount: "0",
    totalRate: "18000",
    status: "Confirmed",
    notes: ""
  });

  // Active Selection & Print Mode State
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [printFormat, setPrintFormat] = useState("thermal");

  // Front Desk Modals & Camera/File State
  const [checkInModalRoom, setCheckInModalRoom] = useState(null);
  const [settleOrderRoom, setSettleOrderRoom] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("Credit Card");
  const [cashTendered, setCashTendered] = useState("");
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", nights: 1, customRate: "" });
  const [guestPhoto, setGuestPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Advanced Webhook toggle state in Settings
  const [showAdvancedEmail, setShowAdvancedEmail] = useState(false);

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

  // Room / Stock Modals & Dynamic Rate Edit States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ 
    number: "", 
    type: "Ocean Breeze King", 
    rate: 18000, 
    weekendRate: 22000, 
    peakRate: 26000, 
    rateStrategy: "standard", 
    status: "available" 
  });
  const [editingDynamicRoom, setEditingDynamicRoom] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({
    number: "",
    type: "Ocean Breeze King",
    rate: 18000,
    weekendRate: 22000,
    peakRate: 26000,
    rateStrategy: "standard"
  });

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
  const [staffViewSubTab, setStaffViewSubTab] = useState("attendance");
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "Front Desk Agent",
    pin: "1234",
    type: "Full-Time",
    baseSalary: "75000",
    allowances: "15000",
    serviceCharge: "35000",
    bonus: "8000",
    overtimePay: "0",
    epfDeduction: "6000",
    taxDeduction: "0",
    advanceDeduction: "0",
    bankAccount: "",
    phone: "",
  });

  // EDIT STAFF FORM STATE
  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    name: "",
    role: "Front Desk Agent",
    pin: "",
    type: "Full-Time",
    baseSalary: "0",
    allowances: "0",
    serviceCharge: "0",
    bonus: "0",
    overtimePay: "0",
    epfDeduction: "0",
    taxDeduction: "0",
    advanceDeduction: "0",
    bankAccount: "",
    phone: "",
  });

  // STRICT ACCESS ROLES:
  const roleLower = (currentUser?.role || "").toLowerCase();
  const isGeneralManager = roleLower.includes("admin") || roleLower.includes("general manager");
  const isFrontDesk = roleLower.includes("front desk") || roleLower.includes("supervisor");
  const isHousekeeping = roleLower.includes("housekeeping");

  const canAccessTab = (tabId) => {
    if (!currentUser) return false;
    if (isGeneralManager) return true;
    if (tabId === "frontdesk") return true;
    if (tabId === "active-orders" && (isFrontDesk || isGeneralManager)) return true;
    if (tabId === "inventory" && (isFrontDesk || isGeneralManager || isHousekeeping)) return true;
    if (tabId === "reports" && isGeneralManager) return true;
    if (tabId === "staff") return true;
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
      if (isValidImageDataUri(base64Image)) {
        setGuestPhoto(base64Image);
      }
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Security validation: Only image formats are permitted.");
      return;
    }

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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        if (isValidImageDataUri(dataUrl)) {
          setGuestPhoto(dataUrl);
        }
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
    if (Date.now() < pinLockoutUntil) {
      setPinError(`Too many failed attempts. Locked for ${Math.ceil((pinLockoutUntil - Date.now()) / 1000)}s`);
      return;
    }

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
      setFailedPinAttempts(0);
      setActiveTab("frontdesk");
    } else {
      if (candidatePin.length >= 4) {
        const nextAttempts = failedPinAttempts + 1;
        setFailedPinAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          const lockout = Date.now() + 30000;
          setPinLockoutUntil(lockout);
          setPinError("Security lockout: 5 failed PIN attempts. Wait 30s.");
        } else {
          setPinError(`Invalid PIN (Attempt ${nextAttempts}/5)`);
        }
        setPinInput("");
      }
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
      if (data) {
        setSettings(data);
        setSettingsForm(data);
      } else {
        set(settingsRef, DEFAULT_SETTINGS);
        setSettingsForm(DEFAULT_SETTINGS);
      }
    });

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
          return {
            ...roomObj,
            id: key,
            rate: Number(roomObj.rate) || 18000,
            weekendRate: Number(roomObj.weekendRate) || Math.round((Number(roomObj.rate) || 18000) * 1.2),
            peakRate: Number(roomObj.peakRate) || Math.round((Number(roomObj.rate) || 18000) * 1.4),
            rateStrategy: roomObj.rateStrategy || "standard",
            guestPhoto: roomObj.guestPhoto || null,
            orderItems: orderItemsArray 
          };
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
          name: data[key].name || "Unnamed Item",
          category: data[key].category || "minibar",
          cost: Number(data[key].cost) || 0,
          price: Number(data[key].price) || 0,
          stock: Number(data[key].stock) || 0,
        }));
        setInventory(loaded.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });

    // Staff Listener
    const staffRef = ref(rtdb, "staff");
    const unsubStaff = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const staffList = Object.keys(data).map((k) => ({
          ...data[k],
          id: k,
          name: data[k].name || "Staff Member",
          role: data[k].role || "Front Desk Agent",
          type: data[k].type || "Full-Time",
          pin: String(data[k].pin || "0000"),
          baseSalary: Number(data[k].baseSalary) || 0,
          allowances: Number(data[k].allowances) || 0,
          serviceCharge: Number(data[k].serviceCharge) || 0,
          bonus: Number(data[k].bonus) || 0,
          overtimePay: Number(data[k].overtimePay) || 0,
          epfDeduction: Number(data[k].epfDeduction) || 0,
          taxDeduction: Number(data[k].taxDeduction) || 0,
          advanceDeduction: Number(data[k].advanceDeduction) || 0,
          bankAccount: data[k].bankAccount || "",
          phone: data[k].phone || "",
          isOnDuty: Boolean(data[k].isOnDuty),
          clockIn: data[k].clockIn || "",
          clockOut: data[k].clockOut || "",
          activeShiftId: data[k].activeShiftId || null,
          paid: Boolean(data[k].paid)
        }));
        setStaff(staffList);
      } else {
        const seedStaffMap = {};
        INITIAL_STAFF_SEEDS.forEach((s) => { seedStaffMap[s.id] = s; });
        set(staffRef, seedStaffMap);
      }
      setLoading(false);
    });

    const allAttendanceRef = ref(rtdb, "attendance_records");
    const unsubAllAttendance = onValue(allAttendanceRef, (snapshot) => {
      setAllAttendanceRecords(snapshot.val() || {});
    });

    const salesRef = ref(rtdb, "sales_records");
    const unsubSales = onValue(salesRef, (snapshot) => {
      setSalesRecords(snapshot.val() || {});
    });

    const prebookingsRef = ref(rtdb, "prebookings");
    const unsubPrebookings = onValue(prebookingsRef, (snapshot) => {
      setPrebookings(snapshot.val() || {});
    });

    return () => {
      unsubSettings();
      unsubRooms();
      unsubInv();
      unsubStaff();
      unsubAllAttendance();
      unsubSales();
      unsubPrebookings();
      stopCamera();
    };
  }, [selectedRoomId]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const calculateTotal = (room) => room?.orderItems?.reduce((acc, item) => acc + (Number(item.total) || 0), 0) || 0;
  const printTargetRoom = settleOrderRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);

  const calculateStaffGross = (s) => (Number(s.baseSalary) || 0) + (Number(s.allowances) || 0) + (Number(s.serviceCharge) || 0) + (Number(s.bonus) || 0) + (Number(s.overtimePay) || 0);
  const calculateStaffDeductions = (s) => (Number(s.epfDeduction) || Math.round((Number(s.baseSalary) || 0) * 0.08)) + (Number(s.taxDeduction) || 0) + (Number(s.advanceDeduction) || 0);

  // Dynamic Room Rates Management (Restricted to General Manager)
  const handleStartEditDynamicRoom = (room) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can modify room rates.");
      return;
    }
    setEditingDynamicRoom(room);
    setEditRoomForm({
      number: room.number,
      type: room.type,
      rate: Number(room.rate) || 18000,
      weekendRate: Number(room.weekendRate) || Math.round((Number(room.rate) || 18000) * 1.2),
      peakRate: Number(room.peakRate) || Math.round((Number(room.rate) || 18000) * 1.4),
      rateStrategy: room.rateStrategy || "standard"
    });
  };

  const handleSaveDynamicRoomRates = (e) => {
    e.preventDefault();
    if (!isGeneralManager || !editingDynamicRoom) return;

    const baseVal = parseFloat(editRoomForm.rate) || 18000;
    const weekendVal = parseFloat(editRoomForm.weekendRate) || Math.round(baseVal * 1.2);
    const peakVal = parseFloat(editRoomForm.peakRate) || Math.round(baseVal * 1.4);

    const updated = {
      type: sanitizeInput(editRoomForm.type),
      rate: baseVal,
      weekendRate: weekendVal,
      peakRate: peakVal,
      rateStrategy: editRoomForm.rateStrategy
    };

    update(ref(rtdb, `rooms/${editingDynamicRoom.id}`), updated);
    setEditingDynamicRoom(null);
  };

  const handleQuickToggleStrategy = (room, nextStrategy) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can alter pricing strategies.");
      return;
    }
    update(ref(rtdb, `rooms/${room.id}`), { rateStrategy: nextStrategy });
  };

  // Staff Remuneration Editor: Restricted to General Manager / Admin
  const handleStartEditStaff = (member) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can modify staff employment and remuneration profiles.");
      return;
    }
    setEditingStaffMember(member);
    setEditStaffForm({
      name: member.name || "",
      role: member.role || "Front Desk Agent",
      pin: String(member.pin || ""),
      type: member.type || "Full-Time",
      baseSalary: String(member.baseSalary ?? 0),
      allowances: String(member.allowances ?? 0),
      serviceCharge: String(member.serviceCharge ?? 0),
      bonus: String(member.bonus ?? 0),
      overtimePay: String(member.overtimePay ?? 0),
      epfDeduction: String(member.epfDeduction ?? Math.round((Number(member.baseSalary) || 0) * 0.08)),
      taxDeduction: String(member.taxDeduction ?? 0),
      advanceDeduction: String(member.advanceDeduction ?? 0),
      bankAccount: member.bankAccount || "",
      phone: member.phone || "",
    });
  };

  const handleSaveStaffEdit = (e) => {
    e.preventDefault();
    if (!isGeneralManager || !editingStaffMember) return;

    const baseVal = parseFloat(editStaffForm.baseSalary) || 0;
    const allowancesVal = parseFloat(editStaffForm.allowances) || 0;
    const serviceVal = parseFloat(editStaffForm.serviceCharge) || 0;
    const bonusVal = parseFloat(editStaffForm.bonus) || 0;
    const overtimeVal = parseFloat(editStaffForm.overtimePay) || 0;
    const epfVal = parseFloat(editStaffForm.epfDeduction) || 0;
    const taxVal = parseFloat(editStaffForm.taxDeduction) || 0;
    const advanceVal = parseFloat(editStaffForm.advanceDeduction) || 0;

    const updated = {
      name: sanitizeInput(editStaffForm.name),
      role: editStaffForm.role,
      type: editStaffForm.type,
      pin: sanitizeInput(editStaffForm.pin),
      baseSalary: baseVal,
      allowances: allowancesVal,
      serviceCharge: serviceVal,
      bonus: bonusVal,
      overtimePay: overtimeVal,
      epfDeduction: epfVal,
      taxDeduction: taxVal,
      advanceDeduction: advanceVal,
      bankAccount: sanitizeInput(editStaffForm.bankAccount),
      phone: sanitizeInput(editStaffForm.phone),
    };

    setStaff((prev) =>
      prev.map((s) => (s.id === editingStaffMember.id ? { ...s, ...updated } : s))
    );

    update(ref(rtdb, `staff/${editingStaffMember.id}`), updated)
      .then(() => {
        setEditingStaffMember(null);
      })
      .catch((err) => {
        alert("Failed to save changes to database: " + err.message);
      });
  };

  // Staff Deletion: Restricted to General Manager / Admin
  const handleDeleteStaff = (member) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can delete staff profiles.");
      return;
    }
    if (window.confirm(`Permanently remove ${member.name}?`)) {
      setStaff((prev) => prev.filter((s) => s.id !== member.id));
      remove(ref(rtdb, `staff/${member.id}`));
    }
  };

  // Inventory Management
  const handleCreateInventoryItem = (e) => {
    e.preventDefault();
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can create new inventory products.");
      return;
    }
    if (!newInventoryForm.name.trim()) return;

    const itemId = `inv_${Date.now()}`;
    const cleanCost = parseFloat(newInventoryForm.cost) || 0;
    const cleanPrice = parseFloat(newInventoryForm.price) || 0;
    const cleanStock = parseInt(newInventoryForm.stock, 10) || 0;

    const newItem = {
      id: itemId,
      name: sanitizeInput(newInventoryForm.name),
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
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can modify inventory items.");
      return;
    }
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
    if (!isGeneralManager || !editingInventoryItem || !editInventoryForm.name.trim()) return;

    const cleanCost = parseFloat(editInventoryForm.cost) || 0;
    const cleanPrice = parseFloat(editInventoryForm.price) || 0;
    const cleanStock = parseInt(editInventoryForm.stock, 10) || 0;

    const updated = {
      name: sanitizeInput(editInventoryForm.name),
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
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can delete inventory items.");
      return;
    }
    if (window.confirm(`Permanently delete "${item.name}"?`)) {
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

  // Pre-Bookings Actions
  const handleCreatePrebooking = (e) => {
    e.preventDefault();
    if (!newBookingForm.guestName || !newBookingForm.roomNumber) {
      alert("Please provide guest name and room number.");
      return;
    }
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    const newBooking = {
      id: bookingId,
      guestName: sanitizeInput(newBookingForm.guestName),
      guestPhone: sanitizeInput(newBookingForm.guestPhone),
      roomNumber: sanitizeInput(newBookingForm.roomNumber),
      checkInDate: newBookingForm.checkInDate,
      checkOutDate: newBookingForm.checkOutDate,
      totalRate: parseFloat(newBookingForm.totalRate) || 18000,
      depositAmount: parseFloat(newBookingForm.depositAmount) || 0,
      status: newBookingForm.status,
      notes: sanitizeInput(newBookingForm.notes),
      createdAt: new Date().toISOString()
    };
    set(ref(rtdb, `prebookings/${bookingId}`), newBooking);
    setShowAddBookingModal(false);
    setNewBookingForm({
      guestName: "",
      guestPhone: "",
      roomNumber: "",
      checkInDate: getTodayKey(),
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      depositAmount: "0",
      totalRate: "18000",
      status: "Confirmed",
      notes: ""
    });
  };

  const handleDeletePrebooking = (bookingId) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can delete pre-booking reservations.");
      return;
    }
    if (window.confirm("Delete this advance pre-booking reservation?")) {
      remove(ref(rtdb, `prebookings/${bookingId}`));
    }
  };

  const handleConvertPrebookingToCheckIn = (booking) => {
    const targetRoom = rooms.find(r => String(r.number) === String(booking.roomNumber));
    if (!targetRoom) {
      alert(`Room #${booking.roomNumber} does not exist in catalog.`);
      return;
    }
    if (targetRoom.status === "occupied") {
      alert(`Room #${booking.roomNumber} is currently occupied! Please clear or reassign.`);
      return;
    }
    const orderId = `ORD-${booking.roomNumber}-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const itemId = `itm_${Date.now()}`;
    const initialItem = {
      id: itemId,
      description: `Advance Room Stay Reservation (${booking.checkInDate} to ${booking.checkOutDate})`,
      quantity: 1,
      unitPrice: booking.totalRate,
      total: booking.totalRate,
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };

    update(ref(rtdb, `rooms/${targetRoom.id}`), {
      status: "occupied",
      orderId,
      openedAt: now.toLocaleString(),
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      orderItems: { [itemId]: initialItem }
    });

    update(ref(rtdb, `prebookings/${booking.id}`), { status: "Checked In" });
    setActiveTab("frontdesk");
  };

  // Settings & Database Backup (Strictly General Manager / Admin)
  const handleSaveAllSettings = () => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can save system settings.");
      return;
    }
    set(ref(rtdb, "hotel_config/profile"), settingsForm);
    setSaveSuccessMsg("Settings Saved Successfully! ✓");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleDownloadBackup = () => {
    if (!isGeneralManager) {
      alert("Access Denied: Database backup export is restricted to General Manager.");
      return;
    }
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
    if (!isGeneralManager) {
      alert("Access Denied: Database restore is restricted to General Manager.");
      return;
    }
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
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can execute a database reset/purge.");
      return;
    }
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

  const handleDeleteRoomPhoto = (roomId) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can delete stored guest verification photos.");
      return;
    }
    if (window.confirm("Delete guest identification image for this room?")) {
      update(ref(rtdb, `rooms/${roomId}`), { guestPhoto: null });
    }
  };

  // Attendance Clock In / Out
  const handleClockIn = (staffMember) => {
    const timeStr = formatTimeClean();
    const day = getTodayKey();
    const nowMs = Date.now();
    const shiftId = `${day}_${staffMember.id}_${nowMs}`;

    const newShiftRecord = {
      shiftId: shiftId,
      staffId: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      clockIn: timeStr,
      clockOut: "",
      timestampIn: nowMs,
      timestampOut: null,
      hoursLogged: "--",
      isOnDuty: true,
      date: day
    };

    set(ref(rtdb, `attendance_records/${day}/${shiftId}`), newShiftRecord);

    update(ref(rtdb, `staff/${staffMember.id}`), {
      clockIn: timeStr,
      clockOut: "",
      timestampIn: nowMs,
      activeShiftId: shiftId,
      isOnDuty: true
    });
  };

  const handleClockOut = (staffMember) => {
    const timeStr = formatTimeClean();
    const day = getTodayKey();
    const nowMs = Date.now();

    let targetShiftId = staffMember.activeShiftId;

    if (!targetShiftId && allAttendanceRecords[day]) {
      const foundEntry = Object.values(allAttendanceRecords[day]).find(
        (r) => r.staffId === staffMember.id && r.isOnDuty
      );
      if (foundEntry) targetShiftId = foundEntry.shiftId;
    }

    if (!targetShiftId) {
      targetShiftId = `${day}_${staffMember.id}_${nowMs}`;
    }

    const startMs = staffMember.timestampIn || (allAttendanceRecords[day]?.[targetShiftId]?.timestampIn) || nowMs;
    const computedHours = calculateDurationFromMs(startMs, nowMs);

    update(ref(rtdb, `attendance_records/${day}/${targetShiftId}`), {
      clockOut: timeStr,
      timestampOut: nowMs,
      hoursLogged: computedHours,
      isOnDuty: false
    });

    update(ref(rtdb, `staff/${staffMember.id}`), {
      clockOut: timeStr,
      activeShiftId: null,
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

  // Settle Order & Save into Permanent Sales Ledger
  const handleConfirmOrderSettlement = () => {
    if (!settleOrderRoom) return;
    const total = calculateTotal(settleOrderRoom);
    const tenderAmount = parseFloat(cashTendered) || total;
    const balanceReturned = Math.max(0, tenderAmount - total);
    const day = getTodayKey();
    const saleId = `SALE-${Date.now()}`;

    const saleRecord = {
      id: saleId,
      orderId: settleOrderRoom.orderId || `ORD-${settleOrderRoom.number}`,
      roomNumber: settleOrderRoom.number,
      guestName: settleOrderRoom.guestName || "Walk-In",
      guestPhone: settleOrderRoom.guestPhone || "",
      guestPhoto: settleOrderRoom.guestPhoto || null,
      checkIn: settleOrderRoom.checkIn || day,
      checkOut: settleOrderRoom.checkOut || day,
      totalAmount: total,
      cashTendered: tenderAmount,
      changeReturned: balanceReturned,
      settlementMethod: settlementMethod,
      orderItems: settleOrderRoom.orderItems || [],
      date: day,
      settledAt: formatTimeClean(),
      timestamp: Date.now()
    };
    set(ref(rtdb, `sales_records/${saleId}`), saleRecord);

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

  // FIXED: Reliable Payslip Printing Invocation
  const handlePrintPayslip = (staffMember) => {
    try {
      const html = buildPayslipHtml({
        settings,
        staffMember,
        payPeriodStr: `${selectedDate.slice(0, 7)} Monthly Cycle`
      });
      printIsolatedDocument(html, "a4");
    } catch (err) {
      console.error("Error generating payslip:", err);
      alert("Unable to generate payslip document. Please ensure all employee fields are populated.");
    }
  };

  const handlePrintDailyAttendanceReport = () => {
    const reportList = filteredArchivedReports.map(rec => ({
      date: rec.date,
      name: rec.name,
      role: rec.role,
      clockIn: rec.clockIn || "--:--",
      clockOut: rec.clockOut || "--:--",
      hoursLogged: rec.hoursLogged || calculateDurationFromMs(rec.timestampIn, rec.timestampOut),
      isOnDuty: Boolean(rec.isOnDuty)
    }));

    const html = buildDailyAttendanceReportHtml({
      settings,
      reportList,
      titleStr: filterAllDates 
        ? `All Recorded Dates | Personnel: ${attendanceStaffFilter === "all" ? "All Personnel" : attendanceStaffFilter}`
        : `Date: ${selectedDate} | Personnel: ${attendanceStaffFilter === "all" ? "All Personnel" : attendanceStaffFilter}`
    });
    printIsolatedDocument(html, "a4");
  };

  const handlePrintSalesReport = () => {
    const totalSalesAmount = filteredSalesList.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
    const html = buildSalesReportHtml({
      settings,
      salesList: filteredSalesList,
      prebookingsList: filteredPrebookingsList,
      titleStr: `${reportDateFrom} to ${reportDateTo}`,
      totalSales: totalSalesAmount
    });
    printIsolatedDocument(html, "a4");
  };

  // Staff Creation (General Manager only)
  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can register new staff members.");
      return;
    }
    if (!newStaffForm.name.trim()) return;
    const staffId = `stf_${Date.now()}`;
    const base = parseFloat(newStaffForm.baseSalary) || 0;
    const newStaff = {
      id: staffId,
      name: sanitizeInput(newStaffForm.name),
      role: newStaffForm.role || "Front Desk Agent",
      pin: sanitizeInput(newStaffForm.pin) || "0000",
      type: newStaffForm.type || "Full-Time",
      baseSalary: base,
      allowances: parseFloat(newStaffForm.allowances) || 0,
      serviceCharge: parseFloat(newStaffForm.serviceCharge) || 0,
      bonus: parseFloat(newStaffForm.bonus) || 0,
      overtimePay: parseFloat(newStaffForm.overtimePay) || 0,
      epfDeduction: parseFloat(newStaffForm.epfDeduction) || Math.round(base * 0.08),
      taxDeduction: parseFloat(newStaffForm.taxDeduction) || 0,
      advanceDeduction: parseFloat(newStaffForm.advanceDeduction) || 0,
      bankAccount: sanitizeInput(newStaffForm.bankAccount) || "",
      paid: false,
      phone: sanitizeInput(newStaffForm.phone) || "",
    };
    setStaff((prev) => [...prev, newStaff]);
    setShowAddStaffModal(false);
    set(ref(rtdb, `staff/${staffId}`), newStaff);
  };

  const handleToggleStaffPayout = (staffId, currentStatus) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can disburse staff salaries.");
      return;
    }
    const nextStatus = !currentStatus;
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, paid: nextStatus } : s)));
    update(ref(rtdb, `staff/${staffId}`), { paid: nextStatus });
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
    const dynamicRate = parseFloat(guestForm.customRate) || getDynamicRoomRate(checkInModalRoom, rooms);

    const initialOrderItem = {
      id: itemId,
      description: `Room Stay (${nights} Night${nights > 1 ? "s" : ""} @ ${checkInModalRoom.rateStrategy?.toUpperCase() || "STANDARD"} Rate)`,
      quantity: nights,
      unitPrice: dynamicRate,
      total: dynamicRate * nights,
      timestamp: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
    const roomPayload = {
      status: "occupied",
      orderId,
      openedAt: now.toLocaleString(),
      guestName: sanitizeInput(guestForm.name),
      guestPhone: sanitizeInput(guestForm.phone),
      guestPhoto: guestPhoto || null,
      checkIn: now.toISOString().split("T")[0],
      checkOut: new Date(Date.now() + nights * 86400000).toISOString().split("T")[0],
      orderItems: { [itemId]: initialOrderItem },
    };
    update(ref(rtdb, `rooms/${checkInModalRoom.id}`), roomPayload);
    setGuestPhoto(null);
    setCheckInModalRoom(null);
    setGuestForm({ name: "", phone: "", nights: 1, customRate: "" });
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
      description: sanitizeInput(newItemDesc),
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
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can void an active bill.");
      return;
    }
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
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can create rooms.");
      return;
    }
    if (!newRoomForm.number) return;
    const roomId = String(newRoomForm.number).trim();
    const baseVal = Number(newRoomForm.rate) || 18000;
    const wkndVal = Number(newRoomForm.weekendRate) || Math.round(baseVal * 1.2);
    const peakVal = Number(newRoomForm.peakRate) || Math.round(baseVal * 1.4);

    const newRoomData = {
      id: roomId,
      number: roomId,
      type: sanitizeInput(newRoomForm.type),
      rate: baseVal,
      weekendRate: wkndVal,
      peakRate: peakVal,
      rateStrategy: newRoomForm.rateStrategy || "standard",
      status: newRoomForm.status,
    };
    set(ref(rtdb, `rooms/${roomId}`), newRoomData);
    setShowAddRoomModal(false);
    setNewRoomForm({ number: "", type: "Ocean Breeze King", rate: 18000, weekendRate: 22000, peakRate: 26000, rateStrategy: "standard", status: "available" });
  };

  const handleDeleteRoom = (roomId, roomNumber) => {
    if (!isGeneralManager) {
      alert("Access Denied: Only General Manager can delete rooms.");
      return;
    }
    if (window.confirm(`Delete Room #${roomNumber}?`)) {
      remove(ref(rtdb, `rooms/${roomId}`));
    }
  };

  const filteredStaff = staff.filter((s) => {
    const q = staffSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const totalPayrollGross = staff.reduce((acc, s) => acc + calculateStaffGross(s), 0);
  const totalPayrollNet = staff.reduce((acc, s) => acc + Math.max(0, calculateStaffGross(s) - calculateStaffDeductions(s)), 0);
  const totalServiceCharges = staff.reduce((acc, s) => acc + (Number(s.serviceCharge) || 0), 0);

  // Monitor Reports Array
  const allArchivedReports = Object.keys(allAttendanceRecords).flatMap((dateKey) => {
    const dayRecords = allAttendanceRecords[dateKey] || {};
    return Object.keys(dayRecords).map((shiftKey) => {
      const rec = dayRecords[shiftKey];
      return {
        id: shiftKey,
        date: dateKey,
        staffId: rec.staffId,
        name: rec.name || "Staff",
        role: rec.role || "Staff",
        clockIn: rec.clockIn || "--:--",
        clockOut: rec.clockOut || "--:--",
        timestampIn: rec.timestampIn,
        timestampOut: rec.timestampOut,
        hoursLogged: rec.hoursLogged || calculateDurationFromMs(rec.timestampIn, rec.timestampOut),
        isOnDuty: Boolean(rec.isOnDuty)
      };
    });
  }).sort((a, b) => (b.timestampIn || 0) - (a.timestampIn || 0));

  const filteredArchivedReports = allArchivedReports.filter((item) => {
    const matchesStaff = attendanceStaffFilter === "all" || item.staffId === attendanceStaffFilter;
    const matchesDate = filterAllDates || (!selectedDate || item.date === selectedDate);
    return matchesStaff && matchesDate;
  });

  const allSalesList = Object.values(salesRecords).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const filteredSalesList = allSalesList.filter((sale) => {
    const saleDate = sale.date || "";
    const matchesDateRange = (!reportDateFrom || saleDate >= reportDateFrom) && (!reportDateTo || saleDate <= reportDateTo);
    const matchesTender = reportPaymentMethodFilter === "all" || sale.settlementMethod === reportPaymentMethodFilter;
    return matchesDateRange && matchesTender;
  });

  const allPrebookingsList = Object.values(prebookings).sort((a, b) => (a.checkInDate || "").localeCompare(b.checkInDate || ""));
  const filteredPrebookingsList = allPrebookingsList.filter((booking) => {
    const bDate = booking.checkInDate || "";
    const matchesDateRange = (!reportDateFrom || bDate >= reportDateFrom) && (!reportDateTo || bDate <= reportDateTo);
    const matchesStatus = reportBookingStatusFilter === "all" || booking.status === reportBookingStatusFilter;
    return matchesDateRange && matchesStatus;
  });

  const totalSalesRevenue = filteredSalesList.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
  const totalMinibarRevenue = filteredSalesList.reduce((acc, s) => {
    const items = s.orderItems || [];
    const minibarAmt = items.filter(i => i.description?.toLowerCase().includes("minibar")).reduce((mAcc, i) => mAcc + Number(i.total || 0), 0);
    return acc + minibarAmt;
  }, 0);
  const totalRoomStaysRevenue = Math.max(0, totalSalesRevenue - totalMinibarRevenue);

  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - printTargetTotal);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- PIN TERMINAL LOCK SCREEN ---
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

    const isLockedOut = Date.now() < pinLockoutUntil;

    // Filter quick buttons to NEVER display General Manager or Admin accounts
    const safeOperationalStaff = staff.filter(s => {
      const r = (s.role || "").toLowerCase();
      return !r.includes("admin") && !r.includes("general manager");
    });

    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#040D14] text-white select-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0D9488]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#14B8A6]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0284C7]/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLockedOut ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
              <span className="font-mono tracking-wider text-slate-300">
                {settings.terminalId || "TERMINAL-01"}
              </span>
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isLockedOut ? "text-rose-400 bg-rose-500/10 border-rose-500/30" : "text-[#2DD4BF] bg-[#2DD4BF]/10 border-[#2DD4BF]/20"
            }`}>
              {isLockedOut ? "Lockdown" : "Protected"}
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
            <div className="h-6 flex items-center mt-2 text-center">
              {pinError ? (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {pinError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Enter 4-Digit Security PIN
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
                  disabled={isLockedOut}
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
                    isLockedOut
                      ? "opacity-30 cursor-not-allowed border-white/5 bg-white/[0.02]"
                      : isAction
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

          {/* Quick Operational Staff Login Buttons (General Manager / Admin are hidden) */}
          {safeOperationalStaff && safeOperationalStaff.length > 0 && !isLockedOut && (
            <div className="mt-6 pt-4 border-t border-white/[0.08] w-full">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Operational Staff Quick-Login:
                </span>
                <span className="text-[9px] text-slate-500">Staff Only</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {safeOperationalStaff.slice(0, 4).map((s) => (
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
                      <div className="text-[8px] text-slate-400 font-mono leading-none">
                        {s.role}
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
            { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
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
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              <div className="bg-gradient-to-r from-[#091D26] via-[#0F2D3C] to-[#0A3042] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-[#2DD4BF] uppercase tracking-widest flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5" /> Front Desk Operations
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                      Live Rooms & Dynamic Rates
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Live night rates adjust automatically according to room strategy (Standard, Weekend, Peak, and Auto-Occupancy).
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
                        frontDeskFilter === filter.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {isGeneralManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddRoomModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Room Unit
                  </button>
                )}
              </div>

              {/* Room Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rooms
                  .filter((room) => {
                    if (frontDeskFilter === "all") return true;
                    return room.status === frontDeskFilter;
                  })
                  .map((room) => {
                    const billTotal = calculateTotal(room);
                    const activeDynamicRate = getDynamicRoomRate(room, rooms);
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
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-black text-slate-800">
                              {settings.currency}{Number(activeDynamicRate).toLocaleString()}
                              <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              room.rateStrategy === "peak" ? "bg-rose-100 text-rose-700" :
                              room.rateStrategy === "weekend" ? "bg-amber-100 text-amber-800" :
                              room.rateStrategy === "auto" ? "bg-purple-100 text-purple-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {room.rateStrategy || "standard"}
                            </span>
                          </div>

                          {isOccupied && (
                            <div className="mt-4 p-3.5 bg-gradient-to-br from-[#FAF9F5] to-[#F4EFE6] rounded-2xl border border-[#E6DFD3] space-y-2.5 shadow-inner">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {room.guestPhoto ? (
                                    <div className="relative group/pic">
                                      <img
                                        src={room.guestPhoto}
                                        alt="Guest ID"
                                        onClick={() => setViewPhotoModalData({
                                          title: `Room #${room.number} - ${room.guestName}`,
                                          image: room.guestPhoto,
                                          details: `Checked In: ${room.checkIn} to ${room.checkOut}`
                                        })}
                                        className="w-12 h-12 rounded-2xl object-cover border-2 border-[#14B8A6] shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                        title="Click to view full photo"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#D3C8B7] flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
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

                                {room.guestPhoto && isGeneralManager && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoomPhoto(room.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                    title="Delete stored photo (General Manager)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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

                        <div className="p-4 pt-0">
                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() => {
                                setCheckInModalRoom(room);
                                setGuestPhoto(null);
                                setGuestForm({ name: "", phone: "", nights: 1, customRate: String(activeDynamicRate) });
                              }}
                              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                              <Camera className="w-4 h-4" /> Check In & Photo ID
                            </button>
                          )}

                          {isOccupied && (
                            <div className="space-y-2 pt-2">
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

                          {isMaintenance && isGeneralManager && (
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

          {/* TAB 3: INVENTORY */}
          {activeTab === "inventory" && canAccessTab("inventory") && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Inventory & Minibar Stock</h2>
                  <p className="text-sm text-slate-500">Manage item wholesale cost, retail billable price, and stock levels.</p>
                </div>
                {isGeneralManager && (
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <PackagePlus className="w-4 h-4" /> Add Inventory Item
                  </button>
                )}
              </div>

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
                      {isGeneralManager && <th className="p-3.5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {inventory.map((item) => {
                      const cost = Number(item.cost) || 0;
                      const price = Number(item.price) || 0;
                      const margin = price - cost;

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="p-3.5 font-bold text-[#091D26]">{item.name}</td>
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
                          <td className="p-3.5 text-center font-bold text-sm">{item.stock}</td>
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
                          {isGeneralManager && (
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInventory(item)}
                                  className="p-1.5 text-slate-400 hover:text-[#0D9488] rounded hover:bg-slate-100"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInventoryItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
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

          {/* TAB: REPORTS & ANALYTICS (RESTRICTED TO GENERAL MANAGER) */}
          {activeTab === "reports" && isGeneralManager && (
            <div className="max-w-7xl mx-auto space-y-6 pb-16">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#14B8A6]" /> Hospitality Reports & Analytics
                  </h2>
                  <p className="text-sm text-slate-500">
                    Audit settled sales revenue, guest photo IDs, advance pre-bookings by date, and occupancy.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={handlePrintSalesReport}
                    className="inline-flex items-center gap-2 bg-[#0F2D3C] hover:bg-[#091D26] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2DD4BF]" /> Print Audit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBookingModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    <CalendarCheck className="w-4 h-4" /> + New Pre-Booking
                  </button>
                </div>
              </div>

              {/* Analytical KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Total Settled Sales</p>
                  <p className="text-2xl font-black text-[#0D9488] mt-1">
                    {settings.currency}{Number(totalSalesRevenue).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">{filteredSalesList.length} Invoices Settled</span>
                </div>

                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-indigo-700">Room Stay Billings</p>
                  <p className="text-2xl font-black text-indigo-700 mt-1">
                    {settings.currency}{Number(totalRoomStaysRevenue).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Accommodation Revenue</span>
                </div>

                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-amber-700">Minibar & Sundries</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {settings.currency}{Number(totalMinibarRevenue).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Beverages & Amenities</span>
                </div>

                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-purple-700">Advance Pre-Bookings</p>
                  <p className="text-2xl font-black text-purple-700 mt-1">
                    {filteredPrebookingsList.length} Stays
                  </p>
                  <span className="text-[10px] text-slate-400">Scheduled Guests</span>
                </div>
              </div>

              {/* Navigation Tabs & Date Filter Bar */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                <div className="flex bg-[#F3EFE6] p-1 rounded-2xl border border-[#E6DFD3] overflow-x-auto max-w-full">
                  {[
                    { id: "sales", label: "Sales & Invoices Ledger", icon: DollarSign },
                    { id: "prebookings", label: "Pre-Bookings by Date", icon: CalendarRange },
                    { id: "minibar", label: "Minibar Consumption", icon: ShoppingBag },
                    { id: "occupancy", label: "Occupancy & ADR", icon: Bed },
                  ].map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setReportsSubTab(sub.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                          reportsSubTab === sub.id ? "bg-[#091D26] text-white shadow-sm" : "text-slate-600 hover:text-black"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#2DD4BF]" /> {sub.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto bg-white p-2 rounded-2xl border border-[#E6DFD3] shadow-sm text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" /> Range:
                  </span>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="border border-[#D3C8B7] rounded-lg px-2 py-1 font-mono text-[11px]"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="border border-[#D3C8B7] rounded-lg px-2 py-1 font-mono text-[11px]"
                  />
                  {reportsSubTab === "sales" && (
                    <select
                      value={reportPaymentMethodFilter}
                      onChange={(e) => setReportPaymentMethodFilter(e.target.value)}
                      className="border border-[#D3C8B7] rounded-lg px-2 py-1 text-[11px] font-bold bg-white"
                    >
                      <option value="all">All Tenders</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  )}
                  {reportsSubTab === "prebookings" && (
                    <select
                      value={reportBookingStatusFilter}
                      onChange={(e) => setReportBookingStatusFilter(e.target.value)}
                      className="border border-[#D3C8B7] rounded-lg px-2 py-1 text-[11px] font-bold bg-white"
                    >
                      <option value="all">All Booking Status</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Deposit Paid">Deposit Paid</option>
                      <option value="Checked In">Checked In</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>

              {/* REPORT VIEW 1: SALES & SETTLED INVOICES LEDGER */}
              {reportsSubTab === "sales" && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Settled Sales Transactions</h3>
                      <p className="text-[11px] text-slate-500">Every paid checkout folio is permanently recorded here with attached photo identification</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0D9488]">
                      Total: {settings.currency}{Number(totalSalesRevenue).toLocaleString()}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Date & Time</th>
                          <th className="p-3.5">Folio / Order</th>
                          <th className="p-3.5">Room</th>
                          <th className="p-3.5">Guest Info</th>
                          <th className="p-3.5 text-center">Guest ID Image</th>
                          <th className="p-3.5 text-center">Tender</th>
                          <th className="p-3.5 text-right font-black">Total Paid</th>
                          <th className="p-3.5 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredSalesList.map((sale) => (
                          <tr key={sale.id} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="p-3.5 font-mono text-slate-700">
                              <div>{sale.date}</div>
                              <div className="text-[10px] text-slate-400">{sale.settledAt}</div>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-[#0F766E]">{sale.orderId}</td>
                            <td className="p-3.5 font-bold">Room #{sale.roomNumber}</td>
                            <td className="p-3.5 font-bold text-[#091D26]">
                              {sale.guestName}
                              <div className="text-[10px] text-slate-400 font-normal">{sale.guestPhone || "No contact"}</div>
                            </td>

                            <td className="p-3.5 text-center">
                              {sale.guestPhoto ? (
                                <button
                                  type="button"
                                  onClick={() => setViewPhotoModalData({
                                    title: `Guest ID - ${sale.guestName} (Room #${sale.roomNumber})`,
                                    image: sale.guestPhoto,
                                    details: `Folio: ${sale.orderId} | Settled: ${sale.date} ${sale.settledAt || ""}`
                                  })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] font-bold border border-teal-200 transition-all shadow-xs"
                                >
                                  <img src={sale.guestPhoto} alt="Thumb" className="w-5 h-5 rounded-md object-cover border border-[#0D9488]" />
                                  <span>View Photo</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No Image</span>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {sale.settlementMethod}
                              </span>
                            </td>

                            <td className="p-3.5 text-right font-black text-sm text-[#0D9488]">
                              {settings.currency}{Number(sale.totalAmount || 0).toLocaleString()}
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const dummyRoom = {
                                    number: sale.roomNumber,
                                    orderId: sale.orderId,
                                    guestName: sale.guestName,
                                    orderItems: sale.orderItems
                                  };
                                  const html = buildThermalHtml({
                                    settings,
                                    room: dummyRoom,
                                    isTemporary: false,
                                    settlementMethod: sale.settlementMethod,
                                    total: sale.totalAmount,
                                    cashTendered: sale.cashTendered,
                                    changeDue: sale.changeReturned
                                  });
                                  printIsolatedDocument(html, "thermal");
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#0D9488] rounded hover:bg-slate-100"
                                title="Reprint Thermal Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredSalesList.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No settled sales transactions found for this date range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT VIEW 2: PRE-BOOKINGS */}
              {reportsSubTab === "prebookings" && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Advance Pre-Bookings & Reservations</h3>
                      <p className="text-[11px] text-slate-500">Monitor upcoming guest arrivals, check-in dates, and deposits</p>
                    </div>
                    {isGeneralManager && (
                      <button
                        type="button"
                        onClick={() => setShowAddBookingModal(true)}
                        className="px-3.5 py-1.5 bg-[#14B8A6] text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        + Add Booking
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Booking ID</th>
                          <th className="p-3.5">Check-In Date</th>
                          <th className="p-3.5">Check-Out Date</th>
                          <th className="p-3.5">Room</th>
                          <th className="p-3.5">Guest Contact</th>
                          <th className="p-3.5 text-right">Deposit</th>
                          <th className="p-3.5 text-right font-black">Est. Total</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredPrebookingsList.map((b) => (
                          <tr key={b.id} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-slate-700">{b.id}</td>
                            <td className="p-3.5 font-mono font-bold text-indigo-700">{b.checkInDate}</td>
                            <td className="p-3.5 font-mono text-slate-600">{b.checkOutDate}</td>
                            <td className="p-3.5 font-bold">Room #{b.roomNumber}</td>
                            <td className="p-3.5 font-bold text-[#091D26]">
                              {b.guestName}
                              <div className="text-[10px] text-slate-400 font-normal">{b.guestPhone}</div>
                            </td>
                            <td className="p-3.5 text-right font-mono text-emerald-600">
                              {settings.currency}{Number(b.depositAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-800">
                              {settings.currency}{Number(b.totalRate || 0).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                b.status === "Checked In" ? "bg-emerald-100 text-emerald-800" :
                                b.status === "Deposit Paid" ? "bg-blue-100 text-blue-800" :
                                "bg-amber-100 text-amber-800"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {b.status !== "Checked In" && (
                                  <button
                                    type="button"
                                    onClick={() => handleConvertPrebookingToCheckIn(b)}
                                    className="px-2.5 py-1 bg-[#0D9488] text-white rounded-lg text-[10px] font-bold"
                                    title="Check In this reservation now"
                                  >
                                    Check In Now
                                  </button>
                                )}
                                {isGeneralManager && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePrebooking(b.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredPrebookingsList.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              No advance reservations found for the selected dates.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT VIEW 3: MINIBAR */}
              {reportsSubTab === "minibar" && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Minibar & Sundries Inventory Consumption</h3>
                      <p className="text-[11px] text-slate-500">Overview of inventory unit sales, turnover and margins</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      Revenue: {settings.currency}{Number(totalMinibarRevenue).toLocaleString()}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="p-3.5">Product Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5 text-right">Cost</th>
                        <th className="p-3.5 text-right">Selling Price</th>
                        <th className="p-3.5 text-center">Remaining Stock</th>
                        <th className="p-3.5 text-right">Margin / Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EFE6]">
                      {inventory.map((item) => {
                        const margin = Number(item.price || 0) - Number(item.cost || 0);
                        return (
                          <tr key={item.id} className="hover:bg-[#FAF9F5]">
                            <td className="p-3.5 font-bold text-[#091D26]">{item.name}</td>
                            <td className="p-3.5 uppercase text-[10px] font-bold text-slate-500">{item.category}</td>
                            <td className="p-3.5 text-right text-slate-500">{settings.currency}{Number(item.cost || 0).toFixed(2)}</td>
                            <td className="p-3.5 text-right font-bold">{settings.currency}{Number(item.price || 0).toFixed(2)}</td>
                            <td className="p-3.5 text-center font-bold">{item.stock} Units</td>
                            <td className="p-3.5 text-right font-black text-emerald-600">{settings.currency}{margin.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT VIEW 4: OCCUPANCY */}
              {reportsSubTab === "occupancy" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white rounded-3xl border border-[#E6DFD3] p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-[#091D26]">Room Capacity & Utilization</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Total Rooms:</span>
                        <b>{rooms.length} Units</b>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Occupied Tonight:</span>
                        <b className="text-emerald-700">{rooms.filter(r => r.status === "occupied").length} Rooms</b>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Current Occupancy Rate:</span>
                        <b className="text-[#0D9488]">
                          {rooms.length > 0 ? ((rooms.filter(r => r.status === "occupied").length / rooms.length) * 100).toFixed(1) : 0}%
                        </b>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E6DFD3] p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-[#091D26]">Average Daily Rate (ADR)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Active Room Revenue:</span>
                        <b>{settings.currency}{Number(totalRoomStaysRevenue).toLocaleString()}</b>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Average Daily Night Rate:</span>
                        <b className="text-indigo-700">
                          {settings.currency}
                          {rooms.length > 0 ? Math.round(rooms.reduce((acc, r) => acc + (Number(r.rate) || 0), 0) / rooms.length).toLocaleString() : 0}
                        </b>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E6DFD3] p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-[#091D26]">Turnaround & Housekeeping</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Cleaning Turnover:</span>
                        <b className="text-amber-700">{rooms.filter(r => r.status === "cleaning").length} Rooms</b>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Maintenance Lock:</span>
                        <b className="text-rose-700">{rooms.filter(r => r.status === "maintenance").length} Rooms</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ROOM ADMIN (RESTRICTED TO GENERAL MANAGER) */}
          {activeTab === "room-admin" && isGeneralManager && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-[#14B8A6]" /> Dynamic Room Rates & Catalog
                  </h2>
                  <p className="text-sm text-slate-500">
                    Configure Base Weekday, Weekend, and Peak Season pricing tiers for intelligent revenue management.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(true)}
                  className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Room Unit
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Room #</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Base Rate</th>
                      <th className="p-3.5 text-right">Weekend Rate</th>
                      <th className="p-3.5 text-right">Peak Rate</th>
                      <th className="p-3.5 text-center">Active Strategy</th>
                      <th className="p-3.5 text-center">Current Live Rate</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {rooms.map((room) => {
                      const currentLiveRate = getDynamicRoomRate(room, rooms);

                      return (
                        <tr key={room.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="p-3.5 font-black text-base text-[#091D26]">#{room.number}</td>
                          <td className="p-3.5 font-medium text-slate-700">{room.type}</td>
                          <td className="p-3.5 text-right font-medium text-slate-600">
                            {settings.currency}{Number(room.rate).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-medium text-amber-700">
                            {settings.currency}{Number(room.weekendRate || Math.round(room.rate * 1.2)).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-medium text-rose-700">
                            {settings.currency}{Number(room.peakRate || Math.round(room.rate * 1.4)).toLocaleString()}
                          </td>

                          <td className="p-3.5 text-center">
                            <select
                              value={room.rateStrategy || "standard"}
                              onChange={(e) => handleQuickToggleStrategy(room, e.target.value)}
                              className="border border-[#D3C8B7] rounded-lg px-2 py-1 text-xs bg-white font-bold"
                            >
                              <option value="standard">Standard (Base)</option>
                              <option value="weekend">Weekend (+20%)</option>
                              <option value="peak">Peak Season (+40%)</option>
                              <option value="auto">Auto Occupancy Surge</option>
                            </select>
                          </td>

                          <td className="p-3.5 text-center font-black text-sm text-[#0D9488]">
                            {settings.currency}{Number(currentLiveRate).toLocaleString()}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditDynamicRoom(room)}
                                className="p-1.5 text-slate-400 hover:text-[#0D9488] rounded hover:bg-slate-100"
                                title="Edit Rates"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room.id, room.number)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Delete Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF & ATTENDANCE & MULTI-SHIFT RECORD MONITOR */}
          {activeTab === "staff" && canAccessTab("staff") && (
            <div className="max-w-7xl mx-auto space-y-6 pb-16">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#14B8A6]" /> Staff, Attendance & Shift Record Monitor
                  </h2>
                  <p className="text-sm text-slate-500">
                    Daily in/out shift records saved permanently every day, report monitoring, and official A4 payslips.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={handlePrintDailyAttendanceReport}
                    className="inline-flex items-center gap-2 bg-[#0F2D3C] hover:bg-[#091D26] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2DD4BF]" /> Print Audit Report
                  </button>
                  {isGeneralManager && (
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(true)}
                      className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /> Add Employee
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Total Staff Headcount</p>
                  <p className="text-2xl font-black text-[#091D26] mt-1">{staff.length} Personnel</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-[#0D9488]">Currently On Duty</p>
                  <p className="text-2xl font-black text-[#0D9488] mt-1">
                    {staff.filter(s => s.isOnDuty).length} Active
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-amber-700">Total Net Payroll</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {settings.currency}{totalPayrollNet.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-3xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-purple-700">Total Shift Logs Archived</p>
                  <p className="text-2xl font-black text-purple-700 mt-1">
                    {allArchivedReports.length} Shifts
                  </p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex bg-[#F3EFE6] p-1 rounded-2xl border border-[#E6DFD3] overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStaffViewSubTab("attendance")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                      staffViewSubTab === "attendance" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" /> Live Daily In/Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffViewSubTab("report")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                      staffViewSubTab === "report" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#2DD4BF]" /> Shift Records & Monitor Report
                  </button>
                  {isGeneralManager && (
                    <button
                      type="button"
                      onClick={() => setStaffViewSubTab("roster")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                        staffViewSubTab === "roster" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-[#2DD4BF]" /> Payroll & Payslips
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterAllDates(!filterAllDates)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      filterAllDates
                        ? "bg-[#091D26] text-white border-[#091D26]"
                        : "bg-white text-slate-700 border-[#D3C8B7] hover:bg-slate-50"
                    }`}
                  >
                    {filterAllDates ? "Showing All Dates" : "Show All Dates"}
                  </button>
                  {!filterAllDates && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-[#D3C8B7] rounded-xl px-2.5 py-1.5 text-xs bg-white font-mono"
                    />
                  )}
                </div>
              </div>

              {/* VIEW 1: LIVE DAILY IN/OUT CLOCK */}
              {staffViewSubTab === "attendance" && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Live Shift Terminal ({getTodayKey()})</h3>
                      <p className="text-[11px] text-slate-500">Every single shift punch is automatically saved and archived to daily records</p>
                    </div>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFE6] uppercase font-semibold text-slate-500 border-b border-[#E6DFD3]">
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
                      {filteredStaff.map((m) => {
                        const isClockedIn = m.isOnDuty;

                        return (
                          <tr key={m.id} className="hover:bg-[#FAF9F5]">
                            <td className="p-3.5 font-bold">{m.name}</td>
                            <td className="p-3.5">{m.role}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">{m.clockIn || "--:--"}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">{m.clockOut || "--:--"}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                isClockedIn ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                              }`}>
                                {isClockedIn ? "On Duty" : m.clockOut ? "Completed" : "Off Duty"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              {!isClockedIn ? (
                                <button
                                  type="button"
                                  onClick={() => handleClockIn(m)}
                                  className="px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold shadow-sm"
                                >
                                  Clock In
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleClockOut(m)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
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

              {/* VIEW 2: DEDICATED ATTENDANCE RECORD MONITORING REPORT */}
              {staffViewSubTab === "report" && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] overflow-hidden shadow-sm space-y-4">
                  <div className="p-4 border-b border-[#F3EFE6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Attendance & Shift Audit Monitor</h3>
                      <p className="text-[11px] text-slate-500">
                        {filterAllDates ? "Showing all historical shift sessions across all dates" : `Showing shift sessions for ${selectedDate}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={attendanceStaffFilter}
                        onChange={(e) => setAttendanceStaffFilter(e.target.value)}
                        className="border border-[#D3C8B7] rounded-xl px-2.5 py-1.5 text-xs bg-white font-bold"
                      >
                        <option value="all">All Personnel</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Employee Name</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5 text-center">Clock-In</th>
                          <th className="p-3.5 text-center">Clock-Out</th>
                          <th className="p-3.5 text-center">Shift Hours</th>
                          <th className="p-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredArchivedReports.map((item) => (
                          <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-slate-700">{item.date}</td>
                            <td className="p-3.5 font-bold text-[#091D26]">{item.name}</td>
                            <td className="p-3.5 text-slate-600">{item.role}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">{item.clockIn}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">{item.clockOut}</td>
                            <td className="p-3.5 text-center font-bold text-[#0F766E]">{item.hoursLogged}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                item.isOnDuty ? "bg-emerald-100 text-emerald-800" : item.clockOut !== "--:--" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                              }`}>
                                {item.isOnDuty ? "On Duty" : item.clockOut !== "--:--" ? "Completed" : "Active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredArchivedReports.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No shift attendance records found for the selected criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: COMPREHENSIVE PAYROLL MANAGEMENT & PAYSLIPS (GENERAL MANAGER ONLY) */}
              {staffViewSubTab === "roster" && isGeneralManager && (
                <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Monthly Staff Payroll & Statutory Records</h3>
                      <p className="text-[11px] text-slate-500">Gross Remuneration, EPF Deductions, Taxes, and Net Payable</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Disburse and mark all staff as paid for this cycle?")) {
                          staff.forEach((s) => update(ref(rtdb, `staff/${s.id}`), { paid: true }));
                        }
                      }}
                      className="px-3.5 py-1.5 bg-[#0D9488] text-white rounded-xl text-xs font-bold hover:bg-[#0F766E]"
                    >
                      Disburse All Pending
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Staff & Details</th>
                          <th className="p-3.5 text-right">Basic Pay</th>
                          <th className="p-3.5 text-right">Allowances</th>
                          <th className="p-3.5 text-right">Service Pool</th>
                          <th className="p-3.5 text-right">Gross Total</th>
                          <th className="p-3.5 text-right text-rose-700">Deductions (EPF/Tax)</th>
                          <th className="p-3.5 text-right text-emerald-700">Net Take-Home</th>
                          <th className="p-3.5 text-center">Payout</th>
                          <th className="p-3.5 text-center">Payslip</th>
                          {isGeneralManager && <th className="p-3.5 text-center">Modify</th>}
                          {isGeneralManager && <th className="p-3.5 text-center">Delete</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredStaff.map((member) => {
                          const gross = calculateStaffGross(member);
                          const deductions = calculateStaffDeductions(member);
                          const netPay = Math.max(0, gross - deductions);

                          return (
                            <tr key={member.id} className="hover:bg-[#FAF9F5] transition-colors">
                              <td className="p-3.5 font-bold text-[#091D26]">
                                <div>{member.name}</div>
                                <div className="text-[10px] text-[#0F766E] font-medium">{member.role} ({member.type})</div>
                                <div className="text-[9px] text-slate-400 font-mono">PIN: ••••</div>
                              </td>

                              <td className="p-3.5 text-right font-medium">
                                {settings.currency}{Number(member.baseSalary || 0).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-medium">
                                {settings.currency}{Number(member.allowances || 0).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-medium">
                                {settings.currency}{Number(member.serviceCharge || 0).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-bold text-[#091D26]">
                                {settings.currency}{gross.toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-semibold text-rose-600">
                                -{settings.currency}{deductions.toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-black text-sm text-[#0D9488]">
                                {settings.currency}{netPay.toLocaleString()}
                              </td>

                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPayout(member.id, member.paid)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    member.paid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {member.paid ? "Paid" : "Pending"}
                                </button>
                              </td>

                              {/* RESTORED: One-Click Working Payslip Print Button */}
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPayslip(member)}
                                  className="px-2.5 py-1 bg-[#0F2D3C] hover:bg-[#091D26] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                                  title="Print Official A4 Payslip"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#2DD4BF]" /> Slip
                                </button>
                              </td>

                              {isGeneralManager && (
                                <td className="p-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditStaff(member)}
                                    className="p-1.5 text-slate-400 hover:text-[#0D9488] rounded hover:bg-slate-100"
                                    title="Edit & Modify Remuneration"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}

                              {isGeneralManager && (
                                <td className="p-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStaff(member)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                    title="Permanently Delete Staff Member"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
            </div>
          )}

          {/* TAB 6: SETTINGS (STRICTLY GENERAL MANAGER / ADMIN) */}
          {activeTab === "settings" && isGeneralManager && (
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

              {/* CARD 1: COMPANY & BUSINESS INFORMATION */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#14B8A6]" /> COMPANY & BUSINESS INFORMATION
                  </h3>
                  <p className="text-[11px] text-slate-400">Printed on official receipts, tax invoices, and IT reports</p>
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
                    <label className="block font-semibold mb-1 text-slate-700">Business Registration No. (BRN / Company ID)</label>
                    <input
                      type="text"
                      value={settingsForm.companyRegNo}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyRegNo: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Tax Identification / VAT / GST No.</label>
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
                    <label className="block font-semibold mb-1 text-slate-700">Official Website or Social Link</label>
                    <input
                      type="text"
                      value={settingsForm.website}
                      onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
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

              {/* CARD 2: AUTOMATED DAILY 11:30 PM EMAIL DISPATCH */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#14B8A6]" /> AUTOMATED DAILY 11:30 PM EMAIL DISPATCH
                    </h3>
                    <p className="text-[11px] text-slate-400">Auto-dispatches complete end-of-day sales, collections, balances, and shift worksheets</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 border px-1.5 py-0.5 rounded">EOD Auto-task</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Target Recipient Email</label>
                    <input
                      type="email"
                      value={settingsForm.emailRecipient}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailRecipient: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Scheduled Time (24h)</label>
                    <input
                      type="text"
                      value={settingsForm.emailScheduleTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailScheduleTime: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Automation Status</label>
                    <select
                      value={settingsForm.emailStatus}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailStatus: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Disabled (Manual trigger only)">Disabled (Manual trigger only)</option>
                      <option value="Enabled (Daily Auto Send)">Enabled (Daily Auto Send)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E6DFD3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[11px] text-slate-500">
                    <b>What data is transmitted in the 11:30 PM package?</b><br />
                    Gross revenue, net sales, taxes, service pool, room occupancy, minibar orders, cashier balance, and shift audits.
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Email report package dispatched to ${settingsForm.emailRecipient}`)}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm"
                  >
                    Send Daily Report Now
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedEmail(!showAdvancedEmail)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-black"
                  >
                    {showAdvancedEmail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Advanced: Direct Silent Webhook or EmailJS API Keys (Optional)
                  </button>
                  {showAdvancedEmail && (
                    <div className="mt-2 p-3 bg-slate-50 border rounded-xl space-y-2 text-xs">
                      <label className="block font-semibold">Custom Webhook / Relay URL</label>
                      <input
                        type="url"
                        placeholder="https://api.resort-os.com/v1/webhook"
                        value={settingsForm.webhookUrl || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, webhookUrl: e.target.value })}
                        className="w-full border rounded-lg p-2 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: THERMAL AUTO-PRINTER CONFIGURATION */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                      <Printer className="w-4 h-4 text-[#14B8A6]" /> THERMAL AUTO-PRINTER CONFIGURATION
                    </h3>
                    <p className="text-[11px] text-slate-400">Hardwired direct slip generation for USB, LAN, or Bluetooth portable printers</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 border px-1.5 py-0.5 rounded">System Default Spooler</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Paper Roll Width</label>
                    <select
                      value={settingsForm.paperRollWidth}
                      onChange={(e) => setSettingsForm({ ...settingsForm, paperRollWidth: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="80mm Thermal Paper (Standard POS)">80mm Thermal Paper (Standard POS)</option>
                      <option value="58mm Thermal Paper (Compact / Mobile)">58mm Thermal Paper (Compact / Mobile)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Receipt Font Size</label>
                    <select
                      value={settingsForm.receiptFontSize}
                      onChange={(e) => setSettingsForm({ ...settingsForm, receiptFontSize: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="14px - Extra Bold & Large">14px - Extra Bold & Large</option>
                      <option value="12px - Standard POS">12px - Standard POS</option>
                      <option value="10px - Compact Condense">10px - Compact Condense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Receipt Font Type</label>
                    <select
                      value={settingsForm.receiptFontType}
                      onChange={(e) => setSettingsForm({ ...settingsForm, receiptFontType: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Monospace (Classic ESC/POS Receipt)">Monospace (Classic ESC/POS Receipt)</option>
                      <option value="Modern Sans-Serif">Modern Sans-Serif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Slip Margins</label>
                    <select
                      value={settingsForm.slipMargins}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slipMargins: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="2mm - Standard Thermal Margin">2mm - Standard Thermal Margin</option>
                      <option value="0mm - Full Bleed Edge">0mm - Full Bleed Edge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto-Print on Saved Order</label>
                    <select
                      value={settingsForm.autoPrintKOT}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoPrintKOT: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Yes - Print KOT & BOT Slips">Yes - Print KOT & BOT Slips</option>
                      <option value="No - Manual Only">No - Manual Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto-Print on Settlement</label>
                    <select
                      value={settingsForm.autoPrintSettlement}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoPrintSettlement: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Yes - Print Final Tax Invoice">Yes - Print Final Tax Invoice</option>
                      <option value="No - Screen Only">No - Screen Only</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E6DFD3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[11px] text-slate-500">
                    <b>Direct WebUSB Thermal Printer Connection</b><br />
                    Pair once with your POS printer for fast raw print output or print via OS print spooler.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => alert("Searching for connected WebUSB thermal printers...")}
                      className="px-3.5 py-2 bg-[#091D26] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Usb className="w-3.5 h-3.5" /> Pair USB Printer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const dummyRoom = { number: "TEST", orderId: "TEST-01", orderItems: [{ description: "Thermal Test Receipt", quantity: 1, total: 0 }] };
                        const html = buildThermalHtml({ settings: settingsForm, room: dummyRoom, isTemporary: true, settlementMethod: "TEST", total: 0 });
                        printIsolatedDocument(html, "thermal");
                      }}
                      className="px-3.5 py-2 border border-[#D3C8B7] rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Test Slip
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 4: AUTOMATED CASH DRAWER SOLENOID */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#14B8A6]" /> AUTOMATED CASH DRAWER SOLENOID
                  </h3>
                  <p className="text-[11px] text-slate-400">Triggers electrical RJ11/RJ12 drawer pulse via printer kick ports</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Auto Drawer Kick</label>
                    <select
                      value={settingsForm.autoDrawerKick}
                      onChange={(e) => setSettingsForm({ ...settingsForm, autoDrawerKick: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Enabled (Auto-Pop on Payment)">Enabled (Auto-Pop on Payment)</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Drawer Kick Trigger</label>
                    <select
                      value={settingsForm.drawerKickTrigger}
                      onChange={(e) => setSettingsForm({ ...settingsForm, drawerKickTrigger: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Cash Payments Only">Cash Payments Only</option>
                      <option value="All Settlement Tenders">All Settlement Tenders</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">RJ11 / RJ12 Pinout</label>
                    <select
                      value={settingsForm.drawerPinout}
                      onChange={(e) => setSettingsForm({ ...settingsForm, drawerPinout: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white font-medium"
                    >
                      <option value="Pin 2 / ESC p 0 (Epson, Rongta, Xprint)">Pin 2 / ESC p 0 (Epson, Rongta, Xprint)</option>
                      <option value="Pin 5 / ESC p 1 (Star Micronics)">Pin 5 / ESC p 1 (Star Micronics)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, drawerChime: !settingsForm.drawerChime })}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <span className={`px-2 py-1 rounded font-bold text-xs ${settingsForm.drawerChime ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {settingsForm.drawerChime ? "Chime ON" : "Muted"}
                    </span>
                    {settingsForm.drawerChime ? <Volume2 className="w-4 h-4 text-[#14B8A6]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span className="text-[11px] text-slate-500">Plays brass bell chime upon successful payment settlement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Solenoid pulse sent! Cash drawer kicked open.")}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Pop Drawer
                  </button>
                </div>
              </div>

              {/* CARD 5: CURRENCY, TAXES & SURCHARGE RATES */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#14B8A6]" /> CURRENCY, TAXES & SURCHARGE RATES
                  </h3>
                  <p className="text-[11px] text-slate-400">Default rates applied across folios and receipts</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Currency Symbol / Code</label>
                    <input
                      type="text"
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Default Service Charge (%)</label>
                    <input
                      type="number"
                      value={settingsForm.serviceChargeRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Sales Tax / VAT Rate (%)</label>
                    <input
                      type="number"
                      value={settingsForm.vatRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Receipt Header Notes</label>
                    <textarea
                      rows={2}
                      value={settingsForm.headerNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, headerNote: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700">Thermal Receipt Footer Message</label>
                    <textarea
                      rows={2}
                      value={settingsForm.footerNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, footerNote: e.target.value })}
                      className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 6: SYSTEM DATABASE BACKUP & DISASTER RECOVERY */}
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-[#091D26] uppercase tracking-wide flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#14B8A6]" /> SYSTEM DATABASE BACKUP & DISASTER RECOVERY
                  </h3>
                  <p className="text-[11px] text-slate-400">Export or restore full state database (folios, staff, inventory, and shift logs)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#FAF9F5] border border-[#E6DFD3] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold block mb-1">Export JSON Database Backup</span>
                      <p className="text-slate-500">Download a complete snapshot of all dishes, ingredients, staff credentials, and sales records.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="w-full py-2.5 bg-[#091D26] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Download System Backup (json)
                    </button>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-[#E6DFD3] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold block mb-1">Restore System from Backup File</span>
                      <p className="text-slate-500">Upload a previously exported '.json' file to restore settings, inventory levels, menus, and transaction history.</p>
                    </div>
                    <label className="w-full py-2.5 border border-[#D3C8B7] bg-white hover:bg-slate-50 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-slate-500" /> Select Backup File (json)
                      <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 7: ADMINISTRATOR DATA PURGE */}
              <div className="bg-red-50/60 rounded-2xl border border-red-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-red-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> ADMINISTRATOR DATA PURGE (RESET TEST DATA)
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Clear test transactions, reset all tables to VACANT, and start with a clean ledger without overriding the cash float.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeTestData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm"
                >
                  Purge Test Records
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: IMAGE VIEWER / LIGHTBOX */}
      {viewPhotoModalData && (
        <div className="fixed inset-0 bg-[#06151E]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3] space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F766E]">Archived Photo Verification</span>
                <h3 className="font-bold text-base text-[#091D26]">{viewPhotoModalData.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotoModalData(null)}
                className="text-slate-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#D3C8B7] bg-black flex items-center justify-center aspect-video">
              <img
                src={viewPhotoModalData.image}
                alt="Document Preview"
                className="max-h-[380px] w-full object-contain"
              />
            </div>

            <div className="p-3 bg-[#FAF9F5] rounded-xl border text-xs text-slate-600 flex justify-between items-center">
              <span>{viewPhotoModalData.details}</span>
              <a
                href={viewPhotoModalData.image}
                download="Guest_ID_Archive.jpg"
                className="px-3 py-1.5 bg-[#0D9488] text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PRE-BOOKING RESERVATION */}
      {showAddBookingModal && (
        <div className="fixed inset-0 bg-[#06151E]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3] my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Advance Booking Manifest</span>
                <h3 className="font-bold text-lg">Create Pre-Booking Reservation</h3>
              </div>
              <button type="button" onClick={() => setShowAddBookingModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrebooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Vance"
                    value={newBookingForm.guestName}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, guestName: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 ..."
                    value={newBookingForm.guestPhone}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, guestPhone: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Room #</label>
                  <select
                    required
                    value={newBookingForm.roomNumber}
                    onChange={(e) => {
                      const selRoom = rooms.find(r => String(r.number) === e.target.value);
                      setNewBookingForm({
                        ...newBookingForm,
                        roomNumber: e.target.value,
                        totalRate: selRoom ? String(selRoom.rate) : newBookingForm.totalRate
                      });
                    }}
                    className="w-full border rounded-xl p-2 bg-white font-bold"
                  >
                    <option value="">Select Room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.number}>#{r.number} ({r.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.checkInDate}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, checkInDate: e.target.value })}
                    className="w-full border rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.checkOutDate}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, checkOutDate: e.target.value })}
                    className="w-full border rounded-xl p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Estimated Rate ({settings.currency})</label>
                  <input
                    type="number"
                    required
                    value={newBookingForm.totalRate}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, totalRate: e.target.value })}
                    className="w-full border rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Deposit Paid ({settings.currency})</label>
                  <input
                    type="number"
                    value={newBookingForm.depositAmount}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, depositAmount: e.target.value })}
                    className="w-full border rounded-xl p-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Booking Status</label>
                  <select
                    value={newBookingForm.status}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, status: e.target.value })}
                    className="w-full border rounded-xl p-2 bg-white font-bold"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Deposit Paid">Deposit Paid</option>
                    <option value="Tentative">Tentative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Special Requests / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Airport pickup required, late arrival around 9 PM"
                  value={newBookingForm.notes}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, notes: e.target.value })}
                  className="w-full border rounded-xl p-2.5"
                />
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-xl shadow">
                Save Advance Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-IN WITH CAMERA */}
      {checkInModalRoom && (
        <div className="fixed inset-0 bg-[#06151E]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3] my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Guest Registration & Check-In</span>
                <h3 className="font-bold text-lg">Room #{checkInModalRoom.number} ({checkInModalRoom.type})</h3>
              </div>
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
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
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
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E6DFD3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] text-slate-700">Nightly Rate Applied:</span>
                  <span className="text-[10px] font-bold uppercase text-[#0F766E] bg-[#CCFBF1] px-2 py-0.5 rounded">
                    Tier: {checkInModalRoom.rateStrategy || "Standard"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{settings.currency}</span>
                  <input
                    type="number"
                    required
                    value={guestForm.customRate}
                    onChange={(e) => setGuestForm({ ...guestForm, customRate: e.target.value })}
                    className="w-full border rounded-lg p-2 font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-xl shadow">
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

      {/* MODAL: EDIT STAFF MEMBER */}
      {editingStaffMember && isGeneralManager && (
        <div className="fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border my-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F766E]">Employment & Remuneration Setup</span>
                <h3 className="font-bold text-lg text-[#091D26]">Edit Profile: {editingStaffMember.name}</h3>
              </div>
              <button type="button" onClick={() => setEditingStaffMember(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={editStaffForm.name}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role / Designation</label>
                  <select
                    value={editStaffForm.role}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                  >
                    <option value="General Manager">General Manager</option>
                    <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                    <option value="Front Desk Agent">Front Desk Agent</option>
                    <option value="Housekeeping Lead">Housekeeping Lead</option>
                    <option value="Housekeeping Staff">Housekeeping Staff</option>
                    <option value="Maintenance Technician">Maintenance Technician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employment Type</label>
                  <select
                    value={editStaffForm.type}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, type: e.target.value })}
                    className="w-full border rounded-xl p-2.5 bg-white font-semibold"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern / Trainee">Intern / Trainee</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editStaffForm.phone}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                    placeholder="+94 77 ..."
                    className="w-full border rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border space-y-2">
                <span className="font-bold text-[11px] uppercase text-[#0D9488] block">Gross Earnings ({settings.currency})</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Basic Salary</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.baseSalary}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, baseSalary: e.target.value })}
                      className="w-full border rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Allowances</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.allowances}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, allowances: e.target.value })}
                      className="w-full border rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Service Pool</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.serviceCharge}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, serviceCharge: e.target.value })}
                      className="w-full border rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Bonus</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.bonus}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, bonus: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Overtime Pay</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.overtimePay}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, overtimePay: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Terminal PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editStaffForm.pin}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, pin: e.target.value })}
                      className="w-full border rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200 space-y-2">
                <span className="font-bold text-[11px] uppercase text-rose-700 block">Deductions & Taxes ({settings.currency})</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">EPF (Employee 8%)</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.epfDeduction}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, epfDeduction: e.target.value })}
                      className="w-full border border-rose-200 rounded-lg p-2 font-bold text-rose-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Tax / PAYE</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.taxDeduction}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, taxDeduction: e.target.value })}
                      className="w-full border border-rose-200 rounded-lg p-2 font-bold text-rose-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1">Advance / Loans</label>
                    <input
                      type="number"
                      step="any"
                      value={editStaffForm.advanceDeduction}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, advanceDeduction: e.target.value })}
                      className="w-full border border-rose-200 rounded-lg p-2 font-bold text-rose-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Bank Account / Transfer Details</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Bank - 8009234123"
                  value={editStaffForm.bankAccount}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, bankAccount: e.target.value })}
                  className="w-full border rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaffMember(null)}
                  className="flex-1 bg-slate-100 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white py-3 rounded-xl font-bold"
                >
                  Save Remuneration Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && isGeneralManager && (
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
                  <option value="Housekeeping Staff">Housekeeping Staff</option>
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
                <select
                  value={newStaffForm.type}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, type: e.target.value })}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern / Trainee">Intern / Trainee</option>
                </select>
                <input
                  type="tel"
                  placeholder="Contact Phone Number"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
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
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Service Charge Pool Share"
                  value={newStaffForm.serviceCharge}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, serviceCharge: e.target.value })}
                  className="w-full border rounded p-2"
                />
                <input
                  type="number"
                  placeholder="Performance Bonus"
                  value={newStaffForm.bonus}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, bonus: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Bank Account Details (Bank Name & Account No.)"
                  value={newStaffForm.bankAccount}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, bankAccount: e.target.value })}
                  className="w-full border rounded p-2 font-mono"
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