'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  brand: string;
  model?: string;
  category_id: string;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  weight_kg?: number;
  power_watts?: number;
  verified: boolean;
  confidence_score: number;
  device_categories: {
    id: string;
    name: string;
  };
  device_specifications?: Array<{
    specifications: Record<string, any>;
    schema_version: string;
  }>;
}

interface Facets {
  categories: Array<{ id: string; name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  verified: { true: number; false: number };
  specifications: Record<string, {
    type: 'enum' | 'range' | 'boolean';
    label: string;
    options?: string[];
    min?: number;
    max?: number;
    unit?: string;
  }>;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [devices, setDevices] = useState<Device[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [showFilters, setShowFilters] = useState(true);
  const [specFilters, setSpecFilters] = useState<Record<string, any>>({});
  
  // Dimension filters
  const [widthMin, setWidthMin] = useState(searchParams.get('widthMin') || '');
  const [widthMax, setWidthMax] = useState(searchParams.get('widthMax') || '');
  const [heightMin, setHeightMin] = useState(searchParams.get('heightMin') || '');
  const [heightMax, setHeightMax] = useState(searchParams.get('heightMax') || '');
  const [depthMin, setDepthMin] = useState(searchParams.get('depthMin') || '');
  const [depthMax, setDepthMax] = useState(searchParams.get('depthMax') || '');
  
  // Power and weight filters
  const [powerMin, setPowerMin] = useState(searchParams.get('powerMin') || '');
  const [powerMax, setPowerMax] = useState(searchParams.get('powerMax') || '');
  const [weightMin, setWeightMin] = useState(searchParams.get('weightMin') || '');
  const [weightMax, setWeightMax] = useState(searchParams.get('weightMax') || '');

  // Build search URL
  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (verifiedOnly) params.set('verified', 'true');
    if (widthMin) params.set('widthMin', widthMin);
    if (widthMax) params.set('widthMax', widthMax);
    if (heightMin) params.set('heightMin', heightMin);
    if (heightMax) params.set('heightMax', heightMax);
    if (depthMin) params.set('depthMin', depthMin);
    if (depthMax) params.set('depthMax', depthMax);
    if (powerMin) params.set('powerMin', powerMin);
    if (powerMax) params.set('powerMax', powerMax);
    if (weightMin) params.set('weightMin', weightMin);
    if (weightMax) params.set('weightMax', weightMax);
    if (Object.keys(specFilters).length > 0) {
      params.set('specs', JSON.stringify(specFilters));
    }
    params.set('limit', '20');
    params.set('offset', offset.toString());
    
    return `/api/search?${params.toString()}`;
  }, [query, selectedCategory, selectedBrand, verifiedOnly, widthMin, widthMax, heightMin, heightMax, depthMin, depthMax, powerMin, powerMax, weightMin, weightMax, specFilters, offset]);

