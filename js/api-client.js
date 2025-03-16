/**
 * API Client for communicating with the backend server
 * Similar to the original api_client.py from the Kivy app
 */
const ApiClient = (() => {
    // Default API base URL - should be updated to match your server
    let baseUrl = 'https://leema.kz';
    let authToken = null;

    /**
     * Set the API base URL
     * @param {string} url - The base URL for API requests
     */
    function setBaseUrl(url) {
        baseUrl = url;
    }

    /**
     * Set the authentication token
     * @param {string} token - The auth token to use for requests
     */
    function setAuthToken(token) {
        authToken = token;
    }

    /**
     * Get default headers for API requests
     * @returns {Object} - Headers object
     */
    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (authToken) {
            headers['X-API-Key'] = authToken;
        }

        return headers;
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        // Check if we have a snackbar element
        const snackbar = document.getElementById('snackbar');
        if (snackbar) {
            snackbar.textContent = message;
            snackbar.className = 'show';
            setTimeout(() => {
                snackbar.className = snackbar.className.replace('show', '');
            }, 3000);
        } else {
            console.error(message);
        }
    }

    /**
     * Make an API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - Response data
     */
    async function apiRequest(endpoint, options = {}) {
        const url = baseUrl + endpoint;

        // Set default options
        const fetchOptions = {
            headers: getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, fetchOptions);

            // Log response for debugging
            console.log(`API Response [${response.status}]:`, url);

            // Handle different status codes
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 404) {
                return null;
            } else if (response.status === 401 || response.status === 403) {
                showError(`Ошибка авторизации (${response.status}). Пожалуйста, войдите снова.`);
                // Remove token as it's invalid
                localStorage.removeItem('auth_token');
                // Redirect to login if not already there
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                return null;
            } else {
                showError(`Ошибка API: ${response.status}`);
                return null;
            }
        } catch (error) {
            showError(`Ошибка соединения с сервером: ${error.message}`);
            return null;
        }
    }

    /**
     * Get a product by barcode from the server
     * @param {string} barcode - Product barcode
     * @returns {Promise<Object|null>} - Product data or null if not found
     */
    async function getProduct(barcode) {
        const data = await apiRequest(`/products/by-barcode/${barcode}`, {
            method: 'GET'
        });

        if (data) {
            // Map the API response to the format we expect
            return {
                barcode: data.barcode,
                name: data.sku_name
            };
        }

        return null;
    }

    /**
     * Login user and get auth token
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object|null>} - Auth data or null if login failed
     */
    async function login(username, password) {
        const data = await apiRequest('/auth/token', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password
            })
        });

        if (data && data.access_token) {
            // Set the token for future requests
            setAuthToken(data.access_token);
            return {
                token: data.access_token,
                user: data.user || { username }
            };
        }

        return null;
    }

    // Public API
    return {
        setBaseUrl,
        setAuthToken,
        getProduct,
        login
    };
})();