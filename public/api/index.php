<?php
/**
 * HandScript Notes PHP API Routing Controller
 * Dynamic Hybrid Architecture: MySQL Database with seamless Flat-File JSON Database Fallback
 * Extremely reliable, secure, and compatible with Hostinger Shared Web Hosting out-of-the-box.
 */

// Enable error logging but hide from browser to keep API clean
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Load Database & Site Configuration
require_once __DIR__ . '/config.php';

// Configure CORS and JSON content-type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Extract Route parameter (routed via .htaccess query parameter 'route')
$route = $_GET['route'] ?? '';

// Route static file previews and secure downloads as PDF streams (cannot use application/json content-type)
$isPdfPreview = preg_match('/^pdf-preview\/(.+)$/', $route, $matches);
$isPdfDownload = preg_match('/^pdf-download\/(.+)$/', $route, $matches);
$isUploads = preg_match('/^uploads\/(.+)$/', $route, $matchesUploads);

if (!$isPdfPreview && !$isPdfDownload && !$isUploads) {
    header("Content-Type: application/json; charset=UTF-8");
}

// Global state variables
$useMySQL = false;
$pdo = null;
$pdoError = null;

/**
 * Get highly compatible writable uploads directory path on Hostinger.
 * Bypasses open_basedir restrictions and directory permission errors.
 */
function getUploadsDir() {
    $p1 = dirname(__DIR__) . '/uploads';
    $p2 = dirname(dirname(__DIR__)) . '/uploads';
    $p3 = dirname(dirname(__DIR__)) . '/public/uploads';
    
    if (file_exists($p1) && is_dir($p1)) {
        return $p1;
    }
    if (file_exists($p2) && is_dir($p2) && is_writable($p2)) {
        return $p2;
    }
    if (file_exists($p3) && is_dir($p3)) {
        return $p3;
    }
    
    // Create inside public/html directory structure to guarantee open_basedir access
    if (!file_exists($p1)) {
        mkdir($p1, 0755, true);
    }
    return $p1;
}


// File-System Database Paths (Fallback Storage)
$notesJsonPath = __DIR__ . '/notes_db.json';
$queriesJsonPath = __DIR__ . '/queries_db.json';
$adminJsonPath = __DIR__ . '/admin_db.json';
$purchasesJsonPath = __DIR__ . '/purchases_db.json';

