/**
 * login.js - Giriş Sayfası
 */

// =============================================================================
// DOM Elements
// =============================================================================
const emailInputt = document.querySelector('#email-login-page');
const passwordInputt = document.querySelector('#password-login-page');
const LoginButton = document.querySelector('#bookk-login-button');

// =============================================================================
// API Functions
// =============================================================================

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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Giriş başarısız: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleLogin(e) {
    e.preventDefault();

    const email = emailInputt.value.trim();
    const password = passwordInputt.value.trim();

    if (!email || !password) {
        alert('Lütfen e-posta ve şifre alanlarını doldurunuz.');
        return;
    }

    // Disable button
    if (LoginButton) {
        LoginButton.disabled = true;
        LoginButton.textContent = 'Giriş yapılıyor...';
    }

    try {
        const data = await loginWithSpringBoot(email, password);
        console.log('Login başarılı:', data);
        console.log('Login response:', data);  
        console.log('Token:', data.token);

        const token = data.token;
        if (token) {
            localStorage.setItem('auth_token', token);
            
            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }
        } else {
            throw new Error('Oturum bilgisi alınamadı!');
        }

        alert('Giriş başarılı!');
        window.location.href = '/index.html';

    } catch (err) {
        console.error('Login hatası:', err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        if (LoginButton) {
            LoginButton.disabled = false;
            LoginButton.textContent = 'Giriş Yap';
        }
        passwordInputt.value = '';
    }
}

// =============================================================================
// Event Listeners
// =============================================================================
if (LoginButton) {
    LoginButton.addEventListener('click', handleLogin);
}

// Enter tuşu desteği
if (passwordInputt) {
    passwordInputt.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin(e);
    });
}

// =============================================================================
// Utility Functions
// =============================================================================

function isLoggedIn() {
    return !!localStorage.getItem('auth_token');
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login.html';
}
