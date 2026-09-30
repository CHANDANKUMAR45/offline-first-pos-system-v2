import { useState, useEffect } from 'react';
import { Search, Printer, Calendar, FileText, Eye, X } from 'lucide-react';
import InvoiceTemplate from '../components/Invoice/InvoiceTemplate';
import '../pages/ProductsPage.css'; // Reusing generic table styles
import '../pages/POSPage.css'; // Reusing print area styles

function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');

  // Invoice viewing & printing
  const [printSale, setPrintSale] = useState(null);
  const [viewSale, setViewSale] = useState(null);

  const fetchSales = async () => {
    // We can add filtering payload here if needed in future 
    const res = await window.electronAPI.getSales({});
    if (res.success) {
      setSales(res.data);
    } else {
      console.error('Failed to fetch sales:', res.error);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Soft Search by Customer Name or ID locally
  const filteredSales = sales.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleView = async (saleId) => {
    const res = await window.electronAPI.getSaleById(saleId);
    if (res.success) {
      setViewSale(res.data);
    } else {
      alert("Failed to fetch full receipt data!");
    }
  };

  const handlePrint = async (saleId) => {
    // Re-fetch the entire sale with item subsets
    const res = await window.electronAPI.getSaleById(saleId);
    if (res.success) {
      setPrintSale(res.data);

      // Delay to allow DOM update
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      alert("Failed to fetch full receipt data!");
    }
  };

  const handleExportCSV = () => {
    if (sales.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice ID,Date,Customer,Total,Paid,Due,Payment Method\n";

    sales.forEach(row => {
      let customer = row.customer_name ? `"${row.customer_name}"` : "Walk-in";
      let date = new Date(row.created_at).toLocaleDateString();
      // ID snippet
      let humanId = row.id.split('-').pop().toUpperCase();
      csvContent += `${humanId},${date},${customer},${row.total.toFixed(2)},${row.paid.toFixed(2)},${row.due.toFixed(2)},${row.payment_method}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
  };

  return (
    <div className="page animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales History</h2>
          <p className="page-subtitle">View and export chronological order logs.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <FileText size={18} /> Export as CSV
        </button>
      </div>

      <div className="card products-container">
        <div className="products-toolbar" style={{ justifyContent: 'flex-start', gap: 'var(--space-md)' }}>
          <div className="search-bar" style={{ maxWidth: '300px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input search-input"
              placeholder="Filter by Customer or Trx ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Calendar Picker placeholder -> Can wire into SQLite dates natively */}
          <div className="search-bar" style={{ maxWidth: '200px' }}>
            <Calendar size={18} className="search-icon" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="date" className="input" style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice / Date</th>
                <th>Client</th>
                <th>Order Items (Value)</th>
                <th>Payment</th>
                <th>Status (Due)</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const rawDate = new Date(sale.created_at);
                  const isDue = sale.due > 0;
                  return (
                    <tr key={sale.id}>
                      <td>
                        <span className="font-medium text-white" style={{ display: 'block' }}>
                          #{sale.id.split('-').pop().toUpperCase()}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {rawDate.toLocaleDateString()} {rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className={sale.customer_name ? "text-primary font-medium" : "text-secondary"}>
                        {sale.customer_name || 'Walk-in'}
                      </td>
                      <td className="font-bold">৳{sale.total.toFixed(2)}</td>
                      <td>
                        <span style={{ display: 'block', textTransform: 'capitalize' }}>{sale.payment_method}</span>
                      </td>
                      <td>
                        <span className={`stock-badge ${isDue ? 'stock-low' : 'stock-good'}`}>
                          {isDue ? `Due: ৳${sale.due.toFixed(2)}` : 'Completed Setup'}
                        </span>
                      </td>
                      <td className="actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          className="btn-icon text-secondary"
                          onClick={() => handleView(sale.id)}
                          title="View Receipt visually"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon text-primary"
                          onClick={() => handlePrint(sale.id)}
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FileText size={48} className="empty-icon" />
                    <p>No verified transaction history matches your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="print-area">
        {printSale && <InvoiceTemplate sale={printSale} />}
      </div>

      {viewSale && (
        <div className="modal-overlay">
          <div className="modal-content animate-scaleIn" style={{ maxWidth: '650px', background: 'var(--bg-root)', padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Invoice Overview</h3>
              <button className="btn-icon text-secondary" onClick={() => setViewSale(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '0px', maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Wrapped in a light background for physical paper contrast */}
              <div style={{ background: '#fff', color: '#000', padding: '20px' }}>
                <InvoiceTemplate sale={viewSale} />
              </div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-ghost" onClick={() => setViewSale(null)}>Close Viewer</button>
              <button className="btn btn-primary" onClick={() => handlePrint(viewSale.id)}>
                <Printer size={16} /> Print this Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesHistoryPage;