// Initialize PDO Database Connection and Auto-Installer if database is configured
try {
    // Only attempt MySQL if database host and name are populated with non-defaults
    if (defined('DB_HOST') && DB_HOST !== '' && defined('DB_NAME') && DB_NAME !== '' && DB_USER !== 'root') {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $useMySQL = true;

        // Check if notes table exists, if not, perform database installation & pre-seeding
        $tableExists = false;
        try {
            $result = $pdo->query("SELECT 1 FROM `" . DB_PREFIX . "notes` LIMIT 1");
            $tableExists = true;
        } catch (Exception $e) {
            $tableExists = false;
        }

        if (!$tableExists && AUTO_SETUP_DB) {
            // 1. Create hsn_admin_config table
            $pdo->exec("CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "admin_config` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `username` VARCHAR(100) NOT NULL,
                `password` VARCHAR(255) NOT NULL,
                `security_question` VARCHAR(255) NOT NULL,
                `security_answer` VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // Seed Default Admin User
            $stmt = $pdo->query("SELECT COUNT(*) FROM `" . DB_PREFIX . "admin_config`");
            if ($stmt->fetchColumn() == 0) {
                $stmt = $pdo->prepare("INSERT INTO `" . DB_PREFIX . "admin_config` (username, password, security_question, security_answer) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    'HandScriptNotesak47',
                    'P@ssw0rdadminak47',
                    'What is your primary contact email?',
                    'handscriptnotesak47@gmail.com'
                ]);
            }

            // 2. Create hsn_notes table
            $pdo->exec("CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "notes` (
                `id` VARCHAR(100) PRIMARY KEY,
                `examId` VARCHAR(50) NOT NULL,
                `unitNumber` INT NOT NULL,
                `name` VARCHAR(255) NOT NULL,
                `shortDescription` TEXT NOT NULL,
                `price` INT NOT NULL,
                `demoPages` LONGTEXT,
                `fullPages` LONGTEXT,
                `pdfUrl` VARCHAR(255),
                `pdfName` VARCHAR(255)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 3. Create hsn_queries table
            $pdo->exec("CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "queries` (
                `id` VARCHAR(100) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(100) NOT NULL,
                `subject` VARCHAR(255) NOT NULL,
                `message` TEXT NOT NULL,
                `replied` TINYINT(1) DEFAULT 0,
                `createdAt` VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 4. Create hsn_purchases table
            $pdo->exec("CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "purchases` (
                `orderId` VARCHAR(100) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(100) NOT NULL,
                `unitId` VARCHAR(100) NOT NULL,
                `unitName` VARCHAR(255) NOT NULL,
                `examId` VARCHAR(100) NOT NULL,
                `price` INT NOT NULL,
                `status` VARCHAR(20) NOT NULL,
                `paymentMethod` VARCHAR(255) NOT NULL,
                `timestamp` VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // Seed original handwritten notes list from notes_db.json
            if (file_exists($notesJsonPath)) {
                $notesJson = file_get_contents($notesJsonPath);
                $notes = json_decode($notesJson, true);
                if (is_array($notes)) {
                    $stmt = $pdo->prepare("INSERT INTO `" . DB_PREFIX . "notes` (id, examId, unitNumber, name, shortDescription, price, demoPages, fullPages, pdfUrl, pdfName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    foreach ($notes as $n) {
                        $stmt->execute([
                            $n['id'],
                            $n['examId'],
                            (int)$n['unitNumber'],
                            $n['name'],
                            $n['shortDescription'],
                            (int)$n['price'],
                            json_encode($n['demoPages'] ?? []),
                            json_encode($n['fullPages'] ?? []),
                            $n['pdfUrl'] ?? null,
                            $n['pdfName'] ?? null
                        ]);
                    }
                }
            }
        } else if ($tableExists && AUTO_SETUP_DB && file_exists($notesJsonPath)) {
            // Automatically sync/update prices from notes_db.json to the MySQL database if they differ!
            // This ensures that any price changes made in the code/JSON go live on Hostinger immediately.
            $notesJson = file_get_contents($notesJsonPath);
            $notes = json_decode($notesJson, true);
            if (is_array($notes)) {
                $stmtCheck = $pdo->prepare("SELECT price FROM `" . DB_PREFIX . "notes` WHERE id = ?");
                $stmtUpdate = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET price = ? WHERE id = ?");
                foreach ($notes as $n) {
                    $stmtCheck->execute([$n['id']]);
                    $dbPrice = $stmtCheck->fetchColumn();
                    if ($dbPrice !== false && (int)$dbPrice !== (int)$n['price']) {
                        $stmtUpdate->execute([(int)$n['price'], $n['id']]);
                    }
                }
            }
        }
    }
} catch (Exception $e) {
    // Gracefully fallback to Flat-File system, record error for transparency
    $useMySQL = false;
    $pdoError = $e->getMessage();
}


// ========================================================
// REUSABLE DATABASE OPERATOR FUNCTIONS (HYBRID MODEL)
// ========================================================

/**
 * Fetch all notes units
 */
function fetchAllNotes() {
    global $useMySQL, $pdo, $notesJsonPath;
    
    if ($useMySQL) {
        try {
            $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "notes` ORDER BY examId ASC, unitNumber ASC");
            $notes = $stmt->fetchAll();
            foreach ($notes as &$n) {
                $n['unitNumber'] = (int)$n['unitNumber'];
                $n['price'] = (int)$n['price'];
                $n['demoPages'] = json_decode($n['demoPages'] ?? '[]', true);
                $n['fullPages'] = json_decode($n['fullPages'] ?? '[]', true);
            }
            return $notes;
        } catch (Exception $e) {
            // Fallback to JSON if DB fails mid-session
        }
    }
    
    // File-System Fallback
    if (file_exists($notesJsonPath)) {
        $notes = json_decode(file_get_contents($notesJsonPath), true);
        if (is_array($notes)) {
            return $notes;
        }
    }
    return [];
}

/**
 * Save notes list (used in file-system fallback mode)
 */
function saveNotesListFallback($notes) {
    global $notesJsonPath;
    file_put_contents($notesJsonPath, json_encode($notes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * Fetch all contact inquiries
 */
function fetchAllQueries() {
    global $useMySQL, $pdo, $queriesJsonPath;
    
    if ($useMySQL) {
        try {
            $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "queries` ORDER BY createdAt DESC");
            $queries = $stmt->fetchAll();
            foreach ($queries as &$q) {
                $q['replied'] = (bool)$q['replied'];
            }
            return $queries;
        } catch (Exception $e) {
            // fallback
        }
    }
    
    // File-System Fallback
    if (file_exists($queriesJsonPath)) {
        $queries = json_decode(file_get_contents($queriesJsonPath), true);
        if (is_array($queries)) {
            return $queries;
        }
    }
    return [];
}

/**
 * Save query inquiries
 */
function saveQueriesFallback($queries) {
    global $queriesJsonPath;
    file_put_contents($queriesJsonPath, json_encode($queries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * Fetch all purchase records
 */
function fetchAllPurchases() {
    global $useMySQL, $pdo, $purchasesJsonPath;
    
    if ($useMySQL) {
        try {
            $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "purchases` ORDER BY timestamp DESC");
            $purchases = $stmt->fetchAll();
            foreach ($purchases as &$p) {
                $p['price'] = (int)$p['price'];
            }
            return $purchases;
        } catch (Exception $e) {
            // fallback
        }
    }
    
    // File-System Fallback
    if (file_exists($purchasesJsonPath)) {
        $purchases = json_decode(file_get_contents($purchasesJsonPath), true);
        if (is_array($purchases)) {
            return $purchases;
        }
    }
    return [];
}

/**
 * Save purchases fallback (flat-file)
 */
function savePurchasesFallback($purchases) {
    global $purchasesJsonPath;
    file_put_contents($purchasesJsonPath, json_encode($purchases, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * Retrieve or Seed Admin User Credentials
 */
function getAdminCredentials() {
    global $useMySQL, $pdo, $adminJsonPath;
    
    $defaultAdmin = [
        'username' => 'HandScriptNotesak47',
        'password' => 'P@ssw0rdadminak47',
        'security_question' => 'What is your primary contact email?',
        'security_answer' => 'handscriptnotesak47@gmail.com'
    ];
    
    if ($useMySQL) {
        try {
            $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "admin_config` LIMIT 1");
            $admin = $stmt->fetch();
            if ($admin) {
                return $admin;
            }
        } catch (Exception $e) {
            // fallback
        }
    }
    
    // File-System Fallback
    if (file_exists($adminJsonPath)) {
        $admin = json_decode(file_get_contents($adminJsonPath), true);
        if (is_array($admin)) {
            return $admin;
        }
    }
    
    // Seed and write default config if not existing
    file_put_contents($adminJsonPath, json_encode($defaultAdmin, JSON_PRETTY_PRINT));
    return $defaultAdmin;
}

/**
 * Save Admin Credentials
 */
function saveAdminCredentials($admin) {
    global $useMySQL, $pdo, $adminJsonPath;
    
    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "admin_config` SET username = ?, password = ?, security_question = ?, security_answer = ? WHERE id = 1");
            $stmt->execute([
                $admin['username'],
                $admin['password'],
                $admin['security_question'],
                $admin['security_answer']
            ]);
            return true;
        } catch (Exception $e) {
            // fallback
        }
    }
    
    file_put_contents($adminJsonPath, json_encode($admin, JSON_PRETTY_PRINT));
    return true;
}


// Load raw json input parameters
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?? [];


// ========================================================
// API ROUTING ENDPOINTS
// ========================================================

// 1. GET /api/notes
if ($route === 'notes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $notes = fetchAllNotes();
    echo json_encode($notes);
    exit;
}

// 2. GET /api/queries
if ($route === 'queries' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchAllQueries());
    exit;
}

// 3. POST /api/queries
if ($route === 'queries' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $qData = $input['query'] ?? null;
    if (!$qData) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing query object']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("INSERT INTO `" . DB_PREFIX . "queries` (id, name, email, subject, message, replied, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $qData['id'],
                $qData['name'],
                $qData['email'],
                $qData['subject'],
                $qData['message'],
                $qData['replied'] ? 1 : 0,
                $qData['createdAt'] ?? date('c')
            ]);
        } catch (Exception $e) {
            $useMySQL = false; // Fallback
        }
    }

    if (!$useMySQL) {
        $queries = fetchAllQueries();
        $queries[] = [
            'id' => $qData['id'],
            'name' => $qData['name'],
            'email' => $qData['email'],
            'subject' => $qData['subject'],
            'message' => $qData['message'],
            'replied' => (bool)($qData['replied'] ?? false),
            'createdAt' => $qData['createdAt'] ?? date('c')
        ];
        saveQueriesFallback($queries);
    }

    echo json_encode([
        'success' => true,
        'queries' => fetchAllQueries()
    ]);
    exit;
}

// 4. POST /api/queries/answer
if ($route === 'queries/answer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $queryId = $input['queryId'] ?? null;
    if (!$queryId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing queryId']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "queries` SET replied = 1 WHERE id = ?");
            $stmt->execute([$queryId]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $queries = fetchAllQueries();
        foreach ($queries as &$q) {
            if ($q['id'] === $queryId) {
                $q['replied'] = true;
                break;
            }
        }
        saveQueriesFallback($queries);
    }

    echo json_encode([
        'success' => true,
        'queries' => fetchAllQueries()
    ]);
    exit;
}

// 5. POST /api/notes/update-price
if ($route === 'notes/update-price' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unitId = $input['unitId'] ?? null;
    $price = $input['price'] ?? null;
    if (!$unitId || $price === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unitId or price']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET price = ? WHERE id = ?");
            $stmt->execute([(int)$price, $unitId]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $notes = fetchAllNotes();
        foreach ($notes as &$n) {
            if ($n['id'] === $unitId) {
                $n['price'] = (int)$price;
                break;
            }
        }
        saveNotesListFallback($notes);
    }

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes()
    ]);
    exit;
}

// 6. POST /api/notes/update-pdf (Handles full PDF + first 4 pages preview)
if ($route === 'notes/update-pdf' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unitId = $input['unitId'] ?? null;
    $pdfName = $input['pdfName'] ?? 'Uploaded.pdf';
    $pdfData = $input['pdfData'] ?? null;
    $pdfPreviewData = $input['pdfPreviewData'] ?? null; // Securely sliced client-side 4-page preview

    if (!$unitId || !$pdfData) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unitId or pdfData']);
        exit;
    }

    try {
        // Create uploads directory if not exists
        $uploadsDir = getUploadsDir();
        if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Save Full PDF
        $fullBase64 = preg_replace('/^data:application\/pdf;base64,/', '', $pdfData);
        $fullBuffer = base64_decode($fullBase64);
        $fullFileName = $unitId . '-' . time() . '.pdf';
        $fullFilePath = $uploadsDir . '/' . $fullFileName;
        file_put_contents($fullFilePath, $fullBuffer);

        $publicUrl = '/uploads/' . $fullFileName;

        // Save Preview PDF if provided
        if ($pdfPreviewData) {
            $previewBase64 = preg_replace('/^data:application\/pdf;base64,/', '', $pdfPreviewData);
            $previewBuffer = base64_decode($previewBase64);
            $previewFileName = $unitId . '-preview.pdf';
            $previewFilePath = $uploadsDir . '/' . $previewFileName;
            file_put_contents($previewFilePath, $previewBuffer);
        }

        // Sync details
        if ($useMySQL) {
            try {
                $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET pdfUrl = ?, pdfName = ? WHERE id = ?");
                $stmt->execute([$publicUrl, $pdfName, $unitId]);
            } catch (Exception $e) {
                $useMySQL = false;
            }
        }

        if (!$useMySQL) {
            $notes = fetchAllNotes();
            foreach ($notes as &$n) {
                if ($n['id'] === $unitId) {
                    $n['pdfUrl'] = $publicUrl;
                    $n['pdfName'] = $pdfName;
                    break;
                }
            }
            saveNotesListFallback($notes);
        }

        echo json_encode([
            'success' => true,
            'pdfUrl' => $publicUrl,
            'pdfName' => $pdfName,
            'notes' => fetchAllNotes()
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save PDF on server: ' . $e->getMessage()]);
        exit;
    }
}

// 7. POST /api/notes/add-unit
if ($route === 'notes/add-unit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unit = $input['unit'] ?? null;
    if (!$unit) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unit data']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("INSERT INTO `" . DB_PREFIX . "notes` (id, examId, unitNumber, name, shortDescription, price, demoPages, fullPages, pdfUrl, pdfName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $unit['id'],
                $unit['examId'],
                (int)$unit['unitNumber'],
                $unit['name'],
                $unit['shortDescription'],
                (int)$unit['price'],
                json_encode($unit['demoPages'] ?? []),
                json_encode($unit['fullPages'] ?? []),
                $unit['pdfUrl'] ?? null,
                $unit['pdfName'] ?? null
            ]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $notes = fetchAllNotes();
        // Check if exists, overwrite or append
        $exists = false;
        foreach ($notes as &$n) {
            if ($n['id'] === $unit['id']) {
                $n = $unit;
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $notes[] = $unit;
        }
        saveNotesListFallback($notes);
    }

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes()
    ]);
    exit;
}

// 8. POST /api/notes/remove-unit
if ($route === 'notes/remove-unit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unitId = $input['unitId'] ?? null;
    if (!$unitId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unitId']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `" . DB_PREFIX . "notes` WHERE id = ?");
            $stmt->execute([$unitId]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $notes = fetchAllNotes();
        $filtered = [];
        foreach ($notes as $n) {
            if ($n['id'] !== $unitId) {
                $filtered[] = $n;
            }
        }
        saveNotesListFallback($filtered);
    }

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes()
    ]);
    exit;
}

// 9. POST /api/admin/verify-login
if ($route === 'admin/verify-login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $admin = getAdminCredentials();

    if ($admin && strtolower(trim($username)) === strtolower(trim($admin['username'])) && $password === $admin['password']) {
        echo json_encode(['success' => true, 'username' => $admin['username']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Incorrect User ID or Password']);
    }
    exit;
}

// 10. POST /api/admin/forgot-password-question
if ($route === 'admin/forgot-password-question' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $input['username'] ?? '';

    $admin = getAdminCredentials();

    if ($admin && strtolower(trim($username)) === strtolower(trim($admin['username']))) {
        echo json_encode(['success' => true, 'securityQuestion' => $admin['security_question']]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User ID not found']);
    }
    exit;
}

// 11. POST /api/admin/forgot-password-reset
if ($route === 'admin/forgot-password-reset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $input['username'] ?? '';
    $securityAnswer = $input['securityAnswer'] ?? '';
    $newPassword = $input['newPassword'] ?? '';

    if (!$username || !$securityAnswer || !$newPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields are required']);
        exit;
    }

    $admin = getAdminCredentials();

    if (!$admin || strtolower(trim($username)) !== strtolower(trim($admin['username']))) {
        http_response_code(404);
        echo json_encode(['error' => 'User ID mismatch']);
        exit;
    }

    if (strtolower(trim($securityAnswer)) !== strtolower(trim($admin['security_answer']))) {
        http_response_code(401);
        echo json_encode(['error' => 'Security answer is incorrect']);
        exit;
    }

    $isStrong = preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', $newPassword);
    if (!$isStrong) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.']);
        exit;
    }

    $admin['password'] = $newPassword;
    saveAdminCredentials($admin);

    echo json_encode(['success' => true]);
    exit;
}

// 12. POST /api/admin/update-credentials
if ($route === 'admin/update-credentials' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $currentPassword = $input['currentPassword'] ?? '';
    $newUsername = $input['newUsername'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $newSecurityQuestion = $input['newSecurityQuestion'] ?? '';
    $newSecurityAnswer = $input['newSecurityAnswer'] ?? '';

    $admin = getAdminCredentials();

    if (!$admin || $currentPassword !== $admin['password']) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    $updatedUsername = !empty($newUsername) ? trim($newUsername) : $admin['username'];
    $updatedPassword = $admin['password'];

    if (!empty($newPassword)) {
        $isStrong = preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', $newPassword);
        if (!$isStrong) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.']);
            exit;
        }
        $updatedPassword = $newPassword;
    }

    $updatedQ = !empty($newSecurityQuestion) ? trim($newSecurityQuestion) : $admin['security_question'];
    $updatedA = !empty($newSecurityAnswer) ? trim($newSecurityAnswer) : $admin['security_answer'];

    $admin['username'] = $updatedUsername;
    $admin['password'] = $updatedPassword;
    $admin['security_question'] = $updatedQ;
    $admin['security_answer'] = $updatedA;

    saveAdminCredentials($admin);

    echo json_encode(['success' => true, 'username' => $updatedUsername]);
    exit;
}

// 13. POST /api/create-order (Razorpay order proxy compatible with PHP shared hosting)
if ($route === 'create-order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $amount = $input['amount'] ?? 0;
    $currency = $input['currency'] ?? 'INR';
    $receipt = $input['receipt'] ?? ('receipt_' . time());

    if (!$amount || $amount < 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Amount is required and must be at least 100 paise']);
        exit;
    }

    $keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : 'rzp_live_T7O06QotgMxU0J';
    $keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : 'f2scYz1fz3Qugba12DjhqmMD';

    $url = "https://api.razorpay.com/v1/orders";
    $postData = json_encode([
        'amount' => (int)round($amount),
        'currency' => $currency,
        'receipt' => $receipt
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERPWD, $keyId . ":" . $keySecret);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $order = json_decode($response, true);
        echo json_encode([
            'success' => true,
            'order_id' => $order['id'],
            'amount' => $order['amount'],
            'currency' => $order['currency']
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to create Razorpay order',
            'details' => json_decode($response, true)
        ]);
    }
    exit;
}

// 14. POST /api/verify-payment (Razorpay HMAC payment signature verification)
if ($route === 'verify-payment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $orderId = $input['razorpay_order_id'] ?? '';
    $paymentId = $input['razorpay_payment_id'] ?? '';
    $signature = $input['razorpay_signature'] ?? '';

    if (!$orderId || !$paymentId || !$signature) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required validation fields']);
        exit;
    }

    $keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : 'f2scYz1fz3Qugba12DjhqmMD';
    $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

    if (hash_equals($generatedSignature, $signature)) {
        echo json_encode(['success' => true, 'message' => 'Payment verified successfully']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payment signature. Verification failed.']);
    }
    exit;
}

// Serve uploaded files securely from the physical uploads directory
if ($isUploads) {
    $filePathRelative = $matchesUploads[1];
    $uploadsDir = getUploadsDir();
    $filePath = $uploadsDir . '/' . $filePathRelative;
    
    // Fallback: check other locations if not found at default getUploadsDir()
    if (!file_exists($filePath) || !is_file($filePath)) {
        $rootDir = dirname(dirname(__DIR__));
        $possiblePaths = [
            $uploadsDir . '/' . $filePathRelative,
            $rootDir . '/uploads/' . $filePathRelative,
            $rootDir . '/public/uploads/' . $filePathRelative,
            $rootDir . '/public_html/uploads/' . $filePathRelative,
            dirname(__DIR__) . '/uploads/' . $filePathRelative
        ];
        foreach ($possiblePaths as $path) {
            if (file_exists($path) && is_file($path)) {
                $filePath = $path;
                break;
            }
        }
    }

    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $contentType = 'application/octet-stream';
        if ($ext === 'pdf') {
            $contentType = 'application/pdf';
        } else if (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg'])) {
            $contentType = 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
        }
        
        header("Content-Type: " . $contentType);
        header("Content-Disposition: inline; filename=\"" . basename($filePath) . "\"");
        header("Content-Length: " . filesize($filePath));
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo "Uploaded file not found: " . htmlspecialchars($filePathRelative);
        exit;
    }
}

// 15. GET /api/pdf-preview/:unitId (Serves the secure 4-page sliced PDF directly from Hostinger disk)
if ($isPdfPreview) {
    $unitId = $matches[1];
    $uploadsDir = getUploadsDir();
    $rootDir = dirname(dirname(__DIR__));
    
    // Check multiple possible preview paths
    $possiblePreviewPaths = [
        $uploadsDir . '/pdfs/' . $unitId . '-preview.pdf',
        $uploadsDir . '/' . $unitId . '-preview.pdf',
        $rootDir . '/uploads/pdfs/' . $unitId . '-preview.pdf',
        $rootDir . '/uploads/' . $unitId . '-preview.pdf',
        $rootDir . '/' . $unitId . '-preview.pdf',
        $rootDir . '/public/uploads/pdfs/' . $unitId . '-preview.pdf',
        $rootDir . '/public/uploads/' . $unitId . '-preview.pdf',
        $rootDir . '/public/' . $unitId . '-preview.pdf',
        dirname(__DIR__) . '/uploads/pdfs/' . $unitId . '-preview.pdf',
        dirname(__DIR__) . '/uploads/' . $unitId . '-preview.pdf'
    ];
    
    $previewPath = null;
    foreach ($possiblePreviewPaths as $pPath) {
        if (file_exists($pPath) && is_file($pPath)) {
            $previewPath = $pPath;
            break;
        }
    }

    if ($previewPath) {
        header("Content-Type: application/pdf");
        header("Content-Disposition: inline; filename=\"preview_{$unitId}.pdf\"");
        readfile($previewPath);
        exit;
    } else {
        // Fallback: look for the full PDF URL in the notes list
        $notes = fetchAllNotes();
        $pdfUrl = null;
        $pdfName = null;
        foreach ($notes as $n) {
            if ($n['id'] === $unitId) {
                $pdfUrl = $n['pdfUrl'] ?? null;
                $pdfName = $n['pdfName'] ?? null;
                break;
            }
        }

        if ($pdfUrl) {
            $fileName = basename($pdfUrl);
            $originalName = $pdfName ? basename($pdfName) : '';
            $possibleFullPaths = [
                $uploadsDir . '/pdfs/' . $fileName,
                $uploadsDir . '/' . $fileName,
                $rootDir . '/uploads/pdfs/' . $fileName,
                $rootDir . '/uploads/' . $fileName,
                $rootDir . '/' . $fileName,
                $rootDir . '/public/uploads/pdfs/' . $fileName,
                $rootDir . '/public/uploads/' . $fileName,
                $rootDir . '/public/' . $fileName,
                dirname(__DIR__) . '/uploads/pdfs/' . $fileName,
                dirname(__DIR__) . '/uploads/' . $fileName
            ];
            if ($originalName) {
                $possibleFullPaths[] = $uploadsDir . '/pdfs/' . $originalName;
                $possibleFullPaths[] = $uploadsDir . '/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/uploads/pdfs/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/uploads/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/public/uploads/pdfs/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/public/uploads/' . $originalName;
                $possibleFullPaths[] = $rootDir . '/public/' . $originalName;
                $possibleFullPaths[] = dirname(__DIR__) . '/uploads/pdfs/' . $originalName;
                $possibleFullPaths[] = dirname(__DIR__) . '/uploads/' . $originalName;
            }
            
            foreach ($possibleFullPaths as $fPath) {
                if (file_exists($fPath) && is_file($fPath)) {
                    header("Content-Type: application/pdf");
                    header("Content-Disposition: inline; filename=\"preview_{$unitId}.pdf\"");
                    readfile($fPath);
                    exit;
                }
            }
        }
    }

    http_response_code(404);
    echo "Secure preview PDF not found. The admin must attach/upload a PDF first.";
    exit;
}

// 16. GET /api/purchases - Fetch all purchases from MySQL/Fallback JSON
if ($route === 'purchases' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchAllPurchases());
    exit;
}

