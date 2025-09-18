#!/usr/bin/env tsx

/**
 * Production Database Setup Script
 * 
 * This script sets up the Supabase database for production use by:
 * 1. Applying Prisma migrations
 * 2. Setting up row-level security policies
 * 3. Creating necessary indexes
 * 4. Seeding initial data
 * 
 * Usage:
 * 1. Set DATABASE_URL environment variable with Supabase connection string
 * 2. Run: npm run setup:production-db
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const SUPABASE_PROJECT_ID = 'koggpaphbvknvxvulwco'

async function setupProductionDatabase() {
  console.log('🚀 Setting up production database...')
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.log('Please set DATABASE_URL to your Supabase connection string:')
    console.log('DATABASE_URL="postgresql://postgres:[password]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres"')
    process.exit(1)
  }

  try {
    // Step 1: Apply Prisma migrations
    console.log('📦 Applying Prisma migrations...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env }
    })
    
    // Step 2: Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Step 3: Test database connection
    console.log('🔍 Testing database connection...')
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ Database connection successful')
      
      // Step 4: Check if tables exist
      const tableCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ` as [{ count: bigint }]
      
      console.log(`📊 Found ${tableCount[0].count} tables in database`)
      
      // Step 5: Setup RLS policies (if needed)
      await setupRowLevelSecurity(prisma)
      
      // Step 6: Verify indexes
      await verifyIndexes(prisma)
      
      // Step 7: Seed initial data if database is empty
      const userCount = await prisma.user.count()
      if (userCount === 0) {
        console.log('🌱 Seeding initial data...')
        execSync('npm run db:seed', { 
          stdio: 'inherit',
          env: { ...process.env }
        })
      } else {
        console.log(`📈 Database already has ${userCount} users, skipping seed`)
      }
      
      console.log('🎉 Production database setup completed successfully!')
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

async function setupRowLevelSecurity(prisma: PrismaClient) {
  console.log('🔒 Setting up Row Level Security policies...')
  
  try {
    // Enable RLS on sensitive tables
    await prisma.$executeRaw`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
    await prisma.$executeRaw`ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;`
    await prisma.$executeRaw`ALTER TABLE verification_votes ENABLE ROW LEVEL SECURITY;`
    
    // Create policies for users table
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own profile" ON users
      FOR SELECT USING (auth.uid()::text = id);
    `
    
    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own profile" ON users
      FOR UPDATE USING (auth.uid()::text = id);
    `
    
    // Create policies for user_devices table
    await prisma.$executeRaw`
      CREATE POLICY "Users can manage their own devices" ON user_devices
      FOR ALL USING (auth.uid()::text = user_id);
    `
    
    // Create policies for verification_votes table
    await prisma.$executeRaw`
      CREATE POLICY "Users can manage their own votes" ON verification_votes
      FOR ALL USING (auth.uid()::text = user_id);
    `
    
    console.log('✅ Row Level Security policies created')
    
  } catch (error) {
    // Policies might already exist, which is fine
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️  RLS policies already exist, skipping...')
    } else {
      console.warn('⚠️  Warning: Could not set up all RLS policies:', error)
    }
  }
}

async function verifyIndexes(prisma: PrismaClient) {
  console.log('📋 Verifying database indexes...')
  
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    ` as Array<{
      schemaname: string
      tablename: string
      indexname: string
      indexdef: string
    }>
    
    console.log(`✅ Found ${indexes.length} indexes in database`)
    
    // Log important indexes for verification
    const importantTables = ['devices', 'device_standards', 'user_devices', 'standards']
    importantTables.forEach(table => {
      const tableIndexes = indexes.filter(idx => idx.tablename === table)
      console.log(`  ${table}: ${tableIndexes.length} indexes`)
    })
    
  } catch (error) {
    console.warn('⚠️  Warning: Could not verify indexes:', error)
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupProductionDatabase().catch(console.error)
}

export { setupProductionDatabase }