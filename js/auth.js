/**
 * Authentication Manager
 * Similar to the original auth_manager.py from the Kivy app
 */
const Auth = (() => {
    // Storage keys
    const AUTH_TOKEN_KEY = 'auth_token';
    const USER_DATA_KEY = 'user_data';
    
    /**
     * Login user with credentials
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<boolean>} - Success status
     */
    async function login(username, password) {
        try {
            console.log(`Attempting login for user: ${username}`);
            
            // Call the API to login
            const authData = await ApiClient.login(username, password);
            
            if (authData && authData.token) {
                // Store authentication data
                localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
                
                // Store user data
                const userData = authData.user || { username };
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
                
                // Set the token in API client
                ApiClient.setAuthToken(authData.token);
                
                console.log('Login successful');
                return true;
            } else {
                console.log('Login failed: No token received');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }
    
    /**
     * Logout user
     */
    function logout() {
        // Remove authentication data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        
        // Clear token in API client
        ApiClient.setAuthToken(null);
        
        console.log('User logged out');
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    function isAuthenticated() {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }
    
    /**
     * Get authentication token
     * @returns {string|null} - Auth token or null if not authenticated
     */
    function getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    
    /**
     * Get user data
     * @returns {Object|null} - User data or null if not authenticated
     */
    function getUserData() {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    
    /**
     * Get authorization header for API requests
     * @returns {Object} - Headers object
     */
    function getAuthHeader() {
        const token = getToken();
        return token ? { 'X-API-Key': token } : {};
    }
    
    /**
     * Initialize authentication
     * Called when app starts
     */
    function initialize() {
        // Set the token in API client if available
        const token = getToken();
        if (token) {
            ApiClient.setAuthToken(token);
        }
    }
    
    // Public API
    return {
        login,
        logout,
        isAuthenticated,
        getToken,
        getUserData,
        getAuthHeader,
        initialize
    };
})();