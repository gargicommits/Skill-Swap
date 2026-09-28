import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { findUserById, getDb, sanitizeUser, UserRecord } from './db.js';
import { SafeUser, UserRole } from '../src/types/index.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'skillswap_buddy_secure_secret_2026_key';

// Token generation: base64(userId:timestamp:signature)
export function generateToken(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestampStr, signature] = decoded.split(':');
    if (!userId || !timestampStr || !signature) return null;

    const payload = `${userId}:${timestampStr}`;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSig) return null;

    // Check expiration: 7 days
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) return null;

    return userId;
  } catch {
    return null;
  }
}

// Generate a secure short-lived token once mobile OTP is verified
export function generateVerificationToken(erp: string, mobileNumber: string, purpose: string): string {
  const timestamp = Date.now();
  const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '');
  const payload = `${erp.trim().toUpperCase()}:${cleanMobile}:${purpose}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyVerificationToken(
  token: string,
  expectedErp: string,
  expectedMobile: string,
  expectedPurpose: string
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [erp, mobile, purpose, timestampStr, signature] = decoded.split(':');
    if (!erp || !mobile || !purpose || !timestampStr || !signature) return false;

    if (erp !== expectedErp.trim().toUpperCase()) return false;
    if (mobile !== expectedMobile.replace(/[\s\-\+]/g, '')) return false;
    if (purpose !== expectedPurpose) return false;

    const payload = `${erp}:${mobile}:${purpose}:${timestampStr}`;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');
    if (signature !== expectedSig) return false;

    // Must be used within 15 minutes
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 15 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

// In-memory rate limiter for login and sensitive actions
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

// Request extension interface
export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  safeUser?: SafeUser;
}

// Authentication Middleware
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }

  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({
      error: 'Your account has been suspended by college administration. Contact the admin desk.',
    });
    return;
  }

  req.user = user;
  req.safeUser = sanitizeUser(user, true);
  next();
}

// Optional Auth (for public listings that enhance when logged in)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (userId) {
      const user = findUserById(userId);
      if (user && !user.isSuspended) {
        req.user = user;
        req.safeUser = sanitizeUser(user, true);
      }
    }
  }
  next();
}

// Require specific role(s)
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] roles.`,
      });
      return;
    }
    next();
  };
}

// Strict Approved Senior check: user must be SENIOR and APPROVED
export function requireApprovedSenior(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'SENIOR' && req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access restricted to Senior Mentors.' });
    return;
  }

  if (req.user.role === 'SENIOR' && req.user.verificationStatus !== 'APPROVED') {
    res.status(403).json({
      error:
        'Your Senior Mentor application is currently ' +
        req.user.verificationStatus +
        '. Teaching and live session features are accessible only after admin approval.',
    });
    return;
  }

  next();
}

// Strict Admin check: user must be ADMIN and in authorized admins list
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Unauthorized. Admin privileges required.' });
    return;
  }

  const AUTHORIZED_ADMIN_ERPS = ['SCOA09', 'SCOA11', 'SCOA20', 'SCOA21'];
  if (!AUTHORIZED_ADMIN_ERPS.includes(req.user.erp.toUpperCase())) {
    res.status(403).json({ error: 'Unauthorized: ERP not in the authorized administration registry.' });
    return;
  }

  next();
}
