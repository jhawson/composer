import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const ANIMAL_ICONS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🐵', '🐔', '🐧', '🦉', '🦆', '🐺', '🐗', '🐴', '🦄'];

function getRandomAnimalIcon() {
  return ANIMAL_ICONS[Math.floor(Math.random() * ANIMAL_ICONS.length)];
}

// GET /api/users?name=<name> - Get or create user by name
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { name },
    });

    // Create if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          avatarIcon: getRandomAnimalIcon(),
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching/creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        avatarIcon: getRandomAnimalIcon(),
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
