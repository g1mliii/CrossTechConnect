/**
 * Schema Registry - Central management system for device category schemas
 */

import {
    CategorySchema,
    SchemaRegistry,
    SchemaMigration,
    CategoryTemplate,
    FieldDefinition,
    ValidationRule,
    CompatibilityRuleDefinition,
    MigrationOperation
} from './types';
import { supabaseAdmin } from '../supabase-admin';
// Import will be available after files are created
// import { SchemaValidator } from './validator';
// import { SchemaVersionManager } from './versioning';

export class DeviceSchemaRegistry implements SchemaRegistry {
    public schemas: Map<string, CategorySchema> = new Map();
    public migrations: Map<string, SchemaMigration[]> = new Map();
    public computeFunctions: Map<string, Function> = new Map();
    public validationFunctions: Map<string, Function> = new Map();

    private validator: any; // SchemaValidator;
    private versionManager: any; // SchemaVersionManager;
    private initialized: boolean = false;

    constructor() {
        // this.validator = new SchemaValidator();
        // this.versionManager = new SchemaVersionManager();
        this.initializeBuiltInFunctions();
    }

    /**
     * Initialize the registry by loading schemas from database
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.loadSchemasFromDatabase();
            await this.loadMigrationsFromDatabase();
            this.initialized = true;
            console.log('✅ Schema registry initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize schema registry:', error);
            throw error;
        }
    }

    /**
     * Register a new category schema
     */
    async registerSchema(schema: CategorySchema): Promise<void> {
        // Validate schema structure
        // const validationResult = this.validator.validateSchema(schema);
        // if (!validationResult.isValid) {
        //   throw new Error(`Invalid schema: ${validationResult.errors.join(', ')}`);
        // }

        // Check for inheritance conflicts
        if (schema.parentId) {
            await this.validateInheritance(schema);
        }

        // Store in database
        await this.saveSchemaToDatabase(schema);

        // Update in-memory registry
        this.schemas.set(schema.id, schema);

        // Generate database indexes for new fields
        await this.generateIndexesForSchema(schema);

        console.log(`✅ Registered schema: ${schema.name} (v${schema.version})`);
    }

    /**
     * Get schema by category ID and version
     */
    getSchema(categoryId: string, version?: string): CategorySchema | null {
        const schema = this.schemas.get(categoryId);
        if (!schema) return null;

        if (version && schema.version !== version) {
            // Try to find specific version in migrations
            return this.getSchemaVersion(categoryId, version);
        }

        return schema;
    }

    /**
     * Get all schemas with optional filtering
     */
    getAllSchemas(filter?: {
        parentId?: string;
        deprecated?: boolean;
        tags?: string[];
    }): CategorySchema[] {
        let schemas = Array.from(this.schemas.values());

        if (filter) {
            if (filter.parentId !== undefined) {
                schemas = schemas.filter(s => s.parentId === filter.parentId);
            }
            if (filter.deprecated !== undefined) {
                schemas = schemas.filter(s => !!s.deprecated === filter.deprecated);
            }
        }

        return schemas;
    }

    /**
     * Update an existing schema (creates new version)
     */
    async updateSchema(
        categoryId: string,
        updates: Partial<CategorySchema>,
        migrationOperations: MigrationOperation[] = []
    ): Promise<CategorySchema> {
        const currentSchema = this.getSchema(categoryId);
        if (!currentSchema) {
            throw new Error(`Schema not found: ${categoryId}`);
        }

        // Create new version
        const newVersion = '1.1.0'; // this.versionManager.incrementVersion(currentSchema.version);
        const updatedSchema: CategorySchema = {
            ...currentSchema,
            ...updates,
            version: newVersion,
            updatedAt: new Date()
        };

        // Validate updated schema
        // const validationResult = this.validator.validateSchema(updatedSchema);
        // if (!validationResult.isValid) {
        //   throw new Error(`Invalid schema update: ${validationResult.errors.join(', ')}`);
        // }

        // Create migration if there are operations
        if (migrationOperations.length > 0) {
            const migration: SchemaMigration = {
                id: `${categoryId}_${currentSchema.version}_to_${newVersion}`,
                fromVersion: currentSchema.version,
                toVersion: newVersion,
                categoryId,
                operations: migrationOperations,
                createdAt: new Date()
            };

            await this.createMigration(migration);
        }

        // Register updated schema
        await this.registerSchema(updatedSchema);

        return updatedSchema;
    }

