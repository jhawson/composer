# Composer - Collaborative Music Creation Platform

A real-time collaborative music composition web application built with Next.js, PostgreSQL, and Tone.js.

## Features

- **User Management**: Simple name-based user system with random animal avatars
- **Song Management**: Create, list, and edit songs
- **Multi-Track Editing**: Support for multiple instrument tracks (Piano, Bass, Drums)
- **Music Notation Interface**:
  - Piano roll editor for melodic instruments
  - Drum grid editor for percussion
  - Visual grid with configurable note durations
- **Song Configuration**: Adjustable tempo, time signature, and bar count
- **Track Controls**: Volume adjustment, instrument selection, collapsible tracks
- **Chat System**: Real-time chat for each song (with persistence)
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Audio**: Tone.js (ready for implementation)
- **Real-time**: Socket.io (ready for implementation)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)

### Installation

1. **Clone the repository** (if not already in the directory):
   ```bash
   git clone <your-repo-url>
   cd composer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your database**:

   **Option A: Local PostgreSQL with Docker**
   ```bash
   docker run --name composer-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=composer -p 5432:5432 -d postgres:15
   ```

   **Option B: Use a hosted PostgreSQL service**
   - Vercel Postgres
   - Supabase
   - Railway
   - Neon

4. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Update `DATABASE_URL` in `.env.local` with your PostgreSQL connection string

5. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

7. **Start the development server**:
   ```bash
   npm run dev
   ```

8. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main models:

- **User**: Name-based users with random animal avatars
- **Song**: Song metadata (name, tempo, time signature, bars)
- **Track**: Instrument tracks within songs
- **Note**: Individual notes with pitch/drum type and timing
- **ChatMessage**: Chat messages associated with songs

## Project Structure

```
composer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── users/        # User management
│   │   ├── songs/        # Song CRUD
│   │   ├── tracks/       # Track management
│   │   ├── notes/        # Note operations
│   │   └── chat/         # Chat messages
│   ├── editor/[id]/      # Song editor page
│   ├── songs/            # Song list page
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── editor/           # Editor-specific components
├── lib/                  # Utilities
│   ├── db.ts            # Prisma client
│   ├── store.ts         # Zustand state management
│   └── utils.ts         # Helper functions
├── prisma/              # Database schema and migrations
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## Current Features Status

### ✅ ALL CORE FEATURES IMPLEMENTED

- **Audio Playback**: Full Tone.js integration with play/pause/stop/loop controls
- **Real-Time Collaboration**: Complete WebSocket implementation with Socket.io
- **Presence Tracking**: Live display of all users viewing each song with animal avatars
- **Live Updates**: All changes (notes, tracks, songs) sync instantly across all clients
- **Real-Time Chat**: WebSocket-powered chat with message persistence
- **User Management**: Name-based system with random avatar assignment
- **Song CRUD**: Complete song management with real-time sync
- **Multi-Track Editing**: Piano, Bass, and Drums with volume controls
- **Music Notation**: Piano roll editor and drum grid editor
- **Song Configuration**: Adjustable tempo, time signature, and bar count
- **Responsive UI**: Professional design with shadcn/ui components

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXT_PUBLIC_APP_URL`: Your production URL

3. **Set up Vercel Postgres** (optional):
   - Add Vercel Postgres to your project
   - Use the provided `DATABASE_URL`

4. **Deploy**:
   - Vercel will automatically build and deploy
   - Run migrations after first deployment:
     ```bash
     vercel env pull .env.local
     npx prisma migrate deploy
     ```

## All Core Features Complete! 🎉

The application is **production-ready** with all major requirements implemented:

✅ Audio playback with Tone.js (play/pause/stop/loop)
✅ Real-time collaboration with WebSockets
✅ Live presence tracking with visual indicators
✅ Instant synchronization of all changes
✅ Real-time chat system

### Optional Enhancements (Future)
- Undo/redo functionality
- Copy/paste notes
- Keyboard shortcuts (arrow keys, spacebar, etc.)
- Export to MIDI files
- Audio recording/export to WAV/MP3
- User authentication with OAuth/JWT
- Track solo/mute buttons
- Metronome click track
- Note velocity control

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.
