export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { getPasskeysForUser, findUserById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Must be authenticated
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPayload = await verifyToken(token);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findUserById(userPayload.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get passkeys for the user
    const passkeys = await getPasskeysForUser(user.id);

    // Format passkeys for response
    const formattedPasskeys = passkeys.map(pk => ({
      id: pk.credential_id,
      device_type: pk.device_type,
      created_at: pk.created_at,
      last_used_at: pk.last_used_at,
      backed_up: pk.backed_up,
    }));

    return NextResponse.json({ passkeys: formattedPasskeys });
  } catch (error) {
    console.error('List passkeys error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

