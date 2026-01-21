/**
 * reservation-calendar.js (eski adı: stoneHouse.js)
 * 
 * Takvimde dolu tarihleri gösterir ve seçimi engeller.
 * 
 * KULLANIM:
 * 1. Villa sayfasında CURRENT_PROPERTY_ID tanımla:
 *    <script>window.CURRENT_PROPERTY_ID = 1;</script>
 * 
 * 2. Bu script'i villoz.js'den SONRA yükle:
 *    <script src="/assets/js/reservation-calendar.js"></script>
 * 
 * NOT: villoz.js datepicker'ı önce initialize ediyor, bu script onu
 *      destroy edip beforeShowDay callback'i ile yeniden oluşturuyor.
 */

(function($) {
    'use strict';

    // ==========================================================================
    // Configuration
    // ==========================================================================
    
    const PROPERTY_ID = window.CURRENT_PROPERTY_ID || 1;
    let reservedRanges = [];
    let isInitialized = false;

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    /**
     * Format: YYYY-MM-DD (for internal comparison)
     */
    function formatDateKey(year, month, day) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    /**
     * Date string to number for comparison (20250121)
     */
    function dateToNum(dateStr) {
        return parseInt(dateStr.replace(/-/g, ''), 10);
    }

    /**
     * Extract YYYY-MM-DD from ISO datetime
     */
    function extractDate(isoString) {
        return (isoString || '').split('T')[0];
    }

    /**
     * Check if a date falls within any reserved range
     * NOT: endDate checkout günü olduğu için o gün müsait sayılır
     */
    function isDateReserved(dateKey) {
        if (!reservedRanges.length) return false;
        
        const dateNum = dateToNum(dateKey);
        
        return reservedRanges.some(range => {
            const startNum = dateToNum(range.start);
            const endNum = dateToNum(range.end);
            // start <= date < end (checkout günü müsait)
            return dateNum >= startNum && dateNum < endNum;
        });
    }

    // ==========================================================================
    // API Functions
    // ==========================================================================

    /**
     * Backend'den rezervasyonları çek
     */
    async function fetchReservations(propertyId) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/api/reservations/property/${propertyId}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Transform to date ranges, filter out cancelled
            return data
                .filter(r => r.status !== 'CANCELLED')
                .map(r => ({
                    start: extractDate(r.startTime),
                    end: extractDate(r.endTime)
                }));

        } catch (error) {
            console.error('Rezervasyonlar yüklenemedi:', error);
            return [];
        }
    }

    // ==========================================================================
    // Datepicker Setup
    // ==========================================================================

    /**
     * beforeShowDay callback - her gün için çağrılır
     * Return: [selectable, cssClass, tooltip]
     */
    function beforeShowDay(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dateKey = formatDateKey(year, month, day);

        if (isDateReserved(dateKey)) {
            return [false, 'reserved', 'Bu tarih dolu'];
        }
        
        return [true, '', ''];
    }

    /**
     * Datepicker'ı initialize et (veya yeniden oluştur)
     */
    function initDatepickers() {
        const $datepickers = $('.villoz-datepicker');
        
        if (!$datepickers.length) {
            console.warn('reservation-calendar: .villoz-datepicker bulunamadı');
            return;
        }

        $datepickers.each(function() {
            const $this = $(this);
            
            // Eğer zaten datepicker varsa destroy et
            if ($this.hasClass('hasDatepicker')) {
                $this.datepicker('destroy');
            }

            // Yeniden oluştur - beforeShowDay ile ve Turkish locale
            $this.datepicker({
                dateFormat: 'dd/mm/yy',  // Turkish format (DD/MM/YYYY)
                minDate: 0,              // Bugünden önce seçilemez
                beforeShowDay: beforeShowDay,
                monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                             'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
                monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                                  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
                dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
                dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
                dayNamesMin: ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'],
                firstDay: 1,             // Pazartesi ilk gün
                onChangeMonthYear: function(year, month) {
                    // Ay değişince refresh (gerekirse)
                    setTimeout(() => $(this).datepicker('refresh'), 10);
                }
            });
        });

        isInitialized = true;
    }

    // ==========================================================================
    // CSS Injection (reserved class için stil)
    // ==========================================================================

    function injectStyles() {
        // Zaten eklenmişse tekrar ekleme
        if (document.getElementById('reservation-calendar-styles')) return;

        const css = `
            /* Dolu tarihler - kırmızı arka plan, üstü çizili */
            .ui-datepicker td.reserved {
                background-color: #ffcccc !important;
            }
            .ui-datepicker td.reserved a,
            .ui-datepicker td.reserved span {
                color: #999 !important;
                text-decoration: line-through !important;
                cursor: not-allowed !important;
            }
            
            /* Hover efekti */
            .ui-datepicker td.reserved:hover {
                background-color: #ffb3b3 !important;
            }
            
            /* Seçilebilir günler için hover */
            .ui-datepicker td:not(.reserved):not(.ui-datepicker-unselectable) a:hover {
                background-color: #e8f5e9 !important;
            }
        `;

        const style = document.createElement('style');
        style.id = 'reservation-calendar-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==========================================================================
    // Initialization
    // ==========================================================================

    async function init() {
        console.log('reservation-calendar: Property', PROPERTY_ID, 'için başlatılıyor...');

        // CSS ekle
        injectStyles();

        // Rezervasyonları çek
        reservedRanges = await fetchReservations(PROPERTY_ID);
        console.log('reservation-calendar:', reservedRanges.length, 'rezervasyon yüklendi');

        // Datepicker'ları oluştur
        initDatepickers();
    }

    // ==========================================================================
    // Public API
    // ==========================================================================

    window.ReservationCalendar = {
        /**
         * Manuel olarak başlat (otomatik başlamadıysa)
         */
        init: init,

        /**
         * Rezervasyonları yeniden yükle (yeni rezervasyon sonrası)
         */
        refresh: async function() {
            reservedRanges = await fetchReservations(PROPERTY_ID);
            $('.villoz-datepicker').datepicker('refresh');
        },

        /**
         * Mevcut rezervasyonları döndür
         */
        getReservedRanges: function() {
            return [...reservedRanges];
        },

        /**
         * Belirli bir tarihin dolu olup olmadığını kontrol et
         * @param {string} dateStr - YYYY-MM-DD veya DD/MM/YYYY formatında tarih
         */
        isReserved: function(dateStr) {
            // DD/MM/YYYY formatını YYYY-MM-DD'ye çevir
            let normalizedDate = dateStr;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return isDateReserved(normalizedDate);
        }
    };

    // ==========================================================================
    // Auto-start
    // ==========================================================================

    // DOM hazır olunca başlat
    $(document).ready(function() {
        // Sadece CURRENT_PROPERTY_ID tanımlıysa ve datepicker varsa başlat
        if (window.CURRENT_PROPERTY_ID && $('.villoz-datepicker').length) {
            // villoz.js'in datepicker'ı oluşturması için kısa bir gecikme
            setTimeout(init, 100);
        }
    });

})(jQuery);