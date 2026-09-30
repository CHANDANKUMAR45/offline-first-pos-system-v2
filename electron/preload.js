const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Products ──
  getProducts: (filters) => ipcRenderer.invoke('products:getAll', filters),
  getProductById: (id) => ipcRenderer.invoke('products:getById', id),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  searchProducts: (query) => ipcRenderer.invoke('products:search', query),

  // ── Customers ──
  getCustomers: (filters) => ipcRenderer.invoke('customers:getAll', filters),
  getCustomerById: (id) => ipcRenderer.invoke('customers:getById', id),
  createCustomer: (data) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('customers:update', id, data),
  deleteCustomer: (id) => ipcRenderer.invoke('customers:delete', id),
  searchCustomers: (query) => ipcRenderer.invoke('customers:search', query),

  // ── Sales ──
  createSale: (saleData, items) => ipcRenderer.invoke('sales:create', saleData, items),
  getSales: (filters) => ipcRenderer.invoke('sales:getAll', filters),
  getSaleById: (id) => ipcRenderer.invoke('sales:getById', id),
  getSalesByCustomer: (customerId) => ipcRenderer.invoke('sales:getByCustomer', customerId),

  // ── Payments ──
  recordPayment: (data) => ipcRenderer.invoke('payments:create', data),
  getPaymentsByCustomer: (customerId) => ipcRenderer.invoke('payments:getByCustomer', customerId),
  getPaymentsBySale: (saleId) => ipcRenderer.invoke('payments:getBySale', saleId),

  // ── Dashboard ──
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),

  // ── Sync ──
  triggerSync: () => ipcRenderer.invoke('sync:trigger'),
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),

  // ── Backup ──
  exportDatabase: (destPath) => ipcRenderer.invoke('backup:export', destPath),

  // ── Utilities ──
  printInvoice: (html) => ipcRenderer.invoke('utils:print', html),
});