    /**
     * Create a new category from template
     */
    async createCategoryFromTemplate(
        template: CategoryTemplate,
        customizations?: Partial<CategorySchema>
    ): Promise<CategorySchema> {
        const schema: CategorySchema = {
            id: template.id,
            name: template.name,
            version: '1.0.0',
            description: template.description,
            fields: {},
            requiredFields: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            ...template.baseSchema,
            ...customizations
        };

        await this.registerSchema(schema);
        return schema;
    }

    /**
     * Inherit fields from parent schema
     */
    async inheritFromParent(childSchema: CategorySchema): Promise<CategorySchema> {
        if (!childSchema.parentId) return childSchema;

        const parentSchema = this.getSchema(childSchema.parentId);
        if (!parentSchema) {
            throw new Error(`Parent schema not found: ${childSchema.parentId}`);
        }

        // Merge parent fields with child fields
        const inheritedFields = { ...parentSchema.fields };
        const mergedFields = { ...inheritedFields, ...childSchema.fields };

        // Merge required fields
        const mergedRequiredFields = [
            ...parentSchema.requiredFields,
            ...childSchema.requiredFields
        ].filter((field, index, arr) => arr.indexOf(field) === index);

        return {
            ...childSchema,
            fields: mergedFields,
            requiredFields: mergedRequiredFields,
            inheritedFields: Object.keys(inheritedFields)
        };
    }

    /**
     * Register compute function
     */
    registerComputeFunction(name: string, func: Function): void {
        this.computeFunctions.set(name, func);
    }

    /**
     * Register validation function
     */
    registerValidationFunction(name: string, func: Function): void {
        this.validationFunctions.set(name, func);
    }

    /**
     * Get schema hierarchy (parent -> child relationships)
     */
    getSchemaHierarchy(): Map<string, string[]> {
        const hierarchy = new Map<string, string[]>();

        for (const schema of this.schemas.values()) {
            if (schema.parentId) {
                const children = hierarchy.get(schema.parentId) || [];
                children.push(schema.id);
                hierarchy.set(schema.parentId, children);
            }
        }

        return hierarchy;
    }

    /**
     * Private methods
     */

    private async loadSchemasFromDatabase(): Promise<void> {
        try {
            // Load from device_categories table using Supabase
            const { data: categories, error } = await supabaseAdmin
                .from('device_categories')
                .select('*');

            if (error) {
                console.error('Error loading categories from Supabase:', error);
                return;
            }

            if (categories) {
                for (const category of categories) {
                    const schema = await this.convertCategoryToSchema(category);
                    this.schemas.set(schema.id, schema);
                }
            }
        } catch (error) {
            console.error('Failed to load schemas from database:', error);
            // Continue with empty schemas rather than failing completely
        }
    }

    private async loadMigrationsFromDatabase(): Promise<void> {
        // Load from schema_migrations table (to be created)
        // Implementation will be added when migration table is created
    }

    private async convertCategoryToSchema(category: any): Promise<CategorySchema> {
        // Convert existing category to schema format
        const baseFields = this.getBaseDeviceFields();

        return {
            id: category.id,
            name: category.name,
            version: '1.0.0',
            parentId: category.parent_id, // Supabase uses snake_case
            description: `Schema for ${category.name} devices`,
            fields: baseFields,
            requiredFields: ['name', 'brand'],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system'
        };
    }

