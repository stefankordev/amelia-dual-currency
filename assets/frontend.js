(function ($) {
    'use strict';

    const log = (...args) => {
        if (window.ameliaDualCurrency && ameliaDualCurrency.debug) {
            // eslint-disable-next-line no-console
            console.log('[ADC]', ...args);
        }
    };

    $(function () {
        initDualCurrency();
        $(document).on('ameliaBookingLoaded ameliaUpdated', initDualCurrency);

        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.addedNodes && m.addedNodes.length) {
                        initDualCurrency();
                        break;
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });

    function initDualCurrency() {
        // Include poppers and common Amelia roots
        const roots = document.querySelectorAll(
            '.amelia-app, .am-catalog-container, .amelia-v2, .amelia-search, .am-events, .amelia-container, .am-adv-select__popper, [id*="amelia"]'
        );
        if (!roots.length) {
            convertPricesIn(document.body);
            return;
        }
        roots.forEach((root) => convertPricesIn(root));
    }

    function convertPricesIn(root) {
        const selectors = [
            // Explicit to your markup
            '.am-adv-select__item-price',
            '.am-amount',

            // Common Amelia price renderers (grid/cards/search etc.)
            '.am-service-price',
            '.am-service__price',
            '.am-package-price',
            '.am-event-price',
            '.am-booking-price',
            '.am-price',
            '.am-search__price',

            // Confirmation screen payment line
            '.am-fs__congrats-info-payment span:last-child',

            // Customer profile payments line (safe: only when preceded by the payments icon)
            '.am-cc__data .am-icon-payments + .am-cc__data-text',

            // Data attributes if present
            '[data-price], [data-service-price], [data-package-price]'
        ];

        selectors.forEach((sel) => {
            root.querySelectorAll(sel).forEach((el) => convertPriceElement(el));
        });
    }

    function alreadyConverted(text) {
        return text.includes('лв.'); // if it already has BGN currency, skip (indicates already converted)
    }

    function convertPriceElement(el) {
        if (el.tagName === 'INPUT' || el.querySelector('input, select, textarea')) {
            return;
        }

        const rawText = (el.textContent || '').trim();
        if (!rawText || alreadyConverted(rawText)) {
            return;
        }

        const price = extractPrice(rawText);
        if (price > 0) {
            const dual = formatDualCurrency(price);
            // Replace only the last price-like token, preserve any suffix like " - На място"
            const replaced = replaceLastPriceInText(rawText, dual);
            el.textContent = replaced;
            log('Converted:', { selector: cssPath(el), from: rawText, to: replaced });
        }
    }

    /**
     * Replace only the last price-like token within the text,
     * preserving any surrounding text (e.g., " - На място").
     */
    function replaceLastPriceInText(text, dual) {
        const re =
            /\d{1,3}(?:[ .\u00A0\u202F]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;
        const matches = [...text.matchAll(re)];
        if (!matches.length) return text;

        // Find the last numeric token and expand to include “лв.” or “BGN/EUR” if adjacent
        const last = matches[matches.length - 1];
        let start = last.index;
        let end = start + last[0].length;

        // Extend to include trailing space(s) and currency suffix like " лв." or "лв."
        const tail = text.slice(end);
        const mSuffix = tail.match(/^[ \u00A0\u202F]*лв\.?/i);
        if (mSuffix) {
            end += mSuffix[0].length;
        }

        return text.slice(0, start) + dual + text.slice(end);
    }

    function extractPrice(text) {
        // Normalize spaces (regular space, NBSP, narrow NBSP) to nothing for thousands
        const normalized = text.replace(/\u00A0|\u202F/g, ' ').trim();

        // Find all number-like tokens, pick the last one
        // Matches "1 234,56", "1 234,56", "1,234.56", "25,00", "25.00", "2500"
        const matches = normalized.match(/\d{1,3}(?:[ .\u00A0\u202F]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g);
        if (!matches || !matches.length) {
            return 0;
        }
        let candidate = matches[matches.length - 1];

        // Remove spaces/nbsp used as thousands separators
        candidate = candidate.replace(/[ \u00A0\u202F]/g, '');

        // If both comma and dot exist, assume dot is decimal and commas were thousands -> drop commas
        if (candidate.includes(',') && candidate.includes('.')) {
            candidate = candidate.replace(/,/g, '');
        } else if (candidate.includes(',')) {
            // If only comma exists, treat it as decimal
            candidate = candidate.replace(',', '.');
        }
        const n = parseFloat(candidate);
        return Number.isFinite(n) ? n : 0;
    }

    function formatDualCurrency(eurPrice) {
        const rate = window.ameliaDualCurrency ? Number(ameliaDualCurrency.conversionRate) : 1.95583;

        // Calculate, then round to 2 decimals max for both currencies
        const eurRounded = Math.round(Number(eurPrice) * 100) / 100;
        const bgnRounded = Math.round((Number(eurPrice) * rate) * 100) / 100;

        const eurFormatted = formatEU(eurRounded); // e.g. "13,00"
        const bgnFormatted = formatEU(bgnRounded); // e.g. "25,43"

        return `${eurFormatted} € / ${bgnFormatted} лв.`;
    }

    /**
     * Format with EU rules:
     * - Decimal comma
     * - Space as thousands separator (locale driven)
     * - Always show 2 decimals for consistency
     */
    function formatEU(value) {
        const rounded = Math.round(Number(value) * 100) / 100;

        return new Intl.NumberFormat('bg-BG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(rounded);
    }

    // Helps identify which element was changed in console
    function cssPath(el) {
        if (!(el instanceof Element)) return '';
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += `#${el.id}`;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while ((sib = sib.previousElementSibling)) {
                    if (sib.nodeName.toLowerCase() === selector) nth++;
                }
                selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(' > ');
    }
})(jQuery);