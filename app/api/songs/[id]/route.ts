import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/songs/[id] - Get a single song with all its data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          orderBy: {
            order: 'asc',
          },
          include: {
            notes: {
              orderBy: {
                startPosition: 'asc',
              },
            },
          },
        },
        chatMessages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: true,
          },
        },
        contributors: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/songs/[id] - Update song metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, tempo, timeSignature, bars } = body;

    const song = await prisma.song.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(tempo !== undefined && { tempo }),
        ...(timeSignature !== undefined && { timeSignature }),
        ...(bars !== undefined && { bars }),
      },
      include: {
        tracks: true,
      },
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/songs/[id] - Delete a song
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.song.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
