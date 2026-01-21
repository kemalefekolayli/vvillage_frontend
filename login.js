
// =============================================================================
// DOM Elements
// =============================================================================
const emailInputt = document.querySelector('#email-login-page');
const passwordInputt = document.querySelector('#password-login-page');
const LoginButton = document.querySelector('#book-login-button');

// =============================================================================
// API Functions
// =============================================================================

/**
 * Login user via Spring Boot REST API
 * 
 * Endpoint: POST /api/users/login
 * Request Body: { email: string, password: string }
 * Response: { token: string, user: { id, email, firstName, lastName, role, phoneNumber } }
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Auth response with token and user data
 */
async function loginWithSpringBoot(email, password) {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    // Handle non-OK responses
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Giriş başarısız: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle login form submission
 * @param {Event} e - Click event
 */
async function handleLogin(e) {
    e.preventDefault();

    // Validate inputs
    const email = emailInputt.value.trim();
    const password = passwordInputt.value.trim();

    if (!email || !password) {
        alert('Lütfen e-posta ve şifre alanlarını doldurunuz.');
        return;
    }

    try {
        // Call Spring Boot login endpoint
        const data = await loginWithSpringBoot(email, password);
        console.log('Login başarılı:', data);

        // Store JWT token in localStorage
        // Spring Boot returns: { token: "...", user: {...} }
        const token = data.token;
        if (token) {
            localStorage.setItem('auth_token', token);
            
            // Optionally store user data for quick access
            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }
        } else {
            throw new Error('Oturum bilgisi alınamadı!');
        }

        alert('Giriş başarılı!');
        
        // Redirect to home page or dashboard after successful login
        // Uncomment the line below to enable redirect:
        // window.location.href = '/index.html';

    } catch (err) {
        console.error('Login hatası:', err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        // Clear password field for security
        passwordInputt.value = '';
    }
}

// =============================================================================
// Event Listeners
// =============================================================================
if (LoginButton) {
    LoginButton.addEventListener('click', handleLogin);
}

// =============================================================================
// Utility Functions (exported for use in other modules)
// =============================================================================

/**
 * Check if user is currently logged in
 * @returns {boolean}
 */
function isLoggedIn() {
    return !!localStorage.getItem('auth_token');
}

/**
 * Get current auth token
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Get stored user data
 * @returns {Object|null}
 */
function getStoredUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Logout user - clear stored tokens and data
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    // Redirect to login page
    // window.location.href = '/login.html';
}

// Export functions for use in other modules (if using ES modules)
// export { isLoggedIn, getAuthToken, getStoredUser, logout };