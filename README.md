# SALES POS — Master Specification & Design Document

## 1. System Overview
**SALES POS** is a high-performance, offline-first mobile Point of Sale system specifically engineered for retail environments using 58mm thermal printers. It provides a seamless experience for inventory management, transaction tracking, and hardware integration, even in restricted environments like native shells (Median.co).

## 2. Tech Stack & Architecture
- **Framework**: React 19 (ESM)
- **Styling**: Tailwind CSS (Custom "Shopee Orange" Theme)
- **Database**: IndexedDB (via `idb`) for 100% offline persistence.
- **Icons**: Lucide React
- **PDF Engine**: jsPDF
- **Hardware Protocol**: Hybrid ESC/POS (Web Bluetooth + RawBT Intent)

## 3. Design Philosophy
### Visual Identity
- **Primary Color**: `#f97316` (Shopee Orange) — chosen for high visibility and brand energy.
- **Typography**: Professional 8.5pt mono-spaced formatting for receipts to ensure maximum readability on low-DPI thermal paper.
- **UX Strategy**: Mobile-first bottom navigation, oversized touch targets for rapid entry, and real-time balance calculations for partial payments.

## 4. Hardware & Printing Specification
The system implements a **Dual-Path Printing Strategy** to overcome browser and shell restrictions:

### Path A: Web Bluetooth (Standard Browsers)
- Direct GATT communication with thermal printers.
- Supports generic ESC/POS hardware through broad service UUID discovery.
- Requires explicit user permission via the "Scan & Link" workflow.

### Path B: RawBT Intent (Native Shells / Median.co)
- Specifically designed for native wrappers and restricted WebViews.
- Bypasses the `navigator.bluetooth` restriction by delegating print jobs to the local `rawbt:` intent protocol.
- Ensures reliability on Android-based mobile POS hardware.

## 5. Feature Modules
### Sales & Checkout
- **Payment Modes**: 
  - *Full*: Automatic total calculation with change-due logic.
  - *Partial*: Real-time balance tracking.
  - *Loan*: Debt-only transactions linked to customer profiles.
- **Manual Price Override**: Allows vendors to adjust totals on-the-fly without changing the master inventory price.

### Inventory Management
- Full CRUD capabilities.
- Bulk Import/Export via JSON.
- Professional PDF inventory reporting with profit estimation.

### Admin Dashboard
- Daily revenue analytics.
- "Cash Collected" vs "Sales Revenue" tracking (differentiates between actual cash on hand and loans).
- Loan repayment manager with transaction history updates.

## 6. Environment Specifics
- **Offline Functionality**: All data is stored locally. No cloud sync is required for core operations.
- **Median.co Optimization**: Explicit fallback to Intent-based printing when the Web Bluetooth API is unavailable in the native shell.

---
*Developed by Ariser Dev — ariserdev@gmail.com*
