import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { DEFAULT_PRIVACY, type PrivacySettings } from '@/lib/privacy-resolver';

/**
 * GET /api/user/privacy
 * Get current user's default privacy settings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { privacyDefaults: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const privacyDefaults = (user.privacyDefaults as PrivacySettings) || DEFAULT_PRIVACY;

    return NextResponse.json({ privacyDefaults });
  } catch (error) {
    console.error('Error fetching user privacy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/privacy
 * Update current user's default privacy settings
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { privacyDefaults } = body;

    // Validate privacy settings
    if (!isValidPrivacySettings(privacyDefaults)) {
      return NextResponse.json(
        { error: 'Invalid privacy settings format' },
        { status: 400 }
      );
    }

    // Update user's privacy defaults
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        privacyDefaults: privacyDefaults as any,
      },
      select: { privacyDefaults: true },
    });

    return NextResponse.json({ privacyDefaults: user.privacyDefaults });
  } catch (error) {
    console.error('Error updating user privacy:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

/**
 * Validate privacy settings structure
 */
function isValidPrivacySettings(settings: any): settings is PrivacySettings {
  if (!settings || typeof settings !== 'object') return false;

  const validValues: Record<keyof PrivacySettings, string[]> = {
    portfolioValue: ['exact', 'approximate', 'hidden'],
    performance: ['visible', 'hidden'],
    positions: ['full', 'tickers_only', 'hidden'],
    activity: ['full', 'without_amounts', 'hidden'],
    watchlist: ['visible', 'hidden'],
  };

  for (const [key, validOptions] of Object.entries(validValues)) {
    if (!(key in settings)) return false;
    if (!validOptions.includes(settings[key])) return false;
  }

  return true;
}
