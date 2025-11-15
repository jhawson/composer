import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/chat?songId=<id> - Get chat messages for a song
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json(
        { error: 'songId is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Create a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songId, userId, message } = body;

    if (!songId || !userId || !message) {
      return NextResponse.json(
        { error: 'songId, userId, and message are required' },
        { status: 400 }
      );
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        songId,
        userId,
        message,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
