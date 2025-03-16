/**
 * Database manager for offline data storage using IndexedDB
 * This is an implementation similar to the original SQLite database in the Kivy app
 */
const Database = (() => {
    const DB_NAME = 'pos_web_app';
    const DB_VERSION = 1;
    let db = null;

    /**
     * Initialize the database and create object stores
     */
    async function initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                reject(new Error('Database error: ' + event.target.errorCode));
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Database opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores similar to SQLite tables
                
                // Products store
                const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                productsStore.createIndex('barcode', 'barcode', { unique: true });
                productsStore.createIndex('name', 'name', { unique: false });
                
                // Invoices store
                const invoicesStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                invoicesStore.createIndex('date', 'date', { unique: false });
                invoicesStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
                
                // Invoice items store
                const invoiceItemsStore = db.createObjectStore('invoice_items', { keyPath: 'id', autoIncrement: true });
                invoiceItemsStore.createIndex('invoiceId', 'invoiceId', { unique: false });
                invoiceItemsStore.createIndex('productId', 'productId', { unique: false });
                
                // Settings store
                db.createObjectStore('settings', { keyPath: 'key' });
            };
        });
    }

    /**
     * Get the database instance, initializing if necessary
     */
    async function getDb() {
        if (!db) {
            await initDatabase();
        }
        return db;
    }

    /**
     * Add a product to the database
     * @param {Object} product - Product data
     * @returns {Promise<number>} - ID of the added product
     */
    async function addProduct(product) {
        const db = await getDb();
        
        // Add created_at and updated_at timestamps
        const now = new Date().toISOString();
        const productWithTimestamp = {
            ...product,
            createdAt: now,
            updatedAt: now
        };
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            const request = store.add(productWithTimestamp);
            
            request.onsuccess = (event) => {
                resolve(event.target.result); // Returns the generated ID
            };
            
            request.onerror = (event) => {
                if (event.target.error.name === 'ConstraintError') {
                    reject(new Error('Product with this barcode already exists'));
                } else {
                    reject(event.target.error);
                }
            };
        });
    }

    /**
     * Update a product in the database
     * @param {number} id - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise<boolean>} - Success status
     */
    async function updateProduct(id, productData) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            // First get the existing product
            const getRequest = store.get(id);
            
            getRequest.onsuccess = (event) => {
                const product = event.target.result;
                
                if (!product) {
                    reject(new Error('Product not found'));
                    return;
                }
                
                // Update product data
                const updatedProduct = {
                    ...product,
                    ...productData,
                    updatedAt: new Date().toISOString()
                };
                
                const updateRequest = store.put(updatedProduct);
                
                updateRequest.onsuccess = () => {
                    resolve(true);
                };
                
                updateRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };
            
            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Update product quantity
     * @param {number} id - Product ID
     * @param {number} quantity - New quantity
     * @returns {Promise<boolean>} - Success status
     */
    async function updateProductQuantity(id, quantity) {
        return updateProduct(id, { quantity });
    }

    /**
     * Find a product by barcode
     * @param {string} barcode - Product barcode
     * @returns {Promise<Object|null>} - Product object or null if not found
     */
    async function findProductByBarcode(barcode) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('barcode');
            
            const request = index.get(barcode);
            
            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Find a product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Object|null>} - Product object or null if not found
     */
    async function findProductById(id) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Get all products
     * @param {string} sortBy - Field to sort by ('name', 'price', 'quantity')
     * @returns {Promise<Array>} - Array of products
     */
    async function getAllProducts(sortBy = 'name') {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const products = event.target.result;
                
                // Sort products
                products.sort((a, b) => {
                    if (sortBy === 'price') {
                        return a.price - b.price;
                    } else if (sortBy === 'quantity') {
                        return a.quantity - b.quantity;
                    } else {
                        // Default sort by name
                        return a.name.localeCompare(b.name);
                    }
                });
                
                resolve(products);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Search products by name or barcode
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} - Array of matching products
     */
    async function searchProducts(searchTerm) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const products = event.target.result;
                
                // Filter products by name or barcode
                const filtered = products.filter(product => {
                    const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const barcodeMatch = product.barcode.includes(searchTerm);
                    return nameMatch || barcodeMatch;
                });
                
                // Sort by name
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                
                resolve(filtered);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Create a new invoice
     * @param {Object} invoice - Invoice data
     * @returns {Promise<number>} - ID of the created invoice
     */
    async function createInvoice(invoice) {
        const db = await getDb();
        
        // Add date and created_at
        const now = new Date().toISOString();
        const invoiceWithTimestamp = {
            ...invoice,
            date: now,
            createdAt: now
        };
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            const request = store.add(invoiceWithTimestamp);
            
            request.onsuccess = (event) => {
                resolve(event.target.result); // Returns the generated ID
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Update an existing invoice
     * @param {number} id - Invoice ID
     * @param {Object} invoiceData - Updated invoice data
     * @returns {Promise<boolean>} - Success status
     */
    async function updateInvoice(id, invoiceData) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoices'], 'readwrite');
            const store = transaction.objectStore('invoices');
            
            // First get the existing invoice
            const getRequest = store.get(id);
            
            getRequest.onsuccess = (event) => {
                const invoice = event.target.result;
                
                if (!invoice) {
                    reject(new Error('Invoice not found'));
                    return;
                }
                
                // Update invoice data
                const updatedInvoice = {
                    ...invoice,
                    ...invoiceData,
                    updatedAt: new Date().toISOString()
                };
                
                const updateRequest = store.put(updatedInvoice);
                
                updateRequest.onsuccess = () => {
                    resolve(true);
                };
                
                updateRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };
            
            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Add an item to an invoice
     * @param {Object} item - Invoice item data
     * @returns {Promise<number>} - ID of the added item
     */
    async function addInvoiceItem(item) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoice_items'], 'readwrite');
            const store = transaction.objectStore('invoice_items');
            
            const request = store.add(item);
            
            request.onsuccess = (event) => {
                resolve(event.target.result); // Returns the generated ID
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Delete all items for a specific invoice
     * @param {number} invoiceId - Invoice ID
     * @returns {Promise<boolean>} - Success status
     */
    async function deleteInvoiceItems(invoiceId) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoice_items'], 'readwrite');
            const store = transaction.objectStore('invoice_items');
            const index = store.index('invoiceId');
            
            // Get all items for this invoice
            const getRequest = index.getAll(invoiceId);
            
            getRequest.onsuccess = (event) => {
                const items = event.target.result;
                
                if (items.length === 0) {
                    resolve(true); // No items to delete
                    return;
                }
                
                let deletedCount = 0;
                
                // Delete each item
                items.forEach(item => {
                    const deleteRequest = store.delete(item.id);
                    
                    deleteRequest.onsuccess = () => {
                        deletedCount++;
                        if (deletedCount === items.length) {
                            resolve(true); // All items deleted
                        }
                    };
                    
                    deleteRequest.onerror = (event) => {
                        reject(event.target.error);
                    };
                });
            };
            
            getRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Get an invoice by ID
     * @param {number} id - Invoice ID
     * @returns {Promise<Object|null>} - Invoice object or null if not found
     */
    async function getInvoice(id) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoices'], 'readonly');
            const store = transaction.objectStore('invoices');
            
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Get items for an invoice
     * @param {number} invoiceId - Invoice ID
     * @returns {Promise<Array>} - Array of invoice items
     */
    async function getInvoiceItems(invoiceId) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoice_items', 'products'], 'readonly');
            const itemsStore = transaction.objectStore('invoice_items');
            const productsStore = transaction.objectStore('products');
            const index = itemsStore.index('invoiceId');
            
            const request = index.getAll(invoiceId);
            
            request.onsuccess = async (event) => {
                const items = event.target.result;
                
                // Add product info to each item
                const itemsWithProductInfo = await Promise.all(items.map(async (item) => {
                    return new Promise((resolve) => {
                        const productRequest = productsStore.get(item.productId);
                        
                        productRequest.onsuccess = (event) => {
                            const product = event.target.result;
                            resolve({
                                ...item,
                                name: product ? product.name : 'Unknown Product',
                                barcode: product ? product.barcode : ''
                            });
                        };
                        
                        productRequest.onerror = () => {
                            resolve({
                                ...item,
                                name: 'Unknown Product',
                                barcode: ''
                            });
                        };
                    });
                }));
                
                resolve(itemsWithProductInfo);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Get invoices by date range
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Promise<Array>} - Array of invoices
     */
    async function getInvoicesByPeriod(startDate, endDate) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoices'], 'readonly');
            const store = transaction.objectStore('invoices');
            
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const invoices = event.target.result;
                
                // Filter invoices by date range
                const filtered = invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
                });
                
                // Sort by date (newest first)
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                resolve(filtered);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Delete an invoice
     * @param {number} id - Invoice ID
     * @returns {Promise<boolean>} - Success status
     */
    async function deleteInvoice(id) {
        const db = await getDb();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['invoices', 'invoice_items'], 'readwrite');
            const invoiceStore = transaction.objectStore('invoices');
            const itemsStore = transaction.objectStore('invoice_items');
            const index = itemsStore.index('invoiceId');
            
            // First delete all items for this invoice
            const getItemsRequest = index.getAll(id);
            
            getItemsRequest.onsuccess = () => {
                const items = getItemsRequest.result;
                
                // Delete each item
                items.forEach(item => {
                    itemsStore.delete(item.id);
                });
                
                // Then delete the invoice
                const deleteRequest = invoiceStore.delete(id);
                
                deleteRequest.onsuccess = () => {
                    resolve(true);
                };
                
                deleteRequest.onerror = (event) => {
                    reject(event.target.error);
                };
            };
            
            getItemsRequest.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Get sales analytics for a period
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Promise<Object>} - Sales analytics
     */
    async function getSalesAnalytics(startDate, endDate) {
        const invoices = await getInvoicesByPeriod(startDate, endDate);
        
        if (invoices.length === 0) {
            return {
                totalSales: 0,
                invoiceCount: 0,
                averageInvoice: 0,
                paidAmount: 0,
                debtAmount: 0
            };
        }
        
        const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const invoiceCount = invoices.length;
        const averageInvoice = totalSales / invoiceCount;
        
        const paidAmount = invoices
            .filter(invoice => invoice.paymentStatus === true)
            .reduce((sum, invoice) => sum + invoice.total, 0);
            
        const debtAmount = invoices
            .filter(invoice => invoice.paymentStatus === false)
            .reduce((sum, invoice) => sum + invoice.total, 0);
        
        return {
            totalSales,
            invoiceCount,
            averageInvoice,
            paidAmount,
            debtAmount
        };
    }

    // Public API
    return {
        initDatabase,
        addProduct,
        updateProduct,
        updateProductQuantity,
        findProductByBarcode,
        findProductById,
        getAllProducts,
        searchProducts,
        createInvoice,
        updateInvoice,     // Добавлена новая функция
        addInvoiceItem,
        getInvoice,
        getInvoiceItems,
        deleteInvoiceItems, // Добавлена новая функция
        getInvoicesByPeriod,
        deleteInvoice,
        getSalesAnalytics
    };
})();