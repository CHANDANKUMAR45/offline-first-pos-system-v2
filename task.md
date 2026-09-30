# Hybrid POS System — Task Checklist

- [/] **Phase 0 — Planning & Architecture**
  - [/] Create full implementation plan
  - [ ] Get user approval on plan

- [ ] **Phase 1 — Project Setup & Electron + React Integration**
  - [ ] Initialize npm project with Electron + Vite + React
  - [ ] Configure Electron main process (`main.js`, preload, IPC)
  - [ ] Verify dev & build workflows

- [ ] **Phase 2 — SQLite Database Layer**
  - [ ] Install `better-sqlite3`, create DB helper module
  - [ ] Define schemas (products, customers, sales, sale_items, payments)
  - [ ] Implement DAO (Data Access Object) layer with transactions

- [ ] **Phase 3 — POS Interface (Product Selection & Cart)**
  - [ ] Build product catalog grid/list with search
  - [ ] Build shopping cart with qty adjustment & pricing
  - [ ] Implement product CRUD management page

- [ ] **Phase 4 — Sales Logic & Inventory Updates**
  - [ ] Create sale + sale_items in a transaction
  - [ ] Auto-reduce stock on sale completion
  - [ ] Handle partial payments (paid / due tracking)

- [ ] **Phase 5 — Invoice Generation & Printing**
  - [ ] Design printable invoice template (HTML/CSS)
  - [ ] Implement Print & PDF export (jsPDF or window.print)
  - [ ] Link invoice to completed sale

- [ ] **Phase 6 — Sales History & Reporting**
  - [ ] Sales history table with date & customer filters
  - [ ] Summary dashboard (daily/weekly/monthly totals)
  - [ ] Export reports to CSV/PDF

- [ ] **Phase 7 — Customer & Due Management**
  - [ ] Customer CRUD with contact info
  - [ ] Due balance tracking per customer
  - [ ] Payment recording against dues

- [ ] **Phase 8 — Backend API (Node.js + Express + PostgreSQL)**
  - [ ] Setup Express project, connect to PostgreSQL (Supabase)
  - [ ] Build REST endpoints mirroring local schema
  - [ ] Add auth middleware (API key or JWT)

- [ ] **Phase 9 — Cloud Sync Mechanism**
  - [ ] Add `synced` flag to local tables
  - [ ] Implement connectivity check + sync service
  - [ ] Push unsynced records → mark synced on success
  - [ ] Handle conflict resolution

- [ ] **Phase 10 — Testing, Optimization & Polish**
  - [ ] Offline scenario testing
  - [ ] Data consistency & edge-case tests
  - [ ] Performance profiling & UI polish
  - [ ] Database backup/export utility
