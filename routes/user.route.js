import express from 'express';
import { 
    getUserWithListings, 
    updateUser, 
    deleteUser,
    deleteUserPost
} from '../controllers/user.controllers.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get user profile with listings
router.get('/profile', getUserWithListings);

// Update user profile
router.put('/profile', updateUser);

// Delete user account
router.delete('/', deleteUser);

// Delete a specific user post
router.delete('/posts/:postId', deleteUserPost);

export default router;