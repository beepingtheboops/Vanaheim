import { getRequestContext } from '@cloudflare/next-on-pages';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'member' | 'child';
  avatar: string;
  created_at: string;
}

function getDB() {
  const { env } = getRequestContext();
  return (env as any).DB;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  return result || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return result || null;
}

export async function createUser(data: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member' | 'child';
  avatar: string;
}): Promise<StoredUser> {
  const db = getDB();
  await db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.id, data.name, data.email, data.passwordHash, data.role, data.avatar).run();
  const user = await findUserById(data.id);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function getAllUsers(): Promise<Omit<StoredUser, 'password_hash'>[]> {
  const db = getDB();
  const { results } = await db.prepare('SELECT id, name, email, role, avatar, created_at FROM users').all();
  return results as Omit<StoredUser, 'password_hash'>[];
}

export async function logAuditEvent(userId: string | null, action: string, target: string | null, details: string | null) {
  try {
    const db = getDB();
    await db.prepare(
      'INSERT INTO audit_log (user_id, action, target, details) VALUES (?, ?, ?, ?)'
    ).bind(userId, action, target, details).run();
  } catch {
    // Don't let audit logging failures break the app
  }
}

// ─── Account Lockout ─────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function getFailedAttempts(email: string): Promise<number> {
  try {
    const db = getDB();
    const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    const result = await db.prepare(
      "SELECT COUNT(*) as count FROM audit_log WHERE target = ? AND action = 'login_failed' AND created_at > ?"
    ).bind(email, cutoff).first();
    return result?.count || 0;
  } catch {
    return 0;
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const attempts = await getFailedAttempts(email);
  return attempts >= MAX_ATTEMPTS;
}

export async function recordFailedLogin(email: string) {
  await logAuditEvent(null, 'login_failed', email, 'Invalid password');
}

export async function clearFailedAttempts(email: string) {
  try {
    const db = getDB();
    await db.prepare(
      "DELETE FROM audit_log WHERE target = ? AND action = 'login_failed'"
    ).bind(email).run();
  } catch {
    // non-critical
  }
}
