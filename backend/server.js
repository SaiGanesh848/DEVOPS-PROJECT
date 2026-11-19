
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();
app.set('trust proxy', 1);
// Create uploads directory
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'secure-file-transfer-api',
  });
});

// Create default accounts if they do not exist
async function seedDefaultUsers() {
  const demoUsers = [
    {
      name: 'System Administrator',
      email: 'admin@admin.com',
      password: 'Admin@123',
      role: 'admin',
    },
    {
      name: 'Demo Sender',
      email: 'sender1@test.com',
      password: 'Demo@123',
      role: 'sender',
    },
    {
      name: 'Demo Recipient',
      email: 'recipient1@test.com',
      password: 'Demo@123',
      role: 'recipient',
    },
    {
      name: 'Demo Auditor',
      email: 'auditor@test.com',
      password: 'Demo@123',
      role: 'auditor',
    },
  ];

  for (const account of demoUsers) {
    const existingUser = await User.findOne({ email: account.email });

    if (!existingUser) {
      await User.create({
        ...account,
        isActive: true,
        storageUsed: 0,
      });

      console.log(`Created demo account: ${account.email}`);
    } else {
      console.log(`Account already exists: ${account.email}`);
    }
  }
}

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/files', require('./routes/files'));
app.use('/api/shares', require('./routes/shares'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.originalUrl}`,
  });
});

// Error handler
app.use(errorHandler);

// Start server only after database connection and account seeding
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log('MongoDB connection established.');

    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
