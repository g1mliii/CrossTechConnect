/**
 * API endpoint for admin audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/audit-log - Create audit log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, action, entityType, entityId, changes, success, errorMessage } = body;

    // Get IP and user agent from headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { data, error } = await supabase
      .from('admin_audit_log')
      .insert({
        id: crypto.randomUUID(),
        admin_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes: changes || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: success !== false,
        error_message: errorMessage || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create audit log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/audit-log - Get audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('admin_audit_log')
      .select('*, admin:users!admin_id(id, email, display_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        logs: data || [],
        total: count || 0,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
