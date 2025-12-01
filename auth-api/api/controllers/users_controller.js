const pool = require('../../config/db');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombres, apellido1, apellido2, email, rol, created_at 
       FROM users
       ORDER BY id ASC`
    );

    res.json({
      message: 'Lista de usuarios obtenida correctamente',
      total: result.rows.length,
      users: result.rows
    });

  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
