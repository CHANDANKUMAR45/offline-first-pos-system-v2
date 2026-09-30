import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  Users,
  Settings,
  Zap,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/sales', icon: History, label: 'Sales History' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={22} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">HybridPOS</span>
          <span className="sidebar-brand-sub">Construction Materials</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">MENU</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <Icon size={18} className="sidebar-link-icon" />
            <span className="sidebar-link-label">{label}</span>
            {location.pathname === path && (
              <div className="sidebar-link-indicator" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-sync-status">
          <div className="sidebar-sync-dot" />
          <span>Offline Mode</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
