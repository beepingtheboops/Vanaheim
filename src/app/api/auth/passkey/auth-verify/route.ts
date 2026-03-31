export const runtime = 'edge';
 
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
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
 
    console.log('passkey found:', JSON.stringify({
      id: passkey.id,
      credential_id: passkey.credential_id,
      counter: passkey.counter,
      device_type: passkey.device_type,
      transports: passkey.transports,
      public_key_length: passkey.public_key?.length,
    }));
 
    const publicKeyBuffer = isoBase64URL.toBuffer(passkey.public_key);
    console.log('public key buffer length:', publicKeyBuffer.length);
 
    const verifyOpts: any = {
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(passkey.credential_id),
        credentialPublicKey: new Uint8Array(publicKeyBuffer),
        counter: passkey.counter ?? 0,
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
      requireUserVerification: true,
    };
 
    console.log('calling verifyAuthenticationResponse...');
    const verification = await verifyAuthenticationResponse(verifyOpts);
    console.log('verification result:', verification.verified);
 
    if (!verification.verified) {
      return NextResponse.json({ error: 'Passkey verification failed' }, { status: 401 });
    }
 
    const newCounter = (passkey.counter ?? 0) + 1;
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
  } catch (error: any) {
    console.error('Passkey auth verify error:', error?.message, error?.stack);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}