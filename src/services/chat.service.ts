import { Op, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import { User, Chat, ChatMember } from '../models';
import { UserChatSummary } from '../types';
import crypto from 'crypto';

export class ChatService {
  /**
   * Find a user or create them if they do not exist yet.
   */
  async findOrCreateUser(
    userId: string,
    name?: string,
    email?: string,
    transaction?: Transaction
  ): Promise<User> {
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        id: userId,
        name: name || `User_${userId.substring(0, 6)}`,
        email,
      },
      transaction,
    });
    return user;
  }

  /**
   * 1. Create or Get 1:1 Chat
   * Checks if a 1:1 chat between userA and userB already exists.
   * If yes, returns the existing chatId.
   * If not, creates the chat and member records atomically.
   */
  async createOrGet1on1Chat(userAId: string, userBId: string): Promise<string> {
    if (userAId === userBId) {
      throw new Error('A 1:1 chat requires two distinct user IDs.');
    }

    // Step 1: Check if an existing 1:1 chat between these two users already exists
    const candidateChats = await ChatMember.findAll({
      attributes: ['chatId'],
      where: {
        userId: {
          [Op.in]: [userAId, userBId],
        },
      },
      group: ['chatId'],
      having: sequelize.where(
        sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))),
        '=',
        2
      ),
    });

    for (const candidate of candidateChats) {
      const existingChatId = candidate.chatId;
      // Verify that this chat has exactly 2 members and is not a group
      const chat = await Chat.findByPk(existingChatId, {
        include: [{ model: ChatMember, as: 'memberships' }],
      });

      if (chat && !chat.isGroup && (chat as any).memberships?.length === 2) {
        return chat.id;
      }
    }

    // Step 2: Create new 1:1 chat inside a transaction
    const newChatId = await sequelize.transaction(async (t) => {
      // Ensure both users exist in the database
      await this.findOrCreateUser(userAId, undefined, undefined, t);
      await this.findOrCreateUser(userBId, undefined, undefined, t);

      const generatedChatId = crypto.randomUUID();

      // Create new chat with explicit ID
      await Chat.create(
        {
          id: generatedChatId,
          isGroup: false,
        },
        { transaction: t }
      );

      // Add both participants to ChatMembers with explicit chatId
      await ChatMember.bulkCreate(
        [
          { chatId: generatedChatId, userId: userAId },
          { chatId: generatedChatId, userId: userBId },
        ],
        { transaction: t }
      );

      return generatedChatId;
    });

    return newChatId;
  }

  /**
   * Verify if a user is a registered participant in a chat
   */
  async isMemberOfChat(chatId: string, userId: string): Promise<boolean> {
    const membership = await ChatMember.findOne({
      where: { chatId, userId },
    });
    return !!membership;
  }

  /**
   * 6. List User Chats
   * Returns all chats the user belongs to along with member details
   */
  async listUserChats(userId: string): Promise<UserChatSummary[]> {
    const userMemberships = await ChatMember.findAll({
      where: { userId },
      attributes: ['chatId'],
    });

    const chatIds = userMemberships.map((m) => m.chatId);
    if (chatIds.length === 0) {
      return [];
    }

    const chats = await Chat.findAll({
      where: {
        id: {
          [Op.in]: chatIds,
        },
      },
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: {
            attributes: ['joinedAt'],
          },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return chats.map((chat: any) => ({
      chatId: chat.id,
      createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : new Date().toISOString(),
      isGroup: chat.isGroup,
      title: chat.title,
      members: (chat.members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        joinedAt: m.ChatMember?.joinedAt,
      })),
    }));
  }

  /**
   * Get chat by ID with member information
   */
  async getChatById(chatId: string) {
    return await Chat.findByPk(chatId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }
}

export const chatService = new ChatService();
