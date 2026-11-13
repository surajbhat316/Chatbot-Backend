import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// 1. Create or Get 1:1 Chat
router.post('/create', (req, res) => chatController.createChat(req, res));

// 2. Send Message
router.post('/:chatId/message/send', (req, res) => chatController.sendMessage(req, res));

// 3. Get Messages
router.get('/:chatId/messages', (req, res) => chatController.getMessages(req, res));

// Bonus: Edit Message
router.patch('/:chatId/message/:messageId', (req, res) => chatController.editMessage(req, res));
router.put('/:chatId/message/:messageId', (req, res) => chatController.editMessage(req, res));

// 4. Mark Message Read
router.post('/:chatId/message/:messageId/read', (req, res) => chatController.markMessageRead(req, res));

// 5. Update Last Seen Message
router.post('/:chatId/lastseen', (req, res) => chatController.updateLastSeen(req, res));

export default router;
