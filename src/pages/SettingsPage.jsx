import { useState, useEffect } from 'react';
import { Save, HardDrive, ShieldCheck, Database, Cloud, FileText, Eye, Check, Palette, Type, ToggleLeft, ToggleRight } from 'lucide-react';
import { getInvoiceSettings, saveInvoiceSettings, DEFAULT_INVOICE_SETTINGS } from '../components/Invoice/InvoiceSettings';
import InvoiceTemplate from '../components/Invoice/InvoiceTemplate';
import '../pages/ProductsPage.css';
import '../pages/SettingsPage.css';

// ── Sample data for the live preview ──
const SAMPLE_SALE = {
  id: 'abc-def-ghi-DEMO01',
  created_at: new Date().toISOString(),
  customer_name: 'Karim Ahmed',
  customer_phone: '+880 1812-345678',
  customer_address: '42 Dhanmondi, Dhaka',
  subtotal: 2500,
  discount: 200,
  tax: 115,
  total: 2415,
  paid: 2000,
  due: 415,
  payment_method: 'cash',
  items: [
    { product_name: 'Wireless Mouse', quantity: 2, unit_price: 650, total: 1300 },
    { product_name: 'USB-C Hub Adapter', quantity: 1, unit_price: 850, total: 850 },
    { product_name: 'Screen Cleaner Kit', quantity: 1, unit_price: 350, total: 350 },
  ],
};

const TEMPLATES = [
  { key: 'classic',  label: 'Classic',  desc: 'Clean corporate look with centered header and standard table layout.' },
  { key: 'modern',   label: 'Modern',   desc: 'Gradient accent bar, blue theme, and a contemporary split layout.' },
  { key: 'minimal',  label: 'Minimal',  desc: 'Whitespace-focused minimal design, elegant and airy.' },
  { key: 'thermal',  label: 'Thermal',  desc: 'Compact receipt format, ideal for 80mm thermal printers.' },
];

