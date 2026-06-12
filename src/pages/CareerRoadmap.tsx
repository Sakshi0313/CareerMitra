import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  BookOpen, 
  Award, 
  Target,
  ExternalLink,
  Brain,
  AlertTriangle
} from "lucide-react";

const CareerRoadmap = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("gaps");
  const [highlightedSkill, setHighlightedSkill] = useState<string | null>(null);

  // Check URL parameters for tab selection and skill highlighting
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const skillParam = searchParams.get('skill');
    
    if (tabParam && ['gaps', 'courses', 'certs', 'progress'].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
    
    if (skillParam) {
      setHighlightedSkill(skillParam);
      // Auto-clear highlight after 3 seconds
      setTimeout(() => setHighlightedSkill(null), 3000);
    }
  }, [searchParams]);

  // Load roadmap data from Firebase
  useEffect(() => {
    loadRoadmapData();
  }, [userProfile?.uid]);

  const loadRoadmapData = async () => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const roadmapRef = doc(db, 'roadmaps', userProfile.uid);
      const roadmapDoc = await getDoc(roadmapRef);
      
      if (roadmapDoc.exists()) {
        setRoadmapData(roadmapDoc.data());
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update progress for a learning item
  const updateProgress = async (itemId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    if (!userProfile?.uid) return;
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const roadmapRef = doc(db, 'roadmaps', userProfile.uid);
      await updateDoc(roadmapRef, {
        [`progress.${itemId}`]: {
          status,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Update local state immediately for real-time feedback
      setRoadmapData((prev: any) => ({
        ...prev,
        progress: {
          ...prev?.progress,
          [itemId]: { status, updatedAt: new Date().toISOString() }
        }
      }));
      
      toast.success("Progress Updated!", {
        description: `Marked as ${status.replace('_', ' ')}`,
      });
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('roadmapUpdated'));
      
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error("Failed to update progress");
    }
  };

  // Clear all progress
  const clearAllProgress = async () => {
    if (!userProfile?.uid) return;
    
    if (!confirm('Are you sure you want to clear all your learning progress? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const roadmapRef = doc(db, 'roadmaps', userProfile.uid);
      await updateDoc(roadmapRef, {
        progress: {}
      });
      
      // Update local state
      setRoadmapData((prev: any) => ({
        ...prev,
        progress: {}
      }));
      
      toast.success("All Progress Cleared!", {
        description: "Your learning progress has been reset",
      });
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('roadmapUpdated'));
      
    } catch (error) {
      console.error('Error clearing progress:', error);
      toast.error("Failed to clear progress");
    }
  };

  const getProgressStatus = (itemId: string) => {
    return roadmapData?.progress?.[itemId]?.status || 'not_started';
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Generate skill-specific courses for missing skills
  const getSkillCourses = (skill: string) => {
    const skillCourses: { [key: string]: any[] } = {
      "JavaScript": [
        { title: "JavaScript Fundamentals", type: "course", provider: "YouTube - Programming with Mosh", url: "https://youtube.com", duration: "3 hours" },
        { title: "Modern JavaScript ES6+", type: "course", provider: "freeCodeCamp", url: "https://freecodecamp.org", duration: "4 hours" }
      ],
      "React": [
        { title: "React Hooks Complete Guide", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com", duration: "5 hours" },
        { title: "React Projects Tutorial", type: "course", provider: "YouTube - freeCodeCamp", url: "https://youtube.com", duration: "8 hours" }
      ],
      "TypeScript": [
        { title: "TypeScript Complete Course", type: "course", provider: "YouTube - Hitesh Choudhary", url: "https://youtube.com", duration: "4 hours" },
        { title: "TypeScript with React", type: "course", provider: "YouTube - Ben Awad", url: "https://youtube.com", duration: "3 hours" }
      ],
      "Node.js": [
        { title: "Node.js Express Tutorial", type: "course", provider: "YouTube - Traversy Media", url: "https://youtube.com", duration: "6 hours" },
        { title: "Node.js API Development", type: "course", provider: "YouTube - Programming with Mosh", url: "https://youtube.com", duration: "8 hours" }
      ],
      "Python": [
        { title: "Python Complete Course", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com", duration: "12 hours" },
        { title: "Python for Beginners", type: "course", provider: "YouTube - Programming with Mosh", url: "https://youtube.com", duration: "6 hours" }
      ]
    };

    return skillCourses[skill] || [
      { title: `${skill} Complete Course`, type: "course", provider: "YouTube", url: "https://youtube.com", duration: "4 hours" }
    ];
  };

  // Generate certification recommendations for skills
  const generateCertifications = (skill: string) => {
    const certificationMap: { [key: string]: any[] } = {
      "JavaScript": [
        { name: "JavaScript Institute Certification", provider: "JavaScript Institute", url: "https://js.institute", difficulty: "Intermediate" },
        { name: "Meta Frontend Developer Certificate", provider: "Coursera", url: "https://coursera.org", difficulty: "Beginner" }
      ],
      "React": [
        { name: "React Developer Certification", provider: "Meta", url: "https://coursera.org", difficulty: "Intermediate" },
        { name: "Advanced React Patterns", provider: "Udemy", url: "https://udemy.com", difficulty: "Advanced" }
      ],
      "TypeScript": [
        { name: "TypeScript Complete Course", provider: "YouTube - Hitesh Choudhary", url: "https://youtube.com", difficulty: "Intermediate" },
        { name: "TypeScript with React", provider: "YouTube - Ben Awad", url: "https://youtube.com", difficulty: "Advanced" }
      ],
      "Python": [
        { name: "Python Institute PCAP", provider: "Python Institute", url: "https://pythoninstitute.org", difficulty: "Intermediate" },
        { name: "Google IT Automation with Python", provider: "Coursera", url: "https://coursera.org", difficulty: "Beginner" }
      ],
      "AWS": [
        { name: "AWS Certified Solutions Architect", provider: "Amazon", url: "https://aws.amazon.com/certification/", difficulty: "Advanced" },
        { name: "AWS Cloud Practitioner", provider: "Amazon", url: "https://aws.amazon.com/certification/", difficulty: "Beginner" }
      ],
      "Docker": [
        { name: "Docker Certified Associate", provider: "Docker", url: "https://docker.com", difficulty: "Intermediate" },
        { name: "Kubernetes Administrator (CKA)", provider: "CNCF", url: "https://cncf.io", difficulty: "Advanced" }
      ],
      "Node.js": [
        { name: "Node.js Application Developer", provider: "OpenJS Foundation", url: "https://openjsf.org", difficulty: "Intermediate" },
        { name: "Node.js Services Developer", provider: "OpenJS Foundation", url: "https://openjsf.org", difficulty: "Advanced" }
      ],
      "Kubernetes": [
        { name: "Certified Kubernetes Administrator (CKA)", provider: "CNCF", url: "https://cncf.io", difficulty: "Advanced" },
        { name: "Certified Kubernetes Application Developer (CKAD)", provider: "CNCF", url: "https://cncf.io", difficulty: "Intermediate" }
      ],
      "Linux": [
        { name: "Linux Professional Institute LPIC-1", provider: "LPI", url: "https://lpi.org", difficulty: "Intermediate" },
        { name: "Red Hat Certified System Administrator", provider: "Red Hat", url: "https://redhat.com", difficulty: "Advanced" }
      ]
    };

    return certificationMap[skill] || [
      { name: `${skill} Professional Certificate`, provider: "Industry Standard", url: "#", difficulty: "Intermediate" }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 animate-spin" />
          <span>Loading your roadmap...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {roadmapData ? "🎯 AI-Powered Career Roadmap" : "Career Roadmap"}
                </h1>
                <p className="text-muted-foreground">
                  {roadmapData 
                    ? `Personalized learning path generated by GPT-4.1 based on your resume analysis (${roadmapData.resumeScore}% ATS score)`
                    : "Follow your personalized learning path to achieve your career goals"
                  }
                </p>
              </div>
              {roadmapData && Object.keys(roadmapData.progress || {}).length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearAllProgress}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Clear All Progress
                </Button>
              )}
            </div>
          </div>

          {/* ATS-Based Roadmap Section */}
          {roadmapData ? (
            <div className="mb-8">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    🎯 Your Personalized AI Learning Path
                    <Badge variant="default" className="ml-2">
                      Resume Score: {roadmapData.resumeScore}%
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Based on your resume analysis • Best match: {roadmapData.bestMatchRole} • Generated by GPT-4.1
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="gaps" className="w-full" value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
                      <TabsTrigger value="courses">Learning Path</TabsTrigger>
                      <TabsTrigger value="certs">Certifications</TabsTrigger>
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="gaps" className="space-y-4 mt-4">
                      {roadmapData.targetRoles?.map((role: string) => {
                        const skillGaps = roadmapData.skillGaps?.[role] || [];
                        return skillGaps.length > 0 ? (
                          <div key={role} className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              {role} - Missing Skills ({skillGaps.length})
                            </h3>
                            <div className="grid md:grid-cols-3 gap-2">
                              {skillGaps.map((skill: string) => (
                                <div key={skill} className="flex items-center justify-between p-2 border rounded bg-red-50">
                                  <Badge variant="outline" className="border-destructive text-destructive">
                                    {skill}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedTab("courses");
                                      setHighlightedSkill(skill);
                                      toast.success(`Showing courses for ${skill}`);
                                    }}
                                  >
                                    View Courses
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </TabsContent>
                    
                    <TabsContent value="courses" className="space-y-4 mt-4">
                      {roadmapData.selectedRole ? (
                        // Show selected role's comprehensive learning path
                        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            {roadmapData.selectedRole} - Complete Learning Path
                          </h3>
                          
                          {/* Priority Courses */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium mb-3 text-red-600 flex items-center gap-2">
                              🔥 High Priority Courses ({roadmapData.learningPaths[roadmapData.selectedRole]?.filter((course: any) => course.priority === 'high').length || 0})
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {roadmapData.learningPaths[roadmapData.selectedRole]?.filter((course: any) => course.priority === 'high').map((course: any, index: number) => {
                                const itemId = `${roadmapData.selectedRole.toLowerCase().replace(/\s+/g, '')}_course_high_${index}`;
                                const status = getProgressStatus(itemId);
                                return (
                                  <div key={itemId} className="p-3 border rounded-lg bg-red-50 border-red-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getProgressIcon(status)}
                                        <Badge variant="destructive" className="text-xs">
                                          {course.skill}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                                          High Priority
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">{course.duration}</span>
                                    </div>
                                    <h4 className="font-medium text-sm mb-1">{course.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-3">{course.provider}</p>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <a href={course.url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Start Course
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => updateProgress(itemId, 
                                          status === 'completed' ? 'not_started' : 
                                          status === 'in_progress' ? 'completed' : 'in_progress'
                                        )}
                                      >
                                        {status === 'completed' ? 'Reset' : 
                                         status === 'in_progress' ? 'Complete' : 'Start'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Medium Priority Courses */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium mb-3 text-blue-600 flex items-center gap-2">
                              📚 Recommended Courses ({roadmapData.learningPaths[roadmapData.selectedRole]?.filter((course: any) => course.priority === 'medium').length || 0})
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {roadmapData.learningPaths[roadmapData.selectedRole]?.filter((course: any) => course.priority === 'medium').map((course: any, index: number) => {
                                const itemId = `${roadmapData.selectedRole.toLowerCase().replace(/\s+/g, '')}_course_medium_${index}`;
                                const status = getProgressStatus(itemId);
                                return (
                                  <div key={itemId} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getProgressIcon(status)}
                                        <Badge variant="default" className="text-xs bg-blue-500">
                                          {course.skill}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">{course.duration}</span>
                                    </div>
                                    <h4 className="font-medium text-sm mb-1">{course.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-3">{course.provider}</p>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <a href={course.url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Start Course
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => updateProgress(itemId, 
                                          status === 'completed' ? 'not_started' : 
                                          status === 'in_progress' ? 'completed' : 'in_progress'
                                        )}
                                      >
                                        {status === 'completed' ? 'Reset' : 
                                         status === 'in_progress' ? 'Complete' : 'Start'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Fallback to old structure
                        roadmapData.targetRoles?.map((role: string) => {
                          const skillGaps = roadmapData.skillGaps?.[role] || [];
                          
                          return (
                            <div key={role} className="p-4 border rounded-lg">
                              <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                {role} - Learning Resources
                              </h3>
                              
                              {skillGaps.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium mb-2 text-orange-600">
                                    🎯 Courses for Missing Skills
                                  </h4>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    {skillGaps.slice(0, 4).map((skill: string) => {
                                      const skillCourses = getSkillCourses(skill);
                                      const isHighlighted = highlightedSkill === skill;
                                      return skillCourses.slice(0, 1).map((course: any, index: number) => {
                                        const itemId = `${role.toLowerCase().replace(/\s+/g, '')}_skill_${skill.toLowerCase().replace(/\s+/g, '')}_${index}`;
                                        const status = getProgressStatus(itemId);
                                        return (
                                          <div 
                                            key={itemId} 
                                            className={`p-3 border rounded-lg transition-all duration-500 ${
                                              isHighlighted 
                                                ? 'bg-orange-100 border-orange-400 shadow-lg' 
                                                : 'bg-orange-50'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                {getProgressIcon(status)}
                                                <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                                                  {skill}
                                                </Badge>
                                              </div>
                                              <span className="text-xs text-muted-foreground">{course.duration}</span>
                                            </div>
                                            <h4 className="font-medium text-sm mb-1">{course.title}</h4>
                                            <p className="text-xs text-muted-foreground mb-3">{course.provider}</p>
                                            <div className="flex gap-2">
                                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                                <a href={course.url} target="_blank" rel="noopener noreferrer">
                                                  <ExternalLink className="w-3 h-3 mr-1" />
                                                  Start Course
                                                </a>
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => updateProgress(itemId, 
                                                  status === 'completed' ? 'not_started' : 
                                                  status === 'in_progress' ? 'completed' : 'in_progress'
                                                )}
                                              >
                                                {status === 'completed' ? 'Reset' : 
                                                 status === 'in_progress' ? 'Complete' : 'Start'}
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      });
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </TabsContent>
                    
                    <TabsContent value="certs" className="space-y-4 mt-4">
                      {roadmapData.selectedRole ? (
                        // Show selected role's comprehensive certifications
                        <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-green-500" />
                            {roadmapData.selectedRole} - Required Certifications
                          </h3>
                          
                          {/* High Priority Certifications */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium mb-3 text-red-600 flex items-center gap-2">
                              🏆 Essential Certifications ({roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'high').length || 0})
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'high').map((cert: any, index: number) => {
                                const itemId = `${roadmapData.selectedRole.toLowerCase().replace(/\s+/g, '')}_cert_high_${index}`;
                                const status = getProgressStatus(itemId);
                                return (
                                  <div key={itemId} className="p-3 border rounded-lg bg-red-50 border-red-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getProgressIcon(status)}
                                        <Badge variant="destructive" className="text-xs">
                                          {cert.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                                          Essential
                                        </Badge>
                                      </div>
                                    </div>
                                    <h4 className="font-medium text-sm mb-1">{cert.name}</h4>
                                    <p className="text-xs text-muted-foreground mb-3">{cert.provider}</p>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                          <Award className="w-3 h-3 mr-1" />
                                          Get Certified
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => updateProgress(itemId, 
                                          status === 'completed' ? 'not_started' : 
                                          status === 'in_progress' ? 'completed' : 'in_progress'
                                        )}
                                      >
                                        {status === 'completed' ? 'Reset' : 
                                         status === 'in_progress' ? 'Complete' : 'Start'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Medium Priority Certifications */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium mb-3 text-blue-600 flex items-center gap-2">
                              📜 Recommended Certifications ({roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'medium').length || 0})
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'medium').map((cert: any, index: number) => {
                                const itemId = `${roadmapData.selectedRole.toLowerCase().replace(/\s+/g, '')}_cert_medium_${index}`;
                                const status = getProgressStatus(itemId);
                                return (
                                  <div key={itemId} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getProgressIcon(status)}
                                        <Badge variant="default" className="text-xs bg-blue-500">
                                          {cert.difficulty}
                                        </Badge>
                                      </div>
                                    </div>
                                    <h4 className="font-medium text-sm mb-1">{cert.name}</h4>
                                    <p className="text-xs text-muted-foreground mb-3">{cert.provider}</p>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                          <Award className="w-3 h-3 mr-1" />
                                          Get Certified
                                        </a>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => updateProgress(itemId, 
                                          status === 'completed' ? 'not_started' : 
                                          status === 'in_progress' ? 'completed' : 'in_progress'
                                        )}
                                      >
                                        {status === 'completed' ? 'Reset' : 
                                         status === 'in_progress' ? 'Complete' : 'Start'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Low Priority Certifications */}
                          {roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'low').length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium mb-3 text-gray-600 flex items-center gap-2">
                                📋 Optional Certifications ({roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'low').length || 0})
                              </h4>
                              <div className="grid md:grid-cols-2 gap-3">
                                {roadmapData.certifications[roadmapData.selectedRole]?.filter((cert: any) => cert.priority === 'low').map((cert: any, index: number) => {
                                  const itemId = `${roadmapData.selectedRole.toLowerCase().replace(/\s+/g, '')}_cert_low_${index}`;
                                  const status = getProgressStatus(itemId);
                                  return (
                                    <div key={itemId} className="p-3 border rounded-lg bg-gray-50 border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          {getProgressIcon(status)}
                                          <Badge variant="outline" className="text-xs">
                                            {cert.difficulty}
                                          </Badge>
                                        </div>
                                      </div>
                                      <h4 className="font-medium text-sm mb-1">{cert.name}</h4>
                                      <p className="text-xs text-muted-foreground mb-3">{cert.provider}</p>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" asChild>
                                          <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                            <Award className="w-3 h-3 mr-1" />
                                            Get Certified
                                          </a>
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => updateProgress(itemId, 
                                            status === 'completed' ? 'not_started' : 
                                            status === 'in_progress' ? 'completed' : 'in_progress'
                                          )}
                                        >
                                          {status === 'completed' ? 'Reset' : 
                                           status === 'in_progress' ? 'Complete' : 'Start'}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Fallback to old structure
                        roadmapData.targetRoles?.map((role: string) => {
                          const roleSkills = new Set([
                            ...(roadmapData.skillGaps?.[role] || []),
                            ...(userProfile?.skills || []).filter(skill => 
                              roadmapData.extractedSkills?.includes(skill)
                            )
                          ]);

                          return Array.from(roleSkills).length > 0 ? (
                            <div key={role} className="p-4 border rounded-lg bg-green-50">
                              <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4 text-green-500" />
                                {role} - Recommended Certifications
                              </h3>
                              <div className="grid md:grid-cols-2 gap-3">
                                {Array.from(roleSkills).slice(0, 4).map((skill: string) => {
                                  const certs = generateCertifications(skill);
                                  return certs.slice(0, 1).map((cert: any, index: number) => {
                                    const itemId = `${role.toLowerCase().replace(/\s+/g, '')}_cert_${skill.toLowerCase().replace(/\s+/g, '')}_${index}`;
                                    const status = getProgressStatus(itemId);
                                    return (
                                      <div key={itemId} className="p-3 border rounded-lg bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            {getProgressIcon(status)}
                                            <Badge variant="default" className="text-xs bg-green-500">
                                              {skill}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {cert.difficulty}
                                            </Badge>
                                          </div>
                                        </div>
                                        <h4 className="font-medium text-sm mb-1">{cert.name}</h4>
                                        <p className="text-xs text-muted-foreground mb-3">{cert.provider}</p>
                                        <div className="flex gap-2">
                                          <Button variant="outline" size="sm" className="flex-1" asChild>
                                            <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                              <Award className="w-3 h-3 mr-1" />
                                              Get Certified
                                            </a>
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => updateProgress(itemId, 
                                              status === 'completed' ? 'not_started' : 
                                              status === 'in_progress' ? 'completed' : 'in_progress'
                                            )}
                                          >
                                            {status === 'completed' ? 'Reset' : 
                                             status === 'in_progress' ? 'Complete' : 'Start'}
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  });
                                })}
                              </div>
                            </div>
                          ) : null;
                        })
                      )}
                      
                      {/* Show message if no certifications available */}
                      {!roadmapData.selectedRole && !roadmapData.targetRoles?.some((role: string) => {
                        const roleSkills = new Set([
                          ...(roadmapData.skillGaps?.[role] || []),
                          ...(userProfile?.skills || []).filter(skill => 
                            roadmapData.extractedSkills?.includes(skill)
                          )
                        ]);
                        return Array.from(roleSkills).length > 0;
                      }) && (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No certification recommendations available.</p>
                          <p className="text-xs text-muted-foreground mt-1">Complete your resume analysis to get personalized certification suggestions.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="progress" className="space-y-4 mt-4">
                      <div className="space-y-6">
                        {roadmapData.targetRoles?.map((role: string) => {
                          const roleKey = role.toLowerCase().replace(/\s+/g, '');
                          const roleProgress = Object.entries(roadmapData.progress || {})
                            .filter(([itemId]) => itemId.includes(roleKey))
                            .reduce((acc, [, progress]: any) => {
                              acc[progress.status] = (acc[progress.status] || 0) + 1;
                              return acc;
                            }, { completed: 0, in_progress: 0, not_started: 0 });
                          
                          const totalItems = Object.values(roleProgress).reduce((sum: number, count: number) => sum + count, 0);
                          const completedPercentage = totalItems > 0 ? (roleProgress.completed / totalItems) * 100 : 0;
                          
                          return (
                            <Card key={role} className="border-l-4 border-l-primary">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    {role} Progress
                                  </span>
                                  <Badge variant={completedPercentage >= 80 ? "default" : "outline"}>
                                    {Math.round(completedPercentage)}% Complete
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {totalItems > 0 ? (
                                  <div className="space-y-4">
                                    <div>
                                      <div className="flex justify-between text-sm mb-2">
                                        <span>Learning Progress</span>
                                        <span>{Math.round(completedPercentage)}%</span>
                                      </div>
                                      <Progress value={completedPercentage} className="h-3" />
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-2xl font-bold text-green-600">{roleProgress.completed}</div>
                                        <div className="text-xs text-green-700">Completed</div>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-2xl font-bold text-blue-600">{roleProgress.in_progress}</div>
                                        <div className="text-xs text-blue-700">In Progress</div>
                                      </div>
                                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-2xl font-bold text-gray-600">{roleProgress.not_started}</div>
                                        <div className="text-xs text-gray-700">Not Started</div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No learning items for {role} yet.</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>🚀 Get Your AI-Powered Learning Path!</strong> Upload and analyze your resume in the{" "}
                  <a href="/ats-analyzer" className="text-primary underline font-medium">ATS Analyzer</a> to get a personalized learning roadmap.
                </div>
                <Button asChild className="ml-4 shrink-0">
                  <a href="/ats-analyzer">
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze Resume
                  </a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
};

export default CareerRoadmap;