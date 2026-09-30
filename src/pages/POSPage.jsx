import { useState, useEffect } from 'react';
import ProductGrid from '../components/POS/ProductGrid';
import Cart from '../components/POS/Cart';
import PaymentDialog from '../components/POS/PaymentDialog';
import { v4 as uuidv4 } from 'uuid';
import InvoiceTemplate from '../components/Invoice/InvoiceTemplate';
import './POSPage.css';

function POSPage() {
  const [cart, setCart] = useState([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  // Load Customers
  useEffect(() => {
    async function loadCustomers() {
      const res = await window.electronAPI.getCustomers({});
      if (res.success) setCustomers(res.data);
    }
    loadCustomers();
  }, []);

  // Cart Management
  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price } 
          : item
      ));
    } else {
      setCart([...cart, {
        id: uuidv4(),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
        stock_available: product.stock // Keep reference to prevent overselling UI
      }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty === 'REMOVE') {
      setCart(cart.filter(item => item.product_id !== productId));
      return;
    }
    
    // Explicitly allow empty strings to exist dynamically inside the state avoiding instant crashes during hard backspaces natively
    const validQty = (typeof newQty === 'string' && newQty === '') ? '' : parseFloat(newQty) || 0;
    
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: validQty, total: (parseFloat(validQty) || 0) * item.unit_price } 
        : item
    ));
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const processSale = async (paymentDetails) => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = paymentDetails.discount || 0;
    const finalTotal = subtotal - discount;
    const paid = parseFloat(paymentDetails.paid || 0);
    const due = Math.max(0, finalTotal - paid);

    let finalCustomerId = selectedCustomer?.id || null;
    let finalCustomerName = selectedCustomer?.name || 'Walk-in Customer';
    let finalCustomerPhone = selectedCustomer?.phone || '';

    if (!selectedCustomer && paymentDetails.quickCustomer) {
      const newCust = {
        id: uuidv4(),
        name: paymentDetails.quickCustomer.name.trim() + ' (Walk-in)',
        phone: paymentDetails.quickCustomer.phone || '',
        email: '',
        address: '__WALKIN__',
        total_due: 0
      };
      await window.electronAPI.createCustomer(newCust);
      finalCustomerId = newCust.id;
      finalCustomerName = newCust.name;
      finalCustomerPhone = newCust.phone;
      
      const fetchNewCrm = await window.electronAPI.getCustomers({});
      if (fetchNewCrm.success) setCustomers(fetchNewCrm.data);
    }

    const saleData = {
      id: uuidv4(),
      customer_id: finalCustomerId,
      subtotal,
      discount,
      tax: 0,
      total: finalTotal,
      paid,
      due,
      payment_method: paymentDetails.method || 'cash',
      status: 'completed'
    };

    try {
      const res = await window.electronAPI.createSale(saleData, cart);
      if (res.success) {
        // Prepare completed sale object for the invoice before clearing cart
        setCompletedSale({
           ...saleData,
           customer_name: finalCustomerName,
           customer_phone: finalCustomerPhone,
           customer_address: selectedCustomer?.address || '',
           created_at: new Date().toISOString(),
           items: cart
        });
        
        setCart([]);
        setSelectedCustomer(null);
        setIsPaymentOpen(false);
        
        // Timeout to allow React to render the InvoiceTemplate before calling print
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        alert(`Failed to complete sale: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('An expected error occurred.');
    }
  };

  return (
    <div className="pos-layout animate-fadeIn">
      {/* Left side: Products Grid */}
      <div className="pos-products-panel">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      {/* Right side: Cart */}
      <div className="pos-cart-panel">
        <Cart 
          items={cart} 
          onUpdateQty={updateQuantity} 
          onClear={clearCart} 
          onCheckout={handleCheckout} 
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(id) => setSelectedCustomer(customers.find(c => c.id === id) || null)}
        />
      </div>

      {isPaymentOpen && (
        <PaymentDialog 
          cartTotal={cart.reduce((sum, item) => sum + item.total, 0)}
          selectedCustomer={selectedCustomer}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={processSale}
        />
      )}

      {/* Hidden Invoice Template for Printing */}
      <div className="print-area">
        {completedSale && <InvoiceTemplate sale={completedSale} />}
      </div>
    </div>
  );
}

export default POSPage;
