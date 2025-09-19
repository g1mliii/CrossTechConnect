/**
 * Test page for admin functionality
 * Access at: http://localhost:3000/test-admin
 */

'use client';

import { useState } from 'react';
import { TemplateForm } from '@/components/admin/TemplateForm';
import { MigrationForm } from '@/components/admin/MigrationForm';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';

export default function TestAdminPage() {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showMigrationForm, setShowMigrationForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testTemplateAPI = async () => {
    try {
      addResult('Testing template API...');
      
      // Test GET templates
      const response = await fetch('/api/admin/templates');
      const result = await response.json();
      
      if (result.success) {
        addResult(`✅ Template API working - Found ${result.data.length} templates`);
      } else {
        addResult(`❌ Template API failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Template API error: ${error}`);
    }
  };

  const testMigrationAPI = async () => {
    try {
      addResult('Testing migration API...');
      
      // Test GET migrations
      const response = await fetch('/api/admin/migrations');
      const result = await response.json();
      
      if (result.success) {
        addResult(`✅ Migration API working - Found ${result.data.length} migrations`);
      } else {
        addResult(`❌ Migration API failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Migration API error: ${error}`);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      addResult('Saving template...');
      
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();
      if (result.success) {
        addResult(`✅ Template saved successfully: ${result.data.name}`);
      } else {
        addResult(`❌ Template save failed: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (error) {
      addResult(`❌ Template save error: ${error}`);
      throw error;
    }
  };

  const handleSaveMigration = async (migrationData: any) => {
    try {
      addResult('Saving migration...');
      
      const response = await fetch('/api/admin/migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(migrationData)
      });

      const result = await response.json();
      if (result.success) {
        addResult(`✅ Migration saved successfully`);
      } else {
        addResult(`❌ Migration save failed: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (error) {
      addResult(`❌ Migration save error: ${error}`);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel Test Page</h1>
        
        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testTemplateAPI}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Template API
          </button>
          
          <button
            onClick={testMigrationAPI}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test Migration API
          </button>
          
          <button
            onClick={() => setShowTemplateForm(true)}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Test Template Form
          </button>
          
          <button
            onClick={() => setShowMigrationForm(true)}
            className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Test Migration Form
          </button>
          
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Test Confirmation Dialog
          </button>
          
          <button
            onClick={() => setTestResults([])}
            className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Click the buttons above to run tests.</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('✅') 
                      ? 'bg-green-50 text-green-800' 
                      : result.includes('❌')
                      ? 'bg-red-50 text-red-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Component Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Component Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">TemplateForm</h3>
              <p className="text-sm text-green-700">✅ Component loaded successfully</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">MigrationForm</h3>
              <p className="text-sm text-green-700">✅ Component loaded successfully</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">ConfirmationDialog</h3>
              <p className="text-sm text-green-700">✅ Component loaded successfully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TemplateForm
        isOpen={showTemplateForm}
        onClose={() => setShowTemplateForm(false)}
        onSave={handleSaveTemplate}
      />

      <MigrationForm
        isOpen={showMigrationForm}
        onClose={() => setShowMigrationForm(false)}
        onSave={handleSaveMigration}
      />

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Test Confirmation"
        message="This is a test confirmation dialog. It's working correctly!"
        confirmText="Confirm"
        cancelText="Cancel"
        variant="info"
        onConfirm={() => {
          addResult('✅ Confirmation dialog confirmed');
          setShowConfirmDialog(false);
        }}
        onCancel={() => {
          addResult('ℹ️ Confirmation dialog cancelled');
          setShowConfirmDialog(false);
        }}
      />
    </div>
  );
}