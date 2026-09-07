import { Router } from 'express';
import multer from 'multer';
import { decrypt } from 'officecrypto-tool';
import { parseExcelStatementNode } from '../excelParser';
import { requireAuth } from '../auth';

// Setup multer to parse file uploads into memory buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export const statementRouter = Router();

statementRouter.post('/parse-statement', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const password = req.body.password || '';
    let buffer = req.file.buffer;

    // Try decrypting if a password was provided
    if (password) {
      try {
        buffer = await decrypt(buffer, { password });
      } catch (e: any) {
        // officecrypto-tool throws if decryption fails (e.g. wrong password)
        return res.status(400).json({ error: 'WRONG_PASSWORD' });
      }
    }

    // Now parse the (hopefully decrypted) buffer
    const parsed = parseExcelStatementNode(buffer);

    if (parsed.errors[0] === 'WRONG_PASSWORD') {
      // xlsx throws this if it encounters an encrypted file and we didn't decrypt it
      // This means the file was encrypted but no password was provided
      return res.status(400).json({ error: 'WRONG_PASSWORD' });
    }

    // Successfully parsed
    res.json(parsed);
  } catch (e: any) {
    console.error('Error parsing statement:', e);
    res.status(500).json({ error: e.message || 'Failed to parse statement' });
  }
});
