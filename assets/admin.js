/**
 * Amelia Dual Currency - Admin JavaScript
 * Handles price conversion in WordPress admin area
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        initAdminDualCurrency();
        
        // Re-initialize when content changes
        $(document).on('DOMNodeInserted', function() {
            setTimeout(initAdminDualCurrency, 100);
        });
    });
    
    function initAdminDualCurrency() {
        // Admin price selectors for Amelia
        const adminPriceSelectors = [
            '.am-service-price',
            '.am-package-price',
            '.am-event-price',
            '.amelia-price',
            'input[name*="price"]',
            '[data-price]',
            '.price-display'
        ];
        
        adminPriceSelectors.forEach(function(selector) {
            $(selector).each(function() {
                const $element = $(this);
                
                if ($element.is('input')) {
                    handlePriceInput($element);
                } else {
                    convertPriceElement($element);
                }
            });
        });
    }
    
    function handlePriceInput($input) {
        // Add dual currency display next to price inputs
        if ($input.next('.dual-currency-display').length === 0) {
            $input.after('<span class="dual-currency-display" style="margin-left: 10px; color: #666; font-size: 12px;"></span>');
        }
        
        const updateDualDisplay = function() {
            const price = parseFloat($input.val());
            const $display = $input.next('.dual-currency-display');
            
            if (price > 0) {
                const bgnPrice = price * ameliaDualCurrency.conversionRate;
                const eurFormatted = price.toFixed(2).replace('.', ',');
                const bgnFormatted = bgnPrice.toFixed(2).replace('.', ',');
                $display.text('(' + eurFormatted + ' € / ' + bgnFormatted + ' лв.)');
            } else {
                $display.text('');
            }
        };
        
        $input.on('input keyup change', updateDualDisplay);
        updateDualDisplay(); // Initial display
    }
    
    function convertPriceElement($element) {
        const text = $element.text().trim();
        
        // Skip if already converted
        if (text.includes('лв.') && text.includes('€')) {
            return;
        }
        
        const price = extractPrice(text);
        
        if (price > 0) {
            const dualCurrencyText = formatDualCurrency(price);
            $element.html(dualCurrencyText);
        }
    }
    
    function extractPrice(text) {
        let cleanText = text.replace(/[^\d.,]/g, '');
        
        if (cleanText.includes(',') && cleanText.includes('.')) {
            cleanText = cleanText.replace(/,/g, '');
        } else if (cleanText.includes(',')) {
            cleanText = cleanText.replace(',', '.');
        }
        
        const price = parseFloat(cleanText);
        return isNaN(price) ? 0 : price;
    }
    
    function formatDualCurrency(eurPrice) {
        const bgnPrice = eurPrice * ameliaDualCurrency.conversionRate;
        const eurFormatted = eurPrice.toFixed(2).replace('.', ',');
        const bgnFormatted = bgnPrice.toFixed(2).replace('.', ',');
        
        return eurFormatted + ' € / ' + bgnFormatted + ' лв.';
    }
    
})(jQuery);