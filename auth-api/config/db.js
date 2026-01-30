require('dotenv').config(); 
const { Pool } = require('pg');

console.log(">>> PASSWORD QUE NODE ESTA USANDO:", JSON.stringify(process.env.DB_PASSWORD));

// --- Configuración del Pool de Conexiones ---
const pool = new Pool({
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    //host: process.env.DB_HOST, // para dev
    //port: process.env.DB_PORT, // para dev
    //ssl: { rejectUnauthorized: false,    } // para dev

    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`, //IMPORTANTE Para produccion
    ssl: false  // IMPORTANTE Para produccion
    // IMPORTANTE PARA EVITAR TLS + PROXY ERRORS EN CLOUD SQL
    
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
    connect: () => pool.connect(),
};