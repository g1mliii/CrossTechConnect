/**
 * Device Detail - View device details
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { CategorySpecificDisplay } from './CategorySpecificDisplay';

interface DeviceDetailProps {
  deviceId: string;
}

interface Device {
  id: string;
  name: string;
  brand: string;
  model: string | null;
  verified: boolean;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  weight_kg: number | null;
  power_watts: number | null;
  power_type: string | null;
  manual_url: string | null;
  description: string | null;
  device_categories: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export function DeviceDetail({ deviceId }: DeviceDetailProps) {
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      const data = await response.json();
      
      if (data.success) {
        setDevice(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!device) return;

    if (!confirm(`Are you sure you want to delete "${device.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin/devices');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Device not found</p>
        <Link href="/admin/devices" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Devices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/devices"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
            <p className="text-gray-600">{device.brand} {device.model && `- ${device.model}`}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/devices/${deviceId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        {device.verified ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Unverified
          </span>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900">{device.device_categories.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Brand</dt>
            <dd className="mt-1 text-sm text-gray-900">{device.brand}</dd>
          </div>
          {device.model && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.model}</dd>
            </div>
          )}
          {device.description && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Physical Specifications */}
      {(device.width_cm || device.height_cm || device.depth_cm || device.weight_kg) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Specifications</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {device.width_cm && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Width</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.width_cm} cm</dd>
              </div>
            )}
            {device.height_cm && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Height</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.height_cm} cm</dd>
              </div>
            )}
            {device.depth_cm && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Depth</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.depth_cm} cm</dd>
              </div>
            )}
            {device.weight_kg && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Weight</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.weight_kg} kg</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Power Specifications */}
      {(device.power_watts || device.power_type) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Power Specifications</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {device.power_watts && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Power Consumption</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.power_watts} W</dd>
              </div>
            )}
            {device.power_type && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Power Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{device.power_type}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Category-Specific Specifications */}
      <CategorySpecificDisplay 
        deviceId={deviceId} 
        categoryId={device.device_categories.id}
      />

      {/* Documentation */}
      {device.manual_url && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>
          <a
            href={device.manual_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Manual
          </a>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(device.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(device.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
