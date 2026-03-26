# Coolify Deployment Guide

## Prerequisites
- Coolify instance running
- Docker installed
- Git repository connected

## Deployment Steps

### 1. Connect Repository
1. Log into Coolify
2. Create new project
3. Select "Docker Compose" or "Docker" as deployment type
4. Connect your Git repository

### 2. Environment Variables
Set these in Coolify environment:
```
DATABASE_URL=mysql://user:password@mysql:3306/iycyachts
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-random-secret-key
NEXT_PUBLIC_BUNNY_CDN_URL=https://your-bunny-domain.b-cdn.net
BUNNY_API_KEY=your-api-key
BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_PASSWORD=your-password
NODE_ENV=production
```

### 3. Database Setup
Option A: Use Coolify's MySQL service
- Create MySQL database in Coolify
- Use provided connection string for DATABASE_URL

Option B: Use existing MySQL
- Point DATABASE_URL to your MySQL instance
- Ensure database is accessible from Coolify

### 4. Deployment

**Using docker-compose.yml:**
```bash
docker-compose up -d
```

**Using Coolify UI:**
1. Upload Dockerfile
2. Configure environment variables
3. Set port to 3000
4. Deploy

### 5. Run Migrations
After first deploy, run Prisma migrations:
```bash
docker exec iycyachts-app npx prisma migrate deploy
```

Or via Coolify exec:
```bash
coolify exec <app-name> npx prisma migrate deploy
```

## File Structure for Coolify

```
.
├── Dockerfile              # Multi-stage build
├── .dockerignore          # Docker exclusions
├── docker-compose.yml     # Local development
├── next.config.ts         # Configured with standalone output
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment template
└── package.json
```

## Monitoring

### View Logs
```bash
docker logs iycyachts-app
```

### Database
Access MySQL:
```bash
docker exec -it iycyachts-mysql mysql -u yacht_user -p iycyachts
```

### Prisma Studio
```bash
docker exec iycyachts-app npx prisma studio
```

## SSL/TLS
Coolify handles SSL automatically if domain is configured.

## Scaling
For Coolify, scale by:
1. Increasing container resources
2. Using load balancer (for multiple instances)
3. CDN (Bunny CDN already configured)

## Troubleshooting

### Build fails
- Check Docker build logs: `docker logs iycyachts-app`
- Verify Node version matches (20+)
- Clear node_modules and reinstall

### Database connection fails
- Verify DATABASE_URL is correct
- Check MySQL is running: `docker logs iycyachts-mysql`
- Test connection: `docker exec iycyachts-mysql mysql -u yacht_user -p`

### Port conflicts
- Change port in docker-compose.yml
- Or stop other services on port 3000

## Local Testing

Test before deploying:
```bash
docker-compose up --build
```

Visit: http://localhost:3000

## CI/CD with Coolify

Set webhook in Coolify to auto-deploy on git push:
1. Enable Webhooks in Coolify
2. Add webhook URL to GitHub/GitLab
3. Each push automatically triggers deploy

## Production Checklist

- [ ] NEXTAUTH_SECRET changed to secure random value
- [ ] DATABASE_URL points to production MySQL
- [ ] Bunny CDN credentials configured
- [ ] NEXTAUTH_URL set to production domain
- [ ] Backups enabled for MySQL
- [ ] Logs configured for monitoring
- [ ] SSL certificate generated
- [ ] Firewall rules restrict access appropriately
