/**
 * Tests for Admin API Endpoints
 */

import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database and dependencies
vi.mock('@/lib/database', () => ({
  prisma: {
    deviceCategory: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'test-1', name: 'Test Category 1' },
        { id: 'test-2', name: 'Test Category 2' }
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-1',
        name: 'Test Category 1'
      })
    },
    schemaMigration: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'migration-1',
        categoryId: 'test-1',
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        operations: [],
        createdAt: new Date(),
        appliedAt: null
      })
    },
    categoryTemplate: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        description: 'Test template',
        baseSchema: {},
        exampleDevices: [],
        tags: [],
        popularity: 0
      })
    }
  },
  handlePrismaError: vi.fn()
}));

vi.mock('@/lib/schema/registry', () => ({
  schemaRegistry: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllSchemas: vi.fn().mockReturnValue([
      {
        id: 'test-schema',
        name: 'Test Schema',
        version: '1.0.0',
        fields: {},
        requiredFields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test'
      }
    ]),
    getSchema: vi.fn().mockReturnValue({
      id: 'test-schema',
      name: 'Test Schema',
      version: '1.0.0'
    })
  }
}));

vi.mock('@/lib/schema/templates', () => ({
  templateManager: {
    getAllTemplates: vi.fn().mockReturnValue([
      {
        id: 'built-in-template',
        name: 'Built-in Template',
        description: 'Built-in template',
        baseSchema: {},
        tags: ['test']
      }
    ])
  }
}));

describe('Admin API Endpoints', () => {
  describe('/api/schemas', () => {
    it('should get all schemas', async () => {
      const { GET } = await import('@/app/api/schemas/route');
      
      const request = new NextRequest('http://localhost:3000/api/schemas');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should get templates when requested', async () => {
      const { GET } = await import('@/app/api/schemas/route');
      
      const request = new NextRequest('http://localhost:3000/api/schemas?template=true');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should create schema from template', async () => {
      const { POST } = await import('@/app/api/schemas/route');
      
      const request = new NextRequest('http://localhost:3000/api/schemas', {
        method: 'POST',
        body: JSON.stringify({
          templateId: 'built-in-template',
          customizations: {
            name: 'Custom Category'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      }
    });
  });

  describe('/api/admin/migrations', () => {
    it('should get all migrations', async () => {
      const { GET } = await import('@/app/api/admin/migrations/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/migrations');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should create a migration', async () => {
      const { POST } = await import('@/app/api/admin/migrations/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/migrations', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: 'test-1',
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          operations: [{
            type: 'add_field',
            field: 'newField',
            definition: {
              type: 'string',
              metadata: { label: 'New Field', importance: 'low', weight: 0.3 }
            }
          }]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
      }
    });
  });

  describe('/api/admin/templates', () => {
    it('should get all templates', async () => {
      const { GET } = await import('@/app/api/admin/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/templates');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should create a template', async () => {
      const { POST } = await import('@/app/api/admin/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        body: JSON.stringify({
          template: {
            name: 'New Template',
            description: 'A new template',
            baseSchema: {
              fields: {
                name: {
                  type: 'string',
                  metadata: { label: 'Name', importance: 'high', weight: 0.8 }
                }
              }
            }
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      }
    });

    it('should import a template', async () => {
      const { POST } = await import('@/app/api/admin/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        body: JSON.stringify({
          import: true,
          template: {
            id: 'imported-template',
            name: 'Imported Template',
            description: 'An imported template',
            baseSchema: {
              fields: {
                name: {
                  type: 'string',
                  metadata: { label: 'Name', importance: 'high', weight: 0.8 }
                }
              }
            }
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      }
    });
  });

  describe('/api/admin/performance', () => {
    it('should get performance summary', async () => {
      const { GET } = await import('@/app/api/admin/performance/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/performance?type=summary');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.totalCategories).toBeTypeOf('number');
      }
    });

    it('should get optimization recommendations', async () => {
      const { GET } = await import('@/app/api/admin/performance/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/performance?type=recommendations');
      const response = await GET(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should track query performance', async () => {
      const { POST } = await import('@/app/api/admin/performance/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/performance', {
        method: 'POST',
        body: JSON.stringify({
          action: 'track_query',
          categoryId: 'test-1',
          queryType: 'search',
          duration: 150,
          success: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('should clear performance cache', async () => {
      const { POST } = await import('@/app/api/admin/performance/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/performance', {
        method: 'POST',
        body: JSON.stringify({
          action: 'clear_cache',
          categoryId: 'test-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const { POST } = await import('@/app/api/admin/migrations/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/migrations', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        expect(response.status).toBe(500); // Will be 500 due to validation errors
      }
    });

    it('should handle invalid JSON', async () => {
      const { POST } = await import('@/app/api/admin/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      if (response) {
        expect(response.status).toBe(500);
      }
    });
  });
});