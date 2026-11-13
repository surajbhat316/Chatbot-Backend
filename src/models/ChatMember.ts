import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ChatMemberAttributes {
  id: number;
  chatId: string;
  userId: string;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMemberCreationAttributes
  extends Optional<ChatMemberAttributes, 'id' | 'joinedAt' | 'createdAt' | 'updatedAt'> {}

export class ChatMember
  extends Model<ChatMemberAttributes, ChatMemberCreationAttributes>
  implements ChatMemberAttributes
{
  declare id: number;
  declare chatId: string;
  declare userId: string;
  declare joinedAt?: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'chat_members',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['chatId', 'userId'],
        name: 'unique_chat_user_member',
      },
    ],
  }
);
