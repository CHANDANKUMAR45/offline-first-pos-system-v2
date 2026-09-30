const { app } = require('electron');
const { runMigrations } = require('./migrations');
const productsDao = require('./dao/products');
const salesDao = require('./dao/sales');
const customersDao = require('./dao/customers');
const { v4: uuidv4 } = require('uuid');

app.whenReady().then(() => {
  try {
    console.log('\n--- Running DB Migrations ---');
    runMigrations();
    
    console.log('\n--- Testing Products ---');
    const prodId = uuidv4();
    productsDao.createProduct({
      id: prodId,
      name: 'Test Setup Product',
      price: 15.50,
      stock: 100
    });
    console.log('Product created:', productsDao.getProductById(prodId));
    
    console.log('\n--- Testing Customers ---');
    const custId = uuidv4();
    customersDao.createCustomer({
      id: custId,
      name: 'John Doe Testing',
      phone: '1234567890'
    });
    console.log('Customer created:', customersDao.getCustomerById(custId));

    console.log('\n--- Testing Sales Transaction ---');
    const saleId = uuidv4();
    
    // Total sale 77.50, paid 50, due 27.50
    salesDao.createSale({
      id: saleId,
      customer_id: custId,
      subtotal: 77.50,
      total: 77.50,
      paid: 50.00,
      due: 27.50
    }, [{
      id: uuidv4(),
      product_id: prodId,
      product_name: 'Test Setup Product',
      quantity: 5,
      unit_price: 15.50,
      total: 77.50
    }]);
    
    console.log('Sale created successfully');
    
    const updatedProd = productsDao.getProductById(prodId);
    console.log('Product stock after sale (should be 95):', updatedProd.stock);
    
    const updatedCust = customersDao.getCustomerById(custId);
    console.log('Customer due after sale (should be 27.5):', updatedCust.total_due);
    
    console.log('\n--- Dashboard Stats ---');
    console.log(salesDao.getDashboardStats());

    console.log('\n--- DB Test Passed Successfully! ---');
  } catch (err) {
    console.error('\n!!! Test failed !!!\n', err);
    process.exit(1);
  } finally {
    app.quit();
  }
});
