import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// ─── Configuration ───────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_ISSUER = 'homebase';
const JWT_EXPIRY = '7d';
const COOKIE_NAME = 'homebase_session';

// ─── Types ───────────────────────────────────────────────────
export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'child';
  avatar?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserPayload;
  error?: string;
}

// ─── Password Helpers ────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Helpers ─────────────────────────────────────────────
function getSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function createToken(user: UserPayload): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
    });
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'member' | 'child',
      avatar: payload.avatar as string | undefined,
    };
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ──────────────────────────────────────────
export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
