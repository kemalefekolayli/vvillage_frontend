/**
 * register.js - Kayıt Sayfası
 */

// =============================================================================
// DOM Elements
// =============================================================================
const regNameInput = document.querySelector('#name-register-page');
const regSurnameInput = document.querySelector('#surname-register-page');
const regEmailInput = document.querySelector('#email-register-page');
const regPhoneInput = document.querySelector('#phone-register-page');
const regPasswordInput = document.querySelector('#password-register-page');
const regPasswordInputAgain = document.querySelector('#password-again-register-page');
const AcceptCheckBox = document.querySelector('#accept-policy');
const RegisterButton = document.querySelector('#book-register-button');

let termsAccepted = AcceptCheckBox ? AcceptCheckBox.checked : false;

// =============================================================================
// Validation Functions
// =============================================================================

function validatePassword() {
    if (regPasswordInput.value.trim() === regPasswordInputAgain.value.trim()) {
        return true;
    } else {
        alert('Şifreler uyuşmuyor!');
        return false;
    }
}

function validateRegEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegPhone(phone) {
    return /^[0-9]{10,11}$/.test(phone);
}

function validatePasswordStrength(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
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

async function registerWithSpringBoot(payload) {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/users/register`, {
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
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
        firstname: regNameInput.value.trim(),
        lastname: regSurnameInput.value.trim(),
        email: regEmailInput.value.trim(),
        password: regPasswordInput.value.trim(),
        phone: regPhoneInput.value.trim()
    };

    // Validate required fields
    if (!payload.firstname || !payload.lastname || !payload.email || !payload.password || !payload.phone) {
        alert('Lütfen tüm alanları doldurunuz.');
        return;
    }

    // Validate email format
    if (!validateRegEmail(payload.email)) {
        alert('Geçerli bir e-posta adresi giriniz.');
        return;
    }

    // Validate phone format
    if (!validateRegPhone(payload.phone)) {
        alert('Telefon numarası 10-11 rakam olmalıdır.');
        return;
    }

    // Validate password strength
    if (!validatePasswordStrength(payload.password)) {
        alert('Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
        return;
    }

    // Disable button
    if (RegisterButton) {
        RegisterButton.disabled = true;
        RegisterButton.textContent = 'Kayıt yapılıyor...';
    }

    try {
        const data = await registerWithSpringBoot(payload);
        console.log('Kayıt başarılı:', data);

        const token = data.token;
        if (token) {
            localStorage.setItem('auth_token', token);
            
            if (data.user) {
                localStorage.setItem('user_data', JSON.stringify(data.user));
            }
            
            alert('Kayıt başarılı!');
            window.location.href = '/index.html';
        } else {
            alert('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        }

    } catch (err) {
        console.error('Kayıt hatası:', err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        if (RegisterButton) {
            RegisterButton.disabled = false;
            RegisterButton.textContent = 'Kayıt Ol';
        }
        clearRegForm();
    }
}

function clearRegForm() {
    if (regNameInput) regNameInput.value = '';
    if (regSurnameInput) regSurnameInput.value = '';
    if (regEmailInput) regEmailInput.value = '';
    if (regPhoneInput) regPhoneInput.value = '';
    if (regPasswordInput) regPasswordInput.value = '';
    if (regPasswordInputAgain) regPasswordInputAgain.value = '';
    if (AcceptCheckBox) AcceptCheckBox.checked = false;
    termsAccepted = false;
}

// =============================================================================
// Event Listeners
// =============================================================================
if (RegisterButton) {
    RegisterButton.addEventListener('click', registerTotal);
}
