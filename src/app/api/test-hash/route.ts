export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const hash = await hashPassword(password);
  return NextResponse.json({ hash });
}