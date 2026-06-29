# 🚀 Hostinger Web Hosting Deployment & Setup Guide
### HandScript Notes - Fully Dynamic PHP + MySQL Backend

This guide contains everything you need to deploy your premium dynamic website onto **Hostinger Shared Web Hosting** (or any standard Apache/PHP/MySQL cPanel hosting).

---

## 📋 System Requirements
- **Web Server:** Apache (Hostinger Standard/Premium/Business shared web hosting)
- **PHP Version:** PHP 7.4 to 8.3 (Recommended: PHP 8.1 or 8.2)
- **Database:** MySQL / MariaDB

---

## 🛠️ Step 1: Build Your Application locally
Before uploading, build the frontend production assets:
1. Run `npm run build` in your terminal.
2. This creates a directory called `dist` in the root of your project.
3. The `dist` directory is the **only** folder you need to upload to Hostinger! It contains:
   - Your compiled HTML, JS, CSS.
   - The `/api` folder with your dynamic PHP scripts (`config.php`, `index.php`, `notes_db.json`).
   - The `.htaccess` file containing high-performance routing rules.

---

## 🗄️ Step 2: Create a MySQL Database on Hostinger
1. Log in to your **Hostinger hPanel**.
2. Navigate to **Databases** > **MySQL Databases**.
3. Create a new MySQL database:
   - **MySQL Database Name:** e.g., `u123456789_handscript_db`
   - **MySQL Username:** e.g., `u123456789_admin`
   - **Password:** Create a secure password (write it down!)
4. Click **Create**.

---

## ✏️ Step 3: Configure Database Credentials in `config.php`
You do **not** need to manually run any SQL scripts! The backend has a **smart auto-installer** that creates the tables and seeds them with all of your notes on the first visit.

1. Inside your compiled `dist/api/config.php` file, open it in any text editor.
2. Replace the credentials with your Hostinger MySQL details:
```php
// Database Configuration
define('DB_HOST', 'localhost'); // Keep as localhost on Hostinger
define('DB_USER', 'u123456789_admin'); // Replace with your MySQL Username
define('DB_PASS', 'YourSecretPassword'); // Replace with your MySQL Password
define('DB_NAME', 'u123456789_handscript_db'); // Replace with your MySQL Database Name
```
3. Save the file.

---

## 📤 Step 4: Upload the Assets to Hostinger
You can upload using **Hostinger File Manager** or an **FTP Client (like FileZilla)**:

### Option A: Using Hostinger File Manager (Easiest)
1. Go to **Hostinger hPanel** > **Files** > **File Manager**.
2. Open the `public_html` directory of your domain (`handscriptnotes.com`).
3. If there are any default files (like `default.php` or `index.php`), delete them.
4. Select all files and folders **inside** your local `dist` folder, compress them into a `.zip` file (e.g. `upload.zip`).
5. Upload `upload.zip` into the `public_html` folder.
6. Right-click `upload.zip` and select **Extract** to the current directory (`public_html`).
7. Ensure that the files (`index.html`, `.htaccess`, `api/`, `assets/`) are directly in `public_html` (not nested inside a folder).

---

## 🎉 Step 5: Run & Verify Auto-Installation
1. Open your web browser and navigate to your website: `https://handscriptnotes.com` (or `https://your-domain.com`).
2. The dynamic system will detect an empty database, automatically build the tables, and import all existing notes from `notes_db.json` within milliseconds!
3. **Admin Panel Access:**
   - Go to your website's **Admin Tab** in the navigation bar.
   - Enter your default administrator credentials:
     * **User ID:** `HandScriptNotesak47`
     * **Password:** `P@ssw0rdadminak47`
   - You can securely change your Username, Password, and Security Question directly from the **Security Settings** inside the Admin Panel!

---

## 🔒 Security & Admin Upload Operations
1. **Durable File Uploads:**
   When you upload a PDF file from the Admin Panel, it is base64 encoded, sliced in the browser to extract the first 4 pages, and uploaded to your Hostinger server.
   - The full PDF is securely saved in `public_html/uploads/` with a unique timestamped name.
   - The preview PDF containing only the first 4 pages is saved as `public_html/uploads/{unit-id}-preview.pdf`.
2. **Access Control:**
   When non-paying students attempt to view a locked note, they fetch the secure preview endpoint (`/api/pdf-preview/{unit-id}`). This serves **only** the sliced 4-page preview file directly from the server, meaning unpaid users can never steal or access the full PDF bytes.

---

## ❓ Troubleshooting
- **500 Internal Server Error:**
  - Double check your `api/config.php` credentials. A mismatch in database name or username can cause PDO connection failures.
- **Notes not showing up / Empty list:**
  - Ensure that `api/notes_db.json` exists in `public_html/api/` during the first run so the auto-installer can seed the database.
- **404 Page Not Found on refresh:**
  - Make sure the `.htaccess` file was successfully uploaded to the root of `public_html`. (Some operating systems hide files starting with `.`).
