# iycyachts Project Setup

## Installed Technologies

### Core
- **Next.js 16.2.1** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4.1** - Styling

### Database & ORM
- **Prisma ORM** - Database management with MySQL
- **MySQL** - Database configured (update DATABASE_URL in .env)

### Authentication
- **Auth.js v5** (@auth/nextjs) - NextAuth for authentication
- Pre-configured User, Account, Session, and VerificationToken models
- Auth callback examples included

### UI Components
- **shadcn/ui** - Component library (ready to use)
- **Lucide React** - Icon library
- **class-variance-authority** - Component styling utility
- **clsx** & **tailwind-merge** - CSS utilities

### CDN
- **Bunny CDN** - Upload, retrieval, and cache purging utilities in `lib/bunny-cdn.ts`
- Configuration placeholders in `.env`

## Key Files & Directories

- `lib/auth.ts` - Auth.js configuration
- `lib/bunny-cdn.ts` - Bunny CDN utilities
- `prisma/schema.prisma` - Database schema with auth models
- `components/ui/` - shadcn components (ready to add)
- `app/api/auth/` - Auth API routes (ready to configure)
- `.env` - Environment variables (update with your values)
- `components.json` - shadcn configuration

## Next Steps

1. **Database Setup**
   - Update `DATABASE_URL` in `.env` with your MySQL connection
   - Run `npx prisma migrate dev` to set up tables

2. **Auth Configuration**
   - Configure auth providers in `lib/auth.ts`
   - Update `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in `.env`
   - Create auth API route: `app/api/auth/[...nextauth].ts`

3. **Bunny CDN Setup**
   - Add your Bunny CDN credentials to `.env`
   - Use functions from `lib/bunny-cdn.ts` for file operations

4. **Add Components**
   - Use `npx shadcn add <component>` to add UI components
   - Or manually add components to `components/ui/`

5. **Start Development**
   - Run `npm run dev` to start the dev server
   - Visit `http://localhost:3000`

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build
npm start

# Database migrations
npx prisma migrate dev --name <migration-name>
npx prisma studio  # Database GUI

# Add shadcn component
npx shadcn add button  # Example
```

## Environment Variables Checklist

- [ ] DATABASE_URL - MySQL connection string
- [ ] NEXTAUTH_URL - Your application URL
- [ ] NEXTAUTH_SECRET - Random secret key
- [ ] NEXT_PUBLIC_BUNNY_CDN_URL - Your Bunny CDN domain
- [ ] BUNNY_API_KEY - For cache purging
- [ ] BUNNY_STORAGE_ZONE - Your storage zone name
- [ ] BUNNY_STORAGE_PASSWORD - Storage zone password
