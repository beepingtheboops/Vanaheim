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

// ─── In-Memory Store (replace with D1 database in production) ─
// Pre-seeded family members for demo purposes
let users: StoredUser[] = [];
let initialized = false;

export async function initUsers() {
  if (initialized) return;
  initialized = true;

  // Pre-seed demo accounts
  users = [
    {
      id: 'usr_001',
      name: 'Dad',
      email: 'dad@thewillsons.com',
      passwordHash: await hashPassword('admin123'),
      role: 'admin',
      avatar: '👨',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_002',
      name: 'Mom',
      email: 'mom@thewillsons.com',
      passwordHash: await hashPassword('admin123'),
      role: 'admin',
      avatar: '👩',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_003',
      name: 'Alex',
      email: 'alex@thewillsons.com',
      passwordHash: await hashPassword('member123'),
      role: 'member',
      avatar: '🧑',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_004',
      name: 'Emma',
      email: 'emma@thewillsons.com',
      passwordHash: await hashPassword('member123'),
      role: 'child',
      avatar: '👧',
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  await initUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  await initUsers();
  return users.find((u) => u.id === id) || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member' | 'child';
  avatar?: string;
}): Promise<StoredUser> {
  await initUsers();

  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error('Email already registered');

  const newUser: StoredUser = {
    id: `usr_${String(users.length + 1).padStart(3, '0')}`,
    name: data.name,
    email: data.email,
    passwordHash: await hashPassword(data.password),
    role: data.role,
    avatar: data.avatar || '👤',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return newUser;
}

export async function getAllUsers(): Promise<Omit<StoredUser, 'passwordHash'>[]> {
  await initUsers();
  return users.map(({ passwordHash, ...rest }) => rest);
}
