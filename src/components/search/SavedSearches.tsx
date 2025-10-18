'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Search, Clock } from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  savedAt: string;
}

export default function SavedSearches() {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    try {
      const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = (id: string) => {
    const searches = savedSearches.filter(s => s.id !== id);
    localStorage.setItem('savedSearches', JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const loadSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    
    if (search.query) params.set('q', search.query);
    if (search.filters.categoryId) params.set('categoryId', search.filters.categoryId);
    if (search.filters.brand) params.set('brand', search.filters.brand);
    if (search.filters.verified) params.set('verified', 'true');
    
    if (search.filters.dimensions) {
      const { widthMin, widthMax, heightMin, heightMax, depthMin, depthMax } = search.filters.dimensions;
      if (widthMin) params.set('widthMin', widthMin);
      if (widthMax) params.set('widthMax', widthMax);
      if (heightMin) params.set('heightMin', heightMin);
      if (heightMax) params.set('heightMax', heightMax);
      if (depthMin) params.set('depthMin', depthMin);
      if (depthMax) params.set('depthMax', depthMax);
    }
    
    if (search.filters.power) {
      if (search.filters.power.min) params.set('powerMin', search.filters.power.min);
      if (search.filters.power.max) params.set('powerMax', search.filters.power.max);
    }
    
    if (search.filters.weight) {
      if (search.filters.weight.min) params.set('weightMin', search.filters.weight.min);
      if (search.filters.weight.max) params.set('weightMax', search.filters.weight.max);
    }
    
    router.push(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <Save className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No saved searches yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Save your searches to quickly access them later
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Save className="w-5 h-5" />
        Saved Searches
      </h2>
      
      <div className="space-y-3">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 cursor-pointer" onClick={() => loadSearch(search)}>
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-gray-400" />
                <h3 className="font-medium text-gray-900">{search.name}</h3>
              </div>
              {search.query && (
                <p className="text-sm text-gray-600 ml-6">Query: {search.query}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400 ml-6 mt-1">
                <Clock className="w-3 h-3" />
                {new Date(search.savedAt).toLocaleDateString()}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this saved search?')) {
                  deleteSearch(search.id);
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
