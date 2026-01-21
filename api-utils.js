
const API_CONFIG = {
    baseUrl: 'http://localhost:8080',  
    tokenKey: 'auth_token',
    userDataKey: 'user_data',
    timeout: 30000
};


/**
 * Get the stored authentication token
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem(API_CONFIG.tokenKey);
}

/**
 * Store authentication token
 * @param {string} token - JWT token
 */
function setAuthToken(token) {
    localStorage.setItem(API_CONFIG.tokenKey, token);
}

/**
 * Remove authentication token
 */
function removeAuthToken() {
    localStorage.removeItem(API_CONFIG.tokenKey);
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    
    // Optionally check if token is expired (JWT specific)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < exp;
    } catch (e) {
        return false;
    }
}

// =============================================================================
// User Data Management
// =============================================================================

/**
 * Get stored user data
 * @returns {Object|null}
 */
function getStoredUser() {
    const userData = localStorage.getItem(API_CONFIG.userDataKey);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Store user data
 * @param {Object} user - User data object
 */
function setStoredUser(user) {
    localStorage.setItem(API_CONFIG.userDataKey, JSON.stringify(user));
}

/**
 * Remove stored user data
 */
function removeStoredUser() {
    localStorage.removeItem(API_CONFIG.userDataKey);
}

/**
 * Clear all authentication data (logout)
 */
function clearAuthData() {
    removeAuthToken();
    removeStoredUser();
}

// =============================================================================
// HTTP Request Helpers
// =============================================================================

/**
 * Build request headers
 * @param {boolean} includeAuth - Whether to include Authorization header
 * @param {string} contentType - Content-Type header value
 * @returns {Object} Headers object
 */
function buildHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {
        'Accept': 'application/json'
    };
    
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} If response is not ok
 */
async function handleResponse(response) {
    // Handle empty responses
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
            // Token expired or invalid
            clearAuthData();
            // Optionally redirect to login
            // window.location.href = '/login.html';
            throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        }
        
        if (response.status === 403) {
            throw new Error('Bu işlem için yetkiniz bulunmamaktadır.');
        }
        
        if (response.status === 404) {
            throw new Error('İstenen kaynak bulunamadı.');
        }
        
        if (response.status === 429) {
            throw new Error('Çok fazla istek gönderildi. Lütfen biraz bekleyin.');
        }
        
        if (response.status >= 500) {
            throw new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        }
        
        // Use error message from response if available
        throw new Error(data.message || `İstek başarısız: ${response.status}`);
    }
    
    return data;
}

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint (e.g., '/api/users/me')
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} Response data
 */
async function apiGet(endpoint, requireAuth = true) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: buildHeaders(requireAuth)
    });
    
    return handleResponse(response);
}

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} Response data
 */
async function apiPost(endpoint, data, requireAuth = true) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: buildHeaders(requireAuth),
        body: JSON.stringify(data)
    });
    
    return handleResponse(response);
}

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} Response data
 */
async function apiPut(endpoint, data, requireAuth = true) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: buildHeaders(requireAuth),
        body: JSON.stringify(data)
    });
    
    return handleResponse(response);
}

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} Response data
 */
async function apiDelete(endpoint, requireAuth = true) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: buildHeaders(requireAuth)
    });
    
    return handleResponse(response);
}

// =============================================================================
// Date/Time Utilities
// =============================================================================

/**
 * Convert date string to LocalDateTime format for Spring Boot
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} time - Time string (HH:MM:SS)
 * @returns {string} - ISO format datetime string (YYYY-MM-DDTHH:MM:SS)
 */
function toLocalDateTime(dateStr, time = '00:00:00') {
    return `${dateStr}T${time}`;
}

/**
 * Format date for display
 * @param {string} isoString - ISO date string
 * @param {string} locale - Locale string (default: 'tr-TR')
 * @returns {string} Formatted date string
 */
function formatDate(isoString, locale = 'tr-TR') {
    const date = new Date(isoString);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format datetime for display
 * @param {string} isoString - ISO datetime string
 * @param {string} locale - Locale string (default: 'tr-TR')
 * @returns {string} Formatted datetime string
 */
function formatDateTime(isoString, locale = 'tr-TR') {
    const date = new Date(isoString);
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number (10-11 digits)
 * @param {string} phone 
 * @returns {boolean}
 */
function isValidPhone(phone) {
    return /^[0-9]{10,11}$/.test(phone);
}

/**
 * Validate TC Kimlik No (11 digits)
 * @param {string} tckn 
 * @returns {boolean}
 */
function isValidTCKN(tckn) {
    return /^[0-9]{11}$/.test(tckn);
}

/**
 * Validate password strength
 * At least 8 characters, one uppercase, one lowercase, one digit
 * @param {string} password 
 * @returns {boolean}
 */
function isValidPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

// =============================================================================
// UI Helper Functions
// =============================================================================

/**
 * Show loading state on a button
 * @param {HTMLElement} button - Button element
 * @param {string} loadingText - Text to show while loading
 */
function setButtonLoading(button, loadingText = 'Yükleniyor...') {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
}

/**
 * Reset button to original state
 * @param {HTMLElement} button - Button element
 */
function resetButton(button) {
    button.textContent = button.dataset.originalText || 'Submit';
    button.disabled = false;
}

/**
 * Show error message (can be customized based on your UI framework)
 * @param {string} message - Error message
 */
function showError(message) {
    // Default: use alert. Replace with your toast/notification system
    alert(message);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    // Default: use alert. Replace with your toast/notification system
    alert(message);
}

// =============================================================================
// Export for ES Modules (optional)
// =============================================================================
// If using ES modules, uncomment the following:
/*
export {
    API_CONFIG,
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    isAuthenticated,
    getStoredUser,
    setStoredUser,
    clearAuthData,
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    toLocalDateTime,
    formatDate,
    formatDateTime,
    isValidEmail,
    isValidPhone,
    isValidTCKN,
    isValidPassword,
    setButtonLoading,
    resetButton,
    showError,
    showSuccess
};
*/