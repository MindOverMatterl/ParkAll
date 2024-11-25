const admin = require('firebase-admin');

const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];  // Obtener el token desde el header

  if (!token) {
    return res.status(401).json({ message: 'Autenticación requerida' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;  // Guardar el usuario autenticado en la solicitud
    next();  // Pasar al siguiente middleware o ruta
  } catch (error) {
    console.error('Error al verificar el token', error);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = checkAuth;
