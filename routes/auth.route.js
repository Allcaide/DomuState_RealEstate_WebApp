import express from 'express';
import { register, login, getUserInfo, logout } from '../controllers/auth.controllers.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getUserInfo);
router.post('/logout', authenticateToken, logout);

export default router;
//POSTMAN
//GET -- http://localhost:8800/api/auth/register
//{
//    "username": "john",
//    "email": "john@example.com",
//   "password": "123456"
//}