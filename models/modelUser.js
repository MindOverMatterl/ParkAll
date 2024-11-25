const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firebaseUid: { type: String, required: true, unique: true }  // Asegúrate de tener el campo firebaseUid
});

module.exports = mongoose.model('User', userSchema);
