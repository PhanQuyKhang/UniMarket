// Simple test script to verify Supabase connection
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing Supabase Connection...');
console.log('📍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env file!');
    console.log('Please add this line to your .env file:');
    console.log('DATABASE_URL=postgresql://postgres:hcmut%40dath123@db.dkyrbffkwtruwnjrjzna.supabase.co:5432/postgres');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to Supabase!');

        // Test query
        const result = await client.query('SELECT NOW()');
        console.log('✅ Test query successful! Server time:', result.rows[0].now);

        // Check if tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        console.log('\n📊 Tables in database:');
        if (tablesResult.rows.length === 0) {
            console.log('  ⚠️  No tables found! You need to create tables in Supabase.');
        } else {
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        client.release();
        await pool.end();
        console.log('\n✅ Connection test complete!');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
