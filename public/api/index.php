<?php
/**
 * HandScript Notes PHP API Routing Controller
 * Compatible with Hostinger Shared Web Hosting
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

// Route static file previews as PDF streams (cannot use application/json content-type)
$isPdfPreview = preg_match('/^pdf-preview\/(.+)$/', $route);
if (!$isPdfPreview) {
    header("Content-Type: application/json; charset=UTF-8");
}

// Setup Database Connection and Tables Auto-Installer
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

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

        // Seed original handwritten notes list from notes_db.json
        $notesFile = __DIR__ . '/notes_db.json';
        if (file_exists($notesFile)) {
            $notesJson = file_get_contents($notesFile);
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
    }
} catch (Exception $e) {
    if ($isPdfPreview) {
        http_response_code(500);
        echo "Database connection or initialization failed: " . $e->getMessage();
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Database Connection Failed',
            'details' => $e->getMessage(),
            'tip' => 'Please configure the MySQL credentials in public/api/config.php'
        ]);
    }
    exit;
}

// Load raw json input parameters
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?? [];

// Helper to sanitize database output notes list
function fetchAllNotes($pdo) {
    $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "notes` ORDER BY examId ASC, unitNumber ASC");
    $notes = $stmt->fetchAll();
    foreach ($notes as &$n) {
        $n['unitNumber'] = (int)$n['unitNumber'];
        $n['price'] = (int)$n['price'];
        $n['demoPages'] = json_decode($n['demoPages'] ?? '[]', true);
        $n['fullPages'] = json_decode($n['fullPages'] ?? '[]', true);
    }
    return $notes;
}

// Helper to sanitize database output queries list
function fetchAllQueries($pdo) {
    $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "queries` ORDER BY createdAt DESC");
    $queries = $stmt->fetchAll();
    foreach ($queries as &$q) {
        $q['replied'] = (bool)$q['replied'];
    }
    return $queries;
}


// ========================================================
// API ROUTING ENDPOINTS
// ========================================================

// 1. GET /api/notes
if ($route === 'notes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchAllNotes($pdo));
    exit;
}

// 2. GET /api/queries
if ($route === 'queries' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(fetchAllQueries($pdo));
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

    echo json_encode([
        'success' => true,
        'queries' => fetchAllQueries($pdo)
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

    $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "queries` SET replied = 1 WHERE id = ?");
    $stmt->execute([$queryId]);

    echo json_encode([
        'success' => true,
        'queries' => fetchAllQueries($pdo)
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

    $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET price = ? WHERE id = ?");
    $stmt->execute([(int)$price, $unitId]);

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes($pdo)
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
        $uploadsDir = dirname(dirname(__DIR__)) . '/uploads';
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

        // Sync details to MySQL Database
        $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "notes` SET pdfUrl = ?, pdfName = ? WHERE id = ?");
        $stmt->execute([$publicUrl, $pdfName, $unitId]);

        echo json_encode([
            'success' => true,
            'pdfUrl' => $publicUrl,
            'pdfName' => $pdfName,
            'notes' => fetchAllNotes($pdo)
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

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes($pdo)
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

    $stmt = $pdo->prepare("DELETE FROM `" . DB_PREFIX . "notes` WHERE id = ?");
    $stmt->execute([$unitId]);

    echo json_encode([
        'success' => true,
        'notes' => fetchAllNotes($pdo)
    ]);
    exit;
}

// 9. POST /api/admin/verify-login
if ($route === 'admin/verify-login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM `" . DB_PREFIX . "admin_config` WHERE LOWER(username) = ? LIMIT 1");
    $stmt->execute([strtolower(trim($username))]);
    $admin = $stmt->fetch();

    if ($admin && $password === $admin['password']) {
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

    $stmt = $pdo->prepare("SELECT security_question FROM `" . DB_PREFIX . "admin_config` WHERE LOWER(username) = ? LIMIT 1");
    $stmt->execute([strtolower(trim($username))]);
    $q = $stmt->fetchColumn();

    if ($q) {
        echo json_encode(['success' => true, 'securityQuestion' => $q]);
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

    $stmt = $pdo->prepare("SELECT * FROM `" . DB_PREFIX . "admin_config` WHERE LOWER(username) = ? LIMIT 1");
    $stmt->execute([strtolower(trim($username))]);
    $admin = $stmt->fetch();

    if (!$admin) {
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

    $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "admin_config` SET password = ? WHERE id = ?");
    $stmt->execute([$newPassword, $admin['id']]);

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

    $stmt = $pdo->query("SELECT * FROM `" . DB_PREFIX . "admin_config` LIMIT 1");
    $admin = $stmt->fetch();

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

    $stmt = $pdo->prepare("UPDATE `" . DB_PREFIX . "admin_config` SET username = ?, password = ?, security_question = ?, security_answer = ? WHERE id = ?");
    $stmt->execute([$updatedUsername, $updatedPassword, $updatedQ, $updatedA, $admin['id']]);

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

    $keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : 'rzp_test_T6hjycCqpGUq5P';
    $keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '8Oi9PqF2Y81b7qE0SFBMvrox';

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

    $keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '8Oi9PqF2Y81b7qE0SFBMvrox';
    $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

    if (hash_equals($generatedSignature, $signature)) {
        echo json_encode(['success' => true, 'message' => 'Payment verified successfully']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payment signature. Verification failed.']);
    }
    exit;
}

// 15. GET /api/pdf-preview/:unitId (Serves the secure 4-page sliced PDF directly from Hostinger disk)
if ($isPdfPreview) {
    $unitId = $matches[1];
    $uploadsDir = dirname(dirname(__DIR__)) . '/uploads';
    $previewPath = $uploadsDir . '/' . $unitId . '-preview.pdf';

    if (file_exists($previewPath)) {
        header("Content-Type: application/pdf");
        header("Content-Disposition: inline; filename=\"preview_{$unitId}.pdf\"");
        readfile($previewPath);
        exit;
    } else {
        // Fallback: look for the full PDF URL in the MySQL database
        $stmt = $pdo->prepare("SELECT pdfUrl FROM `" . DB_PREFIX . "notes` WHERE id = ? LIMIT 1");
        $stmt->execute([$unitId]);
        $pdfUrl = $stmt->fetchColumn();

        if ($pdfUrl) {
            $relativePath = ltrim($pdfUrl, '/');
            $localPath = dirname(dirname(__DIR__)) . '/' . $relativePath;
            if (file_exists($localPath)) {
                header("Content-Type: application/pdf");
                header("Content-Disposition: inline; filename=\"preview_{$unitId}.pdf\"");
                readfile($localPath);
                exit;
            }
        }
    }

    http_response_code(404);
    echo "Secure preview PDF not found. The admin must attach/upload a PDF first.";
    exit;
}

// 16. Fallback route not found
http_response_code(404);
echo json_encode(['error' => 'Route not found: ' . $route]);
exit;
