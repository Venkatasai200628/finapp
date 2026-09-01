import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { createUser, findUserByEmail, findUserById, User } from './db';

/**
 * In production this MUST come from the environment. Falling back to a random
 * per-boot secret is deliberate: it invalidates all tokens on restart, which
 * is annoying in dev but far safer than shipping a hardcoded default that
 * ends up in the repo and lets anyone forge tokens.
 */
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL = '30d';

export const usingEphemeralSecret = !process.env.JWT_SECRET;

export type AuthedRequest = Request & { userId?: string };

function hashPassword(password: string, salt: string): string {
  // scrypt is memory-hard and built into Node — no native bcrypt to compile.
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function registerUser(email: string, password: string): { id: string; email: string } {
  const normalized = email.trim().toLowerCase();
  if (findUserByEmail(normalized)) {
    throw new Error('An account with that email already exists');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const user: User = {
    id: `usr-${crypto.randomBytes(9).toString('hex')}`,
    email: normalized,
    password_hash: hashPassword(password, salt),
    password_salt: salt,
    created_at: Date.now(),
  };
  createUser(user);
  return { id: user.id, email: user.email };
}

export function verifyCredentials(email: string, password: string): { id: string; email: string } | null {
  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user) return null;

  const candidate = hashPassword(password, user.password_salt);
  // Constant-time compare so response timing can't be used to probe passwords.
  const matches =
    candidate.length === user.password_hash.length &&
    crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(user.password_hash));

  return matches ? { id: user.id, email: user.email } : null;
}

export function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function userIdFromToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    if (!payload.sub || !findUserById(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = token ? userIdFromToken(token) : null;

  if (!userId) {
    return res.status(401).json({ error: 'Sign in to continue' });
  }

  req.userId = userId;
  next();
}
