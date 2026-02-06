import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb } from './mongodb';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'devrel-insights-secret-change-me'
);
export const COOKIE_NAME = 'di-session';
const EXPIRY = '7d';

// ============================================================================
// JWT HELPERS
// ============================================================================

export interface TokenPayload {
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  advocateId?: string | null;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// SESSION HELPERS
// ============================================================================

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function createUser(email: string, password: string, name?: string) {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase();
  
  const existing = await db.collection('users').findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('User already exists');
  }

  // Check if this email matches an advocate
  const advocate = await db.collection('advocates').findOne({
    email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });

  const hash = await bcrypt.hash(password, 12);
  const user = {
    email: normalizedEmail,
    name: name || email.split('@')[0],
    password: hash,
    role: advocate ? 'advocate' : 'user',
    isAdmin: advocate?.isAdmin === true,
    advocateId: advocate?._id || null,
    createdAt: new Date(),
  };

  await db.collection('users').insertOne(user);
  return { email: user.email, name: user.name, role: user.role, isAdmin: user.isAdmin };
}

export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return { 
    email: user.email, 
    name: user.name, 
    role: user.role,
    isAdmin: user.isAdmin === true,
    advocateId: user.advocateId,
  };
}

// ============================================================================
// ADMIN HELPERS
// ============================================================================

export async function getSessionUser(): Promise<TokenPayload | null> {
  return getSession();
}

export { SECRET };
