import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create device categories
  const gamingCategory = await prisma.deviceCategory.create({
    data: {
      name: 'Gaming',
      attributes: {
        supportedResolutions: ['1080p', '1440p', '4K'],
        refreshRates: ['60Hz', '120Hz', '144Hz'],
      },
    },
  });

  const pcCategory = await prisma.deviceCategory.create({
    data: {
      name: 'PC Components',
      attributes: {
        formFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
        socketTypes: ['AM4', 'AM5', 'LGA1700'],
      },
    },
  });

  const monitorCategory = await prisma.deviceCategory.create({
    data: {
      name: 'Monitors',
      attributes: {
        panelTypes: ['IPS', 'VA', 'TN', 'OLED'],
        aspectRatios: ['16:9', '21:9', '32:9'],
      },
    },
  });

  // Create technical standards
  const hdmi21 = await prisma.standard.create({
    data: {
      name: 'HDMI 2.1',
      category: 'video',
      version: '2.1',
      specifications: {
        bandwidth: '48 Gbps',
        maxResolution: '8K@60Hz',
        features: ['VRR', 'ALLM', 'eARC'],
      },
    },
  });

  const hdmi20 = await prisma.standard.create({
    data: {
      name: 'HDMI 2.0',
      category: 'video',
      version: '2.0',
      specifications: {
        bandwidth: '18 Gbps',
        maxResolution: '4K@60Hz',
        features: ['HDR'],
      },
    },
  });

  const usbcPd = await prisma.standard.create({
    data: {
      name: 'USB-C PD',
      category: 'power',
      version: '3.0',
      specifications: {
        maxPower: '100W',
        voltages: ['5V', '9V', '15V', '20V'],
      },
    },
  });

  // Create compatibility rules
  await prisma.compatibilityRule.create({
    data: {
      standardAId: hdmi21.id,
      standardBId: hdmi20.id,
      compatibilityType: 'partial',
      description: 'HDMI 2.1 devices can connect to HDMI 2.0 ports with reduced capabilities',
      limitations: ['Limited to HDMI 2.0 bandwidth', 'No VRR support', 'No ALLM support'],
    },
  });

  // Create sample devices
  const ps5 = await prisma.device.create({
    data: {
      name: 'PlayStation 5',
      brand: 'Sony',
      model: 'CFI-1215A',
      categoryId: gamingCategory.id,
      widthCm: 39.0,
      heightCm: 10.4,
      depthCm: 26.0,
      weightKg: 4.5,
      powerWatts: 200,
      powerType: 'AC',
      description: 'Next-generation gaming console with 4K gaming capabilities',
      verified: true,
      confidenceScore: 1.0,
      extractionMethod: 'manual',
    },
  });

  const lgC1 = await prisma.device.create({
    data: {
      name: 'LG C1 OLED',
      brand: 'LG',
      model: 'OLED55C1PUB',
      categoryId: monitorCategory.id,
      widthCm: 122.8,
      heightCm: 70.4,
      depthCm: 4.6,
      weightKg: 18.7,
      powerWatts: 120,
      powerType: 'AC',
      description: '55-inch OLED TV with gaming features',
      verified: true,
      confidenceScore: 1.0,
      extractionMethod: 'manual',
    },
  });

  // Link devices to standards
  await prisma.deviceStandard.create({
    data: {
      deviceId: ps5.id,
      standardId: hdmi21.id,
      portCount: 1,
      verified: true,
    },
  });

  await prisma.deviceStandard.create({
    data: {
      deviceId: lgC1.id,
      standardId: hdmi21.id,
      portCount: 4,
      verified: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.deviceCategory.count()} device categories`);
  console.log(`Created ${await prisma.standard.count()} technical standards`);
  console.log(`Created ${await prisma.device.count()} devices`);
  console.log(`Created ${await prisma.compatibilityRule.count()} compatibility rules`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });