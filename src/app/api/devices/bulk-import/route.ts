/**
 * API endpoint for bulk device import
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ImportMapping {
  sourceColumn: string;
  targetField: string;
  transformation?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'number' | 'boolean' | 'array' | 'json';
  defaultValue?: any;
}

interface ImportError {
  row: number;
  column: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
}

/**
 * POST /api/devices/bulk-import - Import devices from CSV/JSON file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const mappingsJson = formData.get('mappings') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !categoryId || !mappingsJson) {
      return NextResponse.json(
        { success: false, error: 'File, categoryId, and mappings are required' },
        { status: 400 }
      );
    }

    const mappings: ImportMapping[] = JSON.parse(mappingsJson);

    // Validate category exists and get schema
    const { data: category } = await supabase
      .from('device_categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get category schema for validation
    const { data: schema } = await supabase
      .from('device_category_schemas')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Parse file content
    const fileContent = await file.text();
    let rows: any[][] = [];
    let headers: string[] = [];

    if (fileType === 'csv') {
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return NextResponse.json(
          { success: false, error: 'File is empty' },
          { status: 400 }
        );
      }

      headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
    } else if (fileType === 'json') {
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json(
          { success: false, error: 'JSON must be a non-empty array of objects' },
          { status: 400 }
        );
      }

      headers = Object.keys(data[0]);
      rows = data.map(obj => headers.map(h => obj[h]));
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Process rows and import devices
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    };

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      try {
        // Transform row data according to mappings
        const deviceData: any = {
          category_id: categoryId,
          extraction_method: 'bulk_import',
          verified: false,
          confidence_score: 0.8
        };

        const specifications: any = {};
        let hasRequiredFields = false;

        for (const mapping of mappings) {
          if (!mapping.targetField) continue;

          const columnIndex = headers.indexOf(mapping.sourceColumn);
          let value = columnIndex >= 0 ? row[columnIndex] : mapping.defaultValue;

          // Apply transformations
          if (value !== null && value !== undefined && value !== '') {
            value = applyTransformation(value, mapping.transformation || 'none');
          }

          // Map to device fields or specifications
          if (['name', 'brand', 'model', 'description', 'manual_url'].includes(mapping.targetField)) {
            deviceData[mapping.targetField] = value;
            if (mapping.targetField === 'name' || mapping.targetField === 'brand') {
              hasRequiredFields = true;
            }
          } else if (['width_cm', 'height_cm', 'depth_cm', 'weight_kg', 'power_watts'].includes(mapping.targetField)) {
            if (value !== null && value !== undefined && value !== '') {
              deviceData[mapping.targetField] = parseFloat(value) || null;
            }
          } else {
            // Category-specific specification
            specifications[mapping.targetField] = value;
          }
        }

        // Validate required fields
        if (!deviceData.name || !deviceData.brand) {
          result.errors.push({
            row: rowIndex + 1,
            column: '',
            field: 'name/brand',
            message: 'Device name and brand are required',
            severity: 'error'
          });
          result.failed++;
          continue;
        }

        // Create device
        const { data: device, error: deviceError } = await supabase
          .from('devices')
          .insert(deviceData)
          .select()
          .single();

        if (deviceError) {
          result.errors.push({
            row: rowIndex + 1,
            column: '',
            field: 'device',
            message: `Failed to create device: ${deviceError.message}`,
            severity: 'error'
          });
          result.failed++;
          continue;
        }

        // Create device specifications if we have schema and specifications
        if (schema && Object.keys(specifications).length > 0) {
          const { error: specError } = await supabase
            .from('device_specifications')
            .insert({
              device_id: device.id,
              category_id: categoryId,
              schema_version: schema.version,
              specifications,
              confidence_scores: Object.keys(specifications).reduce((acc, key) => {
                acc[key] = 0.8; // Default confidence for bulk import
                return acc;
              }, {} as Record<string, number>)
            });

          if (specError) {
            console.warn(`Failed to create specifications for device ${device.id}:`, specError);
            // Don't fail the import for specification errors
          }
        }

        result.imported++;

      } catch (error) {
        result.errors.push({
          row: rowIndex + 1,
          column: '',
          field: 'general',
          message: `Failed to process row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
        result.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error during bulk import:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bulk import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Apply transformation to a value based on the transformation type
 */
function applyTransformation(value: any, transformation: string): any {
  if (value === null || value === undefined) return value;

  switch (transformation) {
    case 'lowercase':
      return String(value).toLowerCase();
    
    case 'uppercase':
      return String(value).toUpperCase();
    
    case 'trim':
      return String(value).trim();
    
    case 'number':
      const num = parseFloat(String(value));
      return isNaN(num) ? null : num;
    
    case 'boolean':
      const str = String(value).toLowerCase();
      return ['true', '1', 'yes', 'on'].includes(str);
    
    case 'array':
      return String(value).split(',').map(item => item.trim()).filter(item => item.length > 0);
    
    case 'json':
      try {
        return JSON.parse(String(value));
      } catch {
        return value; // Return original value if JSON parsing fails
      }
    
    case 'none':
    default:
      return value;
  }
}