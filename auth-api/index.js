require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./api/routes/auth');
const usersRoutes = require('./api/routes/users');


const app = express();
app.use(cors());
app.use(express.json());

// Ruta general de tu API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
  res.send('API funcionando correctamente 🚀');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
