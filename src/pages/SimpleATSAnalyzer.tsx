import { useState } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { simpleATSService, type SimpleATSResult } from "@/lib/simpleATSService";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Target,
  Star,
  BookOpen,
  Brain,
  Loader2,
  Zap
} from "lucide-react";

const SimpleATSAnalyzer = () => {
  const { userProfile } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SimpleATSResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [resumeText, setResumeText] = useState("");

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
      
      setAnalysisResult(null);
      setAnalysisError("");
      setUploadedFile(file);
      
      toast.success('File Uploaded', {
        description: `${file.name} uploaded successfully. Click "Analyze Resume" to start.`,
      });
    }
  };

  const analyzeResume = async () => {
    let textToAnalyze = "";
    
    if (useTextInput) {
      if (!resumeText.trim()) {
        toast.error('No Text Provided', {
          description: 'Please paste your resume text.',
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
      toast.info("Starting Analysis", {
        description: "Extracting skills and analyzing role compatibility...",
        duration: 3000,
      });

      // Get resume text
      if (useTextInput) {
        textToAnalyze = resumeText;
      } else {
        try {
          textToAnalyze = await simpleATSService.extractTextFromFile(uploadedFile!);
        } catch (error) {
          // Fallback: ask user to paste text
          toast.error("File extraction failed", {
            description: "Please try pasting your resume text instead.",
          });
          setUseTextInput(true);
          return;
        }
      }
      
      if (textToAnalyze.length < 50) {
        throw new Error('Resume text is too short. Please provide more detailed content.');
      }

      // Analyze with simple ATS service
      const targetRoles = userProfile?.targetRoles || ["Frontend Developer", "Backend Developer"];
      const result = await simpleATSService.analyzeResume(textToAnalyze, targetRoles);
      
      setAnalysisResult(result);
      
      toast.success("Analysis Complete!", {
        description: `Found ${result.extractedSkills.length} skills. Best match: ${result.bestMatchingRole.role} (${result.bestMatchingRole.score}%)`,
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error.message || "Analysis failed. Please try again.";
      setAnalysisError(errorMessage);
      
      toast.error("Analysis Failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
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
              Simple ATS Analyzer
            </h1>
            <p className="text-muted-foreground">
              Upload your resume or paste text to get instant skill analysis and role matching
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
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>Supported: PDF, DOC, DOCX, TXT (Max 10MB)</p>
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
John Doe - Software Engineer
Skills: JavaScript, React, Node.js, Python, AWS, Docker
Experience: 3 years in web development..."
                        className="mt-2 min-h-[200px] text-sm"
                        rows={10}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        <p>Characters: {resumeText.length} (minimum 50 recommended)</p>
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
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </Button>

                  {analysisError && (
                    <Alert className="border-destructive/50 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {analysisError}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-2">
              {!analysisResult ? (
                <Card className="h-96 flex items-center justify-center">
                  <CardContent className="text-center">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground">
                      Upload your resume or paste text to get instant analysis
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Analysis Results</span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {analysisResult.overallScore}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{analysisResult.extractedSkills.length}</div>
                          <div className="text-sm text-muted-foreground">Skills Found</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{analysisResult.bestMatchingRole.score}%</div>
                          <div className="text-sm text-muted-foreground">Best Match</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{analysisResult.learningPath.length}</div>
                          <div className="text-sm text-muted-foreground">Learning Resources</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best Matching Role */}
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Star className="w-5 h-5" />
                        Best Matching Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{analysisResult.bestMatchingRole.role}</h3>
                        <Badge variant="default" className="bg-green-600">
                          {analysisResult.bestMatchingRole.score}% Match
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">✅ Matched Skills ({analysisResult.bestMatchingRole.matchedSkills.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.bestMatchingRole.matchedSkills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="bg-green-100 text-green-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">❌ Missing Skills ({analysisResult.bestMatchingRole.missingSkills.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.bestMatchingRole.missingSkills.map((skill) => (
                              <Badge key={skill} variant="outline" className="border-red-200 text-red-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Target Roles Analysis */}
                  {analysisResult.targetRolesAnalysis.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Your Target Roles
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysisResult.targetRolesAnalysis.map((role, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-lg">{role.role}</h4>
                              <Badge variant={getScoreBadgeVariant(role.score)}>
                                {role.score}% Match
                              </Badge>
                            </div>
                            <Progress value={role.score} className="h-2 mb-3" />
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium text-green-600 mb-2">✅ Matched ({role.matchedSkills.length})</h5>
                                <div className="flex flex-wrap gap-1">
                                  {role.matchedSkills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-red-600 mb-2">❌ Missing ({role.missingSkills.length})</h5>
                                <div className="flex flex-wrap gap-1">
                                  {role.missingSkills.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs border-red-200 text-red-700">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* All Skills Found */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        All Skills Found ({analysisResult.extractedSkills.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.extractedSkills.map((skill) => (
                          <Badge key={skill} variant="default" className="bg-blue-100 text-blue-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Path */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Recommended Learning Path
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {analysisResult.learningPath.map((resource, index) => (
                          <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-blue-500" />
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                            </div>
                            <h4 className="font-semibold mb-1">{resource.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{resource.provider}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{resource.duration}</span>
                              <Badge variant="secondary" className="text-xs">
                                {resource.skill}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SimpleATSAnalyzer;