import { useState, useRef } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Plus, 
  X,
  Save,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Palette,
  Layout,
  Printer,
  Code
} from "lucide-react";

const ResumeBuilder = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("template");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [experiences, setExperiences] = useState([{
    id: 1,
    title: "",
    company: "",
    duration: "",
    description: ""
  }]);
  
  const [education, setEducation] = useState([{
    id: 1,
    degree: "",
    institution: "",
    year: "",
    grade: ""
  }]);

  const [projects, setProjects] = useState([{
    id: 1,
    title: "",
    description: "",
    technologies: "",
    link: "",
    duration: ""
  }]);

  const [certifications, setCertifications] = useState([{
    id: 1,
    title: "",
    issuer: "",
    date: "",
    link: "",
    description: ""
  }]);
  
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      fullName: userProfile?.displayName || "",
      email: userProfile?.email || "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: ""
    },
    summary: "",
    template: "modern"
  });

  // Resume Templates with distinct layouts
  const templates = [
    {
      id: "modern",
      name: "Modern Professional",
      description: "Clean, modern design with left-aligned header and blue accents",
      preview: "/api/placeholder/300/400",
      color: "blue",
      layout: "left-header",
      dummyData: {
        name: "Alex Johnson",
        title: "Software Developer",
        email: "alex.johnson@email.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        summary: "Passionate software developer with 3+ years of experience building scalable web applications using React, Node.js, and cloud technologies."
      }
    },
    {
      id: "classic",
      name: "Classic Traditional",
      description: "Traditional centered format, perfect for conservative industries",
      preview: "/api/placeholder/300/400",
      color: "gray",
      layout: "center-header",
      dummyData: {
        name: "Sarah Williams",
        title: "Business Analyst",
        email: "sarah.williams@email.com",
        phone: "+1 (555) 987-6543",
        location: "New York, NY",
        summary: "Detail-oriented business analyst with expertise in data analysis, process improvement, and stakeholder management across multiple industries."
      }
    },
    {
      id: "creative",
      name: "Creative Designer",
      description: "Bold two-column layout with creative sidebar design",
      preview: "/api/placeholder/300/400",
      color: "purple",
      layout: "two-column",
      dummyData: {
        name: "Jordan Chen",
        title: "UI/UX Designer",
        email: "jordan.chen@email.com",
        phone: "+1 (555) 456-7890",
        location: "Los Angeles, CA",
        summary: "Creative UI/UX designer specializing in user-centered design, prototyping, and creating intuitive digital experiences for web and mobile."
      }
    },
    {
      id: "minimal",
      name: "Minimal Clean",
      description: "Simple right-aligned header with clean typography",
      preview: "/api/placeholder/300/400",
      color: "green",
      layout: "right-header",
      dummyData: {
        name: "Morgan Taylor",
        title: "Data Scientist",
        email: "morgan.taylor@email.com",
        phone: "+1 (555) 321-0987",
        location: "Seattle, WA",
        summary: "Data scientist with strong background in machine learning, statistical analysis, and turning complex data into actionable business insights."
      }
    }
  ];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now(),
      title: "",
      company: "",
      duration: "",
      description: ""
    }]);
  };

  const removeExperience = (id: number) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    setEducation([...education, {
      id: Date.now(),
      degree: "",
      institution: "",
      year: "",
      grade: ""
    }]);
  };

  const removeEducation = (id: number) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addProject = () => {
    setProjects([...projects, {
      id: Date.now(),
      title: "",
      description: "",
      technologies: "",
      link: "",
      duration: ""
    }]);
  };

  const removeProject = (id: number) => {
    setProjects(projects.filter(proj => proj.id !== id));
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      id: Date.now(),
      title: "",
      issuer: "",
      date: "",
      link: "",
      description: ""
    }]);
  };

  const removeCertification = (id: number) => {
    setCertifications(certifications.filter(cert => cert.id !== id));
  };

  const saveResume = async () => {
    try {
      // TODO: Save resume to Firebase
      const resumeToSave = {
        ...resumeData,
        skills,
        experiences,
        education,
        projects,
        certifications,
        updatedAt: new Date()
      };
      
      console.log("Saving resume...", resumeToSave);
      toast.success("Resume saved successfully!");
    } catch (error) {
      console.error('Failed to save resume:', error);
      toast.error("Failed to save resume");
    }
  };

  const downloadResume = () => {
    if (!previewRef.current) {
      toast.error("Please preview the resume first");
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow popups to download PDF");
        return;
      }

      // Get the resume content
      const resumeContent = previewRef.current.innerHTML;
      
      // Create a complete HTML document for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resume - ${resumeData.personalInfo.fullName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.4;
              color: #333;
            }
            .resume-container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .name { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #2563eb;
            }
            .contact-info { 
              font-size: 14px; 
              color: #666; 
            }
            .section { 
              margin-bottom: 25px; 
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #2563eb;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .experience-item, .education-item { 
              margin-bottom: 15px; 
            }
            .item-title { 
              font-weight: bold; 
              font-size: 16px;
            }
            .item-subtitle { 
              color: #666; 
              font-style: italic;
              margin-bottom: 5px;
            }
            .skills { 
              display: flex; 
              flex-wrap: wrap; 
              gap: 8px; 
            }
            .skill-tag { 
              background: #f3f4f6; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px;
              border: 1px solid #d1d5db;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .resume-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
            ${resumeContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast.success("Resume opened for download/print");
    } catch (error) {
      console.error('Failed to download resume:', error);
      toast.error("Failed to download resume");
    }
  };

  const previewResume = () => {
    setShowPreview(true);
  };

  // Generate resume preview based on selected template
  const generateResumePreview = () => {
    const template = templates.find(t => t.id === resumeData.template);
    const colorClass = template?.color === 'blue' ? 'text-blue-600' : 
                      template?.color === 'purple' ? 'text-purple-600' :
                      template?.color === 'green' ? 'text-green-600' : 'text-gray-600';

    // Use dummy data if fields are empty
    const displayData = {
      name: resumeData.personalInfo.fullName || template?.dummyData.name || "Your Name",
      email: resumeData.personalInfo.email || template?.dummyData.email || "your.email@example.com",
      phone: resumeData.personalInfo.phone || template?.dummyData.phone || "+1 (555) 123-4567",
      location: resumeData.personalInfo.location || template?.dummyData.location || "Your City, State",
      linkedin: resumeData.personalInfo.linkedin || "linkedin.com/in/yourprofile",
      portfolio: resumeData.personalInfo.portfolio || "yourportfolio.com",
      summary: resumeData.summary || template?.dummyData.summary || "Write a compelling professional summary that highlights your key skills and achievements..."
    };

    // Different layouts based on template
    if (template?.layout === "two-column") {
      return (
        <div className="resume-container bg-white shadow-lg" ref={previewRef}>
          <div className="flex min-h-[800px]">
            {/* Left Sidebar */}
            <div className={`w-1/3 ${template.color === 'purple' ? 'bg-purple-600' : 'bg-gray-800'} text-white p-6`}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">{displayData.name}</h1>
                <div className="text-sm opacity-90 space-y-1">
                  <div>{displayData.email}</div>
                  <div>{displayData.phone}</div>
                  <div>{displayData.location}</div>
                  <div>{displayData.linkedin}</div>
                  <div>{displayData.portfolio}</div>
                </div>
              </div>

              {/* Skills in sidebar */}
              {(skills.length > 0 || !resumeData.personalInfo.fullName) && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3 border-b border-white/30 pb-2">Skills</h2>
                  <div className="space-y-2">
                    {skills.length > 0 ? skills.map((skill, index) => (
                      <div key={index} className="text-sm bg-white/20 px-2 py-1 rounded">{skill}</div>
                    )) : (
                      <>
                        <div className="text-sm bg-white/20 px-2 py-1 rounded">React.js</div>
                        <div className="text-sm bg-white/20 px-2 py-1 rounded">Node.js</div>
                        <div className="text-sm bg-white/20 px-2 py-1 rounded">JavaScript</div>
                        <div className="text-sm bg-white/20 px-2 py-1 rounded">Python</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Certifications in sidebar */}
              {(certifications.some(cert => cert.title) || !resumeData.personalInfo.fullName) && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3 border-b border-white/30 pb-2">Certifications</h2>
                  <div className="space-y-2 text-sm">
                    {certifications.some(cert => cert.title) ? 
                      certifications.filter(cert => cert.title).map((cert, index) => (
                        <div key={cert.id}>
                          <div className="font-medium">{cert.title}</div>
                          <div className="opacity-80">{cert.issuer} • {cert.date}</div>
                        </div>
                      )) : (
                        <>
                          <div>
                            <div className="font-medium">AWS Certified Developer</div>
                            <div className="opacity-80">Amazon • 2024</div>
                          </div>
                          <div>
                            <div className="font-medium">React Professional</div>
                            <div className="opacity-80">Meta • 2023</div>
                          </div>
                        </>
                      )
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Right Content */}
            <div className="w-2/3 p-8">
              {/* Summary */}
              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-3 ${colorClass}`}>Professional Summary</h2>
                <p className="text-gray-700 leading-relaxed">{displayData.summary}</p>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-4 ${colorClass}`}>Experience</h2>
                {experiences.some(exp => exp.title) ? 
                  experiences.filter(exp => exp.title).map((exp) => (
                    <div key={exp.id} className="mb-4">
                      <div className="font-bold text-lg">{exp.title}</div>
                      <div className="text-gray-600 italic mb-2">{exp.company} • {exp.duration}</div>
                      <p className="text-gray-700 text-sm">{exp.description}</p>
                    </div>
                  )) : (
                    <div className="mb-4">
                      <div className="font-bold text-lg">Senior Software Developer</div>
                      <div className="text-gray-600 italic mb-2">Tech Solutions Inc. • 2022 - Present</div>
                      <p className="text-gray-700 text-sm">Led development of scalable web applications using React and Node.js, improving performance by 40% and user engagement by 25%.</p>
                    </div>
                  )
                }
              </div>

              {/* Projects */}
              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-4 ${colorClass}`}>Projects</h2>
                {projects.some(proj => proj.title) ? 
                  projects.filter(proj => proj.title).map((proj) => (
                    <div key={proj.id} className="mb-4">
                      <div className="font-bold">{proj.title}</div>
                      <div className="text-sm text-gray-600 mb-1">{proj.technologies} • {proj.duration}</div>
                      <p className="text-gray-700 text-sm">{proj.description}</p>
                    </div>
                  )) : (
                    <div className="mb-4">
                      <div className="font-bold">E-commerce Platform</div>
                      <div className="text-sm text-gray-600 mb-1">React, Node.js, MongoDB • 3 months</div>
                      <p className="text-gray-700 text-sm">Built a full-stack e-commerce platform with user authentication, payment integration, and admin dashboard.</p>
                    </div>
                  )
                }
              </div>

              {/* Education */}
              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-4 ${colorClass}`}>Education</h2>
                {education.some(edu => edu.degree) ? 
                  education.filter(edu => edu.degree).map((edu) => (
                    <div key={edu.id} className="mb-3">
                      <div className="font-bold">{edu.degree}</div>
                      <div className="text-gray-600 italic">{edu.institution} • {edu.year} • {edu.grade}</div>
                    </div>
                  )) : (
                    <div className="mb-3">
                      <div className="font-bold">Bachelor of Computer Science</div>
                      <div className="text-gray-600 italic">University of Technology • 2020-2024 • 3.8 GPA</div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default single-column layout for other templates
    const headerAlignment = template?.layout === "center-header" ? "text-center" : 
                           template?.layout === "right-header" ? "text-right" : "text-left";

    return (
      <div className="resume-container bg-white p-8 shadow-lg" ref={previewRef}>
        {/* Header */}
        <div className={`header mb-8 pb-6 border-b-2 border-gray-300 ${headerAlignment}`}>
          <h1 className={`name text-3xl font-bold mb-3 ${colorClass}`}>
            {displayData.name}
          </h1>
          <div className="contact-info text-sm text-gray-600 space-y-1">
            <div>{displayData.email}</div>
            <div>{displayData.phone}</div>
            <div>{displayData.location}</div>
            <div>{displayData.linkedin}</div>
            <div>{displayData.portfolio}</div>
          </div>
        </div>

        {/* Summary */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{displayData.summary}</p>
        </div>

        {/* Experience */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Work Experience
          </h2>
          {experiences.some(exp => exp.title) ? 
            experiences.filter(exp => exp.title).map((exp) => (
              <div key={exp.id} className="experience-item mb-4">
                <div className="item-title font-bold text-base">{exp.title}</div>
                <div className="item-subtitle text-gray-600 italic mb-2">
                  {exp.company} {exp.duration && `• ${exp.duration}`}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
              </div>
            )) : (
              <div className="experience-item mb-4">
                <div className="item-title font-bold text-base">Senior Software Developer</div>
                <div className="item-subtitle text-gray-600 italic mb-2">
                  Tech Solutions Inc. • 2022 - Present
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">Led development of scalable web applications using React and Node.js, improving performance by 40% and user engagement by 25%.</p>
              </div>
            )
          }
        </div>

        {/* Projects */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Projects
          </h2>
          {projects.some(proj => proj.title) ? 
            projects.filter(proj => proj.title).map((proj) => (
              <div key={proj.id} className="project-item mb-4">
                <div className="item-title font-bold text-base">{proj.title}</div>
                <div className="item-subtitle text-gray-600 italic mb-2">
                  {proj.technologies} {proj.duration && `• ${proj.duration}`}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{proj.description}</p>
                {proj.link && (
                  <div className="text-blue-600 text-sm mt-1">🔗 {proj.link}</div>
                )}
              </div>
            )) : (
              <>
                <div className="project-item mb-4">
                  <div className="item-title font-bold text-base">E-commerce Platform</div>
                  <div className="item-subtitle text-gray-600 italic mb-2">
                    React, Node.js, MongoDB • 3 months
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">Built a full-stack e-commerce platform with user authentication, payment integration, and admin dashboard.</p>
                </div>
                <div className="project-item mb-4">
                  <div className="item-title font-bold text-base">Task Management App</div>
                  <div className="item-subtitle text-gray-600 italic mb-2">
                    React Native, Firebase • 2 months
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">Developed a cross-platform mobile app for task management with real-time synchronization and offline support.</p>
                </div>
              </>
            )
          }
        </div>

        {/* Education */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Education
          </h2>
          {education.some(edu => edu.degree) ? 
            education.filter(edu => edu.degree).map((edu) => (
              <div key={edu.id} className="education-item mb-4">
                <div className="item-title font-bold text-base">{edu.degree}</div>
                <div className="item-subtitle text-gray-600 italic mb-2">
                  {edu.institution} {edu.year && `• ${edu.year}`} {edu.grade && `• ${edu.grade}`}
                </div>
              </div>
            )) : (
              <div className="education-item mb-4">
                <div className="item-title font-bold text-base">Bachelor of Computer Science</div>
                <div className="item-subtitle text-gray-600 italic mb-2">
                  University of Technology • 2020-2024 • 3.8 GPA
                </div>
              </div>
            )
          }
        </div>

        {/* Certifications & Achievements */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Certifications & Achievements
          </h2>
          {certifications.some(cert => cert.title) ? 
            certifications.filter(cert => cert.title).map((cert) => (
              <div key={cert.id} className="certification-item mb-3">
                <div className="item-title font-bold text-base">{cert.title}</div>
                <div className="item-subtitle text-gray-600 italic mb-1">
                  {cert.issuer} {cert.date && `• ${cert.date}`}
                </div>
                {cert.description && (
                  <p className="text-gray-700 text-sm">{cert.description}</p>
                )}
                {cert.link && (
                  <div className="text-blue-600 text-sm mt-1">🔗 {cert.link}</div>
                )}
              </div>
            )) : (
              <>
                <div className="certification-item mb-3">
                  <div className="item-title font-bold text-base">AWS Certified Developer Associate</div>
                  <div className="item-subtitle text-gray-600 italic mb-1">
                    Amazon Web Services • 2024
                  </div>
                </div>
                <div className="certification-item mb-3">
                  <div className="item-title font-bold text-base">React Professional Certificate</div>
                  <div className="item-subtitle text-gray-600 italic mb-1">
                    Meta • 2023
                  </div>
                </div>
              </>
            )
          }
        </div>

        {/* Skills */}
        <div className="section mb-6">
          <h2 className={`section-title text-lg font-bold mb-4 ${colorClass} border-b border-gray-300 pb-2`}>
            Skills & Technologies
          </h2>
          <div className="skills flex flex-wrap gap-2">
            {skills.length > 0 ? skills.map((skill, index) => (
              <span key={index} className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">
                {skill}
              </span>
            )) : (
              <>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">JavaScript</span>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">React.js</span>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">Node.js</span>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">Python</span>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">MongoDB</span>
                <span className="skill-tag bg-gray-100 px-3 py-1 rounded text-sm border border-gray-300">AWS</span>
              </>
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
              Resume Builder
            </h1>
            <p className="text-muted-foreground">
              Create a professional resume that stands out to employers
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Resume Form */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="w-5 h-5" />
                        Choose Resume Template
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {templates.map((template) => (
                          <Card 
                            key={template.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              resumeData.template === template.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setResumeData({ ...resumeData, template: template.id })}
                          >
                            <CardContent className="p-4">
                              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                                <div className={`text-6xl ${
                                  template.color === 'blue' ? 'text-blue-500' :
                                  template.color === 'purple' ? 'text-purple-500' :
                                  template.color === 'green' ? 'text-green-500' : 'text-gray-500'
                                }`}>
                                  <FileText />
                                </div>
                              </div>
                              <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={resumeData.template === template.id ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {resumeData.template === template.id ? "Selected" : "Select"}
                                </Badge>
                                <div className={`w-4 h-4 rounded-full ${
                                  template.color === 'blue' ? 'bg-blue-500' :
                                  template.color === 'purple' ? 'bg-purple-500' :
                                  template.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                                }`} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2">Template Features:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Professional formatting optimized for ATS systems</li>
                          <li>• Print-ready PDF generation</li>
                          <li>• Mobile-responsive design</li>
                          <li>• Customizable color schemes</li>
                          <li>• Live preview with real-time updates</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

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
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName" 
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, fullName: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input 
                            id="location" 
                            value={resumeData.personalInfo.location}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="linkedin">LinkedIn Profile</Label>
                          <Input 
                            id="linkedin" 
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="portfolio">Portfolio Website</Label>
                          <Input 
                            id="portfolio" 
                            placeholder="https://yourportfolio.com"
                            value={resumeData.personalInfo.portfolio}
                            onChange={(e) => setResumeData({
                              ...resumeData,
                              personalInfo: { ...resumeData.personalInfo, portfolio: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Write a compelling professional summary that highlights your key skills and achievements..."
                        value={resumeData.summary}
                        onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                        className="min-h-32"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Tip: Keep it concise (2-3 sentences) and focus on your most relevant qualifications.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          Work Experience
                        </span>
                        <Button onClick={addExperience} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Experience
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {experiences.map((exp, index) => (
                        <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">Experience {index + 1}</h4>
                            {experiences.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeExperience(exp.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Job Title</Label>
                              <Input 
                                placeholder="e.g., Software Developer"
                                value={exp.title}
                                onChange={(e) => {
                                  const updated = experiences.map(item => 
                                    item.id === exp.id ? { ...item, title: e.target.value } : item
                                  );
                                  setExperiences(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Company</Label>
                              <Input 
                                placeholder="e.g., Tech Solutions Inc."
                                value={exp.company}
                                onChange={(e) => {
                                  const updated = experiences.map(item => 
                                    item.id === exp.id ? { ...item, company: e.target.value } : item
                                  );
                                  setExperiences(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <Input 
                              placeholder="e.g., Jan 2022 - Present"
                              value={exp.duration}
                              onChange={(e) => {
                                const updated = experiences.map(item => 
                                  item.id === exp.id ? { ...item, duration: e.target.value } : item
                                );
                                setExperiences(updated);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea 
                              placeholder="Describe your key responsibilities and achievements..."
                              value={exp.description}
                              onChange={(e) => {
                                const updated = experiences.map(item => 
                                  item.id === exp.id ? { ...item, description: e.target.value } : item
                                );
                                setExperiences(updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Code className="w-5 h-5" />
                          Projects
                        </span>
                        <Button onClick={addProject} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {projects.map((project, index) => (
                        <div key={project.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">Project {index + 1}</h4>
                            {projects.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeProject(project.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Project Title</Label>
                              <Input 
                                placeholder="e.g., E-commerce Platform"
                                value={project.title}
                                onChange={(e) => {
                                  const updated = projects.map(item => 
                                    item.id === project.id ? { ...item, title: e.target.value } : item
                                  );
                                  setProjects(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <Input 
                                placeholder="e.g., 3 months"
                                value={project.duration}
                                onChange={(e) => {
                                  const updated = projects.map(item => 
                                    item.id === project.id ? { ...item, duration: e.target.value } : item
                                  );
                                  setProjects(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Technologies Used</Label>
                              <Input 
                                placeholder="e.g., React, Node.js, MongoDB"
                                value={project.technologies}
                                onChange={(e) => {
                                  const updated = projects.map(item => 
                                    item.id === project.id ? { ...item, technologies: e.target.value } : item
                                  );
                                  setProjects(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Project Link (Optional)</Label>
                              <Input 
                                placeholder="e.g., github.com/username/project"
                                value={project.link}
                                onChange={(e) => {
                                  const updated = projects.map(item => 
                                    item.id === project.id ? { ...item, link: e.target.value } : item
                                  );
                                  setProjects(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Project Description</Label>
                            <Textarea 
                              placeholder="Describe the project, your role, and key achievements..."
                              value={project.description}
                              onChange={(e) => {
                                const updated = projects.map(item => 
                                  item.id === project.id ? { ...item, description: e.target.value } : item
                                );
                                setProjects(updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          Education
                        </span>
                        <Button onClick={addEducation} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Education
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {education.map((edu, index) => (
                        <div key={edu.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">Education {index + 1}</h4>
                            {education.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeEducation(edu.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Degree</Label>
                              <Input 
                                placeholder="e.g., Bachelor of Computer Science"
                                value={edu.degree}
                                onChange={(e) => {
                                  const updated = education.map(item => 
                                    item.id === edu.id ? { ...item, degree: e.target.value } : item
                                  );
                                  setEducation(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Institution</Label>
                              <Input 
                                placeholder="e.g., University of Delhi"
                                value={edu.institution}
                                onChange={(e) => {
                                  const updated = education.map(item => 
                                    item.id === edu.id ? { ...item, institution: e.target.value } : item
                                  );
                                  setEducation(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Year</Label>
                              <Input 
                                placeholder="e.g., 2020-2024"
                                value={edu.year}
                                onChange={(e) => {
                                  const updated = education.map(item => 
                                    item.id === edu.id ? { ...item, year: e.target.value } : item
                                  );
                                  setEducation(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Grade/CGPA</Label>
                              <Input 
                                placeholder="e.g., 8.5 CGPA"
                                value={edu.grade}
                                onChange={(e) => {
                                  const updated = education.map(item => 
                                    item.id === edu.id ? { ...item, grade: e.target.value } : item
                                  );
                                  setEducation(updated);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Certifications & Achievements
                        </span>
                        <Button onClick={addCertification} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Certification
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {certifications.map((cert, index) => (
                        <div key={cert.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">Certification {index + 1}</h4>
                            {certifications.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeCertification(cert.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Certification Title</Label>
                              <Input 
                                placeholder="e.g., AWS Certified Developer"
                                value={cert.title}
                                onChange={(e) => {
                                  const updated = certifications.map(item => 
                                    item.id === cert.id ? { ...item, title: e.target.value } : item
                                  );
                                  setCertifications(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Issuing Organization</Label>
                              <Input 
                                placeholder="e.g., Amazon Web Services"
                                value={cert.issuer}
                                onChange={(e) => {
                                  const updated = certifications.map(item => 
                                    item.id === cert.id ? { ...item, issuer: e.target.value } : item
                                  );
                                  setCertifications(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Date Obtained</Label>
                              <Input 
                                placeholder="e.g., March 2024"
                                value={cert.date}
                                onChange={(e) => {
                                  const updated = certifications.map(item => 
                                    item.id === cert.id ? { ...item, date: e.target.value } : item
                                  );
                                  setCertifications(updated);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Credential Link (Optional)</Label>
                              <Input 
                                placeholder="e.g., credly.com/badges/..."
                                value={cert.link}
                                onChange={(e) => {
                                  const updated = certifications.map(item => 
                                    item.id === cert.id ? { ...item, link: e.target.value } : item
                                  );
                                  setCertifications(updated);
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Description (Optional)</Label>
                            <Textarea 
                              placeholder="Brief description of the certification or achievement..."
                              value={cert.description}
                              onChange={(e) => {
                                const updated = certifications.map(item => 
                                  item.id === cert.id ? { ...item, description: e.target.value } : item
                                );
                                setCertifications(updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Skills & Technologies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)}>
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill (e.g., React, Python, Communication)"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addSkill()}
                        />
                        <Button onClick={addSkill}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add both technical skills (programming languages, tools) and soft skills (communication, leadership).
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview & Actions */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Selected Template</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Palette className={`w-4 h-4 ${
                          templates.find(t => t.id === resumeData.template)?.color === 'blue' ? 'text-blue-500' :
                          templates.find(t => t.id === resumeData.template)?.color === 'purple' ? 'text-purple-500' :
                          templates.find(t => t.id === resumeData.template)?.color === 'green' ? 'text-green-500' : 'text-gray-500'
                        }`} />
                        <span className="font-medium">
                          {templates.find(t => t.id === resumeData.template)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={previewResume} variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Live Preview
                    </Button>
                    <Button onClick={saveResume} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Resume
                    </Button>
                    <Button onClick={downloadResume} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Resume Completion</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Personal Info</span>
                        <span className={resumeData.personalInfo.fullName && resumeData.personalInfo.email ? 'text-green-600' : 'text-orange-600'}>
                          {resumeData.personalInfo.fullName && resumeData.personalInfo.email ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Summary</span>
                        <span className={resumeData.summary ? 'text-green-600' : 'text-orange-600'}>
                          {resumeData.summary ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Experience</span>
                        <span className={experiences.some(exp => exp.title && exp.company) ? 'text-green-600' : 'text-orange-600'}>
                          {experiences.some(exp => exp.title && exp.company) ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Projects</span>
                        <span className={projects.some(proj => proj.title && proj.description) ? 'text-green-600' : 'text-orange-600'}>
                          {projects.some(proj => proj.title && proj.description) ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Education</span>
                        <span className={education.some(edu => edu.degree && edu.institution) ? 'text-green-600' : 'text-orange-600'}>
                          {education.some(edu => edu.degree && edu.institution) ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Certifications</span>
                        <span className={certifications.some(cert => cert.title && cert.issuer) ? 'text-green-600' : 'text-orange-600'}>
                          {certifications.some(cert => cert.title && cert.issuer) ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Skills</span>
                        <span className={skills.length > 0 ? 'text-green-600' : 'text-orange-600'}>
                          {skills.length > 0 ? '✓' : '○'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Resume Tips</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Keep it to 1-2 pages maximum</li>
                      <li>• Use action verbs and quantify achievements</li>
                      <li>• Tailor your resume for each job application</li>
                      <li>• Use consistent formatting throughout</li>
                      <li>• Proofread for spelling and grammar errors</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Live Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Resume Preview - {templates.find(t => t.id === resumeData.template)?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {generateResumePreview()}
          </div>
          
          <div className="flex gap-4 justify-center mt-6 pt-4 border-t">
            <Button onClick={downloadResume} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print/Download PDF
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeBuilder;