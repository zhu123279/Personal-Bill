const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authMiddleware, invalidateToken } = require('../middleware/auth');

// User registration
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username, email, and password are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters'
      });
    }
    
    const user = await authService.register(username, email, password);
    
    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.status(409).json({
        error: 'Conflict',
        code: err.code,
        message: '该邮箱已被注册'
      });
    }
    if (err.code === 'USERNAME_EXISTS') {
      return res.status(409).json({
        error: 'Conflict',
        code: err.code,
        message: '该用户名已被使用'
      });
    }
    next(err);
  }
});

// User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    if (err.code === 'USER_NOT_FOUND' || err.code === 'WRONG_PASSWORD') {
      return res.status(401).json({
        error: 'Unauthorized',
        code: err.code,
        message: err.message
      });
    }
    next(err);
  }
});

// User logout
router.post('/logout', authMiddleware, (req, res) => {
  invalidateToken(req.token);
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
