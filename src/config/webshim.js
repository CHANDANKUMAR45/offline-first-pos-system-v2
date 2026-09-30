// Web Browser Shim overriding Electron IPC internally allowing Dashboard testing natively via Cloud APIs
if (!window.electronAPI) {
    console.log('[WebShim] Running in Cloud web-admin mode! Redirecting strict DB requests via HTTP to Node.js.');
    
    // Configurable root binding to the backend setup
    const API_URL = 'http://localhost:8000/api/web';
    
    const fetchApi = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error(`[WebShim Error] Failed contacting backend on ${endpoint}:`, err);
            return { success: false, error: err.message, data: [] };
        }
    };

    window.electronAPI = {
      // ── Dashboard Mode ──
      getDashboardStats: () => fetchApi('/stats'),
      
      // ── Full Tables view ──
      getProducts: () => fetchApi('/products'),
      getCustomers: () => fetchApi('/customers'),
      getSales: () => fetchApi('/sales'),
      getSaleById: (id) => fetchApi(`/sales/${id}`),

      // ── Mocks returning empties preventing render crashes ──
      getSyncStatus: async () => ({ success: true, data: { pending: 0, isSyncing: false } }),
      triggerSync: async () => ({ success: true, pushed: 0 }),
      
      // ── Disable mutations preventing offline-conflicts from pure websockets ──
      createSale: async () => ({ success: false, error: 'Cannot make offline sales from Cloud Web Dashboard' }),
      createProduct: async () => ({ success: false, error: 'Not supported' }),
      updateProduct: async () => ({ success: false, error: 'Not supported' }),
      deleteProduct: async () => ({ success: false, error: 'Not supported' }),
    };
}
