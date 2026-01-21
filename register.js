const API_BASE_URL = 'https://cftcbrand-pms-production.up.railway.app';

// =============================================================================
// DOM Elements
// =============================================================================
const nameInput = document.querySelector('#name-register-page');
const surnameInput = document.querySelector('#surname-register-page');
const emailInput = document.querySelector('#email-register-page');
const phoneInput = document.querySelector('#phone-register-page');
const passwordInput = document.querySelector('#password-register-page');
const passwordInputAgain = document.querySelector('#password-again-register-page');
const AcceptCheckBox = document.querySelector('#accept-policy');
const RegisterButton = document.querySelector('#book-register-button');

let passwordsMatch = false;
let termsAccepted = AcceptCheckBox ? AcceptCheckBox.checked : false;

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate that both password fields match
 * @returns {boolean}
 */
function validatePassword() {
    if (passwordInput.value.trim() === passwordInputAgain.value.trim()) {
        passwordsMatch = true;
        return true;
    } else {
        alert('Şifreler uyuşmuyor!');
        passwordsMatch = false;
        return false;
    }
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (10-11 digits)
 * @param {string} phone 
 * @returns {boolean}
 */
function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * Password must be at least 8 characters with uppercase, lowercase, and digit
 * @param {string} password 
 * @returns {boolean}
 */
function validatePasswordStrength(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// =============================================================================
// Event Listeners for Checkbox
// =============================================================================
if (AcceptCheckBox) {
    AcceptCheckBox.addEventListener('change', (e) => {
        termsAccepted = e.target.checked;
        if (!termsAccepted) {
            alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
        }
    });
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Register user via Spring Boot REST API
 * 
 * Endpoint: POST /api/users/register
 * Request Body: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phoneNumber: string,
 *   password: string
 * }
 * Response: { token: string, user: { id, email, firstName, lastName, role, phoneNumber } }
 * 
 * @param {Object} payload - Registration data
 * @returns {Promise<Object>} - Auth response with token and user data
 */
async function registerWithSpringBoot(payload) {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            firstName: payload.firstname,
            lastName: payload.lastname,
            email: payload.email,
            phoneNumber: payload.phone,
            password: payload.password
        })
    });

    // Handle non-OK responses
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error codes from Spring Boot
        if (response.status === 400 && errorData.code === 1004) {
            throw new Error('Bu e-posta adresi zaten kullanılıyor.');
        }
        
        throw new Error(errorData.message || `Kayıt başarısız: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handle registration form submission
 * @param {Event} e - Click event
 */
async function registerTotal(e) {
    e.preventDefault();

    // Validate password match
    if (!validatePassword()) {
        return;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
        alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
        return;
    }

    // Gather form data
    const payload = {
        firstname: nameInput.value.trim(),
        lastname: surnameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    // Validate required fields
    if (!payload.firstname || !payload.lastname || !payload.email || !payload.password || !payload.phone) {
        alert('Lütfen tüm alanları doldurunuz.');
        return;
    }

    // Validate email format
    if (!validateEmail(payload.email)) {
        alert('Geçerli bir e-posta adresi giriniz.');
        return;
    }

    // Validate phone format
    if (!validatePhone(payload.phone)) {
        alert('Telefon numarası 10-11 rakam olmalıdır.');
        return;
    }

    // Validate password strength
    if (!validatePasswordStrength(payload.password)) {
        alert('Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
        return;
    }

    try {
        // Call Spring Boot register endpoint
        const data = await registerWithSpringBoot(payload);
        console.log('Kayıt başarılı:', data);

        // Store JWT token in localStorage
        // Spring Boot returns: { token: "...", user: {...} }
        const token = data.token;
        if (token) {
            localStorage.setItem('auth_token', token);
            
            // Optionally store user data for quick access
            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            
            alert('Kayıt başarılı!');
            
            // Redirect to home page or dashboard after successful registration
            // Uncomment the line below to enable redirect:
            // window.location.href = '/index.html';
        } else {
            // Registration successful but no auto-login (email verification required)
            alert('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        }

    } catch (err) {
        console.error('Kayıt hatası:', err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        // Clear form fields
        clearForm();
    }
}

/**
 * Clear all form fields
 */
function clearForm() {
    if (nameInput) nameInput.value = '';
    if (surnameInput) surnameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (passwordInputAgain) passwordInputAgain.value = '';
    if (AcceptCheckBox) AcceptCheckBox.checked = false;
    termsAccepted = false;
}

// =============================================================================
// Event Listeners
// =============================================================================
if (RegisterButton) {
    RegisterButton.addEventListener('click', registerTotal);
}