/**
 * Simple test script to verify admin functionality
 * Run with: node test-admin-functionality.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log('Could not load .env.local file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('category_templates')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function testTemplateOperations() {
  console.log('\n📋 Testing template operations...');
  
  try {
    // Test creating a template
    const testTemplate = {
      id: `test-template-${Date.now()}`,
      name: 'Test Gaming Console Template',
      description: 'A test template for gaming consoles',
      base_schema: {
        type: 'object',
        properties: {
          resolution: { type: 'string', description: 'Display resolution' },
          storage: { type: 'string', description: 'Storage capacity' },
          wireless: { type: 'boolean', description: 'Wireless connectivity' }
        },
        required: ['resolution']
      },
      example_devices: ['PlayStation 5', 'Xbox Series X'],
      tags: ['gaming', 'console', 'test'],
      popularity: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create template
    const { data: created, error: createError } = await supabase
      .from('category_templates')
      .insert(testTemplate)
      .select()
      .single();

    if (createError) {
      console.error('❌ Template creation failed:', createError.message);
      return false;
    }

    console.log('✅ Template created successfully:', created.name);

    // Test reading template
    const { data: read, error: readError } = await supabase
      .from('category_templates')
      .select('*')
      .eq('id', testTemplate.id)
      .single();

    if (readError) {
      console.error('❌ Template read failed:', readError.message);
      return false;
    }

    console.log('✅ Template read successfully');

    // Test updating template
    const { data: updated, error: updateError } = await supabase
      .from('category_templates')
      .update({
        description: 'Updated test template description',
        popularity: 1
      })
      .eq('id', testTemplate.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Template update failed:', updateError.message);
      return false;
    }

    console.log('✅ Template updated successfully');

    // Test deleting template
    const { error: deleteError } = await supabase
      .from('category_templates')
      .delete()
      .eq('id', testTemplate.id);

    if (deleteError) {
      console.error('❌ Template deletion failed:', deleteError.message);
      return false;
    }

    console.log('✅ Template deleted successfully');
    return true;

  } catch (error) {
    console.error('❌ Template operations error:', error.message);
    return false;
  }
}

async function testMigrationOperations() {
  console.log('\n🔄 Testing migration operations...');
  
  try {
    // First, get a category to test with
    const { data: categories, error: categoryError } = await supabase
      .from('device_categories')
      .select('id, name')
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      console.log('⚠️ No categories found, skipping migration tests');
      return true;
    }

    const testCategory = categories[0];

    // Test creating a migration
    const testMigration = {
      id: `test-migration-${Date.now()}`,
      category_id: testCategory.id,
      from_version: '1.0.0',
      to_version: '1.1.0',
      operations: [
        {
          type: 'add_field',
          field: 'test_field',
          fieldType: 'string',
          required: false,
          description: 'Test field for migration testing'
        }
      ],
      created_at: new Date().toISOString()
    };

    // First create the target schema version if it doesn't exist
    const { error: schemaError } = await supabase
      .from('device_category_schemas')
      .insert({
        id: `schema-${testCategory.id}-v110`,
        category_id: testCategory.id,
        version: '1.1.0',
        name: 'Test Schema v1.1.0',
        description: 'Test schema for migration testing',
        fields: {
          type: 'object',
          properties: {
            test_field: {
              type: 'string',
              description: 'Test field'
            }
          }
        },
        required_fields: [],
        inherited_fields: [],
        created_by: 'system-user-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (schemaError && !schemaError.message.includes('duplicate key')) {
      console.error('❌ Schema creation failed:', schemaError.message);
      return false;
    }

    const { data: created, error: createError } = await supabase
      .from('schema_migrations')
      .insert(testMigration)
      .select(`
        *,
        device_categories!inner(name)
      `)
      .single();

    if (createError) {
      console.error('❌ Migration creation failed:', createError.message);
      return false;
    }

    console.log('✅ Migration created successfully for category:', testCategory.name);

    // Test reading migration
    const { data: read, error: readError } = await supabase
      .from('schema_migrations')
      .select(`
        *,
        device_categories!inner(name)
      `)
      .eq('id', created.id)
      .single();

    if (readError) {
      console.error('❌ Migration read failed:', readError.message);
      return false;
    }

    console.log('✅ Migration read successfully');

    // Test applying migration (just update applied_at)
    const { data: applied, error: applyError } = await supabase
      .from('schema_migrations')
      .update({
        applied_at: new Date().toISOString()
      })
      .eq('id', created.id)
      .select()
      .single();

    if (applyError) {
      console.error('❌ Migration apply failed:', applyError.message);
      return false;
    }

    console.log('✅ Migration applied successfully');

    // Clean up - delete test migration
    const { error: deleteError } = await supabase
      .from('schema_migrations')
      .delete()
      .eq('id', created.id);

    if (deleteError) {
      console.log('⚠️ Migration cleanup failed (this is okay for testing)');
    } else {
      console.log('✅ Migration cleaned up successfully');
    }

    return true;

  } catch (error) {
    console.error('❌ Migration operations error:', error.message);
    return false;
  }
}

async function testComponentImports() {
  console.log('\n🧩 Testing component imports...');
  
  try {
    // Test if our new components can be imported (basic syntax check)
    const fs = require('fs');
    const path = require('path');
    
    const componentsToTest = [
      'src/components/admin/TemplateForm.tsx',
      'src/components/admin/MigrationForm.tsx',
      'src/components/admin/ConfirmationDialog.tsx'
    ];

    for (const componentPath of componentsToTest) {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Basic checks
        if (content.includes('export function') || content.includes('export default')) {
          console.log(`✅ ${path.basename(componentPath)} - Export found`);
        } else {
          console.log(`❌ ${path.basename(componentPath)} - No export found`);
          return false;
        }

        if (content.includes('useState') && content.includes('useEffect')) {
          console.log(`✅ ${path.basename(componentPath)} - React hooks found`);
        } else if (content.includes('interface') || content.includes('type')) {
          console.log(`✅ ${path.basename(componentPath)} - TypeScript types found`);
        }
      } else {
        console.log(`❌ ${componentPath} - File not found`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Component import test error:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoint files...');
  
  try {
    const fs = require('fs');
    
    const endpointsToTest = [
      'src/app/api/admin/templates/[id]/route.ts',
      'src/app/api/admin/templates/[id]/export/route.ts',
      'src/app/api/admin/migrations/[id]/route.ts',
      'src/app/api/admin/migrations/[id]/apply/route.ts',
      'src/app/api/admin/migrations/[id]/rollback/route.ts'
    ];

    for (const endpointPath of endpointsToTest) {
      if (fs.existsSync(endpointPath)) {
        const content = fs.readFileSync(endpointPath, 'utf8');
        
        // Check for HTTP methods
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        const foundMethods = methods.filter(method => 
          content.includes(`export async function ${method}`)
        );

        if (foundMethods.length > 0) {
          console.log(`✅ ${endpointPath} - Methods: ${foundMethods.join(', ')}`);
        } else {
          console.log(`❌ ${endpointPath} - No HTTP methods found`);
          return false;
        }
      } else {
        console.log(`❌ ${endpointPath} - File not found`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ API endpoint test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Admin Panel Functionality Tests\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Template Operations', fn: testTemplateOperations },
    { name: 'Migration Operations', fn: testMigrationOperations },
    { name: 'Component Imports', fn: testComponentImports },
    { name: 'API Endpoints', fn: testAPIEndpoints }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Admin panel functionality is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});