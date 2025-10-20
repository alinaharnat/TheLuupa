//utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const generateEmailVerificationToken = () => {
  // Генеруємо 6-значний код
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export { generateToken, generateEmailVerificationToken };