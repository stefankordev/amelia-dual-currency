<?php
/**
 * Plugin Name: Amelia Dual Currency (EUR/BGN)
 * Plugin URI: https://kordevi.com
 * Description: Automatically adds BGN prices to all Amelia booking plugin EUR prices for Bulgarian legal compliance during EUR transition.
 * Version: 1.0.6
 * Author: Kordevi.com
 * License: GPL v2 or later
 * Text Domain: amelia-dual-currency
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// Ensure is_plugin_active() is available everywhere.
if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

class Amelia_Dual_Currency
{

    /**
     * Fixed conversion rate EUR to BGN.
     */
    const EUR_TO_BGN_RATE = 1.95583;

    public function __construct()
    {
        add_action('plugins_loaded', array($this, 'init'));
        add_action('init', array($this, 'load_textdomain'));
    }

    /**
     * Load translations.
     */
    public function load_textdomain()
    {
        load_plugin_textdomain(
            'amelia-dual-currency',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }

    /**
     * Initialize plugin functionality.
     */
    public function init()
    {
        if (!$this->is_amelia_active()) {
            add_action('admin_notices', array($this, 'amelia_not_active_notice'));
            return;
        }

        // Hook into Amelia's price formatting where available.
        add_filter('amelia_before_booking_price_formatted', array($this, 'format_dual_currency'), 10, 2);
        add_filter('amelia_before_service_price_formatted', array($this, 'format_dual_currency'), 10, 2);
        add_filter('amelia_before_package_price_formatted', array($this, 'format_dual_currency'), 10, 2);
        add_filter('amelia_before_event_price_formatted', array($this, 'format_dual_currency'), 10, 2);
        add_filter('amelia_price_formatted', array($this, 'format_dual_currency'), 10, 2);

        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_script'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_script'));
    }

    /**
     * Check if Amelia plugin is active.
     */
    private function is_amelia_active()
    {
        return class_exists('AmeliaBooking\Infrastructure\WP\PluginService\PluginService')
            || is_plugin_active('ameliabooking/ameliabooking.php');
    }

    /**
     * Admin notice when Amelia is not active.
     */
    public function amelia_not_active_notice()
    {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><?php esc_html_e('Amelia Dual Currency plugin requires the Amelia Booking plugin to be active.', 'amelia-dual-currency'); ?>
            </p>
        </div>
        <?php
    }

    /**
     * Format price with dual currency (EUR / BGN).
     *
     * @param string     $formatted_price Amelia's formatted price string.
     * @param float|null $price           Raw numeric price if provided by filter.
     * @return string
     */
    public function format_dual_currency($formatted_price, $price = null)
    {
        if (null === $price) {
            $price = $this->extract_price_from_formatted($formatted_price);
        }

        if (!is_numeric($price) || $price <= 0) {
            return $formatted_price;
        }

        $bgn_price = (float) $price * self::EUR_TO_BGN_RATE;
        $eur_formatted = number_format((float) $price, 2, ',', '');
        $bgn_formatted = number_format($bgn_price, 2, ',', '');

        return sprintf('%s € / %s лв.', $eur_formatted, $bgn_formatted);
    }

    /**
     * Extract numeric price from a formatted string.
     *
     * @param string $formatted_price
     * @return float
     */
    private function extract_price_from_formatted($formatted_price)
    {
        $price = preg_replace('/[^\d.,]/', '', (string) $formatted_price);
        if (strpos($price, ',') !== false && strpos($price, '.') !== false) {
            // Assume comma is thousands separator.
            $price = str_replace(',', '', $price);
        } elseif (strpos($price, ',') !== false) {
            // Assume comma is decimal separator.
            $price = str_replace(',', '.', $price);
        }
        return (float) $price;
    }

    /**
     * Enqueue frontend script on pages with Amelia shortcodes.
     */
    public function enqueue_frontend_script()
    {
        if (is_admin()) {
            return;
        }

        wp_enqueue_script(
            'amelia-dual-currency-frontend',
            plugin_dir_url(__FILE__) . 'assets/frontend.js',
            array('jquery'),
            '1.0.2',
            true
        );

        wp_localize_script(
            'amelia-dual-currency-frontend',
            'ameliaDualCurrency',
            array(
                'conversionRate' => self::EUR_TO_BGN_RATE,
                'format' => '%s € / %s лв.',
                'debug' => true, // temporary to see logs
            )
        );
    }

    /**
     * Enqueue admin script on Amelia admin screens.
     *
     * @param string $hook Current admin page hook.
     */
    public function enqueue_admin_script($hook)
    {
        if (strpos((string) $hook, 'amelia') !== false) {
            wp_enqueue_script(
                'amelia-dual-currency-admin',
                plugin_dir_url(__FILE__) . 'assets/admin.js',
                array('jquery'),
                '1.0.2',
                true
            );

            wp_localize_script(
                'amelia-dual-currency-admin',
                'ameliaDualCurrency',
                array(
                    'conversionRate' => self::EUR_TO_BGN_RATE,
                    'format' => '%s € / %s лв.',
                )
            );
        }
    }

    /**
     * Basic detection for pages embedding Amelia shortcodes.
     */
    private function is_amelia_frontend_page()
    {
        if (is_admin()) {
            return false;
        }

        global $post;
        if (!($post instanceof WP_Post)) {
            return false;
        }

        $amelia_shortcodes = array('ameliabooking', 'ameliacatalog', 'ameliaevents', 'ameliasearch', 'ameliacustomer');

        foreach ($amelia_shortcodes as $shortcode) {
            if (has_shortcode((string) $post->post_content, $shortcode)) {
                return true;
            }
        }

        return false;
    }
}

// Initialize the plugin.
new Amelia_Dual_Currency();

/**
 * Activation: ensure Amelia is present, otherwise fail gracefully.
 */
register_activation_hook(
    __FILE__,
    function () {
        if (
            !class_exists('AmeliaBooking\Infrastructure\WP\PluginService\PluginService')
            && !is_plugin_active('ameliabooking/ameliabooking.php')
        ) {
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(
                esc_html__('This plugin requires the Amelia Booking plugin to be installed and activated.', 'amelia-dual-currency'),
                esc_html__('Plugin Activation Error', 'amelia-dual-currency'),
                array('back_link' => true)
            );
        }
    }
);