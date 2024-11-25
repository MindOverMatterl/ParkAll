require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Importar el módulo fs para manejar el sistema de archivos

// Inicializar Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(require('./config/myFirebaseKey.json')),
  });
  console.log('Firebase Admin conectado');
} catch (error) {
  console.error('Error al conectar Firebase Admin:', error);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Verificar si la carpeta "uploads" existe, si no, crearla automáticamente
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Carpeta "uploads" creada automáticamente');
}

// Configuración de middleware
app.use(cors()); // Permitir solicitudes desde el frontend
app.use(express.json()); // Para recibir datos en formato JSON

// Configurar la carpeta "uploads" como estática para servir archivos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error al conectar MongoDB:', err));

// Rutas
const authRoutes = require('./routes/auth_routes'); // Ruta de autenticación
const parkingRoutes = require('./routes/parking_routes'); // Ruta de estacionamientos

app.use('/api/auth', authRoutes); // Usar las rutas de autenticación
app.use('/api/parking', parkingRoutes); // Usar las rutas de estacionamientos

// Ruta inicial
app.get('/', (req, res) => {
  res.send('¡Servidor ParkAll funcionando!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
