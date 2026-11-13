import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// 6. List User Chats
router.get('/:userId/chats', (req, res) => userController.listUserChats(req, res));

// Helper: Create a user in MySQL
router.post('/create', (req, res) => userController.createUser(req, res));

export default router;
