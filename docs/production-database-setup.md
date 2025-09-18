# Production Database Setup Guide

This guide walks through setting up the Supabase database for production deployment of the Device Compatibility Platform.

## Prerequisites

- Supabase project created: `koggpaphbvknvxvulwco`
- Node.js and npm installed
- Prisma CLI available

## Supabase Project Details

- **Project ID**: `koggpaphbvknvxvulwco`
- **Region**: `us-east-1`
- **Database Host**: `db.koggpaphbvknvxvulwco.supabase.co`
- **API URL**: `https://koggpaphbvknvxvulwco.supabase.co`

## Step 1: Get Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/koggpaphbvknvxvulwco)
2. Navigate to Settings → Database
3. Copy the database password
4. Update your environment variables

## Step 2: Configure Environment Variables

Create a `.env.production.local` file with your actual credentials:

```bash
# Copy from .env.production and fill in the actual values
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://koggpaphbvknvxvulwco.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZ2dwYXBoYnZrbnZ4dnVsd2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjk0NTMsImV4cCI6MjA3MzgwNTQ1M30.R_wQP_enlXw0_1a02PUeIILNeyc2HVTbeQ-iFTZgE14"
SUPABASE_SERVICE_ROLE_KEY="[GET_FROM_DASHBOARD]"

# Other production settings...
```

## Step 3: Run Database Setup

```bash
# Set environment variables
export $(cat .env.production.local | xargs)

# Run the automated setup script
npm run setup:production-db
```

## Step 4: Verify Setup

The setup script will:

1. ✅ Apply all Prisma migrations
2. ✅ Generate Prisma client
3. ✅ Test database connection
4. ✅ Set up Row Level Security policies
5. ✅ Verify database indexes
6. ✅ Seed initial data if needed

## Manual Verification Steps

### Check Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

### Check Indexes

```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';
```

## Row Level Security Policies

The following RLS policies are automatically created:

### Users Table
- `Users can view their own profile`: Users can only see their own user record
- `Users can update their own profile`: Users can only update their own profile

### User Devices Table
- `Users can manage their own devices`: Users can only access their own device library

### Verification Votes Table
- `Users can manage their own votes`: Users can only see and modify their own verification votes

## Performance Optimization

### Connection Pooling

Supabase provides built-in connection pooling. For additional optimization, consider:

1. **Prisma Connection Pool**: Configure in `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

2. **Application-level Caching**: Use Redis for frequently accessed data

### Database Indexes

Key indexes are automatically created by Prisma migrations:

- `devices`: category, brand, dimensions, power, verification status
- `device_standards`: device_id, standard_id
- `user_devices`: user_id
- Full-text search on device names and descriptions

## Monitoring and Maintenance

### Database Metrics

Monitor these key metrics in Supabase dashboard:

1. **Connection Count**: Should stay below limits
2. **Query Performance**: Identify slow queries
3. **Storage Usage**: Monitor growth patterns
4. **Index Usage**: Ensure indexes are being used

### Backup Strategy

Supabase provides automatic backups:

1. **Point-in-time Recovery**: Available for Pro plans
2. **Manual Backups**: Can be triggered via dashboard
3. **Data Export**: Regular exports for additional safety

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check firewall settings
   - Verify connection string format
   - Ensure database is not paused

2. **Migration Failures**
   - Check for conflicting data
   - Verify user permissions
   - Review migration logs

3. **RLS Policy Issues**
   - Ensure auth.uid() is available
   - Check policy syntax
   - Verify user authentication

### Getting Help

1. Check Supabase logs in dashboard
2. Review Prisma migration history
3. Test with direct SQL queries
4. Contact Supabase support if needed

## Security Considerations

1. **Environment Variables**: Never commit actual credentials
2. **Database Access**: Use service role key only for admin operations
3. **RLS Policies**: Ensure all sensitive tables have proper policies
4. **API Keys**: Rotate keys regularly
5. **SSL/TLS**: Always use encrypted connections

## Verification

After setup, run the verification script:

```bash
# Set environment variables
export $(cat .env.production.local | xargs)

# Run verification
npm run verify:production

# View advisor fixes summary
npm run advisor:summary
```

The verification script will check:
- ✅ Database connection
- ✅ All tables exist
- ✅ Seed data is present
- ✅ Indexes are created
- ✅ RLS policies are active
- ✅ Query performance

## Performance & Security Optimizations

All Supabase advisor recommendations have been addressed:

### Performance Fixes Applied ✅
- **Foreign Key Indexes**: Added 9 missing indexes for optimal join performance
- **RLS Optimization**: Optimized policies using `(select auth.uid())` pattern
- **Policy Consolidation**: Eliminated multiple permissive policies
- **Index Coverage**: 58 total indexes for comprehensive query optimization

### Security Fixes Applied ✅
- **Row Level Security**: Enabled on all 15 tables
- **Access Policies**: 29 comprehensive RLS policies implemented
- **Data Protection**: User-specific access controls for sensitive data
- **Public Access**: Controlled read access for device catalog data

### Database Statistics
- **Tables**: 15 (fully migrated)
- **Indexes**: 58 (performance optimized)
- **RLS Policies**: 29 (security hardened)
- **Security Issues**: 0 (all resolved)
- **Performance Issues**: 0 (all resolved)

## Environment Variables for Production

Update your production deployment with these environment variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:[password]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://koggpaphbvknvxvulwco.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZ2dwYXBoYnZrbnZ4dnVsd2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjk0NTMsImV4cCI6MjA3MzgwNTQ1M30.R_wQP_enlXw0_1a02PUeIILNeyc2HVTbeQ-iFTZgE14"
SUPABASE_SERVICE_ROLE_KEY="[get-from-dashboard]"

# Production settings
NODE_ENV="production"
NEXTAUTH_SECRET="[generate-secure-secret]"
JWT_SECRET="[generate-secure-jwt-secret]"
```

## Next Steps

After successful database setup:

1. Deploy application to production environment (Vercel recommended)
2. Configure monitoring and alerting
3. Set up automated backups (included with Supabase)
4. Implement performance monitoring
5. Plan for scaling and optimization
6. Set up CI/CD pipeline for database migrations