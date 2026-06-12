import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Plus, X, Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Icons as SVG components
const GraduationCapIcon = () => (
  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    targetRoles: [] as string[],
    college: "",
    location: "",
    mobileNumber: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    companyName: "",
    companyWebsite: "",
    companySize: "",
    agreeToTerms: false
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyDocument, setCompanyDocument] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.userType) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.userType === "student") {
      if (formData.targetRoles.length === 0) {
        setError("Please select at least one target role");
        return;
      }
      if (!formData.college) {
        setError("College/University is required");
        return;
      }
      if (!formData.location) {
        setError("Location is required");
        return;
      }
      if (!formData.mobileNumber) {
        setError("Mobile number is required");
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setError("");
      setLoading(true);
      
      const registrationData: any = {
        displayName: formData.fullName,
        role: formData.userType as 'student' | 'recruiter'
      };

      // Add student-specific data
      if (formData.userType === 'student') {
        registrationData.targetRoles = formData.targetRoles;
        registrationData.college = formData.college;
        registrationData.location = formData.location;
        registrationData.mobileNumber = formData.mobileNumber;
        registrationData.linkedinUrl = formData.linkedinUrl;
        registrationData.githubUrl = formData.githubUrl;
        registrationData.portfolioUrl = formData.portfolioUrl;
        registrationData.skills = skills;
        if (profileImage) {
          registrationData.profileImage = profileImage;
        }
      }

      // Add recruiter-specific data
      if (formData.userType === 'recruiter') {
        if (!formData.companyName) {
          setError("Company name is required for recruiters");
          return;
        }
        if (!companyDocument) {
          setError("Company document is required for verification");
          return;
        }

        registrationData.companyName = formData.companyName;
        registrationData.companyWebsite = formData.companyWebsite;
        registrationData.companySize = formData.companySize;
        registrationData.location = "India";
        registrationData.phoneNumber = "+91 XXXXXXXXXX";
        registrationData.companyDocument = companyDocument;
      }
      
      await register(formData.email, formData.password, registrationData);
      
      // Show success toast
      if (formData.userType === 'recruiter') {
        toast.success("Registration successful! Your account is pending admin approval.", {
          description: "You'll receive an email notification once approved.",
          duration: 5000,
        });
        navigate("/pending-approval");
      } else {
        toast.success("Welcome to CareerMitra! Your account has been created successfully.", {
          description: "You can now access your dashboard and start building your career.",
          duration: 5000,
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Show error toast
      toast.error("Registration Failed", {
        description: error.message || "Failed to create account. Please try again.",
        duration: 5000,
      });
      
      // Also set local error for form display
      setError(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid document (PDF, DOC, DOCX, JPG, PNG)");
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      setCompanyDocument(file);
      if (error) setError("");
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid image (JPG, PNG)");
        return;
      }
      
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB");
        return;
      }
      
      setProfileImage(file);
      if (error) setError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
            <GraduationCapIcon />
          </div>
          <span className="font-display font-bold text-2xl text-primary-foreground">
            CareerMitra
          </span>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Create Account</CardTitle>
            <CardDescription>
              Start your career journey today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-destructive/50 text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange("fullName")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType">I am a</Label>
                <Select 
                  value={formData.userType} 
                  onValueChange={handleSelectChange("userType")}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.userType === "student" && (
                <div className="space-y-4">
                  {/* Profile Image Upload */}
                  <div className="space-y-2">
                    <Label>Profile Image (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {profileImage ? (
                          <img 
                            src={URL.createObjectURL(profileImage)} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleProfileImageChange}
                          className="hidden"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('profileImage')?.click()}
                          disabled={loading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG (Max 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Target Roles */}
                  <div className="space-y-2">
                    <Label>Target Roles *</Label>
                    <Select onValueChange={addTargetRole} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target roles" />
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

                  {/* College */}
                  <div className="space-y-2">
                    <Label htmlFor="college">College/University *</Label>
                    <Input
                      id="college"
                      placeholder="e.g., Indian Institute of Technology Delhi"
                      value={formData.college}
                      onChange={handleInputChange("college")}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Delhi, India"
                      value={formData.location}
                      onChange={handleInputChange("location")}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      placeholder="+91 9876543210"
                      value={formData.mobileNumber}
                      onChange={handleInputChange("mobileNumber")}
                      required
                      disabled={loading}
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
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="githubUrl">GitHub Profile</Label>
                      <Input
                        id="githubUrl"
                        placeholder="https://github.com/yourusername"
                        value={formData.githubUrl}
                        onChange={handleInputChange("githubUrl")}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolioUrl">Portfolio Website</Label>
                      <Input
                        id="portfolioUrl"
                        placeholder="https://yourportfolio.com"
                        value={formData.portfolioUrl}
                        onChange={handleInputChange("portfolioUrl")}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-4">
                    <Label>Skills</Label>
                    
                    {/* Selected Skills Display */}
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-12 bg-muted/30">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-destructive"
                            >
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
                                disabled={skills.includes(skill) || loading}
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
                              disabled={loading}
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
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            onClick={addCustomSkill}
                            disabled={!customSkill.trim() || loading}
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
                  </div>
                </div>
              )}

              {formData.userType === "recruiter" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={handleInputChange("companyName")}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={formData.companyWebsite}
                      onChange={handleInputChange("companyWebsite")}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select 
                      value={formData.companySize} 
                      onValueChange={handleSelectChange("companySize")}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyDocument">Company Proof Document</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="companyDocument"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                      <label htmlFor="companyDocument" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {companyDocument ? companyDocument.name : "Upload company registration, GST certificate, or business license"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                        </p>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for recruiter verification. Your account will be reviewed by admin.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={!formData.agreeToTerms || loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-secondary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;