const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Store for invalidated tokens (in production, use Redis)
const invalidatedTokens = new Set();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Check if token has been invalidated (logged out)
  if (invalidatedTokens.has(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token has been invalidated'
    });
  }
  
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

const invalidateToken = (token) => {
  invalidatedTokens.add(token);
};

const isTokenInvalidated = (token) => {
  return invalidatedTokens.has(token);
};

module.exports = { authMiddleware, invalidateToken, isTokenInvalidated };
