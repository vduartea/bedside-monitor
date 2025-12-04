require('dotenv').config(); 
const { Pool } = require('pg');

console.log(">>> PASSWORD QUE NODE ESTA USANDO:", JSON.stringify(process.env.DB_PASSWORD));

// --- Configuración del Pool de Conexiones ---
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,

    // IMPORTANTE PARA EVITAR TLS + PROXY ERRORS EN CLOUD SQL
    ssl: {
        rejectUnauthorized: false,
    }
});

// Probar conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
    } else {
        console.log('✅ Conexión a Cloud SQL exitosa:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};