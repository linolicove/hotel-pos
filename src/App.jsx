// src/App.jsx
import React, { useState, useEffect } from "react";
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
  Briefcase,
  DollarSign,
  Calendar,
  LogIn,
  LogOut,
  FileSpreadsheet
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
    role: "Manager", 
    pin: "1001", 
    type: "Full-Time", 
    hourlyRate: 35, 
    hoursWorked: 40, 
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
    hourlyRate: 22, 
    hoursWorked: 38, 
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
    type: "Part-Time", 
    hourlyRate: 20, 
    hoursWorked: 25, 
    paid: false, 
    phone: "+1 808-555-0145",
    clockIn: "09:00 AM",
    clockOut: "",
    isOnDuty: true
  },
  { 
    id: "s4", 
    name: "Akamu Flores", 
    role: "Maintenance", 
    pin: "4088", 
    type: "Casual", 
    hourlyRate: 24, 
    hoursWorked: 16, 
    paid: true, 
    phone: "+1 808-555-0189",
    clockIn: "",
    clockOut: "",
    isOnDuty: false
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
        font-family: ${mode === "thermal" ? "'Courier New', Courier, monospace" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
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

// Built-in Thermal 80mm Letterhead & Receipt Generator
function buildThermalHtml({ settings, room, isTemporary, settlementMethod, total }) {
  const items = room?.orderItems || [];
  return `
    <div class="thermal-container">
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px;">
        <div style="font-size: 11px;">* * * * * * * * * * * * * * * * *</div>
        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase; margin: 4px 0 2px 0;">
          ${settings.hotelName}
        </div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
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
        <div>TYPE: ${room?.type || "Standard"}</div>
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

      <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 13px; font-weight: bold;">
        <div style="display: flex; justify-content: space-between;">
          <span>${isTemporary ? "TOTAL DUE:" : "TOTAL PAID:"}</span>
          <span>${settings.currency}${Number(total).toFixed(2)}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px dashed #000; font-size: 10px;">
        <div>${isTemporary ? "Please review before settlement" : settings.footerNote}</div>
        <div style="font-size: 9px; margin-top: 4px; color: #444;">Powered by Thalassa PMS</div>
      </div>
    </div>
  `;
}

// Built-in Official A4 Letterhead & Invoice Generator
function buildA4Html({ settings, room, isTemporary, settlementMethod, total }) {
  const items = room?.orderItems || [];
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #091D26;">
            ${settings.hotelName}
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; letter-spacing: 1px;">
            Luxury Coastal Retreat & Suites
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">
            ${settings.address} | Tel: ${settings.phone}
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;">
            Email: ${settings.email} | Tax ID / VAT: ${settings.taxNumber}
          </p>
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
          <p style="margin: 2px 0 0 0; font-size: 12px;">Payment Method: <b>${isTemporary ? "Pending" : settlementMethod}</b></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Stay Information</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">Room #${room?.number}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Category: ${room?.type}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Period: ${room?.checkIn} to ${room?.checkOut}</p>
        </div>
      </div>

      <table style="margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; text-align: left;">
            <th style="padding: 10px 4px; text-transform: uppercase; font-size: 11px;">Description</th>
            <th style="padding: 10px 4px; text-align: center; text-transform: uppercase; font-size: 11px;">Qty</th>
            <th style="padding: 10px 4px; text-align: right; text-transform: uppercase; font-size: 11px;">Unit Rate</th>
            <th style="padding: 10px 4px; text-align: right; text-transform: uppercase; font-size: 11px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 4px;">
                <span style="font-weight: 600;">${item.description}</span>
                ${item.timestamp ? `<span style="font-size: 10px; color: #555; display: block;">${item.timestamp}</span>` : ""}
              </td>
              <td style="padding: 10px 4px; text-align: center;">${item.quantity}</td>
              <td style="padding: 10px 4px; text-align: right;">${settings.currency}${Number(item.unitPrice).toFixed(2)}</td>
              <td style="padding: 10px 4px; text-align: right; font-weight: bold;">${settings.currency}${Number(item.total).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="border-top: 2px solid #091D26; border-bottom: 2px solid #091D26; padding: 12px 4px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: bold; text-transform: uppercase;">
          ${isTemporary ? "Total Due / Balance:" : `Total Settled in Full (${settlementMethod}):`}
        </span>
        <span style="font-size: 20px; font-weight: 900;">
          ${settings.currency}${Number(total).toFixed(2)}
        </span>
      </div>

      <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px;">
        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Guest Signature:</p>
          <div style="border-bottom: 1px solid #000; width: 80%;"></div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Front Desk Agent:</p>
          <div style="border-bottom: 1px solid #000; width: 80%; margin-left: auto;"></div>
        </div>
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 11px; border-top: 1px solid #ddd; padding-top: 12px;">
        <p style="margin: 0; font-weight: 500;">${settings.footerNote}</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
          Thank you for choosing ${settings.hotelName}. This document serves as an official accounting folio.
        </p>
      </div>
    </div>
  `;
}

// Built-in Official A4 Payslip & Payroll Generator
function buildPayslipHtml({ settings, staffMember }) {
  const grossPay = (Number(staffMember.hourlyRate) || 0) * (Number(staffMember.hoursWorked) || 0);
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #091D26;">
            ${settings.hotelName}
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; letter-spacing: 1px;">
            Employee Compensation & Payroll Statement
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">
            ${settings.address} | Tel: ${settings.phone}
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #333;">
            Tax ID / Reg: ${settings.taxNumber}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
            OFFICIAL PAYSLIP
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Pay Date:</b> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;"><b>Employee Ref:</b> ${staffMember.id}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; padding: 12px 16px; border: 1px solid #091D26; border-radius: 4px;">
        <div>
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Employee Details</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">${staffMember.name}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Designated Role: <b>${staffMember.role}</b></p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Contact: ${staffMember.phone || "N/A"}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #555;">Employment Term</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold;">${staffMember.type || "Full-Time"}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Base Hourly Rate: <b>${settings.currency}${Number(staffMember.hourlyRate).toFixed(2)}/hr</b></p>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Payout Status: <b>${staffMember.paid ? "SETTLED / PAID" : "PENDING DISBURSEMENT"}</b></p>
        </div>
      </div>

      <table style="margin: 20px 0; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; text-align: left;">
            <th style="padding: 10px 4px; text-transform: uppercase; font-size: 11px;">Earnings Description</th>
            <th style="padding: 10px 4px; text-align: center; text-transform: uppercase; font-size: 11px;">Hours Logged</th>
            <th style="padding: 10px 4px; text-align: right; text-transform: uppercase; font-size: 11px;">Pay Rate</th>
            <th style="padding: 10px 4px; text-align: right; text-transform: uppercase; font-size: 11px;">Gross Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 4px;">Regular Shift Duties & Service</td>
            <td style="padding: 10px 4px; text-align: center;">${staffMember.hoursWorked || 0} hrs</td>
            <td style="padding: 10px 4px; text-align: right;">${settings.currency}${Number(staffMember.hourlyRate).toFixed(2)}</td>
            <td style="padding: 10px 4px; text-align: right; font-weight: bold;">${settings.currency}${grossPay.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="border-top: 2px solid #091D26; border-bottom: 2px solid #091D26; padding: 12px 4px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: bold; text-transform: uppercase;">
          Net Remittance Payable:
        </span>
        <span style="font-size: 20px; font-weight: 900; color: #0D9488;">
          ${settings.currency}${grossPay.toFixed(2)}
        </span>
      </div>

      <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px;">
        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Employee Acknowledgment:</p>
          <div style="border-bottom: 1px solid #000; width: 80%;"></div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Payroll / General Manager:</p>
          <div style="border-bottom: 1px solid #000; width: 80%; margin-left: auto;"></div>
        </div>
      </div>
    </div>
  `;
}

// Built-in Official A4 Daily Attendance Sheet Generator
function buildDailyAttendanceHtml({ settings, staffList }) {
  const todayStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div class="a4-container">
      <div style="border-bottom: 3px double #091D26; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #091D26;">
            ${settings.hotelName}
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #555; letter-spacing: 1px;">
            Daily Employee Shift & Attendance Sheet
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #333;">
            ${settings.address} | Tel: ${settings.phone}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #091D26; padding: 6px 14px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
            ATTENDANCE LOG
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;"><b>Date:</b> ${todayStr}</p>
        </div>
      </div>

      <div style="margin: 20px 0 10px 0;">
        <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0F766E;">
          Logged Duty Roster (${staffList.length} Active Personnel)
        </span>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid #091D26; background: #F3EFE6;">
            <th style="padding: 10px 6px; text-align: left;">Employee Name</th>
            <th style="padding: 10px 6px; text-align: left;">Designated Role</th>
            <th style="padding: 10px 6px; text-align: center;">Shift In</th>
            <th style="padding: 10px 6px; text-align: center;">Shift Out</th>
            <th style="padding: 10px 6px; text-align: center;">Duty Status</th>
            <th style="padding: 10px 6px; text-align: center;">Staff Signature</th>
          </tr>
        </thead>
        <tbody>
          ${staffList.map((member) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 6px; font-weight: bold;">${member.name}</td>
              <td style="padding: 10px 6px;">${member.role} (${member.type})</td>
              <td style="padding: 10px 6px; text-align: center; font-family: monospace;">${member.clockIn || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center; font-family: monospace;">${member.clockOut || "--:--"}</td>
              <td style="padding: 10px 6px; text-align: center; font-weight: bold; color: ${member.isOnDuty ? "#0D9488" : "#888"};">
                ${member.isOnDuty ? "ON DUTY" : member.clockOut ? "COMPLETED" : "OFF DUTY"}
              </td>
              <td style="padding: 10px 6px; text-align: center; border-bottom: 1px solid #aaa; width: 120px;"></td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px;">
        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">Shift Supervisor Verification:</p>
          <div style="border-bottom: 1px solid #000; width: 80%;"></div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 30px;">General Manager Sign-off:</p>
          <div style="border-bottom: 1px solid #000; width: 80%; margin-left: auto;"></div>
        </div>
      </div>
    </div>
  `;
}

export default function App() {
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

  // Front Desk Modals
  const [checkInModalRoom, setCheckInModalRoom] = useState(null);
  const [settleOrderRoom, setSettleOrderRoom] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("Credit Card");
  const [cashTendered, setCashTendered] = useState("");
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", nights: 1 });

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

  // Staff & Attendance State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffViewSubTab, setStaffViewSubTab] = useState("roster"); // "roster" | "attendance"
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    role: "Front Desk",
    pin: "1234",
    type: "Full-Time",
    hourlyRate: "22",
    phone: "",
  });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    name: "",
    role: "Front Desk",
    pin: "",
    type: "Full-Time",
    hourlyRate: "",
    hoursWorked: "",
    phone: "",
    clockIn: "",
    clockOut: ""
  });

  // --- REALTIME DATABASE LISTENERS ---
  useEffect(() => {
    // Settings Listener
    const settingsRef = ref(rtdb, "hotel_config/profile");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSettings(data);
      else set(settingsRef, DEFAULT_SETTINGS);
    });

    // Rooms Listener
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
              "i2": { id: "i2", description: "Minibar: Artisanal Sparkling Water", quantity: 2, unitPrice: 6, total: 12, timestamp: "Sep 29, 10:15" },
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

    // Inventory Listener
    const invRef = ref(rtdb, "inventory");
    const unsubInv = onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || Object.keys(data).length <= 1) {
        const seedMap = {};
        INITIAL_INVENTORY_SEEDS.forEach((i) => { seedMap[i.id] = i; });
        update(invRef, seedMap);
      } else {
        const loaded = Object.keys(data).map((key) => {
          const item = data[key];
          return {
            ...item,
            id: key,
            name: item.name || item.title || "Unnamed Item",
            category: item.category || "minibar",
            price: Number(item.price) || 0,
            stock: Number(item.stock) || 0,
          };
        });
        setInventory(loaded.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });

    // Staff Listener
    const staffRef = ref(rtdb, "staff");
    const unsubStaff = onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || Object.keys(data).length === 0) {
        const seedStaffMap = {};
        INITIAL_STAFF_SEEDS.forEach((s) => { seedStaffMap[s.id] = s; });
        set(staffRef, seedStaffMap);
      } else {
        const staffList = Object.keys(data).map((k) => ({
          ...data[k],
          id: k,
          hourlyRate: Number(data[k].hourlyRate) || 0,
          hoursWorked: Number(data[k].hoursWorked) || 0,
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
    };
  }, [selectedRoomId]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Calculations
  const calculateTotal = (room) => room?.orderItems?.reduce((acc, item) => acc + (Number(item.total) || 0), 0) || 0;
  const printTargetRoom = settleOrderRoom || currentRoom;
  const printTargetTotal = calculateTotal(printTargetRoom);

  // --- PRINT DRIVERS ---
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

  // --- TIMECLOCK & ATTENDANCE ACTIONS ---
  const formatTimeNow = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // One-tap Clock In
  const handleClockIn = (staffId) => {
    const timeStr = formatTimeNow();
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, clockIn: timeStr, clockOut: "", isOnDuty: true } : s))
    );
    update(ref(rtdb, `staff/${staffId}`), {
      clockIn: timeStr,
      clockOut: "",
      isOnDuty: true
    });
  };

  // One-tap Clock Out & Auto-Add Shift Hours
  const handleClockOut = (staffId) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;
    const timeStr = formatTimeNow();

    // Default to +8 hrs shift or estimate duration
    const addedShiftHours = 8; 
    const updatedTotalHours = Math.max(0, (member.hoursWorked || 0) + addedShiftHours);

    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { 
        ...s, 
        clockOut: timeStr, 
        isOnDuty: false, 
        hoursWorked: updatedTotalHours, 
        paid: false 
      } : s))
    );

    update(ref(rtdb, `staff/${staffId}`), {
      clockOut: timeStr,
      isOnDuty: false,
      hoursWorked: updatedTotalHours,
      paid: false
    });
  };

  // --- STAFF & INVENTORY HANDLERS ---
  const handleUpdateStockLevel = (itemId, delta) => {
    if (!itemId) return;
    const target = inventory.find((i) => i.id === itemId);
    const currentStock = Number(target?.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);

    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, stock: newStock } : item))
    );
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

    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updatedPayload } : item))
    );
    setEditingInventoryId(null);
    update(ref(rtdb, `inventory/${itemId}`), updatedPayload);
  };

  const handleDeleteInventoryItem = (item) => {
    if (!window.confirm(`Permanently remove "${item.name}" from inventory?`)) return;
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
    const cleanRate = parseFloat(newStaffForm.hourlyRate);

    const newStaff = {
      id: staffId,
      name: newStaffForm.name.trim(),
      role: newStaffForm.role || "Front Desk",
      pin: newStaffForm.pin || "0000",
      type: newStaffForm.type || "Full-Time",
      hourlyRate: isNaN(cleanRate) || cleanRate < 0 ? 20 : cleanRate,
      hoursWorked: 0,
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
      hourlyRate: "22",
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
      hourlyRate: String(member.hourlyRate ?? 20),
      hoursWorked: String(member.hoursWorked ?? 0),
      phone: member.phone || "",
      clockIn: member.clockIn || "",
      clockOut: member.clockOut || ""
    });
  };

  const handleSaveStaffEdit = (staffId) => {
    if (!editStaffForm.name.trim()) return;

    const cleanRate = parseFloat(editStaffForm.hourlyRate);
    const cleanHours = parseFloat(editStaffForm.hoursWorked);

    const updatedPayload = {
      name: editStaffForm.name.trim(),
      role: editStaffForm.role,
      pin: editStaffForm.pin || "0000",
      type: editStaffForm.type,
      hourlyRate: isNaN(cleanRate) || cleanRate < 0 ? 0 : cleanRate,
      hoursWorked: isNaN(cleanHours) || cleanHours < 0 ? 0 : cleanHours,
      phone: editStaffForm.phone || "",
      clockIn: editStaffForm.clockIn || "",
      clockOut: editStaffForm.clockOut || ""
    };

    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, ...updatedPayload } : s))
    );
    setEditingStaffId(null);
    update(ref(rtdb, `staff/${staffId}`), updatedPayload);
  };

  const handleToggleStaffPayout = (staffId, currentStatus) => {
    const nextStatus = !currentStatus;
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, paid: nextStatus } : s))
    );
    update(ref(rtdb, `staff/${staffId}`), { paid: nextStatus });
  };

  const handleDeleteStaff = (member) => {
    if (!window.confirm(`Permanently remove ${member.name} from staff records?`)) return;
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

  const handleOpenOrderAndCheckIn = (e) => {
    e.preventDefault();
    if (!checkInModalRoom || !guestForm.name) return;

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
      checkIn: now.toISOString().split("T")[0],
      checkOut: new Date(Date.now() + nights * 86400000).toISOString().split("T")[0],
      orderItems: { [itemId]: initialOrderItem },
    };

    update(ref(rtdb, `rooms/${checkInModalRoom.id}`), roomPayload);
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
    if (window.confirm(`Permanently remove Room #${roomNumber}?`)) {
      remove(ref(rtdb, `rooms/${roomId}`));
    }
  };

  // Filtered queries
  const filteredInventory = inventory.filter((item) => {
    const matchesCategory =
      inventoryCategoryFilter === "all" || item.category === inventoryCategoryFilter;
    const matchesSearch = (item.name || "")
      .toLowerCase()
      .includes(inventorySearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredStaff = staff.filter((s) => {
    const q = staffSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  // Payroll & Attendance Metrics
  const totalPayrollGross = staff.reduce((acc, s) => acc + (s.hourlyRate * s.hoursWorked), 0);
  const totalHoursLogged = staff.reduce((acc, s) => acc + s.hoursWorked, 0);
  const onDutyCount = staff.filter((s) => s.isOnDuty).length;

  const parsedTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - printTargetTotal);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#091D26] font-semibold text-sm">Loading Thalassa Hotel OS...</p>
        </div>
      </div>
    );
  }

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

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: "frontdesk", label: "Front Desk & Status", icon: Bed },
            { id: "active-orders", label: "Active Bills & Tabs", icon: Receipt },
            { id: "inventory", label: "Stock & Minibar", icon: Boxes },
            { id: "room-admin", label: "Room Management", icon: SlidersHorizontal },
            { id: "staff", label: "Staff & Attendance", icon: Users },
            { id: "settings", label: "Hotel Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
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
          ))}
        </nav>

        <div className="p-4 border-t border-[#0F2D3C] bg-[#06151E]/40">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connected Engine</p>
          <p className="text-xs text-[#2DD4BF] font-mono truncate mt-0.5">Firebase Realtime DB</p>
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
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded text-slate-300">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden bg-[#091D26] border-b border-[#0F2D3C] p-4 space-y-2 z-50 text-white shadow-xl">
            {[
              { id: "frontdesk", label: "Front Desk" },
              { id: "active-orders", label: "Active Bills & Tabs" },
              { id: "inventory", label: "Stock & Minibar" },
              { id: "room-admin", label: "Room Management" },
              { id: "staff", label: "Staff & Attendance" },
              { id: "settings", label: "Hotel Settings" },
            ].map((item) => (
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
            ))}
          </div>
        )}

        <main className="no-print flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: FRONT DESK */}
          {activeTab === "frontdesk" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Front Desk Operations</h2>
                  <p className="text-sm text-slate-500">Live guest room status, check-ins, and turnover</p>
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
                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3] mb-4 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[#091D26] truncate mr-2">{room.guestName}</span>
                              <span className="font-black text-[#0D9488] shrink-0">{settings.currency}{billTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-[#0F766E] font-mono">{room.orderId}</p>
                            <p className="text-[11px] text-slate-400">Checkout: {room.checkOut}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#F3EFE6] flex gap-2">
                        {room.status === "available" && (
                          <button
                            type="button"
                            onClick={() => setCheckInModalRoom(room)}
                            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2 rounded-lg text-xs font-bold"
                          >
                            Open Order / Check In
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
                            <button
                              type="button"
                              onClick={() => handleInitiateSettleOrder(room)}
                              className="flex-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white py-2 rounded-lg text-xs font-bold"
                            >
                              Settle Order
                            </button>
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
                        {room.status === "maintenance" && (
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
          {activeTab === "active-orders" && (
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

                          <div className="text-xs space-y-1 mb-4">
                            <p className="font-bold text-[#091D26]">{room.guestName}</p>
                            <p className="text-slate-500">{room.guestPhone}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Opened: {room.openedAt || room.checkIn}
                            </p>
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
                            <button
                              type="button"
                              onClick={() => handleDeleteActiveBill(room)}
                              className="p-2 border border-coral-200 text-coral-600 hover:bg-coral-50 rounded-lg text-xs transition-colors"
                              title="Delete / Void this active bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

                    {/* Quick Minibar Dispatch */}
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

          {/* TAB 3: INVENTORY & MINIBAR */}
          {activeTab === "inventory" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26]">Inventory & Minibar Management</h2>
                  <p className="text-sm text-slate-500">
                    Realtime Database synchronization for room minibar consumables and amenities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(true)}
                  className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <PackagePlus className="w-4 h-4" /> Add Inventory Item
                </button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">Total Items</p>
                  <p className="text-2xl font-black text-[#091D26] mt-1">{inventory.length}</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#0F766E]">Minibar Products</p>
                  <p className="text-2xl font-black text-[#0F766E] mt-1">
                    {inventory.filter((i) => i.category === "minibar").length}
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-amber-700">Amenities / Linens</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {inventory.filter((i) => i.category !== "minibar").length}
                  </p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#F43F5E]">Low Stock (&lt;10)</p>
                  <p className="text-2xl font-black text-[#F43F5E] mt-1">
                    {inventory.filter((i) => i.stock < 10).length}
                  </p>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stock item..."
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E6DFD3] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1">
                  {["all", "minibar", "amenity", "linen", "beverage", "snack"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                        inventoryCategoryFilter === cat
                          ? "bg-[#0F2D3C] text-white"
                          : "bg-white border border-[#E6DFD3] text-slate-600 hover:bg-[#FAF9F5]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Billable Price</th>
                      <th className="p-3.5 text-center">Stock Level</th>
                      <th className="p-3.5 text-center">Quick Adjust</th>
                      <th className="p-3.5 text-center">Actions</th>
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
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.stock < 10 && (
                                  <span className="flex items-center gap-0.5 text-[10px] bg-[#FFE4E6] text-[#F43F5E] px-1.5 py-0.5 rounded font-bold">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Low
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isEditing ? (
                              <select
                                value={editInventoryForm.category}
                                onChange={(e) => setEditInventoryForm({ ...editInventoryForm, category: e.target.value })}
                                className="border border-[#14B8A6] rounded px-1.5 py-1 text-xs bg-white focus:outline-none"
                              >
                                <option value="minibar">Minibar</option>
                                <option value="amenity">Amenity</option>
                                <option value="linen">Linen</option>
                                <option value="beverage">Beverage</option>
                                <option value="snack">Snack</option>
                              </select>
                            ) : (
                              <span className="bg-[#F3EFE6] text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                                {item.category}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-medium">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                className="w-20 border border-[#14B8A6] rounded px-2 py-1 text-xs text-right focus:outline-none bg-white"
                                value={editInventoryForm.price}
                                onChange={(e) => setEditInventoryForm({ ...editInventoryForm, price: e.target.value })}
                              />
                            ) : item.price > 0 ? (
                              `${settings.currency}${Number(item.price).toFixed(2)}`
                            ) : (
                              <span className="text-slate-400 italic">Free</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-16 border border-[#14B8A6] rounded px-2 py-1 text-xs text-center focus:outline-none bg-white"
                                value={editInventoryForm.stock}
                                onChange={(e) => setEditInventoryForm({ ...editInventoryForm, stock: e.target.value })}
                              />
                            ) : (
                              <span className={item.stock < 10 ? "text-[#F43F5E] font-black" : "text-[#091D26]"}>
                                {item.stock}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, -1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6] text-xs font-bold transition-colors"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStockLevel(item.id, 1)}
                                className="px-2 py-0.5 border border-[#D3C8B7] rounded hover:bg-[#F3EFE6] text-xs font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInventoryEdit(item.id)}
                                  className="p-1 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingInventoryId(null)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInventory(item)}
                                  className="text-slate-400 hover:text-[#0D9488] p-1 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInventoryItem(item)}
                                  className="text-[#F43F5E] hover:text-[#E11D48] p-1 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* TAB 4: ROOM MANAGEMENT */}
          {activeTab === "room-admin" && (
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
                      <th className="p-3.5 text-center">Change Status</th>
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
                          <div className="inline-flex rounded-lg border border-[#E6DFD3] p-0.5 bg-[#FAF9F5] gap-1">
                            <button
                              type="button"
                              onClick={() => updateRoomStatus(room.id, "available")}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-600 hover:bg-white"
                            >
                              Ready
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRoomStatus(room.id, "cleaning")}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-600 hover:bg-white"
                            >
                              Clean
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRoomStatus(room.id, "maintenance")}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-600 hover:bg-white"
                            >
                              Out of Order
                            </button>
                          </div>
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

          {/* TAB 5: STAFF MANAGEMENT, ATTENDANCE & PAYROLL */}
          {activeTab === "staff" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#091D26] tracking-tight">Staff, Attendance & Payroll</h2>
                  <p className="text-sm text-slate-500">
                    Track daily in/out shift attendance, manage team roles, and disburse official wage slips.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintDailyAttendance}
                    className="inline-flex items-center gap-2 bg-[#0F2D3C] hover:bg-[#091D26] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2DD4BF]" /> Print Daily Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="inline-flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Add Staff Member
                  </button>
                </div>
              </div>

              {/* Roster & Attendance Executive Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-400">Total Personnel</p>
                  <p className="text-2xl font-black text-[#091D26] mt-1">{staff.length}</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#0D9488]">Currently On Duty</p>
                  <p className="text-2xl font-black text-[#0D9488] mt-1">{onDutyCount} Staff</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-amber-700">Total Hours Logged</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">{totalHoursLogged} hrs</p>
                </div>
                <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-[#F43F5E]">Est. Gross Payroll</p>
                  <p className="text-2xl font-black text-[#091D26] mt-1">
                    {settings.currency}{totalPayrollGross.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* View Switcher: Daily Attendance vs Payroll Roster */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex bg-[#F3EFE6] p-1 rounded-lg border border-[#E6DFD3]">
                  <button
                    type="button"
                    onClick={() => setStaffViewSubTab("attendance")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                      staffViewSubTab === "attendance" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" /> Daily In/Out Attendance Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffViewSubTab("roster")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                      staffViewSubTab === "roster" ? "bg-[#0F2D3C] text-white shadow-sm" : "text-slate-600 hover:text-black"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-[#2DD4BF]" /> Employment & Payroll
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff by name or role..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E6DFD3] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>

              {/* VIEW 1: DAILY IN/OUT ATTENDANCE SHEET */}
              {staffViewSubTab === "attendance" && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-[#F3EFE6] flex justify-between items-center bg-[#FAF9F5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#091D26]">Daily Shift Time-Clock Log</h3>
                      <p className="text-[11px] text-slate-500">Record employee clock-in and clock-out timestamps for today</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0F766E] bg-[#CCFBF1] px-2.5 py-1 rounded">
                      {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Employee</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5 text-center">Clock-In Time</th>
                          <th className="p-3.5 text-center">Clock-Out Time</th>
                          <th className="p-3.5 text-center">Current Status</th>
                          <th className="p-3.5 text-center">Time-Clock Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredStaff.map((member) => (
                          <tr key={member.id} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="p-3.5 font-bold text-[#091D26]">
                              <div className="text-sm">{member.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">PIN: ****{member.pin.slice(-2)}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-slate-800 block">{member.role}</span>
                              <span className="text-[10px] text-slate-500">{member.type}</span>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                              {member.clockIn ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                                  {member.clockIn}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">--:--</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                              {member.clockOut ? (
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                                  {member.clockOut}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">--:--</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  member.isOnDuty
                                    ? "bg-[#CCFBF1] text-[#0F766E] border border-[#2DD4BF]"
                                    : member.clockOut
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-[#FFE4E6] text-[#F43F5E]"
                                }`}
                              >
                                {member.isOnDuty ? "On Duty" : member.clockOut ? "Completed" : "Off Duty"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex gap-1.5">
                                {!member.isOnDuty ? (
                                  <button
                                    type="button"
                                    onClick={() => handleClockIn(member.id)}
                                    className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                                  >
                                    <LogIn className="w-3.5 h-3.5" /> Clock In
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleClockOut(member.id)}
                                    className="px-3 py-1.5 bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                                  >
                                    <LogOut className="w-3.5 h-3.5" /> Clock Out
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: EMPLOYMENT ROSTER & PAYROLL */}
              {staffViewSubTab === "roster" && (
                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3EFE6] border-b border-[#E6DFD3] uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-3.5">Staff Details</th>
                          <th className="p-3.5">Role & Term</th>
                          <th className="p-3.5">Hourly Rate</th>
                          <th className="p-3.5 text-center">Hours Worked</th>
                          <th className="p-3.5 text-right">Gross Pay</th>
                          <th className="p-3.5 text-center">Payout Status</th>
                          <th className="p-3.5 text-center">Payslip</th>
                          <th className="p-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EFE6]">
                        {filteredStaff.map((member) => {
                          const isEditing = editingStaffId === member.id;
                          const grossPay = (member.hourlyRate || 0) * (member.hoursWorked || 0);

                          return (
                            <tr key={member.id} className="hover:bg-[#FAF9F5] transition-colors">
                              <td className="p-3.5 font-bold text-[#091D26]">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      className="w-full border border-[#14B8A6] rounded px-2 py-1 text-xs bg-white"
                                      value={editStaffForm.name}
                                      onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Phone"
                                      className="w-full border border-[#D3C8B7] rounded px-2 py-1 text-[11px] bg-white"
                                      value={editStaffForm.phone}
                                      onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-sm font-bold text-[#091D26]">{member.name}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">PIN: ****{member.pin.slice(-2)} | {member.phone || "No phone"}</div>
                                  </div>
                                )}
                              </td>

                              <td className="p-3.5">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <select
                                      value={editStaffForm.role}
                                      onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                                      className="w-full border border-[#14B8A6] rounded px-1.5 py-1 text-xs bg-white"
                                    >
                                      <option value="Manager">Manager</option>
                                      <option value="Front Desk">Front Desk</option>
                                      <option value="Housekeeping">Housekeeping</option>
                                      <option value="Maintenance">Maintenance</option>
                                      <option value="F&B / Restaurant">F&B / Restaurant</option>
                                      <option value="Bartender">Bartender</option>
                                      <option value="Security">Security</option>
                                    </select>
                                    <select
                                      value={editStaffForm.type}
                                      onChange={(e) => setEditStaffForm({ ...editStaffForm, type: e.target.value })}
                                      className="w-full border border-[#D3C8B7] rounded px-1.5 py-1 text-[11px] bg-white"
                                    >
                                      <option value="Full-Time">Full-Time</option>
                                      <option value="Part-Time">Part-Time</option>
                                      <option value="Casual">Casual</option>
                                      <option value="Contractor">Contractor</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-semibold text-[#091D26] block">{member.role}</span>
                                    <span className="bg-[#CCFBF1] text-[#0F766E] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                      {member.type || "Full-Time"}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="p-3.5 font-medium text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.5"
                                    className="w-20 border border-[#14B8A6] rounded px-2 py-1 text-xs bg-white"
                                    value={editStaffForm.hourlyRate}
                                    onChange={(e) => setEditStaffForm({ ...editStaffForm, hourlyRate: e.target.value })}
                                  />
                                ) : (
                                  `${settings.currency}${Number(member.hourlyRate).toFixed(2)}/hr`
                                )}
                              </td>

                              <td className="p-3.5 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-16 border border-[#14B8A6] rounded px-2 py-1 text-xs text-center bg-white"
                                    value={editStaffForm.hoursWorked}
                                    onChange={(e) => setEditStaffForm({ ...editStaffForm, hoursWorked: e.target.value })}
                                  />
                                ) : (
                                  <span className="font-bold text-[#091D26]">{member.hoursWorked || 0} hrs</span>
                                )}
                              </td>

                              <td className="p-3.5 text-right font-black text-sm text-[#0D9488]">
                                {settings.currency}{grossPay.toFixed(2)}
                              </td>

                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffPayout(member.id, member.paid)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                    member.paid
                                      ? "bg-[#CCFBF1] text-[#0F766E] border border-[#2DD4BF]"
                                      : "bg-[#FFE4E6] text-[#F43F5E] border border-coral-200 hover:bg-coral-100"
                                  }`}
                                >
                                  {member.paid ? "Paid" : "Mark Paid"}
                                </button>
                              </td>

                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPayslip(member)}
                                  className="p-1.5 bg-[#0F2D3C] hover:bg-[#091D26] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#2DD4BF]" /> Slip
                                </button>
                              </td>

                              <td className="p-3.5 text-center">
                                {isEditing ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveStaffEdit(member.id)}
                                      className="p-1 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingStaffId(null)}
                                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditStaff(member)}
                                      className="text-slate-400 hover:text-[#0D9488] p-1"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStaff(member)}
                                      className="text-[#F43F5E] hover:text-[#E11D48] p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
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

      {/* MODAL 1: CHECK-IN */}
      {checkInModalRoom && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">New Guest Order</span>
                <h3 className="font-bold text-lg text-[#091D26]">Open Order - Room #{checkInModalRoom.number}</h3>
              </div>
              <button type="button" onClick={() => setCheckInModalRoom(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenOrderAndCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Sterling"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nights</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={guestForm.nights}
                  onChange={(e) => setGuestForm({ ...guestForm, nights: parseInt(e.target.value, 10) || 1 })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5"
                />
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E6DFD3]">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>Room Rate:</span>
                  <span>{settings.currency}{checkInModalRoom.rate}/night</span>
                </div>
                <div className="flex justify-between font-bold text-[#091D26]">
                  <span>Initial Order Value:</span>
                  <span>{settings.currency}{(checkInModalRoom.rate * (guestForm.nights || 1)).toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg">
                Open Order & Check In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ORDER SETTLEMENT */}
      {settleOrderRoom && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E6DFD3]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-[#0F766E]">Order Settlement</span>
                  <span className="font-mono text-xs text-slate-500">{settleOrderRoom.orderId}</span>
                </div>
                <h3 className="font-black text-xl text-[#091D26]">Room #{settleOrderRoom.number}</h3>
                <p className="text-xs text-slate-500">Guest: {settleOrderRoom.guestName || "Walk-In"}</p>
              </div>
              <button type="button" onClick={() => setSettleOrderRoom(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto border border-[#E6DFD3] rounded-lg p-3 bg-[#FAF9F5] mb-4 text-xs space-y-1.5">
              {settleOrderRoom.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between py-1 border-b border-slate-100 last:border-none">
                  <div>
                    <span className="font-semibold text-slate-800">{item.quantity}x {item.description}</span>
                    {item.timestamp && <span className="text-[10px] text-slate-400 block">{item.timestamp}</span>}
                  </div>
                  <span className="font-semibold text-[#091D26]">{settings.currency}{Number(item.total).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-black text-sm text-[#091D26]">
                <span>Total Balance to Settle:</span>
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
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
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
              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E6DFD3] mb-4 flex items-center gap-3 text-xs">
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

            <div className="bg-sand-100 p-2.5 rounded-lg border border-sand-200 text-xs text-slate-600 mb-5 flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#0D9488]" />
              <span>
                Final letterhead invoice ({printFormat === "thermal" ? "80mm Thermal" : "Official A4"}) will auto-print upon confirmation.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettleOrderRoom(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmOrderSettlement}
                className="flex-2 bg-[#0D9488] hover:bg-[#0F766E] text-white py-3 px-6 rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm Payment & Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW ROOM */}
      {showAddRoomModal && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#091D26]">Add New Hotel Room</h3>
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
                  placeholder="e.g. 301, 302, PH-A"
                  value={newRoomForm.number}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, number: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Room Category / Type</label>
                <select
                  value={newRoomForm.type}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, type: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none"
                >
                  <option value="Ocean Breeze King">Ocean Breeze King</option>
                  <option value="Lagoon View Double">Lagoon View Double</option>
                  <option value="Coral Penthouse Suite">Coral Penthouse Suite</option>
                  <option value="Family Beachside Villa">Family Beachside Villa</option>
                  <option value="Standard Coastal Queen">Standard Coastal Queen</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Base Nightly Rate ({settings.currency})</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newRoomForm.rate}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, rate: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Status</label>
                <select
                  value={newRoomForm.status}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, status: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none"
                >
                  <option value="available">Available</option>
                  <option value="cleaning">Needs Cleaning</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                Register Room to Cloud
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD INVENTORY / MINIBAR ITEM */}
      {showAddInventoryModal && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Stock Catalog</span>
                <h3 className="font-bold text-lg text-[#091D26]">Add New Stock / Minibar Item</h3>
              </div>
              <button type="button" onClick={() => setShowAddInventoryModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInventoryItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product / Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Pellegrino 500ml, Cashew Tin"
                  value={newInventoryForm.name}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newInventoryForm.category}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, category: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="minibar">Minibar</option>
                    <option value="amenity">Amenity</option>
                    <option value="linen">Linen</option>
                    <option value="beverage">Beverage</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Billable Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newInventoryForm.price}
                    onChange={(e) => setNewInventoryForm({ ...newInventoryForm, price: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                  <span className="text-[10px] text-slate-400">Set 0 for free amenities</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Stock Count</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newInventoryForm.stock}
                  onChange={(e) => setNewInventoryForm({ ...newInventoryForm, stock: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                Save Item to Database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="no-print fixed inset-0 bg-[#06151E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD3]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#0F766E]">Team Roster</span>
                <h3 className="font-bold text-lg text-[#091D26]">Add Staff Member & Role</h3>
              </div>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malia Chang"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Operational Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="F&B / Restaurant">F&B / Restaurant</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Employment Term</label>
                  <select
                    value={newStaffForm.type}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, type: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Casual">Casual</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Base Hourly Rate ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={newStaffForm.hourlyRate}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, hourlyRate: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Access PIN (4 Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newStaffForm.pin}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                    className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full border border-[#D3C8B7] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-3 rounded-lg transition-colors mt-2"
              >
                Register Staff to Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}