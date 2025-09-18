/**
 * Performance Monitor - Tracks category performance and optimization metrics
 */

import { prisma } from '../database';

export interface PerformanceMetrics {
  categoryId: string;
  categoryName: string;
  
  // Query Performance
  avgQueryTime: number;
  slowQueries: number;
  queryCount: number;
  
  // Index Performance
  indexUsage: IndexUsageMetric[];
  missingIndexes: string[];
  
  // Data Quality
  validationErrors: number;
  confidenceScore: number;
  verificationRate: number;
  
  // Usage Metrics
  searchCount: number;
  deviceCount: number;
  userInteractions: number;
  
  // Resource Usage
  storageSize: number;
  memoryUsage: number;
  
  // Timestamps
  lastUpdated: Date;
  measurementPeriod: string;
}

export interface IndexUsageMetric {
  indexName: string;
  fieldName: string;
  usageCount: number;
  avgQueryTime: number;
  effectiveness: number; // 0-1 score
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'schema' | 'data_quality';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: string;
  action: string;
  categoryId?: string;
  fieldName?: string;
}

export class PerformanceMonitor {
  private metricsCache: Map<string, PerformanceMetrics> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get performance metrics for a category
   */
  async getCategoryMetrics(categoryId: string): Promise<PerformanceMetrics> {
    // Check cache first
    const cached = this.metricsCache.get(categoryId);
    const expiry = this.cacheExpiry.get(categoryId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    // Calculate fresh metrics
    const metrics = await this.calculateMetrics(categoryId);
    
    // Cache the results
    this.metricsCache.set(categoryId, metrics);
    this.cacheExpiry.set(categoryId, Date.now() + this.CACHE_TTL);
    
    return metrics;
  }

  /**
   * Get metrics for all categories
   */
  async getAllCategoryMetrics(): Promise<PerformanceMetrics[]> {
    const categories = await prisma.deviceCategory.findMany({
      select: { id: true }
    });

    const metrics = await Promise.all(
      categories.map(category => this.getCategoryMetrics(category.id))
    );

    return metrics;
  }

  /**
   * Generate optimization recommendations
   */
  async getOptimizationRecommendations(categoryId?: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (categoryId) {
      const metrics = await this.getCategoryMetrics(categoryId);
      recommendations.push(...this.analyzeCategory(metrics));
    } else {
      const allMetrics = await this.getAllCategoryMetrics();
      for (const metrics of allMetrics) {
        recommendations.push(...this.analyzeCategory(metrics));
      }
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Track query performance
   */
  async trackQuery(categoryId: string, queryType: string, duration: number, success: boolean): Promise<void> {
    // In a real implementation, this would log to a metrics database
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query tracked: ${categoryId} - ${queryType} - ${duration}ms - ${success ? 'success' : 'failed'}`);
    }

    // TODO: Store in metrics database or send to monitoring service
  }

  /**
   * Calculate performance metrics for a category
   */
  private async calculateMetrics(categoryId: string): Promise<PerformanceMetrics> {
    const category = await prisma.deviceCategory.findUnique({
      where: { id: categoryId },
      select: { name: true }
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Get device count - mock for now since table structure is different
    const deviceCount = 10; // await prisma.device.count({
    //   where: { categoryId }
    // });

    // Get specification data - mock for now since table doesn't exist yet
    const specifications: any[] = []; // await prisma.deviceSpecification.findMany({
    //   where: { categoryId },
    //   select: {
    //     validationErrors: true,
    //     confidenceScores: true,
    //     verificationStatus: true
    //   }
    // });

    // Calculate validation metrics
    const totalValidationErrors = specifications.reduce((sum: number, spec: any) => {
      const errors = spec.validationErrors as any[];
      return sum + (errors?.length || 0);
    }, 0);

    // Calculate average confidence score
    const confidenceScores = specifications.flatMap((spec: any) => {
      const scores = spec.confidenceScores as Record<string, number> || {};
      return Object.values(scores);
    });
    const avgConfidenceScore = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum: number, score: number) => sum + score, 0) / confidenceScores.length 
      : 0;

    // Calculate verification rate
    const verifiedFields = specifications.reduce((sum: number, spec: any) => {
      const status = spec.verificationStatus as Record<string, string> || {};
      return sum + Object.values(status).filter((s: string) => s === 'verified').length;
    }, 0);
    const totalFields = specifications.reduce((sum: number, spec: any) => {
      const status = spec.verificationStatus as Record<string, string> || {};
      return sum + Object.keys(status).length;
    }, 0);
    const verificationRate = totalFields > 0 ? verifiedFields / totalFields : 0;

    // Get index usage (mock data for now)
    const indexUsage = await this.getIndexUsage(categoryId);

    // Mock query performance data
    const avgQueryTime = Math.random() * 100 + 50; // 50-150ms
    const slowQueries = Math.floor(Math.random() * 10);
    const queryCount = Math.floor(Math.random() * 1000) + 100;

    return {
      categoryId,
      categoryName: category.name,
      avgQueryTime,
      slowQueries,
      queryCount,
      indexUsage,
      missingIndexes: await this.findMissingIndexes(categoryId),
      validationErrors: totalValidationErrors,
      confidenceScore: avgConfidenceScore,
      verificationRate,
      searchCount: Math.floor(Math.random() * 500) + 50,
      deviceCount,
      userInteractions: Math.floor(Math.random() * 200) + 20,
      storageSize: deviceCount * 1024, // Rough estimate in bytes
      memoryUsage: deviceCount * 512, // Rough estimate in bytes
      lastUpdated: new Date(),
      measurementPeriod: '24h'
    };
  }

  /**
   * Get index usage metrics
   */
  private async getIndexUsage(categoryId: string): Promise<IndexUsageMetric[]> {
    // Mock for now since table doesn't exist yet
    const indexes: any[] = []; // await prisma.dynamicIndex.findMany({
    //   where: { categoryId }
    // });

    return indexes.map((index: any) => ({
      indexName: index.indexName,
      fieldName: index.fieldName,
      usageCount: Math.floor(Math.random() * 100) + 10,
      avgQueryTime: Math.random() * 50 + 10,
      effectiveness: Math.random() * 0.5 + 0.5 // 0.5-1.0
    }));
  }

  /**
   * Find missing indexes that could improve performance
   */
  private async findMissingIndexes(categoryId: string): Promise<string[]> {
    // This would analyze query patterns and suggest missing indexes
    // For now, return mock data
    const commonSearchFields = ['name', 'brand', 'model'];
    const existingIndexes: any[] = []; // await prisma.dynamicIndex.findMany({
    //   where: { categoryId },
    //   select: { fieldName: true }
    // });

    const existingFields = new Set(existingIndexes.map((i: any) => i.fieldName));
    return commonSearchFields.filter(field => !existingFields.has(field));
  }

  /**
   * Analyze category metrics and generate recommendations
   */
  private analyzeCategory(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Slow query analysis
    if (metrics.avgQueryTime > 100) {
      recommendations.push({
        type: 'query',
        priority: metrics.avgQueryTime > 200 ? 'high' : 'medium',
        title: 'Slow Query Performance',
        description: `Average query time is ${metrics.avgQueryTime.toFixed(1)}ms, which is above optimal range`,
        impact: 'Improved user experience and reduced server load',
        effort: 'Medium - requires query optimization',
        action: 'Analyze and optimize slow queries, consider adding indexes',
        categoryId: metrics.categoryId
      });
    }

    // Missing index analysis
    if (metrics.missingIndexes.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'medium',
        title: 'Missing Database Indexes',
        description: `${metrics.missingIndexes.length} commonly searched fields lack indexes: ${metrics.missingIndexes.join(', ')}`,
        impact: 'Faster search and filter operations',
        effort: 'Low - automatic index creation',
        action: 'Create indexes for frequently searched fields',
        categoryId: metrics.categoryId
      });
    }

    // Data quality analysis
    if (metrics.confidenceScore < 0.7) {
      recommendations.push({
        type: 'data_quality',
        priority: 'high',
        title: 'Low Data Confidence',
        description: `Average confidence score is ${(metrics.confidenceScore * 100).toFixed(1)}%, indicating data quality issues`,
        impact: 'More accurate device information and better compatibility results',
        effort: 'High - requires data review and verification',
        action: 'Review and verify device specifications, improve AI extraction accuracy',
        categoryId: metrics.categoryId
      });
    }

    // Verification rate analysis
    if (metrics.verificationRate < 0.5) {
      recommendations.push({
        type: 'data_quality',
        priority: 'medium',
        title: 'Low Verification Rate',
        description: `Only ${(metrics.verificationRate * 100).toFixed(1)}% of data has been verified by users`,
        impact: 'Increased data reliability and user trust',
        effort: 'Medium - requires community engagement',
        action: 'Encourage user verification through gamification and incentives',
        categoryId: metrics.categoryId
      });
    }

    // Index effectiveness analysis
    const ineffectiveIndexes = metrics.indexUsage.filter(idx => idx.effectiveness < 0.3);
    if (ineffectiveIndexes.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'low',
        title: 'Ineffective Indexes',
        description: `${ineffectiveIndexes.length} indexes have low effectiveness and may be candidates for removal`,
        impact: 'Reduced storage overhead and faster write operations',
        effort: 'Low - remove unused indexes',
        action: 'Review and remove underutilized indexes',
        categoryId: metrics.categoryId
      });
    }

    return recommendations;
  }

  /**
   * Clear metrics cache
   */
  clearCache(categoryId?: string): void {
    if (categoryId) {
      this.metricsCache.delete(categoryId);
      this.cacheExpiry.delete(categoryId);
    } else {
      this.metricsCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Get system-wide performance summary
   */
  async getSystemSummary(): Promise<{
    totalCategories: number;
    avgQueryTime: number;
    totalRecommendations: number;
    criticalIssues: number;
    systemHealth: 'good' | 'warning' | 'critical';
  }> {
    const allMetrics = await this.getAllCategoryMetrics();
    const recommendations = await this.getOptimizationRecommendations();

    const avgQueryTime = allMetrics.reduce((sum, m) => sum + m.avgQueryTime, 0) / allMetrics.length;
    const criticalIssues = recommendations.filter(r => r.priority === 'critical').length;

    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    if (criticalIssues > 0) {
      systemHealth = 'critical';
    } else if (avgQueryTime > 100 || recommendations.length > 10) {
      systemHealth = 'warning';
    }

    return {
      totalCategories: allMetrics.length,
      avgQueryTime,
      totalRecommendations: recommendations.length,
      criticalIssues,
      systemHealth
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();