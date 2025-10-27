/**
 * User Device Library - Show category-specific specs when users add devices
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, Star, Trash2, Edit, Eye } from 'lucide-react';
import { CategorySpecificDisplay } from './admin/CategorySpecificDisplay';

interface Device {
  id: string;
  name: string;
  brand: string;
  model?: string;
  category: {
    id: string;
    name: string;
  };
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  weightKg?: number;
  powerWatts?: number;
  imageUrls: string[];
  verified: boolean;
  confidenceScore: number;
}

interface UserDevice {
  id: string;
  nickname?: string;
  notes?: string;
  purchaseDate?: string;
  addedAt: string;
  device: Device;
  specifications?: Record<string, any>;
}

interface UserDeviceLibraryProps {
  userId: string;
  onAddDevice?: () => void;
  onEditDevice?: (userDevice: UserDevice) => void;
  onRemoveDevice?: (userDeviceId: string) => void;
}

export function UserDeviceLibrary({
  userId,
  onAddDevice,
  onEditDevice,
  onRemoveDevice
}: UserDeviceLibraryProps) {
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'brand' | 'category' | 'added'>('added');
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDevices();
    fetchCategories();
  }, [userId]);

  const fetchUserDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/devices`);
      const data = await response.json();
      
      if (data.success) {
        setUserDevices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleRemoveDevice = async (userDeviceId: string) => {
    if (!confirm('Are you sure you want to remove this device from your library?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/devices/${userDeviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUserDevices(prev => prev.filter(ud => ud.id !== userDeviceId));
        onRemoveDevice?.(userDeviceId);
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
    }
  };

  const toggleFavorite = async (userDeviceId: string) => {
    // This would toggle a favorite status if implemented
    console.log('Toggle favorite for:', userDeviceId);
  };

  const filteredAndSortedDevices = userDevices
    .filter(userDevice => {
      const matchesSearch = !searchQuery || 
        userDevice.device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userDevice.device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userDevice.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || userDevice.device.category.id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.device.name.localeCompare(b.device.name);
        case 'brand':
          return a.device.brand.localeCompare(b.device.brand);
        case 'category':
          return a.device.category.name.localeCompare(b.device.category.name);
        case 'added':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  const DeviceCard = ({ userDevice }: { userDevice: UserDevice }) => {
    const { device } = userDevice;
    const isExpanded = expandedDevice === userDevice.id;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Device Image */}
        <div className="aspect-video bg-gray-100 relative">
          {device.imageUrls.length > 0 ? (
            <img
              src={device.imageUrls[0]}
              alt={device.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                <span className="text-sm">No Image</span>
              </div>
            </div>
          )}
          
          {/* Verification Badge */}
          {device.verified && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Verified
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 line-clamp-1">
                {userDevice.nickname || device.name}
              </h3>
              <p className="text-sm text-gray-600">
                {device.brand} {device.model && `• ${device.model}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {device.category.name}
              </p>
            </div>
            
            <button
              onClick={() => toggleFavorite(userDevice.id)}
              className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Star className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Specs */}
          <div className="text-xs text-gray-500 space-y-1 mb-3">
            {device.widthCm && device.heightCm && device.depthCm && (
              <div>Dimensions: {device.widthCm} × {device.heightCm} × {device.depthCm} cm</div>
            )}
            {device.powerWatts && (
              <div>Power: {device.powerWatts}W</div>
            )}
            {userDevice.purchaseDate && (
              <div>Purchased: {new Date(userDevice.purchaseDate).toLocaleDateString()}</div>
            )}
          </div>

          {/* Notes */}
          {userDevice.notes && (
            <div className="text-sm text-gray-600 mb-3 line-clamp-2">
              {userDevice.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpandedDevice(isExpanded ? null : userDevice.id)}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              {isExpanded ? 'Hide' : 'View'} Details
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditDevice?.(userDevice)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRemoveDevice(userDevice.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CategorySpecificDisplay
              deviceId={device.id}
              categoryId={device.category.id}
            />
            
            {/* Additional Device Info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Confidence:</span>
                <span className="ml-2 text-gray-600">
                  {Math.round(device.confidenceScore * 100)}%
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Added:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(userDevice.addedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DeviceListItem = ({ userDevice }: { userDevice: UserDevice }) => {
    const { device } = userDevice;
    const isExpanded = expandedDevice === userDevice.id;

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Device Image */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
              {device.imageUrls.length > 0 ? (
                <img
                  src={device.imageUrls[0]}
                  alt={device.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg"></div>
              )}
            </div>

            {/* Device Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {userDevice.nickname || device.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {device.brand} {device.model && `• ${device.model}`}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{device.category.name}</span>
                    {device.verified && (
                      <span className="text-green-600 font-medium">Verified</span>
                    )}
                    <span>{Math.round(device.confidenceScore * 100)}% confidence</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setExpandedDevice(isExpanded ? null : userDevice.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditDevice?.(userDevice)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveDevice(userDevice.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                {device.widthCm && device.heightCm && device.depthCm && (
                  <span>{device.widthCm} × {device.heightCm} × {device.depthCm} cm</span>
                )}
                {device.powerWatts && <span>{device.powerWatts}W</span>}
                {userDevice.purchaseDate && (
                  <span>Purchased {new Date(userDevice.purchaseDate).toLocaleDateString()}</span>
                )}
              </div>

              {/* Notes */}
              {userDevice.notes && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                  {userDevice.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CategorySpecificDisplay
              deviceId={device.id}
              categoryId={device.category.id}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Device Library</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal collection of devices with detailed specifications
          </p>
        </div>
        
        <button
          onClick={onAddDevice}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search devices..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="added">Recently Added</option>
              <option value="name">Device Name</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Device Library */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your devices...</span>
        </div>
      ) : filteredAndSortedDevices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userDevices.length === 0 ? 'No devices in your library' : 'No devices match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {userDevices.length === 0 
              ? 'Start building your device library by adding your first device'
              : 'Try adjusting your search or filter criteria'}
          </p>
          {userDevices.length === 0 && (
            <button
              onClick={onAddDevice}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Device
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredAndSortedDevices.map(userDevice => (
            viewMode === 'grid' ? (
              <DeviceCard key={userDevice.id} userDevice={userDevice} />
            ) : (
              <DeviceListItem key={userDevice.id} userDevice={userDevice} />
            )
          ))}
        </div>
      )}

      {/* Stats */}
      {userDevices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedDevices.length} of {userDevices.length} devices
            </span>
            <span>
              {categories.length > 0 && `${new Set(userDevices.map(ud => ud.device.category.id)).size} categories`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}