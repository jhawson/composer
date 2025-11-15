import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create some demo users
  const user1 = await prisma.user.upsert({
    where: { id: 'demo-user-1' },
    update: {},
    create: {
      id: 'demo-user-1',
      name: 'Demo User',
      avatarIcon: '🦁',
    },
  });

  console.log('Created demo user:', user1.name);

  // Create a demo song
  const song = await prisma.song.create({
    data: {
      name: 'Demo Song',
      tempo: 120,
      timeSignature: '4/4',
      bars: 4,
      tracks: {
        create: [
          {
            instrumentType: 'piano',
            volume: 0.8,
            order: 0,
            notes: {
              create: [
                { pitch: 'C4', duration: 'quarter', startPosition: 0 },
                { pitch: 'E4', duration: 'quarter', startPosition: 4 },
                { pitch: 'G4', duration: 'quarter', startPosition: 8 },
                { pitch: 'C5', duration: 'quarter', startPosition: 12 },
              ],
            },
          },
          {
            instrumentType: 'drums',
            volume: 0.7,
            order: 1,
            notes: {
              create: [
                { drumType: 'bass', duration: 'quarter', startPosition: 0 },
                { drumType: 'snare', duration: 'quarter', startPosition: 4 },
                { drumType: 'bass', duration: 'quarter', startPosition: 8 },
                { drumType: 'snare', duration: 'quarter', startPosition: 12 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Created demo song:', song.name);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
