import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NOTES_LIST } from './src/data';
import { NotesUnit } from './src/types';
import AdmZip from 'adm-zip';

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
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_T6hjycCqpGUq5P';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || '8Oi9PqF2Y81b7qE0SFBMvrox';
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

      const keySecret = process.env.RAZORPAY_KEY_SECRET || '8Oi9PqF2Y81b7qE0SFBMvrox';
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

  // Get notes list
  app.get('/api/notes', (req, res) => {
    res.json(loadNotes());
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
