// routes/auth_routes.js
const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/modelUser'); // Modelo de usuario para MongoDB
const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    // Crear el usuario en Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: nombre  // Guardamos el nombre en el perfil de Firebase
    });

    // Crear el documento del usuario en MongoDB con el UID de Firebase
    const newUser = new User({
      nombre: nombre,
      email: email,
      firebaseUid: userRecord.uid  // Guardamos el UID de Firebase
    });

    // Guardamos el usuario en MongoDB
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(400).json({ message: 'Error al registrar el usuario', error: error.message });
  }
});

// Ruta para iniciar sesión (simplificado para este ejemplo)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar las credenciales del usuario con Firebase
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // (Opcional) Aquí puedes agregar lógica para verificar la contraseña si lo deseas

    // Buscar el usuario en MongoDB utilizando el UID de Firebase
    const userMongo = await User.findOne({ firebaseUid: userRecord.uid });

    res.status(200).json({ message: 'Usuario autenticado', user: userMongo });
  } catch (error) {
    console.error('Error al autenticar al usuario:', error);
    res.status(400).json({ message: 'Error al autenticar', error: error.message });
  }
});

module.exports = router;
