require('dotenv').config();

module.exports = {
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'Demodb',
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 5432,
    },
    server: {
        port: parseInt(process.env.PORT) || 5000,
        env: process.env.NODE_ENV || 'development',
    },
    app: {
        url: process.env.APP_URL || 'http://localhost:5000',
    },
};
