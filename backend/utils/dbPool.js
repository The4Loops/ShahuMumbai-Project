const sql = require('mssql');
const sqlConfig = require('../config/db');

class DatabasePool {
  constructor() {
    this.pool = null;
    this.connecting = false;
  }

  async connect() {
    if (this.pool?.connected) return this.pool;
    if (this.connecting) {
      // wait a tick and try again
      await new Promise(r => setTimeout(r, 100));
      return this.connect();
    }

    this.connecting = true;
    try {
      this.pool = await sql.connect(sqlConfig);
      console.log('Database pool connected');

      this.pool.on('error', err => {
        console.error('Pool error → will reconnect on next request:', err.message);
        this.pool = null;
      });

      this.pool.on('close', () => {
        console.warn('Pool closed → will reconnect on next request');
        this.pool = null;
      });

      return this.pool;
    } catch (err) {
      console.error('DB connection failed:', err.message);
      this.pool = null;
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  async getPool() {
    if (this.pool && this.pool.connected) {
      try {
        await this.pool.request().query('SELECT 1');
        return this.pool;
      } catch (_) {
        console.warn('Stale connection detected – reconnecting...');
        this.pool = null;
      }
    }
    return this.connect();
  }
}

module.exports = new DatabasePool();