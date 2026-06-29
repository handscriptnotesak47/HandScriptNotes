import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NOTES_LIST } from './src/data';
import { NotesUnit } from './src/types';
import AdmZip from 'adm-zip';
import { PDFDocument } from 'pdf-lib';

async function startServer() {
  const app = express();
  // Hostinger typically injects PORT, fallback to 3000 for AI Studio environment
  const PORT = process.env.PORT || 3000;

  // JSON and URL-encoded parsers for any API requests with larger payload limit for base64 PDFs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Path for storing our persistent data
  const DB_PATH = path.join(process.cwd(), 'notes_db.json');
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Helper functions for loading and saving notes data
  function loadNotes(): NotesUnit[] {
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

  function saveNotes(notes: NotesUnit[]) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(notes, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write to notes_db.json:', e);
    }
  }

  const QUERIES_DB_PATH = path.join(process.cwd(), 'queries_db.json');

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
      
      const imagesDir = path.join(process.cwd(), 'src', 'assets', 'images');
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
  const ADMIN_CONFIG_PATH = path.join(process.cwd(), 'admin_config.json');

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
  app.get('/api/notes', (req, res) => {
    res.json(loadNotes());
  });

  // GET /api/pdf-preview/:unitId - Dynamically extracts starting 4 pages of any uploaded PDF securely
  app.get('/api/pdf-preview/:unitId', async (req, res) => {
    const { unitId } = req.params;
    const currentNotes = loadNotes();
    const unit = currentNotes.find(u => u.id === unitId);
    
    if (!unit || !unit.pdfUrl) {
      return res.status(404).send('PDF not found for this unit');
    }

    try {
      const relativePath = unit.pdfUrl.startsWith('/') ? unit.pdfUrl.slice(1) : unit.pdfUrl;
      const filePath = path.join(process.cwd(), relativePath);

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
  app.post('/api/notes/update-price', (req, res) => {
    const { unitId, price } = req.body;
    const currentNotes = loadNotes();
    const updated = currentNotes.map(unit => 
      unit.id === unitId ? { ...unit, price: Number(price) } : unit
    );
    saveNotes(updated);
    res.json({ success: true, notes: updated });
  });

  // Save/Upload note PDF
  app.post('/api/notes/update-pdf', (req, res) => {
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

      const publicUrl = `/uploads/${safeFileName}`;

      const currentNotes = loadNotes();
      const updated = currentNotes.map(unit => 
        unit.id === unitId ? { ...unit, pdfUrl: publicUrl, pdfName: pdfName || 'Uploaded.pdf' } : unit
      );
      saveNotes(updated);

      res.json({ success: true, pdfUrl: publicUrl, pdfName: pdfName || 'Uploaded.pdf', notes: updated });
    } catch (err: any) {
      console.error('Error saving PDF file:', err);
      res.status(500).json({ error: 'Failed to save PDF on server' });
    }
  });

  // Add new unit
  app.post('/api/notes/add-unit', (req, res) => {
    const { unit } = req.body;
    const currentNotes = loadNotes();
    const updated = [...currentNotes, unit];
    saveNotes(updated);
    res.json({ success: true, notes: updated });
  });

  // Remove unit
  app.post('/api/notes/remove-unit', (req, res) => {
    const { unitId } = req.body;
    const currentNotes = loadNotes();
    const updated = currentNotes.filter(unit => unit.id !== unitId);
    saveNotes(updated);
    res.json({ success: true, notes: updated });
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

  // Serve uploads directory publicly
  app.use('/uploads', express.static(UPLOADS_DIR));

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
    const distPath = path.join(process.cwd(), 'dist');
    
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
