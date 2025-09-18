/**
 * API endpoints for performance monitoring and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

/**
 * GET /api/admin/performance - Get performance metrics and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type'); // metrics, recommendations, summary

    switch (type) {
      case 'metrics':
        if (categoryId) {
          const metrics = await performanceMonitor.getCategoryMetrics(categoryId);
          return NextResponse.json({
            success: true,
            data: metrics
          });
        } else {
          const allMetrics = await performanceMonitor.getAllCategoryMetrics();
          return NextResponse.json({
            success: true,
            data: allMetrics,
            count: allMetrics.length
          });
        }

      case 'recommendations':
        const recommendations = await performanceMonitor.getOptimizationRecommendations(categoryId || undefined);
        return NextResponse.json({
          success: true,
          data: recommendations,
          count: recommendations.length
        });

      case 'summary':
        const summary = await performanceMonitor.getSystemSummary();
        return NextResponse.json({
          success: true,
          data: summary
        });

      default:
        // Return both metrics and recommendations
        const [metrics, recs] = await Promise.all([
          categoryId 
            ? performanceMonitor.getCategoryMetrics(categoryId)
            : performanceMonitor.getAllCategoryMetrics(),
          performanceMonitor.getOptimizationRecommendations(categoryId || undefined)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            metrics: Array.isArray(metrics) ? metrics : [metrics],
            recommendations: recs
          }
        });
    }

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/performance - Track performance metrics or clear cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, categoryId, queryType, duration, success } = body;

    switch (action) {
      case 'track_query':
        if (!categoryId || !queryType || duration === undefined) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for query tracking' },
            { status: 400 }
          );
        }

        await performanceMonitor.trackQuery(categoryId, queryType, duration, success !== false);
        return NextResponse.json({
          success: true,
          message: 'Query performance tracked'
        });

      case 'clear_cache':
        performanceMonitor.clearCache(categoryId);
        return NextResponse.json({
          success: true,
          message: categoryId ? `Cache cleared for category ${categoryId}` : 'All cache cleared'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing performance request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process performance request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}