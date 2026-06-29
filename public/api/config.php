<?php
/**
 * HandScript Notes PHP API Configuration
 * Compatible with Hostinger Shared Web Hosting
 */

// Database Configuration - Change these to match your Hostinger MySQL database details
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Your Hostinger MySQL Username
define('DB_PASS', '');     // Your Hostinger MySQL Password
define('DB_NAME', 'handscript_db'); // Your Hostinger MySQL Database Name

// Table Name Prefix
define('DB_PREFIX', 'hsn_');

// Setup Configuration
define('AUTO_SETUP_DB', true); // Set to true to automatically create tables and seed notes on first visit

// Razorpay Credentials (Optional - can be loaded from DB or env as well)
define('RAZORPAY_KEY_ID', 'rzp_test_T6hjycCqpGUq5P');
define('RAZORPAY_KEY_SECRET', '8Oi9PqF2Y81b7qE0SFBMvrox');
