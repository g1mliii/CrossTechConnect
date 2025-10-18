/**
 * API endpoint for schema change impact analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/categories/[id]/schema/impact - Analyze impact of schema changes
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    const { currentVersion, newFields, removedFields, modifiedFields } = body;

    // Get count of devices using this category
    const { count: deviceCount, error: deviceError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id);

    if (deviceError) {
      throw deviceError;
    }

    // Get count of device specifications using current schema version
    const { count: specCount, error: specError } = await supabase
      .from('device_specifications')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('schema_version', currentVersion || '1.0');

    if (specError) {
      throw specError;
    }

    // Analyze breaking changes
    const breakingChanges: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Check for removed fields
    if (removedFields && removedFields.length > 0) {
      breakingChanges.push(`${removedFields.length} field(s) will be removed: ${removedFields.join(', ')}`);
      warnings.push(`Data in removed fields will be lost for ${specCount || 0} device(s)`);
    }

    // Check for modified fields
    if (modifiedFields && modifiedFields.length > 0) {
      warnings.push(`${modifiedFields.length} field(s) will be modified: ${modifiedFields.join(', ')}`);
      warnings.push('Existing data may need validation against new constraints');
    }

    // Check for new required fields
    if (newFields && newFields.length > 0) {
      const requiredNewFields = newFields.filter((f: { required?: boolean }) => f.required);
      if (requiredNewFields.length > 0) {
        breakingChanges.push(`${requiredNewFields.length} new required field(s) added`);
        warnings.push(`${specCount || 0} existing device(s) will need values for new required fields`);
      } else {
        info.push(`${newFields.length} new optional field(s) added`);
      }
    }

    // Determine change severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (breakingChanges.length > 0) {
      severity = 'high';
    } else if (warnings.length > 0) {
      severity = 'medium';
    }

    return NextResponse.json({
      success: true,
      data: {
        affectedDevices: deviceCount || 0,
        affectedSpecifications: specCount || 0,
        severity,
        breakingChanges,
        warnings,
        info,
        requiresMigration: breakingChanges.length > 0 || warnings.length > 0,
        canAutoMigrate: removedFields?.length === 0 && modifiedFields?.length === 0
      }
    });

  } catch (error) {
    console.error('Error analyzing schema impact:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze schema impact',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
