import { Prisma } from '@prisma/client';
import { prisma, handlePrismaError, withRetry } from './database';

// Device search utilities
export const searchDevices = async (params: {
  query?: string;
  categoryId?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minDepth?: number;
  maxDepth?: number;
  minPower?: number;
  maxPower?: number;
  standards?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: Prisma.DeviceWhereInput = {};

    // Text search
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { brand: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    // Dimension filters
    if (params.minWidth !== undefined || params.maxWidth !== undefined) {
      where.widthCm = {};
      if (params.minWidth !== undefined) where.widthCm.gte = params.minWidth;
      if (params.maxWidth !== undefined) where.widthCm.lte = params.maxWidth;
    }

    if (params.minHeight !== undefined || params.maxHeight !== undefined) {
      where.heightCm = {};
      if (params.minHeight !== undefined) where.heightCm.gte = params.minHeight;
      if (params.maxHeight !== undefined) where.heightCm.lte = params.maxHeight;
    }

    if (params.minDepth !== undefined || params.maxDepth !== undefined) {
      where.depthCm = {};
      if (params.minDepth !== undefined) where.depthCm.gte = params.minDepth;
      if (params.maxDepth !== undefined) where.depthCm.lte = params.maxDepth;
    }

    // Power filter
    if (params.minPower !== undefined || params.maxPower !== undefined) {
      where.powerWatts = {};
      if (params.minPower !== undefined) where.powerWatts.gte = params.minPower;
      if (params.maxPower !== undefined) where.powerWatts.lte = params.maxPower;
    }

    // Standards filter
    if (params.standards && params.standards.length > 0) {
      where.deviceStandards = {
        some: {
          standard: {
            id: { in: params.standards }
          }
        }
      };
    }

    // Verification filter
    if (params.verified !== undefined) {
      where.verified = params.verified;
    }

    return await withRetry(() =>
      prisma.device.findMany({
        where,
        include: {
          category: true,
          deviceStandards: {
            include: {
              standard: true,
            },
          },
        },
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: [
          { verified: 'desc' },
          { confidenceScore: 'desc' },
          { createdAt: 'desc' },
        ],
      })
    );
  } catch (error) {
    handlePrismaError(error);
  }
};

// Get device with full details
export const getDeviceById = async (id: string) => {
  try {
    return await withRetry(() =>
      prisma.device.findUnique({
        where: { id },
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              displayName: true,
              reputationScore: true,
            },
          },
          deviceStandards: {
            include: {
              standard: true,
            },
          },
          verificationItems: {
            where: { status: 'pending' },
            take: 5,
          },
        },
      })
    );
  } catch (error) {
    handlePrismaError(error);
  }
};

// Compatibility checking utilities
export const checkDeviceCompatibility = async (device1Id: string, device2Id: string) => {
  try {
    // Get both devices with their standards
    const [device1, device2] = await Promise.all([
      prisma.device.findUnique({
        where: { id: device1Id },
        include: {
          deviceStandards: {
            include: { standard: true },
          },
        },
      }),
      prisma.device.findUnique({
        where: { id: device2Id },
        include: {
          deviceStandards: {
            include: { standard: true },
          },
        },
      }),
    ]);

    if (!device1 || !device2) {
      throw new Error('One or both devices not found');
    }

    // Find common standards
    const device1Standards = device1.deviceStandards.map(ds => ds.standard);
    const device2Standards = device2.deviceStandards.map(ds => ds.standard);

    const compatibilityResults = [];

    for (const std1 of device1Standards) {
      for (const std2 of device2Standards) {
        // Check for direct compatibility (same standard)
        if (std1.id === std2.id) {
          compatibilityResults.push({
            standard1: std1,
            standard2: std2,
            compatibility: 'full' as const,
            description: `Both devices support ${std1.name}`,
          });
          continue;
        }

        // Check for compatibility rules
        const rule = await prisma.compatibilityRule.findFirst({
          where: {
            OR: [
              { standardAId: std1.id, standardBId: std2.id },
              { standardAId: std2.id, standardBId: std1.id },
            ],
          },
          include: {
            standardA: true,
            standardB: true,
          },
        });

        if (rule) {
          compatibilityResults.push({
            standard1: std1,
            standard2: std2,
            compatibility: rule.compatibilityType as 'full' | 'partial' | 'none',
            description: rule.description || '',
            limitations: rule.limitations,
          });
        }
      }
    }

    return {
      device1,
      device2,
      compatibilityResults,
      overallCompatibility: compatibilityResults.length > 0 
        ? compatibilityResults.some(r => r.compatibility === 'full') 
          ? 'full' 
          : compatibilityResults.some(r => r.compatibility === 'partial') 
            ? 'partial' 
            : 'none'
        : 'none',
    };
  } catch (error) {
    handlePrismaError(error);
  }
};

// User device library utilities
export const getUserDevices = async (userId: string) => {
  try {
    return await withRetry(() =>
      prisma.userDevice.findMany({
        where: { userId },
        include: {
          device: {
            include: {
              category: true,
              deviceStandards: {
                include: {
                  standard: true,
                },
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      })
    );
  } catch (error) {
    handlePrismaError(error);
  }
};

// Verification utilities
export const getVerificationQueue = async (limit: number = 20) => {
  try {
    return await withRetry(() =>
      prisma.verificationItem.findMany({
        where: { status: 'pending' },
        include: {
          device: {
            select: {
              id: true,
              name: true,
              brand: true,
            },
          },
          verificationVotes: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  reputationScore: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'asc' },
      })
    );
  } catch (error) {
    handlePrismaError(error);
  }
};

// Statistics utilities
export const getDatabaseStats = async () => {
  try {
    const [
      totalDevices,
      verifiedDevices,
      totalCategories,
      totalStandards,
      pendingVerifications,
      totalUsers,
    ] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { verified: true } }),
      prisma.deviceCategory.count(),
      prisma.standard.count(),
      prisma.verificationItem.count({ where: { status: 'pending' } }),
      prisma.user.count(),
    ]);

    return {
      totalDevices,
      verifiedDevices,
      unverifiedDevices: totalDevices - verifiedDevices,
      verificationRate: totalDevices > 0 ? (verifiedDevices / totalDevices) * 100 : 0,
      totalCategories,
      totalStandards,
      pendingVerifications,
      totalUsers,
    };
  } catch (error) {
    handlePrismaError(error);
  }
};

// Bulk operations
export const bulkCreateDevices = async (devices: Prisma.DeviceCreateManyInput[]) => {
  try {
    return await withRetry(() =>
      prisma.device.createMany({
        data: devices,
        skipDuplicates: true,
      })
    );
  } catch (error) {
    handlePrismaError(error);
  }
};

// Search suggestions
export const getSearchSuggestions = async (query: string, limit: number = 10) => {
  try {
    const [devices, brands, categories] = await Promise.all([
      // Device name suggestions
      prisma.device.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: { name: true },
        take: limit,
        distinct: ['name'],
      }),
      // Brand suggestions
      prisma.device.findMany({
        where: {
          brand: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: { brand: true },
        take: limit,
        distinct: ['brand'],
      }),
      // Category suggestions
      prisma.deviceCategory.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: { name: true },
        take: limit,
      }),
    ]);

    return {
      devices: devices.map(d => d.name),
      brands: brands.map(b => b.brand),
      categories: categories.map(c => c.name),
    };
  } catch (error) {
    handlePrismaError(error);
  }
};