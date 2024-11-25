const express = require('express');
const Reservation = require('../models/modelReservation');
const Parking = require('../models/modelParking');
const User = require('../models/modelUser');  // Asegúrate de que tienes un modelo User para la validación
const router = express.Router();

// Crear una reserva
router.post('/', async (req, res) => {
  const { userId, parkingId } = req.body;

  try {
    // Verificar que el estacionamiento existe
    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(400).send('Estacionamiento no encontrado');
    }

    // Verificar si el estacionamiento ya está reservado
    if (parking.estado === 'reservado') {
      return res.status(400).send('Estacionamiento no disponible');
    }

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send('Usuario no encontrado');
    }

    // Crear la reserva
    const reservation = new Reservation({ usuario: userId, parking: parkingId });
    await reservation.save();

    // Actualizar el estado del estacionamiento
    parking.estado = 'reservado';
    await parking.save();

    res.status(201).json({
      message: 'Reserva creada con éxito',
      reservation,
      parking,
    });
  } catch (err) {
    console.error('Error al crear la reserva:', err);
    res.status(500).send('Error al crear la reserva');
  }
});

module.exports = router;
