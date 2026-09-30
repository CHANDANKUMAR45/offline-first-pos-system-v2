const { app, net } = require('electron');
const syncDao = require('../database/dao/sync');

function getSyncConfiguration() {
  return {
    apiUrl: process.env.CLOUD_API_URL || (!app.isPackaged ? 'http://localhost:8000' : ''),
    apiKey: process.env.SYNC_API_KEY || (!app.isPackaged ? 'pos_dev_secret_key' : ''),
  };
}

let isSyncing = false;
let lastSyncError = null;

async function triggerSync() {
  if (isSyncing) return { success: false, error: 'Sync already in progress' };

  try {
    isSyncing = true;
    const { payload, totalUnsynced } = syncDao.getUnsyncedData();

    if (totalUnsynced === 0) {
      return { success: true, message: 'Already up to date', pushed: 0 };
    }

    const { apiUrl, apiKey } = getSyncConfiguration();
    if (!apiUrl || !apiKey) {
      lastSyncError = 'Cloud sync is not configured. Your data is saved locally.';
      return { success: false, error: lastSyncError };
    }

    let parsedApiUrl;
    try {
      parsedApiUrl = new URL(apiUrl);
    } catch {
      lastSyncError = 'Cloud server address is invalid. Your data is saved locally.';
      return { success: false, error: lastSyncError };
    }

    if (app.isPackaged && parsedApiUrl.protocol !== 'https:') {
      lastSyncError = 'Cloud sync requires a secure HTTPS server. Your data is saved locally.';
      return { success: false, error: lastSyncError };
    }

    console.log(`[SyncService] Starting push for ${totalUnsynced} records...`);

    // Use Electron's native net module instead of Axios to avoid dependency bloat
    const response = await new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url: `${apiUrl.replace(/\/$/, '')}/api/sync/push`,
      });

      request.setHeader('Content-Type', 'application/json');
      request.setHeader('x-api-key', apiKey);

      let responseData = '';

      request.on('response', (res) => {
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
          } else {
            reject(new Error(`Server responded with ${res.statusCode}: ${responseData}`));
          }
        });
      });

      request.on('error', (error) => reject(error));
      
      request.write(JSON.stringify(payload));
      request.end();
    });

    if (response.data.success) {
      // Mark as synced locally
      syncDao.markAsSynced(payload);
      const lastSyncTime = new Date().toISOString();
      syncDao.setLastSyncTime(lastSyncTime);
      lastSyncError = null;
      console.log(`[SyncService] Successfully pushed and marked ${totalUnsynced} records.`);
      return { success: true, pushed: totalUnsynced };
    } else {
      throw new Error(response.data.error || 'Server rejected payload');
    }
  } catch (error) {
    console.error('[SyncService] Sync failed:', error);
    lastSyncError = 'Cloud server is unavailable. Your data is saved locally and will retry automatically.';
    return { success: false, error: lastSyncError };
  } finally {
    isSyncing = false;
  }
}

function getSyncStatus() {
  const localStatus = syncDao.getSyncStatus();
  return {
    pending: localStatus.pending,
    lastSync: syncDao.getLastSyncTime(),
    lastSyncError,
    isSyncing,
  };
}

module.exports = {
  triggerSync,
  getSyncStatus
};
