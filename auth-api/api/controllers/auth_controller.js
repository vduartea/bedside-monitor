const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
exports.register = async (req, res) => {
  try {
    const { nombres, apellido1, apellido2, email, rol, password } = req.body;

    if (!nombres || !apellido1 || !email || !rol || !password) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Comprobar si existe usuario
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    await pool.query(
      `INSERT INTO users (nombres, apellido1, apellido2, email, rol, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nombres, apellido1, apellido2, email, rol, passwordHash]
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente'
    });

  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ message: 'Error interno' });
  }
};



// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son obligatorios' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];


    // Comparar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Crear token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token
    });

  } catch (err) {
      console.error('❌ ERROR en /login');
      console.error('Mensaje:', err.message);
      console.error('Stack:', err.stack);
      console.error('Detalles completos:', err);
      
      res.status(500).json({ 
        message: 'Error interno',
        error: err.message  // puedes comentar esto si no quieres exponer info al cliente
      });
    }

};
