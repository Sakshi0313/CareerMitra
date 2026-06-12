import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";
import { toast } from "sonner";
import { messagingService, type Conversation, type Message, type TypingIndicator } from "@/lib/messagingService";
import { db } from "@/lib/firebase";
import { 
  Search, 
  Filter, 
  Users, 
  MessageSquare,
  MapPin,
  Eye,
  Send,
  FileText,
  Award,
  Star,
  Clock,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Zap,
  Target,
  CheckCircle,
  X,
  Building,
  Calendar,
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Reply,
  Loader2
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  skills: string[];
  location: string;
  avatar?: string;
  resume?: string;
  bio?: string;
  experience?: string;
  currentRole?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  targetRoles?: string[];
  college?: string;
  university?: string;
  mobileNumber?: string;
  workType?: string;
  preferredLocations?: string;
  projects?: Array<{
    title: string;
    description: string;
    link?: string;
    technologies?: string[];
  }>;
}

interface RecruiterMessage {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  content: string;
  timestamp: Date;
  type: "sent" | "received";
}

interface RecruiterProfile {
  id: string;
  companyName: string;
  contactEmail: string;
  phoneNumber: string;
  location: string;
  companyWebsite: string;
  industry: string;
  about: string;
}

const RecruiterDashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<RecruiterMessage[]>([]);
  
  // New messaging system state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [recruitingProfile, setRecrutingProfile] = useState<RecruiterProfile>({
    id: currentUser?.uid || "",
    companyName: userProfile?.displayName || "Your Company",
    contactEmail: userProfile?.email || "",
    phoneNumber: "",
    location: "",
    companyWebsite: "",
    industry: "",
    about: ""
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Get unique values for filters
  const uniqueSkills = Array.from(new Set(students.flatMap(s => s.skills))).sort();
  const uniqueLocations = Array.from(new Set(students.map(s => s.location).filter(Boolean))).sort();
  const experienceOptions = ['Fresher', '0-1 years', '1-2 years', '2-3 years', '3-5 years', '5+ years'];
  const workTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid', 'On-site'];
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [tempProfile, setTempProfile] = useState<RecruiterProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [creatingChatFor, setCreatingChatFor] = useState<string | null>(null);

  // Load students and recruiter profile from Firebase
  useEffect(() => {
    if (!isInitialized && currentUser?.uid) {
      loadStudents();
      loadMessages();
      loadRecruiterProfile();
      setIsInitialized(true);
    }
  }, [currentUser?.uid, isInitialized]);

  // Subscribe to conversations for messaging system
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('No current user, skipping conversation subscription');
      return;
    }

    console.log('Subscribing to conversations for recruiter:', currentUser.uid);
    
    try {
      const unsubscribe = messagingService.subscribeToConversations(
        currentUser.uid,
        'recruiter',
        (conversationsList) => {
          console.log('Received conversations update:', conversationsList.length, 'conversations');
          console.log('Conversations details:', conversationsList.map(c => ({
            id: c.id,
            studentName: c.participants.studentName,
            lastMessage: c.lastMessage.content,
            updatedAt: c.updatedAt
          })));
          setConversations(conversationsList);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
      toast.error('Failed to connect to messaging service');
      
      // Try manual loading as fallback
      setTimeout(() => {
        console.log('Attempting manual conversation loading...');
        loadConversationsManually();
      }, 2000);
    }
  }, [currentUser?.uid]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) {
      console.log('No selected conversation, clearing messages');
      setConversationMessages([]);
      return;
    }

    console.log('Setting up message subscription for conversation:', selectedConversation.id);

    const unsubscribe = messagingService.subscribeToMessages(
      selectedConversation.id,
      (messagesList) => {
        console.log('Received messages update:', messagesList.length, 'messages');
        console.log('Messages:', messagesList.map(m => ({
          id: m.id,
          content: m.content.substring(0, 50) + '...',
          senderId: m.senderId,
          timestamp: m.timestamp
        })));
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

    // Temporarily disabled typing indicators to focus on message sending
    /*
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
    */
  }, [selectedConversation?.id, currentUser?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages, typingIndicators]);

  const loadStudents = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const studentsQuery = collection(db, 'users');
      const snapshot = await getDocs(studentsQuery);
      const studentsData = snapshot.docs
        .filter(doc => (doc.data() as any).role === 'student')
        .map(doc => ({
          id: doc.id,
          name: (doc.data() as any).displayName || 'Unknown',
          email: (doc.data() as any).email || '',
          skills: (doc.data() as any).skills || [],
          location: (doc.data() as any).location || 'Not specified',
          avatar: (doc.data() as any).avatar,
          resume: (doc.data() as any).resume,
          bio: (doc.data() as any).bio,
          experience: (doc.data() as any).experience,
          currentRole: (doc.data() as any).currentRole,
          linkedinUrl: (doc.data() as any).linkedinUrl,
          githubUrl: (doc.data() as any).githubUrl,
          portfolioUrl: (doc.data() as any).portfolioUrl,
          targetRoles: (doc.data() as any).targetRoles || [],
          college: (doc.data() as any).college,
          university: (doc.data() as any).university,
          mobileNumber: (doc.data() as any).mobileNumber,
          workType: (doc.data() as any).workType,
          preferredLocations: (doc.data() as any).preferredLocations,
          projects: (doc.data() as any).projects || []
        })) as Student[];
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const messagesQuery = query(
        collection(db, 'recruiterMessages'),
        where('recruiterId', '==', currentUser?.uid || '')
      );
      const snapshot = await getDocs(messagesQuery);
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data() as any).timestamp?.toDate?.() || new Date()
      })) as RecruiterMessage[];
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadRecruiterProfile = async () => {
    try {
      if (!currentUser?.uid) return;
      
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        const profile: RecruiterProfile = {
          id: currentUser.uid,
          companyName: userData.companyName || userProfile?.displayName || "Your Company",
          contactEmail: userData.contactEmail || userProfile?.email || "",
          phoneNumber: userData.phoneNumber || "",
          location: userData.location || "",
          companyWebsite: userData.companyWebsite || "",
          industry: userData.industry || "",
          about: userData.about || ""
        };
        setRecrutingProfile(profile);
      }
    } catch (error) {
      console.error('Error loading recruiter profile:', error);
    }
  };

  // Enhanced filtering with multiple criteria
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.currentRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.university?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(s => 
        selectedSkills.some(skill => 
          s.skills.some(studentSkill => 
            studentSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    if (locationFilter && locationFilter !== 'all') {
      filtered = filtered.filter(s =>
        s.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (experienceFilter && experienceFilter !== 'all') {
      filtered = filtered.filter(s =>
        s.experience?.toLowerCase().includes(experienceFilter.toLowerCase()) ||
        s.currentRole?.toLowerCase().includes(experienceFilter.toLowerCase())
      );
    }

    if (workTypeFilter && workTypeFilter !== 'all') {
      filtered = filtered.filter(s =>
        s.workType?.toLowerCase().includes(workTypeFilter.toLowerCase()) ||
        s.preferredLocations?.toLowerCase().includes(workTypeFilter.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedSkills, locationFilter, experienceFilter, workTypeFilter, students]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const sendMessageInConversation = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.uid || isSending) return;
    
    console.log('=== SENDING MESSAGE ===');
    console.log('Message content:', newMessage.trim());
    console.log('Selected conversation:', selectedConversation.id);
    console.log('Current user:', currentUser.uid);
    console.log('Recruiter name:', recruitingProfile.companyName || userProfile?.displayName || 'Recruiter');
    
    setIsSending(true);
    try {
      console.log('Calling messagingService.sendMessage...');
      const messageId = await messagingService.sendMessage(
        selectedConversation.id,
        currentUser.uid,
        recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
        'recruiter',
        newMessage.trim(),
        'text',
        undefined,
        replyingTo?.id,
        recruitingProfile.companyName || '',
        (userProfile as any)?.avatar || ''
      );
      
      console.log('Message sent successfully with ID:', messageId);
      setNewMessage('');
      setReplyingTo(null);
      messageInputRef.current?.focus();
      toast.success('Message sent!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your account permissions.');
      } else {
        toast.error('Failed to send message: ' + error.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !currentUser?.uid) return;

    // Temporarily disabled typing indicators to focus on message sending
    /*
    if (!isTyping) {
      setIsTyping(true);
      messagingService.sendTypingIndicator(
        selectedConversation.id,
        currentUser.uid,
        recruitingProfile.companyName || userProfile?.displayName || 'Recruiter'
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
    */
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const loadConversationsManually = async () => {
    if (!currentUser?.uid) return;

    try {
      console.log('Manually loading conversations for recruiter:', currentUser.uid);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const conversationsRef = collection(db, 'conversations');
      
      // Use simpler query without orderBy to avoid index requirements
      const q = query(
        conversationsRef,
        where('participants.recruiterId', '==', currentUser.uid),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      console.log('Manual query returned', snapshot.docs.length, 'documents');
      
      const conversationsList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing conversation doc:', doc.id, data);
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

      // Sort by updatedAt in JavaScript instead of Firestore
      conversationsList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      console.log('Manually loaded conversations:', conversationsList);
      setConversations(conversationsList);
      
      if (conversationsList.length > 0) {
        toast.success(`Loaded ${conversationsList.length} conversations`);
      } else {
        console.log('No conversations found for recruiter:', currentUser.uid);
        toast.info('No conversations found. Start chatting with students to see them here.');
      }
    } catch (error: any) {
      console.error('Error manually loading conversations:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message
      });
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check Firestore security rules.');
      } else if (error.message.includes('index')) {
        toast.error('Database index required. Please create the required indexes or contact support.');
        console.error('Index creation URL: https://console.firebase.google.com/project/careermitra-ef490/firestore/indexes');
      } else {
        toast.error('Failed to load conversations: ' + error.message);
      }
    }
  };

  // Generate AI-powered professional message
  const generateProfessionalInitialMessage = (student: Student): string => {
    const companyName = recruitingProfile.companyName || 'our company';
    const recruiterName = userProfile?.displayName || 'our team';
    
    // Create personalized message based on student's profile
    const skillsText = student.skills.length > 0 
      ? `your expertise in ${student.skills.slice(0, 3).join(', ')}${student.skills.length > 3 ? ' and other technologies' : ''}` 
      : 'your technical background';
    
    const experienceText = student.experience 
      ? ` and your experience in ${student.experience}` 
      : '';
    
    const educationText = student.college || student.university 
      ? ` Your educational background at ${student.college || student.university} also caught our attention.` 
      : '';
    
    const locationText = student.location && student.location !== 'Not specified'
      ? ` We have opportunities in ${student.location} and other locations.`
      : '';

    const targetRoleText = student.targetRoles && student.targetRoles.length > 0
      ? ` I noticed you're interested in ${student.targetRoles[0]} roles, which aligns perfectly with some of our current openings.`
      : '';

    const projectsText = student.projects && student.projects.length > 0
      ? ` Your project work, especially "${student.projects[0].title}", demonstrates the kind of innovative thinking we value.`
      : '';

    const templates = [
      `Hi ${student.name}! 👋

I hope this message finds you well. I'm reaching out from ${companyName} because ${skillsText}${experienceText} really impressed me.${educationText}${targetRoleText}${projectsText}

${locationText}

I'd love to discuss some exciting opportunities that could be a great fit for your career goals. Would you be open to a brief conversation this week?

Looking forward to connecting!

Best regards,
${recruiterName}
${companyName}`,

      `Hello ${student.name}! 

Your profile really stood out to me, particularly ${skillsText}${experienceText}.${educationText}${projectsText}

At ${companyName}, we're always looking for talented individuals like yourself who can bring fresh perspectives and technical excellence to our team.${targetRoleText}${locationText}

I'd be delighted to share more about our current opportunities and learn about your career aspirations. Are you available for a quick chat this week?

Best regards,
${recruiterName}
${companyName}`,

      `Hi ${student.name}! 

I came across your profile and was immediately impressed by ${skillsText}${experienceText}.${educationText}${projectsText}

${companyName} is expanding our team, and I believe your background could be an excellent match for several of our current openings.${targetRoleText}${locationText}

Would you be interested in exploring potential opportunities with us? I'd love to schedule a brief call to discuss how we might work together.

Looking forward to hearing from you!

Warm regards,
${recruiterName}
${companyName}`,

      `Dear ${student.name},

I hope you're doing well! I discovered your profile while searching for talented professionals, and ${skillsText}${experienceText} immediately caught my attention.${educationText}${projectsText}

At ${companyName}, we believe in fostering innovation and growth.${targetRoleText}${locationText} I think there could be some fantastic opportunities for someone with your background.

Would you be interested in a brief conversation to explore how we might collaborate? I'm confident we could offer something that aligns with your career aspirations.

Best wishes,
${recruiterName}
${companyName}`
    ];

    // Select a random template for variety
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const createConversationWithStudent = async (student: Student) => {
    if (!currentUser?.uid) {
      toast.error('Please log in to start a conversation');
      return;
    }

    if (!student || !student.id || !student.name) {
      toast.error('Invalid student data');
      console.error('Invalid student data:', student);
      return;
    }

    // Prevent multiple simultaneous chat creations
    if (creatingChatFor) {
      toast.error('Please wait, already creating a chat...');
      return;
    }

    // Check if conversation already exists
    const existingConversation = conversations.find(c => 
      c.participants.studentId === student.id && c.participants.recruiterId === currentUser.uid
    );

    if (existingConversation) {
      setActiveSection("messages");
      setSelectedConversation(existingConversation);
      toast.success('Opening existing conversation with ' + student.name);
      return;
    }

    setCreatingChatFor(student.id);

    try {
      console.log('Creating conversation with student:', {
        studentId: student.id,
        studentName: student.name,
        recruiterId: currentUser.uid,
        recruiterName: recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
        recruiterCompany: recruitingProfile.companyName || 'Company'
      });

      const conversationId = await messagingService.createConversation(
        student.id,
        student.name,
        currentUser.uid,
        recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
        recruitingProfile.companyName || 'Company',
        student.avatar || '',
        (userProfile as any)?.avatar || ''
      );

      console.log('Conversation created with ID:', conversationId);
      
      if (!conversationId) {
        throw new Error('No conversation ID returned');
      }

      // Generate and send a personalized professional message
      const professionalMessage = generateProfessionalInitialMessage(student);
      
      console.log('Sending professional message:', professionalMessage.substring(0, 100) + '...');
      
      await messagingService.sendMessage(
        conversationId,
        currentUser.uid,
        recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
        'recruiter',
        professionalMessage,
        'text',
        undefined,
        undefined,
        recruitingProfile.companyName || '',
        (userProfile as any)?.avatar || ''
      );

      console.log('Professional initial message sent successfully');
      
      // Switch to messages section immediately
      setActiveSection("messages");
      toast.success('Professional message sent! Conversation started successfully.');
      
      // Force reload conversations to ensure the new one appears
      setTimeout(() => {
        console.log('Reloading conversations after creation...');
        loadConversationsManually();
      }, 1000);
      
      // Try to find and select the conversation after a longer delay
      setTimeout(() => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          console.log('Found conversation, selecting it');
          setSelectedConversation(conversation);
        } else {
          console.log('Conversation not found in list yet, will appear shortly');
          // Try one more time to reload
          loadConversationsManually();
        }
      }, 2500);
      
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your account permissions.');
      } else if (error.message.includes('Missing required parameters')) {
        toast.error('Invalid student or recruiter data. Please try again.');
      } else {
        toast.error('Failed to start conversation: ' + error.message);
      }
    } finally {
      setCreatingChatFor(null);
    }
  };

  const generateProfessionalMessage = (student: Student) => {
    const templates = [
      {
        subject: `Exciting Opportunity at ${recruitingProfile.companyName}`,
        content: `Dear ${student.name},

I hope this message finds you well. I came across your profile and was impressed by your skills in ${student.skills.slice(0, 3).join(', ')}.

We have an exciting opportunity at ${recruitingProfile.companyName} that aligns perfectly with your background${student.currentRole ? ` in ${student.currentRole}` : ''}. I would love to discuss how your expertise could contribute to our team.

Would you be available for a brief conversation this week to explore this opportunity further?

Best regards,
${recruitingProfile.companyName} Recruitment Team`
      },
      {
        subject: `Your Profile Caught Our Attention - ${recruitingProfile.companyName}`,
        content: `Hello ${student.name},

Your impressive background in ${student.skills.slice(0, 2).join(' and ')} has caught our attention at ${recruitingProfile.companyName}.

We're currently looking for talented individuals like yourself${student.targetRoles?.length ? ` for ${student.targetRoles[0]} positions` : ''}. Your experience${student.experience ? ` in ${student.experience}` : ''} would be a valuable addition to our growing team.

I'd be delighted to schedule a call to discuss potential opportunities that match your career goals.

Looking forward to hearing from you.

Best regards,
${recruitingProfile.companyName} Team`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    setMessageSubject(template.subject);
    setMessageContent(template.content);
  };

  const handleSendMessage = async (studentId: string) => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const student = students.find(s => s.id === studentId);
      
      await addDoc(collection(db, 'recruiterMessages'), {
        recruiterId: currentUser?.uid,
        studentId: studentId,
        studentName: student?.name || 'Unknown',
        subject: messageSubject,
        content: messageContent,
        timestamp: serverTimestamp(),
        type: 'sent'
      });

      setMessageContent("");
      setMessageSubject("");
      setSelectedStudent(null);
      toast.success('Message sent successfully!');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setLocationFilter("all");
    setExperienceFilter("all");
    setWorkTypeFilter("all");
  };

  const getProfileCompleteness = (student: Student) => {
    let completeness = 0;
    const fields = [
      student.name,
      student.email,
      student.bio,
      student.skills?.length > 0,
      student.experience,
      student.location !== 'Not specified',
      student.linkedinUrl,
      student.projects?.length > 0
    ];
    
    completeness = (fields.filter(Boolean).length / fields.length) * 100;
    return Math.round(completeness);
  };

  // Enhanced Dashboard Section with better UI
  const renderDashboard = () => {
    const totalStudents = students.length;
    const messagesCount = messages.filter(m => m.type === 'sent').length;
    const activeFilters = [searchQuery, skillFilter, locationFilter, experienceFilter].filter(Boolean).length;

    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Recruiter Dashboard 👋
            </h1>
            <p className="text-muted-foreground mb-4">
              Discover and connect with talented students
            </p>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Data
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                {conversations.length} Active Chats
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                {messages.filter(m => m.type === 'received').length} New Messages
              </Badge>
              <span className="text-muted-foreground ml-auto">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredStudents.length !== totalStudents && `${filteredStudents.length} filtered`}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{messagesCount}</div>
                  <div className="text-sm text-muted-foreground">Messages Sent</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {messagesCount > 0 ? `${Math.round((messagesCount / totalStudents) * 100)}% engagement` : 'Start connecting!'}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{activeFilters}</div>
                  <div className="text-sm text-muted-foreground">Active Filters</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {activeFilters > 0 ? 'Filters applied' : 'No filters active'}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {students.filter(s => s.skills.length >= 5).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Skilled Candidates</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Students with 5+ skills
              </div>
            </div>
          </div>

          {/* Conversations Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversation Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Active Conversations</div>
                  <div className="text-3xl font-bold">{conversations.length}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {conversations.length > 0 ? `Chatting with ${conversations.length} student${conversations.length !== 1 ? 's' : ''}` : 'No active chats'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Total Messages</div>
                  <div className="text-3xl font-bold text-green-600">
                    {messages.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {messages.filter(m => m.type === 'sent').length} sent, {messages.filter(m => m.type === 'received').length} received
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setActiveSection("students")}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Search className="w-6 h-6" />
                  <span className="text-sm">Find Students</span>
                </Button>
                <Button 
                  onClick={() => setActiveSection("messages")}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-sm">View Messages</span>
                </Button>
                <Button 
                  onClick={() => setActiveSection("profile")}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <Briefcase className="w-6 h-6" />
                  <span className="text-sm">Edit Profile</span>
                </Button>
                <Button 
                  onClick={clearFilters}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  variant="outline"
                >
                  <X className="w-6 h-6" />
                  <span className="text-sm">Clear Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Student Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Student Engagement</span>
                    <span className="text-sm text-muted-foreground">{Math.round((messagesCount / totalStudents) * 100) || 0}%</span>
                  </div>
                  <Progress value={Math.min((messagesCount / totalStudents) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Profile Completeness Avg</span>
                    <span className="text-sm text-muted-foreground">
                      {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + getProfileCompleteness(s), 0) / students.length) : 0}%
                    </span>
                  </div>
                  <Progress value={students.length > 0 ? students.reduce((acc, s) => acc + getProfileCompleteness(s), 0) / students.length : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-Time Conversations Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Active Conversations ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active conversations yet</p>
                  <p className="text-sm text-muted-foreground">Start connecting with students by using Find Students</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversations.map(conv => {
                    const lastMessage = conversationMessages.find(m => m.conversationId === conv.id);
                    const studentName = conv.participants.studentName || 'Student';
                    const isUnread = conv.unreadCount && conv.unreadCount > 0;
                    
                    return (
                      <div 
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setActiveSection("messages");
                        }}
                        className={`p-4 border border-border/50 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conv.id 
                            ? 'bg-primary/5 border-primary/50' 
                            : 'bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {studentName.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-medium ${isUnread ? 'font-bold' : ''}`}>
                                {studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lastMessage 
                                  ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'No messages'}
                              </p>
                            </div>
                          </div>
                          {isUnread && (
                            <Badge variant="default" className="text-xs">
                              {conv.unreadCount} new
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lastMessage?.content || 'Start the conversation...'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    );
  };

  // Enhanced Student Profiles Section
  const renderStudentProfiles = () => {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Student Profiles 🎓
            </h1>
            <p className="text-muted-foreground mb-4">
              Find and connect with talented students ({filteredStudents.length} of {students.length} shown)
            </p>
          </div>

          {/* Enhanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
                {(searchQuery || selectedSkills.length > 0 || locationFilter || experienceFilter || workTypeFilter) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Search Students</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Name, email, college..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Skills</label>
                  <Select value="" onValueChange={(value) => {
                    if (value && !selectedSkills.includes(value)) {
                      setSelectedSkills([...selectedSkills, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skills..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSkills.map(skill => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Experience</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Experience</SelectItem>
                      {experienceOptions.map(exp => (
                        <SelectItem key={exp} value={exp}>
                          {exp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Work Type</label>
                  <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {workTypeOptions.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filter Summary */}
              {(searchQuery || selectedSkills.length > 0 || (locationFilter && locationFilter !== 'all') || (experienceFilter && experienceFilter !== 'all') || (workTypeFilter && workTypeFilter !== 'all')) && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Filters:</span>
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredStudents.length} of {students.length} students
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Search: {searchQuery}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                      </Badge>
                    )}
                    {selectedSkills.map(skill => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        Skill: {skill}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))} />
                      </Badge>
                    ))}
                    {locationFilter && locationFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Location: {locationFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setLocationFilter("all")} />
                      </Badge>
                    )}
                    {experienceFilter && experienceFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Experience: {experienceFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setExperienceFilter("all")} />
                      </Badge>
                    )}
                    {workTypeFilter && workTypeFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Work Type: {workTypeFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setWorkTypeFilter("all")} />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredStudents.map(student => {
                const completeness = getProfileCompleteness(student);
                return (
                  <Card key={student.id} className="hover:shadow-lg transition-all duration-200 border border-border/50 bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-2 border-border">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={completeness >= 80 ? "default" : completeness >= 60 ? "secondary" : "outline"} className="text-xs">
                                {completeness}% Complete
                              </Badge>
                              {student.workType && (
                                <Badge variant="outline" className="text-xs">
                                  {student.workType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {student.currentRole && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Briefcase className="w-4 h-4" />
                              <span className="font-medium">{student.currentRole}</span>
                              {student.experience && (
                                <>
                                  <span>•</span>
                                  <span>{student.experience}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{student.location}</span>
                            {student.preferredLocations && student.preferredLocations !== student.location && (
                              <>
                                <span>•</span>
                                <span className="text-xs">Open to: {student.preferredLocations}</span>
                              </>
                            )}
                          </div>
                          
                          {student.college && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <GraduationCap className="w-4 h-4" />
                              <span>{student.college}</span>
                              {student.university && student.university !== student.college && (
                                <>
                                  <span>•</span>
                                  <span>{student.university}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      {student.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {student.skills.slice(0, 6).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {student.skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.skills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bio Preview */}
                      {student.bio && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {student.bio}
                          </p>
                        </div>
                      )}

                      {/* Profile Completeness */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Profile Strength</span>
                          <span className="font-medium">{completeness}%</span>
                        </div>
                        <Progress value={completeness} className="h-1" />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Dialog open={selectedStudent?.id === student.id} onOpenChange={(open) => {
                          if (!open) {
                            setSelectedStudent(null);
                            setMessageContent("");
                            setMessageSubject("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={student.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h2 className="text-xl font-bold">{student.name}</h2>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left Column - Basic Info */}
                              <div className="lg:col-span-2 space-y-6">
                                {/* Contact Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Mail className="w-5 h-5" />
                                      Contact Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{student.email}</span>
                                    </div>
                                    {student.mobileNumber && (
                                      <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{student.mobileNumber}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{student.location}</span>
                                    </div>
                                    {student.linkedinUrl && (
                                      <div className="flex items-center gap-3">
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                                           className="text-sm text-blue-600 hover:underline">
                                          LinkedIn Profile
                                        </a>
                                      </div>
                                    )}
                                    {student.githubUrl && (
                                      <div className="flex items-center gap-3">
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" 
                                           className="text-sm text-blue-600 hover:underline">
                                          GitHub Profile
                                        </a>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Education */}
                                {(student.college || student.university) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5" />
                                        Education
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {student.university && (
                                        <p className="font-medium">{student.university}</p>
                                      )}
                                      {student.college && (
                                        <p className="text-sm text-muted-foreground">{student.college}</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Bio */}
                                {student.bio && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">About</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm leading-relaxed">{student.bio}</p>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Experience */}
                                {student.experience && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        Experience
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm">{student.experience}</p>
                                      {student.currentRole && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                          Current Role: {student.currentRole}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Projects */}
                                {student.projects && student.projects.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Projects ({student.projects.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        {student.projects.map((project, idx) => (
                                          <div key={idx} className="p-4 border border-border/50 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                              <h4 className="font-medium">{project.title}</h4>
                                              {project.link && (
                                                <a href={project.link} target="_blank" rel="noopener noreferrer" 
                                                   className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                                  <ExternalLink className="w-3 h-3" />
                                                  View
                                                </a>
                                              )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                                            {project.technologies && (
                                              <div className="flex flex-wrap gap-1">
                                                {project.technologies.map((tech, techIdx) => (
                                                  <Badge key={techIdx} variant="outline" className="text-xs">
                                                    {tech}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>

                              {/* Right Column - Skills & Actions */}
                              <div className="space-y-6">
                                {/* Skills */}
                                {student.skills.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Skills ({student.skills.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex flex-wrap gap-2">
                                        {student.skills.map((skill, idx) => (
                                          <Badge key={idx} variant="secondary">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Target Roles */}
                                {student.targetRoles && student.targetRoles.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Star className="w-5 h-5" />
                                        Target Roles
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        {student.targetRoles.map((role, idx) => (
                                          <Badge key={idx} variant="outline" className="block text-center">
                                            {role}
                                          </Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Resume */}
                                {student.resume && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Resume
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Button asChild className="w-full">
                                        <a href={student.resume} target="_blank" rel="noopener noreferrer">
                                          <FileText className="w-4 h-4 mr-2" />
                                          View Resume
                                        </a>
                                      </Button>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Send Message */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <MessageSquare className="w-5 h-5" />
                                      Quick Actions
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <Button
                                      onClick={() => createConversationWithStudent(student)}
                                      className="w-full"
                                      disabled={creatingChatFor === student.id}
                                    >
                                      {creatingChatFor === student.id ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Starting Conversation...
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Start Conversation
                                        </>
                                      )}
                                    </Button>
                                    
                                    <Button
                                      onClick={async () => {
                                        if (!currentUser?.uid) return;
                                        try {
                                          const conversationId = await messagingService.createConversation(
                                            student.id,
                                            student.name,
                                            currentUser.uid,
                                            recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
                                            recruitingProfile.companyName || 'Company',
                                            student.avatar || '',
                                            (userProfile as any)?.avatar || ''
                                          );

                                          // Send job offer message
                                          await messagingService.sendMessage(
                                            conversationId,
                                            currentUser.uid,
                                            recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
                                            'recruiter',
                                            `We have an exciting job opportunity that matches your skills in ${student.skills.slice(0, 3).join(', ')}. Would you be interested in learning more?`,
                                            'job_offer',
                                            {
                                              jobTitle: student.targetRoles?.[0] || 'Software Developer',
                                              location: recruitingProfile.location || 'Remote',
                                              salary: 'Competitive'
                                            },
                                            undefined,
                                            recruitingProfile.companyName || '',
                                            (userProfile as any)?.avatar || ''
                                          );

                                          toast.success('Job offer sent!');
                                          setSelectedStudent(null);
                                          setActiveSection("messages");
                                        } catch (error) {
                                          console.error('Error sending job offer:', error);
                                          toast.error('Failed to send job offer');
                                        }
                                      }}
                                      variant="outline"
                                      className="w-full"
                                    >
                                      <Briefcase className="w-4 h-4 mr-2" />
                                      Send Job Offer
                                    </Button>

                                    <Button
                                      onClick={async () => {
                                        if (!currentUser?.uid) return;
                                        try {
                                          const conversationId = await messagingService.createConversation(
                                            student.id,
                                            student.name,
                                            currentUser.uid,
                                            recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
                                            recruitingProfile.companyName || 'Company',
                                            student.avatar || '',
                                            (userProfile as any)?.avatar || ''
                                          );

                                          // Send interview request message
                                          await messagingService.sendMessage(
                                            conversationId,
                                            currentUser.uid,
                                            recruitingProfile.companyName || userProfile?.displayName || 'Recruiter',
                                            'recruiter',
                                            `Hi ${student.name}, we're impressed with your profile and would like to schedule an interview. Are you available for a conversation this week?`,
                                            'interview_request',
                                            undefined,
                                            undefined,
                                            recruitingProfile.companyName || '',
                                            (userProfile as any)?.avatar || ''
                                          );

                                          toast.success('Interview request sent!');
                                          setSelectedStudent(null);
                                          setActiveSection("messages");
                                        } catch (error) {
                                          console.error('Error sending interview request:', error);
                                          toast.error('Failed to send interview request');
                                        }
                                      }}
                                      variant="outline"
                                      className="w-full"
                                    >
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Request Interview
                                    </Button>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => createConversationWithStudent(student)}
                          disabled={creatingChatFor === student.id}
                        >
                          {creatingChatFor === student.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting Chat...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Start Chat
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Messages Section - WhatsApp-like interface
  const renderMessages = () => {
    const renderMessage = (message: Message, index: number) => {
      const isOwnMessage = message.senderId === currentUser?.uid;
      const showAvatar = !isOwnMessage && (index === 0 || conversationMessages[index - 1]?.senderId !== message.senderId);
      const isLastInGroup = index === conversationMessages.length - 1 || conversationMessages[index + 1]?.senderId !== message.senderId;
      
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
                  {conversationMessages.find(m => m.id === message.replyTo)?.content || 'Message not found'}
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
                  <Badge variant={message.messageType === 'job_offer' ? "default" : "secondary"} className="text-xs">
                    {message.messageType === 'job_offer' ? 'Job Offer' : 'Interview Request'}
                  </Badge>
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
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Messages 💬
          </h1>
          <p className="text-muted-foreground">
            Connect with students and manage conversations
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Conversations</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {conversations.reduce((sum, conv) => sum + (conv.unreadCount[currentUser?.uid || ''] || 0), 0)} unread
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Refreshing conversations...');
                        // Force re-subscription by toggling a state
                        setConversations([]);
                        setTimeout(() => {
                          console.log('Conversations should reload automatically');
                        }, 100);
                      }}
                    >
                      🔄
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start messaging students from the Students section</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => {
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
                                  <AvatarImage src={conversation.participants.studentAvatar} />
                                  <AvatarFallback>
                                    {conversation.participants.studentName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                {/* Online indicator */}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {conversation.participants.studentName}
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
                      <AvatarImage src={selectedConversation.participants.studentAvatar} />
                      <AvatarFallback>
                        {selectedConversation.participants.studentName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedConversation.participants.studentName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                            <AvatarImage src={selectedConversation.participants.studentAvatar} />
                            <AvatarFallback className="text-xs">
                              {selectedConversation.participants.studentName.split(' ').map(n => n[0]).join('')}
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
                            sendMessageInConversation();
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
                      onClick={sendMessageInConversation} 
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
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the left to start messaging with students</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Profile Section
  const renderProfile = () => {
    const handleSaveProfile = async () => {
      if (!tempProfile || !currentUser?.uid) {
        toast.error('Error: Profile data missing');
        return;
      }

      setIsSaving(true);
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        await updateDoc(userDocRef, {
          companyName: tempProfile.companyName,
          contactEmail: tempProfile.contactEmail,
          phoneNumber: tempProfile.phoneNumber,
          location: tempProfile.location,
          companyWebsite: tempProfile.companyWebsite,
          industry: tempProfile.industry,
          about: tempProfile.about,
          updatedAt: new Date()
        });

        setRecrutingProfile(tempProfile);
        setEditingProfile(false);
        setTempProfile(null);
        toast.success('Profile updated successfully!');
      } catch (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    const currentProfile = tempProfile || recruitingProfile;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Recruiter Profile</h2>
          <p className="text-gray-600">Manage your company information</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Company Information</CardTitle>
            <Button 
              onClick={() => {
                setEditingProfile(!editingProfile);
                if (!editingProfile) {
                  setTempProfile(recruitingProfile);
                } else {
                  setTempProfile(null);
                }
              }}
              variant={editingProfile ? "default" : "outline"}
            >
              {editingProfile ? "Cancel" : "Edit"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingProfile ? (
              <>
                <div>
                  <label className="text-sm font-medium block mb-2">Company Name</label>
                  <Input
                    value={currentProfile.companyName}
                    onChange={(e) => setTempProfile({...currentProfile, companyName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Contact Email</label>
                  <Input
                    value={currentProfile.contactEmail}
                    onChange={(e) => setTempProfile({...currentProfile, contactEmail: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Phone Number</label>
                  <Input
                    value={currentProfile.phoneNumber}
                    onChange={(e) => setTempProfile({...currentProfile, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Location</label>
                  <Input
                    value={currentProfile.location}
                    onChange={(e) => setTempProfile({...currentProfile, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Company Website</label>
                  <Input
                    value={currentProfile.companyWebsite}
                    onChange={(e) => setTempProfile({...currentProfile, companyWebsite: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Industry</label>
                  <Input
                    value={currentProfile.industry}
                    onChange={(e) => setTempProfile({...currentProfile, industry: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">About</label>
                  <Textarea
                    value={currentProfile.about}
                    onChange={(e) => setTempProfile({...currentProfile, about: e.target.value})}
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-lg">{recruitingProfile.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Email</label>
                  <p className="text-lg">{recruitingProfile.contactEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-lg">{recruitingProfile.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-lg">{recruitingProfile.location || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Website</label>
                  <p className="text-lg">
                    {recruitingProfile.companyWebsite ? (
                      <a href={recruitingProfile.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {recruitingProfile.companyWebsite}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="text-lg">{recruitingProfile.industry || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">About</label>
                  <p className="text-lg">{recruitingProfile.about || 'Not provided'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <RecruiterSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="lg:ml-64 transition-all duration-300">
        <div className="p-6">
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "students" && renderStudentProfiles()}
          {activeSection === "messages" && renderMessages()}
          {activeSection === "profile" && renderProfile()}
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboard;