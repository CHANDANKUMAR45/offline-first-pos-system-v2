# Hybrid POS System — Implementation Plan

A desktop POS application for a construction materials shop, built with **Electron + React + SQLite** locally and **Node.js + Express + PostgreSQL (Supabase)** in the cloud. The system prioritises offline-first operation, with cloud sync for backup and analytics.

---

## Project Directory Structure

```
Hybrid-POS-System/
├── electron/                 # Electron main process
│   ├── main.js               # App entry, window creation
│   ├── preload.js            # Secure IPC bridge
│   └── ipc-handlers.js       # IPC handler registrations
├── src/                      # React frontend (Vite)
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Root component + router
│   ├── components/           # Reusable UI components
│   │   ├── Layout/           # Sidebar, TopBar, Layout shell
│   │   ├── POS/              # ProductGrid, Cart, PaymentDialog
│   │   ├── Invoice/          # InvoiceTemplate, InvoicePrint
│   │   ├── Sales/            # SalesTable, SalesFilters
│   │   ├── Customers/        # CustomerList, CustomerForm, DueTracker
│   │   ├── Products/         # ProductForm, ProductTable
│   │   ├── Dashboard/        # StatCards, Charts
│   │   └── common/           # Button, Modal, Input, Table, Toast
│   ├── pages/                # Route-level page components
│   │   ├── POSPage.jsx
│   │   ├── SalesHistoryPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── SettingsPage.jsx
│   ├── hooks/                # Custom React hooks
│   ├── context/              # React contexts (Toast, Theme)
│   ├── utils/                # Helpers (formatCurrency, uuid, date)
│   └── assets/               # Logo, icons, fonts
├── database/                 # SQLite layer (runs in main process)
│   ├── connection.js         # Open/close DB, WAL mode
│   ├── migrations.js         # Schema creation & upgrades
│   └── dao/                  # Data Access Objects
│       ├── products.js
│       ├── sales.js
│       ├── customers.js
│       └── payments.js
├── services/                 # Business logic & sync
│   ├── sync.js               # Cloud sync engine
│   └── backup.js             # SQLite file export
├── backend/                  # Express cloud API (separate deploy)
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/               # Sequelize / Knex models
│   └── middleware/
├── public/                   # Static assets for Vite
├── index.html                # Vite HTML entry
├── vite.config.js
├── electron-builder.yml      # Packaging config
├── package.json
└── .env
```

---

## Phase 1 — Project Setup & Electron + React Integration

### Tooling
| Tool | Purpose |
|------|---------|
| **Vite** | Frontend bundler (fast HMR) |
| **React 18** | UI library |
| **React Router v6** | Client-side routing |
| **Electron 28+** | Desktop shell |
| **electron-builder** | Packaging & distribution |

### Steps

#### [NEW] `package.json`
- `npm init -y` → add `electron`, `vite`, `react`, `react-dom`, `react-router-dom`
- Scripts: `dev:react` (Vite), `dev:electron` (Electron pointing at Vite dev server), `dev` (concurrently), `build`, `package`

#### [NEW] `vite.config.js`
- Configure `base: './'` for Electron file:// loading in production

#### [NEW] `electron/main.js`
- Create `BrowserWindow`, load Vite dev URL or production `index.html`
- Register IPC handlers from `ipc-handlers.js`

#### [NEW] `electron/preload.js`
- Expose a `window.electronAPI` object via `contextBridge` with typed IPC invoke methods (e.g. `getProducts()`, `createSale()`)

#### [NEW] `index.html` + `src/main.jsx`
- Minimal React mount + React Router setup

---

## Phase 2 — SQLite Database Layer

### Schema

```sql
-- products
CREATE TABLE products (
  id            TEXT PRIMARY KEY,   -- UUID
  name          TEXT NOT NULL,
  category      TEXT,
  unit          TEXT DEFAULT 'pcs', -- pcs, kg, bag, ft, etc.
  price         REAL NOT NULL,
  cost_price    REAL DEFAULT 0,
  stock         REAL DEFAULT 0,
  low_stock_threshold REAL DEFAULT 5,
  barcode       TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  synced        INTEGER DEFAULT 0
);

-- customers
CREATE TABLE customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  total_due     REAL DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  synced        INTEGER DEFAULT 0
);

-- sales
CREATE TABLE sales (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT,
  subtotal      REAL NOT NULL,
  discount      REAL DEFAULT 0,
  tax           REAL DEFAULT 0,
  total         REAL NOT NULL,
  paid          REAL DEFAULT 0,
  due           REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status        TEXT DEFAULT 'completed',
  note          TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  synced        INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- sale_items
CREATE TABLE sale_items (
  id            TEXT PRIMARY KEY,
  sale_id       TEXT NOT NULL,
  product_id    TEXT NOT NULL,
  product_name  TEXT,
  quantity      REAL NOT NULL,
  unit_price    REAL NOT NULL,
  total         REAL NOT NULL,
  synced        INTEGER DEFAULT 0,
  FOREIGN KEY (sale_id)    REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- payments (for tracking due payments over time)
CREATE TABLE payments (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT NOT NULL,
  sale_id       TEXT,
  amount        REAL NOT NULL,
  method        TEXT DEFAULT 'cash',
  note          TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  synced        INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (sale_id)     REFERENCES sales(id)
);
```

### Steps

#### [NEW] `database/connection.js`
- Open `better-sqlite3` with WAL mode enabled
- Store DB file in `app.getPath('userData')`

#### [NEW] `database/migrations.js`
- Create all tables if not exists, with schema versioning via `PRAGMA user_version`

#### [NEW] `database/dao/*.js`
- Each DAO exports CRUD + query functions
- All write operations use `db.transaction()` for atomicity

---

## Phase 3 — POS Interface

### Components

#### [NEW] `src/pages/POSPage.jsx`
- Split layout: product grid on left, cart on right

#### [NEW] `src/components/POS/ProductGrid.jsx`
- Searchable, category-filterable product tiles
- Click to add to cart

#### [NEW] `src/components/POS/Cart.jsx`
- Line items with ±qty, price, row total
- Subtotal, discount input, tax, grand total
- Customer selector (optional)
- **Checkout** button → opens `PaymentDialog`

#### [NEW] `src/components/POS/PaymentDialog.jsx`
- Input paid amount → auto-calculate change/due
- Payment method selector (cash / card / mobile)
- Confirm → create sale → print invoice

---

## Phase 4 — Sales Logic & Inventory

#### [MODIFY] `database/dao/sales.js`
- `createSale(saleData, items)` — inside a transaction:
  1. INSERT into `sales`
  2. INSERT each item into `sale_items`
  3. UPDATE `products` stock (decrement by qty)
  4. If customer selected & due > 0, UPDATE `customers.total_due`

#### IPC flow
1. Renderer calls `window.electronAPI.createSale(payload)`
2. Preload forwards to main via `ipcRenderer.invoke('sale:create', payload)`
3. Main calls DAO → returns result → renderer shows invoice

---

## Phase 5 — Invoice Generation & Printing

#### [NEW] `src/components/Invoice/InvoiceTemplate.jsx`
- Company name, address, logo
- Sale details: date, invoice #, customer
- Item table, totals
- Footer / notes

#### Printing strategy
- Use a hidden `<iframe>` or `window.print()` targeting the invoice HTML
- **PDF export**: use `jsPDF` + `html2canvas` or Electron's `webContents.printToPDF()`

---

## Phase 6 — Sales History & Reporting

#### [NEW] `src/pages/SalesHistoryPage.jsx`
- Paginated sales table (date, customer, total, paid, due, status)
- Filters: date range picker, customer dropdown, status
- Click row → view invoice

#### [NEW] `src/pages/DashboardPage.jsx`
- Stat cards: today's sales, weekly revenue, total due, low-stock count
- Charts (recharts): sales trend line, top products bar chart

---

## Phase 7 — Customer & Due Management

#### [NEW] `src/pages/CustomersPage.jsx`
- Customer table with search
- Add / edit customer form (name, phone, address)
- Click customer → detail view with due history

#### [NEW] `src/components/Customers/DueTracker.jsx`
- List of unpaid sales for customer
- Record payment → updates `payments` table + recalculates `customers.total_due`

---

## Phase 8 — Backend API (Cloud)

### Tech
| Tool | Purpose |
|------|---------|
| Express | HTTP API |
| PostgreSQL (Supabase) | Cloud database |
| Knex.js | Query builder + migrations |
| JWT / API Key | Authentication |

#### [NEW] `backend/server.js` + routes
- `POST /api/sync/products` — bulk upsert
- `POST /api/sync/sales` — bulk upsert
- `POST /api/sync/customers` — bulk upsert
- `POST /api/sync/payments` — bulk upsert
- `GET  /api/dashboard` — aggregated cloud stats
- Auth middleware validates JWT/API key on every request

---

## Phase 9 — Cloud Sync Mechanism

#### [NEW] `services/sync.js`
1. Check connectivity (`navigator.onLine` + ping Supabase)
2. Query local tables WHERE `synced = 0`
3. Batch POST to backend API
4. On success → UPDATE `synced = 1` for pushed rows
5. Schedule via `setInterval` (every 5 min) + manual trigger button

#### Conflict handling (v1)
- **Local-wins**: cloud is treated as a backup mirror; local is always authoritative
- Future enhancement: timestamp-based merge

---

## Phase 10 — Testing, Optimisation & Polish

| Area | Approach |
|------|----------|
| **Offline** | Toggle network in DevTools → create sale → verify DB writes |
| **Data integrity** | Create sale → check products stock, customer due, sale_items all consistent |
| **Sync** | Add records offline → reconnect → verify cloud has all records |
| **Performance** | Profile slow queries with `EXPLAIN QUERY PLAN`, add indexes |
| **UI polish** | Keyboard shortcuts, responsive sidebar, dark mode toggle |
| **Backup** | Copy SQLite file to user-selected folder |

---

## UI Design Direction

- **Dark sidebar** with icon + text nav links
- **Light/dark mode** toggle (CSS variables)
- **Color palette**: deep blue primary (`#1E3A5F`), teal accent (`#0EA5E9`), warm grays
- **Typography**: Inter (Google Fonts)
- **Micro-animations**: button hover scale, page fade transitions, toast slide-in
- Glassmorphism cards on the dashboard

---

## Verification Plan

### Automated (post each phase)
```bash
# Phase 1 — Electron + React launch
npm run dev          # Verify window opens with React app
npm run build        # Verify production build succeeds

# Phase 2 — Database
# Write a scratch script: node database/test-dao.js
# Insert product → query → verify returned
# Create sale with items → verify stock decremented

# Phase 8 — Backend
cd backend && npm test   # If we add Jest/Supertest API tests
```

### Manual Verification (by user)
1. **POS flow**: Open app → add products to cart → checkout → verify invoice prints correctly
2. **Offline test**: Disconnect network → complete a sale → reconnect → verify sync pushes data
3. **Customer dues**: Create sale with partial payment → go to customer page → verify due balance → record payment → verify balance updates
4. **Sales history**: Complete multiple sales → open history page → filter by date / customer → verify correct results

> [!IMPORTANT]
> Since this is a brand-new project with no existing tests, all verification in early phases will be **manual in-app testing** plus **scratch scripts** for the database layer. We will add structured tests (Jest + Supertest) when the backend API is built in Phase 8.

---

## Implementation Order Summary

| Phase | Depends On | Est. Effort |
|-------|-----------|-------------|
| 1. Project Setup | — | Small |
| 2. Database Layer | Phase 1 | Medium |
| 3. POS Interface | Phase 1 | Large |
| 4. Sales Logic | Phase 2 + 3 | Medium |
| 5. Invoice | Phase 4 | Medium |
| 6. Sales History | Phase 4 | Medium |
| 7. Customer Mgmt | Phase 2 | Medium |
| 8. Backend API | — (parallel) | Medium |
| 9. Cloud Sync | Phase 2 + 8 | Medium |
| 10. Testing & Polish | All | Medium |
