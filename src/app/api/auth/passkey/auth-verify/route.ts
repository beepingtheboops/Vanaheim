export const runtime = 'edge';
 
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import {
  findUserById,
  getPasskeyByCredentialId,
  getAndDeleteChallenge,
  updatePasskeyCounter,
  logAuditEvent,
} from '@/lib/db';
import { createToken, createSessionCookie } from '@/lib/auth';
 
const RP_ID = 'thewillsons.com';
const ORIGIN = 'https://thewillsons.com';
 
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
 
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
 
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
 
    const expectedChallenge = await getAndDeleteChallenge(userId, 'authentication');
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }
 
    const passkey = await getPasskeyByCredentialId(body.id);
    if (!passkey || passkey.user_id !== userId) {
      return NextResponse.json({ error: 'Passkey not found' }, { status: 404 });
    }
 
    const verifyOpts: any = {
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credential_id,
        publicKey: Buffer.from(passkey.public_key, 'base64'),
        counter: passkey.counter,
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
      requireUserVerification: true,
    };
 
    const verification = await verifyAuthenticationResponse(verifyOpts);
 
    if (!verification.verified) {
      return NextResponse.json({ error: 'Passkey verification failed' }, { status: 401 });
    }
 
    // Safely extract counter — handle all possible property names across v9/v10
    let newCounter = passkey.counter;
    try {
      const info = verification.authenticationInfo as any;
      if (info !== undefined && info !== null) {
        newCounter = info.newCounter ?? info.counter ?? info.credentialCounter ?? passkey.counter;
      }
    } catch {
      // keep existing counter if extraction fails
    }
 
    await updatePasskeyCounter(passkey.credential_id, newCounter);
    await logAuditEvent(user.id, 'passkey_login', null, null);
 
    const jwtToken = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
 
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
 
    response.headers.set('Set-Cookie', createSessionCookie(jwtToken));
    return response;
  } catch (error) {
    console.error('Passkey auth verify error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}