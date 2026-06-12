import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService, type Message, type Conversation } from '@/lib/messagingService';
import { useAuth } from '@/contexts/SimpleAuthContext';

export function useDirectMessages() {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<{ [conversationId: string]: () => void }>({});

  // Subscribe to conversations
  useEffect(() => {
    if (!currentUser || !userProfile) {
      console.log('useDirectMessages: User or userProfile not available');
      return;
    }

    setLoading(true);
    console.log('useDirectMessages: Setting up conversation subscription for', userProfile.role, currentUser.uid);

    try {
      const userRole = (userProfile.role as 'student' | 'recruiter') || 'student';
      
      const unsubscribe = messagingService.subscribeToConversations(
        currentUser.uid,
        userRole,
        (updatedConversations) => {
          console.log('useDirectMessages: Conversations updated:', updatedConversations.length);
          setConversations(updatedConversations);
          setLoading(false);
          setError(null);
        }
      );

      unsubscribeConversationsRef.current = unsubscribe;

      return () => {
        if (unsubscribeConversationsRef.current) {
          console.log('useDirectMessages: Cleaning up conversation subscription');
          unsubscribeConversationsRef.current();
        }
      };
    } catch (err: any) {
      console.error('useDirectMessages: Error setting up conversation subscription:', err);
      setError(err.message || 'Failed to load conversations');
      setLoading(false);
    }
  }, [currentUser, userProfile]);

  // Subscribe to messages for a specific conversation
  const subscribeToMessages = useCallback((conversationId: string) => {
    if (!conversationId) {
      console.log('useDirectMessages: No conversationId provided');
      return;
    }

    console.log('useDirectMessages: Setting up message subscription for conversation:', conversationId);

    try {
      const unsubscribe = messagingService.subscribeToMessages(
        conversationId,
        (updatedMessages) => {
          console.log('useDirectMessages: Messages updated for', conversationId, ':', updatedMessages.length);
          setMessages(prev => ({
            ...prev,
            [conversationId]: updatedMessages
          }));
        }
      );

      unsubscribeMessagesRef.current[conversationId] = unsubscribe;

      return unsubscribe;
    } catch (err: any) {
      console.error('useDirectMessages: Error setting up message subscription:', err);
      setError(err.message || 'Failed to load messages');
      return undefined;
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (conversationId: string, content: string, senderName?: string, senderAvatar?: string) => {
      if (!currentUser || !userProfile) {
        throw new Error('User not authenticated');
      }

      if (!conversationId || !content.trim()) {
        throw new Error('Invalid conversation or message content');
      }

      try {
        console.log('useDirectMessages: Sending message to conversation:', conversationId);

        const senderRole = (userProfile.role as 'student' | 'recruiter') || 'student';
        
        await messagingService.sendMessage(
          conversationId,
          currentUser.uid,
          senderName || userProfile.displayName || 'User',
          senderRole,
          content,
          'text',
          undefined,
          undefined,
          userProfile.companyName || '',
          senderAvatar || ''
        );

        console.log('useDirectMessages: Message sent successfully');
      } catch (err: any) {
        console.error('useDirectMessages: Error sending message:', err);
        throw err;
      }
    },
    [currentUser, userProfile]
  );

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser) {
      console.log('useDirectMessages: User not available for marking as read');
      return;
    }

    try {
      console.log('useDirectMessages: Marking conversation as read:', conversationId);
      await messagingService.markMessagesAsRead(conversationId, currentUser.uid);
    } catch (err: any) {
      console.error('useDirectMessages: Error marking conversation as read:', err);
    }
  }, [currentUser]);

  // Mark individual message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      console.log('useDirectMessages: Marking message as read:', messageId);
      // This would require a separate method in messagingService if needed
      // For now, messages are marked as read when conversation is opened
    } catch (err: any) {
      console.error('useDirectMessages: Error marking message as read:', err);
    }
  }, []);

  // Get conversation by ID
  const getConversation = useCallback((conversationId: string): Message[] => {
    return messages[conversationId] || [];
  }, [messages]);

  // Get conversation list
  const getConversationList = useCallback((): Conversation[] => {
    return conversations;
  }, [conversations]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      console.log('useDirectMessages: Delete message not yet implemented:', messageId);
      // This would require implementing deleteMessage in messagingService
      throw new Error('Delete message feature not yet implemented');
    } catch (err: any) {
      console.error('useDirectMessages: Error deleting message:', err);
      throw err;
    }
  }, []);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      console.log('useDirectMessages: Edit message not yet implemented:', messageId);
      // This would require implementing editMessage in messagingService
      throw new Error('Edit message feature not yet implemented');
    } catch (err: any) {
      console.error('useDirectMessages: Error editing message:', err);
      throw err;
    }
  }, []);

  // Cleanup all subscriptions
  useEffect(() => {
    return () => {
      console.log('useDirectMessages: Cleaning up all subscriptions');
      
      // Unsubscribe from all message subscriptions
      Object.values(unsubscribeMessagesRef.current).forEach(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
      
      // Clear refs
      unsubscribeMessagesRef.current = {};
    };
  }, []);

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    markConversationAsRead,
    markAsRead,
    getConversation,
    getConversationList,
    subscribeToMessages,
    deleteMessage,
    editMessage
  };
}
