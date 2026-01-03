const { Pool } = require('pg');
const config = require('./config');

// Use DATABASE_URL if available (for Supabase/production), otherwise use config object
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for Supabase
        }
    })
    : new Pool(config.db);

// Test database connection
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${process.env.DATABASE_URL ? 'Supabase (Production)' : 'Local Database'}`);
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

module.exports = pool;
