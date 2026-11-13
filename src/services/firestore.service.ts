import { FieldValue, getFirestore } from '../config/firebase';
import { ChatMessage, LastSeenRecord } from '../types';

export class FirestoreService {
  /**
   * Helper to format Firestore timestamps into ISO strings
   */
  private formatTimestamp(timestamp: any): string | null {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    return String(timestamp);
  }

  /**
   * 2. Send Message
   * Stores the message in Firestore with server timestamp and sets readBy = [senderId]
   */
  async sendMessage(chatId: string, senderId: string, text: string): Promise<ChatMessage> {
    const firestore = getFirestore();
    const messagesCollection = firestore.collection('chats').doc(chatId).collection('messages');

    const newMessageRef = messagesCollection.doc();
    const serverTimestamp = FieldValue.serverTimestamp();

    const messageData = {
      senderId,
      text,
      timestamp: serverTimestamp,
      readBy: [senderId],
    };

    await newMessageRef.set(messageData);

    return {
      id: newMessageRef.id,
      chatId,
      senderId,
      text,
      timestamp: new Date().toISOString(),
      readBy: [senderId],
    };
  }

  /**
   * 3. Get Messages
   * Fetches messages for a chat, ordered by timestamp ascending
   */
  async getMessages(chatId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    const firestore = getFirestore();
    const messagesRef = firestore.collection('chats').doc(chatId).collection('messages');

    const snapshot = await messagesRef
      .orderBy('timestamp', 'asc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId,
        senderId: data.senderId,
        text: data.text,
        timestamp: this.formatTimestamp(data.timestamp),
        readBy: Array.isArray(data.readBy) ? data.readBy : [],
      };
    });
  }

  /**
   * 4. Mark Message Read
   * Appends userId to the message's readBy array if not already present
   */
  async markMessageRead(
    chatId: string,
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; messageId: string; userId: string }> {
    const firestore = getFirestore();
    const messageDocRef = firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);

    const docSnapshot = await messageDocRef.get();
    if (!docSnapshot.exists) {
      throw new Error(`Message with ID "${messageId}" was not found in chat "${chatId}".`);
    }

    await messageDocRef.update({
      readBy: FieldValue.arrayUnion(userId),
    });

    return {
      success: true,
      messageId,
      userId,
    };
  }

  /**
   * 5. Update Last Seen Message
   * Upserts the user's last-seen message pointer in Firestore
   */
  async updateLastSeen(
    chatId: string,
    userId: string,
    messageId: string
  ): Promise<LastSeenRecord> {
    const firestore = getFirestore();
    const lastSeenDocRef = firestore
      .collection('chats')
      .doc(chatId)
      .collection('lastSeen')
      .doc(userId);

    const now = new Date();
    await lastSeenDocRef.set(
      {
        messageId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      userId,
      messageId,
      updatedAt: now.toISOString(),
    };
  }
}

export const firestoreService = new FirestoreService();
