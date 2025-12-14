=== Amelia Dual Currency (EUR/BGN) ===
Contributors: Stefan Kordev, Kordevi.com
Tags: amelia, booking, currency, euro, bulgaria, bgn, eur, price
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Automatically displays dual currency prices (BGN / EUR) for the Amelia Booking plugin using the fixed conversion rate 1.95583 required during Bulgaria’s EUR transition.

== Description ==

Amelia Dual Currency adds a second price (EUR) next to all BGN prices in Amelia Booking (services, packages, events) to help Bulgarian businesses comply with dual display requirements during the EUR transition.

- Fixed conversion rate: 1.95583 (BGN to EUR).
- Format example: 9.93 лв. / 4.44 €
- Works in both frontend and WordPress admin.
- Handles dynamically loaded content from Amelia.

No settings page. Just activate and it works on pages where Amelia is embedded.

== Installation ==

1. Upload the `amelia-dual-currency` folder to `/wp-content/plugins/`
2. Ensure this structure:
   - `amelia-dual-currency.php`
   - `assets/frontend.js`
   - `assets/admin.js`
3. Activate “Amelia Dual Currency (BGN/EUR)” in Plugins.
4. Embed Amelia using its shortcode or blocks on your pages as usual.

== Frequently Asked Questions ==

= Does it change my stored prices? =
No. It only changes how prices are displayed, not the stored values.

= What conversion rate is used? =
A fixed rate of 1.95583 BGN to EUR.

= Can I disable EUR on certain pages? =
By default, it runs where Amelia shortcodes are detected. If you need finer control, we can add a filter or option upon request.

= Will it conflict with other currency plugins? =
It’s designed to work alongside Amelia and simply formats display text. If another tool also rewrites price nodes, we may need to scope the selectors more tightly.

== Troubleshooting ==

If you do not see dual prices on the frontend:
- Clear all caches and hard-refresh. Some builders delay content rendering.
- Ensure the script is enqueued. View page source and look for `amelia-dual-currency-frontend`.
- Enable temporary debug logging by localizing `debug => true` and check the browser console for “[ADC] Converted:” messages.
- If shortcode detection misses your setup, enqueue the frontend script unconditionally (temporarily):
  - In `enqueue_frontend_script()`, remove the check that calls `is_amelia_frontend_page()` and always enqueue when not in admin.
- If non-Amelia elements are affected, narrow the JS scope to Amelia containers like `.amelia-app`, `.am-catalog-container`, `.amelia-v2`, or `[id*="amelia"]`.

== Screenshots ==

1. Dual currency price format in frontend.
2. Dual currency hint next to price inputs in admin.

== Changelog ==

= 1.0.5 =
- Confirmation screen: dual pricing now applied to the payment line while preserving the trailing payment method text (e.g., “- На място”).
- UX: Only the price substring is replaced; surrounding content remains intact.
- Customer Profile: dual pricing now applied to the payments field (am-cc__data-text) while leaving durations and other fields intact.

= 1.0.4 =
- Improvement: EU-style number formatting for BGN and EUR (comma as decimal separator, space for grouping).
- UX: Decimals are omitted when the price is a whole number after rounding.
- No changes in logic or selectors; purely formatting improvements.

= 1.0.3 =
- Fix: If Amelia renders content dynamically after load (it does), MutationObserver retries conversions.
- Fix: If the script wasn’t enqueued due to shortcode detection failing, Patch 1 guarantees it’s loaded.
- Fix: If your theme/container uses different classes, it scans common Amelia roots and logs conversions in the console so we can fine-tune selectors quickly.

= 1.0.2 =
- Fix: Prevented parse error by moving load_plugin_textdomain() into an init hook.
- Hardening: Safer price parsing for mixed separators.
- Stability: Ensured is_plugin_active() is available across contexts.

= 1.0.1 =
- Internal: Early attempt to fix the textdomain load placement.

= 1.0.0 =
- Initial release.

== Upgrade Notice ==

= 1.0.2 =
Critical fix for fatal error in some environments. Update immediately.

== Privacy ==

This plugin does not collect, store, or transmit personal data.

== Credits ==

Developed following WordPress Coding Standards and best practices.