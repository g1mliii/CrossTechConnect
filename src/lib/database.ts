import { PrismaClient, Prisma } from '@prisma/client';
import { getCurrentConfig } from '../../config/database';

// Enhanced Prisma client with connection pooling and error handling
class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    const config = getCurrentConfig();
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Handle connection events
    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventHandlers() {
    // Handle process termination
    process.on('beforeExit', async () => {
      await this.disconnect();
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new DatabaseError('Failed to connect to database', error);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  public async executeTransaction<T>(
    operations: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operations, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
    } catch (error) {
      throw new DatabaseError('Transaction failed', error);
    }
  }
}

// Custom error classes for better error handling
export class DatabaseError extends Error {
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends Error {
  public readonly resource: string;
  public readonly id?: string;

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

// Error handling utilities
export const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ValidationError(`Unique constraint violation: ${error.meta?.target}`);
      case 'P2025':
        throw new NotFoundError('Record', error.meta?.cause as string);
      case 'P2003':
        throw new ValidationError(`Foreign key constraint violation: ${error.meta?.field_name}`);
      case 'P2014':
        throw new ValidationError(`Invalid ID: ${error.meta?.target}`);
      default:
        throw new DatabaseError(`Database error: ${error.message}`, error);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new DatabaseError('Unknown database error occurred', error);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new DatabaseError('Database engine panic', error);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError('Database initialization failed', error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError('Invalid query parameters', error.message);
  }

  // Re-throw if it's already our custom error
  if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof NotFoundError) {
    throw error;
  }

  // Unknown error
  throw new DatabaseError('An unexpected error occurred', error);
};

// Retry utility for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry validation errors or not found errors
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
};

// Export singleton instance
export const db = DatabaseManager.getInstance();

// Export Prisma client for direct access when needed
export const prisma = db.getClient();