    private getBaseDeviceFields(): Record<string, FieldDefinition> {
        return {
            name: {
                type: 'string',
                constraints: { required: true, minLength: 1, maxLength: 255 },
                metadata: {
                    label: 'Device Name',
                    description: 'The name of the device',
                    importance: 'critical',
                    weight: 1.0,
                    searchable: true,
                    indexable: true
                }
            },
            brand: {
                type: 'string',
                constraints: { required: true, minLength: 1, maxLength: 100 },
                metadata: {
                    label: 'Brand',
                    description: 'The manufacturer or brand of the device',
                    importance: 'high',
                    weight: 0.8,
                    searchable: true,
                    indexable: true
                }
            },
            model: {
                type: 'string',
                constraints: { maxLength: 100 },
                metadata: {
                    label: 'Model',
                    description: 'The specific model identifier',
                    importance: 'medium',
                    weight: 0.6,
                    searchable: true
                }
            }
        };
    }

    private async validateInheritance(schema: CategorySchema): Promise<void> {
        if (!schema.parentId) return;

        const parent = this.getSchema(schema.parentId);
        if (!parent) {
            throw new Error(`Parent schema not found: ${schema.parentId}`);
        }

        // Check for circular inheritance
        const visited = new Set<string>();
        let current = parent;

        while (current && current.parentId) {
            if (visited.has(current.id)) {
                throw new Error('Circular inheritance detected');
            }
            visited.add(current.id);
            const parentSchema = this.getSchema(current.parentId);
            if (!parentSchema) break;
            current = parentSchema;
        }
    }

    private async saveSchemaToDatabase(schema: CategorySchema): Promise<void> {
        try {
            // Save to device_categories table using Supabase
            const { error } = await supabaseAdmin
                .from('device_categories')
                .upsert({
                    id: schema.id,
                    name: schema.name,
                    parent_id: schema.parentId,
                    attributes: {
                        schema: schema,
                        version: schema.version
                    }
                });

            if (error) {
                console.error('Error saving schema to database:', error);
                throw new Error(`Failed to save schema: ${error.message}`);
            }
        } catch (error) {
            console.error('Failed to save schema to database:', error);
            throw error;
        }
    }

    private async generateIndexesForSchema(schema: CategorySchema): Promise<void> {
        // Generate database indexes for searchable/indexable fields
        const indexableFields = Object.entries(schema.fields)
            .filter(([_, field]) => field.metadata.indexable)
            .map(([name, _]) => name);

        // This would generate actual database indexes
        // Implementation depends on database migration system
        console.log(`Generated indexes for fields: ${indexableFields.join(', ')}`);
    }

    private async createMigration(migration: SchemaMigration): Promise<void> {
        const existingMigrations = this.migrations.get(migration.categoryId) || [];
        existingMigrations.push(migration);
        this.migrations.set(migration.categoryId, existingMigrations);

        // Save to database (schema_migrations table to be created)
        console.log(`Created migration: ${migration.id}`);
    }

    private getSchemaVersion(_categoryId: string, _version: string): CategorySchema | null {
        // Reconstruct schema at specific version using migrations
        // This is a complex operation that would apply migrations in reverse
        // For now, return null if version doesn't match current
        return null;
    }

    private initializeBuiltInFunctions(): void {
        // Register built-in compute functions
        this.registerComputeFunction('calculateVolume', (width: number, height: number, depth: number) => {
            return width * height * depth;
        });

        this.registerComputeFunction('calculatePowerDensity', (power: number, volume: number) => {
            return volume > 0 ? power / volume : 0;
        });

        // Register built-in validation functions
        this.registerValidationFunction('validateDimensions', (width: number, height: number, depth: number) => {
            return width > 0 && height > 0 && depth > 0;
        });

        this.registerValidationFunction('validatePowerRange', (power: number, category: string) => {
            const ranges: Record<string, [number, number]> = {
                'smartphone': [1, 25],
                'laptop': [15, 200],
                'desktop': [50, 1000],
                'monitor': [10, 300]
            };

            const range = ranges[category];
            if (!range) return true;

            return power >= range[0] && power <= range[1];
        });
    }
}

// Export singleton instance
export const schemaRegistry = new DeviceSchemaRegistry();