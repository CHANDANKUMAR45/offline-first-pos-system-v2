import { useState, useEffect } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
import '../Products/ProductForm.css'; // Reuse modal styles

function PaymentDialog({ cartTotal, selectedCustomer, onClose, onConfirm }) {
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(cartTotal);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  
  const finalTotal = Math.max(0, cartTotal - discount);
  const due = Math.max(0, finalTotal - paid);
  const change = Math.max(0, paid - finalTotal);

  // Update paid amount automatically if discount changes and user hasn't typed a custom amount yet
  useEffect(() => {
    setPaid(finalTotal);
  }, [finalTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      discount,
      paid,
      method: paymentMethod,
      quickCustomer: walkinName.trim() ? { name: walkinName, phone: walkinPhone } : null
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-scaleIn" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Complete Payment</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="cart-total-banner" style={{ marginTop: 0, marginBottom: 'var(--space-md)' }}>
            <span>Total Payable</span>
            <span>৳{finalTotal.toFixed(2)}</span>
          </div>

          {!selectedCustomer && (
            <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <UserPlus size={14} /> Quick-Add Customer (Optional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" className="input" placeholder="Customer Name..." value={walkinName} onChange={e => setWalkinName(e.target.value)} style={{ padding: '8px 12px' }} />
                <input type="text" className="input" placeholder="Phone Number..." value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} style={{ padding: '8px 12px' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Discount Amount (৳)</label>
            <input 
              type="number" 
              className="input" 
              min="0"
              max={cartTotal}
              step="0.01"
              value={discount === 0 ? '' : discount} 
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Amount Paid (৳) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              className="input" 
              min="0"
              step="0.01"
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}
              value={paid === 0 ? '' : paid} 
              onChange={(e) => setPaid(parseFloat(e.target.value) || 0)} 
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, border: paymentMethod !== 'cash' ? '1px solid var(--border-color)' : 'none' }}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </button>
              <button 
                type="button"
                className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, border: paymentMethod !== 'card' ? '1px solid var(--border-color)' : 'none' }}
                onClick={() => setPaymentMethod('card')}
              >
                Card / Mobile
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-root)', borderRadius: 'var(--radius-md)', marginTop: '8px' }}>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="text-muted text-sm">Due Amount</span>
                <span className="font-bold text-danger">৳{due.toFixed(2)}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className="text-muted text-sm">Change Returned</span>
                <span className="font-bold text-success">৳{change.toFixed(2)}</span>
             </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '0' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} /> Confirm Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentDialog;
