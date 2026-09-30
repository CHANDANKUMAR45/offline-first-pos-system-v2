/**
 * IPC Handler Registration
 * 
 * Each handler is registered here and delegates to the DAO layer.
 * DAO modules will be implemented in Phase 2.
 * For now, handlers return placeholder responses so the app can boot.
 */

function registerIpcHandlers(ipcMain) {
  // ── Products ──
  ipcMain.handle('products:getAll', async (event, filters) => {
    try {
      const { getAllProducts } = require('../database/dao/products');
      return { success: true, data: getAllProducts(filters) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:getById', async (event, id) => {
    try {
      const { getProductById } = require('../database/dao/products');
      return { success: true, data: getProductById(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:create', async (event, data) => {
    try {
      const { createProduct } = require('../database/dao/products');
      return { success: true, data: createProduct(data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:update', async (event, id, data) => {
    try {
      const { updateProduct } = require('../database/dao/products');
      return { success: true, data: updateProduct(id, data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:delete', async (event, id) => {
    try {
      const { deleteProduct } = require('../database/dao/products');
      return { success: true, data: deleteProduct(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:search', async (event, query) => {
    try {
      const { searchProducts } = require('../database/dao/products');
      return { success: true, data: searchProducts(query) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Customers ──
  ipcMain.handle('customers:getAll', async (event, filters) => {
    try {
      const { getAllCustomers } = require('../database/dao/customers');
      return { success: true, data: getAllCustomers(filters) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('customers:getById', async (event, id) => {
    try {
      const { getCustomerById } = require('../database/dao/customers');
      return { success: true, data: getCustomerById(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('customers:create', async (event, data) => {
    try {
      const { createCustomer } = require('../database/dao/customers');
      return { success: true, data: createCustomer(data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('customers:update', async (event, id, data) => {
    try {
      const { updateCustomer } = require('../database/dao/customers');
      return { success: true, data: updateCustomer(id, data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('customers:delete', async (event, id) => {
    try {
      const { deleteCustomer } = require('../database/dao/customers');
      return { success: true, data: deleteCustomer(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('customers:search', async (event, query) => {
    try {
      const { searchCustomers } = require('../database/dao/customers');
      return { success: true, data: searchCustomers(query) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Sales ──
  ipcMain.handle('sales:create', async (event, saleData, items) => {
    try {
      const { createSale } = require('../database/dao/sales');
      return { success: true, data: createSale(saleData, items) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sales:getAll', async (event, filters) => {
    try {
      const { getAllSales } = require('../database/dao/sales');
      return { success: true, data: getAllSales(filters) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sales:getById', async (event, id) => {
    try {
      const { getSaleById } = require('../database/dao/sales');
      return { success: true, data: getSaleById(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sales:getByCustomer', async (event, customerId) => {
    try {
      const { getSalesByCustomer } = require('../database/dao/sales');
      return { success: true, data: getSalesByCustomer(customerId) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Payments ──
  ipcMain.handle('payments:create', async (event, data) => {
    try {
      const { createPayment } = require('../database/dao/payments');
      return { success: true, data: createPayment(data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('payments:getByCustomer', async (event, customerId) => {
    try {
      const { getPaymentsByCustomer } = require('../database/dao/payments');
      return { success: true, data: getPaymentsByCustomer(customerId) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('payments:getBySale', async (event, saleId) => {
    try {
      const { getPaymentsBySale } = require('../database/dao/payments');
      return { success: true, data: getPaymentsBySale(saleId) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Dashboard ──
  ipcMain.handle('dashboard:getStats', async () => {
    try {
      const { getDashboardStats } = require('../database/dao/sales');
      return { success: true, data: getDashboardStats() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Sync (Phase 9) ──
  ipcMain.handle('sync:trigger', async () => {
    try {
      const { triggerSync } = require('./sync-service');
      return await triggerSync();
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sync:status', async () => {
    try {
      const { getSyncStatus } = require('./sync-service');
      return { success: true, data: getSyncStatus() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Backup (Phase 10) ──
  ipcMain.handle('backup:export', async () => {
    try {
      const { dialog } = require('electron');
      const { getDbConnection } = require('../database/connection');

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Backup Hybrid POS Database',
        defaultPath: `pos_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      });

      if (!canceled && filePath) {
        await getDbConnection().backup(filePath);
        return { success: true, filePath };
      }
      return { success: false, error: 'Cancelled by user' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Print ──
  ipcMain.handle('utils:print', async (event, html) => {
    return { success: false, error: 'Print not yet implemented' };
  });
}

module.exports = { registerIpcHandlers };