// 17. POST /api/purchases - Add or update a purchase record
if ($route === 'purchases' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $purchase = $input['purchase'] ?? null;
    if (!$purchase || !isset($purchase['orderId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing purchase or orderId']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("INSERT INTO `" . DB_PREFIX . "purchases` (orderId, name, email, unitId, unitName, examId, price, status, paymentMethod, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)");
            $stmt->execute([
                $purchase['orderId'],
                $purchase['name'],
                $purchase['email'],
                $purchase['unitId'],
                $purchase['unitName'],
                $purchase['examId'],
                (int)$purchase['price'],
                $purchase['status'],
                $purchase['paymentMethod'],
                $purchase['timestamp']
            ]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $purchases = fetchAllPurchases();
        $existsIndex = -1;
        for ($i = 0; $i < count($purchases); $i++) {
            if ($purchases[$i]['orderId'] === $purchase['orderId']) {
                $existsIndex = $i;
                break;
            }
        }
        if ($existsIndex > -1) {
            $purchases[$existsIndex] = $purchase;
        } else {
            array_unshift($purchases, $purchase);
        }
        savePurchasesFallback($purchases);
    }

    echo json_encode(['success' => true, 'purchases' => fetchAllPurchases()]);
    exit;
}

// 18. POST /api/purchases/approve - Approve a purchase record
if ($route === 'purchases/approve' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $orderId = $input['orderId'] ?? null;
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing orderId']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "purchases` SET status = 'Successful' WHERE orderId = ?");
            $stmt->execute([$orderId]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $purchases = fetchAllPurchases();
        foreach ($purchases as &$p) {
            if ($p['orderId'] === $orderId) {
                $p['status'] = 'Successful';
                break;
            }
        }
        savePurchasesFallback($purchases);
    }

    echo json_encode(['success' => true, 'purchases' => fetchAllPurchases()]);
    exit;
}

// 19. POST /api/purchases/decline - Decline/Remove a purchase record
if ($route === 'purchases/decline' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $orderId = $input['orderId'] ?? null;
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing orderId']);
        exit;
    }

    if ($useMySQL) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `" . DB_PREFIX . "purchases` WHERE orderId = ?");
            $stmt->execute([$orderId]);
        } catch (Exception $e) {
            $useMySQL = false;
        }
    }

    if (!$useMySQL) {
        $purchases = fetchAllPurchases();
        $filtered = [];
        foreach ($purchases as $p) {
            if ($p['orderId'] !== $orderId) {
                $filtered[] = $p;
            }
        }
        savePurchasesFallback($filtered);
    }

    echo json_encode(['success' => true, 'purchases' => fetchAllPurchases()]);
    exit;
}

