import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { decrypt } from 'officecrypto-tool';
import { parseExcelStatementNode } from '../excelParser';

// Setup multer to parse file uploads into memory buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

export const statementRouter = Router();

async function processStatementBuffer(
  buffer: Buffer,
  password: string,
  res: Response
) {
  try {
    let decryptedBuffer = buffer;

    // Try decrypting if a password was provided
    if (password) {
      try {
        decryptedBuffer = await decrypt(buffer, { password });
      } catch (e: any) {
        // officecrypto-tool throws if decryption fails (e.g. wrong password)
        return res.status(400).json({
          error: 'WRONG_PASSWORD',
          message: 'Password incorrect for this bank statement.',
        });
      }
    }

    // Parse the (decrypted) Excel buffer
    const parsed = parseExcelStatementNode(decryptedBuffer);

    if (parsed.errors && parsed.errors[0] === 'WRONG_PASSWORD') {
      // xlsx throws this if it encounters an encrypted file and we didn't decrypt it
      // This means the file was encrypted but either no password was provided or password failed
      return res.status(400).json({
        error: 'WRONG_PASSWORD',
        message: 'Password required or incorrect for this encrypted statement.',
      });
    }

    // Successfully parsed
    return res.json(parsed);
  } catch (e: any) {
    console.error('Error parsing statement:', e);
    return res.status(500).json({
      error: 'PARSE_FAILED',
      message: e.message || 'Failed to parse statement',
    });
  }
}

// 1. Multipart or JSON /api/parse-statement
statementRouter.post(
  '/parse-statement',
  (req: Request, res: Response, next: NextFunction) => {
    // If request is JSON, don't run multer
    if (req.is('application/json')) {
      return next();
    }
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: 'FILE_UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    let buffer: Buffer | undefined;

    if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body?.fileBase64) {
      try {
        buffer = Buffer.from(req.body.fileBase64, 'base64');
      } catch {
        return res.status(400).json({ error: 'INVALID_BASE64', message: 'Could not decode fileBase64' });
      }
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No file provided in request' });
    }

    const password =
      req.body?.password ||
      (req.headers['x-excel-password'] as string) ||
      '';

    return processStatementBuffer(buffer, password, res);
  }
);

// 2. Explicit JSON base64 endpoint /api/parse-statement-base64
statementRouter.post('/parse-statement-base64', async (req: Request, res: Response) => {
  const { fileBase64, password: pwd } = req.body ?? {};

  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return res.status(400).json({ error: 'NO_FILE', message: 'fileBase64 string is required' });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileBase64, 'base64');
  } catch {
    return res.status(400).json({ error: 'INVALID_BASE64', message: 'Could not decode fileBase64' });
  }

  const password = pwd || (req.headers['x-excel-password'] as string) || '';
  return processStatementBuffer(buffer, password, res);
});
