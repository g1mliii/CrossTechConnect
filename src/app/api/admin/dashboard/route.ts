/**
 * API endpoint for admin dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/dashboard - Get dashboard statistics
 */
export async function GET() {
  try {
    // Get counts for main entities
    const [
      categoriesResult,
      devicesResult,
      usersResult,
      verificationsResult,
      recentDevicesResult,
      recentCategoriesResult
    ] = await Promise.all([
      supabase.from('device_categories').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('verification_items').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('devices')
        .select(`
          id, name, brand, created_at,
          device_categories!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('device_categories')
        .select('id, name')
        .order('id', { ascending: false })
        .limit(3)
    ]);

    const totalCategories = categoriesResult.count || 0;
    const totalDevices = devicesResult.count || 0;
    const totalUsers = usersResult.count || 0;
    const pendingVerifications = verificationsResult.count || 0;
    const recentDevices = recentDevicesResult.data || [];
    const recentCategories = recentCategoriesResult.data || [];

    // Build recent activity from recent devices and categories
    const recentActivity = [
      ...recentDevices.map((device: any) => ({
        id: `device_${device.id}`,
        type: 'device_added' as const,
        description: `Device "${device.name}" by ${device.brand} added to ${device.device_categories?.name || 'Unknown Category'}`,
        timestamp: new Date(device.created_at),
        user: 'System'
      })),
      ...recentCategories.map((category: any) => ({
        id: `category_${category.id}`,
        type: 'category_created' as const,
        description: `Category "${category.name}" created`,
        timestamp: new Date(), // Categories don't have createdAt in current schema
        user: 'System'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    // System health check
    const systemHealth: {
      status: 'healthy' | 'warning' | 'error';
      issues: string[];
      lastCheck: Date;
    } = {
      status: 'healthy',
      issues: [],
      lastCheck: new Date()
    };

    // Check for potential issues
    const unverifiedResult = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('verified', false);

    const unverifiedDevices = unverifiedResult.count || 0;

    if (unverifiedDevices > 0 && totalDevices > 0 && unverifiedDevices > totalDevices * 0.5) {
      systemHealth.status = 'warning';
      systemHealth.issues.push(`${unverifiedDevices} devices need verification`);
    }

    if (pendingVerifications > 50) {
      systemHealth.status = 'warning';
      systemHealth.issues.push(`${pendingVerifications} pending verifications`);
    }

    const stats = {
      totalCategories,
      totalDevices,
      totalUsers,
      pendingVerifications,
      recentActivity,
      systemHealth
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}