import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/tracks/[id] - Update track
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { instrumentType, volume, order } = body;

    const track = await prisma.track.update({
      where: { id: params.id },
      data: {
        ...(instrumentType !== undefined && { instrumentType }),
        ...(volume !== undefined && { volume }),
        ...(order !== undefined && { order }),
      },
      include: {
        notes: true,
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[id] - Delete track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.track.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
