import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

// This route exists solely to expose IP-based rate limit info before signIn() is called.
// The actual rate limiting inside NextAuth uses the ipKey credential field.
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const rateCheck = checkRateLimit(`login:${ip}`);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil(rateCheck.resetIn / 60000)} minutes.` },
      { status: 429 }
    );
  }

  return NextResponse.json({ ipKey: ip });
}
