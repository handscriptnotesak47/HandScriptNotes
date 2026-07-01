import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NOTES_LIST } from './src/data';
import { NotesUnit } from './src/types';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';

dotenv.config();

async function startServer() {
  const app = express();
  // Hostinger typically injects PORT, fallback to 3000 for AI Studio environment
  const PORT = process.env.PORT || 3000;

  // Support both direct development execution and compiled production bundle running on Hostinger
  const APP_ROOT = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '..')
    : process.cwd();

  // JSON and URL-encoded parsers for any API requests with larger payload limit for base64 PDFs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Path for storing our persistent data
  const DB_PATH = path.join(APP_ROOT, 'notes_db.json');
  const UPLOADS_DIR = path.join(APP_ROOT, 'uploads');
  const PURCHASES_DB_PATH = path.join(APP_ROOT, 'purchases_db.json');

  // Helper to resolve physical file path from a public URL safely
  function getPhysicalPath(pdfUrl: string): string {
    let cleanUrl = pdfUrl;
    if (cleanUrl.startsWith('/api/uploads/')) {
      cleanUrl = cleanUrl.replace('/api/uploads/', '/uploads/');
    }
    const relativePath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
    return path.join(APP_ROOT, relativePath);
  }

  // Ensure uploads directory exists and is secured via .htaccess
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const htaccessPath = path.join(UPLOADS_DIR, '.htaccess');
  if (!fs.existsSync(htaccessPath)) {
    fs.writeFileSync(htaccessPath, 'Deny from all\n', 'utf8');
  }

  // Multer middleware for binary multipart uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Helper functions for loading and saving purchases
  function loadPurchases(): any[] {
    if (fs.existsSync(PURCHASES_DB_PATH)) {
      try {
        const data = fs.readFileSync(PURCHASES_DB_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to read purchases_db.json:', e);
      }
    }
    return [];
  }

  function savePurchases(purchases: any[]) {
    try {
      fs.writeFileSync(PURCHASES_DB_PATH, JSON.stringify(purchases, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write purchases_db.json:', e);
    }
  }

  // Automatic server-side PDF preview generation helper using pdf-lib
  async function ensurePdfPreview(unitId: string, originalFilePath: string) {
    const pdfsDir = path.join(UPLOADS_DIR, 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }
    const previewFilePath = path.join(pdfsDir, `${unitId}-preview.pdf`);
    const oldPreviewFilePath = path.join(UPLOADS_DIR, `${unitId}-preview.pdf`);

    try {
      if (!fs.existsSync(originalFilePath)) {
        throw new Error("Original PDF file does not exist on server disk.");
      }

      const pdfBytes = fs.readFileSync(originalFilePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const subPdfDoc = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();
      const pagesToCopy = Math.min(4, totalPages);
      
      const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => i);
      const copiedPages = await subPdfDoc.copyPages(pdfDoc, pageIndices);
      for (const page of copiedPages) {
        subPdfDoc.addPage(page);
      }
      
      const pdfBytesOut = await subPdfDoc.save();
      fs.writeFileSync(previewFilePath, Buffer.from(pdfBytesOut));
      fs.writeFileSync(oldPreviewFilePath, Buffer.from(pdfBytesOut));
      console.log(`[PREVIEW GENERATOR] Generated preview automatically for unit ${unitId}`);
    } catch (err: any) {
      console.error(`[PREVIEW GENERATOR] Failed to automatically generate preview for ${unitId}:`, err);
      throw err;
    }
  }

  // Helper functions for loading and saving notes data with Hostinger MySQL support and local JSON fallback
  let mysqlPool: mysql.Pool | null = null;
  const DB_PREFIX = process.env.DB_PREFIX !== undefined ? process.env.DB_PREFIX : 'hsn_';
  const NOTES_TABLE = `${DB_PREFIX}notes`;

  function getMySQLPool(): mysql.Pool {
    if (!mysqlPool) {
      let host = process.env.DB_HOST || '127.0.0.1';
      // Force IPv4 loopback to avoid IPv6 '::1' resolution which causes Access Denied on Hostinger
      if (host === 'localhost') {
        host = '127.0.0.1';
      }
      const user = process.env.DB_USER;
      const password = process.env.DB_PASS || process.env.DB_PASSWORD;
      const database = process.env.DB_NAME;
      const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

      if (!user || !database) {
        throw new Error('MySQL credentials (DB_USER, DB_NAME) are required in environment variables for live connection.');
      }

      mysqlPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }
    return mysqlPool;
  }

  let dbInitialized = false;
  async function initDatabase() {
    if (dbInitialized) return;
    try {
      const p = getMySQLPool();
      
      // Create table if not exists
      await p.query(`
        CREATE TABLE IF NOT EXISTS \`${NOTES_TABLE}\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`examId\` VARCHAR(50) NOT NULL,
          \`unitNumber\` INT NOT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`shortDescription\` TEXT NOT NULL,
          \`price\` INT NOT NULL,
          \`demoPages\` LONGTEXT,
          \`fullPages\` LONGTEXT,
          \`pdfUrl\` VARCHAR(255),
          \`pdfName\` VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Check if table is empty to auto-seed
      const [rows]: any = await p.query(`SELECT COUNT(*) as count FROM \`${NOTES_TABLE}\``);
      const count = rows[0]?.count || 0;
      
      if (count === 0) {
        console.log(`Seeding Hostinger MySQL table '${NOTES_TABLE}' from notes_db.json / NOTES_LIST...`);
        let initialNotes: NotesUnit[] = NOTES_LIST;
        if (fs.existsSync(DB_PATH)) {
          try {
            initialNotes = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
          } catch (e) {
            console.error('Failed to read notes_db.json for seeding:', e);
          }
        }
        
        for (const note of initialNotes) {
          await p.query(
            `INSERT INTO \`${NOTES_TABLE}\` 
             (\`id\`, \`examId\`, \`unitNumber\`, \`name\`, \`shortDescription\`, \`price\`, \`demoPages\`, \`fullPages\`, \`pdfUrl\`, \`pdfName\`) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              note.id,
              note.examId,
              note.unitNumber,
              note.name,
              note.shortDescription,
              note.price,
              JSON.stringify(note.demoPages || []),
              JSON.stringify(note.fullPages || []),
              note.pdfUrl || null,
              note.pdfName || null
            ]
          );
        }
        console.log(`Successfully seeded ${initialNotes.length} units into MySQL table '${NOTES_TABLE}'.`);
      }
      dbInitialized = true;
    } catch (err) {
      console.error('MySQL initDatabase error:', err);
      throw err;
    }
  }

  function loadNotesFromFile(): NotesUnit[] {
    if (fs.existsSync(DB_PATH)) {
      try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to read notes_db.json:', e);
      }
    }
    return NOTES_LIST;
  }

  async function loadNotes(): Promise<NotesUnit[]> {
    const mapUrl = (url: string | undefined | null) => {
      if (!url) return undefined;
      if (url.startsWith('/uploads/')) {
        return url.replace('/uploads/', '/api/uploads/');
      }
      return url;
    };

    const hasCredentials = process.env.DB_USER && process.env.DB_NAME;
    if (!hasCredentials) {
      return loadNotesFromFile().map(unit => ({
        ...unit,
        pdfUrl: mapUrl(unit.pdfUrl)
      }));
    }

    try {
      await initDatabase();
      const p = getMySQLPool();
      const [rows]: any = await p.query(`SELECT * FROM \`${NOTES_TABLE}\` ORDER BY examId ASC, unitNumber ASC`);
      
      return rows.map((row: any) => ({
        id: row.id,
        examId: row.examId,
        unitNumber: Number(row.unitNumber),
        name: row.name,
        shortDescription: row.shortDescription,
        price: Number(row.price),
        demoPages: row.demoPages ? JSON.parse(row.demoPages) : [],
        fullPages: row.fullPages ? JSON.parse(row.fullPages) : [],
        pdfUrl: mapUrl(row.pdfUrl),
        pdfName: row.pdfName || undefined
      }));
    } catch (err) {
      console.error('MySQL loadNotes failed, falling back to local file:', err);
      return loadNotesFromFile().map(unit => ({
        ...unit,
        pdfUrl: mapUrl(unit.pdfUrl)
      }));
    }
  }

  async function saveNotes(notes: NotesUnit[]): Promise<void> {
    // Dual-write: Always save locally to notes_db.json as backup/development compatibility
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(notes, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write backup to notes_db.json:', e);
    }

    const hasCredentials = process.env.DB_USER && process.env.DB_NAME;
    if (!hasCredentials) {
      return;
    }

    try {
      await initDatabase();
      const p = getMySQLPool();

      // Upsert notes
      for (const note of notes) {
        await p.query(
          `INSERT INTO \`${NOTES_TABLE}\` 
           (\`id\`, \`examId\`, \`unitNumber\`, \`name\`, \`shortDescription\`, \`price\`, \`demoPages\`, \`fullPages\`, \`pdfUrl\`, \`pdfName\`) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           \`examId\` = VALUES(\`examId\`), 
           \`unitNumber\` = VALUES(\`unitNumber\`), 
           \`name\` = VALUES(\`name\`), 
           \`shortDescription\` = VALUES(\`shortDescription\`), 
           \`price\` = VALUES(\`price\`), 
           \`demoPages\` = VALUES(\`demoPages\`), 
           \`fullPages\` = VALUES(\`fullPages\`), 
           \`pdfUrl\` = VALUES(\`pdfUrl\`), 
           \`pdfName\` = VALUES(\`pdfName\`)`,
          [
            note.id,
            note.examId,
            note.unitNumber,
            note.name,
            note.shortDescription,
            note.price,
            JSON.stringify(note.demoPages || []),
            JSON.stringify(note.fullPages || []),
            note.pdfUrl || null,
            note.pdfName || null
          ]
        );
      }

      // Cleanup deleted notes
      if (notes.length > 0) {
        const activeIds = notes.map(n => n.id);
        const placeholders = activeIds.map(() => '?').join(',');
        await p.query(
          `DELETE FROM \`${NOTES_TABLE}\` WHERE \`id\` NOT IN (${placeholders})`,
          activeIds
        );
      } else {
        await p.query(`DELETE FROM \`${NOTES_TABLE}\``);
      }
    } catch (err) {
      console.error('MySQL saveNotes failed:', err);
      throw err;
    }
  }

  const QUERIES_DB_PATH = path.join(APP_ROOT, 'queries_db.json');

  function loadQueries(): any[] {
    if (fs.existsSync(QUERIES_DB_PATH)) {
      try {
        const data = fs.readFileSync(QUERIES_DB_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to read queries_db.json:', e);
      }
    }
    return [];
  }

  function saveQueries(queries: any[]) {
    try {
      fs.writeFileSync(QUERIES_DB_PATH, JSON.stringify(queries, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write to queries_db.json:', e);
    }
  }

  // API endpoints for backend persistence
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GET /api/download-images - Packages all website images into a ZIP file and sends it to the user
  app.get('/api/download-images', (req, res) => {
    try {
      const zip = new AdmZip();
      
      const imagesDir = path.join(APP_ROOT, 'src', 'assets', 'images');
      if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        for (const file of files) {
          const filePath = path.join(imagesDir, file);
          if (fs.statSync(filePath).isFile()) {
            zip.addLocalFile(filePath);
          }
        }
      }
      
      const zipBuffer = zip.toBuffer();
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=website_images.zip');
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('Error creating images ZIP:', err);
      res.status(500).json({ error: 'Failed to create images ZIP file' });
    }
  });

  // Razorpay instance lazy initialization
  let razorpayInstance: any = null;
  function getRazorpay() {
    if (!razorpayInstance) {
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_T7O06QotgMxU0J';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'f2scYz1fz3Qugba12DjhqmMD';
      if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are required in environment variables.');
      }
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    }
    return razorpayInstance;
  }

  // POST /api/create-order
  app.post('/api/create-order', async (req, res) => {
    try {
      const { amount, currency, receipt } = req.body;
      if (!amount || amount < 100) { // minimum 100 paise
        return res.status(400).json({ error: 'Amount is required and must be at least 100 paise' });
      }

      const rzp = getRazorpay();
      const order = await rzp.orders.create({
        amount: Math.round(amount),
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`
      });

      res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (err: any) {
      console.error('Razorpay Create Order Error:', err);
      res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
    }
  });

  // POST /api/verify-payment
  app.post('/api/verify-payment', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required validation fields' });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'f2scYz1fz3Qugba12DjhqmMD';
      const generated_signature = crypto
        .createHmac('sha256', keySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature === razorpay_signature) {
        res.json({ success: true, message: 'Payment verified successfully' });
      } else {
        console.error('Razorpay Signature Mismatch!');
        res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      }
    } catch (err: any) {
      console.error('Razorpay Verification Error:', err);
      res.status(500).json({ error: err.message || 'Failed to verify payment signature' });
    }
  });

  // Admin configuration paths and helpers
  const ADMIN_CONFIG_PATH = path.join(APP_ROOT, 'admin_config.json');

  function loadAdminConfig() {
    if (fs.existsSync(ADMIN_CONFIG_PATH)) {
      try {
        const data = fs.readFileSync(ADMIN_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to read admin_config.json:', e);
      }
    }
    return {
      username: 'HandScriptNotesak47',
      password: 'P@ssw0rdadminak47',
      securityQuestion: 'What is your primary contact email?',
      securityAnswer: 'handscriptnotesak47@gmail.com'
    };
  }

  function saveAdminConfig(config: any) {
    try {
      fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write admin_config.json:', e);
    }
  }

  // POST /api/admin/verify-login
  app.post('/api/admin/verify-login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const config = loadAdminConfig();
    if (username.trim().toLowerCase() === config.username.trim().toLowerCase() && password === config.password) {
      res.json({ success: true, username: config.username });
    } else {
      res.status(401).json({ error: 'Incorrect User ID or Password' });
    }
  });

  // POST /api/admin/forgot-password-question
  app.post('/api/admin/forgot-password-question', (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'User ID is required to fetch security question' });
    }
    const config = loadAdminConfig();
    if (username.trim().toLowerCase() === config.username.trim().toLowerCase()) {
      res.json({ success: true, securityQuestion: config.securityQuestion });
    } else {
      res.status(404).json({ error: 'User ID not found' });
    }
  });

  // POST /api/admin/forgot-password-reset
  app.post('/api/admin/forgot-password-reset', (req, res) => {
    const { username, securityAnswer, newPassword } = req.body;
    const config = loadAdminConfig();
    
    if (!username || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.trim().toLowerCase() !== config.username.trim().toLowerCase()) {
      return res.status(404).json({ error: 'User ID mismatch' });
    }

    if (securityAnswer.trim().toLowerCase() !== config.securityAnswer.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Security answer is incorrect' });
    }

    // Password strength check: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword);
    if (!isStrong) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' 
      });
    }

    config.password = newPassword;
    saveAdminConfig(config);
    res.json({ success: true });
  });

  // POST /api/admin/update-credentials
  app.post('/api/admin/update-credentials', (req, res) => {
    const { currentPassword, newUsername, newPassword, newSecurityQuestion, newSecurityAnswer } = req.body;
    const config = loadAdminConfig();

    if (currentPassword !== config.password) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (newUsername && newUsername.trim()) {
      config.username = newUsername.trim();
    }

    if (newPassword) {
      // Password strength check
      const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword);
      if (!isStrong) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' 
        });
      }
      config.password = newPassword;
    }

    if (newSecurityQuestion && newSecurityQuestion.trim()) {
      config.securityQuestion = newSecurityQuestion.trim();
    }

    if (newSecurityAnswer && newSecurityAnswer.trim()) {
      config.securityAnswer = newSecurityAnswer.trim();
    }

    saveAdminConfig(config);
    res.json({ success: true, username: config.username });
  });

  // ==========================================
  // TECHNICAL SEO & GOOGLE CRAWLER ENDPOINTS
  // ==========================================

  // 1. Robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(
      `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /api/\n` +
      `Disallow: /admin\n` +
      `Disallow: /uploads/\n` +
      `\n` +
      `Sitemap: https://handscriptnotes.com/sitemap.xml`
    );
  });

  // 2. Sitemap.xml (Dynamically Generated with ISO Dates)
  app.get('/sitemap.xml', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    res.type('application/xml');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>daily</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#exams</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>weekly</changefreq>\n` +
      `    <priority>0.9</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#about</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>monthly</changefreq>\n` +
      `    <priority>0.7</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#contact</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>monthly</changefreq>\n` +
      `    <priority>0.7</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#privacy</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>yearly</changefreq>\n` +
      `    <priority>0.3</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#refund</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>yearly</changefreq>\n` +
      `    <priority>0.3</priority>\n` +
      `  </url>\n` +
      `  <url>\n` +
      `    <loc>https://handscriptnotes.com/#terms</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>yearly</changefreq>\n` +
      `    <priority>0.3</priority>\n` +
      `  </url>\n` +
      `</urlset>`
    );
  });

  // 3. Web Manifest
  app.get('/manifest.json', (req, res) => {
    res.type('application/json');
    res.json({
      name: "HandScript Notes",
      short_name: "HandScript",
      description: "Premium Handwritten Notes for Competitive Computer Science Exams compiled by Rajesh Ji.",
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#f97316",
      icons: [
        { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { src: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon-512x512.png", sizes: "512x512", type: "image/png" }
      ]
    });
  });

  // 4. Vector SVG Favicon / Logo (High-contrast, stunning design)
  const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect x="96" y="96" width="320" height="320" rx="40" fill="#ffffff" />
  <rect x="70" y="140" width="40" height="20" rx="10" fill="#cbd5e1" />
  <rect x="70" y="220" width="40" height="20" rx="10" fill="#cbd5e1" />
  <rect x="70" y="300" width="40" height="20" rx="10" fill="#cbd5e1" />
  <path d="M 170 160 L 170 320 M 250 160 L 250 320 M 170 240 L 250 240" stroke="#0f172a" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 340 180 C 310 180, 290 200, 290 220 C 290 250, 340 240, 340 280 C 340 300, 320 320, 290 320" stroke="#f97316" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

  app.get('/favicon.svg', (req, res) => {
    res.type('image/svg+xml');
    res.send(SVG_LOGO);
  });

  // Base64 highly polished, lightweight PNG representing the orange HandScript Notes booklet logo
  const BASE64_PNG_FAVICON = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADwUlEQVR4nO2bXWgcVRTHf+fObrbZpE0XW9I+pGKLpkoofbB96ZMoKKgY8UFEfBAffPBBUB988UUE9UEDgqh906KIKCg++CD4Igo+CEp9UMREfSgKNSZ9sE0bN5v9uDdn9mYns7O7s5PdmTvzB8PMZOfcc+/vnnv/58zdq6pijfL4bC+vOaAArDmgAKw5oACsOaAAfN8Z8Atf0KjWeasD/P8D8vjLwBvX/48G+7nN+Gscf/AALxsc4E0H+N96Dpgf7OdVv/KGD/h4fICvO8AbmXb8Nf4z8PDoAI8bHODNB/jffg7I4y+DNfDwyYUDPG89v5Xp3fGgD/gIeGR6gI0G+1nHr8b/XofP9vGSz7gC/NApID79XODR6QE2GuyG0y7Z8at+9hBvD87ykS+4DDxsFFAd6bSOfbEOn/uUR8CD+6byG866bMc/xreH9pED/A7ssQrInXbRjn/K8XfT3Wv8u0vL0Y6/m5L69HnIInSNo6/xVzm+mO7+HofYwYpX/Z0OnyvArKNAv9MRZ/hL5V/N2K6N9S1g3FFgoT1WAVZ78/l6536XjWzWjVpHPW6669Y5/h5GvNo87fB9T0csAnvshvNpx//D4feXlqOOW6fPMWf4exnyajvT4fsZsBfssQ7IK6c82z5vRzt9H8W2I+V2ZfIcsN9m/bKOP1yOnz9CunscYgfZXn2OWZfN7bVl2m669Y7/OOMvsUf9pUP8PuxRx6+g7Tz+M0Z/b9W7BfT6gD3pI+B+n98Z98W+S+7g6Yw/vD0qgD2V8YfH8Z8Anu877v7b4g6eqeNXM+Z1p8N6zvgDPHh/8gC7fO4IuIeN9nNdfnE08fN19zVGrvGvOf63fNfD19zH/9Ppxr6Bv0wZ8PAt9/p9Ygqg44+7fP4MvAs81CrA6P6I/7q6n47/nNHzK7uO31H3G/86/lNGz8m9dPwNfL/Z9eWUX3Z6uR3/M0bPsc3/A9zXLOF7M/v/vH8v3Y+W9u+A3dfXW47fs/Nfx3/Z9Ld3Y5HffvY6f92/68vU/bM8Z8YVbWv8Ffc7+yU6/hSjz7/u6u04t6vOf96b7sP9f9m+j5bK/z3U8WvXbXb8pYye93sH/v/A7mva8TfWv8p/CzzXvD8M3MvG/j1Uf3t/e3f/f+E1BxSANQcUgDUHFIA1BxSANQcUgPUv+B7uE+0Yy/0AAAAASUVORK5CYII=";

  app.get('/favicon-16x16.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/favicon-32x32.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/favicon-48x48.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/apple-touch-icon.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/favicon-192x192.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/favicon-512x512.png', (req, res) => {
    res.type('image/png');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  app.get('/favicon.ico', (req, res) => {
    res.type('image/x-icon');
    res.send(Buffer.from(BASE64_PNG_FAVICON, 'base64'));
  });

  // Get notes list
  app.get('/api/notes', async (req, res) => {
    try {
      const notes = await loadNotes();
      res.json(notes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/purchases - Fetch all purchases from server DB
  app.get('/api/purchases', (req, res) => {
    res.json(loadPurchases());
  });

  // POST /api/purchases - Log or sync a purchase record with the server DB
  app.post('/api/purchases', (req, res) => {
    try {
      const { purchase } = req.body;
      if (!purchase || !purchase.orderId) {
        return res.status(400).json({ error: 'Missing purchase or orderId' });
      }
      const purchases = loadPurchases();
      // Avoid duplicates
      const existsIndex = purchases.findIndex((p: any) => p.orderId === purchase.orderId);
      if (existsIndex > -1) {
        purchases[existsIndex] = purchase;
      } else {
        purchases.unshift(purchase);
      }
      savePurchases(purchases);
      res.json({ success: true, purchases });
    } catch (err: any) {
      console.error('Error logging purchase:', err);
      res.status(500).json({ error: 'Failed to log purchase on server.' });
    }
  });

  // POST /api/purchases/approve - Admin approves a pending purchase
  app.post('/api/purchases/approve', (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }
      const purchases = loadPurchases();
      const updated = purchases.map((p: any) => 
        p.orderId === orderId ? { ...p, status: 'Successful' } : p
      );
      savePurchases(updated);
      res.json({ success: true, purchases: updated });
    } catch (err: any) {
      console.error('Error approving purchase:', err);
      res.status(500).json({ error: 'Failed to approve purchase.' });
    }
  });

  // POST /api/purchases/decline - Admin rejects/declines a purchase
  app.post('/api/purchases/decline', (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }
      const purchases = loadPurchases();
      const filtered = purchases.filter((p: any) => p.orderId !== orderId);
      savePurchases(filtered);
      res.json({ success: true, purchases: filtered });
    } catch (err: any) {
      console.error('Error declining purchase:', err);
      res.status(500).json({ error: 'Failed to decline purchase.' });
    }
  });

  // POST /api/generate-pdf-token - Authenticates a purchaser and generates a secure temporary download token
  app.post('/api/generate-pdf-token', (req, res) => {
    try {
      const { unitId, orderId } = req.body;
      if (!unitId || !orderId) {
        return res.status(400).json({ error: 'Missing unitId or orderId' });
      }

      const purchases = loadPurchases();
      const purchase = purchases.find((p: any) => p.unitId === unitId && p.orderId === orderId);

      if (!purchase || purchase.status !== 'Successful') {
        return res.status(403).json({ error: 'No successful purchase record found. Please complete payment first.' });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || 'f2scYz1fz3Qugba12DjhqmMD';
      const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
      const token = crypto.createHmac('sha256', secret).update(`${unitId}|${orderId}|${expires}`).digest('hex');

      res.json({
        success: true,
        downloadUrl: `/api/pdf-download/${unitId}?orderId=${encodeURIComponent(orderId)}&expires=${expires}&token=${token}`
      });
    } catch (err: any) {
      console.error('Error generating secure token:', err);
      res.status(500).json({ error: 'Failed to generate secure temporary link.' });
    }
  });

  // GET /api/pdf-download/:unitId - Streams the secure full PDF directly after validating the temporary token
  app.get('/api/pdf-download/:unitId', async (req, res) => {
    try {
      const { unitId } = req.params;
      const { orderId, expires, token } = req.query;

      if (!unitId || !orderId || !expires || !token) {
        return res.status(400).send('Missing secure download parameters.');
      }

      // Verify link expiration
      const nowSecs = Math.floor(Date.now() / 1000);
      if (nowSecs > Number(expires)) {
        return res.status(403).send('This secure download link has expired. Please refresh the page to generate a new link.');
      }

      // Verify cryptographic token signature
      const secret = process.env.RAZORPAY_KEY_SECRET || 'f2scYz1fz3Qugba12DjhqmMD';
      const expectedToken = crypto.createHmac('sha256', secret).update(`${unitId}|${orderId}|${expires}`).digest('hex');

      if (token !== expectedToken) {
        return res.status(403).send('Invalid secure download token. Access denied.');
      }

      // Load notes list to fetch actual file path
      const notes = await loadNotes();
      const note = notes.find((n: any) => n.id === unitId);
      if (!note || !note.pdfUrl) {
        return res.status(404).send('No original physical PDF is associated with this unit block yet.');
      }

      const filePath = getPhysicalPath(note.pdfUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('The requested original handwritten PDF file was not found on the server. Please contact Rajesh Ji at handscriptnotesak47@gmail.com.');
      }

      const fileName = note.pdfName || `${unitId}.pdf`;
      const downloadName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error('Error streaming secure PDF download:', err);
      res.status(500).send('Failed to securely process your PDF file download.');
    }
  });

  // GET /api/pdf-preview/:unitId - Dynamically extracts starting 4 pages of any uploaded PDF securely (or serves pre-sliced file)
  app.get('/api/pdf-preview/:unitId', async (req, res) => {
    const { unitId } = req.params;

    try {
      // 1. Check if a pre-sliced preview file exists on disk
      const previewFilePath = path.join(APP_ROOT, 'uploads', 'pdfs', `${unitId}-preview.pdf`);
      const previewFilePathOld = path.join(APP_ROOT, 'uploads', `${unitId}-preview.pdf`);

      if (fs.existsSync(previewFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preview_${unitId}.pdf"`);
        return fs.createReadStream(previewFilePath).pipe(res);
      } else if (fs.existsSync(previewFilePathOld)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preview_${unitId}.pdf"`);
        return fs.createReadStream(previewFilePathOld).pipe(res);
      }

      // 2. Fallback to dynamic slicing of original file
      const currentNotes = await loadNotes();
      const unit = currentNotes.find(u => u.id === unitId);
      
      if (!unit || !unit.pdfUrl) {
        return res.status(404).send('PDF not found for this unit');
      }

      const filePath = getPhysicalPath(unit.pdfUrl);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('PDF file does not exist on server');
      }

      const pdfBytes = fs.readFileSync(filePath);
      
      // Load PDF via pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Create a sub-document with the first 4 pages
      const subPdfDoc = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();
      const pagesToCopy = Math.min(4, totalPages);
      
      const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => i);
      const copiedPages = await subPdfDoc.copyPages(pdfDoc, pageIndices);
      for (const page of copiedPages) {
        subPdfDoc.addPage(page);
      }
      
      const pdfBytesOut = await subPdfDoc.save();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="preview_${unitId}.pdf"`);
      res.send(Buffer.from(pdfBytesOut));
    } catch (err: any) {
      console.error('Error generating PDF preview:', err);
      res.status(500).send(`Failed to generate preview: ${err.message}`);
    }
  });

  // Update notes price
  app.post('/api/notes/update-price', async (req, res) => {
    const { unitId, price } = req.body;
    try {
      const currentNotes = await loadNotes();
      const updated = currentNotes.map(unit => 
        unit.id === unitId ? { ...unit, price: Number(price) } : unit
      );
      await saveNotes(updated);
      res.json({ success: true, notes: updated });
    } catch (err: any) {
      console.error('Error updating price:', err);
      res.status(500).json({ error: 'Failed to update price' });
    }
  });

  // Save/Upload note PDF
  app.post('/api/notes/update-pdf', async (req, res) => {
    const { unitId, pdfName, pdfData } = req.body;
    if (!unitId || !pdfData) {
      return res.status(400).json({ error: 'Missing unitId or pdfData' });
    }

    try {
      const base64Content = pdfData.split(';base64,').pop();
      if (!base64Content) {
        return res.status(400).json({ error: 'Invalid base64 PDF data' });
      }

      const buffer = Buffer.from(base64Content, 'base64');
      const safeFileName = `${unitId}-${Date.now()}.pdf`;
      const filePath = path.join(UPLOADS_DIR, safeFileName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/api/uploads/${safeFileName}`;

      const currentNotes = await loadNotes();
      const updated = currentNotes.map(unit => 
        unit.id === unitId ? { ...unit, pdfUrl: publicUrl, pdfName: pdfName || 'Uploaded.pdf' } : unit
      );
      await saveNotes(updated);

      res.json({ success: true, pdfUrl: publicUrl, pdfName: pdfName || 'Uploaded.pdf', notes: updated });
    } catch (err: any) {
      console.error('Error saving PDF file:', err);
      res.status(500).json({ error: 'Failed to save PDF on server' });
    }
  });

  // POST /api/notes/upload-pdf-file (Handles binary multipart uploads of full PDF + optional preview PDF)
  app.post('/api/notes/upload-pdf-file', upload.fields([
    { name: 'pdfFile', maxCount: 1 },
    { name: 'pdfPreviewFile', maxCount: 1 }
  ]), async (req: any, res) => {
    const unitId = req.body.unitId;
    const isNewUnit = req.body.isNewUnit === 'true';

    if (!unitId) {
      return res.status(400).json({ error: 'Missing unitId parameter.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const pdfFile = files?.pdfFile?.[0];

    if (!pdfFile) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    let fullFilePath = '';
    let previewFilePath = '';
    let oldPreviewFilePath = '';
    let hasSavedFiles = false;

    try {
      const pdfsDir = path.join(UPLOADS_DIR, 'pdfs');
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }

      // Sanitize & generate distinct filename
      const originalName = path.basename(pdfFile.originalname);
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const fullFileName = `${unitId}-${Math.floor(Date.now() / 1000)}-${sanitizedName}`;
      fullFilePath = path.join(pdfsDir, fullFileName);

      fs.writeFileSync(fullFilePath, pdfFile.buffer);

      // Verify file exists on server disk
      if (!fs.existsSync(fullFilePath)) {
        throw new Error("File verification failed. The file was not saved on server disk.");
      }

      const publicUrl = `/api/uploads/pdfs/${fullFileName}`;

      previewFilePath = path.join(pdfsDir, `${unitId}-preview.pdf`);
      oldPreviewFilePath = path.join(UPLOADS_DIR, `${unitId}-preview.pdf`);

      // Process preview file if provided
      const pdfPreviewFile = files?.pdfPreviewFile?.[0];
      if (pdfPreviewFile) {
        fs.writeFileSync(previewFilePath, pdfPreviewFile.buffer);
        fs.writeFileSync(oldPreviewFilePath, pdfPreviewFile.buffer);
      } else {
        // Automatic server-side fallback generation of the first 4 pages
        await ensurePdfPreview(unitId, fullFilePath);
      }

      hasSavedFiles = true;

      // Only update database if it's NOT a new unit (existing units get synced immediately)
      let notes = await loadNotes();
      const existingUnit = notes.find(u => u.id === unitId);
      const oldPdfUrl = existingUnit?.pdfUrl;

      if (!isNewUnit) {
        notes = notes.map(unit => 
          unit.id === unitId ? { ...unit, pdfUrl: publicUrl, pdfName: originalName } : unit
        );
        await saveNotes(notes);
      }

      // After successful save of database, delete the old original PDF file from server disk
      if (oldPdfUrl && oldPdfUrl !== publicUrl) {
        const oldPath = getPhysicalPath(oldPdfUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
            console.log(`[REPLACE] Successfully deleted old original PDF file: ${oldPath}`);
          } catch (delErr) {
            console.error(`[REPLACE] Failed to delete old original PDF file: ${oldPath}`, delErr);
          }
        }
      }

      res.json({
        success: true,
        pdfUrl: publicUrl,
        pdfName: originalName,
        notes: await loadNotes()
      });
    } catch (err: any) {
      console.error("PDF Upload error:", err);
      // Clean up newly uploaded files on failure
      if (fullFilePath && fs.existsSync(fullFilePath)) {
        try { fs.unlinkSync(fullFilePath); } catch (e) {}
      }
      if (hasSavedFiles) {
        if (previewFilePath && fs.existsSync(previewFilePath)) {
          try { fs.unlinkSync(previewFilePath); } catch (e) {}
        }
        if (oldPreviewFilePath && fs.existsSync(oldPreviewFilePath)) {
          try { fs.unlinkSync(oldPreviewFilePath); } catch (e) {}
        }
      }
      res.status(500).json({ error: `Failed to process PDF upload: ${err.message}` });
    }
  });

  // Add new unit (supports multipart form-data for robust uploads and JSON fallback)
  app.post('/api/notes/add-unit', upload.fields([
    { name: 'pdfFile', maxCount: 1 },
    { name: 'pdfPreviewFile', maxCount: 1 }
  ]), async (req: any, res) => {
    let savedFilePath = '';
    let previewFilePath = '';
    let oldPreviewFilePath = '';
    let hasSavedPreview = false;

    try {
      // 1. Check if request is multipart or JSON
      const isMultipart = req.files && (req.files.pdfFile || req.files.pdfPreviewFile);

      let examId: string;
      let unitNumber: number;
      let name: string;
      let shortDescription: string;
      let price: number;
      let pdfUrl: string | undefined = undefined;
      let pdfName: string | undefined = undefined;

      const currentNotes = await loadNotes();

      if (isMultipart) {
        examId = req.body.examId;
        unitNumber = Number(req.body.unitNumber);
        name = req.body.name;
        shortDescription = req.body.shortDescription;
        price = Number(req.body.price);

        if (!examId || isNaN(unitNumber) || !name || !shortDescription || isNaN(price)) {
          return res.status(400).json({ error: 'Missing or invalid metadata fields.' });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const pdfFile = files?.pdfFile?.[0];

        if (!pdfFile) {
          return res.status(400).json({ error: 'No PDF file uploaded.' });
        }

        const unitId = `${examId.toLowerCase().replace(/_/g, '-')}-unit-${unitNumber}`;
        if (currentNotes.some(u => u.id === unitId)) {
          return res.status(400).json({ error: `Conflict Error: A note package with Unit Number "${unitNumber}" already exists for the "${examId}" exam list.` });
        }

        const pdfsDir = path.join(UPLOADS_DIR, 'pdfs');
        if (!fs.existsSync(pdfsDir)) {
          fs.mkdirSync(pdfsDir, { recursive: true });
        }

        // Save original PDF file cleanly
        const originalName = path.basename(pdfFile.originalname);
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fullFileName = `${unitId}-${Math.floor(Date.now() / 1000)}-${sanitizedName}`;
        const fullFilePath = path.join(pdfsDir, fullFileName);

        fs.writeFileSync(fullFilePath, pdfFile.buffer);
        savedFilePath = fullFilePath;

        // Verify file exists on server disk
        if (!fs.existsSync(fullFilePath)) {
          throw new Error("File verification failed. The file was not saved on server disk.");
        }

        pdfUrl = `/api/uploads/pdfs/${fullFileName}`;
        pdfName = originalName;

        previewFilePath = path.join(pdfsDir, `${unitId}-preview.pdf`);
        oldPreviewFilePath = path.join(UPLOADS_DIR, `${unitId}-preview.pdf`);

        // Process preview file if provided
        const pdfPreviewFile = files?.pdfPreviewFile?.[0];
        if (pdfPreviewFile) {
          fs.writeFileSync(previewFilePath, pdfPreviewFile.buffer);
          fs.writeFileSync(oldPreviewFilePath, pdfPreviewFile.buffer);
        } else {
          // Automatic server-side fallback generation of the first 4 pages
          await ensurePdfPreview(unitId, fullFilePath);
        }

        hasSavedPreview = true;

        const newUnit: NotesUnit = {
          id: unitId,
          examId: examId as any,
          unitNumber,
          name,
          shortDescription,
          price,
          pdfUrl,
          pdfName,
          demoPages: [
            {
              pageNumber: 1,
              title: `${name} (Uploaded)`,
              paragraphs: [
                '✍️ SYSTEM GENERATED DEMO NOTE:',
                'This syllabus note has been compiled, parsed, and secure-signed by the Admin console.',
                '👉 Standard PDF structures apply. High priority theoretical insights and practice answers unlocked.'
              ]
            }
          ],
          fullPages: [
            {
              pageNumber: 1,
              title: `${name} (Full Syllabus)`,
              paragraphs: [
                '✍️ SYSTEM GENERATED CORE NOTES:',
                'This content is fully unlocked. Access is provided permanently to your student portal.',
                '• Review direct formulas and schematic mappings beneath.'
              ]
            }
          ]
        };

        const updated = [...currentNotes, newUnit];
        await saveNotes(updated);

        res.json({ success: true, notes: await loadNotes() });
      } else {
        // Fallback for JSON body
        const { unit } = req.body;
        if (!unit) {
          return res.status(400).json({ error: 'Missing unit parameter.' });
        }
        if (currentNotes.some(u => u.id === unit.id)) {
          return res.status(400).json({ error: 'Conflict Error: A note package with this Unit already exists.' });
        }
        const updated = [...currentNotes, unit];
        await saveNotes(updated);
        res.json({ success: true, notes: await loadNotes() });
      }
    } catch (err: any) {
      console.error('Error adding unit:', err);
      // Clean up newly uploaded original file on database failure
      if (savedFilePath && fs.existsSync(savedFilePath)) {
        try {
          fs.unlinkSync(savedFilePath);
        } catch (cleanupErr) {
          console.error('Failed to delete uploaded file after DB failure:', cleanupErr);
        }
      }
      // Clean up preview files on database failure
      if (hasSavedPreview) {
        if (previewFilePath && fs.existsSync(previewFilePath)) {
          try { fs.unlinkSync(previewFilePath); } catch (e) {}
        }
        if (oldPreviewFilePath && fs.existsSync(oldPreviewFilePath)) {
          try { fs.unlinkSync(oldPreviewFilePath); } catch (e) {}
        }
      }
      res.status(500).json({ error: `Failed to add unit: ${err.message}` });
    }
  });

  // Remove unit
  app.post('/api/notes/remove-unit', async (req, res) => {
    const { unitId } = req.body;
    try {
      const currentNotes = await loadNotes();
      const targetUnit = currentNotes.find(unit => unit.id === unitId);
      
      // Delete physical files from server disk associated with the unit
      if (targetUnit && targetUnit.pdfUrl) {
        const filePath = getPhysicalPath(targetUnit.pdfUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[DELETE] Successfully deleted physical PDF file: ${filePath}`);
          } catch (e) {
            console.error(`[DELETE] Failed to delete physical PDF file: ${filePath}`, e);
          }
        }

        // Delete associated preview files
        const previewFilePath = path.join(APP_ROOT, 'uploads', 'pdfs', `${unitId}-preview.pdf`);
        const oldPreviewFilePath = path.join(APP_ROOT, 'uploads', `${unitId}-preview.pdf`);
        if (fs.existsSync(previewFilePath)) {
          try { fs.unlinkSync(previewFilePath); } catch (e) {}
        }
        if (fs.existsSync(oldPreviewFilePath)) {
          try { fs.unlinkSync(oldPreviewFilePath); } catch (e) {}
        }
      }

      const updated = currentNotes.filter(unit => unit.id !== unitId);
      await saveNotes(updated);
      res.json({ success: true, notes: await loadNotes() });
    } catch (err: any) {
      console.error('Error removing unit:', err);
      res.status(500).json({ error: `Failed to remove unit: ${err.message}` });
    }
  });

  // GET /api/queries - Load all persistent queries
  app.get('/api/queries', (req, res) => {
    res.json(loadQueries());
  });

  // POST /api/queries - Submit a new query from live web site
  app.post('/api/queries', (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing query object' });
    }
    const currentQueries = loadQueries();
    // Add new query to the front of the list
    const updated = [query, ...currentQueries];
    saveQueries(updated);
    res.json({ success: true, queries: updated });
  });

  // POST /api/queries/answer - Mark a query as replied by Admin
  app.post('/api/queries/answer', (req, res) => {
    const { queryId } = req.body;
    if (!queryId) {
      return res.status(400).json({ error: 'Missing queryId' });
    }
    const currentQueries = loadQueries();
    const updated = currentQueries.map(q => 
      q.id === queryId ? { ...q, replied: true } : q
    );
    saveQueries(updated);
    res.json({ success: true, queries: updated });
  });

  // Serve uploads directory publicly via both /uploads and /api/uploads to bypass Apache directory interception on Hostinger
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/api/uploads', express.static(UPLOADS_DIR));

  // Serve static files and handle routing depending on environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode with Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode; serving pre-built static assets');
    const distPath = path.join(APP_ROOT, 'dist');
    
    // Serve static files from the build directory
    app.use(express.static(distPath));
    
    // Fallback all routes to index.html for Single Page Application routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
