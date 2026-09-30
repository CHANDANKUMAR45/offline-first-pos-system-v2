<div align="center">

# 🏗️ Hybrid POS System

### Offline- Point of Sale for Construction Materials Shops

A modern, cross-platform desktop POS application built with **Electron**, **React**, **SQLite**, and **PostgreSQL** cloud sync — engineered for uninterrupted retail operations with or without an internet connection.

[![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Submission Readiness](#-submission-readiness)
- [The Problem & Motivation](#-the-problem--motivation)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack & Why Each Was Chosen](#-tech-stack--why-each-was-chosen)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Cloud Sync Mechanism](#-cloud-sync-mechanism)
- [Modules in Detail](#-modules-in-detail)
- [Current Status & Roadmap](#-current-status--roadmap)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✅ Submission Readiness

This project is a working MVP for a hybrid POS system and is suitable for a live demonstration or portfolio submission. It includes the core workflow for offline sales, stock management, customer dues, invoice generation, and cloud synchronization logic.

The app has been validation-tested by running the production build successfully. For final submission, the project should still be presented with a short demo walkthrough and environment setup notes, but the codebase is already far beyond a basic prototype.

---

## 🧾 About the Project

**Hybrid POS System** is a full-featured desktop Point of Sale application purpose-built for **construction materials shops** (hardware stores, building supply retailers, etc.). It handles billing, invoicing, inventory management, customer CRM with due tracking, and cloud data synchronization — all from a single, installable desktop application.

The word **"Hybrid"** captures the core design philosophy:

| Dimension | Hybrid Approach |
|-----------|----------------|
| **Data Storage** | Local SQLite for speed & offline reliability **+** Cloud PostgreSQL for backup & analytics |
| **Connectivity** | Works 100% offline **→** auto-syncs when internet is available |
| **Architecture** | Desktop-native Electron shell **+** Modern React SPA inside |
| **Target** | Built as a real business tool **and** a high-quality portfolio/SaaS-ready project |

Every transaction — from creating a sale to generating an invoice — is processed **locally first** against the embedded SQLite database. This guarantees uninterrupted operation even during network outages, power fluctuations, or ISP downtime — scenarios that are common in shop environments.

---

## 🎯 The Problem & Motivation

Small to medium construction materials shops face unique challenges that most off-the-shelf POS systems don't address well:

1. **Unreliable Internet** — Shops in many regions deal with frequent connectivity drops. A cloud-only POS becomes useless the moment the internet goes down, leaving the shop unable to process sales.

2. **Complex Unit Sales** — Construction materials are sold in varied units (pieces, kilograms, bags, feet, cubic feet, etc.), not just simple integer quantities. The system needs to support fractional/real-number quantities.

3. **Heavy "Due" Culture** — A significant portion of sales in this industry involve partial payments with outstanding dues. Contractors and regular customers frequently buy on credit and pay later in installments. Tracking this is essential.

4. **Walk-in vs. CRM Customers** — Shops serve both regular customers (who need CRM tracking, due management, purchase history) and anonymous walk-in customers who should be logged but not mixed into the CRM.

5. **Need for Data Backup** — Even though the shop runs offline-first, owners want their data backed up to the cloud so they don't lose everything if the local machine fails.

6. **Cost Sensitivity** — Expensive SaaS subscriptions with monthly fees are often not viable. A one-time installable desktop app with optional cloud features is the sweet spot.

This project was built to solve all of these problems with a clean, modern architecture.

---

## ✨ Key Features

### 🛒 Point of Sale (POS)
- Split-screen layout: searchable product grid on the left, live cart on the right
- Category-based filtering and real-time product search
- Adjustable quantities (supports both direct input and ±1 controls)
- Discount and tax calculations on the fly
- Optional customer attachment (permanent CRM customer or walk-in)
- Multi-method checkout: Cash, Card, Mobile/Digital

### 🧾 Invoice & Printing
- Professional invoice template with shop branding
- Itemized line items, subtotals, discounts, taxes, and grand total
- Customer info, payment breakdown (paid / due / change)
- Walk-in customer tagging with `(Walk-in)` label
- Direct print and PDF export via `jsPDF` + `html2canvas`

### 📦 Inventory Management
- Full product CRUD (Create, Read, Update, Delete)
- Support for multiple units: pcs, kg, bag, ft, etc.
- Track cost price vs. selling price
- Low stock threshold alerts
- Automatic stock decrement on sale completion

### 👥 Customer Management (CRM)
- Permanent customer database with name, phone, email, address
- Separate **Walk-In Name Logs** — walk-in customers are tagged with `__WALKIN__` and displayed in their own tab
- Due balance tracking per customer
- Payment recording against outstanding dues
- Full purchase history and invoice viewing per customer

### 💰 Sales History & Reporting
- Paginated, filterable sales history table
- Filter by: date range, customer, payment status
- Click any sale to view or reprint its invoice
- Dashboard with stat cards: today's sales, weekly revenue, total outstanding dues, low-stock alerts
- Visual analytics charts powered by **Recharts** (sales trends, top products)

### ☁️ Cloud Sync
- Offline-first: all operations work without internet
- Background sync pushes unsynced records to the cloud PostgreSQL database
- Sync uses a `synced` flag on every record (0 = pending, 1 = pushed)
- Manual sync trigger + automatic interval-based sync
- API-key authenticated endpoints for secure data transfer
- **Local-wins** conflict strategy: local database is always authoritative

### ⚙️ Settings & Configuration
- Cloud sync configuration
- Database backup/export functionality
- Application preferences

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON SHELL                          │
│  ┌───────────────────────┐    ┌──────────────────────────────┐ │
│  │   Main Process        │    │   Renderer Process (React)   │ │
│  │                       │    │                              │ │
│  │  ┌─────────────────┐  │    │  ┌────────┐  ┌───────────┐  │ │
│  │  │  IPC Handlers   │◄─┼────┼──│Preload │  │   React   │  │ │
│  │  └────────┬────────┘  │    │  │ Bridge │  │    App    │  │ │
│  │           │           │    │  └────────┘  └───────────┘  │ │
│  │  ┌────────▼────────┐  │    │    Pages: Dashboard, POS,   │ │
│  │  │  Sync Service   │  │    │    Products, Sales, CRM,    │ │
│  │  └────────┬────────┘  │    │    Settings                 │ │
│  │           │           │    └──────────────────────────────┘ │
│  │  ┌────────▼────────┐  │                                     │
│  │  │  Database Layer  │  │                                     │
│  │  │  (better-sqlite3)│  │                                     │
│  │  │  ┌────────────┐ │  │                                     │
│  │  │  │   DAOs     │ │  │                                     │
│  │  │  │ Products   │ │  │                                     │
│  │  │  │ Sales      │ │  │                                     │
│  │  │  │ Customers  │ │  │                                     │
│  │  │  │ Payments   │ │  │                                     │
│  │  │  │ Sync       │ │  │                                     │
│  │  │  └────────────┘ │  │                                     │
│  │  └─────────────────┘  │                                     │
│  └───────────────────────┘                                     │
└────────────────────────────────────────┬────────────────────────┘
                                         │ HTTP (when online)
                                         ▼
                    ┌────────────────────────────────────┐
                    │         CLOUD BACKEND              │
                    │    Express.js + PostgreSQL          │
                    │                                    │
                    │  /api/sync/push   (bulk upsert)    │
                    │  /api/web/*       (read-only web)  │
                    │  /health          (healthcheck)    │
                    │                                    │
                    │  Auth: API Key middleware           │
                    └────────────────────────────────────┘
```

### Data Flow

1. **User interacts** with the React frontend (renderer process)
2. React calls methods on `window.electronAPI` (exposed via **preload.js** context bridge)
3. Preload forwards requests through **IPC** to the Electron main process
4. Main process **IPC handlers** call the appropriate **DAO** (Data Access Object)
5. DAOs execute **SQLite** queries using `better-sqlite3` with transactions for atomicity
6. Results flow back through IPC → preload → React for UI updates
7. A background **sync service** periodically pushes `synced=0` records to the cloud backend

---

## 🛠️ Tech Stack & Why Each Was Chosen

### Desktop Shell

| Technology | Version | Why It Was Chosen |
|-----------|---------|-------------------|
| **Electron** | 41.x | Provides a native desktop experience while letting us build the UI with web technologies. Gives access to OS-level APIs (file system, printing, native menus) that a browser app can't provide. Enables offline-first architecture with an embedded database. |
| **electron-builder** | 26.x | Industry-standard tool for packaging Electron apps into distributable `.exe` installers (NSIS for Windows). Handles code signing, auto-updates, and multi-platform builds. |

### Frontend

| Technology | Version | Why It Was Chosen |
|-----------|---------|-------------------|
| **React** | 19.x | Component-based architecture makes it easy to build and maintain complex UI with multiple pages (POS, Dashboard, CRM, etc.). Massive ecosystem and community support. |
| **React Router** | 7.x | Client-side routing for seamless page navigation within the single-window Electron app without full page reloads. |
| **Vite** | 8.x | Blazing-fast HMR (Hot Module Replacement) during development, significantly faster than Webpack. Near-instant dev server startup. Produces optimized production bundles. |
| **Recharts** | 3.x | React-native charting library for the dashboard analytics (sales trends, top products). Declarative API that integrates naturally with React's component model. |
| **Lucide React** | 0.577.x | Modern, clean icon library. Provides consistent, customizable SVG icons across the entire UI (sidebar, buttons, status indicators). |
| **html2canvas** | 1.x | Captures the invoice template as a canvas image for PDF generation. Works entirely client-side, no server needed. |
| **jsPDF** | 4.x | Generates PDF documents from the canvas capture. Used together with html2canvas for client-side invoice PDF export. |
| **UUID** | 13.x | Generates universally unique identifiers for every record (products, sales, customers, etc.). Critical for the sync architecture — ensures IDs never collide between local and cloud databases. |

### Local Database

| Technology | Version | Why It Was Chosen |
|-----------|---------|-------------------|
| **better-sqlite3** | 12.x | Synchronous, embedded SQLite binding for Node.js. Chosen over `sqlite3` (async) because synchronous operations are simpler, faster, and more reliable for a desktop app where all DB access is on the main process. WAL (Write-Ahead Logging) mode enabled for concurrent read performance. |

### Cloud Backend

| Technology | Version | Why It Was Chosen |
|-----------|---------|-------------------|
| **Express.js** | 5.x | Minimal, unopinionated Node.js web framework. Perfect for building the sync API endpoints without unnecessary overhead. |
| **PostgreSQL** (via `pg`) | 8.x | Battle-tested relational database for the cloud backend. Supports UUID natively, handles concurrent upserts well. Compatible with managed services like Supabase, Neon, or Railway for easy deployment. |
| **CORS** | 2.x | Enables cross-origin requests from the Electron dev server during development. |
| **dotenv** | 17.x | Loads environment variables (database URLs, API keys) from `.env` files. Keeps secrets out of source code. |

### Development Tooling

| Technology | Purpose |
|-----------|---------|
| **concurrently** | Runs Vite dev server and Electron simultaneously with a single `npm run dev` command |
| **electron-rebuild** | Recompiles native Node modules (like `better-sqlite3`) against Electron's version of Node.js |
| **wait-on** | Ensures the Vite dev server is ready before Electron launches (prevents blank window on startup) |

---

## 📁 Project Structure

```
Hybrid-POS-System/
│
├── electron/                       # Electron main process
│   ├── main.js                     # App entry, BrowserWindow creation
│   ├── preload.js                  # Secure IPC bridge (contextBridge)
│   ├── ipc-handlers.js             # All IPC handler registrations
│   ├── sync-service.js             # Cloud sync engine (push logic)
│   └── dev-runner.js               # Dev script: waits for Vite, then launches Electron
│
├── src/                            # React frontend (Vite)
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Root component + route definitions
│   ├── index.css                   # Global styles & design tokens
│   ├── config/                     # App configuration
│   ├── pages/                      # Route-level page components
│   │   ├── DashboardPage.jsx       # Analytics dashboard with charts & stat cards
│   │   ├── POSPage.jsx             # Main point-of-sale checkout interface
│   │   ├── ProductsPage.jsx        # Product inventory management
│   │   ├── SalesHistoryPage.jsx    # Sales history with filters
│   │   ├── CustomersPage.jsx       # Customer CRM + walk-in logs
│   │   └── SettingsPage.jsx        # App settings & sync configuration
│   └── components/                 # Reusable UI components
│       ├── Layout/                 # Sidebar, TopBar, Layout shell
│       ├── POS/                    # ProductGrid, Cart, PaymentDialog
│       ├── Invoice/                # InvoiceTemplate for print/PDF
│       ├── Customers/              # CustomerForm, PaymentForm
│       └── Products/               # ProductForm
│
├── database/                       # SQLite layer (runs in Electron main process)
│   ├── connection.js               # DB connection with WAL mode
│   ├── migrations.js               # Schema creation & versioning
│   └── dao/                        # Data Access Objects
│       ├── products.js             # Product CRUD operations
│       ├── sales.js                # Sale creation with transaction support
│       ├── customers.js            # Customer CRUD + due calculations
│       ├── payments.js             # Payment recording & history
│       └── sync.js                 # Unsynced data queries & mark-as-synced
│
├── backend/                        # Express cloud API (separate deployment)
│   ├── server.js                   # Express app entry point
│   ├── db.js                       # PostgreSQL connection pool
│   ├── init.sql                    # Cloud database schema (PostgreSQL)
│   ├── setup_db.js                 # Database initialization script
│   ├── routes/
│   │   ├── sync.js                 # Sync push endpoint (bulk upsert)
│   │   └── web.js                  # Read-only web API routes
│   ├── middleware/
│   │   └── auth.js                 # API key verification middleware
│   └── .env.example                # Environment variables template
│
├── index.html                      # Vite HTML entry
├── vite.config.js                  # Vite configuration
├── package.json                    # Dependencies & scripts
└── .gitignore
```

---

## 🗄️ Database Schema

The application uses **5 core tables** with a consistent design pattern — every table includes a `synced` flag (local SQLite only) to track cloud sync status.

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   products   │       │   customers  │       │   payments   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (UUID PK) │       │ id (UUID PK) │◄──────│ customer_id  │
│ name         │       │ name         │       │ sale_id (FK) │
│ category     │       │ phone        │       │ amount       │
│ unit         │       │ email        │       │ method       │
│ price        │       │ address      │       │ note         │
│ cost_price   │       │ total_due    │       │ created_at   │
│ stock        │       │ created_at   │       │ synced       │
│ low_stock    │       │ updated_at   │       └──────────────┘
│ barcode      │       │ synced       │
│ created_at   │       └──────┬───────┘
│ updated_at   │              │
│ synced       │              │
└──────┬───────┘              │
       │                      │
       │         ┌────────────┴──────────────┐
       │         │          sales            │
       │         ├───────────────────────────┤
       │         │ id (UUID PK)              │
       │         │ customer_id (FK) ─────────┘
       │         │ subtotal, discount, tax
       │         │ total, paid, due
       │         │ payment_method, status
       │         │ note, created_at, synced
       │         └─────────────┬─────────────┘
       │                       │
       │         ┌─────────────┴─────────────┐
       │         │       sale_items           │
       │         ├───────────────────────────┤
       └─────────│ product_id (FK)           │
                 │ sale_id (FK) ─────────────┘
                 │ product_name, quantity
                 │ unit_price, total, synced
                 └───────────────────────────┘
```

### Key Design Decisions

- **UUID primary keys** — Ensures globally unique IDs so local and cloud records never collide during sync
- **`synced` flag on every table** — Simple but effective sync tracking. `0` = unsynced, `1` = pushed to cloud
- **`total_due` on customers** — Denormalized for fast display; recalculated when payments are recorded
- **`REAL` quantities** — Supports fractional units (e.g., 2.5 kg of cement, 10.75 ft of pipe)
- **WAL mode** — SQLite Write-Ahead Logging for better concurrent read performance

---

## ☁️ Cloud Sync Mechanism

```
Local (SQLite)                              Cloud (PostgreSQL)
┌─────────────┐     HTTP POST               ┌─────────────────┐
│  Records    │     /api/sync/push          │   PostgreSQL    │
│  synced = 0 │ ──────────────────────────► │   (Supabase /   │
│             │     Payload: {              │    Neon /        │
│             │       products: [...],      │    Railway)      │
│             │       sales: [...],         │                  │
│             │       customers: [...],     │  Bulk UPSERT     │
│             │       sale_items: [...],    │  via ON CONFLICT │
│             │       payments: [...]       │                  │
│             │     }                       │                  │
│             │                             │                  │
│  On success │     ◄── { success: true }   │                  │
│  synced = 1 │                             │                  │
└─────────────┘                             └─────────────────┘
```

- **Local-wins strategy**: The local SQLite database is always the source of truth. Cloud is treated as a backup mirror.
- **Batch push**: All unsynced records across all tables are collected and pushed in a single HTTP request.
- **API key auth**: Every sync request includes an `x-api-key` header verified by the backend middleware.
- **Electron `net` module**: Uses Electron's native networking (not Axios/fetch) to avoid extra dependencies and respect system proxy settings.
- Sync runs at startup, when connectivity returns, and every 30 seconds while the app is open. Failed batches remain pending in SQLite.
- Sync is currently local-to-cloud only; it does not download changes made by other devices.

### Production desktop build

Run `npm install`, `npm run dev`, `npm test`, then `npm run package` on Windows x64. The installer is written to `release/Hybrid-POS-Setup-1.0.0.exe` (version follows `package.json`). The assisted NSIS installer creates Start Menu and Desktop shortcuts and leaves the user-data directory intact on uninstall. SQLite is stored under Electron's `userData` directory, outside the installed app.

Packaged sync requires `CLOUD_API_URL` to point to a deployed HTTPS API and `SYNC_API_KEY` to be available in the installed app's Windows process environment. The development localhost URL and development API key are never used in packaged builds. There is not yet an in-app cloud setup screen, so sync remains local-only until an administrator configures those variables. Do not distribute a shared production API key in the installer; the current backend's shared-key authentication should be replaced or provisioned per installation before commercial deployment. Backend deployment also requires a PostgreSQL `DATABASE_URL` and matching `SYNC_API_KEY`; production TLS certificate validation is enabled.

---

## 📦 Modules in Detail

### 🏠 Dashboard
The landing page provides an at-a-glance overview of business performance:
- **Stat cards**: Today's sales, weekly revenue, total outstanding dues, low-stock product count
- **Sales trend chart**: Line chart showing revenue over time
- **Top products chart**: Bar chart for best-selling items
- Powered by **Recharts** with glassmorphism-styled cards

### 🛒 POS (Point of Sale)
The core checkout interface, designed for speed:
- **Left panel**: Searchable product grid with category filtering
- **Right panel**: Live shopping cart with line items
- Supports quantity adjustments (direct input for bulk, ±1 buttons)
- Customer selector with walk-in option
- Checkout opens a **PaymentDialog** for payment method selection, amount entry, and auto-calculated change/due
- On completion: creates sale record, decrements inventory, updates customer dues, generates printable invoice

### 📦 Products (Inventory)
Full product lifecycle management:
- Add, edit, and delete products
- Fields: name, category, unit type, selling price, cost price, stock quantity, low stock threshold, barcode
- Tabular view with search and filtering

### 📊 Sales History
Historical transaction records:
- Paginated table with date, customer, total, paid, due, and status columns
- Filterable by date range, customer, and payment status
- Click any row to view or reprint the original invoice

### 👥 Customers
Dual-mode customer management:
- **CRM Tab**: Permanent customers with full profiles, due tracking, payment history, and purchase invoice viewing
- **Walk-In Logs Tab**: Anonymous walk-in customers tagged with `__WALKIN__`, displayed separately with invoice viewing capability
- Record payments against outstanding dues
- View all past invoices for any customer

### ⚙️ Settings
Application configuration:
- Cloud sync settings and manual sync trigger
- Database backup and export
- General preferences

---

## 📈 Current Status & Roadmap

### ✅ Completed

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project Setup — Electron + React + Vite integration | ✅ Done |
| Phase 2 | SQLite Database Layer — Schema, connection, DAOs | ✅ Done |
| Phase 3 | POS Interface — Product grid, cart, payment dialog | ✅ Done |
| Phase 4 | Sales Logic — Transaction creation, stock updates, due tracking | ✅ Done |
| Phase 5 | Invoice Generation — Template, print, PDF export | ✅ Done |
| Phase 6 | Sales History — Paginated table, filters, invoice viewing | ✅ Done |
| Phase 7 | Customer & Due Management — CRM, walk-in logs, payment recording | ✅ Done |
| Phase 8 | Cloud Backend API — Express + PostgreSQL sync endpoints | ✅ Done |
| Phase 9 | Cloud Sync — Push mechanism, sync flags, status tracking | ✅ Done |

### 🔧 In Progress / Planned

| Feature | Description | Status |
|---------|-------------|--------|
| Phase 10 | Testing, Optimization & Polish | 🔧 In Progress |
| Barcode Scanning | Hardware barcode scanner integration | 📋 Planned |
| Dark Mode | Full light/dark theme toggle | 📋 Planned |
| Keyboard Shortcuts | Speed up POS operations for power users | 📋 Planned |
| Multi-user Auth | Login system with role-based access (admin, cashier) | 📋 Planned |
| Advanced Analytics | Profit margins, customer insights, seasonal trends | 📋 Planned |
| Auto-updates | OTA updates via electron-updater | 📋 Planned |
| Multi-branch Support | Manage multiple shop locations | 🔮 Future |
| Mobile Access | Web/mobile companion app for on-the-go monitoring | 🔮 Future |
| SaaS Conversion | Multi-tenant cloud architecture for commercial release | 🔮 Future |

---

## 📸 Screenshots

> 🚧 *Screenshots will be added soon as the UI polish phase is completed.*

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for real-world shop operations**

*Hybrid POS System — Because your business shouldn't stop when the internet does.*

</div>
