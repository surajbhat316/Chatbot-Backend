import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { User } from '../models';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export class UserController {
  /**
   * 6. List User Chats
   * GET /user/:userId/chats
   * Output: List of chats with member IDs from relational DB
   */
  async listUserChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = getParam(req.params.userId);

      if (!userId) {
        res.status(400).json({
          error: 'userId parameter is required.',
        });
        return;
      }

      const chats = await chatService.listUserChats(userId);

      res.status(200).json(chats);
    } catch (error: any) {
      console.error('Error listing user chats:', error);
      res.status(500).json({
        error: error.message || 'Internal server error while fetching user chats.',
      });
    }
  }

  /**
   * Helper: Create User
   * POST /user/create
   * Body: { id?, name?, email? }
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { id, name, email } = req.body;

      const user = await User.create({
        id,
        name,
        email,
      });

      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(400).json({
        error: error.message || 'Failed to create user.',
      });
    }
  }
}

export const userController = new UserController();
