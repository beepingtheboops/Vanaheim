export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createMagicLinkToken, logAuditEvent } from '@/lib/db';
import { sendEmail, generateMagicLinkEmail } from '@/lib/email';

const ALLOWED_EMAILS = [
  'matt@thewillsons.com',
  'noonie@thewillsons.com',
  'abbat@thewillsons.com',
  'odin@thewillsons.com',
];

export async function POST(request: NextRequest) {
  try {
    const { email, resetPasskey } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Only allow magic links for approved family members
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      // Don't reveal if user is approved or not
      return NextResponse.json(
        { success: true, message: 'If this email is registered, a magic link has been sent' },
        { status: 200 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { success: true, message: 'Magic link sent to your email' },
        { status: 200 }
      );
    }

    // Generate secure token
    const tokenValue = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await hashToken(tokenValue);

    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Store token
    await createMagicLinkToken({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Generate magic link
    // If resetPasskey=true, the user MUST confirm by clicking the link
    // Passkeys are NOT revoked until the link is clicked
    const magicLink = resetPasskey
      ? `https://thewillsons.com/auth/magic-link?token=${tokenValue}&reset=true`
      : `https://thewillsons.com/auth/magic-link?token=${tokenValue}`;

    // Send email
    const { text, html } = generateMagicLinkEmail(user.name, magicLink, resetPasskey);
    const emailSent = await sendEmail({
      to: user.email,
      subject: resetPasskey ? 'Confirm Passkey Reset - Vanaheim' : 'Sign in to Vanaheim',
      text,
      html,
    });

    if (!emailSent) {
      await logAuditEvent(user.id, 'magic_link_email_failed', null, null);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    await logAuditEvent(user.id, resetPasskey ? 'passkey_reset_requested' : 'magic_link_sent', null, null);

    return NextResponse.json(
      { success: true, message: 'Magic link sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Magic link request error:', error);
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
