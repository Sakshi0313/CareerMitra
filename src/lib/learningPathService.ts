import { realtimeDataService, type ATSAnalysis } from './realtimeDataService';

export interface LearningResource {
  id: string;
  skill: string;
  title: string;
  provider: string;
  url: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'paid';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'course' | 'tutorial' | 'documentation' | 'practice';
  estimatedHours: number;
  prerequisites?: string[];
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  provider: string;
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'paid';
  estimatedStudyHours: number;
  validityPeriod?: string;
  prerequisites?: string[];
  skills: string[];
}

export interface LearningPath {
  id: string;
  userId: string;
  targetRole: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  missingSkills: string[];
  recommendedSkills: string[];
  learningResources: LearningResource[];
  certifications: Certification[];
  milestones: {
    id: string;
    name: string;
    description: string;
    skills: string[];
    completed: boolean;
    completedAt?: Date;
    estimatedWeeks: number;
  }[];
  overallProgress: number;
  estimatedCompletionWeeks: number;
  lastUpdated: Date;
}

class LearningPathService {
  // Comprehensive skill-to-resources mapping
  private skillResources: { [key: string]: LearningResource[] } = {
    "JavaScript": [
      {
        id: "js-fundamentals",
        skill: "JavaScript",
        title: "JavaScript Fundamentals Complete Course",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        duration: "300 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "critical",
        type: "course",
        estimatedHours: 40,
        description: "Learn JavaScript from scratch with hands-on projects"
      },
      {
        id: "js-modern",
        skill: "JavaScript",
        title: "Modern JavaScript ES6+ Complete Guide",
        provider: "Udemy",
        url: "https://www.udemy.com/course/the-complete-javascript-course/",
        duration: "69 hours",
        difficulty: "intermediate",
        cost: "paid",
        priority: "high",
        type: "course",
        estimatedHours: 69,
        prerequisites: ["Basic JavaScript"],
        description: "Master modern JavaScript features and best practices"
      },
      {
        id: "js-algorithms",
        skill: "JavaScript",
        title: "JavaScript Algorithms and Data Structures",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        duration: "300 hours",
        difficulty: "intermediate",
        cost: "free",
        priority: "medium",
        type: "practice",
        estimatedHours: 50,
        prerequisites: ["JavaScript Fundamentals"],
        description: "Practice coding challenges and algorithm problems"
      }
    ],
    "React": [
      {
        id: "react-basics",
        skill: "React",
        title: "React - The Complete Guide",
        provider: "Udemy",
        url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        duration: "48 hours",
        difficulty: "beginner",
        cost: "paid",
        priority: "critical",
        type: "course",
        estimatedHours: 48,
        prerequisites: ["JavaScript", "HTML", "CSS"],
        description: "Learn React from basics to advanced concepts"
      },
      {
        id: "react-hooks",
        skill: "React",
        title: "React Hooks Complete Guide",
        provider: "YouTube - Codevolution",
        url: "https://www.youtube.com/playlist?list=PLC3y8-rFHvwisvxhZ135pogtX7_Oe3Q3A",
        duration: "8 hours",
        difficulty: "intermediate",
        cost: "free",
        priority: "high",
        type: "tutorial",
        estimatedHours: 8,
        prerequisites: ["React Basics"],
        description: "Master React Hooks for modern React development"
      },
      {
        id: "react-projects",
        skill: "React",
        title: "Build 15 React Projects",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/news/build-15-react-projects-complete-course/",
        duration: "9 hours",
        difficulty: "intermediate",
        cost: "free",
        priority: "high",
        type: "practice",
        estimatedHours: 20,
        prerequisites: ["React Basics", "React Hooks"],
        description: "Build real-world React projects to strengthen your skills"
      }
    ],
    "Node.js": [
      {
        id: "nodejs-basics",
        skill: "Node.js",
        title: "Node.js Complete Course for Beginners",
        provider: "YouTube - Programming with Mosh",
        url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
        duration: "6 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "critical",
        type: "course",
        estimatedHours: 15,
        prerequisites: ["JavaScript"],
        description: "Learn Node.js fundamentals and build your first server"
      },
      {
        id: "nodejs-express",
        skill: "Node.js",
        title: "Node.js and Express.js Complete Course",
        provider: "Udemy",
        url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/",
        duration: "42 hours",
        difficulty: "intermediate",
        cost: "paid",
        priority: "high",
        type: "course",
        estimatedHours: 42,
        prerequisites: ["Node.js Basics"],
        description: "Build REST APIs and web applications with Node.js and Express"
      }
    ],
    "Python": [
      {
        id: "python-basics",
        skill: "Python",
        title: "Python for Everybody Specialization",
        provider: "Coursera - University of Michigan",
        url: "https://www.coursera.org/specializations/python",
        duration: "8 months",
        difficulty: "beginner",
        cost: "paid",
        priority: "critical",
        type: "course",
        estimatedHours: 120,
        description: "Complete Python programming specialization"
      },
      {
        id: "python-free",
        skill: "Python",
        title: "Python Complete Course",
        provider: "YouTube - Programming with Mosh",
        url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
        duration: "6 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "critical",
        type: "tutorial",
        estimatedHours: 15,
        description: "Learn Python programming from scratch"
      }
    ],
    "HTML": [
      {
        id: "html-basics",
        skill: "HTML",
        title: "HTML5 Complete Course",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/learn/responsive-web-design/",
        duration: "300 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "critical",
        type: "course",
        estimatedHours: 20,
        description: "Learn HTML5 and semantic markup"
      }
    ],
    "CSS": [
      {
        id: "css-basics",
        skill: "CSS",
        title: "CSS Complete Course",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/learn/responsive-web-design/",
        duration: "300 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "critical",
        type: "course",
        estimatedHours: 30,
        description: "Master CSS including Flexbox, Grid, and responsive design"
      }
    ],
    "Git": [
      {
        id: "git-basics",
        skill: "Git",
        title: "Git and GitHub Complete Course",
        provider: "YouTube - Kunal Kushwaha",
        url: "https://www.youtube.com/watch?v=apGV9Kg7ics",
        duration: "4 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "high",
        type: "tutorial",
        estimatedHours: 8,
        description: "Learn version control with Git and GitHub"
      }
    ],
    "SQL": [
      {
        id: "sql-basics",
        skill: "SQL",
        title: "SQL Complete Course",
        provider: "freeCodeCamp",
        url: "https://www.freecodecamp.org/learn/relational-database/",
        duration: "300 hours",
        difficulty: "beginner",
        cost: "free",
        priority: "high",
        type: "course",
        estimatedHours: 25,
        description: "Learn SQL and database management"
      }
    ],
    "TypeScript": [
      {
        id: "typescript-basics",
        skill: "TypeScript",
        title: "TypeScript Complete Course",
        provider: "YouTube - Hitesh Choudhary",
        url: "https://www.youtube.com/watch?v=30LWjhZzg50",
        duration: "4 hours",
        difficulty: "intermediate",
        cost: "free",
        priority: "medium",
        type: "tutorial",
        estimatedHours: 12,
        prerequisites: ["JavaScript"],
        description: "Learn TypeScript for type-safe JavaScript development"
      }
    ]
  };

