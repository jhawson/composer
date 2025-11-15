import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/songs - Get all songs
export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        tracks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/songs - Create a new song
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tempo = 100, timeSignature = '4/4', bars = 4 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const song = await prisma.song.create({
      data: {
        name,
        tempo,
        timeSignature,
        bars,
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