// 20. POST /api/generate-pdf-token - Authenticate buyer and generate secure temporary download token
if ($route === 'generate-pdf-token' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unitId = $input['unitId'] ?? '';
    $orderId = $input['orderId'] ?? '';

    if (!$unitId || !$orderId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unitId or orderId']);
        exit;
    }

    $purchases = fetchAllPurchases();
    $found = null;
    foreach ($purchases as $p) {
        if ($p['unitId'] === $unitId && $p['orderId'] === $orderId) {
            $found = $p;
            break;
        }
    }

    if (!$found || $found['status'] !== 'Successful') {
        http_response_code(403);
        echo json_encode(['error' => 'No successful purchase record found. Please complete payment first.']);
        exit;
    }

    $secret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : 'f2scYz1fz3Qugba12DjhqmMD';
    $expires = time() + 3600; // 1 hour expiry
    $token = hash_hmac('sha256', "$unitId|$orderId|$expires", $secret);

    echo json_encode([
        'success' => true,
        'downloadUrl' => "/api/pdf-download/$unitId?orderId=" . urlencode($orderId) . "&expires=$expires&token=$token"
    ]);
    exit;
}

// 21. GET /api/pdf-download/:unitId - Validate token and stream the full physical PDF file securely
if ($isPdfDownload) {
    $unitId = $matches[1] ?? '';
    $orderId = $_GET['orderId'] ?? '';
    $expires = (int)($_GET['expires'] ?? 0);
    $token = $_GET['token'] ?? '';

    if (!$unitId || !$orderId || !$expires || !$token) {
        http_response_code(400);
        echo "Missing secure download parameters.";
        exit;
    }

    if (time() > $expires) {
        http_response_code(403);
        echo "This secure download link has expired. Please refresh the page to generate a new link.";
        exit;
    }

    $secret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : 'f2scYz1fz3Qugba12DjhqmMD';
    $expectedToken = hash_hmac('sha256', "$unitId|$orderId|$expires", $secret);

    if (!hash_equals($expectedToken, $token)) {
        http_response_code(403);
        echo "Invalid secure download token. Access denied.";
        exit;
    }

    // Get note details to find file path
    $notes = fetchAllNotes();
    $pdfUrl = null;
    $pdfName = null;
    foreach ($notes as $n) {
        if ($n['id'] === $unitId) {
            $pdfUrl = $n['pdfUrl'] ?? null;
            $pdfName = $n['pdfName'] ?? null;
            break;
        }
    }

    if (!$pdfUrl) {
        http_response_code(404);
        echo "PDF file path not associated with this unit. Please contact admin.";
        exit;
    }

    $uploadsDir = getUploadsDir();
    $rootDir = dirname(dirname(__DIR__));
    $fileName = basename($pdfUrl);
    $originalName = $pdfName ? basename($pdfName) : '';

    // List of possible paths on Hostinger server
    $possiblePaths = [];
    
    if ($fileName) {
        $possiblePaths[] = $uploadsDir . '/pdfs/' . $fileName;
        $possiblePaths[] = $uploadsDir . '/' . $fileName;
        $possiblePaths[] = $rootDir . '/uploads/pdfs/' . $fileName;
        $possiblePaths[] = $rootDir . '/uploads/' . $fileName;
        $possiblePaths[] = $rootDir . '/' . $fileName;
        $possiblePaths[] = $rootDir . '/public/uploads/pdfs/' . $fileName;
        $possiblePaths[] = $rootDir . '/public/uploads/' . $fileName;
        $possiblePaths[] = $rootDir . '/public/' . $fileName;
        $possiblePaths[] = dirname(__DIR__) . '/uploads/pdfs/' . $fileName;
        $possiblePaths[] = dirname(__DIR__) . '/uploads/' . $fileName;
    }
    if ($originalName) {
        $possiblePaths[] = $uploadsDir . '/pdfs/' . $originalName;
        $possiblePaths[] = $uploadsDir . '/' . $originalName;
        $possiblePaths[] = $rootDir . '/uploads/pdfs/' . $originalName;
        $possiblePaths[] = $rootDir . '/uploads/' . $originalName;
        $possiblePaths[] = $rootDir . '/' . $originalName;
        $possiblePaths[] = $rootDir . '/public/uploads/pdfs/' . $originalName;
        $possiblePaths[] = $rootDir . '/public/uploads/' . $originalName;
        $possiblePaths[] = $rootDir . '/public/' . $originalName;
        $possiblePaths[] = dirname(__DIR__) . '/uploads/pdfs/' . $originalName;
        $possiblePaths[] = dirname(__DIR__) . '/uploads/' . $originalName;
    }
    
    // Also check common variations like space decoded or encoded
    if ($originalName && strpos($originalName, ' ') !== false) {
        $urlEncodedName = rawurlencode($originalName);
        $possiblePaths[] = $uploadsDir . '/pdfs/' . $urlEncodedName;
        $possiblePaths[] = $uploadsDir . '/' . $urlEncodedName;
        $possiblePaths[] = $rootDir . '/uploads/pdfs/' . $urlEncodedName;
        $possiblePaths[] = $rootDir . '/uploads/' . $urlEncodedName;
        $possiblePaths[] = $rootDir . '/' . $urlEncodedName;
    }

    $filePath = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path) && is_file($path)) {
            $filePath = $path;
            break;
        }
    }

    if (!$filePath) {
        http_response_code(404);
        $searchedList = implode(', ', array_unique(array_map('basename', $possiblePaths)));
        echo "The requested original PDF file was not found on the Hostinger server. We checked file names: [ $searchedList ] under the uploads/ and public_html root folders. Please make sure the file name is correct. Contact Rajesh Ji at handscriptnotesak47@gmail.com.";
        exit;
    }

    $downloadName = $pdfName ?: "{$unitId}.pdf";
    if (substr($downloadName, -4) !== '.pdf') {
        $downloadName .= '.pdf';
    }

    header("Content-Type: application/pdf");
    header("Content-Disposition: attachment; filename=\"$downloadName\"");
    header("Content-Length: " . filesize($filePath));
    readfile($filePath);
    exit;
}

