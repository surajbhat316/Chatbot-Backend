import { User } from './User';
import { Chat } from './Chat';
import { ChatMember } from './ChatMember';

// Associations
Chat.belongsToMany(User, {
  through: ChatMember,
  foreignKey: 'chatId',
  otherKey: 'userId',
  as: 'members',
});

User.belongsToMany(Chat, {
  through: ChatMember,
  foreignKey: 'userId',
  otherKey: 'chatId',
  as: 'chats',
});

Chat.hasMany(ChatMember, {
  foreignKey: 'chatId',
  as: 'memberships',
});

ChatMember.belongsTo(Chat, {
  foreignKey: 'chatId',
});

User.hasMany(ChatMember, {
  foreignKey: 'userId',
  as: 'userMemberships',
});

ChatMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { User, Chat, ChatMember };
