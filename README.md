# 💎 FinApp — Autonomous Financial Cockpit & Intelligence Engine

<div align="center">

[![Expo](https://img.shields.io/badge/Expo-v57.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI_Forensics-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br/>

**A privacy-first, autonomous financial operating system built for modern India.**  
*Instant Excel/CSV bank statement ingestion, on-device real-time SMS UPI parsing, automated merchant intelligence, dual present-balance & profit cockpit, and complete GST compliance.*

</div>

---

## 📑 Table of Contents

- [🌟 Why FinApp Exists (The Problem & The Vision)](#-why-finapp-exists-the-problem--the-vision)
- [🎯 What FinApp Tells You](#-what-finapp-tells-you)
- [🏛 Architecture & Privacy-First Philosophy](#-architecture--privacy-first-philosophy)
- [✨ Core Modules & Deep Dive](#-core-modules--deep-dive)
  - [1. 🏠 Home — The Financial Cockpit](#1--home--the-financial-cockpit)
  - [2. 📚 Books — Statement & Ledger Intelligence](#2--books--statement--ledger-intelligence)
  - [3. 🏷️ Transactions — Self-Learning Categorization](#3-️-transactions--self-learning-categorization)
  - [4. 🧾 GST — Tax Optimization & Invoice Studio](#4--gst--tax-optimization--invoice-studio)
  - [5. 📱 SMS Engine — Zero-Leakage On-Device Ingestion](#5--sms-engine--zero-leakage-on-device-ingestion)
  - [6. 🤖 AI Forensics & Threat Detection](#6--ai-forensics--threat-detection)
  - [7. ⚙️ Settings, Sync & Appearance](#7-️-settings-sync--appearance)
- [🛠️ Tech Stack & Dependencies](#️-tech-stack--dependencies)
- [🚀 Quick Start & Installation Guide](#-quick-start--installation-guide)
- [🔒 Security & Privacy Guarantees](#-security--privacy-guarantees)
- [📥 Download FinApp](#-download-finapp)

---

## 🌟 Why FinApp Exists (The Problem & The Vision)

Managing personal and business finances in the UPI era is fundamentally broken:

| Traditional Finance Apps | The FinApp Way |
|:---|:---|
| ❌ **Demand Net Banking Credentials / OTPs**: Require invasive account aggregator credentials or credential scraping. | ✅ **100% Non-Custodial & Non-Invasive**: No net-banking passwords or OTPs ever asked. Raw statements and SMS stay on your device. |
| ❌ **Sell Your Data to Lending Firms**: Your spend patterns are monetized to push high-interest loans and credit cards. | ✅ **Zero Data Monetization**: No ads, no credit-card spam, no telemetry selling. Your data belongs strictly to you. |
| ❌ **Cluttered & Inaccurate Fallbacks**: Unrecognized expenses clutter your budgets with fake categories or arbitrary tags. | ✅ **Smart Quarantine (`Unknown`)**: Unrecognized entries are routed cleanly to `Unknown`. Categorize once, and rules apply permanently. |
| ❌ **Blind to Indian Tax Nuances (GST)**: Most finance apps treat tax as a generic flat expense. | ✅ **Built-in GST & ITC Suite**: Multi-slab tax breakdown (0%, 5%, 12%, 18%, 28%), CGST/SGST/IGST math, and tax reduction advisory. |
| ❌ **Static Spreadsheets Require Manual Labor**: Manually typing CSV rows is exhausting and error-prone. | ✅ **Drag-and-Drop SheetJS Engine**: Instant automated parsing of SBI, HDFC, ICICI, Axis, Kotak, PNB Excel (`.xlsx`, `.xls`) & CSV files. |

**FinApp was built to give you effortless financial clarity without sacrificing your privacy.**

---

## 🎯 What FinApp Tells You

FinApp functions as an autonomous financial radar. At any moment, it answers:

1. **How much cash do I actually have right now?**  
   Extracts real bank closing balances from your statements and SMS alerts or calculates true cumulative net available liquidity.
2. **Am I actually making a profit or burning capital?**  
   Computes exact Net Profit / Surplus vs. Deficit across any period with live profit margin percentages.
3. **Where is my money bleeding?**  
   Interactive categorization donut, counterparty exposure rankings, and high-volume merchant breakdowns (Swiggy, Amazon, Zomato, Zerodha, etc.).
4. **Will I run out of money this month?**  
   Autonomous 30-day runway projection engine that plots your cash-flow trajectory and warns you before your balance dips below safety thresholds.
5. **How much tax am I paying, and how can I legally reduce it?**  
   Itemized GST analysis with algorithmic strategies (*Equal*, *Proportional*, *Highest-Tax*) to hit target spend goals.

---

## 🏛 Architecture & Privacy-First Philosophy

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           USER DEVICE                                  │
  │                                                                        │
  │   [ Bank Statement (.xlsx / .csv) ]      [ Bank Transaction SMS ]     │
  │                  │                                    │                │
  │                  ▼                                    ▼                │
  │      SheetJS / CSV Parser Engine             On-Device SMS Tokenizer   │
  │                  │                        (Raw SMS NEVER leaves phone) │
  │                  ▼                                    │                │
  │       [ Sanitizer & Rule Matcher ] ◄──────────────────┘                │
  │                  │                                                     │
  │                  ▼                                                     │
  │        Encrypted Local Cache             React Native UI Cockpit       │
  │         (Expo SecureStore)             (Home, Books, GST, Filter)      │
  └──────────────────┬─────────────────────────────────────────────────────┘
                     │ Optional Cloud Sync
                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         SECURE CLOUD BACKEND                           │
  │                                                                        │
  │    Supabase PostgreSQL       Express.js Engine     Google Gemini AI    │
  │     (Row-Level Security)      (WebSocket Live)     (Forensic Audits)   │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Modules & Deep Dive

### 1. 🏠 Home — The Financial Cockpit
The primary launchpad providing an immediate 360° overview of your fiscal health:
- **Dual Hero Cockpit Cards**:
  - **Present Balance**: Prominently highlights available funds with live indicators for bank statement closing balance or net cash flow, accompanied by instant Total Inflow (`+₹...`) and Total Outflow (`-₹...`) badges.
  - **Total Net Profit / Surplus**: Displays net gain with color-coded profit margin badges (e.g. `+32% margin`), current-month profit metrics, and a dynamic progress bar. Tapping opens the complete calculation breakdown.
- **Predictive Cash Flow Runway**:
  - Automatically plots your historical spend trajectory against a projected 30-day forecast.
  - Generates early alerts if your projected burn rate threatens minimum balance thresholds.
- **Monthly Vital Stats**:
  - Real-time cards for **Income**, **Expense**, and **Net Savings Rate %** with month-over-month change percentages.
- **Where Money Went**:
  - Interactive category spend donut with instant drawer inspection of top debit counterparties.
- **Recent Ledger Feed**:
  - Chronological transaction audit trail with category icons and instant drill-down.

---

### 2. 📚 Books — Statement & Ledger Intelligence
Transform raw bank exports into executive accounting ledgers in seconds:
- **Universal Multi-Format Statement Importer**:
  - Accepts Excel (`.xlsx`, `.xls`) and CSV statements from major banks including **SBI, HDFC, ICICI, Axis, Kotak, PNB, Canara**, and generic banking exports.
  - Intelligent header & column auto-detection (Value Date, Narration/Description, Debit, Credit, Net Amount, and Closing Balance).
  - Handles messy Indian date notations (`DD/MM/YYYY`, `DD-MMM-YYYY`, Excel serial integers) and currency symbols seamlessly.
- **Party & Counterparty Profiling**:
  - Automatically groups transactions by merchant/payer/payee.
  - Computes **Total Volume**, **Paid Out**, **Received**, and **Net Position** per entity with high-volume badges.
- **Category Spend Bar Visualizer**:
  - Visual breakdown of expenditure across categories with color codes and percentages.

---

### 3. 🏷️ Transactions — Self-Learning Categorization
Say goodbye to rigid, frustrating transaction lists:
- **Dynamic Category Navigation Tabs**:
  - The top horizontal filter bar is fully dynamic. It unifies default categories, all user-created custom categories, and all transaction categories into seamless filter pills.
- **Persistent Merchant Auto-Categorization Rules**:
  - Categorize a merchant once (e.g., tag a raw description containing `Swiggy` as `Food`), and FinApp **permanently memorizes this rule**.
  - Automatically re-classifies all matching past transactions and applies the rule to all future statement uploads and SMS alerts.
- **Zero-Clutter Quarantine (`Unknown`)**:
  - Any transaction that does not match a known rule is routed cleanly to `Unknown`, keeping your real budgets pristine until you review them.
- **Custom Category Studio**:
  - Create new categories on the fly with custom naming directly within transaction details.
- **Multi-Dimensional Filtering**:
  - Filter by transaction type: **Income Only (+)**, **Expenses Only (-)**, or **All**.
  - Instant full-text search across merchants, UPI IDs, bank references, and narrations.

---

### 4. 🧾 GST — Tax Optimization & Invoice Studio
A complete on-device GST workbench designed for freelancers, businesses, and proactive taxpayers:
- **Multi-Item Invoice & Bill Builder**:
  - Add items with custom names, quantities, unit prices, and GST tax brackets (**0%, 5%, 12%, 18%, 28%**).
  - Toggle between **Tax-Inclusive** (MRP) and **Tax-Exclusive** pricing with automatic back-calculation.
- **Itemized Tax Breakdown**:
  - Real-time calculation of **Base Taxable Value**, **CGST**, **SGST**, and **IGST**.
- **Algorithmic Tax Reduction Advisory**:
  - Set a target ideal budget and choose an optimization strategy:
    - ⚖️ **Equal Reduction**: Spreads necessary cost cuts evenly across line items.
    - 📊 **Proportional Cut**: Reduces spend proportionally to each item's weight in the invoice.
    - 🎯 **Highest-Tax First**: Prioritizes trimming items under the highest tax brackets (e.g. 28% luxury items) to maximize tax savings.

---

### 5. 📱 SMS Engine — Zero-Leakage On-Device Ingestion
Real-time transaction tracking without linking bank APIs or sharing passwords:
- **100% On-Device Processing**:
  - Bank SMS messages are tokenized and parsed entirely within the local sandboxed environment.
  - **Raw SMS text never leaves the phone**. Only structured `{ amount, merchant, category, balance }` objects are processed.
- **Bank & UPI App Agnostic**:
  - Captures debit/credit alerts from **PhonePe, Google Pay, Paytm, BHIM, Navi, SuperMoney**, and bank credit/debit cards.
- **False-Positive Immunity**:
  - Advanced filters discard OTPs, balance inquiries, payment requests, bill reminders, and failed transactions to prevent false alerts.

---

### 6. 🤖 AI Forensics & Threat Detection
An intelligent backend analysis layer powered by Google Gemini:
- **Behavioral Anomaly Detection**: Highlights unexpected transaction spikes, recurring subscription price creep, and uncharacteristic transfers.
- **Verdict & Audit Flags**: Displays AI-generated advisory notes on suspicious transactions to protect against fraudulent UPI debits.

---

### 7. ⚙️ Settings, Sync & Appearance
- **Hybrid Storage Engine**:
  - Fast, offline-first local persistence powered by `Expo SecureStore` paired with secure cloud backup via `Supabase`.
- **Theming**:
  - High-contrast **Cyber Dark**, clean **Modern Light**, and responsive layouts optimized for both mobile phones and desktop widescreen viewports.
- **One-Tap Ledger Purge**:
  - Complete control over your data with one-click data clearance and account deletion.

---

## 🛠️ Tech Stack & Dependencies

```json
{
  "framework": "Expo SDK 57 (React Native 0.86)",
  "routing": "Expo Router v4 (File-based)",
  "language": "TypeScript 6.0",
  "data_parsing": "SheetJS (xlsx 0.18.5), Regex Tokenizers",
  "cloud_sync": "Supabase JS Client v2",
  "ai_forensics": "Google Gemini AI Engine",
  "animations": "React Native Reanimated 4.5 & Gesture Handler",
  "styling": "Custom Responsive Dynamic Theme Engine"
}
```

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) installed on your iOS or Android device

### 1. Clone the Repository
```bash
git clone https://github.com/Venkatasai200628/finapp.git
cd finapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_BACKEND_URL=https://finapp-07lp.onrender.com
# Optional: Supabase configuration for cloud backup
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start the Application
```bash
# Start local Metro bundler with LAN access for your physical phone
npx expo start --go --lan
```

Scan the generated QR code using the **Expo Go** app on Android or the **Camera** app on iOS (ensure your device is connected to the same Wi-Fi network).

---

## 🔒 Security & Privacy Guarantees

1. **Zero Credential Custody**: We never ask for, store, or transmit your NetBanking passwords, UPI PINs, or debit card CVVs.
2. **Local Sandboxing**: Parsing of Excel statements, CSV files, and SMS messages happens strictly in client memory.
3. **Transparent Audit Trail**: All code is open for review. What you see is exactly what runs on your phone.

---

## 📥 Download FinApp

Get the official Android APK directly on your device:

> 📲 **Download the App (Android APK):**  
> [![Download APK](https://img.shields.io/badge/Download_APK-Android_Build-22C55E?style=for-the-badge&logo=android&logoColor=white)](https://expo.dev/artifacts/eas/LMWN_2dTGVIrCkVvltUjptx9j0ihTH2sfjYT-t8S44s.apk)  
> 
> 🔗 **Direct Download URL:**  
> [https://expo.dev/artifacts/eas/LMWN_2dTGVIrCkVvltUjptx9j0ihTH2sfjYT-t8S44s.apk](https://expo.dev/artifacts/eas/LMWN_2dTGVIrCkVvltUjptx9j0ihTH2sfjYT-t8S44s.apk)

---

<div align="center">

**Built with precision for complete financial sovereignty.**  
Made by [Venkatasai](https://github.com/Venkatasai200628)

</div>
