#!/usr/bin/env tsx
/**
 * Quick database check and seed script
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check if we can connect
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check existing data
    const categoryCount = await prisma.deviceCategory.count();
    const deviceCount = await prisma.device.count();
    const userCount = await prisma.user.count();
    
    console.log(`📊 Current data:`);
    console.log(`  - Categories: ${categoryCount}`);
    console.log(`  - Devices: ${deviceCount}`);
    console.log(`  - Users: ${userCount}`);
    
    // If no data, add some basic seed data
    if (categoryCount === 0) {
      console.log('🌱 Adding seed categories...');
      
      const categories = await prisma.deviceCategory.createMany({
        data: [
          { id: 'cat_gaming', name: 'Gaming Consoles' },
          { id: 'cat_mobile', name: 'Mobile Devices' },
          { id: 'cat_audio', name: 'Audio Equipment' },
          { id: 'cat_display', name: 'Displays & Monitors' },
          { id: 'cat_storage', name: 'Storage Devices' }
        ]
      });
      
      console.log(`✅ Created ${categories.count} categories`);
    }
    
    if (deviceCount === 0) {
      console.log('🌱 Adding seed devices...');
      
      const devices = await prisma.device.createMany({
        data: [
          {
            name: 'PlayStation 5',
            brand: 'Sony',
            model: 'CFI-1215A',
            categoryId: 'cat_gaming',
            widthCm: 39.0,
            heightCm: 10.4,
            depthCm: 26.0,
            weightKg: 4.5,
            powerWatts: 200,
            powerType: 'AC',
            verified: true,
            confidenceScore: 1.0,
            extractionMethod: 'manual'
          },
          {
            name: 'Xbox Series X',
            brand: 'Microsoft',
            model: 'RRT-00001',
            categoryId: 'cat_gaming',
            widthCm: 15.1,
            heightCm: 30.1,
            depthCm: 15.1,
            weightKg: 4.45,
            powerWatts: 153,
            powerType: 'AC',
            verified: true,
            confidenceScore: 1.0,
            extractionMethod: 'manual'
          },
          {
            name: 'iPhone 15 Pro',
            brand: 'Apple',
            model: 'A3108',
            categoryId: 'cat_mobile',
            widthCm: 7.67,
            heightCm: 14.67,
            depthCm: 0.83,
            weightKg: 0.187,
            powerWatts: 25,
            powerType: 'USB-C',
            verified: true,
            confidenceScore: 1.0,
            extractionMethod: 'manual'
          }
        ]
      });
      
      console.log(`✅ Created ${devices.count} devices`);
    }
    
    // Final count
    const finalCategoryCount = await prisma.deviceCategory.count();
    const finalDeviceCount = await prisma.device.count();
    
    console.log(`🎉 Database ready with:`);
    console.log(`  - Categories: ${finalCategoryCount}`);
    console.log(`  - Devices: ${finalDeviceCount}`);
    
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();