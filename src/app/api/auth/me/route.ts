export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookies(cookieHeader);

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
