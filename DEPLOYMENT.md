# Deployment Guide

## Deploying to Vercel

### Step 1: Prepare Your Database

You have several options for PostgreSQL hosting:

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel project
2. Navigate to Storage → Create Database
3. Select Postgres
4. Note the connection string provided

#### Option B: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string (use "Direct connection" string)

#### Option C: Railway
1. Create account at [railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Copy the DATABASE_URL from Variables tab

#### Option D: Neon
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy the connection string

### Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Composer music app"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/composer.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Visit [vercel.com](https://vercel.com)** and sign in

2. **Import Project**:
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project**:
   - Framework Preset: Next.js (should auto-detect)
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add the following:
     ```
     DATABASE_URL=your_postgresql_connection_string
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

### Step 4: Run Database Migrations

After first deployment:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# (Optional) Seed demo data
npx prisma db seed
```

Alternatively, you can run migrations from Vercel's dashboard:
1. Go to your project settings
2. Functions → Serverless Functions
3. Add a custom build command: `prisma migrate deploy && next build`

### Step 5: Verify Deployment

1. Visit your deployed URL
2. Test user creation
3. Create a test song
4. Add tracks and notes
5. Test chat functionality

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | `https://composer.vercel.app` |

### Optional Variables (for future features)

| Variable | Description | Example |
|----------|-------------|---------|
| `SOCKET_IO_URL` | WebSocket server URL | `wss://composer-ws.vercel.app` |

## Post-Deployment Checklist

- [ ] Database is accessible
- [ ] Migrations have been run
- [ ] Homepage loads correctly
- [ ] User can create account (enter name)
- [ ] User can create songs
- [ ] User can add tracks
- [ ] User can add/remove notes
- [ ] Chat messages are saved
- [ ] All pages are accessible
- [ ] No console errors

## Troubleshooting

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Check your DATABASE_URL is correct
2. Ensure database allows connections from Vercel IPs
3. For Supabase, make sure you're using the "Direct connection" string
4. Check database is running

### Build Failures

**Error**: `Prisma generate failed`

**Solution**:
1. Make sure `prisma/schema.prisma` is committed
2. Verify `postinstall` script in package.json runs `prisma generate`
3. Check build logs for specific error

### API Routes 404

**Error**: API routes return 404

**Solution**:
1. Ensure you're using Next.js 14 App Router structure
2. Check `app/api/` directory exists in deployment
3. Verify routes are in correct directory structure

### Migration Issues

**Error**: `Migration failed`

**Solution**:
```bash
# Reset migrations (WARNING: This will delete data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name fix_schema
npx prisma migrate deploy
```

## Updating Your Deployment

When you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Vercel will automatically deploy
```

To manually trigger deployment:
```bash
vercel --prod
```

## Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor performance
- Check error rates
- View analytics

### Database Monitoring
- Use Prisma Studio: `npx prisma studio`
- Check database provider's dashboard
- Monitor connection pool usage

## Scaling Considerations

### Database
- Most providers offer auto-scaling
- Monitor connection pool limits
- Consider read replicas for high traffic

### Serverless Functions
- Vercel automatically scales
- Monitor function execution time
- Optimize API routes if needed

### Future: WebSocket Server
- When implementing real-time features
- Consider separate WebSocket server on Railway/Render
- Use environment variable for WebSocket URL

## Cost Estimates

### Free Tier (Hobby)
- **Vercel**: Free for hobby projects
- **Vercel Postgres**: 256 MB free, then pay-as-you-go
- **Supabase**: 500 MB free
- **Railway**: $5/month credit
- **Neon**: Free tier with 0.5 GB

### Production Tier
- **Vercel Pro**: $20/month
- **Database**: $10-50/month depending on size
- **WebSocket Server**: $5-10/month

## Security Checklist

- [ ] Environment variables are not committed
- [ ] DATABASE_URL is stored securely
- [ ] No hardcoded credentials
- [ ] CORS configured if needed
- [ ] Rate limiting considered (future)
- [ ] Input validation in place

## Backup Strategy

1. **Database Backups**:
   - Most providers offer automatic backups
   - Vercel Postgres: Automatic
   - Supabase: Daily backups
   - Railway: Point-in-time recovery

2. **Manual Backup**:
   ```bash
   # Export data
   npx prisma db pull
   npx prisma db push --force-reset
   ```

## Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

## Next Steps After Deployment

1. [ ] Share the URL with users
2. [ ] Implement audio playback
3. [ ] Add real-time collaboration
4. [ ] Set up error monitoring (Sentry)
5. [ ] Configure custom domain
6. [ ] Set up analytics
7. [ ] Create user documentation

Congratulations on deploying Composer! 🎵
