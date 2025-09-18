#!/usr/bin/env tsx

/**
 * Verify Production Database Setup
 * 
 * This script verifies that the Supabase production database
 * is properly configured and ready for use.
 */

import { PrismaClient } from '@prisma/client'

const SUPABASE_PROJECT_ID = 'koggpaphbvknvxvulwco'

async function verifyProductionSetup() {
  console.log('🔍 Verifying production database setup...')
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Test 2: Verify all tables exist
    console.log('2️⃣ Verifying table structure...')
    const expectedTables = [
      'users', 'device_categories', 'standards', 'devices', 'device_standards',
      'compatibility_rules', 'user_devices', 'verification_items', 'verification_votes',
      'device_category_schemas', 'device_specifications', 'schema_migrations',
      'category_templates', 'dynamic_indexes', 'compatibility_results'
    ]

    for (const table of expectedTables) {
      const count = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      ` as [{ count: bigint }]
      
      if (count[0].count === 0n) {
        throw new Error(`Table ${table} not found`)
      }
    }
    console.log(`✅ All ${expectedTables.length} tables exist`)

    // Test 3: Verify seed data
    console.log('3️⃣ Verifying seed data...')
    const deviceCount = await prisma.device.count()
    const categoryCount = await prisma.deviceCategory.count()
    const standardCount = await prisma.standard.count()
    
    console.log(`   📊 Devices: ${deviceCount}`)
    console.log(`   📊 Categories: ${categoryCount}`)
    console.log(`   📊 Standards: ${standardCount}`)
    
    if (deviceCount === 0 || categoryCount === 0 || standardCount === 0) {
      console.warn('⚠️  Warning: Database appears to be empty. Run seed script if needed.')
    } else {
      console.log('✅ Seed data verified')
    }

    // Test 4: Verify indexes
    console.log('4️⃣ Verifying database indexes...')
    const indexes = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public'
    ` as [{ count: bigint }]
    
    console.log(`✅ Found ${indexes[0].count} database indexes`)

    // Test 5: Test basic queries
    console.log('5️⃣ Testing basic database operations...')
    
    // Test device search
    const devices = await prisma.device.findMany({
      take: 5,
      include: {
        category: true,
        deviceStandards: {
          include: {
            standard: true
          }
        }
      }
    })
    console.log(`✅ Device query returned ${devices.length} results`)

    // Test compatibility query
    if (devices.length >= 2) {
      const compatibility = await prisma.$queryRaw`
        SELECT cr.compatibility_type, cr.description
        FROM compatibility_rules cr
        JOIN device_standards ds1 ON ds1.standard_id = cr.standard_a_id
        JOIN device_standards ds2 ON ds2.standard_id = cr.standard_b_id
        WHERE ds1.device_id = ${devices[0].id}
        AND ds2.device_id = ${devices[1].id}
        LIMIT 1
      ` as Array<{ compatibility_type: string; description: string }>
      
      console.log(`✅ Compatibility query executed successfully`)
    }

    // Test 6: Verify RLS policies
    console.log('6️⃣ Verifying Row Level Security...')
    const rlsPolicies = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_policies 
      WHERE schemaname = 'public'
    ` as [{ count: bigint }]
    
    console.log(`✅ Found ${rlsPolicies[0].count} RLS policies`)

    // Test 7: Performance check
    console.log('7️⃣ Running performance checks...')
    const start = Date.now()
    
    await prisma.device.findMany({
      where: {
        verified: true,
        powerWatts: {
          gte: 100,
          lte: 300
        }
      },
      take: 10
    })
    
    const queryTime = Date.now() - start
    console.log(`✅ Indexed query completed in ${queryTime}ms`)

    if (queryTime > 1000) {
      console.warn('⚠️  Warning: Query performance may need optimization')
    }

    console.log('\n🎉 Production database setup verification completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   • Project ID: ${SUPABASE_PROJECT_ID}`)
    console.log(`   • Tables: ${expectedTables.length}`)
    console.log(`   • Indexes: ${indexes[0].count}`)
    console.log(`   • RLS Policies: ${rlsPolicies[0].count}`)
    console.log(`   • Devices: ${deviceCount}`)
    console.log(`   • Categories: ${categoryCount}`)
    console.log(`   • Standards: ${standardCount}`)
    console.log('\n✅ Database is ready for production use!')

  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyProductionSetup().catch(console.error)
}

export { verifyProductionSetup }