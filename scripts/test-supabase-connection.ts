#!/usr/bin/env tsx

/**
 * Test Supabase Database Connection
 * 
 * This script tests the connection to the Supabase database
 * and verifies that we can perform basic operations.
 */

import { PrismaClient } from '@prisma/client'

const SUPABASE_PROJECT_ID = 'koggpaphbvknvxvulwco'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase database connection...')
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.log('Set it to: postgresql://postgres:[password]@db.koggpaphbvknvxvulwco.supabase.co:5432/postgres')
    process.exit(1)
  }

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    // Test basic connection
    console.log('📡 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Test database version
    const version = await prisma.$queryRaw`SELECT version() as version` as [{ version: string }]
    console.log('🐘 PostgreSQL version:', version[0].version.split(',')[0])

    // Check if we can create a simple table (will be rolled back)
    console.log('🧪 Testing table creation...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_value TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Insert test data
    await prisma.$executeRaw`
      INSERT INTO connection_test (test_value) 
      VALUES ('Connection test successful')
    `
    
    // Read test data
    const testData = await prisma.$queryRaw`
      SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1
    ` as Array<{ id: number; test_value: string; created_at: Date }>
    
    console.log('📊 Test data:', testData[0])
    
    // Clean up test table
    await prisma.$executeRaw`DROP TABLE IF EXISTS connection_test`
    console.log('🧹 Cleaned up test table')

    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    ` as Array<{ table_name: string }>

    console.log(`📋 Found ${tables.length} existing tables:`)
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })

    console.log('🎉 Supabase connection test completed successfully!')

  } catch (error) {
    console.error('❌ Connection test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSupabaseConnection().catch(console.error)
}

export { testSupabaseConnection }