import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'recruiter';
  senderCompany: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'job_offer' | 'interview_request' | 'file';
  metadata?: {
    jobTitle?: string;
    location?: string;
    salary?: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
  };
  replyTo?: string; // ID of message being replied to
  reactions?: { [userId: string]: string }; // emoji reactions
}

export interface Conversation {
  id: string;
  participants: {
    studentId: string;
    studentName: string;
    studentAvatar: string;
    recruiterId: string;
    recruiterName: string;
    recruiterCompany: string;
    recruiterAvatar: string;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: { [userId: string]: number };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

class MessagingService {
  // Create or get existing conversation
  async createConversation(
    studentId: string,
    studentName: string,
    recruiterId: string,
    recruiterName: string,
    recruiterCompany: string,
    studentAvatar: string = '',
    recruiterAvatar: string = ''
  ): Promise<string> {
    try {
      console.log('MessagingService: Creating conversation with params:', {
        studentId,
        studentName,
        recruiterId,
        recruiterName,
        recruiterCompany
      });

      // Validate required parameters
      if (!studentId || !studentName || !recruiterId || !recruiterName) {
        throw new Error('Missing required parameters for conversation creation');
      }

      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const existingQuery = query(
        conversationsRef,
        where('participants.studentId', '==', studentId),
        where('participants.recruiterId', '==', recruiterId)
      );
      
      console.log('MessagingService: Checking for existing conversation...');
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existingId = existingSnapshot.docs[0].id;
        console.log('MessagingService: Found existing conversation:', existingId);
        return existingId;
      }

      console.log('MessagingService: Creating new conversation...');
      // Create new conversation
      const conversationData: Omit<Conversation, 'id'> = {
        participants: {
          studentId,
          studentName,
          studentAvatar: studentAvatar || '',
          recruiterId,
          recruiterName,
          recruiterCompany,
          recruiterAvatar: recruiterAvatar || ''
        },
        lastMessage: {
          content: '',
          timestamp: new Date(),
          senderId: ''
        },
        unreadCount: {
          [studentId]: 0,
          [recruiterId]: 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(conversationsRef, {
        ...conversationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Ensure no undefined values
        participants: {
          ...conversationData.participants,
          studentAvatar: conversationData.participants.studentAvatar || '',
          recruiterAvatar: conversationData.participants.recruiterAvatar || ''
        }
      });

      console.log('MessagingService: Conversation created successfully:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('MessagingService: Error creating conversation:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'student' | 'recruiter',
    content: string,
    messageType: 'text' | 'job_offer' | 'interview_request' | 'file' = 'text',
    metadata?: Message['metadata'],
    replyTo?: string,
    senderCompany: string = '',
    senderAvatar: string = ''
  ): Promise<string> {
    try {
      console.log('MessagingService: sendMessage called with:', {
        conversationId,
        senderId,
        senderName,
        senderRole,
        content: content.substring(0, 50) + '...',
        messageType,
        senderCompany
      });

      const messagesRef = collection(db, 'messages');
      
      const messageData: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        senderName,
        senderRole,
        senderCompany: senderCompany || '',
        senderAvatar: senderAvatar || '',
        content,
        timestamp: new Date(),
        isRead: false,
        messageType,
        metadata,
        replyTo,
        reactions: {}
      };

      console.log('MessagingService: Adding message to Firestore...');
      const docRef = await addDoc(messagesRef, {
        ...messageData,
        timestamp: serverTimestamp(),
        // Ensure no undefined values
        senderCompany: messageData.senderCompany || '',
        senderAvatar: messageData.senderAvatar || '',
        metadata: messageData.metadata || null,
        replyTo: messageData.replyTo || null,
        reactions: messageData.reactions || {}
      });

      console.log('MessagingService: Message added with ID:', docRef.id);

      // Update conversation's last message and unread count
      console.log('MessagingService: Updating conversation last message...');
      await this.updateConversationLastMessage(conversationId, content, senderId);
      
      console.log('MessagingService: Message sent successfully');
      return docRef.id;
    } catch (error: any) {
      console.error('MessagingService: Error sending message:', error);
      console.error('MessagingService: Error details:', {
        code: error.code,
        message: error.message,
        conversationId,
        senderId
      });
      throw error;
    }
  }

  // Update conversation's last message
  private async updateConversationLastMessage(
    conversationId: string,
    content: string,
    senderId: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      
      // Get current conversation to update unread counts
      const conversationSnapshot = await getDocs(
        query(collection(db, 'conversations'), where('__name__', '==', conversationId))
      );
      
      if (!conversationSnapshot.empty) {
        const conversationData = conversationSnapshot.docs[0].data() as Conversation;
        const participants = conversationData.participants;
        
        // Increment unread count for the recipient
        const recipientId = senderId === participants.studentId ? participants.recruiterId : participants.studentId;
        const newUnreadCount = {
          ...conversationData.unreadCount,
          [recipientId]: (conversationData.unreadCount[recipientId] || 0) + 1
        };

        await updateDoc(conversationRef, {
          lastMessage: {
            content: content.substring(0, 100), // Truncate for preview
            timestamp: serverTimestamp(),
            senderId
          },
          unreadCount: newUnreadCount,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update conversation unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });

      // Update individual messages
      const messagesRef = collection(db, 'messages');
      const unreadQuery = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );

      const unreadSnapshot = await getDocs(unreadQuery);
      
      const updatePromises = unreadSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get conversations for a user
  subscribeToConversations(
    userId: string,
    userRole: 'student' | 'recruiter',
    callback: (conversations: Conversation[]) => void
  ): () => void {
    try {
      console.log('MessagingService: Setting up subscription for', userRole, userId);
      
      const conversationsRef = collection(db, 'conversations');
      const field = userRole === 'student' ? 'participants.studentId' : 'participants.recruiterId';
      
      console.log('MessagingService: Querying field:', field);
      
      // Use a simpler query without orderBy to avoid index requirements
      const q = query(
        conversationsRef,
        where(field, '==', userId),
        where('isActive', '==', true)
      );

      return onSnapshot(q, (snapshot) => {
        console.log('MessagingService: Received snapshot with', snapshot.docs.length, 'documents');
        
        const conversations: Conversation[] = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('MessagingService: Processing conversation doc:', doc.id, data);
          
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessage: {
              ...data.lastMessage,
              timestamp: data.lastMessage?.timestamp?.toDate() || new Date()
            }
          };
        }) as Conversation[];

        // Sort conversations by updatedAt in JavaScript instead of Firestore
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        console.log('MessagingService: Processed conversations:', conversations);
        callback(conversations);
      }, (error) => {
        console.error('MessagingService: Subscription error:', error);
        
        // If it's an index error, provide helpful guidance
        if (error.message.includes('index')) {
          console.error('Index required. Please create the index or use the alternative query method.');
        }
      });
    } catch (error) {
      console.error('MessagingService: Error setting up subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Get messages for a conversation
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): () => void {
    console.log('MessagingService: Setting up message subscription for conversation:', conversationId);
    
    const messagesRef = collection(db, 'messages');
    
    // Use simpler query without orderBy to avoid index requirements
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      console.log('MessagingService: Received message snapshot with', snapshot.docs.length, 'messages');
      
      const messages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('MessagingService: Processing message:', doc.id, {
          content: data.content?.substring(0, 50) + '...',
          senderId: data.senderId,
          timestamp: data.timestamp
        });
        
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      }) as Message[];

      // Sort by timestamp in JavaScript instead of Firestore
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log('MessagingService: Calling callback with', messages.length, 'messages');
      callback(messages);
    }, (error) => {
      console.error('MessagingService: Message subscription error:', error);
      
      if (error.message.includes('index')) {
        console.error('Index required for messages. Using fallback query...');
        // Could implement a fallback here if needed
      }
    });
  }