  // Certification mappings
  private skillCertifications: { [key: string]: Certification[] } = {
    "JavaScript": [
      {
        id: "js-cert-meta",
        name: "Meta Frontend Developer Professional Certificate",
        provider: "Meta (Coursera)",
        url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        difficulty: "intermediate",
        cost: "paid",
        estimatedStudyHours: 200,
        validityPeriod: "Lifetime",
        skills: ["JavaScript", "React", "HTML", "CSS"],
        prerequisites: ["Basic programming knowledge"]
      }
    ],
    "React": [
      {
        id: "react-cert-meta",
        name: "Meta React Developer Certificate",
        provider: "Meta (Coursera)",
        url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        difficulty: "intermediate",
        cost: "paid",
        estimatedStudyHours: 150,
        validityPeriod: "Lifetime",
        skills: ["React", "JavaScript", "HTML", "CSS"],
        prerequisites: ["JavaScript", "HTML", "CSS"]
      }
    ],
    "Node.js": [
      {
        id: "nodejs-cert-openjs",
        name: "OpenJS Node.js Application Developer",
        provider: "OpenJS Foundation",
        url: "https://openjsf.org/certification/",
        difficulty: "advanced",
        cost: "paid",
        estimatedStudyHours: 100,
        validityPeriod: "3 years",
        skills: ["Node.js", "JavaScript", "Express.js"],
        prerequisites: ["Node.js experience", "JavaScript proficiency"]
      }
    ],
    "Python": [
      {
        id: "python-cert-pcap",
        name: "PCAP - Certified Associate in Python Programming",
        provider: "Python Institute",
        url: "https://pythoninstitute.org/pcap",
        difficulty: "intermediate",
        cost: "paid",
        estimatedStudyHours: 80,
        validityPeriod: "Lifetime",
        skills: ["Python", "Programming Fundamentals"],
        prerequisites: ["Basic Python knowledge"]
      }
    ]
  };

  // Generate learning path based on ATS analysis
  generateLearningPath(atsAnalysis: ATSAnalysis, targetRole: string): LearningPath {
    const missingSkills = this.extractMissingSkills(atsAnalysis, targetRole);
    const currentLevel = this.determineCurrentLevel(atsAnalysis);
    const learningResources = this.getRecommendedResources(missingSkills, currentLevel);
    const certifications = this.getRecommendedCertifications(missingSkills);
    const milestones = this.generateMilestones(missingSkills, targetRole);

    return {
      id: `${atsAnalysis.userId}_${targetRole.toLowerCase().replace(/\s+/g, '_')}`,
      userId: atsAnalysis.userId,
      targetRole,
      currentLevel,
      missingSkills,
      recommendedSkills: atsAnalysis.keywordsFound,
      learningResources,
      certifications,
      milestones,
      overallProgress: 0,
      estimatedCompletionWeeks: this.calculateEstimatedWeeks(learningResources),
      lastUpdated: new Date()
    };
  }

