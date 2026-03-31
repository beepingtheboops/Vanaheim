export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, getPasskeysForUser } from '@/lib/db';

const ALLOWED_EMAILS = [
  'mattwillson@outlook.com',
  'laurentalbott90@gmail.com',
  'sbkwillson@hotmail.com',
  'odinwillson@gmail.com',
];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { hasPasskey: false, sendMagicLink: false },
        { status: 200 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { hasPasskey: false, sendMagicLink: false },
        { status: 200 }
      );
    }

    const passkeys = await getPasskeysForUser(user.id);
    const hasPasskey = passkeys.length > 0;

    return NextResponse.json({
      hasPasskey,
      sendMagicLink: !hasPasskey,
      userId: user.id,
      userName: user.name,
    });
  } catch (error) {
    console.error('Check passkey error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
