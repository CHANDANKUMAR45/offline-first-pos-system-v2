import { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ProductForm from '../components/Products/ProductForm';
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async (searchQuery = '') => {
    const res = await window.electronAPI.getProducts({ search: searchQuery });
    if (res.success) {
      setProducts(res.data);
    } else {
      console.error('Failed to fetch products:', res.error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSave = async (data) => {
    if (editingProduct) {
      const res = await window.electronAPI.updateProduct(editingProduct.id, data);
      if (res.success) {
        setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
      }
    } else {
      data.id = uuidv4();
      const res = await window.electronAPI.createProduct(data);
      if (res.success) {
        setProducts([res.data, ...products]);
      }
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const res = await window.electronAPI.deleteProduct(id);
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
      }
    }
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  return (
    <div className="page animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">{activeTab === 'inventory' ? 'Products & Inventory' : 'Product Sales Analytics'}</h2>
          <p className="page-subtitle">
            {activeTab === 'inventory' ? 'Manage your product catalog and inventory levels.' : 'Track net gross, and cost equations across individual products organically.'}
          </p>
        </div>
        {activeTab === 'inventory' && (
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
         <button 
           className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'}`}
           onClick={() => setActiveTab('inventory')}
           style={{ border: activeTab === 'inventory' ? 'none' : '1px solid var(--border-color)' }}
         >
           Physical Inventory
         </button>
         <button 
           className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
           onClick={() => setActiveTab('analytics')}
           style={{ border: activeTab === 'analytics' ? 'none' : '1px solid var(--border-color)' }}
         >
           Advanced Sales Analytics
         </button>
      </div>

      <div className="card products-container">
        <div className="products-toolbar">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="input search-input" 
              placeholder="Search products by name or barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              {activeTab === 'inventory' ? (
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price (৳)</th>
                  <th>Cost (৳)</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th className="text-right">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Product Details</th>
                  <th>Total Sold</th>
                  <th>Gross Revenue</th>
                  <th>Total Cost</th>
                  <th className="text-right">Net Profit</th>
                </tr>
              )}
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const itemsSold = parseFloat(product.lifetime_sold) || 0;
                  const itemRevenue = parseFloat(product.lifetime_revenue) || 0;
                  const itemCost = itemsSold * (parseFloat(product.cost_price) || 0);
                  const netProfit = itemRevenue - itemCost;
                  const isLoss = netProfit < 0;

                  return activeTab === 'inventory' ? (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={20} opacity={0.3} />
                            )}
                          </div>
                          <span className="font-medium text-white">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category || '—'}</td>
                      <td>৳{product.price.toFixed(2)}</td>
                      <td>৳{(product.cost_price || 0).toFixed(2)}</td>
                      <td>
                        <span className={`stock-badge ${product.stock <= product.low_stock_threshold ? 'stock-low' : 'stock-good'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>{product.unit}</td>
                      <td className="actions-cell">
                        <button className="btn-icon text-primary" onClick={() => openEdit(product)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(product.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={`analytics-${product.id}`}>
                      <td>
                        <span className="font-medium text-white" style={{ display: 'block' }}>{product.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Selling AT: ৳{product.price.toFixed(2)} / Costing: ৳{(product.cost_price||0).toFixed(2)}</span>
                      </td>
                      <td className="font-bold">{itemsSold} {product.unit}</td>
                      <td>৳{itemRevenue.toFixed(2)}</td>
                      <td>৳{itemCost.toFixed(2)}</td>
                      <td className="actions-cell">
                         <span className={`stock-badge ${isLoss ? 'stock-low' : 'stock-good'}`}>
                            {isLoss ? '-' : '+'} ৳{Math.abs(netProfit).toFixed(2)}
                         </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Package size={48} className="empty-icon" />
                    <p>No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <ProductForm 
          initialData={editingProduct} 
          onSave={handleSave} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}

export default ProductsPage;
