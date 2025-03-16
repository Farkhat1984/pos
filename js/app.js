/**
 * Main Application
 * Initializes and manages the POS web application
 */
const App = (() => {
    // Application state
    let initialized = false;
    let currentInvoice = [];
    
    /**
     * Initialize the application
     */
    async function initialize() {
        if (initialized) return;
        
        try {
            console.log('Initializing POS Web App...');
            
            // Initialize database
            await Database.initDatabase();
            console.log('Database initialized');
            
            // Initialize authentication
            Auth.initialize();
            console.log('Authentication initialized');
            
            // Set API base URL (if different from default)
            // ApiClient.setBaseUrl('https://api.example.com');
            
            // Load authentication token for API client
            if (Auth.isAuthenticated()) {
                ApiClient.setAuthToken(Auth.getToken());
            }
            
            // Route to appropriate page based on authentication
            routeToPage();
            
            // Add global event listeners
            setupGlobalEventListeners();
            
            initialized = true;
            console.log('App initialization complete');
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Show error on loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="error-message">
                        <h3>Ошибка инициализации приложения</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary mt-3">Попробовать снова</button>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Route to appropriate page based on authentication status
     */
    function routeToPage() {
        // Get current page
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        
        // Check authentication
        if (!Auth.isAuthenticated()) {
            // If not authenticated and not on login page, redirect to login
            if (!isLoginPage) {
                window.location.href = 'pages/login.html';
            }
        } else {
            // If authenticated and on login page, redirect to main
            if (isLoginPage) {
                window.location.href = '../index.html';
            }
            
            // Load app content
            loadAppContent();
        }
    }
    
    /**
     * Load application content
     */
    function loadAppContent() {
        // Load main app container
        const appContainer = document.getElementById('app-container');
        if (!appContainer) return;
        
        // Check if we're on the index page
        const isIndexPage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html';
        
        if (isIndexPage) {
            // Load main dashboard
            fetch('pages/main.html')
                .then(response => response.text())
                .then(html => {
                    appContainer.innerHTML = html;
                    
                    // Set user name if available
                    const userData = Auth.getUserData();
                    const userNameElement = document.getElementById('user-name');
                    if (userData && userNameElement) {
                        userNameElement.textContent = userData.username || 'Пользователь';
                    }
                    
                    // Setup event listeners for menu items
                    setupMainPageEventListeners();
                })
                .catch(error => {
                    console.error('Failed to load main page:', error);
                    appContainer.innerHTML = `<div class="error-message text-center">
                        <h3>Ошибка загрузки страницы</h3>
                        <p>${error.message}</p>
                    </div>`;
                });
        }
    }
    
    /**
     * Setup global event listeners
     */
    function setupGlobalEventListeners() {
        // Listen for authentication errors
        window.addEventListener('auth-error', () => {
            // Redirect to login page
            window.location.href = 'pages/login.html';
        });
    }
    
    /**
     * Setup event listeners for main page
     */
    function setupMainPageEventListeners() {
        // Logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                UIController.showConfirmDialog(
                    'Выход из системы',
                    'Вы уверены, что хотите выйти?',
                    () => {
                        Auth.logout();
                        window.location.href = 'pages/login.html';
                    }
                );
            });
        }
        
        // Main menu items
        const menuItems = [
            { id: 'scan-invoice-action', page: 'pages/scan-invoice.html' },
            { id: 'inventory-action', page: 'pages/inventory.html' },
            { id: 'invoice-history-action', page: 'pages/invoice-history.html' },
            { id: 'analytics-action', page: 'pages/analytics.html' }
        ];
        
        menuItems.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) {
                element.addEventListener('click', () => {
                    window.location.href = item.page;
                });
            }
        });
    }
    
    /**
     * Get current invoice items
     * @returns {Array} - Current invoice items
     */
    function getCurrentInvoice() {
        return currentInvoice;
    }
    
    /**
     * Set current invoice items
     * @param {Array} items - Invoice items
     */
    function setCurrentInvoice(items) {
        currentInvoice = items;
    }
    
    /**
     * Add item to current invoice
     * @param {Object} item - Invoice item
     */
    function addToInvoice(item) {
        // Check if product already exists in invoice
        const existingIndex = currentInvoice.findIndex(i => i.productId === item.productId);
        
        if (existingIndex >= 0) {
            // Update existing item
            currentInvoice[existingIndex].quantity += 1;
            currentInvoice[existingIndex].total = 
                currentInvoice[existingIndex].quantity * currentInvoice[existingIndex].price;
        } else {
            // Add new item
            currentInvoice.push(item);
        }
    }
    
    /**
     * Remove item from current invoice
     * @param {number} index - Item index
     */
    function removeFromInvoice(index) {
        if (index >= 0 && index < currentInvoice.length) {
            currentInvoice.splice(index, 1);
        }
    }
    
    /**
     * Clear current invoice
     */
    function clearInvoice() {
        currentInvoice = [];
    }
    
    // Public API
    return {
        initialize,
        getCurrentInvoice,
        setCurrentInvoice,
        addToInvoice,
        removeFromInvoice,
        clearInvoice
    };
})();

// Initialize app when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.initialize();
});