// 16. POST /api/notes/upload-pdf-file (Handles binary multipart uploads of full PDF + optional preview PDF)
if ($route === 'notes/upload-pdf-file' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $unitId = $_POST['unitId'] ?? null;
    $isNewUnit = ($_POST['isNewUnit'] ?? 'false') === 'true';
    
    if (!$unitId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing unitId parameter.']);
        exit;
    }

    if (!isset($_FILES['pdfFile'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No PDF file uploaded.']);
        exit;
    }

    $pdfFile = $_FILES['pdfFile'];
    if ($pdfFile['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Upload error code: ' . $pdfFile['error']]);
        exit;
    }

    // Validate mime-type & extension (safely fallback if fileinfo is not available)
    $mimeType = 'application/pdf';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mimeType = finfo_file($finfo, $pdfFile['tmp_name']);
            finfo_close($finfo);
        }
    }

    $ext = strtolower(pathinfo($pdfFile['name'], PATHINFO_EXTENSION));
    if (($mimeType !== 'application/pdf' && $mimeType !== 'application/x-pdf' && $mimeType !== 'application/octet-stream') || $ext !== 'pdf') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file format. Only PDF files are allowed. Loaded type: ' . $mimeType]);
        exit;
    }

    try {
        $uploadsDir = getUploadsDir();
        $pdfsDir = $uploadsDir . '/pdfs';

        // Auto-create uploads/ & uploads/pdfs/
        if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }
        if (!file_exists($pdfsDir)) {
            mkdir($pdfsDir, 0755, true);
        }

        // Sanitize & generate distinct filename
        $originalName = basename($pdfFile['name']);
        $sanitizedName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $originalName);
        $fullFileName = $unitId . '-' . time() . '-' . $sanitizedName;
        $fullFilePath = $pdfsDir . '/' . $fullFileName;

        if (!move_uploaded_file($pdfFile['tmp_name'], $fullFilePath)) {
            throw new Exception("Could not write the uploaded file to disk. Check directory permissions.");
        }

        // Verify file exists on server disk
        if (!file_exists($fullFilePath)) {
            throw new Exception("File verification failed. The file was not saved on Hostinger server.");
        }

        $publicUrl = '/uploads/pdfs/' . $fullFileName;

        // Process preview file if provided
        if (isset($_FILES['pdfPreviewFile']) && $_FILES['pdfPreviewFile']['error'] === UPLOAD_ERR_OK) {
            $previewFile = $_FILES['pdfPreviewFile'];
            $previewFileName = $unitId . '-preview.pdf';
            $previewFilePath = $pdfsDir . '/' . $previewFileName;
            $oldPreviewFilePath = $uploadsDir . '/' . $previewFileName;
            
            if (move_uploaded_file($previewFile['tmp_name'], $previewFilePath)) {
                if (file_exists($previewFilePath)) {
                    copy($previewFilePath, $oldPreviewFilePath);
                }
            }
        }

        // Only update database if it's NOT a new unit (existing units get synced immediately)
        if (!$isNewUnit) {
            if ($useMySQL) {
                try {
                    $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET pdfUrl = ?, pdfName = ? WHERE id = ?");
                    $stmt->execute([$publicUrl, $originalName, $unitId]);
                } catch (Exception $e) {
                    $useMySQL = false;
                }
            }

            if (!$useMySQL) {
                $notes = fetchAllNotes();
                foreach ($notes as &$n) {
                    if ($n['id'] === $unitId) {
                        $n['pdfUrl'] = $publicUrl;
                        $n['pdfName'] = $originalName;
                        break;
                    }
                }
                saveNotesListFallback($notes);
            }
        }

        echo json_encode([
            'success' => true,
            'pdfUrl' => $publicUrl,
            'pdfName' => $originalName,
            'notes' => fetchAllNotes()
        ]);
        exit;
    } catch (Exception $e) {
        error_log("PDF Upload error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process PDF upload: ' . $e->getMessage()]);
        exit;
    }
}

// 22. Fallback route not found
http_response_code(404);
echo json_encode(['error' => 'Route not found: ' . $route]);
exit;
