import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { enhancedATSService, type EnhancedATSResult } from "@/lib/enhancedATSService";
import { simpleATSService } from "@/lib/simpleATSService";
import { realtimeDataService } from "@/lib/realtimeDataService";
import { learningPathService } from "@/lib/learningPathService";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  TrendingUp,
  Download,
  Eye,
  Lightbulb,
  Zap,
  Star,
  BookOpen,
  Award,
  ArrowRight,
  Brain,
  Loader2,
  Plus,
  ExternalLink
} from "lucide-react";

const ATSAnalyzer = () => {
  const { userProfile } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EnhancedATSResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [useTextInput, setUseTextInput] = useState(false);
  const [resumeText, setResumeText] = useState("");

  // Load analysis history from localStorage on component mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`ats_analysis_${userProfile?.uid}`);
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis);
        setAnalysisResult(parsed.result);
        setAnalysisHistory(parsed.history || []);
      } catch (error) {
        console.error('Error loading saved analysis:', error);
      }
    }
  }, [userProfile?.uid]);

  // Save analysis to localStorage whenever it changes
  useEffect(() => {
    if (analysisResult && userProfile?.uid) {
      const analysisData = {
        result: analysisResult,
        history: analysisHistory,
        timestamp: new Date().toISOString(),
        fileName: uploadedFile?.name || 'Unknown'
      };
      localStorage.setItem(`ats_analysis_${userProfile.uid}`, JSON.stringify(analysisData));
    }
  }, [analysisResult, analysisHistory, userProfile?.uid, uploadedFile?.name]);

  // Save analysis results to user's career roadmap
  const saveToRoadmap = async (result: EnhancedATSResult) => {
    if (!userProfile?.uid) return;
    
    try {
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const roadmapRef = doc(db, 'roadmaps', userProfile.uid);
      const existingRoadmap = await getDoc(roadmapRef);
      
      // Create roadmap data structure
      const roadmapData = {
        userId: userProfile.uid,
        lastUpdated: new Date().toISOString(),
        resumeScore: result.overallScore,
        bestMatchRole: result.bestMatches[0]?.role,
        targetRoles: result.bestMatches.map(m => m.role),
        extractedSkills: result.extractedSkills,
        aiAnalysis: result.aiAnalysis,
        learningPath: result.learningPath,
        progress: existingRoadmap.exists() ? existingRoadmap.data().progress || {} : {}
      };

      await setDoc(roadmapRef, roadmapData, { merge: true });
    } catch (error) {
      console.error('Error saving to roadmap:', error);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-accent';
    return 'text-destructive';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.includes('document') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        toast.error('Invalid File Type', {
          description: 'Please upload a PDF or Word document (.pdf, .doc, .docx)',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File Too Large', {
          description: 'File size must be less than 10MB',
        });
        return;
      }
      
      // Clear previous analysis when new file is uploaded
      setAnalysisResult(null);
      setAnalysisError("");
      setAnalysisHistory([]);
      
      // Clear saved analysis from localStorage
      if (userProfile?.uid) {
        localStorage.removeItem(`ats_analysis_${userProfile.uid}`);
      }
      
      setUploadedFile(file);
      
      toast.success('File Uploaded', {
        description: `${file.name} uploaded successfully. Click "Analyze with AI" to start analysis.`,
      });
    }
  };

  const analyzeResume = async () => {
    let textToAnalyze = "";
    
    if (useTextInput) {
      if (!resumeText.trim()) {
        toast.error('No Text Provided', {
          description: 'Please paste your resume text in the text area.',
        });
        return;
      }
      textToAnalyze = resumeText.trim();
    } else {
      if (!uploadedFile) {
        toast.error('No File Selected', {
          description: 'Please upload a resume file first.',
        });
        return;
      }
    }
    
    setAnalyzing(true);
    setAnalysisError("");
    
    try {
      // Show progress toast
      toast.info("Enhanced ATS Analysis Started", {
        description: useTextInput ? 
          "Analyzing your resume with AI-powered skill extraction and role matching..." : 
          "Extracting text and performing comprehensive AI analysis. This may take 10-15 seconds...",
        duration: 3000,
      });

      // Get resume text
      if (useTextInput) {
        textToAnalyze = resumeText;
      } else {
        try {
          // Text extraction from file
          textToAnalyze = await simpleATSService.extractTextFromFile(uploadedFile!);
          
          toast.success("Text Extraction Complete", {
            description: `Extracted ${textToAnalyze.length} characters from your resume.`,
            duration: 2000,
          });
        } catch (parseError) {
          throw new Error('Failed to extract text from file. Please try a different file format or paste your resume text.');
        }
      }
      
      if (textToAnalyze.length < 50) {
        throw new Error('Resume text is too short. Please provide more detailed resume content.');
      }

      // Use ENHANCED ATS service with real AI analysis
      let enhancedResult: EnhancedATSResult;
      try {
        enhancedResult = await enhancedATSService.analyzeResume(textToAnalyze);
        
        // Verify result has required data with additional safety checks
        if (!enhancedResult) {
          throw new Error('Analysis returned null result');
        }
        
        if (!enhancedResult.bestMatches || !Array.isArray(enhancedResult.bestMatches)) {
          console.warn('bestMatches is not an array, fixing...');
          enhancedResult.bestMatches = [{
            role: 'Frontend Developer',
            score: 0,
            matchedRequired: [],
            matchedPreferred: [],
            missingRequired: ['JavaScript', 'HTML', 'CSS'],
            missingPreferred: ['React', 'TypeScript'],
            suitability: 'poor'
          }];
        }
        
        if (enhancedResult.bestMatches.length === 0) {
          console.warn('bestMatches is empty, adding fallback...');
          enhancedResult.bestMatches.push({
            role: 'Frontend Developer',
            score: 0,
            matchedRequired: [],
            matchedPreferred: [],
            missingRequired: ['JavaScript', 'HTML', 'CSS'],
            missingPreferred: ['React', 'TypeScript'],
            suitability: 'poor'
          });
        }
        
        // Ensure extractedSkills has required structure
        if (!enhancedResult.extractedSkills) {
          enhancedResult.extractedSkills = {
            technical: [],
            softSkills: [],
            tools: [],
            languages: [],
            certifications: [],
            experience: { yearsTotal: 0, companies: [], roles: [] }
          };
        }
        
        // Ensure each skill array exists
        if (!enhancedResult.extractedSkills.technical) enhancedResult.extractedSkills.technical = [];
        if (!enhancedResult.extractedSkills.softSkills) enhancedResult.extractedSkills.softSkills = [];
        if (!enhancedResult.extractedSkills.tools) enhancedResult.extractedSkills.tools = [];
        if (!enhancedResult.extractedSkills.languages) enhancedResult.extractedSkills.languages = [];
        if (!enhancedResult.extractedSkills.certifications) enhancedResult.extractedSkills.certifications = [];
        if (!enhancedResult.extractedSkills.experience) {
          enhancedResult.extractedSkills.experience = { yearsTotal: 0, companies: [], roles: [] };
        }
        
        // Ensure aiAnalysis has required structure
        if (!enhancedResult.aiAnalysis) {
          enhancedResult.aiAnalysis = {
            strengths: ['Professional experience'],
            weaknesses: ['Need skill development'],
            opportunities: ['Learn modern technologies'],
            recommendations: ['Focus on core technologies'],
            careerPath: 'Entry-level development role',
            estimatedLevel: 'junior',
            topSkillGaps: ['JavaScript', 'HTML', 'CSS']
          };
        }
        
        // Ensure each aiAnalysis array exists
        if (!enhancedResult.aiAnalysis.strengths) enhancedResult.aiAnalysis.strengths = ['Professional experience'];
        if (!enhancedResult.aiAnalysis.weaknesses) enhancedResult.aiAnalysis.weaknesses = ['Need skill development'];
        if (!enhancedResult.aiAnalysis.opportunities) enhancedResult.aiAnalysis.opportunities = ['Learn modern technologies'];
        if (!enhancedResult.aiAnalysis.recommendations) enhancedResult.aiAnalysis.recommendations = ['Focus on core technologies'];
        if (!enhancedResult.aiAnalysis.topSkillGaps) enhancedResult.aiAnalysis.topSkillGaps = ['JavaScript', 'HTML', 'CSS'];
        if (!enhancedResult.aiAnalysis.careerPath) enhancedResult.aiAnalysis.careerPath = 'Entry-level development role';
        if (!enhancedResult.aiAnalysis.estimatedLevel) enhancedResult.aiAnalysis.estimatedLevel = 'junior';
        
        // Ensure roleMatches exists
        if (!enhancedResult.roleMatches) enhancedResult.roleMatches = [];
        
        // Ensure learningPath exists
        if (!enhancedResult.learningPath) enhancedResult.learningPath = [];
        
      } catch (analysisError) {
        console.error('Enhanced ATS analysis failed:', analysisError);
        throw new Error(`Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
      }
      
      setAnalysisResult(enhancedResult);
      
      // Add to analysis history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        fileName: useTextInput ? 'Pasted Text' : uploadedFile!.name,
        overallScore: enhancedResult.overallScore,
        bestMatches: enhancedResult.bestMatches.map(m => ({ role: m.role, score: m.score }))
      };
      setAnalysisHistory(prev => [historyEntry, ...prev.slice(0, 4)]); // Keep last 5 analyses
      
      // Save analysis to Firebase if user is authenticated
      if (userProfile?.uid) {
        try {
          // Save ATS analysis to real-time data service
          await realtimeDataService.saveATSAnalysis({
            userId: userProfile.uid,
            overallScore: enhancedResult.overallScore,
            skillsMatch: enhancedResult.bestMatches[0]?.score || 0,
            experienceMatch: 75, // This would come from the analysis
            educationMatch: 80,  // This would come from the analysis
            keywordsFound: enhancedResult.extractedSkills.technical || [],
            missingKeywords: enhancedResult.bestMatches[0]?.missingRequired || [],
            suggestions: enhancedResult.aiAnalysis?.recommendations || [],
            jobTitle: enhancedResult.bestMatches[0]?.role || 'Unknown',
            timestamp: new Date(),
            resumeText: textToAnalyze
          });

          // Generate and save learning path for the best matching role
          if (enhancedResult.bestMatches && enhancedResult.bestMatches.length > 0 && enhancedResult.bestMatches[0]) {
            const bestMatch = enhancedResult.bestMatches[0];
            if (bestMatch && bestMatch.role) {
              const learningPath = learningPathService.generateLearningPath({
                id: 'temp',
                userId: userProfile.uid,
                overallScore: enhancedResult.overallScore,
                skillsMatch: bestMatch.score || 0,
                experienceMatch: 75,
                educationMatch: 80,
                keywordsFound: enhancedResult.extractedSkills?.technical || [],
                missingKeywords: bestMatch.missingRequired || [],
                suggestions: enhancedResult.aiAnalysis?.recommendations || [],
                jobTitle: bestMatch.role || 'Unknown',
                timestamp: new Date()
              }, bestMatch.role);

              await learningPathService.saveLearningPath(learningPath);

              // Also save enhanced learning path data to roadmap
              const { doc, setDoc } = await import('firebase/firestore');
              const { db } = await import('@/lib/firebase');
              
              const roadmapRef = doc(db, 'roadmaps', userProfile.uid);
              const roadmapData = {
                userId: userProfile.uid,
                lastUpdated: new Date().toISOString(),
                resumeScore: enhancedResult.overallScore,
                bestMatchRole: bestMatch.role,
                selectedRole: bestMatch.role,
                targetRoles: enhancedResult.bestMatches?.map(m => m?.role).filter(Boolean) || [],
                extractedSkills: enhancedResult.extractedSkills?.technical || [],
                aiAnalysis: enhancedResult.aiAnalysis,
                skillGaps: {
                  [bestMatch.role]: bestMatch.missingRequired || []
                },
                learningPaths: {
                  [bestMatch.role]: (enhancedResult.learningPath || []).map(resource => ({
                    skill: resource?.skill || 'Unknown',
                    title: resource?.courses?.[0]?.title || `Learn ${resource?.skill || 'Skill'}`,
                    provider: resource?.courses?.[0]?.platform || 'Various',
                    url: resource?.courses?.[0]?.url || '#',
                    duration: resource?.courses?.[0]?.duration || `${resource?.estimatedHours || 10} hours`,
                    priority: resource?.priority || 'medium'
                  }))
                },
                certifications: {
                  [bestMatch.role]: (enhancedResult.learningPath || []).map(resource => ({
                    name: `${resource?.skill || 'Skill'} Professional Certificate`,
                    provider: 'Industry Standard',
                    url: '#',
                    difficulty: 'intermediate',
                    priority: resource?.priority || 'medium'
                  }))
                },
                progress: {}
              };

              await setDoc(roadmapRef, roadmapData, { merge: true });
            }
          }

          console.log('Analysis and learning path saved to Firebase');
        } catch (error) {
          console.error('Error saving to Firebase:', error);
        }
      }
      
      // Trigger dashboard refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('roadmapUpdated'));
      
      // Show success toast
      toast.success("ATS Analysis Complete!", {
        description: `Overall Score: ${enhancedResult.overallScore}% | Best Match: ${enhancedResult.bestMatches?.[0]?.role || 'N/A'} (${enhancedResult.bestMatches?.[0]?.score || 0}%) | Skills: ${enhancedResult.extractedSkills?.technical?.length || 0}`,
        duration: 6000,
      });
      
    } catch (error: any) {
      console.error('ATS Analysis Error:', error);
      const errorMessage = error.message || "Analysis failed. Please try again.";
      setAnalysisError(errorMessage);
      
      toast.error("Analysis Failed", {
        description: errorMessage + (process.env.NODE_ENV === 'development' ? ` [${error?.toString()}]` : ''),
        duration: 8000,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-accent" />;
      case 'needs-improvement': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default: return <XCircle className="w-5 h-5 text-muted-foreground" />;
    }
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
              ATS Resume Analyzer
            </h1>
            <p className="text-muted-foreground">
              Upload your resume to get detailed ATS compatibility analysis and improvement suggestions
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Input Method Toggle */}
                  <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        checked={!useTextInput}
                        onChange={() => {
                          setUseTextInput(false);
                          setResumeText("");
                          setAnalysisResult(null);
                          setAnalysisError("");
                        }}
                        className="text-primary"
                      />
                      <span className="text-sm font-medium">Upload File</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="inputMethod"
                        checked={useTextInput}
                        onChange={() => {
                          setUseTextInput(true);
                          setUploadedFile(null);
                          setAnalysisResult(null);
                          setAnalysisError("");
                        }}
                        className="text-primary"
                      />
                      <span className="text-sm font-medium">Paste Text</span>
                    </label>
                  </div>

                  {!useTextInput ? (
                    // File Upload Section
                    <>
                      <div>
                        <Label htmlFor="resume-upload">Select Resume File</Label>
                        <Input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p>Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
                          <p className="text-amber-600">
                            <strong>💡 Best results:</strong> Use Word documents (.docx) or PDFs with selectable text
                          </p>
                        </div>
                      </div>

                      {uploadedFile && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">{uploadedFile.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Text Input Section
                    <div>
                      <Label htmlFor="resume-text">Paste Your Resume Text</Label>
                      <textarea
                        id="resume-text"
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your complete resume text here...

Example:
John Doe
Software Engineer
Email: john@example.com

EXPERIENCE
Software Developer at ABC Company (2020-2023)
- Developed web applications using React, Node.js, and MongoDB
- Implemented CI/CD pipelines using Jenkins and Docker
- Collaborated with cross-functional teams using Agile methodology

SKILLS
Programming: JavaScript, Python, Java, TypeScript
Frontend: React, Angular, HTML5, CSS3, Bootstrap
Backend: Node.js, Express, Django, REST APIs
Database: MongoDB, MySQL, PostgreSQL
Tools: Git, Docker, AWS, JIRA"
                        className="mt-2 min-h-[300px] text-sm font-mono"
                        rows={15}
                      />
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <p>Characters: {resumeText.length} (minimum 100 recommended)</p>
                        <p className="text-green-600">
                          <strong>💡 Tip:</strong> Include all sections: contact info, experience, skills, education
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={analyzeResume}
                    disabled={(!uploadedFile && !useTextInput) || (useTextInput && resumeText.length < 50) || analyzing}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze with AI (GPT-4.1)
                      </>
                    )}
                  </Button>

                  {analysisError && (
                    <Alert className="mt-4 border-destructive/50 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Analysis Error:</strong> {analysisError}
                        {analysisError.includes('PDF') && (
                          <div className="mt-2 text-sm">
                            <strong>💡 Suggestions:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Convert your PDF to a Word document (.docx)</li>
                              <li>Use a PDF with selectable text (not scanned images)</li>
                              <li>Try copying your resume text into a new document</li>
                              <li>Ensure you have uploaded a valid resume file</li>
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* AI Analysis Info */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI-Powered Analysis
                    {/* API Status Indicator */}
                    <div className="ml-auto">
                      {import.meta.env.VITE_AZURE_OPENAI_KEY ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          API Ready
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          API Not Configured
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Powered by Azure OpenAI GPT-4.1 for intelligent resume analysis</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Role-specific scoring based on your target careers</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Personalized learning recommendations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Career path suggestions based on your skills</p>
                  </div>
                  
                  {!import.meta.env.VITE_AZURE_OPENAI_KEY && (
                    <Alert className="mt-4 border-destructive/50 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Azure OpenAI API is not configured. Please contact support to enable AI analysis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Analysis History */}
              {analysisHistory.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      Analysis History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisHistory.map((entry, index) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{entry.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleDateString()} • 
                              Best: {entry.bestMatches?.[0]?.role || 'N/A'} ({entry.bestMatches?.[0]?.score || 0}%)
                            </p>
                          </div>
                        </div>
                        <Badge variant={entry.overallScore >= 80 ? "default" : entry.overallScore >= 60 ? "secondary" : "outline"}>
                          {entry.overallScore}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ATS Tips */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">ATS Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Use standard section headings like "Experience" and "Education"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Include relevant keywords from the job description</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Avoid images, graphics, and complex formatting</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm">Use simple, clean fonts and layouts</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2">
              {!analysisResult ? (
                <Card className="h-96 flex items-center justify-center">
                  <CardContent className="text-center">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground">
                      Upload your resume to get detailed ATS compatibility analysis
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>ATS Compatibility Score</span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {analysisResult.overallScore}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <Progress value={analysisResult.overallScore} className="h-3" />
                        </div>
                        <span className={`text-2xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                          {analysisResult.overallScore}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.overallScore >= 80 ? 'Excellent! Your resume is highly ATS-compatible.' :
                         analysisResult.overallScore >= 60 ? 'Good score, but there\'s room for improvement.' :
                         'Your resume needs significant optimization for ATS systems.'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Role Match Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Role Compatibility Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Best Match */}
                        <div className="p-4 border rounded-lg bg-accent/5 border-accent">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-accent" />
                            <h3 className="font-semibold">Best Match</h3>
                          </div>
                          <p className="font-medium text-lg">{analysisResult.bestMatches?.[0]?.role || 'No match found'}</p>
                          <Badge variant="default" className="mt-2">
                            {analysisResult.bestMatches?.[0]?.score || 0}% Match
                          </Badge>
                        </div>

                        {/* Second Best Match */}
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Second Best</h3>
                          <p className="font-medium text-lg">{analysisResult.bestMatches?.[1]?.role || 'N/A'}</p>
                          <Badge variant={analysisResult.bestMatches?.[1]?.score >= 70 ? "default" : "secondary"} className="mt-2">
                            {analysisResult.bestMatches?.[1]?.score || 0}% Match
                          </Badge>
                        </div>

                        {/* Skills Found */}
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Skills Detected</h3>
                          <p className="text-2xl font-bold text-primary">{(analysisResult.extractedSkills.technical?.length || 0) + (analysisResult.extractedSkills.softSkills?.length || 0) + (analysisResult.extractedSkills.tools?.length || 0) + (analysisResult.extractedSkills.languages?.length || 0)}</p>
                          <p className="text-sm text-muted-foreground">Total extracted skills</p>
                        </div>
                      </div>

                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          Click on the <strong>"Role Match"</strong> tab below for detailed analysis of each role compatibility.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="roles" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="roles">Role Match</TabsTrigger>
                      <TabsTrigger value="sections">Sections</TabsTrigger>
                      <TabsTrigger value="strengths">Strengths</TabsTrigger>
                      <TabsTrigger value="weaknesses">Improve</TabsTrigger>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="learning">Learning Path</TabsTrigger>
                    </TabsList>

                    <TabsContent value="roles" className="space-y-6">
                      {/* Best Matches Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Top 3 Role Matches
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysisResult.bestMatches?.map((role: any, index: number) => (
                            <div key={index} className={`p-4 border rounded-lg ${
                              index === 0 ? 'bg-accent/5 border-accent' : 'bg-muted/30'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {index === 0 && <Star className="w-5 h-5 text-accent" />}
                                  <div>
                                    <h4 className="font-semibold text-lg">{role.role}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Match: {role.matchedRequired?.length || 0} of {role.matchedRequired?.length + role.missingRequired?.length || 0} required skills
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={role.score >= 80 ? "default" : role.score >= 60 ? "secondary" : "outline"} className="text-lg px-3 py-1">
                                  {role.score}%
                                </Badge>
                              </div>
                              <Progress value={role.score} className="h-3 mb-3" />
                              
                              {/* Matched Skills */}
                              {role.matchedRequired && role.matchedRequired.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-success mb-2">✅ Matched Skills ({role.matchedRequired.length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {role.matchedRequired.slice(0, 8).map((skill: string) => (
                                      <Badge key={skill} variant="outline" className="bg-success/10 text-success border-success/30">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {role.matchedRequired.length > 8 && (
                                      <Badge variant="outline">+{role.matchedRequired.length - 8}</Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Missing Skills */}
                              {role.missingRequired && role.missingRequired.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-destructive mb-2">❌ Missing Skills ({role.missingRequired.length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {role.missingRequired.slice(0, 5).map((skill: string) => (
                                      <Badge key={skill} variant="outline" className="border-destructive text-destructive">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {role.missingRequired.length > 5 && (
                                      <Badge variant="outline">+{role.missingRequired.length - 5}</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* All Roles Score Ranking */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            All Role Scores
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysisResult.roleMatches?.slice(0, 10).map((role: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{index + 1}. {role.role}</h4>
                                  <Badge variant={role.score >= 80 ? "default" : role.score >= 60 ? "secondary" : "outline"}>
                                    {role.score}%
                                  </Badge>
                                </div>
                                <Progress value={role.score} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="sections" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Extracted Skills Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysisResult.extractedSkills?.technical && analysisResult.extractedSkills.technical.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Technical Skills ({analysisResult.extractedSkills.technical.length})</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.extractedSkills.technical.map((skill: string) => (
                                  <Badge key={skill} variant="default">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysisResult.extractedSkills?.softSkills && analysisResult.extractedSkills.softSkills.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Soft Skills ({analysisResult.extractedSkills.softSkills.length})</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.extractedSkills.softSkills.map((skill: string) => (
                                  <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysisResult.extractedSkills?.tools && analysisResult.extractedSkills.tools.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Tools & Platforms ({analysisResult.extractedSkills.tools.length})</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.extractedSkills.tools.map((tool: string) => (
                                  <Badge key={tool} variant="outline">{tool}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysisResult.extractedSkills?.languages && analysisResult.extractedSkills.languages.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Programming Languages ({analysisResult.extractedSkills.languages.length})</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.extractedSkills.languages.map((lang: string) => (
                                  <Badge key={lang} variant="outline">{lang}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysisResult.extractedSkills?.experience && (
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-2">Experience</h4>
                              <p className="text-sm"><strong>Years:</strong> {analysisResult.extractedSkills.experience.yearsTotal}+</p>
                              {analysisResult.extractedSkills.experience.roles.length > 0 && (
                                <p className="text-sm"><strong>Roles:</strong> {analysisResult.extractedSkills.experience.roles.join(', ')}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="strengths" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-success">
                            <CheckCircle className="w-5 h-5" />
                            Your Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.aiAnalysis?.strengths?.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </li>
                            )) || (
                              <li className="text-sm text-muted-foreground">No specific strengths identified. Continue building your skills!</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="weaknesses" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Top Skill Gaps
                            </h4>
                            <div className="space-y-2">
                              {analysisResult.aiAnalysis?.topSkillGaps?.slice(0, 5).map((gap: string, index: number) => (
                                <div key={index} className="flex items-start gap-2">
                                  <Badge variant="outline" className="border-destructive text-destructive mt-0.5">{index + 1}</Badge>
                                  <span className="text-sm">{gap}</span>
                                </div>
                              )) || (
                                <p className="text-sm text-muted-foreground">Great! Your skills are well-rounded.</p>
                              )}
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-accent" />
                              Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {analysisResult.aiAnalysis?.recommendations?.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{rec}</span>
                                </li>
                              )) || (
                                <li className="text-sm text-muted-foreground">No recommendations at this time.</li>
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="keywords" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-accent" />
                            Career Path & Level
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">Estimated Career Level</h4>
                            <Badge className="text-base px-3 py-1">
                              {analysisResult.aiAnalysis?.estimatedLevel?.toUpperCase() || 'MID-LEVEL'}
                            </Badge>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">Career Path</h4>
                            <p className="text-sm">{analysisResult.aiAnalysis?.careerPath || 'Build specialized expertise in your preferred technology area'}</p>
                          </div>
                          <Alert>
                            <Brain className="h-4 w-4" />
                            <AlertDescription>
                              This assessment is powered by AI (GPT-4). Your estimated level and career recommendations are based on your resume content and extracted skills.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="learning" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            AI-Powered Learning Path
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link to="/dashboard/roadmap?tab=courses">
                                <ArrowRight className="w-4 h-4 mr-1" />
                                View Full Roadmap
                              </Link>
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-6">
                            Personalized learning resources based on your skill gaps and target roles. Each course recommendation includes multiple platforms and difficulty levels.
                          </p>
                          
                          {/* Missing Skills Learning Path */}
                          {analysisResult.bestMatches && analysisResult.bestMatches.length > 0 && analysisResult.bestMatches[0]?.missingRequired && analysisResult.bestMatches[0].missingRequired.length > 0 ? (
                            <div className="space-y-6">
                              <Alert className="border-blue-200 bg-blue-50">
                                <Brain className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Personalized for {analysisResult.bestMatches?.[0]?.role || 'Your Target Role'}</strong>
                                  <br />
                                  Based on your ATS analysis, here are the critical skills you need to develop to become job-ready for this role.
                                </AlertDescription>
                              </Alert>

                              {/* Critical Skills Section */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  🔥 Critical Skills ({analysisResult.bestMatches?.[0]?.missingRequired?.length || 0})
                                </h3>
                                
                                {(analysisResult.bestMatches?.[0]?.missingRequired || []).map((skill: string, index: number) => {
                                  const skillResources = learningPathService.getSkillResources(skill);
                                  const skillCertifications = learningPathService.getSkillCertifications(skill);
                                  
                                  return (
                                    <div key={skill} className="border rounded-lg p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                            <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-lg">{skill}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {skillResources.length} courses • {skillCertifications.length} certifications
                                            </p>
                                          </div>
                                        </div>
                                        <Badge variant="destructive">
                                          Critical Priority
                                        </Badge>
                                      </div>

                                      {/* Learning Resources */}
                                      {skillResources.length > 0 && (
                                        <div className="space-y-3 mb-4">
                                          <h5 className="font-medium text-sm">📚 Recommended Courses</h5>
                                          {skillResources.slice(0, 3).map((resource) => (
                                            <div key={resource.id} className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow">
                                              <div className="flex items-start justify-between mb-2">
                                                <div>
                                                  <h6 className="font-semibold text-sm">{resource.title}</h6>
                                                  <p className="text-xs text-muted-foreground">{resource.provider}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Badge variant="outline" className="text-xs">
                                                    {resource.cost === 'free' ? '🆓 Free' : '💳 Paid'}
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-xs capitalize">
                                                    {resource.difficulty}
                                                  </Badge>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                  <span>{resource.duration}</span>
                                                  <span>•</span>
                                                  <span>{resource.estimatedHours}h estimated</span>
                                                </div>
                                                <Button size="sm" variant="outline" asChild>
                                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    Start Learning
                                                  </a>
                                                </Button>
                                              </div>
                                              {resource.description && (
                                                <p className="text-xs text-muted-foreground mt-2">{resource.description}</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Certifications */}
                                      {skillCertifications.length > 0 && (
                                        <div className="space-y-3">
                                          <h5 className="font-medium text-sm">🏆 Industry Certifications</h5>
                                          {skillCertifications.map((cert) => (
                                            <div key={cert.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                                              <div className="flex items-start justify-between mb-2">
                                                <div>
                                                  <h6 className="font-semibold text-sm">{cert.name}</h6>
                                                  <p className="text-xs text-muted-foreground">{cert.provider}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                                  {cert.difficulty}
                                                </Badge>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                  <span>{cert.estimatedStudyHours}h study</span>
                                                  {cert.validityPeriod && (
                                                    <>
                                                      <span>•</span>
                                                      <span>Valid: {cert.validityPeriod}</span>
                                                    </>
                                                  )}
                                                </div>
                                                <Button size="sm" variant="outline" asChild>
                                                  <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                                    <Award className="w-3 h-3 mr-1" />
                                                    Learn More
                                                  </a>
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Learning Path Summary */}
                              <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Your Learning Journey
                                </h4>
                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                      {analysisResult.bestMatches?.[0]?.missingRequired?.length || 0}
                                    </div>
                                    <div className="text-muted-foreground">Skills to Learn</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                      {(analysisResult.bestMatches?.[0]?.missingRequired || []).reduce((total: number, skill: string) => {
                                        const resources = learningPathService.getSkillResources(skill);
                                        return total + resources.reduce((sum, r) => sum + (r?.estimatedHours || 0), 0);
                                      }, 0)}h
                                    </div>
                                    <div className="text-muted-foreground">Estimated Study Time</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">
                                      {Math.ceil((analysisResult.bestMatches?.[0]?.missingRequired || []).reduce((total: number, skill: string) => {
                                        const resources = learningPathService.getSkillResources(skill);
                                        return total + resources.reduce((sum, r) => sum + (r?.estimatedHours || 0), 0);
                                      }, 0) / 10)}
                                    </div>
                                    <div className="text-muted-foreground">Weeks (10h/week)</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Excellent!</strong> Your skills are well-aligned with your target role. Consider exploring advanced topics or specializations to further enhance your expertise.
                              </AlertDescription>
                            </Alert>
                          )}

                          <Alert className="mt-6">
                            <Lightbulb className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Pro Tip:</strong> Start with free courses to build fundamentals, then invest in paid certifications for career advancement. Focus on one skill at a time for better retention.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Generate PDF report
                        const reportContent = `
ATS Resume Analysis Report
Generated on: ${new Date().toLocaleDateString()}

Overall ATS Score: ${analysisResult.overallScore}%
Best Match Role: ${analysisResult.bestMatches[0]?.role} (${analysisResult.bestMatches[0]?.score}%)

Technical Skills Detected (${analysisResult.extractedSkills.technical?.length || 0}):
${analysisResult.extractedSkills.technical?.join(', ') || 'None'}

Top Role Matches:
${analysisResult.bestMatches.map(role => 
  `${role.role}: ${role.score}% match (${role.matchedRequired?.length || 0}/${role.matchedRequired?.length + role.missingRequired?.length || 0} required skills)`
).join('\n')}

Strengths:
${analysisResult.aiAnalysis?.strengths?.map(s => `• ${s}`).join('\n') || 'No specific strengths identified'}

Areas for Improvement:
${analysisResult.aiAnalysis?.weaknesses?.map(w => `• ${w}`).join('\n') || 'No weaknesses identified'}

Recommendations:
${analysisResult.aiAnalysis?.recommendations?.map(s => `• ${s}`).join('\n') || 'No recommendations at this time'}
                        `;
                        
                        const blob = new Blob([reportContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ATS_Analysis_Report_${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success("Report Downloaded", {
                          description: "Your ATS analysis report has been downloaded as a text file.",
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                    <Button asChild>
                      <Link to="/resume-builder">
                        <Eye className="w-4 h-4 mr-2" />
                        Optimize Resume
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ATSAnalyzer;