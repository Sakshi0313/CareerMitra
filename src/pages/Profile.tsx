import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, convertFileToBase64 } from "@/lib/firebase";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Plus,
  X,
  Eye,
  EyeOff,
  Camera,
  Save,
  Github,
  Linkedin,
  Globe,
  CheckCircle,
  Upload,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Code,
  Lock,
  Shield
} from "lucide-react";

const Profile = () => {
  const { userProfile, currentUser } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadedResume, setUploadedResume] = useState<{
    name: string;
    url: string;
    uploadDate: Date | string;
    size: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    currentRole: "",
    targetRoles: [] as string[],
    experience: "",
    salary: "",
    degree: "",
    university: "",
    graduationYear: "",
    workType: "hybrid",
    availabilityStatus: "open-to-opportunities", // Add availability status
    preferredLocations: "",
    companySize: "any",
    college: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    profilePhotoUrl: "" // Add profile photo URL
  });

  const availableRoles = [
    "Frontend Developer",
    "Backend Developer", 
    "Full Stack Developer",
    "Mobile Developer",
    "DevOps Engineer",
    "Data Scientist",
    "ML Engineer",
    "Product Manager",
    "UI/UX Designer",
    "QA Engineer",
    "Business Analyst",
    "Software Architect"
  ];

  // Role-specific skill mapping
  const roleSkillsMapping = {
    "Frontend Developer": [
      "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "HTML5", "CSS3", 
      "Sass", "Tailwind CSS", "Bootstrap", "jQuery", "Next.js", "Nuxt.js", 
      "Webpack", "Responsive Design", "Testing", "Git"
    ],
    "Backend Developer": [
      "Python", "Java", "Node.js", "C#", "Go", "PHP", "Ruby", "Express.js", 
      "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "MySQL", 
      "PostgreSQL", "MongoDB", "Redis", "REST APIs", "GraphQL", "Git"
    ],
    "Full Stack Developer": [
      "JavaScript", "TypeScript", "React", "Node.js", "Python", "HTML5", "CSS3",
      "Express.js", "MongoDB", "MySQL", "REST APIs", "Git", "Docker", 
      "AWS", "Testing", "Agile", "Problem Solving"
    ],
    "Mobile Developer": [
      "React Native", "Flutter", "Swift", "Kotlin", "iOS Development", 
      "Android Development", "Xamarin", "Ionic", "JavaScript", "TypeScript",
      "Firebase", "SQLite", "Git", "App Store", "Play Store"
    ],
    "DevOps Engineer": [
      "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Jenkins", 
      "GitLab CI", "GitHub Actions", "Terraform", "Linux", "Python", 
      "Bash", "Monitoring", "Security", "Automation", "Git"
    ],
    "Data Scientist": [
      "Python", "R", "Machine Learning", "Deep Learning", "TensorFlow", 
      "PyTorch", "Pandas", "NumPy", "Scikit-learn", "SQL", "Statistics",
      "Tableau", "Power BI", "Jupyter", "Data Visualization", "Git"
    ],
    "ML Engineer": [
      "Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning",
      "MLOps", "Docker", "Kubernetes", "AWS", "Git", "SQL", "Statistics",
      "Model Deployment", "Data Pipeline", "Scikit-learn", "NumPy"
    ],
    "Product Manager": [
      "Product Strategy", "Market Research", "User Research", "Analytics",
      "A/B Testing", "Roadmapping", "Agile", "Scrum", "Stakeholder Management",
      "Communication", "Leadership", "Data Analysis", "SQL", "Excel"
    ],
    "UI/UX Designer": [
      "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "Prototyping",
      "User Research", "Wireframing", "Design Systems", "Usability Testing",
      "HTML5", "CSS3", "Responsive Design", "Accessibility"
    ],
    "QA Engineer": [
      "Manual Testing", "Automation Testing", "Selenium", "Jest", "Cypress",
      "API Testing", "Performance Testing", "Bug Tracking", "Test Planning",
      "Agile", "Git", "JavaScript", "Python", "SQL"
    ],
    "Business Analyst": [
      "Requirements Analysis", "Process Modeling", "Data Analysis", "SQL",
      "Excel", "Power BI", "Tableau", "Stakeholder Management", "Documentation",
      "Agile", "Scrum", "Communication", "Problem Solving"
    ],
    "Software Architect": [
      "System Design", "Microservices", "Cloud Architecture", "Design Patterns",
      "Scalability", "Security", "Performance", "Leadership", "Technical Strategy",
      "Multiple Programming Languages", "Database Design", "API Design"
    ]
  };

  // Get relevant skills based on selected target roles
  const getRelevantSkills = () => {
    if (formData.targetRoles.length === 0) return [];
    
    const relevantSkills = new Set<string>();
    formData.targetRoles.forEach(role => {
      const roleSkills = roleSkillsMapping[role as keyof typeof roleSkillsMapping] || [];
      roleSkills.forEach(skill => relevantSkills.add(skill));
    });
    
    return Array.from(relevantSkills).sort();
  };

  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  
  // Projects state
  const [projects, setProjects] = useState<Array<{
    id: string;
    title: string;
    description: string;
    link: string;
    technologies: string[];
  }>>([]);
  
  // Password update state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    if (userProfile) {
      const displayName = userProfile.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        email: userProfile.email || '',
        phone: userProfile.mobileNumber || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        currentRole: userProfile.currentRole || '',
        targetRoles: userProfile.targetRoles || [],
        experience: userProfile.experience || '',
        salary: userProfile.salary || '',
        degree: userProfile.degree || '',
        university: userProfile.university || userProfile.college || '',
        graduationYear: userProfile.graduationYear || '',
        workType: userProfile.workType || 'hybrid',
        availabilityStatus: (userProfile as any)?.availabilityStatus || 'open-to-opportunities',
        preferredLocations: userProfile.preferredLocations || '',
        companySize: userProfile.companySize || 'any',
        college: userProfile.college || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        githubUrl: userProfile.githubUrl || '',
        portfolioUrl: userProfile.portfolioUrl || '',
        profilePhotoUrl: (userProfile as any)?.profilePhotoUrl || ''
      });

      setSkills(userProfile.skills || []);
      setProjects((userProfile as any)?.projects || []);
      setUploadedResume((userProfile as any)?.resume || null); // Load existing resume
      setIsPublic(userProfile.isPublic !== false);
    }
  }, [userProfile]);

  const displayName = userProfile?.displayName || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }) : 'Recently';

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (error) setError("");
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError("");
  };

  const addTargetRole = (role: string) => {
    if (!formData.targetRoles.includes(role)) {
      setFormData({
        ...formData,
        targetRoles: [...formData.targetRoles, role]
      });
    }
  };

  const removeTargetRole = (role: string) => {
    setFormData({
      ...formData,
      targetRoles: formData.targetRoles.filter(r => r !== role)
    });
  };

  const addSkill = (skill: string) => {
    if (skill === "other") {
      setShowCustomSkill(true);
      return;
    }
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill("");
      setShowCustomSkill(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Project management functions
  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      title: "",
      description: "",
      link: "",
      technologies: []
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, field: string, value: string | string[]) => {
    setProjects(projects.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  const addTechnologyToProject = (projectId: string, technology: string) => {
    if (!technology.trim()) return;
    
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, technologies: [...project.technologies, technology.trim()] }
        : project
    ));
  };

  const removeTechnologyFromProject = (projectId: string, technology: string) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, technologies: project.technologies.filter(tech => tech !== technology) }
        : project
    ));
  };

  // Password update functions
  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [field]: e.target.value });
    if (error) setError("");
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsUpdatingPassword(true);
    setError("");

    try {
      // Re-authenticate user
      if (!currentUser?.email) {
        setError("User email not available");
        return;
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser as any, credential);
      
      // Update password
      await updatePassword(currentUser as any, passwordData.newPassword);
      
      setMessage("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.code === 'auth/wrong-password') {
        setError("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        setError("New password is too weak");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Resume upload functions
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Convert to base64 instead of using Firebase Storage
      const base64String = await convertFileToBase64(file);
      
      const resumeData = {
        name: file.name,
        url: base64String, // Store as base64 data URL
        uploadDate: new Date(),
        size: file.size,
        type: file.type
      };

      setUploadedResume(resumeData);
      setMessage('Resume uploaded successfully! Click Save Changes to save it to your profile.');
      
      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Resume upload failed:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Photo upload function
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    try {
      // Convert to base64 instead of using Firebase Storage
      const base64String = await convertFileToBase64(file);
      
      setFormData({ ...formData, profilePhotoUrl: base64String });
      setMessage('Profile photo updated! Click Save Changes to save it to your profile.');
      
      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Photo upload failed:', error);
      setError('Failed to upload photo. Please try again.');
    }
  };

  const handleResumeDelete = async () => {
    try {
      // If resume has Firebase storage path, we can delete it from storage
      // For now, just clear from Firestore
      setUploadedResume(null);
      setMessage('Resume removed successfully');
    } catch (error) {
      console.error('Failed to delete resume:', error);
      setError('Failed to delete resume');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveChanges = async () => {
    if (!currentUser) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage(""); // Clear any existing messages
      
      const updateData = {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        mobileNumber: formData.phone,
        location: formData.location,
        bio: formData.bio,
        currentRole: formData.currentRole,
        targetRoles: formData.targetRoles,
        experience: formData.experience,
        salary: formData.salary,
        degree: formData.degree,
        university: formData.university,
        college: formData.college || formData.university,
        graduationYear: formData.graduationYear,
        workType: formData.workType,
        availabilityStatus: formData.availabilityStatus, // Add availability status
        preferredLocations: formData.preferredLocations,
        companySize: formData.companySize,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        profilePhotoUrl: formData.profilePhotoUrl, // Add profile photo
        avatar: formData.profilePhotoUrl, // Also save as avatar for compatibility
        skills: skills,
        projects: projects,
        resume: uploadedResume, // Add resume data
        isPublic: isPublic,
        updatedAt: new Date().toISOString(),
        role: 'student' // Ensure role is set
      };

      console.log('Saving profile data for user:', currentUser.uid);
      console.log('Update data:', updateData);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updateData);
      
      console.log('Profile updated successfully in Firestore');
      setMessage("Profile updated successfully!");
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'permission-denied') {
        setError("Permission denied. Please check your authentication status.");
      } else if (error.code === 'not-found') {
        setError("User document not found. Please try logging out and back in.");
      } else {
        setError(`Failed to update profile: ${error.message}`);
      }
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          {message && (
            <Alert className="mb-6 border-success/50 text-success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-6 border-destructive/50 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your profile information and visibility settings
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.profilePhotoUrl || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-xl mb-1">{displayName}</h3>
                  <p className="text-muted-foreground mb-4">Student</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    <span className="text-sm">
                      {isPublic ? (
                        <span className="flex items-center gap-1 text-success">
                          <Eye className="w-4 h-4" />
                          Public Profile
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <EyeOff className="w-4 h-4" />
                          Private Profile
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {formData.email}
                    </div>
                    {formData.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {formData.phone}
                      </div>
                    )}
                    {formData.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {formData.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Joined {joinDate}
                    </div>
                  </div>

                  {/* Social Links */}
                  {(formData.linkedinUrl || formData.githubUrl || formData.portfolioUrl) && (
                    <div className="flex justify-center gap-3 mt-4 pt-4 border-t">
                      {formData.linkedinUrl && (
                        <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-muted-foreground hover:text-primary transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {formData.githubUrl && (
                        <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground hover:text-primary transition-colors">
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {formData.portfolioUrl && (
                        <a href={formData.portfolioUrl} target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground hover:text-primary transition-colors">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Availability Status */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Availability Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={formData.availabilityStatus} onValueChange={handleSelectChange("availabilityStatus")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actively-looking">Actively Looking</SelectItem>
                      <SelectItem value="open-to-opportunities">Open to Opportunities</SelectItem>
                      <SelectItem value="not-available">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    This helps recruiters understand your current job search status
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={formData.firstName}
                            onChange={handleInputChange("firstName")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={formData.lastName}
                            onChange={handleInputChange("lastName")}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={formData.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            value={formData.phone}
                            onChange={handleInputChange("phone")}
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input 
                            id="location" 
                            value={formData.location}
                            onChange={handleInputChange("location")}
                            placeholder="City, State, Country"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          placeholder="Tell us about yourself..."
                          value={formData.bio}
                          onChange={handleInputChange("bio")}
                          className="min-h-24"
                        />
                      </div>

                      {/* Social Links */}
                      <div className="space-y-4">
                        <Label>Professional Links</Label>
                        
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                          <Input
                            id="linkedinUrl"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={formData.linkedinUrl}
                            onChange={handleInputChange("linkedinUrl")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="githubUrl">GitHub Profile</Label>
                          <Input
                            id="githubUrl"
                            placeholder="https://github.com/yourusername"
                            value={formData.githubUrl}
                            onChange={handleInputChange("githubUrl")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="portfolioUrl">Portfolio Website</Label>
                          <Input
                            id="portfolioUrl"
                            placeholder="https://yourportfolio.com"
                            value={formData.portfolioUrl}
                            onChange={handleInputChange("portfolioUrl")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="professional" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Professional Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="currentRole">Current Role</Label>
                        <Input 
                          id="currentRole" 
                          value={formData.currentRole}
                          onChange={handleInputChange("currentRole")}
                          placeholder="e.g., Student, Software Developer" 
                        />
                      </div>
                      
                      {/* Target Roles */}
                      <div className="space-y-2">
                        <Label>Target Roles</Label>
                        <Select onValueChange={addTargetRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add target roles" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.targetRoles.map((role) => (
                            <Badge key={role} variant="secondary" className="flex items-center gap-1">
                              {role}
                              <button
                                type="button"
                                onClick={() => removeTargetRole(role)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Select value={formData.experience} onValueChange={handleSelectChange("experience")}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-1">0-1 years (Fresher)</SelectItem>
                              <SelectItem value="1-3">1-3 years</SelectItem>
                              <SelectItem value="3-5">3-5 years</SelectItem>
                              <SelectItem value="5-10">5-10 years</SelectItem>
                              <SelectItem value="10+">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="salary">Expected Salary (₹ LPA)</Label>
                          <Input 
                            id="salary" 
                            placeholder="e.g., ₹3-6 LPA" 
                            value={formData.salary}
                            onChange={handleInputChange("salary")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input 
                          id="degree" 
                          value={formData.degree}
                          onChange={handleInputChange("degree")}
                          placeholder="e.g., Bachelor of Computer Science" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="university">University/College</Label>
                          <Input 
                            id="university" 
                            value={formData.university}
                            onChange={handleInputChange("university")}
                            placeholder="e.g., University of Delhi" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="graduationYear">Graduation Year</Label>
                          <Input 
                            id="graduationYear" 
                            value={formData.graduationYear}
                            onChange={handleInputChange("graduationYear")}
                            placeholder="e.g., 2024" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Work Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="workType">Work Type</Label>
                        <Select value={formData.workType} onValueChange={handleSelectChange("workType")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="onsite">On-site</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="preferredLocations">Preferred Locations</Label>
                        <Input 
                          id="preferredLocations" 
                          placeholder="e.g., Bangalore, Mumbai, Pune, Hyderabad, Remote" 
                          value={formData.preferredLocations}
                          onChange={handleInputChange("preferredLocations")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companySize">Company Size Preference</Label>
                        <Select value={formData.companySize} onValueChange={handleSelectChange("companySize")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="startup">Startup (1-50)</SelectItem>
                            <SelectItem value="medium">Medium (51-500)</SelectItem>
                            <SelectItem value="large">Large (500+)</SelectItem>
                            <SelectItem value="any">Any Size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Technologies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Selected Skills Display */}
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-12 bg-muted/30">
                        {skills.length > 0 ? (
                          skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <button onClick={() => removeSkill(skill)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Select skills from the table below</p>
                        )}
                      </div>

                      {/* Skills Selection Table */}
                      {formData.targetRoles.length > 0 ? (
                        <div className="border rounded-lg">
                          <div className="p-3 bg-muted/50 border-b">
                            <h4 className="font-medium text-sm">Recommended Skills for Your Target Roles</h4>
                            <p className="text-xs text-muted-foreground">Click on skills to add them to your profile</p>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {getRelevantSkills().map((skill) => (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => addSkill(skill)}
                                  disabled={skills.includes(skill)}
                                  className={`text-left p-2 text-sm rounded border transition-colors ${
                                    skills.includes(skill)
                                      ? 'bg-success/10 border-success text-success cursor-not-allowed'
                                      : 'hover:bg-muted border-border hover:border-primary'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{skill}</span>
                                    {skills.includes(skill) && (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    )}
                                  </div>
                                </button>
                              ))}
                              
                              {/* Other Option */}
                              <button
                                type="button"
                                onClick={() => addSkill("other")}
                                className="text-left p-2 text-sm rounded border border-dashed border-primary hover:bg-primary/5 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  <span>Add Other Skill</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border rounded-lg bg-muted/30 text-center">
                          <p className="text-sm text-muted-foreground">
                            Please select target roles first to see relevant skills
                          </p>
                        </div>
                      )}

                      {/* Custom Skill Input */}
                      {showCustomSkill && (
                        <div className="p-4 border rounded-lg bg-accent/5">
                          <Label htmlFor="customSkill" className="text-sm font-medium">Add Custom Skill</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="customSkill"
                              placeholder="Enter skill name"
                              value={customSkill}
                              onChange={(e) => setCustomSkill(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                            />
                            <Button
                              type="button"
                              onClick={addCustomSkill}
                              disabled={!customSkill.trim()}
                              size="sm"
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCustomSkill(false);
                                setCustomSkill("");
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Skills are automatically suggested based on your target roles. You can add additional skills using "Add Other Skill".
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Code className="w-5 h-5" />
                          Projects Portfolio
                        </CardTitle>
                        <Button onClick={addProject} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {projects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No projects added yet</p>
                          <p className="text-sm">Showcase your work to attract recruiters</p>
                        </div>
                      ) : (
                        projects.map((project) => (
                          <Card key={project.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <Label htmlFor={`project-title-${project.id}`}>Project Title *</Label>
                                    <Input
                                      id={`project-title-${project.id}`}
                                      placeholder="e.g., E-commerce Website, Mobile App"
                                      value={project.title}
                                      onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`project-desc-${project.id}`}>Description *</Label>
                                    <Textarea
                                      id={`project-desc-${project.id}`}
                                      placeholder="Describe what the project does, your role, and key achievements..."
                                      value={project.description}
                                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                      className="min-h-20"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`project-link-${project.id}`}>Project Link (Optional)</Label>
                                    <Input
                                      id={`project-link-${project.id}`}
                                      placeholder="https://github.com/username/project or https://project-demo.com"
                                      value={project.link}
                                      onChange={(e) => updateProject(project.id, 'link', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Technologies Used</Label>
                                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-12 bg-muted/30">
                                      {project.technologies.map((tech) => (
                                        <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                                          {tech}
                                          <button onClick={() => removeTechnologyFromProject(project.id, tech)}>
                                            <X className="w-3 h-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                      <Input
                                        placeholder="Add technology..."
                                        className="border-none bg-transparent p-0 h-6 text-sm flex-1 min-w-32"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.target as HTMLInputElement;
                                            addTechnologyToProject(project.id, input.value);
                                            input.value = '';
                                          }
                                        }}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Press Enter to add technologies (e.g., React, Node.js, MongoDB)
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  {project.link && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(project.link, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeProject(project.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">Project Tips for Recruiters</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Include 3-5 of your best projects that showcase different skills</li>
                          <li>• Describe the problem you solved and your specific contributions</li>
                          <li>• Mention technologies, frameworks, and tools you used</li>
                          <li>• Include live demos or GitHub links when possible</li>
                          <li>• Quantify impact (e.g., "Improved performance by 40%")</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resume" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Resume Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Current Resume */}
                      {uploadedResume ? (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{uploadedResume.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{formatFileSize(uploadedResume.size)}</span>
                                  <span>Uploaded {uploadedResume.uploadDate instanceof Date 
                                    ? uploadedResume.uploadDate.toLocaleDateString() 
                                    : new Date(uploadedResume.uploadDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(uploadedResume.url, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = uploadedResume.url;
                                  link.download = uploadedResume.name;
                                  link.click();
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResumeDelete}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h4 className="font-medium mb-2">No resume uploaded</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload your resume to make it visible to recruiters
                          </p>
                        </div>
                      )}

                      {/* Upload Section */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="resume-upload" className="text-sm font-medium">
                            {uploadedResume ? 'Replace Resume' : 'Upload Resume'}
                          </Label>
                          <div className="mt-2">
                            <input
                              id="resume-upload"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              disabled={isUploading}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('resume-upload')?.click()}
                              disabled={isUploading}
                              className="w-full"
                            >
                              {isUploading ? (
                                <>
                                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  {uploadedResume ? 'Replace Resume' : 'Choose File'}
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Supported formats: PDF, DOC, DOCX (Max 5MB)
                          </p>
                        </div>

                        {/* Resume Tips */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Resume Tips</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Keep your resume to 1-2 pages maximum</li>
                            <li>• Use a clean, professional format</li>
                            <li>• Include relevant keywords for your target roles</li>
                            <li>• Quantify your achievements with numbers</li>
                            <li>• Proofread for spelling and grammar errors</li>
                          </ul>
                        </div>

                        {/* Visibility Settings */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">Resume Visibility</h5>
                              <p className="text-sm text-muted-foreground">
                                Allow recruiters to view your resume
                              </p>
                            </div>
                            <Switch 
                              checked={uploadedResume ? isPublic : false}
                              onCheckedChange={setIsPublic}
                              disabled={!uploadedResume}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Account Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Password Update Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                          <h4 className="font-medium">Change Password</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange("currentPassword")}
                                placeholder="Enter your current password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange("newPassword")}
                                placeholder="Enter your new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Password must be at least 6 characters long
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange("confirmPassword")}
                                placeholder="Confirm your new password"
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <Button
                            onClick={handlePasswordUpdate}
                            disabled={
                              isUpdatingPassword ||
                              !passwordData.currentPassword ||
                              !passwordData.newPassword ||
                              !passwordData.confirmPassword
                            }
                            className="w-full"
                          >
                            {isUpdatingPassword ? (
                              <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Updating Password...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Update Password
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Account Information */}
                      <div className="pt-6 border-t">
                        <h4 className="font-medium mb-4">Account Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email Address:</span>
                            <span>{formData.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Created:</span>
                            <span>{joinDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profile Visibility:</span>
                            <span className={isPublic ? "text-green-600" : "text-muted-foreground"}>
                              {isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Security Tips */}
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <h5 className="font-medium text-amber-900 mb-2">Security Tips</h5>
                        <ul className="text-sm text-amber-800 space-y-1">
                          <li>• Use a strong, unique password for your account</li>
                          <li>• Don't share your login credentials with anyone</li>
                          <li>• Log out from shared or public computers</li>
                          <li>• Keep your profile information up to date</li>
                          <li>• Review your profile visibility settings regularly</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;