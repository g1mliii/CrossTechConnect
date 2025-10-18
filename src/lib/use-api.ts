/**
 * Custom hooks for API calls with client-side caching using SWR
 */

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

/**
 * Hook for fetching devices with client-side caching
 */
export function useDevices(params: {
  search?: string;
  categoryId?: string;
  verified?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set('search', params.search);
  if (params.categoryId) queryParams.set('categoryId', params.categoryId);
  if (params.verified) queryParams.set('verified', params.verified);
  queryParams.set('limit', (params.limit || 50).toString());
  queryParams.set('offset', (params.offset || 0).toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/devices?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      keepPreviousData: true, // Keep showing old data while fetching new
    }
  );

  return {
    devices: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching categories with client-side caching
 */
export function useCategories(params: {
  search?: string;
  status?: string;
  includeDeviceCount?: boolean;
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.includeDeviceCount) queryParams.set('includeDeviceCount', 'true');
  queryParams.set('limit', (params.limit || 100).toString());
  queryParams.set('offset', (params.offset || 0).toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/categories?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }
  );

  return {
    categories: data?.data || [],
    count: data?.count || 0,
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching analytics with client-side caching
 */
export function useAnalytics(timeRange: string = '30d') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/analytics?timeRange=${timeRange}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutes for analytics
      keepPreviousData: true,
    }
  );

  return {
    analytics: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for fetching dashboard data with client-side caching
 */
export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/dashboard',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }
  );

  return {
    dashboard: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
