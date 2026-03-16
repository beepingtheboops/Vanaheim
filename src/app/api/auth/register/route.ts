export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies, hashPassword } from '@/lib/auth';
import { findUserByEmail, createUser, logAuditEvent } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentUser = await verifyToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create accounts' },
        { status: 403 }
      );
    }

    const { name, email, password, role, avatar } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const id = `usr_${Date.now().toString(36)}`;
    const passwordHash = await hashPassword(password);

    const newUser = await createUser({
      id,
      name,
      email,
      passwordHash,
      role,
      avatar: avatar || 'dad',
    });

    await logAuditEvent(currentUser.id, 'user_created', newUser.id, `Created user ${name}`);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
