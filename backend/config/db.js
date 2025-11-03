// config/db.js
require('dotenv').config();

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ShahuMumbai',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  pool: {
    max: 20,                 // <-- was 100
    min: 5,                  // keep a few warm
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    cancelTimeout: 5000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

module.exports = sqlConfig;