import express from 'express';
import { protect } from '../middleware/auth.js';
import { getCurrentUser, loginController, registerController } from '../controllers/authControllers.js';

const router = express.Router();


// Login route (no JWT tokens)
router.post('/login', loginController);

// Register route (no JWT tokens)
router.post('/register', registerController);

// Get current user route (simplified)
router.get('/me', protect, getCurrentUser );

export default router;