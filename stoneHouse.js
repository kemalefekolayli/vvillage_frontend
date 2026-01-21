/**
 * stoneHouse.js - Rewritten for Spring Boot REST API
 * 
 * REMOVED: All Supabase/authToken references
 * - authToken from localStorage (replaced with auth_token)
 * 
 * NOW USES: Standard fetch() calls to Spring Boot backend
 * - GET /api/reservations/property/{propertyId} (get reservations for property)
 * - OR GET /api/availability/property/{propertyId}/month (get monthly availability)
 * 
 * This file handles the datepicker calendar with reserved date highlighting
 * 
 * REQUIRES: api-utils.js must be loaded before this file
 */

// Property ID - Change this based on the property page
// TODO: Get from URL parameter or data attribute
const PROPERTY_ID = 1;

// =============================================================================
// jQuery Datepicker Setup
// =============================================================================
const $cal = $('.villoz-datepicker');

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Pad number with leading zero
 * @param {number} n - Number to pad
 * @returns {string} - Padded string
 */
const pad2 = n => String(n).padStart(2, '0');

/**
 * Create date key in YYYY-MM-DD format
 * @param {number} y - Year
 * @param {number} m0 - Month (0-indexed)
 * @param {number} d - Day
 * @returns {string} - Date key
 */
const makeKey = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(d)}`;

/**
 * Convert date key to numeric value for comparison
 * @param {string} k - Date key
 * @returns {number} - Numeric representation
 */
const keyToNum = k => Number(k.replaceAll('-', ''));

/**
 * Extract date portion from ISO datetime string
 * @param {string} iso - ISO datetime string
 * @returns {string} - Date portion (YYYY-MM-DD)
 */
const onlyDate = iso => (iso || '').split('T')[0];

/**
 * Get authentication token from localStorage
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// =============================================================================
// Reserved Ranges State
// =============================================================================
let reservedRanges = [];

/**
 * Check if a date key falls within any reserved range
 * @param {string} key - Date key (YYYY-MM-DD)
 * @returns {boolean}
 */
function isInAnyRange(key) {
    if (!reservedRanges.length) return false;
    const n = keyToNum(key);
    return reservedRanges.some(r => {
        const s = keyToNum(r.start);
        const e = keyToNum(r.end);
        return s <= n && n <= e;
    });
}

/**
 * Mark reserved cells in the datepicker calendar
 */
function markReservedCells() {
    const $cells = $cal.find('.ui-datepicker-calendar td[data-month][data-year]');
    $cells.each(function () {
        const $td = $(this);
        const txt = $td.text().trim();
        if (!txt) return;

        const y = +$td.data('year');
        const m0 = +$td.data('month');
        const d = parseInt(txt, 10);
        if (!d) return;

        const key = makeKey(y, m0, d);

        if (isInAnyRange(key)) {
            $td.addClass('reserved');
            $td.find('a,span').css('pointer-events', 'none');
        } else {
            $td.removeClass('reserved');
            $td.find('a,span').css('pointer-events', '');
        }
    });
}

// =============================================================================
// Datepicker Initialization
// =============================================================================

// Destroy existing datepicker if present
if ($cal.hasClass('hasDatepicker')) {
    $cal.datepicker('destroy');
    $cal.empty();
}

// Initialize jQuery UI Datepicker
$cal.datepicker({
    dateFormat: 'yy-mm-dd',
    onChangeMonthYear: function () {
        setTimeout(markReservedCells, 0);
    },
    onSelect: function () {
        setTimeout(markReservedCells, 0);
    }
});

// Initial marking of reserved cells
setTimeout(markReservedCells, 0);

// Observe DOM changes to re-mark cells
const observer = new MutationObserver(() => requestAnimationFrame(markReservedCells));
if ($cal[0]) {
    observer.observe($cal[0], { childList: true, subtree: true });
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch reservations for a property from Spring Boot API
 * 
 * Endpoint: GET /api/reservations/property/{propertyId}
 * Headers: Authorization: Bearer <token> (optional)
 * 
 * Response: Array of ReservationResponseDto
 * Each contains: startTime, endTime (ISO datetime format)
 * 
 * @param {number} propertyId - Property ID
 * @returns {Promise<Array>} - Array of {start, end} date ranges
 */
async function fetchReservations(propertyId) {
    const token = getAuthToken();
    
    const headers = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/api/reservations/property/${propertyId}`, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        throw new Error(`Rezervasyonlar alınamadı: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform API response to date ranges
    // API returns: [{ startTime: "2025-01-15T14:00:00", endTime: "2025-01-20T11:00:00", ... }, ...]
    return data.map(r => ({
        start: onlyDate(r.startTime),
        end: onlyDate(r.endTime)
    }));
}

/**
 * Alternative: Fetch monthly availability
 * Use this if you want to show availability per month
 * 
 * Endpoint: GET /api/availability/property/{propertyId}/month?year={year}&month={month}
 * 
 * @param {number} propertyId - Property ID
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} - MonthlyAvailabilityDto
 */
async function fetchMonthlyAvailability(propertyId, year, month) {
    const token = getAuthToken();
    
    const headers = {
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_CONFIG.baseUrl}/api/availability/property/${propertyId}/month?year=${year}&month=${month}`,
        {
            method: 'GET',
            headers: headers
        }
    );

    if (!response.ok) {
        throw new Error(`Müsaitlik bilgisi alınamadı: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Range Management
// =============================================================================

/**
 * Set reserved date ranges and update calendar
 * @param {Array} ranges - Array of {start, end} objects
 */
function setRanges(ranges) {
    reservedRanges = ranges.map(r => {
        if (!r?.start || !r?.end) return null;
        const s = r.start.trim();
        const e = r.end.trim();
        if (!s || !e) return null;
        
        // Ensure start is before end
        if (keyToNum(s) <= keyToNum(e)) {
            return { start: s, end: e };
        }
        return { start: e, end: s };
    }).filter(Boolean);

    // Refresh datepicker and mark cells
    $cal.datepicker('refresh');
    markReservedCells();
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize reservations on page load
 */
(async function initReservations() {
    try {
        // Fetch reservations for the property
        const ranges = await fetchReservations(PROPERTY_ID);
        setRanges(ranges);
        console.log('Rezervasyonlar yüklendi:', ranges.length, 'adet');
    } catch (err) {
        console.error('Rezervasyonlar yüklenirken hata:', err);
        // Calendar will still work, just without reserved date highlighting
    }
})();

// =============================================================================
// Export for external use (if needed)
// =============================================================================

// Make functions available globally for debugging or external use
window.reservationCalendar = {
    fetchReservations,
    setRanges,
    markReservedCells,
    getReservedRanges: () => [...reservedRanges]
};