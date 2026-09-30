import { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DashboardPage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayCount: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalDues: 0
  });

  // Mock data for the chart - In Phase 6 real reporting, we'd pull array from backend group-by dates
  const mockChartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  useEffect(() => {
    async function loadStats() {
      const res = await window.electronAPI.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    }
    loadStats();
    
    // Interval update for live view
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Overview of your shop's performance today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        
        <div className="card stat-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Today's Revenue</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                ৳{stats.todayRevenue.toFixed(2)}
              </h3>
            </div>
            <div style={{ padding: '10px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-md)' }}>
            Across {stats.todayCount} sales transactions
          </p>
        </div>

        <Link to="/products" className="card stat-card hover-lift" style={{ borderTop: '3px solid var(--color-warning)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Inventory Health</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                {stats.totalProducts}
              </h3>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning)' }}>
              <Package size={24} />
            </div>
          </div>
          <p className={stats.lowStockItems > 0 ? "text-danger text-bold" : "text-success"} style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-md)', fontWeight: '600' }}>
             {stats.lowStockItems} items running low
          </p>
        </Link>
        
        <Link to="/customers" className="card stat-card hover-lift" style={{ borderTop: '3px solid var(--color-danger)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Outstanding Dues</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                 ৳{stats.totalDues.toFixed(2)}
              </h3>
            </div>
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-md)' }}>
             Click to track physical payments
          </p>
        </Link>

      </div>

      {/* Chart Section */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
           <Activity size={20} className="text-primary"/>
           <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Weekly Revenue Trend</h3>
        </div>
        
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
              <YAxis stroke="#888" tick={{fill: '#888'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-primary)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
