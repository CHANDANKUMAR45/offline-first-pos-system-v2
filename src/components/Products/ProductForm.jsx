import { useState, useRef } from 'react';
import { X, Upload, ImageIcon, Trash2 } from 'lucide-react';
import './ProductForm.css';

function ProductForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    price: initialData?.price || '',
    cost_price: initialData?.cost_price || '',
    stock: initialData?.stock || '',
    low_stock_threshold: initialData?.low_stock_threshold || '5',
    unit: initialData?.unit || 'pcs',
    barcode: initialData?.barcode || '',
    image: initialData?.image || ''
  });

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ── Image Handling ──
  const processFile = (file) => {
    if (!file) return;
    // Only accept images
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB. Please use a smaller or compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Resize to max 300x300 for storage efficiency
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    processFile(e.target.files[0]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price || 0),
      stock: parseFloat(formData.stock || 0),
      low_stock_threshold: parseFloat(formData.low_stock_threshold || 5)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-scaleIn" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* ── Image Upload Section ── */}
          <div className="pf-image-section">
            <label className="pf-image-label">Product Image</label>
            <div className="pf-image-row">
              {/* Drop zone */}
              <div
                className={`pf-dropzone ${dragActive ? 'pf-dropzone-active' : ''} ${formData.image ? 'pf-dropzone-has-image' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image ? (
                  <img src={formData.image} alt="Product" className="pf-preview-img" />
                ) : (
                  <div className="pf-dropzone-placeholder">
                    <Upload size={24} />
                    <span>Drop image here</span>
                    <span className="pf-dropzone-hint">or click to browse</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              {/* Image info / actions */}
              <div className="pf-image-actions">
                <button type="button" className="btn btn-ghost pf-img-btn" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={16} /> {formData.image ? 'Change Image' : 'Upload'}
                </button>
                {formData.image && (
                  <button type="button" className="btn btn-ghost pf-img-btn pf-img-remove" onClick={removeImage}>
                    <Trash2 size={16} /> Remove
                  </button>
                )}
                <p className="pf-image-hint">JPG, PNG or WEBP. Max 2MB.<br/>Auto-resized to 300×300.</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Product Name <span className="text-danger">*</span></label>
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
              <label>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} className="input" placeholder="e.g. Cement, Rod" />
            </div>
            <div className="form-group">
              <label>Barcode</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="input" placeholder="Scan or type" />
            </div>
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Selling Price (৳) <span className="text-danger">*</span></label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="input" min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label>Cost Price (৳)</label>
              <input type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} className="input" min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="input">
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="bag">bag</option>
                <option value="ton">ton</option>
                <option value="ft">ft</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="input" step="0.01" />
            </div>
            <div className="form-group">
              <label>Low Stock Alert</label>
              <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} className="input" min="0" step="0.01" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
