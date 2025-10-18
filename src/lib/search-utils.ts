/**
 * Utility functions for search functionality
 */

export interface SearchFilters {
  categoryId?: string;
  brand?: string;
  verified?: boolean;
  dimensions?: {
    widthMin?: string;
    widthMax?: string;
    heightMin?: string;
    heightMax?: string;
    depthMin?: string;
    depthMax?: string;
  };
  power?: {
    min?: string;
    max?: string;
  };
  weight?: {
    min?: string;
    max?: string;
  };
  specifications?: Record<string, any>;
}

/**
 * Build URL search params from filters
 */
export function buildSearchParams(
  query: string,
  filters: SearchFilters,
  offset: number = 0,
  limit: number = 20
): URLSearchParams {
  const params = new URLSearchParams();
  
  if (query) params.set('q', query);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.verified) params.set('verified', 'true');
  
  // Dimensions
  if (filters.dimensions) {
    const { widthMin, widthMax, heightMin, heightMax, depthMin, depthMax } = filters.dimensions;
    if (widthMin) params.set('widthMin', widthMin);
    if (widthMax) params.set('widthMax', widthMax);
    if (heightMin) params.set('heightMin', heightMin);
    if (heightMax) params.set('heightMax', heightMax);
    if (depthMin) params.set('depthMin', depthMin);
    if (depthMax) params.set('depthMax', depthMax);
  }
  
  // Power
  if (filters.power) {
    if (filters.power.min) params.set('powerMin', filters.power.min);
    if (filters.power.max) params.set('powerMax', filters.power.max);
  }
  
  // Weight
  if (filters.weight) {
    if (filters.weight.min) params.set('weightMin', filters.weight.min);
    if (filters.weight.max) params.set('weightMax', filters.weight.max);
  }
  
  // Category-specific specifications
  if (filters.specifications && Object.keys(filters.specifications).length > 0) {
    params.set('specs', JSON.stringify(filters.specifications));
  }
  
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  
  return params;
}

/**
 * Parse filters from URL search params
 */
export function parseSearchParams(searchParams: URLSearchParams): {
  query: string;
  filters: SearchFilters;
  offset: number;
  limit: number;
} {
  const query = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const filters: SearchFilters = {};
  
  const categoryId = searchParams.get('categoryId');
  if (categoryId) filters.categoryId = categoryId;
  
  const brand = searchParams.get('brand');
  if (brand) filters.brand = brand;
  
  const verified = searchParams.get('verified');
  if (verified === 'true') filters.verified = true;
  
  // Parse dimensions
  const widthMin = searchParams.get('widthMin');
  const widthMax = searchParams.get('widthMax');
  const heightMin = searchParams.get('heightMin');
  const heightMax = searchParams.get('heightMax');
  const depthMin = searchParams.get('depthMin');
  const depthMax = searchParams.get('depthMax');
  
  if (widthMin || widthMax || heightMin || heightMax || depthMin || depthMax) {
    filters.dimensions = {
      widthMin: widthMin || undefined,
      widthMax: widthMax || undefined,
      heightMin: heightMin || undefined,
      heightMax: heightMax || undefined,
      depthMin: depthMin || undefined,
      depthMax: depthMax || undefined,
    };
  }
  
  // Parse power
  const powerMin = searchParams.get('powerMin');
  const powerMax = searchParams.get('powerMax');
  if (powerMin || powerMax) {
    filters.power = {
      min: powerMin || undefined,
      max: powerMax || undefined,
    };
  }
  
  // Parse weight
  const weightMin = searchParams.get('weightMin');
  const weightMax = searchParams.get('weightMax');
  if (weightMin || weightMax) {
    filters.weight = {
      min: weightMin || undefined,
      max: weightMax || undefined,
    };
  }
  
  // Parse specifications
  const specs = searchParams.get('specs');
  if (specs) {
    try {
      filters.specifications = JSON.parse(specs);
    } catch (e) {
      console.error('Failed to parse specifications:', e);
    }
  }
  
  return { query, filters, offset, limit };
}

/**
 * Get active filter count
 */
export function getActiveFilterCount(filters: SearchFilters): number {
  let count = 0;
  
  if (filters.categoryId) count++;
  if (filters.brand) count++;
  if (filters.verified) count++;
  
  if (filters.dimensions) {
    const dims = filters.dimensions;
    if (dims.widthMin || dims.widthMax) count++;
    if (dims.heightMin || dims.heightMax) count++;
    if (dims.depthMin || dims.depthMax) count++;
  }
  
  if (filters.power && (filters.power.min || filters.power.max)) count++;
  if (filters.weight && (filters.weight.min || filters.weight.max)) count++;
  
  if (filters.specifications) {
    count += Object.keys(filters.specifications).length;
  }
  
  return count;
}

/**
 * Clear all filters
 */
export function clearAllFilters(): SearchFilters {
  return {};
}

/**
 * Format filter summary for display
 */
export function formatFilterSummary(filters: SearchFilters): string[] {
  const summary: string[] = [];
  
  if (filters.categoryId) summary.push('Category filter');
  if (filters.brand) summary.push(`Brand: ${filters.brand}`);
  if (filters.verified) summary.push('Verified only');
  
  if (filters.dimensions) {
    const dims = filters.dimensions;
    if (dims.widthMin || dims.widthMax) {
      summary.push(`Width: ${dims.widthMin || '?'}-${dims.widthMax || '?'} cm`);
    }
    if (dims.heightMin || dims.heightMax) {
      summary.push(`Height: ${dims.heightMin || '?'}-${dims.heightMax || '?'} cm`);
    }
    if (dims.depthMin || dims.depthMax) {
      summary.push(`Depth: ${dims.depthMin || '?'}-${dims.depthMax || '?'} cm`);
    }
  }
  
  if (filters.power) {
    summary.push(`Power: ${filters.power.min || '?'}-${filters.power.max || '?'}W`);
  }
  
  if (filters.weight) {
    summary.push(`Weight: ${filters.weight.min || '?'}-${filters.weight.max || '?'} kg`);
  }
  
  if (filters.specifications) {
    Object.entries(filters.specifications).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('min' in value || 'max' in value) {
          summary.push(`${key}: ${value.min || '?'}-${value.max || '?'}`);
        }
      } else {
        summary.push(`${key}: ${value}`);
      }
    });
  }
  
  return summary;
}
