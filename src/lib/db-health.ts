import { prisma } from './database';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: {
      status: 'pass' | 'fail';
      responseTime: number;
      error?: string;
    };
    migrations: {
      status: 'pass' | 'fail';
      error?: string;
    };
    indexes: {
      status: 'pass' | 'fail';
      count: number;
      error?: string;
    };
  };
}

export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date(),
    checks: {
      database: { status: 'pass', responseTime: 0 },
      migrations: { status: 'pass' },
      indexes: { status: 'pass', count: 0 },
    },
  };

  // Database connectivity check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    result.checks.database.responseTime = Date.now() - start;
    result.checks.database.status = 'pass';
  } catch (error) {
    result.checks.database.status = 'fail';
    result.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  // Migration status check
  try {
    // Check if all tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const expectedTables = [
      'users',
      'device_categories', 
      'standards',
      'devices',
      'device_standards',
      'compatibility_rules',
      'user_devices',
      'verification_items',
      'verification_votes',
      '_prisma_migrations'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      result.checks.migrations.status = 'fail';
      result.checks.migrations.error = `Missing tables: ${missingTables.join(', ')}`;
      result.status = 'unhealthy';
    }
  } catch (error) {
    result.checks.migrations.status = 'fail';
    result.checks.migrations.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  // Index check
  try {
    const indexes = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    
    result.checks.indexes.count = Number(indexes[0].count);
    
    // We expect at least 10 indexes (including primary keys and our custom indexes)
    if (result.checks.indexes.count < 10) {
      result.checks.indexes.status = 'fail';
      result.checks.indexes.error = `Expected at least 10 indexes, found ${result.checks.indexes.count}`;
      result.status = result.status === 'healthy' ? 'degraded' : 'unhealthy';
    }
  } catch (error) {
    result.checks.indexes.status = 'fail';
    result.checks.indexes.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  return result;
};

export const getConnectionInfo = async () => {
  try {
    const info = await prisma.$queryRaw<Array<{
      version: string;
      current_database: string;
      current_user: string;
      current_timestamp: Date;
    }>>`
      SELECT 
        version() as version,
        current_database() as current_database,
        current_user as current_user,
        current_timestamp
    `;

    const stats = await prisma.$queryRaw<Array<{
      active_connections: bigint;
      max_connections: number;
    }>>`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
    `;

    return {
      ...info[0],
      activeConnections: Number(stats[0].active_connections),
      maxConnections: stats[0].max_connections,
    };
  } catch (error) {
    throw new Error(`Failed to get connection info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getTableSizes = async () => {
  try {
    const sizes = await prisma.$queryRaw<Array<{
      table_name: string;
      row_count: bigint;
      total_size: string;
      index_size: string;
    }>>`
      SELECT 
        schemaname||'.'||relname as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||relname)) as index_size
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
    `;

    return sizes.map(s => ({
      ...s,
      row_count: Number(s.row_count),
    }));
  } catch (error) {
    throw new Error(`Failed to get table sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getSlowQueries = async (limit: number = 10) => {
  try {
    // Note: This requires pg_stat_statements extension to be enabled
    const queries = await prisma.$queryRaw<Array<{
      query: string;
      calls: bigint;
      total_time: number;
      mean_time: number;
      rows: bigint;
    }>>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC 
      LIMIT ${limit}
    `;

    return queries.map(q => ({
      ...q,
      calls: Number(q.calls),
      rows: Number(q.rows),
    }));
  } catch (error) {
    // pg_stat_statements might not be enabled, return empty array
    console.warn('pg_stat_statements extension not available for slow query analysis');
    return [];
  }
};