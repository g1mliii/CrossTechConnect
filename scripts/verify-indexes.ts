#!/usr/bin/env tsx

import { prisma } from '../src/lib/database';

async function verifyIndexes() {
  console.log('🔍 Verifying database indexes...\n');

  try {
    // Get all indexes
    const indexes = await prisma.$queryRaw<Array<{
      tablename: string;
      indexname: string;
      indexdef: string;
    }>>`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

    console.log(`Found ${indexes.length} indexes:\n`);

    // Group by table
    const indexesByTable: Record<string, Array<{ indexname: string; indexdef: string }>> = {};
    
    indexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push({
        indexname: idx.indexname,
        indexdef: idx.indexdef
      });
    });

    // Display indexes by table
    Object.entries(indexesByTable).forEach(([tableName, tableIndexes]) => {
      console.log(`📋 ${tableName}:`);
      tableIndexes.forEach(idx => {
        const isCustom = !idx.indexname.includes('_pkey') && !idx.indexname.includes('_key');
        const marker = isCustom ? '🔧' : '🔑';
        console.log(`  ${marker} ${idx.indexname}`);
        if (process.env.VERBOSE) {
          console.log(`     ${idx.indexdef}`);
        }
      });
      console.log();
    });

    // Verify expected custom indexes exist
    const expectedIndexes = [
      'devices_category_id_idx',
      'devices_brand_idx', 
      'devices_width_cm_height_cm_depth_cm_idx',
      'devices_power_watts_idx',
      'devices_verified_idx',
      'device_standards_device_id_idx',
      'device_standards_standard_id_idx',
      'user_devices_user_id_idx'
    ];

    const existingIndexNames = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(expected => 
      !existingIndexNames.includes(expected)
    );

    if (missingIndexes.length > 0) {
      console.log('❌ Missing expected indexes:');
      missingIndexes.forEach(idx => console.log(`  - ${idx}`));
      console.log('\nRun: npx prisma db push to create missing indexes');
    } else {
      console.log('✅ All expected indexes are present!');
    }

    // Performance recommendations
    console.log('\n📊 Index Analysis:');
    const deviceIndexes = indexesByTable['devices'] || [];
    const customDeviceIndexes = deviceIndexes.filter(idx => 
      !idx.indexname.includes('_pkey') && !idx.indexname.includes('_key')
    );
    
    console.log(`- Devices table has ${customDeviceIndexes.length} custom indexes for search optimization`);
    console.log(`- Total indexes across all tables: ${indexes.length}`);
    
    if (indexes.length >= 15) {
      console.log('✅ Good index coverage for performance');
    } else {
      console.log('⚠️  Consider adding more indexes for better performance');
    }

  } catch (error) {
    console.error('❌ Failed to verify indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyIndexes();