/**
 * API endpoint for dynamic device search with category-specific filters
 * Optimized for large databases with caching and efficient queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchFilters {
  categoryId?: string;
  verified?: boolean;
  brand?: string;
  specifications?: Record<string, any>;
  dimensions?: {
    widthMin?: number;
    widthMax?: number;
    heightMin?: number;
    heightMax?: number;
    depthMin?: number;
    depthMax?: number;
  };
  power?: {
    min?: number;
    max?: number;
  };
  weight?: {
    min?: number;
    max?: number;
  };
}

/**
 * GET /api/search - Dynamic device search with category-specific filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const brand = searchParams.get('brand');
    const verified = searchParams.get('verified');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Parse filter parameters
    const filters: SearchFilters = {};
    
    if (categoryId) filters.categoryId = categoryId;
    if (brand) filters.brand = brand;
    if (verified !== null) filters.verified = verified === 'true';
    
    // Parse dimension filters
    const widthMin = searchParams.get('widthMin');
    const widthMax = searchParams.get('widthMax');
    const heightMin = searchParams.get('heightMin');
    const heightMax = searchParams.get('heightMax');
    const depthMin = searchParams.get('depthMin');
    const depthMax = searchParams.get('depthMax');
    
    if (widthMin || widthMax || heightMin || heightMax || depthMin || depthMax) {
      filters.dimensions = {
        widthMin: widthMin ? parseFloat(widthMin) : undefined,
        widthMax: widthMax ? parseFloat(widthMax) : undefined,
        heightMin: heightMin ? parseFloat(heightMin) : undefined,
        heightMax: heightMax ? parseFloat(heightMax) : undefined,
        depthMin: depthMin ? parseFloat(depthMin) : undefined,
        depthMax: depthMax ? parseFloat(depthMax) : undefined,
      };
    }
    
    // Parse power filters
    const powerMin = searchParams.get('powerMin');
    const powerMax = searchParams.get('powerMax');
    if (powerMin || powerMax) {
      filters.power = {
        min: powerMin ? parseInt(powerMin) : undefined,
        max: powerMax ? parseInt(powerMax) : undefined,
      };
    }
    
    // Parse weight filters
    const weightMin = searchParams.get('weightMin');
    const weightMax = searchParams.get('weightMax');
    if (weightMin || weightMax) {
      filters.weight = {
        min: weightMin ? parseFloat(weightMin) : undefined,
        max: weightMax ? parseFloat(weightMax) : undefined,
      };
    }
    
    // Parse category-specific specification filters
    const specFilters = searchParams.get('specs');
    if (specFilters) {
      try {
        filters.specifications = JSON.parse(specFilters);
      } catch (e) {
        console.error('Failed to parse specification filters:', e);
      }
    }

    // Check cache first (5 minute TTL for search results)
    const { cache, createCacheKey } = await import('@/lib/cache');
    const cacheKey = createCacheKey('search', {
      q: query,
      ...filters,
      limit: limit.toString(),
      offset: offset.toString()
    });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    // Build optimized query - only select needed fields for list view
    let dbQuery = supabase
      .from('devices')
      .select(`
        id,
        name,
        brand,
        model,
        category_id,
        width_cm,
        height_cm,
        depth_cm,
        weight_kg,
        power_watts,
        verified,
        confidence_score,
        device_categories!inner(id, name)
      `, { count: 'exact' });

    // Apply text search with proper indexing
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`);
    }

    // Apply category filter
    if (filters.categoryId) {
      dbQuery = dbQuery.eq('category_id', filters.categoryId);
    }

    // Apply brand filter
    if (filters.brand) {
      dbQuery = dbQuery.eq('brand', filters.brand);
    }

    // Apply verified filter
    if (filters.verified !== undefined) {
      dbQuery = dbQuery.eq('verified', filters.verified);
    }

    // Apply dimension filters
    if (filters.dimensions) {
      if (filters.dimensions.widthMin !== undefined) {
        dbQuery = dbQuery.gte('width_cm', filters.dimensions.widthMin);
      }
      if (filters.dimensions.widthMax !== undefined) {
        dbQuery = dbQuery.lte('width_cm', filters.dimensions.widthMax);
      }
      if (filters.dimensions.heightMin !== undefined) {
        dbQuery = dbQuery.gte('height_cm', filters.dimensions.heightMin);
      }
      if (filters.dimensions.heightMax !== undefined) {
        dbQuery = dbQuery.lte('height_cm', filters.dimensions.heightMax);
      }
      if (filters.dimensions.depthMin !== undefined) {
        dbQuery = dbQuery.gte('depth_cm', filters.dimensions.depthMin);
      }
      if (filters.dimensions.depthMax !== undefined) {
        dbQuery = dbQuery.lte('depth_cm', filters.dimensions.depthMax);
      }
    }

    // Apply power filters
    if (filters.power) {
      if (filters.power.min !== undefined) {
        dbQuery = dbQuery.gte('power_watts', filters.power.min);
      }
      if (filters.power.max !== undefined) {
        dbQuery = dbQuery.lte('power_watts', filters.power.max);
      }
    }

    // Apply weight filters
    if (filters.weight) {
      if (filters.weight.min !== undefined) {
        dbQuery = dbQuery.gte('weight_kg', filters.weight.min);
      }
      if (filters.weight.max !== undefined) {
        dbQuery = dbQuery.lte('weight_kg', filters.weight.max);
      }
    }

    // Execute query with pagination and ordering
    const { data: devices, error, count } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    let filteredDevices = devices || [];
    let actualCount = count || 0;

    // If category-specific filters are applied, fetch specifications separately
    // This avoids loading all specs for devices that won't match
    if (filters.specifications && Object.keys(filters.specifications).length > 0 && filteredDevices.length > 0) {
      const deviceIds = filteredDevices.map(d => d.id);
      
      const { data: specs, error: specsError } = await supabase
        .from('device_specifications')
        .select('device_id, specifications')
        .in('device_id', deviceIds);

      if (specsError) throw specsError;

      // Create a map for quick lookup
      const specsMap = new Map(specs?.map(s => [s.device_id, s.specifications]) || []);

      // Filter devices based on specifications
      filteredDevices = filteredDevices.filter(device => {
        const deviceSpecs = specsMap.get(device.id);
        if (!deviceSpecs) return false;

        // Check each specification filter
        return Object.entries(filters.specifications!).every(([key, value]) => {
          const specValue = deviceSpecs[key];
          
          // Handle different filter types
          if (typeof value === 'object' && value !== null) {
            // Range filter
            if ('min' in value && specValue < value.min) return false;
            if ('max' in value && specValue > value.max) return false;
            // Array contains filter
            if ('contains' in value && Array.isArray(specValue)) {
              return specValue.includes(value.contains);
            }
            return true;
          }
          
          // Exact match
          return specValue === value;
        });
      });

      // Attach specs to devices for display
      filteredDevices = filteredDevices.map(device => ({
        ...device,
        device_specifications: specsMap.get(device.id) ? [{ specifications: specsMap.get(device.id) }] : []
      }));

      actualCount = filteredDevices.length;
    }

    // Get facets only if not cached separately
    const facetsCacheKey = createCacheKey('search-facets', {
      categoryId: filters.categoryId || 'all',
      q: query || 'none'
    });
    let facets = cache.get(facetsCacheKey);
    
    if (!facets) {
      facets = await buildFacets(filters.categoryId, query);
      cache.set(facetsCacheKey, facets, 300); // Cache facets for 5 minutes
    }

    const result = {
      data: filteredDevices,
      facets,
      pagination: {
        total: actualCount,
        limit,
        offset,
        hasMore: offset + limit < actualCount
      }
    };

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    // Track search asynchronously (don't wait for it)
    if (query || Object.keys(filters).length > 0) {
      trackSearch(query, filteredDevices.length, filters, filters.categoryId).catch(err => {
        console.error('Failed to track search:', err);
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      cached: false
    });

  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Build facets for search results - optimized for large databases
 */
async function buildFacets(categoryId?: string, query?: string) {
  const facets: any = {
    categories: [],
    brands: [],
    verified: { true: 0, false: 0 },
    specifications: {}
  };

  try {
    // Use Promise.all to fetch facets in parallel for better performance
    const [categoryResult, brandResult, verifiedResult, schemaResult] = await Promise.all([
      // Get category facets with aggregation
      supabase.rpc('get_category_facets', { 
        search_query: query || null 
      }).then(res => res.data || []),
      
      // Get brand facets with aggregation
      supabase.rpc('get_brand_facets', { 
        category_filter: categoryId || null,
        search_query: query || null
      }).then(res => res.data || []),
      
      // Get verified counts
      supabase.rpc('get_verified_facets', {
        category_filter: categoryId || null
      }).then(res => res.data || { verified: 0, unverified: 0 }),
      
      // Get category schema if category is selected
      categoryId ? supabase
        .from('device_category_schemas')
        .select('fields')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(res => res.data) : Promise.resolve(null)
    ]);

    // Process category facets
    facets.categories = categoryResult;

    // Process brand facets (limit to top 20)
    facets.brands = brandResult.slice(0, 20);

    // Process verified facets
    facets.verified = {
      true: verifiedResult.verified || 0,
      false: verifiedResult.unverified || 0
    };

    // Process category-specific specification facets
    if (schemaResult && schemaResult.fields) {
      facets.specifications = extractSpecificationFacets(schemaResult.fields);
    }

  } catch (error) {
    console.error('Error building facets:', error);
    
    // Fallback to basic queries if RPC functions don't exist
    try {
      // Fallback category facets
      const { data: categoryData } = await supabase
        .from('devices')
        .select('category_id, device_categories!inner(id, name)')
        .limit(1000);
      
      if (categoryData) {
        const categoryCounts = categoryData.reduce((acc: any, item: any) => {
          const catId = item.category_id;
          const catName = item.device_categories?.name || 'Unknown';
          if (!acc[catId]) {
            acc[catId] = { id: catId, name: catName, count: 0 };
          }
          acc[catId].count++;
          return acc;
        }, {});
        
        facets.categories = Object.values(categoryCounts);
      }

      // Fallback brand facets
      let brandQuery = supabase
        .from('devices')
        .select('brand')
        .limit(1000);
      
      if (categoryId) {
        brandQuery = brandQuery.eq('category_id', categoryId);
      }

      const { data: brandData } = await brandQuery;
      
      if (brandData) {
        const brandCounts = brandData.reduce((acc: any, item: any) => {
          const brand = item.brand;
          if (!acc[brand]) {
            acc[brand] = { name: brand, count: 0 };
          }
          acc[brand].count++;
          return acc;
        }, {});
        
        facets.brands = Object.values(brandCounts).slice(0, 20);
      }
    } catch (fallbackError) {
      console.error('Fallback facet building also failed:', fallbackError);
    }
  }

  return facets;
}

/**
 * Extract specification facets from schema fields
 */
function extractSpecificationFacets(fields: any): any {
  const facets: any = {};

  if (Array.isArray(fields)) {
    fields.forEach((field: any) => {
      if (field.type === 'enum' && field.options) {
        facets[field.name] = {
          type: 'enum',
          label: field.label || field.name,
          options: field.options,
          unit: field.unit
        };
      } else if (field.type === 'number') {
        facets[field.name] = {
          type: 'range',
          label: field.label || field.name,
          min: field.min,
          max: field.max,
          unit: field.unit
        };
      } else if (field.type === 'boolean') {
        facets[field.name] = {
          type: 'boolean',
          label: field.label || field.name
        };
      }
    });
  }

  return facets;
}

/**
 * Track search for analytics
 */
async function trackSearch(
  query: string,
  resultsCount: number,
  filters: SearchFilters,
  categoryId?: string
) {
  try {
    await supabase
      .from('search_tracking')
      .insert({
        query,
        filters,
        results_count: resultsCount,
        category_id: categoryId || null
      });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
}
