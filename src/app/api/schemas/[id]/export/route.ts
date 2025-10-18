/**
 * API endpoint for exporting category schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { schemaRegistry } from '@/lib/schema/registry';
import { prisma } from '@/lib/database';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/schemas/[id]/export - Export a category schema as JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await schemaRegistry.initialize();
        const resolvedParams = await params;

        const { searchParams } = new URL(request.url);
        const version = searchParams.get('version');
        const includeDevices = searchParams.get('includeDevices') === 'true';

        // Get the schema
        const schema = schemaRegistry.getSchema(resolvedParams.id, version || undefined);
        if (!schema) {
            return NextResponse.json(
                { success: false, error: 'Schema not found' },
                { status: 404 }
            );
        }

        // Get category information
        const category = await prisma.deviceCategory.findUnique({
            where: { id: resolvedParams.id },
            include: {
                parent: true,
                children: true
            }
        });

        let exportData: any = {
            schema,
            category: category ? {
                id: category.id,
                name: category.name,
                parentId: category.parentId,
                parent: category.parent ? {
                    id: category.parent.id,
                    name: category.parent.name
                } : null,
                children: category.children.map(child => ({
                    id: child.id,
                    name: child.name
                }))
            } : null,
            exportedAt: new Date().toISOString(),
            exportVersion: '1.0.0',
            metadata: {
                source: 'device-compatibility-platform',
                version: '1.0.0',
                description: 'Device category schema export'
            }
        };

        // Include sample devices if requested
        if (includeDevices) {
            const devices = await prisma.device.findMany({
              where: { categoryId: resolvedParams.id },
              take: 10, // Limit to 10 sample devices
              include: {
                deviceSpecification: true
              }
            });

            exportData.sampleDevices = devices.map((device) => ({
                id: device.id,
                name: device.name,
                brand: device.brand,
                model: device.model,
                specifications: device.deviceSpecification?.specifications || {}
            }));
        }

        // Get migration history
        const migrations = await prisma.schemaMigration.findMany({
          where: { categoryId: resolvedParams.id },
          orderBy: { createdAt: 'asc' }
        });

        exportData.migrationHistory = migrations.map((migration) => ({
            id: migration.id,
            fromVersion: migration.fromVersion,
            toVersion: migration.toVersion,
            operations: migration.operations,
            createdAt: migration.createdAt,
            appliedAt: migration.appliedAt
        }));

        // Return as downloadable JSON
        const response = new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${schema.name.replace(/\s+/g, '-').toLowerCase()}-schema.json"`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting schema:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to export schema',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}