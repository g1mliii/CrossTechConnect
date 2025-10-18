/**
 * Audit Logger - Utility for logging admin actions
 */

export interface AuditLogEntry {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  success?: boolean;
  errorMessage?: string;
}

export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    await fetch('/api/admin/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export async function trackUserActivity(
  activityType: string,
  entityType?: string,
  entityId?: string,
  metadata?: any,
  userId?: string
): Promise<void> {
  try {
    await fetch('/api/admin/analytics/user-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        activityType,
        entityType,
        entityId,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to track user activity:', error);
    // Don't throw - activity tracking should not break the main flow
  }
}

export async function trackSearch(
  query: string,
  resultsCount: number,
  filters?: any,
  categoryId?: string,
  userId?: string
): Promise<void> {
  try {
    await fetch('/api/admin/analytics/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        query,
        filters,
        resultsCount,
        categoryId,
      }),
    });
  } catch (error) {
    console.error('Failed to track search:', error);
    // Don't throw - search tracking should not break the main flow
  }
}
