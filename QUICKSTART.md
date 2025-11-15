# Quick Start Guide

Get Composer up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker installed (for local database) OR a PostgreSQL connection string

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

**Using Docker (Recommended for local development):**

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432`.

**Using hosted database:**
- Get a connection string from Vercel, Supabase, Railway, or Neon
- Update `DATABASE_URL` in `.env.local`

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates the necessary database tables.

### 4. (Optional) Seed Demo Data

```bash
npm run db:seed
```

This adds a demo song with some tracks and notes to help you get started.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open the App

Visit [http://localhost:3000](http://localhost:3000)

Enter your name and start composing!

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:migrate` - Create new migration
- `docker-compose up -d` - Start database
- `docker-compose down` - Stop database

## Troubleshooting

### Database connection error

Make sure your PostgreSQL database is running and the `DATABASE_URL` in `.env.local` is correct.

```bash
# Test database connection
npx prisma db push
```

### Port 3000 already in use

```bash
# Use a different port
PORT=3001 npm run dev
```

### Prisma Client not generated

```bash
npx prisma generate
```

## What's Next?

1. **Create a Song**: Click "New Song" on the songs page
2. **Add Tracks**: Click "Add Piano Track", "Add Bass Track", or "Add Drums Track"
3. **Compose Music**: Click on the grid to add notes
4. **Adjust Settings**: Change tempo, time signature, and bar count
5. **Chat**: Use the chat panel to collaborate with others

## Project Structure

```
/app              - Next.js pages and API routes
/components       - React components
/prisma           - Database schema and migrations
/lib              - Utilities and helpers
/types            - TypeScript types
```

Enjoy composing! 🎵
