import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import mediaRoutes from './routes/media.js';
import publicationRoutes from './routes/publications.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';

// Load env vars
dotenv.config();
// Initialize database connection
connectDB();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Only serve static files and handle React routing in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(join(__dirname, '../dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `Node Server Running In ${process.env.DEV_MODE} on port : ${PORT} `
  );
});

export default app;