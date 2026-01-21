/**
 * book.js - Rezervasyon Formu
 * 
 * Bu dosya book.html sayfasında kullanılır.
 * URL'den propertyId parametresini alır: book.html?propertyId=3
 */

// =============================================================================
// Property ID - URL'den al
// =============================================================================

function getPropertyIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('propertyId');
    return propertyId ? parseInt(propertyId, 10) : 1;
}

const CURRENT_PROPERTY_ID = getPropertyIdFromURL();

// =============================================================================
// DOM Elements
// =============================================================================
const nameInput = document.querySelector('#name');
const surnameInput = document.querySelector('#surname');
const emailInput = document.querySelector('#email');
const phoneInput = document.querySelector('#phone');
const tcknInput = document.querySelector('#tckn');
const addButton = document.querySelector('#addButton');
const decrementButton = document.querySelector('#decrementButton');
const guestCountInput = document.querySelector('#guests');
const checkinInput = document.querySelector('#checkin');
const checkoutInput = document.querySelector('#checkout');
const checkbox1 = document.querySelector('#reservationCheckbox1');
const checkbox2 = document.querySelector('#reservationCheckbox2');
const checkbox3 = document.querySelector('#reservationCheckbox3');
const bookButton = document.querySelector('#book-button');

// =============================================================================
// State Variables
// =============================================================================
let c1 = checkbox1 ? checkbox1.checked : false;
let c2 = checkbox2 ? checkbox2.checked : false;
let c3 = checkbox3 ? checkbox3.checked : false;

// =============================================================================
// Checkbox Event Listeners
// =============================================================================
if (checkbox1) {
    checkbox1.addEventListener('change', (e) => {
        c1 = e.target.checked;
        if (!c1) alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
    });
}

if (checkbox2) {
    checkbox2.addEventListener('change', (e) => {
        c2 = e.target.checked;
        if (!c2) alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
    });
}

if (checkbox3) {
    checkbox3.addEventListener('change', (e) => {
        c3 = e.target.checked;
        if (!c3) alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
    });
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get current user profile from Spring Boot API
 */
async function getUserData() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.log('Kullanıcı giriş yapmamış');
            return;
        }

        const response = await fetch(`${API_CONFIG.baseUrl}/api/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Oturum süresi dolmuş.');
                return;
            }
            throw new Error(`Kullanıcı bilgileri alınamadı: ${response.status}`);
        }

        const data = await response.json();
        
        // Populate form fields with user data
        if (nameInput) nameInput.value = data.firstName || '';
        if (surnameInput) surnameInput.value = data.lastName || '';
        if (emailInput) emailInput.value = data.email || '';
        if (phoneInput) phoneInput.value = data.phoneNumber || '';

    } catch (err) {
        console.error('GetUserData hatası:', err);
    }
}

/**
 * Create a reservation via Spring Boot API
 */
async function bookReservation(payload) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/api/reservations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 9101) {
            throw new Error('Bu tarihler için rezervasyon yapılamıyor. Lütfen farklı tarihler seçin.');
        }
        if (errorData.code === 8003) {
            throw new Error('Seçilen mülk bulunamadı.');
        }
        
        throw new Error(errorData.message || `Rezervasyon başarısız: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Validation Functions
// =============================================================================

function checkDatesValidity() {
    const checkinDate = new Date(checkinInput.value);
    const checkoutDate = new Date(checkoutInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
        alert('Lütfen geçerli giriş ve çıkış tarihleri giriniz.');
        return false;
    }

    if (checkinDate < today) {
        alert('Giriş tarihi bugünden önce olamaz.');
        return false;
    }

    if (checkoutDate <= checkinDate) {
        alert('Çıkış tarihi giriş tarihinden sonra olmalıdır.');
        return false;
    }

    return true;
}

function requiredFieldsFilled() {
    if (!nameInput.value.trim() || 
        !surnameInput.value.trim() || 
        !emailInput.value.trim() ||
        !phoneInput.value.trim() || 
        !checkinInput.value.trim() || 
        !checkoutInput.value.trim()) {
        alert('Lütfen tüm gerekli alanları doldurunuz.');
        return false;
    }
    return true;
}

function validateTCKN(tckn) {
    if (!tckn) return true;
    return /^[0-9]{11}$/.test(tckn);
}

function validatePhone(phone) {
    return /^[0-9]{10,11}$/.test(phone);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleBooking(e) {
    e.preventDefault();

    // Validate checkboxes
    if (!c1 || !c2 || !c3) {
        alert('Kullanım Şartlarını kabul etmeniz gerekmektedir!');
        return;
    }

    // Validate dates
    if (!checkDatesValidity()) {
        return;
    }

    // Validate required fields
    if (!requiredFieldsFilled()) {
        return;
    }

    // Validate email
    if (!validateEmail(emailInput.value.trim())) {
        alert('Geçerli bir e-posta adresi giriniz.');
        return;
    }

    // Validate phone
    if (!validatePhone(phoneInput.value.trim())) {
        alert('Telefon numarası 10-11 rakam olmalıdır.');
        return;
    }

    // Validate TCKN if provided
    const tckn = tcknInput ? tcknInput.value.trim() : '';
    if (tckn && !validateTCKN(tckn)) {
        alert('TC Kimlik No 11 rakam olmalıdır.');
        return;
    }

    // Build payload
    const payload = {
        firstName: nameInput.value.trim(),
        lastName: surnameInput.value.trim(),
        email: emailInput.value.trim(),
        phoneNumber: phoneInput.value.trim(),
        tcKimlikNo: tckn || null,
        propertyId: CURRENT_PROPERTY_ID,
        startTime: toLocalDateTime(checkinInput.value, '14:00:00'),
        endTime: toLocalDateTime(checkoutInput.value, '11:00:00'),
        notes: null
    };

    // Disable button
    if (bookButton) {
        bookButton.disabled = true;
    }

    try {
        const data = await bookReservation(payload);
        console.log('Rezervasyon başarılı:', data);
        alert('Rezervasyon başarılı! Rezervasyon numaranız: ' + data.id);
        
        // Optionally redirect
        // window.location.href = `/reservation-confirmation.html?id=${data.id}`;

    } catch (err) {
        console.error('Rezervasyon hatası:', err);
        alert('Bir hata oluştu: ' + err.message);
    } finally {
        if (bookButton) {
            bookButton.disabled = false;
        }
    }
}

function addGuests(e) {
    e.preventDefault();
    let currentCount = parseInt(guestCountInput.value) || 1;
    if (currentCount < 12) {
        guestCountInput.value = currentCount + 1;
    }
}

function decrementGuests(e) {
    e.preventDefault();
    let currentCount = parseInt(guestCountInput.value) || 1;
    if (currentCount > 1) {
        guestCountInput.value = currentCount - 1;
    }
}

// =============================================================================
// Event Listeners
// =============================================================================
if (bookButton) {
    bookButton.addEventListener('click', handleBooking);
}

if (addButton) {
    addButton.addEventListener('click', addGuests);
}

if (decrementButton) {
    decrementButton.addEventListener('click', decrementGuests);
}

// =============================================================================
// Initialize on Page Load
// =============================================================================
(async function init() {
    console.log('book.js: Property ID =', CURRENT_PROPERTY_ID);
    await getUserData();
})();
