export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createToken, createSessionCookie } from '@/lib/auth';
import { findUserByEmail, logAuditEvent, isAccountLocked, recordFailedLogin, clearFailedAttempts } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Turnstile verification temporarily disabled
    // TODO: Re-enable once environment variable access is resolved

    // Check account lockout
    const locked = await isAccountLocked(email);
    if (locked) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Successful login — clear any failed attempts
    await clearFailedAttempts(email);

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });

    await logAuditEvent(user.id, 'login_success', null, null);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}