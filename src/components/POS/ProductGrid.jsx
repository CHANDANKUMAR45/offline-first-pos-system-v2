import { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import './ProductGrid.css';

function ProductGrid({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  const fetchProducts = async (searchQuery = '') => {
    const res = await window.electronAPI.getProducts({ search: searchQuery });
    if (res.success) {
      setProducts(res.data);
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

  return (
    <div className="product-grid-container">
      {/* Search Bar */}
      <div className="pg-toolbar">
        <h3 className="pg-title">Select Products</h3>
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

      {/* Grid */}
      <div className="pg-grid-wrapper">
        <div className="pg-grid">
          {products.map((product) => {
            const outOfStock = product.stock <= 0;
            return (
              <div 
                key={product.id} 
                className={`pg-card ${outOfStock ? 'out-of-stock' : ''}`}
                onClick={() => !outOfStock && onAddToCart(product)}
              >
                <div className="pg-card-img-placeholder">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="pg-card-img" />
                  ) : (
                    <Package size={32} opacity={0.3} />
                  )}
                </div>
                <div className="pg-card-body">
                  <h4 className="pg-card-name" title={product.name}>{product.name}</h4>
                  <p className="pg-card-stock" style={{ color: outOfStock ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {outOfStock ? 'Out of Stock' : `${product.stock} ${product.unit} left`}
                  </p>
                  <p className="pg-card-price text-primary font-bold">৳{product.price.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
             <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <Package size={48} className="empty-icon" />
                <p>No products match your search.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductGrid;
