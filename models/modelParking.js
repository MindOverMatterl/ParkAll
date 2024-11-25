const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  ubicacion: { type: String, required: true },
  precio: { type: Number, required: true },
  publicador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  disponible: { type: Boolean, default: true }, // Indica si el estacionamiento está disponible
  reservadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Referencia al usuario que reservó el estacionamiento
  imagen: { type: String, default: null } // Nueva propiedad para almacenar la URL o ruta de la imagen
});

const Parking = mongoose.model('Parking', parkingSchema);

module.exports = Parking;
