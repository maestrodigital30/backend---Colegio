const { Pool } = require('pg');
require('dotenv').config();

// Forzar timezone del proceso Node.js
process.env.TZ = process.env.TZ || 'America/Lima';

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

// Configurar timezone en cada conexión nueva para garantizar consistencia
pool.on('connect', (client) => {
  client.query("SET timezone = 'America/Lima'");
});

module.exports = pool;
