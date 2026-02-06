import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

// POST /api/auth/magic-link — request a magic link email
export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl, source } = await request.json();
    const isMobile = source === 'mobile';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Only allow @mongodb.com emails
    const domain = normalizedEmail.split('@')[1];
    if (domain !== 'mongodb.com') {
      return NextResponse.json(
        { error: 'Only @mongodb.com emails are allowed' },
        { status: 403 }
      );
    }

    const db = await getDb();

    // Check advocates first (primary users), then users collection
    const advocate = await db.collection('advocates').findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    const user = !advocate
      ? await db.collection('users').findOne({ email: normalizedEmail })
      : null;

    // Always return success (don't reveal if email exists)
    if (!advocate && !user) {
      console.log('[Auth] Email not found:', normalizedEmail);
      return NextResponse.json({ sent: true });
    }

    // Generate a short-lived, single-use token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.collection('magic_links').insertOne({
      token,
      email: normalizedEmail,
      advocateId: advocate?._id || null,
      userName: advocate?.name || user?.name || normalizedEmail.split('@')[0],
      userRole: advocate ? 'advocate' : (user?.role || 'user'),
      isAdmin: advocate?.isAdmin === true || user?.isAdmin === true,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    } as any);

    // Create TTL index if it doesn't exist
    await db.collection('magic_links').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    ).catch(() => {});

    // Build the magic link URL
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${proto}://${host}`;
    
    // For mobile, append source=mobile to the API URL
    const magicUrl = isMobile 
      ? `${baseUrl}/api/auth/magic-link/${token}?source=mobile`
      : `${baseUrl}/api/auth/magic-link/${token}`;
    
    const firstName = (advocate?.name || user?.name || '').split(' ')[0] || 'there';
    const appName = isMobile ? 'DevRel Insights Mobile' : 'DevRel Insights Admin';

    // Send the email
    await sendMail({
      to: normalizedEmail,
      subject: `Your login link for ${appName}`,
      html: `
        <p>Hi ${firstName},</p>
        <p>Click here to sign in to ${appName}:</p>
        <p><a href="${magicUrl}" style="display:inline-block;padding:12px 24px;background:#00ED64;color:#001E2B;text-decoration:none;border-radius:8px;font-weight:600;">Sign In</a></p>
        <p>Or copy this link:</p>
        <p><a href="${magicUrl}">${magicUrl}</a></p>
        <p>This link expires in 15 minutes.</p>
        ${isMobile ? '<p><em>Note: After clicking, you may need to open the DevRel Insights app.</em></p>' : ''}
        <p>— DevRel Insights</p>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
