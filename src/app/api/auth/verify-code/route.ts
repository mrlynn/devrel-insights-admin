import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify-code — verify a 6-digit code
export async function POST(request: NextRequest) {
  try {
    const { email, code, source } = await request.json();
    const isMobile = source === 'mobile';

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.toString().trim();

    if (normalizedCode.length !== 6 || !/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find and consume the code in one atomic operation
    const authCode = await db.collection('auth_codes').findOneAndUpdate(
      {
        email: normalizedEmail,
        code: normalizedCode,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { returnDocument: 'before' }
    );

    if (!authCode) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Create JWT session
    const jwt = await createToken({
      email: authCode.email,
      name: authCode.userName,
      role: authCode.userRole,
      isAdmin: authCode.isAdmin === true,
      advocateId: authCode.advocateId,
    });

    // Update last access on advocate if applicable
    let advocate = null;
    if (authCode.advocateId) {
      advocate = await db.collection('advocates').findOneAndUpdate(
        { _id: authCode.advocateId },
        { $set: { lastAccessAt: new Date() } },
        { returnDocument: 'after' }
      );
    }

    // For mobile apps, return JSON with token
    if (isMobile) {
      return NextResponse.json({
        advocate: advocate || {
          _id: authCode.advocateId,
          email: authCode.email,
          name: authCode.userName,
          role: authCode.userRole,
        },
        token: jwt,
      });
    }

    // For web, set cookie and return success
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
