/**
 * Messaging Helper Functions
 * Utilities for real-time messaging, formatting, and Firebase operations
 */

/**
 * Format timestamp to relative time (e.g., "5 mins ago", "Today")
 */
export const formatTime = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older dates, show the date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format message timestamp to HH:MM or date if older
 */
export const formatMessageTime = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Check if a message timestamp is today
 */
export const isMessageToday = (timestamp: any): boolean => {
  if (!timestamp) return false;
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const today = new Date();
  
  return date.toDateString() === today.toDateString();
};

/**
 * Group messages by date for UI rendering
 */
export interface MessageGroup {
  date: string;
  messages: Array<any>;
}

export const groupMessagesByDate = (messages: Array<any>): MessageGroup[] => {
  const groups: { [key: string]: Array<any> } = {};
  
  messages.forEach(msg => {
    const date = msg.timestamp instanceof Date 
      ? msg.timestamp.toDateString() 
      : new Date(msg.timestamp).toDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
  });
  
  return Object.entries(groups).map(([date, groupMessages]) => ({
    date,
    messages: groupMessages
  }));
};

/**
 * Scroll to bottom of messages container
 */
export const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, 0);
};

/**
 * Validate message content before sending
 */
export const validateMessage = (content: string): { valid: boolean; error?: string } => {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.trim().length > 4000) {
    return { valid: false, error: 'Message exceeds 4000 characters' };
  }
  
  return { valid: true };
};

/**
 * Detect message type (text, emoji only, link, etc.)
 */
export const detectMessageType = (content: string): 'text' | 'emoji' | 'link' => {
  const urlPattern = /https?:\/\//;
  const emojiPattern = /^[\p{Emoji}]+$/u;
  
  if (emojiPattern.test(content.trim())) return 'emoji';
  if (urlPattern.test(content)) return 'link';
  
  return 'text';
};

/**
 * Extract mentions and hashtags from message
 */
export const extractMetadata = (content: string) => {
  const mentions = content.match(/@[\w]+/g) || [];
  const hashtags = content.match(/#[\w]+/g) || [];
  
  return {
    mentions: [...new Set(mentions)],
    hashtags: [...new Set(hashtags)]
  };
};

/**
 * Format message for display (linkify URLs, linkify mentions)
 */
export const formatMessageContent = (content: string): string => {
  let formatted = content;
  
  // Linkify URLs
  formatted = formatted.replace(
    /https?:\/\/[^\s]+/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`
  );
  
  return formatted;
};

/**
 * Create a unique conversation key for caching
 */
export const createConversationKey = (studentId: string, recruiterId: string): string => {
  return [studentId, recruiterId].sort().join('_');
};

/**
 * Check if user is online (simple implementation)
 */
export const isUserOnline = (lastSeen: any, thresholdMs: number = 5 * 60 * 1000): boolean => {
  if (!lastSeen) return false;
  
  const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  const now = new Date();
  
  return now.getTime() - lastSeenDate.getTime() < thresholdMs;
};

/**
 * Debounce typing indicator
 */
export const debounceTyping = (fn: () => void, delay: number = 1000) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return () => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      fn();
      timeout = null;
    }, delay);
  };
};

/**
 * Get initials from name for avatar
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Calculate notification badges count
 */
export const getTotalUnread = (conversations: Array<any>, userId: string): number => {
  return conversations.reduce((sum, conv) => {
    return sum + (conv.unreadCount?.[userId] || 0);
  }, 0);
};

/**
 * Mark all messages as read in a conversation
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string,
  messagingService: any
) => {
  try {
    // Get all unread messages in conversation
    const messages = await messagingService.getMessages(conversationId);
    const unreadMessages = messages.filter(
      (msg: any) => !msg.isRead && msg.senderId !== userId
    );
    
    // Mark each as read
    const markReadPromises = unreadMessages.map((msg: any) =>
      messagingService.markMessageAsRead(msg.id, userId)
    );
    
    await Promise.all(markReadPromises);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
};

/**
 * Sanitize message content to prevent XSS
 */
export const sanitizeMessageContent = (content: string): string => {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
};

/**
 * Generate message preview for list display
 */
export const getMessagePreview = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

/**
 * Check if message contains blocked words (optional spam filter)
 */
const blockedWords = ['spam', 'inappropriate']; // Example - add your own

export const checkForBlockedContent = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  return blockedWords.some(word => lowerContent.includes(word));
};

/**
 * Calculate read status percentage in conversation
 */
export const getReadPercentage = (messages: Array<any>, userId: string): number => {
  if (messages.length === 0) return 100;
  
  const readCount = messages.filter(msg => msg.isRead || msg.senderId === userId).length;
  return Math.round((readCount / messages.length) * 100);
};

/**
 * Get typing status string
 */
export const getTypingStatus = (typingIndicators: Array<any>): string => {
  if (typingIndicators.length === 0) return '';
  
  const names = typingIndicators.map(t => t.userName).join(', ');
  
  if (typingIndicators.length === 1) {
    return `${names} is typing...`;
  } else if (typingIndicators.length === 2) {
    return `${names} are typing...`;
  } else {
    return `${typingIndicators.length} people are typing...`;
  }
};
