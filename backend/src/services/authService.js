const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const jwtConfig = require('../config/jwt');

const BCRYPT_ROUNDS = 10;

/**
 * Register a new user
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} password - User's plain text password
 * @returns {Promise<{id: number, username: string, email: string}>}
 */
async function register(username, email, password) {
  // Check if email already exists
  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  
  if (existingUsers.length > 0) {
    const error = new Error('Email already exists');
    error.code = 'EMAIL_EXISTS';
    error.status = 409;
    throw error;
  }
  
  // Check if username already exists
  const [existingUsernames] = await pool.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  
  if (existingUsernames.length > 0) {
    const error = new Error('Username already exists');
    error.code = 'USERNAME_EXISTS';
    error.status = 409;
    throw error;
  }
  
  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  
  // Insert new user
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );
  
  return {
    id: result.insertId,
    username,
    email
  };
}


/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User's plain text password
 * @returns {Promise<{user: object, token: string}>}
 */
async function login(email, password) {
  // Find user by email
  const [users] = await pool.execute(
    'SELECT id, username, email, password_hash FROM users WHERE email = ?',
    [email]
  );
  
  if (users.length === 0) {
    const error = new Error('该邮箱未注册');
    error.code = 'USER_NOT_FOUND';
    error.status = 401;
    throw error;
  }
  
  const user = users[0];
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    const error = new Error('密码错误');
    error.code = 'WRONG_PASSWORD';
    error.status = 401;
    throw error;
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    token
  };
}

/**
 * Get user by ID
 * @param {number} userId - User's ID
 * @returns {Promise<{id: number, username: string, email: string}>}
 */
async function getUserById(userId) {
  const [users] = await pool.execute(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [userId]
  );
  
  if (users.length === 0) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    error.status = 404;
    throw error;
  }
  
  return users[0];
}

/**
 * Delete user by ID (for testing purposes)
 * @param {number} userId - User's ID
 */
async function deleteUser(userId) {
  await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
}

module.exports = {
  register,
  login,
  getUserById,
  deleteUser,
  BCRYPT_ROUNDS
};
