import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/songs/[id]/contributors - Add a contributor to a song
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Use upsert to avoid duplicates (will create if doesn't exist, no-op if exists)
    const contributor = await prisma.songContributor.upsert({
      where: {
        songId_userId: {
          songId: params.id,
          userId: userId,
        },
      },
      update: {}, // No update needed if already exists
      create: {
        songId: params.id,
        userId: userId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(contributor, { status: 201 });
  } catch (error) {
    console.error('Error adding contributor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
