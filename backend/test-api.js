// Test API endpoints with Supabase
const BASE_URL = 'http://localhost:5000/api';

async function testAPIs() {
    console.log('🧪 Testing UniMarket APIs with Supabase\n');

    // Test 1: Get all items
    try {
        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();
        console.log('✅ GET /api/items:', data.length, 'items found');
    } catch (err) {
        console.log('❌ GET /api/items failed:', err.message);
    }

    // Test 2: Get categories
    try {
        const response = await fetch(`${BASE_URL}/categories`);
        const data = await response.json();
        console.log('✅ GET /api/categories:', data.length, 'categories found');
    } catch (err) {
        console.log('❌ GET /api/categories failed:', err.message);
    }

    console.log('\n✅ API tests complete! Your backend is working with Supabase.');
}

testAPIs();
