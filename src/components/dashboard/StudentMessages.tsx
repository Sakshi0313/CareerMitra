import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { messagingService, type Conversation, type Message } from "@/lib/messagingService";
import { formatTime, formatMessageTime } from "@/lib/messagingHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Reply,
  Paperclip,
  Briefcase,
  MapPin,
  Calendar,
  X
} from "lucide-react";

interface StudentMessagesProps {
  activeTab?: string;
}

const StudentMessages: React.FC<StudentMessagesProps> = ({ activeTab = "inbox" }) => {
  const { userProfile, currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingIndicators, setTypingIndicators] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations for the student
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log("No current user, skipping conversation subscription");
      return;
    }

    console.log("Subscribing to conversations for student:", currentUser.uid);

    try {
      const unsubscribe = messagingService.subscribeToConversations(
        currentUser.uid,
        "student",
        (conversationsList) => {
          console.log("Received conversations update:", conversationsList.length, "conversations");
          setConversations(conversationsList);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up conversation subscription:", error);
      toast.error("Failed to connect to messaging service");
    }
  }, [currentUser?.uid]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const unsubscribe = messagingService.subscribeToMessages(
      selectedConversation.id,
      (messagesList) => {
        setConversationMessages(messagesList);
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
          (indicator) => indicator.userId !== currentUser?.uid
        );
        setTypingIndicators(otherUserIndicators);
      }
    );

    return unsubscribe;
  }, [selectedConversation?.id, currentUser?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages, typingIndicators]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (!selectedConversation || !currentUser?.uid) return;

    if (!isTyping) {
      setIsTyping(true);
      messagingService.sendTypingIndicator(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || "Student"
      );
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.uid || isSending) return;

    setIsSending(true);
    try {
      console.log("Sending message from student:", currentUser.uid);
      await messagingService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        userProfile?.displayName || "Student",
        "student",
        newMessage.trim(),
        "text",
        undefined,
        replyingTo?.id,
        "",
        ""
      );

      console.log("Message sent successfully");
      setNewMessage("");
      setReplyingTo(null);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === currentUser?.uid;
    const showAvatar = !isOwnMessage && (index === 0 || conversationMessages[index - 1]?.senderId !== message.senderId);
    const isLastInGroup = index === conversationMessages.length - 1 || conversationMessages[index + 1]?.senderId !== message.senderId;

    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
        {!isOwnMessage && (
          <Avatar className={`w-8 h-8 ${showAvatar ? "visible" : "invisible"}`}>
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback className="text-xs">
              {message.senderName.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
          {/* Reply indicator */}
          {message.replyTo && (
            <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/50 rounded border-l-2 border-primary">
              <div className="flex items-center gap-1 mb-1">
                <Reply className="w-3 h-3" />
                <span>Replying to</span>
              </div>
              <div className="truncate">
                {conversationMessages.find((m) => m.id === message.replyTo)?.content || "Message not found"}
              </div>
            </div>
          )}

          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
            } ${isLastInGroup ? (isOwnMessage ? "rounded-br-md" : "rounded-bl-md") : ""}`}
          >
            {/* Message type badge */}
            {message.messageType !== "text" && (
              <div className="mb-2">
                <Badge
                  variant={message.messageType === "job_offer" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {message.messageType === "job_offer" ? "Job Offer" : "Interview Request"}
                </Badge>
              </div>
            )}

            {/* Job offer details */}
            {message.messageType === "job_offer" && message.metadata && (
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

            {/* Interview request indicator */}
            {message.messageType === "interview_request" && (
              <div className="mb-3 p-3 bg-background/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Interview Request</span>
                </div>
              </div>
            )}

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Message metadata */}
          <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isOwnMessage ? "flex-row-reverse" : ""}`}>
            <span>{formatMessageTime(message.timestamp)}</span>
            {isOwnMessage && (
              <div className="flex items-center">
                {message.isRead ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3" />}
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

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount[currentUser?.uid || ""] || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Messages from Recruiters 💬
        </h1>
        <p className="text-muted-foreground">
          Manage job offers and interview requests from companies
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>
                  Recruiters
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {totalUnread}
                    </Badge>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConversations([]);
                    setTimeout(() => {
                      console.log("Conversations should reload automatically");
                    }, 100);
                  }}
                >
                  🔄
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Recruiters will contact you here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => {
                      const unreadCount = conversation.unreadCount[currentUser?.uid || ""] || 0;
                      return (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                            selectedConversation?.id === conversation.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={conversation.participants.recruiterAvatar} />
                                <AvatarFallback>
                                  {conversation.participants.recruiterName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
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
                                      {unreadCount > 99 ? "99+" : unreadCount}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(conversation.lastMessage.timestamp)}
                                  </span>
                                </div>
                              </div>

                              <p
                                className={`text-sm truncate ${
                                  unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {conversation.lastMessage.senderId === currentUser?.uid && (
                                  <span className="text-muted-foreground">You: </span>
                                )}
                                {conversation.lastMessage.content}
                              </p>

                              {/* Company name */}
                              <p className="text-xs text-muted-foreground mt-1">
                                {conversation.participants.recruiterCompany}
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
                      {selectedConversation.participants.recruiterName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedConversation.participants.recruiterName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.participants.recruiterCompany}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Online
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
                    {conversationMessages.map((message, index) => renderMessage(message, index))}

                    {/* Typing indicators */}
                    {typingIndicators.length > 0 && (
                      <div className="flex gap-3 mb-4">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedConversation.participants.recruiterAvatar} />
                          <AvatarFallback className="text-xs">
                            {selectedConversation.participants.recruiterName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          sendMessage();
                        }
                      }}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="sm"
                    className="shrink-0"
                  >
                    {isSending ? "..." : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Ctrl+Enter to send
                </p>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Click on a recruiter to view and respond to their messages
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMessages;