function SettingsPage() {
  // ── Shop Details ──
  const [shopName, setShopName] = useState('Hybrid POS Global');
  const [address, setAddress] = useState('123 Main Street, Business Block');
  const [phone, setPhone] = useState('+880 18XX-XXXXXX');

  // ── Invoice Settings ──
  const [invoiceSettings, setInvoiceSettings] = useState(getInvoiceSettings());
  const [showPreview, setShowPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const updateSetting = (key, value) => {
    setInvoiceSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveInvoiceSettings = () => {
    saveInvoiceSettings(invoiceSettings);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all invoice settings to defaults?')) {
      setInvoiceSettings({ ...DEFAULT_INVOICE_SETTINGS });
      saveInvoiceSettings({ ...DEFAULT_INVOICE_SETTINGS });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    alert('Shop configurations saved locally successfully!');
  };

  const handleBackup = async () => {
    const res = await window.electronAPI.exportDatabase();
    if (res.success) {
      alert(`Database successfully backed up to:\n${res.filePath}`);
    } else {
      if (res.error !== 'Cancelled by user') {
        alert(`Backup failed: ${res.error}`);
      }
    }
  };

  // Toggle helper component
  const Toggle = ({ value, onChange, label }) => (
    <div className="inv-setting-toggle" onClick={() => onChange(!value)}>
      <span className="inv-setting-toggle-label">{label}</span>
      {value ? <ToggleRight size={22} className="inv-toggle-on" /> : <ToggleLeft size={22} className="inv-toggle-off" />}
    </div>
  );

  return (
    <div className="page animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">System Settings</h2>
          <p className="page-subtitle">Configure application settings, data management, and invoice customization.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>

        {/* ═══════ Shop Details Card ═══════ */}
        <div className="card">
          <div className="settings-card-header">
            <ShieldCheck size={20} className="text-primary" />
            <h3 className="settings-card-title">Shop Details</h3>
          </div>
          <form style={{ padding: 'var(--space-lg)' }} onSubmit={handleSaveSettings}>
            <div className="settings-field">
              <label className="settings-label">Registered Shop Name</label>
              <input className="input" type="text" value={shopName} onChange={e => setShopName(e.target.value)} required />
            </div>
            <div className="settings-field">
              <label className="settings-label">Invoice Address Header</label>
              <input className="input" type="text" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
            <div className="settings-field">
              <label className="settings-label">Contact Phone</label>
              <input className="input" type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={18} /> Update Configurations
            </button>
          </form>
        </div>

        {/* ═══════ Data & Environment Card ═══════ */}
        <div className="card">
          <div className="settings-card-header">
            <HardDrive size={20} className="text-secondary" />
            <h3 className="settings-card-title">Data & Environment</h3>
          </div>
          <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ background: 'var(--bg-root)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>App Version</h4>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>v1.0.0 (Offline-First Build)</p>
            </div>
            <div style={{ background: 'var(--color-warning-bg)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-warning)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Cloud size={16} /> Sync Engine</h4>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>PostgreSQL Automatic Hub</p>
                </div>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--color-success)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>Active</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', lineHeight: '1.5' }}>
                Your data resides safely packed inside a high-speed local SQLite `.db` file. We strongly recommend making manual physical exports onto a USB / Hard disk weekly despite cloud availability.
              </p>
              <button className="btn" style={{ width: '100%', background: 'var(--bg-card-hover)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }} onClick={handleBackup}>
                <Database size={18} /> Export / Backup Database
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          INVOICE CUSTOMIZATION SECTION
          ═══════════════════════════════════════════ */}
      <div className="inv-settings-section">
        <div className="inv-settings-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} className="text-primary" />
            <div>
              <h3 className="inv-settings-section-title">Invoice Customization</h3>
              <p className="inv-settings-section-sub">Choose a template, customize fields, and preview your invoice layout.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {savedFlash && (
              <span className="inv-saved-badge animate-scaleIn">
                <Check size={14} /> Saved!
              </span>
            )}
            <button className="btn btn-ghost" onClick={handleResetDefaults}>Reset Defaults</button>
            <button className="btn btn-primary" onClick={handleSaveInvoiceSettings}>
              <Save size={16} /> Save Invoice Settings
            </button>
          </div>
        </div>

        <div className="inv-settings-body">
          {/* ── Left: Template Picker + Options ── */}
          <div className="inv-settings-left">

            {/* Template Cards */}
            <div className="inv-template-section">
              <h4 className="inv-option-heading"><Palette size={16} /> Select Template</h4>
              <div className="inv-template-grid">
                {TEMPLATES.map(t => (
                  <button
                    key={t.key}
                    className={`inv-template-card ${invoiceSettings.selectedTemplate === t.key ? 'inv-template-active' : ''}`}
                    onClick={() => updateSetting('selectedTemplate', t.key)}
                  >
                    <div className="inv-template-card-icon">
                      {t.key === 'classic' && <span className="inv-tpl-icon inv-tpl-classic">C</span>}
                      {t.key === 'modern' && <span className="inv-tpl-icon inv-tpl-modern">M</span>}
                      {t.key === 'minimal' && <span className="inv-tpl-icon inv-tpl-minimal">m</span>}
                      {t.key === 'thermal' && <span className="inv-tpl-icon inv-tpl-thermal">T</span>}
                    </div>
                    <div className="inv-template-card-info">
                      <strong>{t.label}</strong>
                      <span>{t.desc}</span>
                    </div>
                    {invoiceSettings.selectedTemplate === t.key && (
                      <div className="inv-template-check"><Check size={16} /></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Customizations */}
            <div className="inv-options-group">
              <h4 className="inv-option-heading"><Type size={16} /> Text & Labels</h4>
              <div className="settings-field">
                <label className="settings-label">Invoice Title</label>
                <input className="input" type="text" value={invoiceSettings.invoiceTitle} onChange={e => updateSetting('invoiceTitle', e.target.value)} placeholder="INVOICE" />
              </div>
              <div className="settings-field">
                <label className="settings-label">Currency Symbol</label>
                <input className="input" type="text" value={invoiceSettings.currencySymbol} onChange={e => updateSetting('currencySymbol', e.target.value)} placeholder="৳" style={{ maxWidth: 120 }} />
              </div>
              <div className="settings-field">
                <label className="settings-label">Footer Message</label>
                <input className="input" type="text" value={invoiceSettings.footerMessage} onChange={e => updateSetting('footerMessage', e.target.value)} placeholder="Thank you for your business!" />
              </div>
              <div className="settings-field">
                <label className="settings-label">Footer Note</label>
                <input className="input" type="text" value={invoiceSettings.footerNote} onChange={e => updateSetting('footerNote', e.target.value)} placeholder="Goods sold are not returnable..." />
              </div>
            </div>

            {/* Toggle Options */}
            <div className="inv-options-group">
              <h4 className="inv-option-heading"><ToggleRight size={16} /> Display Options</h4>
              <div className="inv-toggles-grid">
                <Toggle value={invoiceSettings.showCustomerPhone} onChange={v => updateSetting('showCustomerPhone', v)} label="Customer Phone" />
                <Toggle value={invoiceSettings.showCustomerAddress} onChange={v => updateSetting('showCustomerAddress', v)} label="Customer Address" />
                <Toggle value={invoiceSettings.showPaymentMethod} onChange={v => updateSetting('showPaymentMethod', v)} label="Payment Method" />
                <Toggle value={invoiceSettings.showDueBalance} onChange={v => updateSetting('showDueBalance', v)} label="Due Balance" />
                <Toggle value={invoiceSettings.showTaxColumn} onChange={v => updateSetting('showTaxColumn', v)} label="Tax Row" />
                <Toggle value={invoiceSettings.showDiscountRow} onChange={v => updateSetting('showDiscountRow', v)} label="Discount Row" />
                <Toggle value={invoiceSettings.showPoweredBy} onChange={v => updateSetting('showPoweredBy', v)} label="Powered By Footer" />
              </div>
            </div>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="inv-settings-right">
            <div className="inv-preview-header">
              <Eye size={16} />
              <span>Live Preview — <strong>{TEMPLATES.find(t => t.key === invoiceSettings.selectedTemplate)?.label}</strong></span>
            </div>
            <div className="inv-preview-scroll">
              <div className="inv-preview-paper">
                <InvoiceTemplate
                  sale={SAMPLE_SALE}
                  shopSettings={{ name: shopName, address, phone }}
                  templateOverride={invoiceSettings.selectedTemplate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
