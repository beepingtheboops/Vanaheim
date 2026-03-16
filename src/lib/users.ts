import { hashPassword } from './auth';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member' | 'child';
  avatar: string;
  createdAt: string;
}

// ─── Pre-computed password hashes (PBKDF2-SHA256, 100k iterations) ──
// These are deterministic — same salt + password = same hash every time.
// admin123 password hash:
const ADMIN_HASH = 'd07d4f95e0629139d65ed789d89dd7d7:e281ff4a0f5bb6a7059e1ae64554f5d729a6ac04eef11b8e0f6d38d59a9072aa';
// member123 password hash:
const MEMBER_HASH = '4e0188dc9dcdf46d6315c396688f6b04:8a1a2b678d7dd2dde82cd6ed16c2f0412a4c1a71015e057a0ece18a518e6e7a0';

// ─── Pre-seeded family members ──────────────────────────────────
const users: StoredUser[] = [
  {
    id: 'usr_001',
    name: 'Dad',
    email: 'dad@thewillsons.com',
    passwordHash: ADMIN_HASH,
    role: 'admin',
    avatar: 'dad',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_002',
    name: 'Noonie',
    email: 'mom@thewillsons.com',
    passwordHash: ADMIN_HASH,
    role: 'admin',
    avatar: 'noonie',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_003',
    name: 'Abbat',
    email: 'alex@thewillsons.com',
    passwordHash: MEMBER_HASH,
    role: 'member',
    avatar: 'abbat',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_004',
    name: 'Odin',
    email: 'emma@thewillsons.com',
    passwordHash: MEMBER_HASH,
    role: 'child',
    avatar: 'odin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  return users.find((u) => u.id === id) || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member' | 'child';
  avatar?: string;
}): Promise<StoredUser> {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error('Email already registered');

  const newUser: StoredUser = {
    id: `usr_${String(users.length + 1).padStart(3, '0')}`,
    name: data.name,
    email: data.email,
    passwordHash: await hashPassword(data.password),
    role: data.role,
    avatar: data.avatar || 'dad',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return newUser;
}

export async function getAllUsers(): Promise<Omit<StoredUser, 'passwordHash'>[]> {
  return users.map(({ passwordHash, ...rest }) => rest);
}
