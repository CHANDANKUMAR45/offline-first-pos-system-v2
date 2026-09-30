import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, DollarSign, Users, FileText, Eye, X, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import CustomerForm from '../components/Customers/CustomerForm';
import PaymentForm from '../components/Customers/PaymentForm';
import InvoiceTemplate from '../components/Invoice/InvoiceTemplate';
import '../pages/ProductsPage.css'; // Reusing generic table styles
import '../pages/POSPage.css'; // For print area

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('permanent');
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  
  // Custom Invoice Modal logic internally inside CRM base
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [viewSale, setViewSale] = useState(null);
  const [printSale, setPrintSale] = useState(null);

  const fetchCustomers = async (searchQuery = '') => {
    const res = await window.electronAPI.getCustomers({ search: searchQuery });
    if (res.success) {
      setCustomers(res.data);
    } else {
      console.error('Failed to fetch customers:', res.error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Customer Actions
  const handleSaveCustomer = async (data) => {
    if (editingCustomer) {
      const res = await window.electronAPI.updateCustomer(editingCustomer.id, data);
      if (res.success) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? res.data : c));
      }
    } else {
      data.id = uuidv4();
      const res = await window.electronAPI.createCustomer(data);
      if (res.success) {
        setCustomers([res.data, ...customers]);
      }
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This may affect their sales history links!')) {
      const res = await window.electronAPI.deleteCustomer(id);
      if (res.success) {
        setCustomers(customers.filter(c => c.id !== id));
      }
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  // Payment Actions
  const openPayment = (customer) => {
    setPaymentCustomer(customer);
    setIsPaymentOpen(true);
  };

  const handleSavePayment = async (data) => {
    const paymentData = {
      id: uuidv4(),
      customer_id: paymentCustomer.id,
      amount: data.amount,
      method: data.method,
      note: data.note || 'Direct Due Clearance'
    };

    const res = await window.electronAPI.createPayment(paymentData);
    if (res.success) {
      // Re-fetch custom data to accurately pull new total_due natively computed via db.transaction
      fetchCustomers(search);
      setIsPaymentOpen(false);
      setPaymentCustomer(null);
      alert('Payment recorded successfully!');
    } else {
      alert(`Payment failed: ${res.error}`);
    }
  };

  const openHistory = async (customer) => {
    setHistoryCustomer(customer);
    const res = await window.electronAPI.getSales({});
    if (res.success) {
      setCustomerSales(res.data.filter(s => s.customer_id === customer.id));
    }
  };

  const handleFetchReceiptModel = async (saleId, type) => {
    const res = await window.electronAPI.getSaleById(saleId);
    if (res.success) {
       if (type === 'view') setViewSale(res.data);
       if (type === 'print') {
          setPrintSale(res.data);
          setTimeout(() => window.print(), 300);
       }
    } else {
       alert("Failed to fetch full receipt data!");
    }
  };

  return (
    <div className="page animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">{activeTab === 'permanent' ? 'Permanent Customers' : 'Walk-In Customer Log'}</h2>
          <p className="page-subtitle">Track customer balances and history across Walk-ins or Members.</p>
        </div>
        {activeTab === 'permanent' && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
          >
            <Plus size={18} /> Add Customer
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
         <button 
           className={`btn ${activeTab === 'permanent' ? 'btn-primary' : 'btn-ghost'}`}
           onClick={() => setActiveTab('permanent')}
           style={{ border: activeTab === 'permanent' ? 'none' : '1px solid var(--border-color)' }}
         >
           Permanent CRM Base
         </button>
         <button 
           className={`btn ${activeTab === 'walkin' ? 'btn-primary' : 'btn-ghost'}`}
           onClick={() => setActiveTab('walkin')}
           style={{ border: activeTab === 'walkin' ? 'none' : '1px solid var(--border-color)' }}
         >
           Walk-In Name Logs
         </button>
      </div>

      <div className="card products-container">
        <div className="products-toolbar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="input search-input" 
              placeholder="Search by name, phone or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Outstanding Due (৳)</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {customers.filter(c => activeTab === 'permanent' ? c.address !== '__WALKIN__' : c.address === '__WALKIN__').length > 0 ? (
                customers
                  .filter(c => activeTab === 'permanent' ? c.address !== '__WALKIN__' : c.address === '__WALKIN__')
                  .map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <span className="font-medium text-white" style={{ display: 'block' }}>{customer.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.address || ''}</span>
                    </td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.email || '—'}</td>
                    <td>
                       <span className={`stock-badge ${customer.total_due > 0 ? 'stock-low' : 'stock-good'}`}>
                        ৳{customer.total_due.toFixed(2)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                         className="btn-icon" 
                         style={{ color: '#fff', background: 'var(--color-primary)' }}
                         onClick={() => openHistory(customer)} 
                         title="View Purchase Logs"
                      >
                         <FileText size={16} />
                      </button>

                      {customer.total_due > 0 && activeTab === 'permanent' && (
                        <button 
                           className="btn-icon" 
                           style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)' }}
                           onClick={() => openPayment(customer)} 
                           title="Record Payment"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      {activeTab === 'permanent' && (
                        <button className="btn-icon text-primary" onClick={() => openEdit(customer)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {activeTab === 'permanent' && (
                        <button className="btn-icon text-danger" onClick={() => handleDelete(customer.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <Users size={48} className="empty-icon" />
                    <p>No customers found here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <CustomerForm 
          initialData={editingCustomer} 
          onSave={handleSaveCustomer} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isPaymentOpen && (
        <PaymentForm 
          customer={paymentCustomer} 
          onSave={handleSavePayment} 
          onClose={() => setIsPaymentOpen(false)} 
        />
      )}

      {/* Embedded History Modal connecting identically to Sales routines avoiding duplicative tables completely */}
      {historyCustomer && (
        <div className="modal-overlay">
          <div className="modal-content animate-scaleIn" style={{ maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)'}}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Purchase Logs: {historyCustomer.name}</h3>
              <button className="btn-icon" onClick={() => setHistoryCustomer(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
               <table className="data-table">
                  <thead><tr><th>Date / Invoice</th><th>Total</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {customerSales.length > 0 ? customerSales.map(s => (
                       <tr key={s.id}>
                         <td><span className="font-bold text-white">#{s.id.split('-').pop().toUpperCase()}</span> <br/><small>{new Date(s.created_at).toLocaleDateString()}</small></td>
                         <td>৳{s.total.toFixed(2)}</td>
                         <td style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button className="btn-icon text-secondary" onClick={() => handleFetchReceiptModel(s.id, 'view')} title="View Visually"><Eye size={16} /></button>
                            <button className="btn-icon text-primary" onClick={() => handleFetchReceiptModel(s.id, 'print')} title="Print Receipt"><Printer size={16} /></button>
                         </td>
                       </tr>
                    )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>No physical invoices found.</td></tr>}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {viewSale && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-scaleIn" style={{ maxWidth: '650px', background: '#fff', color: '#000', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)'}}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Invoice Overview</h3>
              <button className="btn-icon text-secondary" onClick={() => setViewSale(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', maxHeight: '65vh', overflowY: 'auto' }}>
                 <InvoiceTemplate sale={viewSale} />
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
               <button className="btn btn-ghost" onClick={() => setViewSale(null)}>Close</button>
               <button className="btn btn-primary" onClick={() => { handleFetchReceiptModel(viewSale.id, 'print'); setViewSale(null); }}>
                 <Printer size={16} /> Print
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="print-area">
        {printSale && <InvoiceTemplate sale={printSale} />}
      </div>
    </div>
  );
}

export default CustomersPage;
