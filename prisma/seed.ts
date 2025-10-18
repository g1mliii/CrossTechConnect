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

  // Create a test user for schema creation
  const testUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: '$2a$10$dummyhashforseeding',
      displayName: 'Admin User',
      reputationScore: 100
    }
  });

  // Create category schemas with dynamic fields
  const gamingSchema = await prisma.deviceCategorySchema.create({
    data: {
      categoryId: gamingCategory.id,
      version: '1.0',
      name: 'Gaming Console Schema',
      description: 'Schema for gaming console specifications',
      fields: {
        resolution: {
          type: 'enum',
          label: 'Maximum Resolution',
          description: 'Highest supported output resolution',
          required: true,
          options: ['1080p', '1440p', '4K', '8K']
        },
        refreshRate: {
          type: 'number',
          label: 'Refresh Rate',
          description: 'Maximum refresh rate in Hz',
          unit: 'Hz',
          required: true,
          min: 30,
          max: 240
        },
        storageCapacity: {
          type: 'number',
          label: 'Storage Capacity',
          description: 'Internal storage capacity',
          unit: 'GB',
          required: true,
          min: 0
        },
        rayTracingSupport: {
          type: 'boolean',
          label: 'Ray Tracing Support',
          description: 'Hardware-accelerated ray tracing',
          default: false
        },
        vrSupport: {
          type: 'boolean',
          label: 'VR Support',
          description: 'Virtual reality headset support',
          default: false
        },
        backwardCompatibility: {
          type: 'array',
          label: 'Backward Compatibility',
          description: 'Previous generation consoles supported',
          placeholder: 'PS4, PS3'
        }
      },
      requiredFields: ['resolution', 'refreshRate', 'storageCapacity'],
      inheritedFields: [],
      createdBy: testUser.id
    }
  });

  const monitorSchema = await prisma.deviceCategorySchema.create({
    data: {
      categoryId: monitorCategory.id,
      version: '1.0',
      name: 'Monitor Schema',
      description: 'Schema for monitor/display specifications',
      fields: {
        panelType: {
          type: 'enum',
          label: 'Panel Type',
          description: 'Display panel technology',
          required: true,
          options: ['IPS', 'VA', 'TN', 'OLED', 'Mini-LED', 'Micro-LED']
        },
        screenSize: {
          type: 'number',
          label: 'Screen Size',
          description: 'Diagonal screen size',
          unit: 'inches',
          required: true,
          min: 10,
          max: 100
        },
        nativeResolution: {
          type: 'string',
          label: 'Native Resolution',
          description: 'Native display resolution',
          required: true,
          placeholder: '3840x2160'
        },
        refreshRate: {
          type: 'number',
          label: 'Refresh Rate',
          description: 'Maximum refresh rate',
          unit: 'Hz',
          required: true,
          min: 30,
          max: 500
        },
        responseTime: {
          type: 'number',
          label: 'Response Time',
          description: 'Pixel response time',
          unit: 'ms',
          min: 0.1,
          max: 20
        },
        hdrSupport: {
          type: 'array',
          label: 'HDR Support',
          description: 'Supported HDR formats',
          placeholder: 'HDR10, Dolby Vision'
        },
        adaptiveSync: {
          type: 'enum',
          label: 'Adaptive Sync',
          description: 'Variable refresh rate technology',
          options: ['None', 'FreeSync', 'G-Sync', 'G-Sync Compatible', 'Both']
        },
        curvature: {
          type: 'string',
          label: 'Curvature',
          description: 'Screen curvature radius (e.g., 1000R)',
          placeholder: '1000R'
        }
      },
      requiredFields: ['panelType', 'screenSize', 'nativeResolution', 'refreshRate'],
      inheritedFields: [],
      createdBy: testUser.id
    }
  });

  // Create device specifications for existing devices
  await prisma.deviceSpecification.create({
    data: {
      deviceId: ps5.id,
      categoryId: gamingCategory.id,
      schemaVersion: '1.0',
      specifications: {
        resolution: '4K',
        refreshRate: 120,
        storageCapacity: 825,
        rayTracingSupport: true,
        vrSupport: true,
        backwardCompatibility: ['PS4']
      }
    }
  });

  await prisma.deviceSpecification.create({
    data: {
      deviceId: lgC1.id,
      categoryId: monitorCategory.id,
      schemaVersion: '1.0',
      specifications: {
        panelType: 'OLED',
        screenSize: 55,
        nativeResolution: '3840x2160',
        refreshRate: 120,
        responseTime: 1,
        hdrSupport: ['HDR10', 'Dolby Vision', 'HLG'],
        adaptiveSync: 'Both',
        curvature: 'Flat'
      }
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.deviceCategory.count()} device categories`);
  console.log(`Created ${await prisma.standard.count()} technical standards`);
  console.log(`Created ${await prisma.device.count()} devices`);
  console.log(`Created ${await prisma.compatibilityRule.count()} compatibility rules`);
  console.log(`Created ${await prisma.deviceCategorySchema.count()} category schemas`);
  console.log(`Created ${await prisma.deviceSpecification.count()} device specifications`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });