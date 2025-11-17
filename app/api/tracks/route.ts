import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/tracks - Create a new track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songId, instrumentType, volume = 0.8, order } = body;

    if (!songId || !instrumentType) {
      return NextResponse.json(
        { error: 'songId and instrumentType are required' },
        { status: 400 }
      );
    }

    // If order not provided, get the max order and add 1
    let trackOrder = order;
    if (trackOrder === undefined) {
      const maxOrderTrack = await prisma.track.findFirst({
        where: { songId },
        orderBy: { order: 'desc' },
      });
      trackOrder = (maxOrderTrack?.order ?? -1) + 1;
    }

    const track = await prisma.track.create({
      data: {
        songId,
        instrumentType,
        volume,
        order: trackOrder,
        drumKit: instrumentType === 'drums' ? 'breakbeat13' : null,
      },
      include: {
        notes: true,
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
