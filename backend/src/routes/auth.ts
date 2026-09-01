import { Router } from 'express';
import { issueToken, registerUser, verifyCredentials } from '../auth';
import { migrateLegacyJson } from '../db';

export const authRouter = Router();

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: unknown, password: unknown): string | null {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

authRouter.post('/auth/register', (req, res) => {
  const { email, password } = req.body ?? {};
  const problem = validate(email, password);
  if (problem) return res.status(400).json({ error: problem });

  try {
    const user = registerUser(email, password);
    // The first account adopts the pre-auth demo history so the baseline
    // starts out trained rather than empty.
    const imported = migrateLegacyJson(user.id);
    res.json({ token: issueToken(user.id), user, importedTransactions: imported });
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : 'Could not create account' });
  }
});

authRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = verifyCredentials(email, password);
  // Same message for unknown-email and wrong-password: distinguishing them
  // tells an attacker which emails have accounts.
  if (!user) return res.status(401).json({ error: 'Email or password is incorrect' });

  res.json({ token: issueToken(user.id), user });
});
