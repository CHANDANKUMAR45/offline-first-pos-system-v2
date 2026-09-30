import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

function PaymentForm({ customer, onSave, onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    onSave({
      amount: parseFloat(amount),
      method,
      note
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-scaleIn" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Record Due Payment</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="text-sm text-secondary" style={{ marginBottom: '-8px' }}>
            Recording payment for <strong>{customer.name}</strong>
          </p>

          <div className="cart-total-banner" style={{ margin: '0 0 var(--space-md) 0', background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)', color: 'var(--color-warning)', boxShadow: 'none' }}>
            <span>Current Due</span>
            <span>৳{(customer.total_due || 0).toFixed(2)}</span>
          </div>

          <div className="form-group">
            <label>Payment Amount (৳) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              className="input" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              min="0.01" 
              step="0.01" 
              max={customer.total_due || 0}
              required 
              autoFocus 
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}
            />
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
               <option value="cash">Cash</option>
               <option value="card">Card / POS</option>
               <option value="mobile">Mobile Banking (bKash/Nagad)</option>
               <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div className="form-group">
             <label>Note / Reference (Optional)</label>
             <input type="text" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Transaction ID" />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-success)', color: '#fff' }}>
              <CheckCircle size={18} /> Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentForm;
