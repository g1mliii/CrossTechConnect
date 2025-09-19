#!/usr/bin/env tsx
/**
 * Test API endpoints directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const categories = await prisma.deviceCategory.findMany({
      include: {
        _count: {
          select: { devices: true }
        }
      }
    });
    
    console.log('✅ Categories found:', categories.length);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat._count.devices} devices)`);
    });
    
    const devices = await prisma.device.findMany({
      include: {
        category: true
      }
    });
    
    console.log('✅ Devices found:', devices.length);
    devices.forEach(device => {
      console.log(`  - ${device.name} by ${device.brand} (${device.category.name})`);
    });
    
    // Test dashboard stats
    const stats = {
      totalCategories: await prisma.deviceCategory.count(),
      totalDevices: await prisma.device.count(),
      totalUsers: await prisma.user.count(),
      pendingVerifications: await prisma.verificationItem.count({
        where: { status: 'pending' }
      })
    };
    
    console.log('📊 Dashboard stats:', stats);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();