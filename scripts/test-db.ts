#!/usr/bin/env tsx

import { db, prisma } from '../src/lib/database';
import { performHealthCheck, getConnectionInfo, getTableSizes } from '../src/lib/db-health';
import { getDatabaseStats, searchDevices } from '../src/lib/db-utils';

async function testDatabase() {
  console.log('🧪 Testing database connection and utilities...\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    await db.connect();
    console.log('✅ Database connection successful\n');

    // Test health check
    console.log('2. Running health check...');
    const health = await performHealthCheck();
    console.log('Health Status:', health.status);
    console.log('Database Response Time:', health.checks.database.responseTime, 'ms');
    console.log('Indexes Count:', health.checks.indexes.count);
    console.log('✅ Health check completed\n');

    // Test connection info
    console.log('3. Getting connection info...');
    const connInfo = await getConnectionInfo();
    console.log('Database:', connInfo.current_database);
    console.log('User:', connInfo.current_user);
    console.log('Active Connections:', connInfo.activeConnections);
    console.log('Max Connections:', connInfo.maxConnections);
    console.log('✅ Connection info retrieved\n');

    // Test database stats
    console.log('4. Getting database statistics...');
    const stats = await getDatabaseStats();
    console.log('Total Devices:', stats.totalDevices);
    console.log('Verified Devices:', stats.verifiedDevices);
    console.log('Verification Rate:', stats.verificationRate.toFixed(1) + '%');
    console.log('Total Categories:', stats.totalCategories);
    console.log('Total Standards:', stats.totalStandards);
    console.log('Total Users:', stats.totalUsers);
    console.log('✅ Database statistics retrieved\n');

    // Test table sizes
    console.log('5. Getting table sizes...');
    const tableSizes = await getTableSizes();
    tableSizes.forEach(table => {
      console.log(`${table.table_name}: ${table.row_count} rows, ${table.total_size} total, ${table.index_size} indexes`);
    });
    console.log('✅ Table sizes retrieved\n');

    // Test search functionality
    console.log('6. Testing search functionality...');
    const searchResults = await searchDevices({ 
      query: 'PlayStation',
      limit: 5 
    });
    console.log(`Found ${searchResults.length} devices matching "PlayStation"`);
    searchResults.forEach(device => {
      console.log(`- ${device.name} by ${device.brand} (${device.category.name})`);
    });
    console.log('✅ Search functionality tested\n');

    // Test device retrieval
    console.log('7. Testing device retrieval...');
    const allDevices = await prisma.device.findMany({
      include: {
        category: true,
        deviceStandards: {
          include: { standard: true }
        }
      },
      take: 3
    });
    
    console.log(`Retrieved ${allDevices.length} devices:`);
    allDevices.forEach(device => {
      console.log(`- ${device.name}: ${device.deviceStandards.length} standards`);
      device.deviceStandards.forEach(ds => {
        console.log(`  • ${ds.standard.name} (${ds.portCount} ports)`);
      });
    });
    console.log('✅ Device retrieval tested\n');

    console.log('🎉 All database tests passed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run the test
testDatabase();