  // Load more messages (pagination)
  async loadMoreMessages(
    conversationId: string,
    lastMessage: DocumentSnapshot,
    limitCount: number = 20
  ): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];

      return messages.reverse();
    } catch (error) {
      console.error('Error loading more messages:', error);
      return [];
    }
  }

  // Add reaction to message
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: emoji
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  // Remove reaction from message
  async removeReaction(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${userId}`]: null
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  }

  // Send typing indicator
  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const typingRef = collection(db, 'typing');
      await addDoc(typingRef, {
        conversationId,
        userId,
        userName,
        timestamp: serverTimestamp()
      });

      // Auto-remove after 3 seconds
      setTimeout(async () => {
        try {
          const typingQuery = query(
            typingRef,
            where('conversationId', '==', conversationId),
            where('userId', '==', userId)
          );
          const snapshot = await getDocs(typingQuery);
          snapshot.docs.forEach(doc => doc.ref.delete());
        } catch (error) {
          console.error('Error removing typing indicator:', error);
        }
      }, 3000);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Subscribe to typing indicators
  subscribeToTypingIndicators(
    conversationId: string,
    callback: (indicators: TypingIndicator[]) => void
  ): () => void {
    const typingRef = collection(db, 'typing');
    
    // Use simpler query without orderBy to avoid index requirements
    const q = query(
      typingRef,
      where('conversationId', '==', conversationId)
    );

    return onSnapshot(q, (snapshot) => {
      const indicators: TypingIndicator[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as TypingIndicator[];

      // Filter out old indicators (older than 5 seconds) and sort in JavaScript
      const now = new Date();
      const activeIndicators = indicators
        .filter(indicator => now.getTime() - indicator.timestamp.getTime() < 5000)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      callback(activeIndicators);
    }, (error) => {
      console.error('Error subscribing to typing indicators:', error);
    });
  }

  // Search messages
  async searchMessages(
    userId: string,
    userRole: 'student' | 'recruiter',
    searchTerm: string
  ): Promise<Message[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('senderRole', '==', userRole === 'student' ? 'recruiter' : 'student'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];

      // Client-side filtering (not ideal for large datasets)
      return messages.filter(message =>
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.senderName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Get conversation analytics
  async getConversationAnalytics(conversationId: string): Promise<{
    totalMessages: number;
    messagesPerDay: { [date: string]: number };
    responseTime: number; // average in minutes
  }> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];

      const totalMessages = messages.length;
      const messagesPerDay: { [date: string]: number } = {};
      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const dateKey = message.timestamp.toDateString();
        messagesPerDay[dateKey] = (messagesPerDay[dateKey] || 0) + 1;

        // Calculate response time
        if (i > 0) {
          const prevMessage = messages[i - 1];
          if (prevMessage.senderId !== message.senderId) {
            const responseTime = message.timestamp.getTime() - prevMessage.timestamp.getTime();
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      }

      const averageResponseTime = responseCount > 0 
        ? Math.round(totalResponseTime / responseCount / (1000 * 60)) // Convert to minutes
        : 0;

      return {
        totalMessages,
        messagesPerDay,
        responseTime: averageResponseTime
      };
    } catch (error) {
      console.error('Error getting conversation analytics:', error);
      return {
        totalMessages: 0,
        messagesPerDay: {},
        responseTime: 0
      };
    }
  }
}

export const messagingService = new MessagingService();

// Export types for use in other files
export type { Message, Conversation, TypingIndicator };