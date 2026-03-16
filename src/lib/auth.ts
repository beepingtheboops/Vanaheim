export const runtime = 'edge';

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_ISSUER = 'homebase';
const JWT_EXPIRY = '7d';
const COOKIE_NAME = 'homebase_session';

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

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: 100000 }, keyMaterial, 256);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveKey(password, salt);
  return toHex(salt.buffer) + ':' + toHex(derived);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, keyHex] = hash.split(':');
  const salt = fromHex(saltHex);
  const derived = await deriveKey(password, salt);
  return toHex(derived) === keyHex;
}

function getSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function createToken(user: UserPayload): Promise<string> {
  return new SignJWT({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: JWT_ISSUER });
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

export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60;
  return COOKIE_NAME + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge;
}

export function clearSessionCookie(): string {
  return COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}

export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const regex = new RegExp(COOKIE_NAME + '=([^;]+)');
  const match = cookieHeader.match(regex);
  return match ? match[1] : null;
}
