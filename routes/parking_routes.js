const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Parking = require('../models/modelParking'); // Modelo de Parking
const User = require('../models/modelUser'); // Modelo de Usuario
const router = express.Router();

// Configuración de multer para guardar imágenes localmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nombre único para cada archivo
  },
});

const upload = multer({ storage });

// Middleware para verificar si el usuario está autenticado
const checkAuth = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  // Aquí va la lógica para verificar el token (ejemplo con Firebase o JWT)
  try {
    admin.auth().verifyIdToken(token)
      .then(decodedToken => {
        req.user = decodedToken; // Guardamos la información del usuario autenticado en la solicitud
        next(); // Pasamos a la siguiente función (la ruta)
      })
      .catch(error => {
        res.status(401).json({ message: 'Token no válido', error });
      });
  } catch (error) {
    res.status(500).json({ message: 'Error en la autenticación', error });
  }
};

// Ruta para crear un estacionamiento
router.post('/create', upload.single('imagen'), async (req, res) => {
  const { descripcion, ubicacion, precio, publicadorId } = req.body;

  try {
    const publicadorObjectId = new mongoose.Types.ObjectId(publicadorId);

    const publicador = await User.findById(publicadorObjectId);

    if (!publicador) {
      return res.status(404).json({ message: 'Usuario no encontrado', publicadorId });
    }

    // Si hay una imagen subida, guarda la ruta
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    const newParking = new Parking({
      descripcion,
      ubicacion,
      precio,
      publicador: publicador._id,
      imagen, // Agregar la imagen al modelo
    });

    await newParking.save();

    res.status(201).json({ message: 'Estacionamiento creado exitosamente', parking: newParking });
  } catch (error) {
    console.error('Error al crear el estacionamiento:', error);
    res.status(500).json({ message: 'Error al crear el estacionamiento', error: error.message });
  }
});

// Ruta para reservar un estacionamiento
router.post('/reserve/:parkingId', async (req, res) => {
  const { parkingId } = req.params;
  const { userId } = req.body;

  try {
    const parking = await Parking.findById(parkingId);

    if (!parking) {
      return res.status(404).json({ message: 'Estacionamiento no encontrado' });
    }

    if (!parking.disponible) {
      return res.status(400).json({ message: 'El estacionamiento ya está reservado' });
    }

    if (parking.publicador.toString() === userId) {
      return res.status(400).json({ message: 'No puedes reservar tu propio estacionamiento' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    parking.disponible = false;
    parking.reservadoPor = user._id;

    await parking.save();

    res.status(200).json({ message: 'Estacionamiento reservado exitosamente', parking });
  } catch (error) {
    console.error('Error al reservar el estacionamiento:', error);
    res.status(500).json({ message: 'Error al reservar el estacionamiento', error: error.message });
  }
});

// Ruta para obtener todos los estacionamientos
router.get('/list', async (req, res) => {
  try {
    const parkings = await Parking.find().populate('publicador', 'nombre email');
    res.status(200).json({ parkings });
  } catch (error) {
    console.error('Error al obtener los estacionamientos:', error);
    res.status(500).json({ message: 'Error al obtener los estacionamientos', error: error.message });
  }
});

// Ruta para editar un estacionamiento
router.put('/edit/:parkingId', checkAuth, upload.single('imagen'), async (req, res) => {
  const { parkingId } = req.params;
  const { descripcion, ubicacion, precio } = req.body;

  try {
    const parking = await Parking.findById(parkingId);

    if (!parking) {
      return res.status(404).json({ message: 'Estacionamiento no encontrado' });
    }

    if (String(parking.publicador) !== String(req.user.uid)) {
      return res.status(403).json({ message: 'No tienes permiso para editar este estacionamiento' });
    }

    parking.descripcion = descripcion || parking.descripcion;
    parking.ubicacion = ubicacion || parking.ubicacion;
    parking.precio = precio || parking.precio;

    if (req.file) {
      parking.imagen = `/uploads/${req.file.filename}`;
    }

    const updatedParking = await parking.save();

    res.status(200).json({ message: 'Estacionamiento actualizado', parking: updatedParking });
  } catch (error) {
    console.error('Error al actualizar el estacionamiento:', error);
    res.status(500).json({ message: 'Error al actualizar el estacionamiento', error: error.message });
  }
});

// Ruta para obtener los estacionamientos de un usuario específico
router.get('/user/:userId/parkings', async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'El ID del usuario no es válido' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userParkings = await Parking.find({ publicador: userId }).populate('publicador', 'nombre email');

    res.status(200).json({
      message: 'Estacionamientos obtenidos exitosamente',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
      },
      parkings: userParkings,
    });
  } catch (error) {
    console.error('Error al obtener los estacionamientos del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Ruta para eliminar un estacionamiento
router.delete('/delete/:parkingId', checkAuth, async (req, res) => {
  const { parkingId } = req.params;

  try {
    const parking = await Parking.findById(parkingId);

    if (!parking) {
      return res.status(404).json({ message: 'Estacionamiento no encontrado' });
    }

    if (String(parking.publicador) !== String(req.user.uid)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este estacionamiento' });
    }

    await parking.remove();

    res.status(200).json({ message: 'Estacionamiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el estacionamiento:', error);
    res.status(500).json({ message: 'Error al eliminar el estacionamiento', error: error.message });
  }
});

module.exports = router;
