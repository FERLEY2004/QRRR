// JWT Configuration
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sena_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

export default { generateToken, verifyToken };
