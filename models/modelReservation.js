const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parking: { type: mongoose.Schema.Types.ObjectId, ref: 'Parking', required: true },
  fechaReserva: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', reservationSchema);