  // Extract missing skills from ATS analysis
  private extractMissingSkills(atsAnalysis: ATSAnalysis, targetRole: string): string[] {
    // This would typically come from the ATS analysis
    // For now, we'll use the missing keywords
    return atsAnalysis.missingKeywords || [];
  }

  // Determine current skill level based on ATS analysis
  private determineCurrentLevel(atsAnalysis: ATSAnalysis): 'beginner' | 'intermediate' | 'advanced' {
    const score = atsAnalysis.overallScore;
    if (score >= 80) return 'advanced';
    if (score >= 50) return 'intermediate';
    return 'beginner';
  }

  // Get recommended learning resources for missing skills
  private getRecommendedResources(missingSkills: string[], currentLevel: string): LearningResource[] {
    const resources: LearningResource[] = [];
    
    missingSkills.forEach(skill => {
      const skillResources = this.skillResources[skill] || [];
      
      // Filter resources based on current level and add them
      const filteredResources = skillResources.filter(resource => {
        if (currentLevel === 'beginner') return resource.difficulty === 'beginner';
        if (currentLevel === 'intermediate') return ['beginner', 'intermediate'].includes(resource.difficulty);
        return true; // Advanced users can access all levels
      });
      
      resources.push(...filteredResources);
    });

    // Sort by priority and difficulty
    return resources.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }

  // Get recommended certifications
  private getRecommendedCertifications(missingSkills: string[]): Certification[] {
    const certifications: Certification[] = [];
    
    missingSkills.forEach(skill => {
      const skillCerts = this.skillCertifications[skill] || [];
      certifications.push(...skillCerts);
    });
    
    return certifications;
  }

  // Generate learning milestones
  private generateMilestones(missingSkills: string[], targetRole: string): LearningPath['milestones'] {
    const milestones: LearningPath['milestones'] = [];
    
    // Group skills into logical milestones
    if (missingSkills.includes('HTML') || missingSkills.includes('CSS')) {
      milestones.push({
        id: 'web-fundamentals',
        name: 'Web Development Fundamentals',
        description: 'Master HTML and CSS basics',
        skills: ['HTML', 'CSS'],
        completed: false,
        estimatedWeeks: 2
      });
    }
    
    if (missingSkills.includes('JavaScript')) {
      milestones.push({
        id: 'javascript-mastery',
        name: 'JavaScript Proficiency',
        description: 'Become proficient in JavaScript programming',
        skills: ['JavaScript'],
        completed: false,
        estimatedWeeks: 4
      });
    }
    
    if (missingSkills.includes('React')) {
      milestones.push({
        id: 'react-development',
        name: 'React Development',
        description: 'Build modern web applications with React',
        skills: ['React'],
        completed: false,
        estimatedWeeks: 3
      });
    }
    
    if (missingSkills.includes('Node.js')) {
      milestones.push({
        id: 'backend-development',
        name: 'Backend Development',
        description: 'Create server-side applications with Node.js',
        skills: ['Node.js'],
        completed: false,
        estimatedWeeks: 3
      });
    }
    
    // Add final milestone
    milestones.push({
      id: 'role-readiness',
      name: `${targetRole} Readiness`,
      description: `Complete preparation for ${targetRole} role`,
      skills: missingSkills,
      completed: false,
      estimatedWeeks: 2
    });
    
    return milestones;
  }

  // Calculate estimated completion time
  private calculateEstimatedWeeks(resources: LearningResource[]): number {
    const totalHours = resources.reduce((sum, resource) => sum + resource.estimatedHours, 0);
    // Assuming 10 hours of study per week
    return Math.ceil(totalHours / 10);
  }

  // Save learning path to Firebase
  async saveLearningPath(learningPath: LearningPath): Promise<void> {
    try {
      await realtimeDataService.updateRoadmapProgress(learningPath.userId, {
        currentLevel: learningPath.currentLevel,
        targetRole: learningPath.targetRole,
        completedSkills: [],
        inProgressSkills: learningPath.missingSkills,
        recommendedSkills: learningPath.recommendedSkills,
        milestones: learningPath.milestones.map(m => ({
          name: m.name,
          completed: m.completed,
          completedAt: m.completedAt
        })),
        overallProgress: learningPath.overallProgress
      });
    } catch (error) {
      console.error('Error saving learning path:', error);
      throw error;
    }
  }

  // Get learning resources for a specific skill
  getSkillResources(skill: string): LearningResource[] {
    return this.skillResources[skill] || [];
  }

  // Get certifications for a specific skill
  getSkillCertifications(skill: string): Certification[] {
    return this.skillCertifications[skill] || [];
  }

  // Update learning progress
  async updateLearningProgress(
    userId: string, 
    resourceId: string, 
    status: 'not_started' | 'in_progress' | 'completed'
  ): Promise<void> {
    try {
      // This would update the progress in Firebase
      // Implementation depends on your data structure
      console.log(`Updating progress for user ${userId}, resource ${resourceId} to ${status}`);
    } catch (error) {
      console.error('Error updating learning progress:', error);
      throw error;
    }
  }
}

export const learningPathService = new LearningPathService();