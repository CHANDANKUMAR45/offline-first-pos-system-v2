import { useLocation } from 'react-router-dom';
import { Bell, Search, Wifi, WifiOff, CloudUpload, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import './TopBar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/products': 'Products',
  '/sales': 'Sales History',
  '/customers': 'Customers',
  '/settings': 'Settings',
};

function TopBar() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sync State
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    isSyncing: false,
    lastSync: null,
    lastSyncError: null,
  });

  const fetchSyncStatus = async () => {
    const res = await window.electronAPI.getSyncStatus();
    if (res.success) setSyncStatus(res.data);
  };

  const syncAutomatically = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      await window.electronAPI.triggerSync();
    } finally {
      await fetchSyncStatus();
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAutomatically();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) handleOnline();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Poll sync status occasionally
  useEffect(() => {
    fetchSyncStatus();
    const syncTimer = setInterval(fetchSyncStatus, 15000);
    return () => clearInterval(syncTimer);
  }, []);

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await window.electronAPI.triggerSync();
      if (res.success && res.pushed > 0) {
        alert(`${res.pushed} records synced successfully.`);
      } else if (!res.success) {
        alert(res.error);
      }
    } finally {
      await fetchSyncStatus();
    }
  };

  const lastSyncLabel = syncStatus.lastSync
    ? new Date(syncStatus.lastSync).toLocaleString()
    : 'No successful sync yet';

  const title = pageTitles[location.pathname] || 'Hybrid POS';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="topbar-search">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search anything…"
          />
        </div>

        {/* Sync Status Button */}
          <div className="topbar-sync">
           {syncStatus.isSyncing ? <RefreshCw size={16} className="spin text-primary" /> : <CloudUpload size={16} className={syncStatus.pending > 0 ? 'text-warning' : 'text-success'} />}
            <span className="topbar-sync-copy" title={syncStatus.lastSyncError || `Last sync: ${lastSyncLabel}`}>
              <span className="topbar-sync-label">
               {syncStatus.isSyncing ? 'Syncing...' : !isOnline ? 'Saved locally' : syncStatus.pending > 0 ? `${syncStatus.pending} pending` : 'Synced'}
              </span>
              <span className="topbar-sync-time">{syncStatus.lastSync ? `Last sync ${new Date(syncStatus.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not synced yet'}</span>
           </span>
            <button
             className="topbar-sync-button"
             type="button"
             onClick={handleManualSync}
             disabled={!isOnline || syncStatus.isSyncing}
             title="Sync now"
            >
             Sync Now
            </button>
        </div>

        {/* Online status */}
        <div className={`topbar-status ${isOnline ? 'topbar-status--online' : 'topbar-status--offline'}`}>
          {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notification */}
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={18} />
        </button>

        {/* Time */}
        <div className="topbar-time">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
