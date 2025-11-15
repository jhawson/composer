import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, pitch, drumType, duration, startPosition } = body;

    if (!trackId || !duration || startPosition === undefined) {
      return NextResponse.json(
        { error: 'trackId, duration, and startPosition are required' },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        trackId,
        pitch,
        drumType,
        duration,
        startPosition,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
