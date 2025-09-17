export const databaseConfig = {
  development: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/device_platform",
    ssl: false,
    pool: {
      min: 2,
      max: 10,
    },
  },
  staging: {
    url: process.env.DATABASE_URL,
    ssl: true,
    pool: {
      min: 5,
      max: 20,
    },
  },
  production: {
    url: process.env.DATABASE_URL,
    ssl: true,
    pool: {
      min: 10,
      max: 50,
    },
  },
};

export const redisConfig = {
  development: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },
  staging: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },
  production: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 5,
  },
};

export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    database: databaseConfig[env as keyof typeof databaseConfig],
    redis: redisConfig[env as keyof typeof redisConfig],
  };
};