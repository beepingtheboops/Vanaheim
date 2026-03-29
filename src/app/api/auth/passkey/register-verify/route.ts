export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import {
  findUserById,
  getAndDeleteChallenge,
  createPasskey,
  invalidatePassword,
  logAuditEvent,
  PASSKEY_APPROVED_EMAILS,
} from '@/lib/db';

const RP_ID = 'thewillsons.com';
const ORIGIN = 'https://thewillsons.com';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userPayload = await verifyToken(token);
    if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!PASSKEY_APPROVED_EMAILS.includes(userPayload.email)) {
      return NextResponse.json({ error: 'Not authorized for passkey registration' }, { status: 403 });
    }

    const user = await findUserById(userPayload.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();

    const expectedChallenge = await getAndDeleteChallenge(user.id, 'registration');
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const transports = Array.isArray(body?.response?.transports)
      ? body.response.transports
      : [];

    const normalizedBody = {
      ...body,
      response: {
        ...body.response,
        transports,
      },
    };

    const verification = await verifyRegistrationResponse({
      response: normalizedBody,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Passkey verification failed' }, { status: 400 });
    }

    const info = verification.registrationInfo as any;
    const credentialId = info.credential?.id ?? info.credentialID;
    const credentialPublicKey = info.credential?.publicKey ?? info.credentialPublicKey;
    const credentialCounter = info.credential?.counter ?? info.counter ?? 0;
    const credentialDeviceType = info.credentialDeviceType ?? info.credential?.deviceType ?? null;
    const credentialBackedUp = info.credentialBackedUp ?? info.credential?.backedUp ?? false;

    // Store public key using isoBase64URL for consistent encoding/decoding
    const publicKeyBase64 = isoBase64URL.fromBuffer(credentialPublicKey);

    console.log('Storing passkey, public key length:', credentialPublicKey.length, 'base64 length:', publicKeyBase64.length);

    await createPasskey({
      id: crypto.randomUUID(),
      userId: user.id,
      credentialId,
      publicKey: publicKeyBase64,
      counter: credentialCounter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: transports.length > 0 ? JSON.stringify(transports) : null,
    });

    await invalidatePassword(user.id);
    await logAuditEvent(user.id, 'passkey_registered', null, `Device type: ${credentialDeviceType}`);

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('Passkey register verify error:', error?.message);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
