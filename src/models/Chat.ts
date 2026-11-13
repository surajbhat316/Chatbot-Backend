import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

export interface ChatAttributes {
  id: string;
  isGroup?: boolean;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatCreationAttributes
  extends Optional<ChatAttributes, 'id' | 'isGroup' | 'title' | 'createdAt' | 'updatedAt'> {}

export class Chat
  extends Model<ChatAttributes, ChatCreationAttributes>
  implements ChatAttributes
{
  declare id: string;
  declare isGroup?: boolean;
  declare title?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare members?: any[];
}

Chat.init(
  {
    id: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      defaultValue: () => crypto.randomUUID(),
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chats',
    timestamps: true,
  }
);
