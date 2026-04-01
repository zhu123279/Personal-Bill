const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const billRoutes = require('./routes/bills');
const categoryRoutes = require('./routes/categories');
const statsRoutes = require('./routes/stats');
const assetRoutes = require('./routes/assets');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS 配置 - 使用统一配置
const config = require('./config');

app.use(cors({
  origin: function(origin, callback) {
    // 允许无 origin 的请求（如移动端、Postman）
    if (!origin) return callback(null, true);
    
    if (config.cors.origins.includes(origin) || config.cors.origins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/assets', assetRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

module.exports = app;
