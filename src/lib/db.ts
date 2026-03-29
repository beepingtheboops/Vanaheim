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

export interface StoredPasskey {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: string | null;
  backed_up: number;
  transports: string | null;
  created_at: string;
  last_used_at: string | null;
}

function getDB() {
  const { env } = getRequestContext();
  return (env as any).DB;
}

// ─── Users ────────────────────────────────────────────────────

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

// Invalidate password after passkey registration — replaces hash with sentinel value
export async function invalidatePassword(userId: string): Promise<void> {
  const db = getDB();
  await db.prepare(
    "UPDATE users SET password_hash = 'PASSKEY_ONLY', updated_at = datetime('now') WHERE id = ?"
  ).bind(userId).run();
}

export async function isPasswordInvalidated(user: StoredUser): Promise<boolean> {
  return user.password_hash === 'PASSKEY_ONLY';
}

// ─── Passkeys ─────────────────────────────────────────────────

// Approved users who can register passkeys
export const PASSKEY_APPROVED_EMAILS = [
  'matt@thewillsons.com',
  'noonie@thewillsons.com',
  'odin@thewillsons.com',
  'abbat@thewillsons.com',
];

export async function getPasskeysForUser(userId: string): Promise<StoredPasskey[]> {
  const db = getDB();
  const { results } = await db.prepare(
    'SELECT * FROM passkeys WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();
  return results as StoredPasskey[];
}

export async function getPasskeyByCredentialId(credentialId: string): Promise<StoredPasskey | null> {
  const db = getDB();
  const result = await db.prepare(
    'SELECT * FROM passkeys WHERE credential_id = ?'
  ).bind(credentialId).first();
  return result || null;
}

export async function createPasskey(data: {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: string | null;
  backedUp: boolean;
  transports: string | null;
}): Promise<void> {
  const db = getDB();
  await db.prepare(
    `INSERT INTO passkeys
      (id, user_id, credential_id, public_key, counter, device_type, backed_up, transports)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.id,
    data.userId,
    data.credentialId,
    data.publicKey,
    data.counter,
    data.deviceType,
    data.backedUp ? 1 : 0,
    data.transports,
  ).run();
}

export async function updatePasskeyCounter(credentialId: string, counter: number): Promise<void> {
  const db = getDB();
  await db.prepare(
    "UPDATE passkeys SET counter = ?, last_used_at = datetime('now') WHERE credential_id = ?"
  ).bind(counter, credentialId).run();
}

export async function deletePasskey(id: string, userId: string): Promise<void> {
  const db = getDB();
  await db.prepare('DELETE FROM passkeys WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function hasPasskey(userId: string): Promise<boolean> {
  const db = getDB();
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM passkeys WHERE user_id = ?'
  ).bind(userId).first();
  return (result?.count as number) > 0;
}

// ─── WebAuthn Challenges ──────────────────────────────────────

export async function storeChallenge(data: {
  id: string;
  userId: string;
  challenge: string;
  type: 'registration' | 'authentication';
  expiresAt: string;
}): Promise<void> {
  const db = getDB();
  // Clean up expired challenges first
  await db.prepare(
    "DELETE FROM webauthn_challenges WHERE (user_id = ? AND type = ?) OR expires_at < datetime('now')"
  ).bind(data.userId, data.type).run();
  await db.prepare(
    'INSERT INTO webauthn_challenges (id, user_id, challenge, type, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.id, data.userId, data.challenge, data.type, data.expiresAt).run();
}

export async function getAndDeleteChallenge(
  userId: string,
  type: 'registration' | 'authentication'
): Promise<string | null> {
  const db = getDB();
  const result = await db.prepare(
    "SELECT * FROM webauthn_challenges WHERE user_id = ? AND type = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).bind(userId, type).first();
  if (!result) return null;
  await db.prepare('DELETE FROM webauthn_challenges WHERE id = ?').bind(result.id).run();
  return result.challenge as string;
}

// ─── Password Reset Tokens ────────────────────────────────────

export async function createPasswordResetToken(data: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}): Promise<void> {
  const db = getDB();
  // Invalidate any existing tokens for this user
  await db.prepare(
    "DELETE FROM password_reset_tokens WHERE user_id = ?"
  ).bind(data.userId).run();
  await db.prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(data.id, data.userId, data.tokenHash, data.expiresAt).run();
}

export async function getPasswordResetToken(tokenHash: string): Promise<{
  id: string;
  user_id: string;
  expires_at: string;
  used: number;
} | null> {
  const db = getDB();
  const result = await db.prepare(
    "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
  return result || null;
}

export async function markResetTokenUsed(id: string): Promise<void> {
  const db = getDB();
  await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').bind(id).run();
}

// ─── Audit Log ────────────────────────────────────────────────

export async function logAuditEvent(
  userId: string | null,
  action: string,
  target: string | null,
  details: string | null
) {
  try {
    const db = getDB();
    await db.prepare(
      'INSERT INTO audit_log (user_id, action, target, details) VALUES (?, ?, ?, ?)'
    ).bind(userId, action, target, details).run();
  } catch {
    // Don't let audit logging failures break the app
  }
}

// ─── Account Lockout ──────────────────────────────────────────

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
