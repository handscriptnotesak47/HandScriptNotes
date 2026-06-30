import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const dbPath = './notes_db.json';
const uploadsDir = './uploads';

async function generatePreviews() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.error('notes_db.json not found!');
      return;
    }

    const notesData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log('Loaded notes database. Scanning for PDFs...');

    for (const unit of notesData) {
      if (!unit.pdfUrl) {
        console.log(`Unit ${unit.id} has no PDF configured.`);
        continue;
      }

      const fileName = path.basename(unit.pdfUrl);
      const fullPdfPath = path.join(uploadsDir, fileName);

      if (!fs.existsSync(fullPdfPath)) {
        console.log(`❌ Full PDF file for ${unit.id} not found at ${fullPdfPath}`);
        continue;
      }

      console.log(`\nProcessing ${unit.id}:`);
      console.log(` - Full PDF path: ${fullPdfPath}`);

      const bytes = fs.readFileSync(fullPdfPath);
      const pdfDoc = await PDFDocument.load(bytes);
      const totalPages = pdfDoc.getPageCount();
      console.log(` - Total pages: ${totalPages}`);

      // Slice first 4 pages
      const subPdfDoc = await PDFDocument.create();
      const pagesToCopy = Math.min(4, totalPages);
      const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => i);
      
      const copiedPages = await subPdfDoc.copyPages(pdfDoc, pageIndices);
      for (const page of copiedPages) {
        subPdfDoc.addPage(page);
      }

      const pdfBytesOut = await subPdfDoc.save();
      const previewFileName = `${unit.id}-preview.pdf`;
      const previewFilePath = path.join(uploadsDir, previewFileName);

      fs.writeFileSync(previewFilePath, pdfBytesOut);
      console.log(` - ✅ Saved preview file: ${previewFilePath} (${pdfBytesOut.length} bytes)`);
    }

    console.log('\n✅ All previews generated successfully!');
  } catch (error) {
    console.error('Error generating previews:', error);
  }
}

generatePreviews();
