import React from 'react';
import './InvoiceTemplate.css';

// ──────────────────────────────────────────
// Invoice Settings Helper
// ──────────────────────────────────────────
const DEFAULT_INVOICE_SETTINGS = {
  selectedTemplate: 'classic',
  currencySymbol: '৳',
  showCustomerAddress: true,
  showCustomerPhone: true,
  showPaymentMethod: true,
  showDueBalance: true,
  showTaxColumn: true,
  showDiscountRow: true,
  footerMessage: 'Thank you for your business!',
  footerNote: 'Goods sold are not returnable without original receipt.',
  showPoweredBy: true,
  invoiceTitle: 'INVOICE',
};

export function getInvoiceSettings() {
  try {
    const raw = localStorage.getItem('invoiceSettings');
    if (raw) return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_INVOICE_SETTINGS };
}

export function saveInvoiceSettings(settings) {
  localStorage.setItem('invoiceSettings', JSON.stringify(settings));
}

export { DEFAULT_INVOICE_SETTINGS };

// ──────────────────────────────────────────
// Template 1: Classic
// ──────────────────────────────────────────
function ClassicTemplate({ sale, shopSettings, settings }) {
  const { id, created_at, customer_name, customer_phone, customer_address, subtotal, discount, tax, total, paid, due, payment_method, items } = sale;
  const printDate = new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const cs = settings.currencySymbol;

  return (
    <div className="inv-classic">
      <div className="inv-classic-header">
        <h1 className="inv-classic-shop">{shopSettings?.name || 'Hybrid POS Shop'}</h1>
        <p className="inv-classic-addr">{shopSettings?.address || '123 Main Street, City'}</p>
        <p className="inv-classic-phone">Phone: {shopSettings?.phone || '+880 1XXX-XXXXXX'}</p>
      </div>

      <div className="inv-classic-divider" />

      <div className="inv-classic-title">{settings.invoiceTitle}</div>

      <div className="inv-classic-meta">
        <div>
          <strong>Invoice No:</strong> <span className="inv-mono">{id.split('-').pop().toUpperCase()}</span><br />
          <strong>Date:</strong> {printDate}
        </div>
        <div className="inv-text-right">
          <strong>Customer:</strong> {customer_name || 'Walk-in Customer'}<br />
          {settings.showCustomerPhone && customer_phone && <><strong>Phone:</strong> {customer_phone}<br /></>}
          {settings.showCustomerAddress && customer_address && customer_address !== '__WALKIN__' && <><strong>Address:</strong> {customer_address}</>}
        </div>
      </div>

      <table className="inv-classic-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="inv-text-left">Item Description</th>
            <th className="inv-text-center">Qty</th>
            <th className="inv-text-right">Price</th>
            <th className="inv-text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td className="inv-text-left">{item.product_name}</td>
              <td className="inv-text-center">{item.quantity}</td>
              <td className="inv-text-right">{cs}{item.unit_price.toFixed(2)}</td>
              <td className="inv-text-right">{cs}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-classic-summary">
        <div className="inv-row"><span>Subtotal:</span><span>{cs}{subtotal.toFixed(2)}</span></div>
        {settings.showDiscountRow && discount > 0 && <div className="inv-row"><span>Discount:</span><span>-{cs}{discount.toFixed(2)}</span></div>}
        {settings.showTaxColumn && tax > 0 && <div className="inv-row"><span>Tax:</span><span>+{cs}{tax.toFixed(2)}</span></div>}
        <div className="inv-row inv-grand-total"><span>Grand Total:</span><span>{cs}{total.toFixed(2)}</span></div>
      </div>

      <div className="inv-classic-payment">
        {settings.showPaymentMethod && <div className="inv-row"><span>Paid ({payment_method}):</span><span>{cs}{paid.toFixed(2)}</span></div>}
        {settings.showDueBalance && <div className="inv-row inv-due"><span>Due Balance:</span><span>{cs}{due.toFixed(2)}</span></div>}
      </div>

      <div className="inv-classic-divider" />
      <div className="inv-classic-footer">
        <p>{settings.footerMessage}</p>
        <p className="inv-small">{settings.footerNote}</p>
        {settings.showPoweredBy && <p className="inv-small">Powered by HybridPOS</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Template 2: Modern
// ──────────────────────────────────────────
function ModernTemplate({ sale, shopSettings, settings }) {
  const { id, created_at, customer_name, customer_phone, customer_address, subtotal, discount, tax, total, paid, due, payment_method, items } = sale;
  const printDate = new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const cs = settings.currencySymbol;

  return (
    <div className="inv-modern">
      {/* Top accent bar */}
      <div className="inv-modern-accent" />
      
      <div className="inv-modern-top">
        <div>
          <h1 className="inv-modern-shop">{shopSettings?.name || 'Hybrid POS Shop'}</h1>
          <p className="inv-modern-addr">{shopSettings?.address || '123 Main Street, City'}</p>
          <p className="inv-modern-phone">{shopSettings?.phone || '+880 1XXX-XXXXXX'}</p>
        </div>
        <div className="inv-modern-badge">
          <div className="inv-modern-title">{settings.invoiceTitle}</div>
          <div className="inv-modern-id">#{id.split('-').pop().toUpperCase()}</div>
        </div>
      </div>

      <div className="inv-modern-info-bar">
        <div className="inv-modern-info-block">
          <span className="inv-modern-label">Bill To</span>
          <strong>{customer_name || 'Walk-in Customer'}</strong>
          {settings.showCustomerPhone && customer_phone && <span>{customer_phone}</span>}
          {settings.showCustomerAddress && customer_address && customer_address !== '__WALKIN__' && <span>{customer_address}</span>}
        </div>
        <div className="inv-modern-info-block inv-text-right">
          <span className="inv-modern-label">Invoice Date</span>
          <strong>{printDate}</strong>
          {settings.showPaymentMethod && <span>Payment: {payment_method}</span>}
        </div>
      </div>

      <table className="inv-modern-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="inv-text-left">Product</th>
            <th className="inv-text-center">Qty</th>
            <th className="inv-text-right">Unit Price</th>
            <th className="inv-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td className="inv-text-left">{item.product_name}</td>
              <td className="inv-text-center">{item.quantity}</td>
              <td className="inv-text-right">{cs}{item.unit_price.toFixed(2)}</td>
              <td className="inv-text-right">{cs}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-modern-bottom">
        <div className="inv-modern-notes">
          <p className="inv-modern-label">Note</p>
          <p>{settings.footerMessage}</p>
          <p className="inv-small">{settings.footerNote}</p>
        </div>
        <div className="inv-modern-totals">
          <div className="inv-row"><span>Subtotal</span><span>{cs}{subtotal.toFixed(2)}</span></div>
          {settings.showDiscountRow && discount > 0 && <div className="inv-row"><span>Discount</span><span>-{cs}{discount.toFixed(2)}</span></div>}
          {settings.showTaxColumn && tax > 0 && <div className="inv-row"><span>Tax</span><span>+{cs}{tax.toFixed(2)}</span></div>}
          <div className="inv-row inv-modern-grand"><span>Total</span><span>{cs}{total.toFixed(2)}</span></div>
          <div className="inv-row inv-modern-paid"><span>Paid</span><span>{cs}{paid.toFixed(2)}</span></div>
          {settings.showDueBalance && <div className="inv-row inv-due"><span>Due</span><span>{cs}{due.toFixed(2)}</span></div>}
        </div>
      </div>

      {settings.showPoweredBy && <div className="inv-modern-powered">Powered by HybridPOS</div>}
    </div>
  );
}

// ──────────────────────────────────────────
// Template 3: Minimal
// ──────────────────────────────────────────
function MinimalTemplate({ sale, shopSettings, settings }) {
  const { id, created_at, customer_name, customer_phone, customer_address, subtotal, discount, tax, total, paid, due, payment_method, items } = sale;
  const printDate = new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const cs = settings.currencySymbol;

  return (
    <div className="inv-minimal">
      <div className="inv-minimal-header">
        <div>
          <h1 className="inv-minimal-shop">{shopSettings?.name || 'Hybrid POS Shop'}</h1>
          <p className="inv-minimal-sub">{shopSettings?.address || '123 Main Street, City'} &bull; {shopSettings?.phone || '+880 1XXX-XXXXXX'}</p>
        </div>
        <div className="inv-minimal-inv-info">
          <span className="inv-minimal-inv-label">{settings.invoiceTitle}</span>
          <span className="inv-minimal-inv-no">{id.split('-').pop().toUpperCase()}</span>
          <span className="inv-small">{printDate}</span>
        </div>
      </div>

      <div className="inv-minimal-line" />

      <div className="inv-minimal-customer">
        <strong>{customer_name || 'Walk-in Customer'}</strong>
        {settings.showCustomerPhone && customer_phone && <span> &bull; {customer_phone}</span>}
        {settings.showCustomerAddress && customer_address && customer_address !== '__WALKIN__' && <span> &bull; {customer_address}</span>}
      </div>

      <table className="inv-minimal-table">
        <thead>
          <tr>
            <th className="inv-text-left">Item</th>
            <th className="inv-text-center">Qty</th>
            <th className="inv-text-right">Price</th>
            <th className="inv-text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx}>
              <td className="inv-text-left">{item.product_name}</td>
              <td className="inv-text-center">{item.quantity}</td>
              <td className="inv-text-right">{cs}{item.unit_price.toFixed(2)}</td>
              <td className="inv-text-right">{cs}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-minimal-totals">
        <div className="inv-row"><span>Subtotal</span><span>{cs}{subtotal.toFixed(2)}</span></div>
        {settings.showDiscountRow && discount > 0 && <div className="inv-row"><span>Discount</span><span>-{cs}{discount.toFixed(2)}</span></div>}
        {settings.showTaxColumn && tax > 0 && <div className="inv-row"><span>Tax</span><span>+{cs}{tax.toFixed(2)}</span></div>}
        <div className="inv-row inv-minimal-grand"><span>Total</span><span>{cs}{total.toFixed(2)}</span></div>
        <div className="inv-row"><span>Paid{settings.showPaymentMethod ? ` (${payment_method})` : ''}</span><span>{cs}{paid.toFixed(2)}</span></div>
        {settings.showDueBalance && <div className="inv-row inv-due"><span>Balance Due</span><span>{cs}{due.toFixed(2)}</span></div>}
      </div>

      <div className="inv-minimal-footer">
        <p>{settings.footerMessage}</p>
        {settings.showPoweredBy && <p className="inv-small">Powered by HybridPOS</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Template 4: Thermal / Receipt
// ──────────────────────────────────────────
function ThermalTemplate({ sale, shopSettings, settings }) {
  const { id, created_at, customer_name, customer_phone, subtotal, discount, tax, total, paid, due, payment_method, items } = sale;
  const printDate = new Date(created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  const cs = settings.currencySymbol;

  return (
    <div className="inv-thermal">
      <div className="inv-thermal-header">
        <h1 className="inv-thermal-shop">{shopSettings?.name || 'Hybrid POS Shop'}</h1>
        <p>{shopSettings?.address || '123 Main Street, City'}</p>
        <p>{shopSettings?.phone || '+880 1XXX-XXXXXX'}</p>
      </div>

      <div className="inv-thermal-dashed" />

      <div className="inv-thermal-meta">
        <span>{settings.invoiceTitle} #{id.split('-').pop().toUpperCase()}</span>
        <span>{printDate}</span>
      </div>
      <div className="inv-thermal-meta">
        <span>{customer_name || 'Walk-in'}</span>
        {settings.showCustomerPhone && customer_phone && <span>{customer_phone}</span>}
      </div>

      <div className="inv-thermal-dashed" />

      <div className="inv-thermal-items">
        {items?.map((item, idx) => (
          <div key={idx} className="inv-thermal-item">
            <div className="inv-thermal-item-name">{item.product_name}</div>
            <div className="inv-thermal-item-detail">
              <span>{item.quantity} x {cs}{item.unit_price.toFixed(2)}</span>
              <span>{cs}{item.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="inv-thermal-dashed" />

      <div className="inv-thermal-totals">
        <div className="inv-thermal-row"><span>Subtotal</span><span>{cs}{subtotal.toFixed(2)}</span></div>
        {settings.showDiscountRow && discount > 0 && <div className="inv-thermal-row"><span>Discount</span><span>-{cs}{discount.toFixed(2)}</span></div>}
        {settings.showTaxColumn && tax > 0 && <div className="inv-thermal-row"><span>Tax</span><span>+{cs}{tax.toFixed(2)}</span></div>}
      </div>

      <div className="inv-thermal-dashed" />

      <div className="inv-thermal-grand">
        <span>TOTAL</span>
        <span>{cs}{total.toFixed(2)}</span>
      </div>

      <div className="inv-thermal-dashed" />

      <div className="inv-thermal-totals">
        {settings.showPaymentMethod && <div className="inv-thermal-row"><span>Paid ({payment_method})</span><span>{cs}{paid.toFixed(2)}</span></div>}
        {settings.showDueBalance && <div className="inv-thermal-row"><span>Due</span><span>{cs}{due.toFixed(2)}</span></div>}
      </div>

      <div className="inv-thermal-footer">
        <p>{settings.footerMessage}</p>
        <p className="inv-small">{settings.footerNote}</p>
        {settings.showPoweredBy && <p className="inv-small">Powered by HybridPOS</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Component – Routes to the right template
// ──────────────────────────────────────────
const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  thermal: ThermalTemplate,
};

const InvoiceTemplate = React.forwardRef(({ sale, shopSettings, templateOverride }, ref) => {
  if (!sale) return null;

  const settings = getInvoiceSettings();
  const templateKey = templateOverride || settings.selectedTemplate || 'classic';
  const TemplateComponent = TEMPLATES[templateKey] || ClassicTemplate;

  return (
    <div className="invoice-print-container" ref={ref}>
      <TemplateComponent sale={sale} shopSettings={shopSettings} settings={settings} />
    </div>
  );
});

export default InvoiceTemplate;
