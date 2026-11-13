import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { firestoreService } from '../services/firestore.service';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export class ChatController {
  /**
   * 1. Create or Get Chat
   * POST /chat/create
   * Body: { userAId, userBId }
   * Output: { chatId }
   */
  async createChat(req: Request, res: Response): Promise<void> {
    try {
      const { userAId, userBId } = req.body;

      if (!userAId || !userBId) {
        res.status(400).json({
          error: 'Both userAId and userBId are required.',
        });
        return;
      }

      if (userAId === userBId) {
        res.status(400).json({
          error: 'userAId and userBId must be distinct for a 1:1 chat.',
        });
        return;
      }

      const chatId = await chatService.createOrGet1on1Chat(String(userAId), String(userBId));

      res.status(200).json({
        chatId,
      });
    } catch (error: any) {
      console.error('Error creating/getting chat:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while creating chat.',
      });
    }
  }

  /**
   * 2. Send Message
   * POST /chat/:chatId/message/send
   * Body: { senderId, text }
   * Output: Stored message with timestamp
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const chatId = getParam(req.params.chatId);
      const { senderId, text } = req.body;

      if (!senderId || typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({
          error: 'senderId and non-empty text are required.',
        });
        return;
      }

      // Verify that sender is a member of the chat in MySQL
      const isMember = await chatService.isMemberOfChat(chatId, String(senderId));
      if (!isMember) {
        res.status(403).json({
          error: `User "${senderId}" is not a registered member of chat "${chatId}".`,
        });
        return;
      }

      const message = await firestoreService.sendMessage(chatId, String(senderId), text.trim());

      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while sending message.',
      });
    }
  }

  /**
   * 3. Get Messages
   * GET /chat/:chatId/messages?limit=50
   * Output: List of messages ordered by timestamp
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const chatId = getParam(req.params.chatId);
      const limit = req.query.limit ? Math.min(Math.max(1, Number(req.query.limit)), 100) : 50;

      const messages = await firestoreService.getMessages(chatId, limit);

      res.status(200).json(messages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while fetching messages.',
      });
    }
  }

  /**
   * Bonus: Edit Message
   * PATCH /chat/:chatId/message/:messageId
   * Body: { userId, text }
   * Output: Updated message
   */
  async editMessage(req: Request, res: Response): Promise<void> {
    try {
      const chatId = getParam(req.params.chatId);
      const messageId = getParam(req.params.messageId);
      const { userId, text } = req.body;

      if (!userId || typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({
          error: 'userId and non-empty text are required.',
        });
        return;
      }

      // Verify that user is a member of the chat in MySQL
      const isMember = await chatService.isMemberOfChat(chatId, String(userId));
      if (!isMember) {
        res.status(403).json({
          error: `User "${userId}" is not a member of chat "${chatId}".`,
        });
        return;
      }

      const updatedMessage = await firestoreService.editMessage(
        chatId,
        messageId,
        String(userId),
        text.trim()
      );

      res.status(200).json(updatedMessage);
    } catch (error: any) {
      console.error('Error editing message:', error);
      const statusCode = error.status || (error.message?.includes('not found') ? 404 : 500);
      res.status(statusCode).json({
        error: error.message || 'Internal server error while editing message.',
      });
    }
  }

  /**
   * 4. Mark Message Read
   * POST /chat/:chatId/message/:messageId/read
   * Body: { userId }
   * Output: Update read receipt in Firestore
   */
  async markMessageRead(req: Request, res: Response): Promise<void> {
    try {
      const chatId = getParam(req.params.chatId);
      const messageId = getParam(req.params.messageId);
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          error: 'userId is required.',
        });
        return;
      }

      // Check if user is a member of this chat
      const isMember = await chatService.isMemberOfChat(chatId, String(userId));
      if (!isMember) {
        res.status(403).json({
          error: `User "${userId}" is not a member of chat "${chatId}".`,
        });
        return;
      }

      const result = await firestoreService.markMessageRead(chatId, messageId, String(userId));

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error marking message read:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while marking message read.',
      });
    }
  }

  /**
   * 5. Update Last Seen Message
   * POST /chat/:chatId/lastseen
   * Body: { userId, messageId }
   * Output: Update last seen message per user in Firestore
   */
  async updateLastSeen(req: Request, res: Response): Promise<void> {
    try {
      const chatId = getParam(req.params.chatId);
      const { userId, messageId } = req.body;

      if (!userId || !messageId) {
        res.status(400).json({
          error: 'Both userId and messageId are required.',
        });
        return;
      }

      const isMember = await chatService.isMemberOfChat(chatId, String(userId));
      if (!isMember) {
        res.status(403).json({
          error: `User "${userId}" is not a member of chat "${chatId}".`,
        });
        return;
      }

      const record = await firestoreService.updateLastSeen(chatId, String(userId), String(messageId));

      res.status(200).json({
        success: true,
        chatId,
        ...record,
      });
    } catch (error: any) {
      console.error('Error updating last seen message:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while updating last seen.',
      });
    }
  }
}

export const chatController = new ChatController();
