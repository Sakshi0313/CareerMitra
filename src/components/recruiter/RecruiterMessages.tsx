import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';

export default function RecruiterMessages() {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const { messages, sendMessage, markAsRead, markConversationAsRead, getConversation, getConversationList, loading: messagesLoading, deleteMessage, editMessage, subscribeToMessages } = useDirectMessages();
  const { getProfileById, loadProfile, loading: profilesLoading } = useProfiles();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pressedMessageId, setPressedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle URL parameter for direct conversation
  useEffect(() => {
    const withUserId = searchParams.get('with');
    if (withUserId && withUserId !== selectedConversation) {
      setSelectedConversation(withUserId);
    }
  }, [searchParams, selectedConversation]);

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      console.log('RecruiterMessages: Subscribing to messages for conversation:', selectedConversation);
      subscribeToMessages(selectedConversation);
      // Also load the profile of the other user
      loadProfile(selectedConversation);
    }
  }, [selectedConversation, subscribeToMessages, loadProfile]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUser) {
      markConversationAsRead(selectedConversation);
    }
  }, [selectedConversation, currentUser, markConversationAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, messages]);

  const conversations = getConversationList();
  const selectedMessages = selectedConversation ? getConversation(selectedConversation) : [];
  const selectedUserProfile = selectedConversation ? getProfileById(selectedConversation) : null;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUser || !userProfile) {
      toast.error('Invalid message or conversation');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(selectedConversation, messageText, userProfile.displayName, '');
      setMessageText('');
      toast.success('Message sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-border bg-card flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold">Messages</h2>
            <p className="text-sm text-muted-foreground">Direct conversations</p>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {messagesLoading || profilesLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-pulse">Loading conversations...</div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No conversations yet</p>
                <p className="text-xs mt-2">Start by messaging a student from the Profiles page</p>
              </div>
            ) : (
              conversations.map(conv => {
                // Get the other participant's ID from the conversation
                const otherUserId = conv.participants.studentId === currentUser?.uid 
                  ? conv.participants.recruiterId 
                  : conv.participants.studentId;
                const otherUser = getProfileById(otherUserId);
                const lastMessageTime = conv.lastMessage?.timestamp || conv.updatedAt;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`conversation-item w-full p-4 border-b border-border text-left hover:bg-accent transition-colors ${
                      selectedConversation === conv.id ? 'selected bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {otherUser?.avatar ? (
                        <div className="relative">
                          <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-transparent"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-transparent">
                            <span className="text-primary font-semibold text-lg">
                              {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate text-foreground">
                            {otherUser?.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {lastMessageTime ? new Date(lastMessageTime).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm truncate text-muted-foreground">
                            {conv.lastMessage?.content || 'No messages yet'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area - Mobile Responsive */}
        {selectedConversation ? (
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {/* Chat Header - Mobile Responsive */}
            <div className="p-3 md:p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-2"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  {selectedUserProfile?.avatar ? (
                    <img
                      src={selectedUserProfile.avatar}
                      alt={selectedUserProfile.name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-primary font-semibold text-base md:text-lg">
                        {selectedUserProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-left">
                    <h2 className="font-semibold text-base md:text-lg truncate">{selectedUserProfile?.name || 'Unknown User'}</h2>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      {selectedUserProfile?.college && (
                        <span className="truncate">{selectedUserProfile.college}</span>
                      )}
                      {selectedUserProfile?.location && selectedUserProfile?.college && (
                        <span className="hidden sm:inline">•</span>
                      )}
                      {selectedUserProfile?.location && (
                        <span className="truncate hidden sm:inline">{selectedUserProfile.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages - Mobile Responsive */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {selectedMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                selectedMessages.map(msg => {
                  const isCurrentUser = msg.senderId === currentUser?.uid;
                  const senderProfile = isCurrentUser ? userProfile : getProfileById(msg.senderId);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 md:gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          {senderProfile?.avatar ? (
                            <img
                              src={senderProfile.avatar}
                              alt={senderProfile.name}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-xs">
                                {senderProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] md:max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : ''}`}>
                        <div
                          className={`message-bubble px-3 py-2 md:px-4 md:py-3 rounded-2xl transition-all duration-150 ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          <div className="text-sm break-words leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 mt-1 px-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ''}
                          </span>
                        </div>
                      </div>

                      {isCurrentUser && (
                        <div className="flex-shrink-0 order-2">
                          {userProfile?.displayName ? (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-xs">
                                {userProfile.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-xs">?</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Mobile Responsive */}
            <div className="p-3 md:p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                  className="text-sm md:text-base"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
