import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function check() {
  try {
    const pdfPath = './uploads/rsmssb-bci-unit-3-1782727227204.pdf';
    if (!fs.existsSync(pdfPath)) {
      console.log('PDF file does not exist at:', pdfPath);
      return;
    }
    const bytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    console.log('PDF loaded successfully!');
    console.log('Page count:', pdfDoc.getPageCount());
  } catch (err) {
    console.error('Error loading PDF:', err);
  }
}

check();
