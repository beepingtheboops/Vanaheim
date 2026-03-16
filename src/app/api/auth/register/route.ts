import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { createUser } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    // Only admins can create new accounts
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

    const newUser = await createUser({ name, email, password, role, avatar });

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
