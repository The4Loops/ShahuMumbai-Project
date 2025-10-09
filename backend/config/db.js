require('dotenv').config();

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ShahuMumbai',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    pool: {
        max: 100,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true' // True for local dev
    }
};

module.exports = sqlConfig;