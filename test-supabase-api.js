// Test Supabase API connection
// Using built-in fetch (Node.js 18+)

async function testSupabaseAPI() {
  console.log('🔍 Testing Supabase API connection...');
  
  const supabaseUrl = 'https://koggpaphbvknvxvulwco.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZ2dwYXBoYnZrbnZ4dnVsd2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjk0NTMsImV4cCI6MjA3MzgwNTQ1M30.R_wQP_enlXw0_1a02PUeIILNeyc2HVTbeQ-iFTZgE14';
  
  try {
    // Test 1: Basic API connectivity
    console.log('\n📡 Test 1: Basic API connectivity...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Supabase API is reachable');
    
    // Test 2: Query existing data
    console.log('\n📊 Test 2: Querying existing data...');
    
    // Check users table
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('👥 Users found:', users.length);
      if (users.length > 0) {
        console.log('   Sample user:', users[0]);
      }
    } else {
      console.log('⚠️ Users query failed:', usersResponse.status, usersResponse.statusText);
    }
    
    // Check devices table
    const devicesResponse = await fetch(`${supabaseUrl}/rest/v1/devices?select=*&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (devicesResponse.ok) {
      const devices = await devicesResponse.json();
      console.log('📱 Devices found:', devices.length);
      if (devices.length > 0) {
        console.log('   Sample device:', devices[0]);
      }
    } else {
      console.log('⚠️ Devices query failed:', devicesResponse.status, devicesResponse.statusText);
    }
    
    // Check device_categories table
    const categoriesResponse = await fetch(`${supabaseUrl}/rest/v1/device_categories?select=*&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log('📂 Categories found:', categories.length);
      if (categories.length > 0) {
        console.log('   Sample category:', categories[0]);
      }
    } else {
      console.log('⚠️ Categories query failed:', categoriesResponse.status, categoriesResponse.statusText);
    }
    
    // Test 3: Test database write (insert a test user)
    console.log('\n✍️ Test 3: Testing database write...');
    
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password_hash: 'test_hash_123',
      display_name: 'Test User',
      reputation_score: 0
    };
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testUser)
    });
    
    if (insertResponse.ok) {
      const insertedUser = await insertResponse.json();
      console.log('✅ Database write successful!');
      console.log('   Inserted user:', insertedUser[0]);
      
      // Clean up - delete the test user
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${insertedUser[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('🧹 Test user cleaned up successfully');
      }
    } else {
      const errorText = await insertResponse.text();
      console.log('❌ Database write failed:', insertResponse.status, insertResponse.statusText);
      console.log('   Error details:', errorText);
    }
    
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testSupabaseAPI();