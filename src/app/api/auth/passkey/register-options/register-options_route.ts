export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import {
  findUserById,
  getPasskeysForUser,
  storeChallenge,
  PASSKEY_APPROVED_EMAILS,
} from '@/lib/db';

const RP_NAME = 'Vanaheim';
const RP_ID = 'thewillsons.com';

export async function POST(request: NextRequest) {
  try {
    // Must be authenticated
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userPayload = await verifyToken(token);
    if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only approved users can register passkeys
    if (!PASSKEY_APPROVED_EMAILS.includes(userPayload.email)) {
      return NextResponse.json({ error: 'Not authorized for passkey registration' }, { status: 403 });
    }

    const user = await findUserById(userPayload.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get existing passkeys to exclude
    const existingPasskeys = await getPasskeysForUser(user.id);
    const excludeCredentials = existingPasskeys.map(pk => ({
      id: pk.credential_id,
      type: 'public-key' as const,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform', // prefer built-in biometrics
      },
    });

    // Store challenge with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await storeChallenge({
      id: crypto.randomUUID(),
      userId: user.id,
      challenge: options.challenge,
      type: 'registration',
      expiresAt,
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey register options error:', error);
    return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
  }
}
