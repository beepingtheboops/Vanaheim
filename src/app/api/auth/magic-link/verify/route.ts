export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, findUserById, logAuditEvent, revokeAllPasskeys } from '@/lib/db';
import { createToken, createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, isReset } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the token to match what's in the database
    const tokenHash = await hashToken(token);

    // Verify token and get user ID
    const userId = await verifyMagicLinkToken(tokenHash);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // IMPORTANT: Only revoke passkeys if this is a confirmed reset request
    // This prevents malicious actors from locking out users
    if (isReset) {
      await revokeAllPasskeys(user.id);
      await logAuditEvent(user.id, 'passkeys_revoked', null, 'User confirmed reset via magic link');
    }

    // Create session
    const jwtToken = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });

    await logAuditEvent(user.id, isReset ? 'passkey_reset_login' : 'magic_link_login', null, null);

    const response = NextResponse.json({
      success: true,
      shouldSetupPasskey: true, // Always prompt for passkey setup after magic link login
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    response.headers.set('Set-Cookie', createSessionCookie(jwtToken));
    return response;
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
