import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { toast } from "sonner";
import { messagingService, type Conversation, type Message, type TypingIndicator } from "@/lib/messagingService";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Building,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Reply,
  Loader2,
  Zap,
  RefreshCw,
  AlertCircle
} from "lucide-react";

const Opportunities = () => {
  const { userProfile, currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'job_offers' | 'interviews'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    console.log('Subscribing to conversations for student:', currentUser.uid);
    setConnectionError(false);
    
    try {
      const unsubscribe = messagingService.subscribeToConversations(
        currentUser.uid,
        'student',
        (conversationsList) => {
          console.log('Student received conversations update:', conversationsList.length, 'conversations');
          setConversations(conversationsList);
          setIsLoading(false);
          setConnectionError(false);
        }
      );

      // Set a timeout to detect connection issues
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log('Connection timeout - no conversations received');
          setConnectionError(true);
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
      setConnectionError(true);
      setIsLoading(false);
    }
  }, [currentUser?.uid, isLoading]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const unsubscribe = messagingService.subscribeToMessages(
      selectedConversation.id,
      (messagesList) => {
        setMessages(messagesList);
        // Mark messages as read
        if (currentUser?.uid) {
          messagingService.markMessagesAsRead(selectedConversation.id, currentUser.uid);
        }
      }
    );

    return unsubscribe;
  }, [selectedConversation?.id, currentUser?.uid]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const unsubscribe = messagingService.subscribeToTypingIndicators(
      selectedConversation.id,
      (indicators) => {
        // Filter out current user's typing indicators
        const otherUserIndicators = indicators.filter(
          indicator => indicator.userId !== currentUser?.uid
        );
        setTypingIndicators(otherUserIndicators);
      }
    );

    return unsubscribe;
  }, [selectedConversation?.id, currentUser?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndicators]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.recruiterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.participants.recruiterCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && (conv.unreadCount[currentUser?.uid || ''] || 0) > 0);
    
    return matchesSearch && matchesFilter;
  });

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.uid || isSending) return;
    
    setIsSending(true);
    try {
      console.log('Sending message from student:', currentUser.uid);
      await messagingService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || 'Student',
        'student',
        newMessage.trim(),
        'text',
        undefined,
        replyingTo?.id,
        '',
        (userProfile as any)?.avatar || ''
      );
      
      console.log('Message sent successfully');
      setNewMessage('');
      setReplyingTo(null);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !currentUser?.uid) return;

    if (!isTyping) {
      setIsTyping(true);
      messagingService.sendTypingIndicator(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || 'Student'
      );
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const retryConnection = () => {
    setIsLoading(true);
    setConnectionError(false);
    // This will trigger the useEffect to retry the connection
  };

  const handleInterestClick = async (message: Message) => {
    if (!selectedConversation || !currentUser?.uid) return;
    
    try {
      await messagingService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || 'Student',
        'student',
        `I'm very interested in this opportunity! Could we schedule a time to discuss the details?`,
        'text',
        undefined,
        message.id,
        '',
        (userProfile as any)?.avatar || ''
      );
      
      toast.success('Interest expressed successfully!');
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast.error('Failed to send response');
    }
  };

  const handleScheduleClick = async (message: Message) => {
    if (!selectedConversation || !currentUser?.uid) return;
    
    try {
      await messagingService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || 'Student',
        'student',
        `I'd be happy to schedule an interview! I'm available most weekdays. What times work best for you?`,
        'text',
        undefined,
        message.id,
        '',
        (userProfile as any)?.avatar || ''
      );
      
      toast.success('Interview response sent!');
    } catch (error) {
      console.error('Error responding to interview:', error);
      toast.error('Failed to send response');
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'job_offer':
        return <Badge variant="default" className="text-xs">Job Offer</Badge>;
      case 'interview_request':
        return <Badge variant="secondary" className="text-xs">Interview</Badge>;
      default:
        return null;
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === currentUser?.uid;
    const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId;
    
    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {!isOwnMessage && (
          <Avatar className={`w-8 h-8 ${showAvatar ? 'visible' : 'invisible'}`}>
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback className="text-xs">
              {message.senderName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Reply indicator */}
          {message.replyTo && (
            <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/50 rounded border-l-2 border-primary">
              <div className="flex items-center gap-1 mb-1">
                <Reply className="w-3 h-3" />
                <span>Replying to</span>
              </div>
              <div className="truncate">
                {messages.find(m => m.id === message.replyTo)?.content || 'Message not found'}
              </div>
            </div>
          )}
          
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            } ${isLastInGroup ? (isOwnMessage ? 'rounded-br-md' : 'rounded-bl-md') : ''}`}
          >
            {/* Message type badge */}
            {message.messageType !== 'text' && (
              <div className="mb-2">
                {getMessageTypeBadge(message.messageType)}
              </div>
            )}
            
            {/* Job offer details */}
            {message.messageType === 'job_offer' && message.metadata && (
              <div className="mb-3 p-3 bg-background/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium text-sm">{message.metadata.jobTitle}</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {message.metadata.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {message.metadata.location}
                    </div>
                  )}
                  {message.metadata.salary && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      {message.metadata.salary}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            
            {/* Message actions for job offers */}
            {message.messageType === 'job_offer' && !isOwnMessage && (
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => handleInterestClick(message)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Interested
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => handleReply(message)}
                >
                  Learn More
                </Button>
              </div>
            )}
            
            {/* Interview request actions */}
            {message.messageType === 'interview_request' && !isOwnMessage && (
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => handleScheduleClick(message)}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Schedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => handleReply(message)}
                >
                  Not Available
                </Button>
              </div>
            )}
          </div>
          
          {/* Message metadata */}
          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
            <span>{formatMessageTime(message.timestamp)}</span>
            {isOwnMessage && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
            {!isOwnMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs hover:text-primary"
                onClick={() => handleReply(message)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Messages & Opportunities 💼
            </h1>
            <p className="text-muted-foreground">
              Connect with recruiters and explore job opportunities
            </p>
            {conversations.length > 0 && (
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {conversations.reduce((sum, conv) => sum + (conv.unreadCount[currentUser?.uid || ''] || 0), 0)} unread
                </Badge>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-4">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Conversations</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {conversations.reduce((sum, conv) => sum + (conv.unreadCount[currentUser?.uid || ''] || 0), 0)} unread
                    </Badge>
                  </CardTitle>
                  
                  {/* Search and Filter */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={filterType === 'unread' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('unread')}
                      >
                        Unread
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    {isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p>Loading conversations...</p>
                        <p className="text-xs mt-1">Connecting to messaging service...</p>
                      </div>
                    ) : connectionError ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                        <p className="font-medium mb-2">Connection Error</p>
                        <p className="text-sm mb-4">Unable to load conversations. Please check your connection.</p>
                        <Button onClick={retryConnection} size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-foreground">No conversations yet</h3>
                        <p className="text-sm mb-4">Recruiters will message you here when they're interested in your profile</p>
                        <div className="space-y-2 text-xs">
                          <p>💡 <strong>Tip:</strong> Complete your profile to attract more recruiters</p>
                          <p>🔍 Make sure your skills and experience are up to date</p>
                        </div>
                        {conversations.length > 0 && searchQuery && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs">Try adjusting your search terms</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => setSearchQuery('')}
                            >
                              Clear Search
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredConversations.map((conversation) => {
                          const unreadCount = conversation.unreadCount[currentUser?.uid || ''] || 0;
                          return (
                            <div
                              key={conversation.id}
                              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                                selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                              }`}
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={conversation.participants.recruiterAvatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                      {conversation.participants.recruiterName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {/* Online indicator */}
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-sm truncate">
                                      {conversation.participants.recruiterName}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {unreadCount > 0 && (
                                        <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center">
                                          {unreadCount > 99 ? '99+' : unreadCount}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(conversation.lastMessage.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {conversation.participants.recruiterCompany}
                                  </p>
                                  
                                  <p className={`text-sm truncate ${unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                    {conversation.lastMessage.senderId === currentUser?.uid && (
                                      <span className="text-muted-foreground">You: </span>
                                    )}
                                    {conversation.lastMessage.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-8">
              {selectedConversation ? (
                <Card className="h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedConversation.participants.recruiterAvatar} />
                        <AvatarFallback>
                          {selectedConversation.participants.recruiterName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedConversation.participants.recruiterName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-3 h-3" />
                          {selectedConversation.participants.recruiterCompany}
                          <span>•</span>
                          <span className="text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-1">
                        {messages.map((message, index) => renderMessage(message, index))}
                        
                        {/* Typing indicators */}
                        {typingIndicators.length > 0 && (
                          <div className="flex gap-3 mb-4">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedConversation.participants.recruiterAvatar} />
                              <AvatarFallback className="text-xs">
                                {selectedConversation.participants.recruiterName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-muted-foreground">typing...</span>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t">
                    {/* Reply indicator */}
                    {replyingTo && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Reply className="w-4 h-4" />
                            Replying to {replyingTo.senderName}
                          </div>
                          <Button variant="ghost" size="sm" onClick={cancelReply}>
                            ×
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 items-end">
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 relative">
                        <Textarea
                          ref={messageInputRef}
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          className="min-h-[60px] max-h-32 resize-none pr-12"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 bottom-2"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || isSending}
                        className="shrink-0"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">Select a conversation</h3>
                    <p className="mb-4">Choose a conversation from the left to start messaging with recruiters</p>
                    <div className="space-y-2 text-sm">
                      <p>💼 Discuss job opportunities</p>
                      <p>📅 Schedule interviews</p>
                      <p>🤝 Build professional connections</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Opportunities;