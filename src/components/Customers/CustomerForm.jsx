import { useState } from 'react';
import { X } from 'lucide-react';

function CustomerForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    total_due: initialData?.total_due || 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      total_due: parseFloat(formData.total_due || 0)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-scaleIn" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name <span className="text-danger">*</span></label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="input" 
              required 
              autoFocus 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="e.g. +880 1XXX-XXXXXX" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="Optional" />
            </div>
          </div>

          <div className="form-group">
             <label>Home / Business Address</label>
             <textarea 
               name="address" 
               value={formData.address} 
               onChange={handleChange} 
               className="input" 
               rows="3" 
               style={{ resize: 'none' }} 
               placeholder="Full address details..."
             />
          </div>

          {!initialData && (
             <div className="form-group">
              <label>Opening Due Balance (if any) (৳)</label>
              <input type="number" name="total_due" value={formData.total_due === 0 ? '' : formData.total_due} onChange={handleChange} className="input" min="0" step="0.01" placeholder="0.00" />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;
