import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { toast } from "sonner";
import { 
  Mic, 
  Play, 
  Square, 
  RotateCcw, 
  Award, 
  Clock, 
  Target,
  TrendingUp,
  Volume2,
  MicOff,
  CheckCircle,
  AlertTriangle,
  Brain,
  Star,
  MessageSquare,
  Lightbulb,
  BarChart3
} from "lucide-react";

interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer: string;
  keywords: string[];
  followUp?: string;
  timeLimit: number; // in seconds
}

interface InterviewSession {
  id: string;
  role: string;
  level: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: string;
    score: number;
    feedback: string;
    timeSpent: number;
  }>;
  startTime: Date;
  status: 'setup' | 'active' | 'completed';
  overallScore: number;
}

const InterviewPractice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Role-based interview questions
  const interviewQuestions: Record<string, Record<string, InterviewQuestion[]>> = {
    "frontend": {
      "easy": [
        {
          id: "fe_easy_1",
          question: "Tell me about yourself and your experience with frontend development.",
          type: "behavioral",
          difficulty: "easy",
          expectedAnswer: "Should mention HTML, CSS, JavaScript experience, projects worked on, passion for user interfaces",
          keywords: ["HTML", "CSS", "JavaScript", "React", "Vue", "Angular", "responsive", "user experience"],
          timeLimit: 120,
          followUp: "What's your favorite frontend framework and why?"
        },
        {
          id: "fe_easy_2", 
          question: "What is the difference between HTML, CSS, and JavaScript?",
          type: "technical",
          difficulty: "easy",
          expectedAnswer: "HTML structures content, CSS styles appearance, JavaScript adds interactivity and behavior",
          keywords: ["structure", "styling", "interactivity", "markup", "presentation", "behavior"],
          timeLimit: 90
        },
        {
          id: "fe_easy_3",
          question: "How do you ensure your websites work on different devices?",
          type: "technical", 
          difficulty: "easy",
          expectedAnswer: "Use responsive design, media queries, flexible layouts, test on multiple devices",
          keywords: ["responsive", "media queries", "mobile-first", "flexbox", "grid", "viewport"],
          timeLimit: 100
        }
      ],
      "medium": [
        {
          id: "fe_med_1",
          question: "Explain the concept of the DOM and how you manipulate it with JavaScript.",
          type: "technical",
          difficulty: "medium", 
          expectedAnswer: "DOM is Document Object Model, tree structure representing HTML. Use methods like getElementById, querySelector, addEventListener to manipulate",
          keywords: ["DOM", "Document Object Model", "getElementById", "querySelector", "addEventListener", "manipulation"],
          timeLimit: 150
        },
        {
          id: "fe_med_2",
          question: "Describe a challenging frontend project you worked on and how you solved the problems.",
          type: "behavioral",
          difficulty: "medium",
          expectedAnswer: "Should describe specific project, challenges faced, solutions implemented, lessons learned",
          keywords: ["project", "challenge", "solution", "problem-solving", "debugging", "optimization"],
          timeLimit: 180
        }
      ],
      "hard": [
        {
          id: "fe_hard_1",
          question: "How would you optimize the performance of a React application?",
          type: "technical",
          difficulty: "hard",
          expectedAnswer: "Use React.memo, useMemo, useCallback, code splitting, lazy loading, bundle optimization, avoid unnecessary re-renders",
          keywords: ["React.memo", "useMemo", "useCallback", "code splitting", "lazy loading", "optimization", "performance"],
          timeLimit: 200
        }
      ]
    },
    "backend": {
      "easy": [
        {
          id: "be_easy_1",
          question: "What is an API and why is it important?",
          type: "technical",
          difficulty: "easy",
          expectedAnswer: "API is Application Programming Interface, allows different software systems to communicate, enables data exchange",
          keywords: ["API", "interface", "communication", "data exchange", "endpoints", "REST"],
          timeLimit: 120
        }
      ],
      "medium": [
        {
          id: "be_med_1", 
          question: "Explain the difference between SQL and NoSQL databases.",
          type: "technical",
          difficulty: "medium",
          expectedAnswer: "SQL databases are relational with structured schemas, NoSQL are non-relational with flexible schemas",
          keywords: ["SQL", "NoSQL", "relational", "schema", "MongoDB", "PostgreSQL", "flexibility"],
          timeLimit: 150
        }
      ]
    },
    "fullstack": {
      "easy": [
        {
          id: "fs_easy_1",
          question: "Describe the difference between frontend and backend development.",
          type: "technical", 
          difficulty: "easy",
          expectedAnswer: "Frontend handles user interface and user experience, backend handles server logic, databases, and APIs",
          keywords: ["frontend", "backend", "user interface", "server", "database", "API"],
          timeLimit: 120
        }
      ]
    }
  };

  const recentSessions = [
    {
      id: "1",
      role: "Frontend Developer",
      score: 85,
      date: "2 days ago",
      duration: "25 min",
      questions: 8,
      strengths: ["Technical Knowledge", "Communication"],
      weaknesses: ["Problem Solving Speed"]
    },
    {
      id: "2", 
      role: "Full Stack Engineer",
      score: 72,
      date: "1 week ago", 
      duration: "30 min",
      questions: 10,
      strengths: ["System Design"],
      weaknesses: ["Frontend Frameworks", "Database Design"]
    }
  ];

  // Timer effect
  useEffect(() => {
    if (currentSession?.status === 'active' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentSession?.status === 'active') {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, currentSession?.status]);

  const startInterview = () => {
    if (!selectedRole || !difficulty) {
      toast.error("Please select both role and difficulty level");
      return;
    }

    const questions = interviewQuestions[selectedRole]?.[difficulty] || [];
    if (questions.length === 0) {
      toast.error("No questions available for this combination");
      return;
    }

    const session: InterviewSession = {
      id: Date.now().toString(),
      role: selectedRole,
      level: difficulty,
      questions: questions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: new Date(),
      status: 'active',
      overallScore: 0
    };

    setCurrentSession(session);
    setTimeLeft(questions[0].timeLimit);
    startTimeRef.current = new Date();
    setShowFeedback(false);
    
    toast.success("Interview started! Good luck!");
  };

  const handleTimeUp = () => {
    if (currentAnswer.trim()) {
      submitAnswer();
    } else {
      toast.warning("Time's up! Moving to next question.");
      nextQuestion();
    }
  };

  const submitAnswer = async () => {
    if (!currentSession || !currentAnswer.trim()) return;

    setIsAnalyzing(true);
    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    const timeSpent = startTimeRef.current ? 
      Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) : 0;

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const score = analyzeAnswer(currentAnswer, currentQuestion);
    const feedback = generateFeedback(currentAnswer, currentQuestion, score);

    const newAnswer = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      score: score,
      feedback: feedback,
      timeSpent: timeSpent
    };

    const updatedSession = {
      ...currentSession,
      answers: [...currentSession.answers, newAnswer]
    };

    setCurrentSession(updatedSession);
    setShowFeedback(true);
    setIsAnalyzing(false);
  };

  const analyzeAnswer = (answer: string, question: InterviewQuestion): number => {
    const answerWords = answer.toLowerCase().split(/\s+/);
    const keywordMatches = question.keywords.filter(keyword => 
      answerWords.some(word => word.includes(keyword.toLowerCase()))
    ).length;
    
    const keywordScore = (keywordMatches / question.keywords.length) * 60;
    const lengthScore = Math.min((answer.length / 100) * 20, 20);
    const timeBonus = timeLeft > 30 ? 20 : timeLeft > 10 ? 10 : 0;
    
    return Math.min(Math.round(keywordScore + lengthScore + timeBonus), 100);
  };

  const generateFeedback = (answer: string, question: InterviewQuestion, score: number): string => {
    const feedback = [];
    
    if (score >= 80) {
      feedback.push("🌟 Excellent answer! You demonstrated strong understanding.");
    } else if (score >= 60) {
      feedback.push("👍 Good response! You covered the main points well.");
    } else if (score >= 40) {
      feedback.push("📝 Decent attempt, but you could expand on key concepts.");
    } else {
      feedback.push("💡 This needs more detail. Focus on the core concepts.");
    }

    const missingKeywords = question.keywords.filter(keyword => 
      !answer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (missingKeywords.length > 0 && score < 80) {
      feedback.push(`Consider mentioning: ${missingKeywords.slice(0, 3).join(', ')}`);
    }

    if (answer.length < 50) {
      feedback.push("Try to provide more detailed explanations.");
    }

    return feedback.join(' ');
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      const nextIndex = currentSession.currentQuestionIndex + 1;
      const nextQuestion = currentSession.questions[nextIndex];
      
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: nextIndex
      });
      
      setCurrentAnswer("");
      setTimeLeft(nextQuestion.timeLimit);
      startTimeRef.current = new Date();
      setShowFeedback(false);
    } else {
      completeInterview();
    }
  };

  const completeInterview = () => {
    if (!currentSession) return;

    const totalScore = currentSession.answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = Math.round(totalScore / currentSession.answers.length);

    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      overallScore: averageScore
    };

    setCurrentSession(completedSession);
    toast.success(`Interview completed! Your score: ${averageScore}%`);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
    if (!isRecording) {
      toast.info("🎤 Recording started - speak your answer");
    } else {
      toast.info("⏹️ Recording stopped");
    }
  };

  const resetInterview = () => {
    setCurrentSession(null);
    setCurrentAnswer("");
    setTimeLeft(0);
    setShowFeedback(false);
    setIsAnalyzing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];
  const progress = currentSession ? ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              🎯 AI Mock Interview Practice
            </h1>
            <p className="text-muted-foreground">
              Practice with our intelligent AI interviewer and get detailed feedback on your responses
            </p>
          </div>

        <Tabs defaultValue="practice" className="space-y-6">
          <TabsList>
            <TabsTrigger value="practice">Mock Interview</TabsTrigger>
            <TabsTrigger value="history">Interview History</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="space-y-6">
            {!currentSession || currentSession.status === 'setup' ? (
              // Setup Phase
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Interview Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Target Role</label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="frontend">Frontend Developer</SelectItem>
                              <SelectItem value="backend">Backend Developer</SelectItem>
                              <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                              <SelectItem value="mobile">Mobile Developer</SelectItem>
                              <SelectItem value="devops">DevOps Engineer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy (Entry Level)</SelectItem>
                              <SelectItem value="medium">Medium (Mid Level)</SelectItem>
                              <SelectItem value="hard">Hard (Senior Level)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedRole && difficulty && (
                        <Alert>
                          <Brain className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Interview Preview:</strong> You'll face {interviewQuestions[selectedRole]?.[difficulty]?.length || 0} questions 
                            covering behavioral, technical, and situational scenarios for {selectedRole} at {difficulty} level.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        onClick={startInterview} 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedRole || !difficulty}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start AI Mock Interview
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💡 Interview Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>• Use the STAR method for behavioral questions</li>
                        <li>• Think out loud for technical problems</li>
                        <li>• Ask clarifying questions when needed</li>
                        <li>• Be specific with examples from your experience</li>
                        <li>• Stay calm and take your time</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : currentSession.status === 'active' ? (
              // Active Interview Phase
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Question Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={currentQuestion?.type === "technical" ? "default" : 
                                        currentQuestion?.type === "behavioral" ? "secondary" : "outline"}>
                            {currentQuestion?.type}
                          </Badge>
                          <Badge variant={currentQuestion?.difficulty === "hard" ? "destructive" : 
                                        currentQuestion?.difficulty === "medium" ? "default" : "secondary"}>
                            {currentQuestion?.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Interviewer */}
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-2 text-blue-900">AI Interviewer</div>
                          <div className="text-foreground font-medium text-lg leading-relaxed">
                            {currentQuestion?.question}
                          </div>
                          {currentQuestion?.followUp && showFeedback && (
                            <div className="mt-3 text-sm text-muted-foreground italic">
                              Follow-up: {currentQuestion.followUp}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timer */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Time Remaining:</span>
                        </div>
                        <div className={`text-lg font-bold ${timeLeft <= 30 ? 'text-destructive' : 'text-foreground'}`}>
                          {formatTime(timeLeft)}
                        </div>
                      </div>

                      {/* Answer Input */}
                      {!showFeedback && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Your Answer:</label>
                            <Textarea
                              value={currentAnswer}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              placeholder="Type your answer here... Be specific and provide examples."
                              className="min-h-[120px]"
                              disabled={isAnalyzing}
                            />
                          </div>

                          {/* Recording Controls */}
                          <div className="flex items-center justify-center gap-4">
                            <Button
                              variant={isRecording ? "destructive" : "outline"}
                              size="lg"
                              onClick={toggleRecording}
                              className="rounded-full w-16 h-16"
                            >
                              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </Button>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">
                                {isRecording ? "🔴 Recording..." : "Click to record voice answer"}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button 
                              onClick={submitAnswer} 
                              disabled={!currentAnswer.trim() || isAnalyzing}
                              className="flex-1"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Brain className="w-4 h-4 mr-2 animate-spin" />
                                  Analyzing Answer...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Submit Answer
                                </>
                              )}
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentAnswer("")}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Clear
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Feedback Display */}
                      {showFeedback && currentSession.answers.length > 0 && (
                        <div className="space-y-4">
                          {(() => {
                            const lastAnswer = currentSession.answers[currentSession.answers.length - 1];
                            return (
                              <div className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Your Performance
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-2xl font-bold ${
                                      lastAnswer.score >= 80 ? 'text-green-600' : 
                                      lastAnswer.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {lastAnswer.score}%
                                    </div>
                                    {lastAnswer.score >= 80 && <Star className="w-5 h-5 text-yellow-500" />}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{lastAnswer.feedback}</p>
                                <div className="text-xs text-muted-foreground">
                                  Response time: {lastAnswer.timeSpent}s
                                </div>
                              </div>
                            );
                          })()}

                          <Button onClick={nextQuestion} className="w-full">
                            {currentSession.currentQuestionIndex < currentSession.questions.length - 1 ? (
                              <>Next Question →</>
                            ) : (
                              <>Complete Interview</>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Interview Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Session Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Session Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Questions Answered</span>
                        <span className="font-semibold">{currentSession.answers.length}/{currentSession.questions.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="font-semibold">
                          {currentSession.answers.length > 0 ? 
                            Math.round(currentSession.answers.reduce((sum, a) => sum + a.score, 0) / currentSession.answers.length) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time Elapsed</span>
                        <span className="font-semibold">
                          {Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000)} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" size="sm" className="w-full" onClick={resetInterview}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart Interview
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // Completed Interview Phase
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-yellow-500" />
                      Interview Completed!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className={`text-6xl font-bold mb-2 ${
                        currentSession.overallScore >= 80 ? 'text-green-600' : 
                        currentSession.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {currentSession.overallScore}%
                      </div>
                      <div className="text-lg text-muted-foreground">Overall Performance</div>
                      <div className="mt-2">
                        {currentSession.overallScore >= 80 ? (
                          <Badge className="bg-green-500">Excellent Performance</Badge>
                        ) : currentSession.overallScore >= 60 ? (
                          <Badge className="bg-yellow-500">Good Performance</Badge>
                        ) : (
                          <Badge variant="destructive">Needs Improvement</Badge>
                        )}
                      </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Question Breakdown
                        </h3>
                        <div className="space-y-3">
                          {currentSession.answers.map((answer, index) => (
                            <div key={answer.questionId} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Question {index + 1}</span>
                                <span className={`font-bold ${
                                  answer.score >= 80 ? 'text-green-600' : 
                                  answer.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {answer.score}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {answer.feedback}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Recommendations
                        </h3>
                        <div className="space-y-3 text-sm">
                          {currentSession.overallScore < 60 && (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Focus on providing more detailed answers with specific examples from your experience.
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="font-medium mb-2">Areas to Focus:</div>
                            <ul className="space-y-1 text-muted-foreground">
                              <li>• Practice the STAR method for behavioral questions</li>
                              <li>• Review technical concepts for your target role</li>
                              <li>• Work on providing concrete examples</li>
                              <li>• Practice speaking clearly and confidently</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button onClick={resetInterview}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Take Another Interview
                      </Button>
                      <Button variant="outline">
                        <Award className="w-4 h-4 mr-2" />
                        View Detailed Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-4">
              {recentSessions.map((session, index) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <Award className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{session.role}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.duration}
                            </span>
                            <span>{session.questions} questions</span>
                            <span>{session.date}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <div className="text-xs">
                              <span className="text-green-600">Strengths:</span> {session.strengths.join(', ')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="text-xs">
                              <span className="text-red-600">Areas to improve:</span> {session.weaknesses.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          session.score >= 80 ? "text-green-600" : 
                          session.score >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {session.score}%
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                    <p>Performance analytics will appear here after completing more interviews.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Technical Knowledge</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Problem Solving</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
};

export default InterviewPractice;