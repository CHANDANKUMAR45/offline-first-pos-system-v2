import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, User } from 'lucide-react';
import './Cart.css';

function Cart({ items, onUpdateQty, onClear, onCheckout, customers, selectedCustomer, onSelectCustomer }) {
  const [custSearch, setCustSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="pos-cart">
      <div className="cart-header">
        <h3 className="cart-title">
          <ShoppingCart size={20} className="text-primary"/> Current Order
        </h3>
        <button className="btn-icon text-muted" onClick={onClear} title="Clear Cart">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="cart-customer-selector" style={{ position: 'relative' }}>
        <User size={16} className="text-secondary" />
        <input 
          className="input" 
          style={{ border: 'none', background: 'transparent', padding: '0 8px', flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', outline: 'none' }}
          placeholder="Search Customer..."
          value={selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}` : custSearch}
          onChange={(e) => {
            if (selectedCustomer) onSelectCustomer('');
            setCustSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
        />
        
        {dropdownOpen && !selectedCustomer && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            <div 
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--color-primary)' }}
              onClick={() => onSelectCustomer('')}>
              ★ Walk-in Customer (Unknown)
            </div>
            
            {customers
              // Exclude pure walk-ins from the permanent selector loop
              .filter(c => c.address !== '__WALKIN__' && (c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone && c.phone.includes(custSearch))))
              .slice(0, 10) // Limit display height seamlessly
              .map(c => (
              <div 
                key={c.id} 
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }} 
                onClick={() => {
                  onSelectCustomer(c.id);
                  setCustSearch('');
                }}
              >
                {c.name} {c.phone && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({c.phone})</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="cart-empty text-muted">
            Cart is empty. Select products from the grid to add them.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-item-name">{item.product_name}</span>
                <span className="cart-item-price">৳{item.unit_price.toFixed(2)}</span>
              </div>
              <div className="cart-item-actions">
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, Math.max(1, (parseInt(item.quantity)||0) - 1))}><Minus size={14}/></button>
                  <input 
                    type="number" 
                    className="qty-display" 
                    value={item.quantity} 
                    onChange={(e) => onUpdateQty(item.product_id, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseFloat(e.target.value) <= 0) onUpdateQty(item.product_id, 1);
                    }}
                    style={{
                      width: '45px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, (parseInt(item.quantity)||0) + 1)}><Plus size={14}/></button>
                </div>
                <span className="cart-item-total text-primary font-bold">
                  ৳{item.total.toFixed(2)}
                </span>
                <button className="btn-icon text-danger" onClick={() => onUpdateQty(item.product_id, 'REMOVE')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-summary-row">
          <span className="text-secondary">Subtotal</span>
          <span className="font-medium text-primary">৳{subtotal.toFixed(2)}</span>
        </div>
        <div className="cart-summary-row mt-sm">
           <span className="text-secondary">Tax/Discount</span>
           <span className="text-muted text-sm">(Calculated at checkout)</span>
        </div>
        
        <div className="cart-total-banner">
          <span>Total</span>
          <span>৳{subtotal.toFixed(2)}</span>
        </div>

        <button 
          className="btn btn-primary checkout-btn" 
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;