  // Perform search
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildSearchUrl());
      const result = await response.json();
      
      if (result.success) {
        setDevices(result.data);
        setFacets(result.facets);
        setTotal(result.pagination.total);
        setHasMore(result.pagination.hasMore);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [buildSearchUrl]);

  // Update URL with current filters
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (verifiedOnly) params.set('verified', 'true');
    if (widthMin) params.set('widthMin', widthMin);
    if (widthMax) params.set('widthMax', widthMax);
    if (heightMin) params.set('heightMin', heightMin);
    if (heightMax) params.set('heightMax', heightMax);
    if (depthMin) params.set('depthMin', depthMin);
    if (depthMax) params.set('depthMax', depthMax);
    if (powerMin) params.set('powerMin', powerMin);
    if (powerMax) params.set('powerMax', powerMax);
    if (weightMin) params.set('weightMin', weightMin);
    if (weightMax) params.set('weightMax', weightMax);
    
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [query, selectedCategory, selectedBrand, verifiedOnly, widthMin, widthMax, heightMin, heightMax, depthMin, depthMax, powerMin, powerMax, weightMin, weightMax, router]);

  // Debounced search to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl();
    }, 500); // 500ms debounce for URL updates

    return () => clearTimeout(timeoutId);
  }, [updateUrl]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setVerifiedOnly(false);
    setWidthMin('');
    setWidthMax('');
    setHeightMin('');
    setHeightMax('');
    setDepthMin('');
    setDepthMax('');
    setPowerMin('');
    setPowerMax('');
    setWeightMin('');
    setWeightMax('');
    setSpecFilters({});
    setOffset(0);
  };

  // Save search
  const saveSearch = async () => {
    const searchData = {
      query,
      filters: {
        categoryId: selectedCategory,
        brand: selectedBrand,
        verified: verifiedOnly,
        dimensions: { widthMin, widthMax, heightMin, heightMax, depthMin, depthMax },
        power: { min: powerMin, max: powerMax },
        weight: { min: weightMin, max: weightMax },
        specifications: specFilters
      }
    };
    
    // Save to localStorage for now (could be saved to backend)
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    savedSearches.push({
      id: Date.now().toString(),
      name: query || 'Unnamed Search',
      ...searchData,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    
    alert('Search saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Device Search</h1>
          
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search devices by name, brand, or model..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setOffset(0);
                    performSearch();
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setOffset(0);
                performSearch();
              }}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </button>
            <button
              onClick={saveSearch}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Category Filter */}
                {facets && facets.categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setOffset(0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {facets.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.count})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Brand Filter */}
                {facets && facets.brands.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setOffset(0);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Brands</option>
                      {facets.brands.map((brand) => (
                        <option key={brand.name} value={brand.name}>
                          {brand.name} ({brand.count})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Verified Filter */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => {
                        setVerifiedOnly(e.target.checked);
                        setOffset(0);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Verified devices only</span>
                  </label>
                </div>

                {/* Dimensions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Width min"
                        value={widthMin}
                        onChange={(e) => setWidthMin(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Width max"
                        value={widthMax}
                        onChange={(e) => setWidthMax(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Height min"
                        value={heightMin}
                        onChange={(e) => setHeightMin(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Height max"
                        value={heightMax}
                        onChange={(e) => setHeightMax(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Depth min"
                        value={depthMin}
                        onChange={(e) => setDepthMin(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Depth max"
                        value={depthMax}
                        onChange={(e) => setDepthMax(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Power */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Power (watts)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={powerMin}
                      onChange={(e) => setPowerMin(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={powerMax}
                      onChange={(e) => setPowerMax(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Weight (kg)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={weightMin}
                      onChange={(e) => setWeightMin(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={weightMax}
                      onChange={(e) => setWeightMax(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Category-Specific Filters */}
                {facets && Object.keys(facets.specifications).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Category Specifications</h3>
                    <div className="space-y-3">
                      {Object.entries(facets.specifications).map(([key, spec]) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-600 mb-1">
                            {spec.label} {spec.unit && `(${spec.unit})`}
                          </label>
                          {spec.type === 'enum' && spec.options && (
                            <select
                              value={specFilters[key] || ''}
                              onChange={(e) => {
                                const newFilters = { ...specFilters };
                                if (e.target.value) {
                                  newFilters[key] = e.target.value;
                                } else {
                                  delete newFilters[key];
                                }
                                setSpecFilters(newFilters);
                                setOffset(0);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="">Any</option>
                              {spec.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {spec.type === 'range' && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                placeholder="Min"
                                min={spec.min}
                                max={spec.max}
                                value={specFilters[key]?.min || ''}
                                onChange={(e) => {
                                  const newFilters = { ...specFilters };
                                  if (!newFilters[key]) newFilters[key] = {};
                                  newFilters[key].min = e.target.value ? parseFloat(e.target.value) : undefined;
                                  setSpecFilters(newFilters);
                                  setOffset(0);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Max"
                                min={spec.min}
                                max={spec.max}
                                value={specFilters[key]?.max || ''}
                                onChange={(e) => {
                                  const newFilters = { ...specFilters };
                                  if (!newFilters[key]) newFilters[key] = {};
                                  newFilters[key].max = e.target.value ? parseFloat(e.target.value) : undefined;
                                  setSpecFilters(newFilters);
                                  setOffset(0);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          )}
                          {spec.type === 'boolean' && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={specFilters[key] === true}
                                onChange={(e) => {
                                  const newFilters = { ...specFilters };
                                  if (e.target.checked) {
                                    newFilters[key] = true;
                                  } else {
                                    delete newFilters[key];
                                  }
                                  setSpecFilters(newFilters);
                                  setOffset(0);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Yes</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              {loading ? 'Searching...' : `${total} device${total !== 1 ? 's' : ''} found`}
            </div>

            {/* Device Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No devices found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/devices/${device.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{device.name}</h3>
                          <p className="text-sm text-gray-600">{device.brand}</p>
                        </div>
                        {device.verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Category: {device.device_categories.name}</p>
                        {device.width_cm && device.height_cm && device.depth_cm && (
                          <p>Dimensions: {device.width_cm} × {device.height_cm} × {device.depth_cm} cm</p>
                        )}
                        {device.power_watts && (
                          <p>Power: {device.power_watts}W</p>
                        )}
                        {device.weight_kg && (
                          <p>Weight: {device.weight_kg} kg</p>
                        )}
                      </div>
                      
                      {device.device_specifications && device.device_specifications.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            + Category-specific specifications
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setOffset(offset + 20);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
