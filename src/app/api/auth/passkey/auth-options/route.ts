export const runtime = 'edge';
 
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import {
  findUserByEmail,
  getPasskeysForUser,
  storeChallenge,
} from '@/lib/db';
 
const RP_ID = 'thewillsons.com';
 
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
 
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
 
    const user = await findUserByEmail(email);
    if (!user) {
      // Return generic options to avoid user enumeration
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'required',
        allowCredentials: [],
      });
      return NextResponse.json(options);
    }
 
    const passkeys = await getPasskeysForUser(user.id);
 
    if (passkeys.length === 0) {
      return NextResponse.json({ error: 'No passkey registered' }, { status: 404 });
    }
 
    const allowCredentials = passkeys.map(pk => ({
      id: pk.credential_id,
      type: 'public-key' as const,
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    }));
 
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'required',
      allowCredentials,
    });
 
    // Store challenge
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await storeChallenge({
      id: crypto.randomUUID(),
      userId: user.id,
      challenge: options.challenge,
      type: 'authentication',
      expiresAt,
    });
 
    return NextResponse.json({ ...options, userId: user.id });
  } catch (error) {
    console.error('Passkey auth options error:', error);
    return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 });
  }
}