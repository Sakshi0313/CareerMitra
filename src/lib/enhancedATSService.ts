import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface RoleRequirement {
  role: string;
  level: 'junior' | 'mid' | 'senior';
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number;
  description: string;
  salaryRange?: { min: number; max: number };
  jobCategories: string[];
}

export interface ExtractedSkills {
  technical: string[];
  softSkills: string[];
  tools: string[];
  languages: string[];
  certifications: string[];
  experience: {
    yearsTotal: number;
    companies: string[];
    roles: string[];
  };
}

export interface RoleMatch {
  role: string;
  score: number;
  matchedRequired: string[];
  matchedPreferred: string[];
  missingRequired: string[];
  missingPreferred: string[];
  suitability: 'excellent' | 'good' | 'moderate' | 'fair' | 'poor';
}

export interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  careerPath: string;
  estimatedLevel: 'junior' | 'mid' | 'senior';
  topSkillGaps: string[];
}

export interface LearningResource {
  skill: string;
  courses: {
    title: string;
    platform: string;
    duration: string;
    difficulty: string;
    url: string;
    cost: 'free' | 'paid' | 'variable';
  }[];
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface EnhancedATSResult {
  resumeText: string;
  extractedSkills: ExtractedSkills;
  roleMatches: RoleMatch[];
  bestMatches: RoleMatch[];
  aiAnalysis: AIAnalysis;
  learningPath: LearningResource[];
  overallScore: number;
  timestamp: Date;
}

// Predefined roles with comprehensive requirements
const PREDEFINED_ROLES: RoleRequirement[] = [
  {
    role: 'Frontend Developer',
    level: 'mid',
    requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    preferredSkills: ['TypeScript', 'Redux', 'Jest', 'Next.js', 'Tailwind CSS'],
    experienceYears: 2,
    description: 'Build and maintain user-facing web applications',
    jobCategories: ['Web Development', 'Frontend'],
    salaryRange: { min: 80000, max: 130000 }
  },
  {
    role: 'Backend Developer',
    level: 'mid',
    requiredSkills: ['Node.js', 'SQL', 'REST API', 'Database Design', 'Git'],
    preferredSkills: ['Python', 'MongoDB', 'Docker', 'Kubernetes', 'GraphQL'],
    experienceYears: 2,
    description: 'Design and implement server-side logic and databases',
    jobCategories: ['Backend', 'Server Development'],
    salaryRange: { min: 85000, max: 140000 }
  },
  {
    role: 'Full Stack Developer',
    level: 'mid',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
    preferredSkills: ['TypeScript', 'Docker', 'AWS', 'MongoDB', 'GraphQL'],
    experienceYears: 3,
    description: 'Build complete web applications from frontend to backend',
    jobCategories: ['Full Stack', 'Web Development'],
    salaryRange: { min: 90000, max: 150000 }
  },
  {
    role: 'DevOps Engineer',
    level: 'mid',
    requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS'],
    preferredSkills: ['Terraform', 'Jenkins', 'Prometheus', 'ELK Stack', 'Python'],
    experienceYears: 2,
    description: 'Manage infrastructure, deployment, and system reliability',
    jobCategories: ['DevOps', 'Infrastructure'],
    salaryRange: { min: 95000, max: 160000 }
  },
  {
    role: 'Cloud Architect',
    level: 'senior',
    requiredSkills: ['AWS', 'Azure', 'Cloud Design', 'Security', 'Database Architecture'],
    preferredSkills: ['GCP', 'Terraform', 'Kubernetes', 'Cost Optimization', 'Enterprise Design'],
    experienceYears: 5,
    description: 'Design scalable cloud solutions and architecture',
    jobCategories: ['Cloud', 'Architecture', 'Enterprise'],
    salaryRange: { min: 120000, max: 200000 }
  },
  {
    role: 'Data Engineer',
    level: 'mid',
    requiredSkills: ['Python', 'SQL', 'ETL', 'Big Data', 'Data Warehousing'],
    preferredSkills: ['Apache Spark', 'Hadoop', 'Kafka', 'AWS', 'Machine Learning'],
    experienceYears: 2,
    description: 'Build data pipelines and infrastructure for data analytics',
    jobCategories: ['Data', 'Analytics'],
    salaryRange: { min: 90000, max: 150000 }
  },
  {
    role: 'Machine Learning Engineer',
    level: 'senior',
    requiredSkills: ['Python', 'ML Frameworks', 'Statistics', 'Deep Learning', 'Data Science'],
    preferredSkills: ['TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'MLOps'],
    experienceYears: 3,
    description: 'Develop machine learning models and systems',
    jobCategories: ['ML', 'AI', 'Data Science'],
    salaryRange: { min: 100000, max: 180000 }
  },
  {
    role: 'QA Engineer',
    level: 'mid',
    requiredSkills: ['Testing', 'Automation', 'Selenium', 'Bug Tracking', 'SQL'],
    preferredSkills: ['Python', 'Jest', 'Performance Testing', 'CI/CD', 'Mobile Testing'],
    experienceYears: 2,
    description: 'Ensure software quality through testing and automation',
    jobCategories: ['QA', 'Testing'],
    salaryRange: { min: 70000, max: 120000 }
  },
  {
    role: 'Solution Architect',
    level: 'senior',
    requiredSkills: ['System Design', 'Enterprise Solutions', 'Cloud', 'Security', 'Technical Leadership'],
    preferredSkills: ['AWS', 'Kubernetes', 'Microservices', 'Domain Expertise', 'Agile'],
    experienceYears: 5,
    description: 'Design comprehensive technical solutions for enterprise clients',
    jobCategories: ['Architecture', 'Enterprise', 'Consulting'],
    salaryRange: { min: 120000, max: 200000 }
  },
  {
    role: 'Security Engineer',
    level: 'senior',
    requiredSkills: ['Cybersecurity', 'Network Security', 'Penetration Testing', 'Compliance', 'Encryption'],
    preferredSkills: ['AWS Security', 'Security Automation', 'Incident Response', 'SIEM', 'Threat Analysis'],
    experienceYears: 3,
    description: 'Protect systems and data from security threats',
    jobCategories: ['Security', 'Compliance'],
    salaryRange: { min: 100000, max: 180000 }
  },
];

class EnhancedATSService {
  // Enhanced skill extraction with better keyword matching and context awareness
  async extractSkills(resumeText: string): Promise<ExtractedSkills> {
    const skills: ExtractedSkills = {
      technical: [],
      softSkills: [],
      tools: [],
      languages: [],
      certifications: [],
      experience: {
        yearsTotal: 0,
        companies: [],
        roles: []
      }
    };

    const text = resumeText.toLowerCase();
    const originalText = resumeText;

    // Enhanced Technical Skills with better matching
    const technicalSkillsMap = {
      // Programming Languages
      'JavaScript': ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020', 'vanilla js'],
      'TypeScript': ['typescript', 'ts'],
      'Python': ['python', 'py', 'python3'],
      'Java': ['java', 'openjdk', 'oracle java'],
      'C++': ['c++', 'cpp', 'c plus plus'],
      'C#': ['c#', 'csharp', 'c sharp', '.net'],
      'Go': ['go', 'golang'],
      'Rust': ['rust'],
      'PHP': ['php'],
      'Ruby': ['ruby'],
      'Kotlin': ['kotlin'],
      'Swift': ['swift'],
      'Dart': ['dart'],
      'Scala': ['scala'],
      
      // Frontend Frameworks
      'React': ['react', 'reactjs', 'react.js'],
      'Angular': ['angular', 'angularjs', 'angular2', 'angular 2+'],
      'Vue.js': ['vue', 'vue.js', 'vuejs'],
      'Svelte': ['svelte'],
      'Next.js': ['next.js', 'nextjs', 'next'],
      'Nuxt.js': ['nuxt.js', 'nuxtjs', 'nuxt'],
      
      // Backend Frameworks
      'Node.js': ['node.js', 'nodejs', 'node'],
      'Express.js': ['express', 'express.js', 'expressjs'],
      'Django': ['django'],
      'Flask': ['flask'],
      'FastAPI': ['fastapi', 'fast api'],
      'Spring Boot': ['spring boot', 'springboot'],
      'Spring': ['spring framework', 'spring'],
      'Rails': ['ruby on rails', 'rails'],
      'Laravel': ['laravel'],
      'ASP.NET': ['asp.net', 'aspnet'],
      
      // Databases
      'SQL': ['sql', 'structured query language'],
      'MySQL': ['mysql'],
      'PostgreSQL': ['postgresql', 'postgres'],
      'MongoDB': ['mongodb', 'mongo'],
      'Redis': ['redis'],
      'Elasticsearch': ['elasticsearch', 'elastic search'],
      'Oracle': ['oracle database', 'oracle db'],
      'SQLite': ['sqlite'],
      'DynamoDB': ['dynamodb', 'dynamo db'],
      'Cassandra': ['cassandra'],
      
      // Cloud Platforms
      'AWS': ['aws', 'amazon web services'],
      'Azure': ['azure', 'microsoft azure'],
      'Google Cloud': ['gcp', 'google cloud platform', 'google cloud'],
      'Heroku': ['heroku'],
      'DigitalOcean': ['digitalocean', 'digital ocean'],
      
      // DevOps & Tools
      'Docker': ['docker', 'containerization'],
      'Kubernetes': ['kubernetes', 'k8s'],
      'Terraform': ['terraform'],
      'Jenkins': ['jenkins'],
      'Git': ['git', 'version control'],
      'GitHub': ['github'],
      'GitLab': ['gitlab'],
      'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment'],
      
      // Web Technologies
      'HTML': ['html', 'html5'],
      'CSS': ['css', 'css3'],
      'Sass': ['sass', 'scss'],
      'Tailwind CSS': ['tailwind', 'tailwindcss'],
      'Bootstrap': ['bootstrap'],
      
      // Testing
      'Jest': ['jest'],
      'Selenium': ['selenium'],
      'Cypress': ['cypress'],
      'Pytest': ['pytest'],
      'JUnit': ['junit'],
      
      // APIs
      'REST API': ['rest api', 'restful api', 'rest'],
      'GraphQL': ['graphql'],
      'SOAP': ['soap'],
      
      // Machine Learning
      'Machine Learning': ['machine learning', 'ml'],
      'Deep Learning': ['deep learning', 'dl'],
      'TensorFlow': ['tensorflow'],
      'PyTorch': ['pytorch'],
      'Scikit-learn': ['scikit-learn', 'sklearn'],
      'Computer Vision': ['computer vision', 'cv'],
      'NLP': ['nlp', 'natural language processing'],
      
      // Mobile Development
      'React Native': ['react native'],
      'Flutter': ['flutter'],
      'iOS Development': ['ios development', 'ios'],
      'Android Development': ['android development', 'android'],
      
      // Other Technologies
      'Microservices': ['microservices', 'micro services'],
      'Serverless': ['serverless', 'lambda functions'],
      'Blockchain': ['blockchain', 'web3'],
      'WebSockets': ['websockets', 'socket.io'],
      'Redis': ['redis', 'caching'],
      'Nginx': ['nginx'],
      'Apache': ['apache'],
      'Linux': ['linux', 'ubuntu', 'centos'],
      'Bash': ['bash', 'shell scripting']
    };

    // Extract technical skills with better matching
    Object.entries(technicalSkillsMap).forEach(([skill, keywords]) => {
      const found = keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
      });
      
      if (found && !skills.technical.includes(skill)) {
        skills.technical.push(skill);
      }
    });

    // Enhanced Soft Skills
    const softSkillsMap = {
      'Leadership': ['leadership', 'team lead', 'leading teams', 'manage team'],
      'Communication': ['communication', 'presentation', 'public speaking'],
      'Problem Solving': ['problem solving', 'problem-solving', 'troubleshooting'],
      'Teamwork': ['teamwork', 'team work', 'collaboration', 'collaborative'],
      'Project Management': ['project management', 'agile', 'scrum', 'kanban'],
      'Critical Thinking': ['critical thinking', 'analytical', 'analysis'],
      'Time Management': ['time management', 'organization', 'prioritization'],
      'Mentoring': ['mentoring', 'coaching', 'training'],
      'Customer Service': ['customer service', 'client relations'],
      'Adaptability': ['adaptability', 'flexibility', 'resilience']
    };

    Object.entries(softSkillsMap).forEach(([skill, keywords]) => {
      const found = keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
      });
      
      if (found && !skills.softSkills.includes(skill)) {
        skills.softSkills.push(skill);
      }
    });

    // Enhanced Tools
    const toolsMap = {
      'JIRA': ['jira'],
      'Confluence': ['confluence'],
      'Slack': ['slack'],
      'Figma': ['figma'],
      'VS Code': ['vs code', 'vscode', 'visual studio code'],
      'IntelliJ': ['intellij', 'intellij idea'],
      'Postman': ['postman'],
      'Swagger': ['swagger', 'openapi'],
      'Tableau': ['tableau'],
      'Power BI': ['power bi', 'powerbi'],
      'Excel': ['excel', 'microsoft excel'],
      'Photoshop': ['photoshop', 'adobe photoshop'],
      'Sketch': ['sketch'],
      'Trello': ['trello'],
      'Asana': ['asana']
    };

    Object.entries(toolsMap).forEach(([tool, keywords]) => {
      const found = keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
      });
      
      if (found && !skills.tools.includes(tool)) {
        skills.tools.push(tool);
      }
    });

    // Extract programming languages separately for better categorization
    const programmingLanguages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift'];
    skills.languages = skills.technical.filter(skill => programmingLanguages.includes(skill));

    // Enhanced Certifications extraction
    const certificationPatterns = [
      /aws\s+certified\s+[\w\s]+/gi,
      /microsoft\s+certified\s+[\w\s]+/gi,
      /google\s+cloud\s+certified\s+[\w\s]+/gi,
      /certified\s+kubernetes\s+[\w\s]+/gi,
      /comptia\s+[\w\s]+/gi,
      /cissp/gi,
      /ccna/gi,
      /pmp/gi,
      /scrum\s+master/gi,
      /oracle\s+certified\s+[\w\s]+/gi
    ];

    certificationPatterns.forEach(pattern => {
      const matches = originalText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cert = match.trim();
          if (!skills.certifications.includes(cert)) {
            skills.certifications.push(cert);
          }
        });
      }
    });

    // Enhanced experience extraction
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/gi,
      /(\d+)\+?\s*yrs?\s*(of\s+)?(experience|exp)/gi,
      /experience\s*:\s*(\d+)\+?\s*years?/gi
    ];

    let maxYears = 0;
    experiencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const yearMatch = match.match(/(\d+)/);
          if (yearMatch) {
            const years = parseInt(yearMatch[1]);
            maxYears = Math.max(maxYears, years);
          }
        });
      }
    });
    skills.experience.yearsTotal = maxYears;

    // Enhanced company extraction
    const companyPatterns = [
      /(?:at|@|company|worked\s+at|employed\s+at)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s|,|\.|\n|$)/g,
      /([A-Z][a-zA-Z\s&.,]+?)\s+(?:inc|llc|corp|ltd|company|technologies|tech|systems|solutions)/gi
    ];

    companyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalText)) !== null) {
        const company = match[1]?.trim();
        if (company && company.length > 2 && company.length < 50 && !skills.experience.companies.includes(company)) {
          skills.experience.companies.push(company);
        }
      }
    });

    // Enhanced role extraction
    const rolePatterns = [
      /(senior|junior|lead|principal|staff)?\s*(software|web|mobile|frontend|backend|full[\s-]?stack|devops|data|machine\s+learning|ai|security|cloud|systems|platform|site\s+reliability)\s+(engineer|developer|architect|scientist|analyst)/gi,
      /(project|product|engineering|technical|team)\s+(manager|lead|director)/gi,
      /(cto|ceo|vp|vice\s+president)\s+(of\s+)?(engineering|technology|product)/gi
    ];

    rolePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalText)) !== null) {
        const role = match[0]?.trim();
        if (role && !skills.experience.roles.includes(role)) {
          skills.experience.roles.push(role);
        }
      }
    });

    return skills;
  }

  // Enhanced role compatibility calculation with better scoring algorithm
  calculateRoleMatch(extractedSkills: ExtractedSkills, role: RoleRequirement): RoleMatch {
    const allExtractedSkills = [
      ...extractedSkills.technical,
      ...extractedSkills.softSkills,
      ...extractedSkills.tools,
      ...extractedSkills.languages
    ].map(s => s.toLowerCase());

    // Enhanced skill matching with fuzzy matching
    const matchSkill = (requiredSkill: string, extractedSkills: string[]): boolean => {
      const required = requiredSkill.toLowerCase();
      return extractedSkills.some(extracted => {
        // Exact match
        if (extracted === required) return true;
        
        // Partial match (both ways)
        if (extracted.includes(required) || required.includes(extracted)) return true;
        
        // Handle common variations
        const variations: { [key: string]: string[] } = {
          'javascript': ['js', 'ecmascript'],
          'typescript': ['ts'],
          'node.js': ['nodejs', 'node'],
          'react': ['reactjs', 'react.js'],
          'vue.js': ['vue', 'vuejs'],
          'angular': ['angularjs'],
          'c++': ['cpp', 'c plus plus'],
          'c#': ['csharp', 'c sharp'],
          'postgresql': ['postgres'],
          'mongodb': ['mongo'],
          'kubernetes': ['k8s'],
          'aws': ['amazon web services'],
          'gcp': ['google cloud platform', 'google cloud'],
          'ci/cd': ['continuous integration', 'continuous deployment']
        };
        
        // Check if required skill has variations that match extracted skills
        if (variations[required]) {
          return variations[required].some(variation => extracted.includes(variation));
        }
        
        // Check if extracted skill has variations that match required skill
        const reverseVariations = Object.entries(variations).find(([key, values]) => 
          values.includes(extracted)
        );
        if (reverseVariations && required.includes(reverseVariations[0])) {
          return true;
        }
        
        return false;
      });
    };

    // Match required skills with enhanced algorithm
    const matchedRequired = role.requiredSkills.filter(skill =>
      matchSkill(skill, allExtractedSkills)
    );

    // Match preferred skills
    const matchedPreferred = role.preferredSkills.filter(skill =>
      matchSkill(skill, allExtractedSkills)
    );

    // Enhanced scoring algorithm
    const requiredSkillsCount = role.requiredSkills.length;
    const preferredSkillsCount = role.preferredSkills.length;
    
    // Base scores
    const requiredScore = requiredSkillsCount > 0 
      ? (matchedRequired.length / requiredSkillsCount) * 70 // 70% weight for required skills
      : 0;
    
    const preferredScore = preferredSkillsCount > 0 
      ? (matchedPreferred.length / preferredSkillsCount) * 20 // 20% weight for preferred skills
      : 0;
    
    // Experience score with better calculation
    let experienceScore = 0;
    if (role.experienceYears > 0) {
      const experienceRatio = extractedSkills.experience.yearsTotal / role.experienceYears;
      if (experienceRatio >= 1) {
        experienceScore = 10; // Full points if meets or exceeds requirement
      } else if (experienceRatio >= 0.7) {
        experienceScore = 7; // Partial points if close to requirement
      } else if (experienceRatio >= 0.5) {
        experienceScore = 5; // Some points if halfway there
      } else {
        experienceScore = experienceRatio * 10; // Proportional points
      }
    }

    // Bonus points for relevant experience
    let bonusScore = 0;
    const roleKeywords = role.role.toLowerCase().split(' ');
    const hasRelevantRole = extractedSkills.experience.roles.some(userRole =>
      roleKeywords.some(keyword => userRole.toLowerCase().includes(keyword))
    );
    if (hasRelevantRole) {
      bonusScore += 5;
    }

    // Bonus for having more skills than required
    const totalSkillsExtracted = extractedSkills.technical.length + 
                                extractedSkills.softSkills.length + 
                                extractedSkills.tools.length;
    if (totalSkillsExtracted > 10) {
      bonusScore += 2;
    }

    // Calculate final score
    const rawScore = requiredScore + preferredScore + experienceScore + bonusScore;
    const score = Math.min(Math.round(rawScore), 100); // Cap at 100

    // Enhanced suitability determination
    let suitability: RoleMatch['suitability'];
    const requiredSkillsPercentage = requiredSkillsCount > 0 
      ? (matchedRequired.length / requiredSkillsCount) * 100 
      : 0;
    
    if (score >= 85 && requiredSkillsPercentage >= 80) {
      suitability = 'excellent';
    } else if (score >= 70 && requiredSkillsPercentage >= 60) {
      suitability = 'good';
    } else if (score >= 55 && requiredSkillsPercentage >= 40) {
      suitability = 'moderate';
    } else if (score >= 35 && requiredSkillsPercentage >= 20) {
      suitability = 'fair';
    } else {
      suitability = 'poor';
    }

    return {
      role: role.role,
      score,
      matchedRequired,
      matchedPreferred,
      missingRequired: role.requiredSkills.filter(s => !matchedRequired.includes(s)),
      missingPreferred: role.preferredSkills.filter(s => !matchedPreferred.includes(s)),
      suitability
    };
  }

  // Get AI analysis using OpenAI API
  async getAIAnalysis(resumeText: string, extractedSkills: ExtractedSkills): Promise<AIAnalysis> {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = `Analyze this resume and provide comprehensive career insights:

Resume:
${resumeText}

Extracted Skills: ${JSON.stringify(extractedSkills, null, 2)}

Please provide the analysis in the following JSON format:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "opportunities": ["opportunity1", "opportunity2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "careerPath": "suggested career progression",
  "estimatedLevel": "junior|mid|senior",
  "topSkillGaps": ["skill1", "skill2", ...]
}

Be specific and practical in your recommendations.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a senior career advisor and tech recruiter with expertise in assessing tech talent. Provide actionable, specific insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      // Return default analysis if API fails
      return {
        strengths: ['Multiple technical skills', 'Professional experience'],
        weaknesses: ['Need stronger specialization', 'Limited certifications'],
        opportunities: ['Cloud technologies', 'DevOps practices'],
        recommendations: ['Focus on one technology stack', 'Obtain industry certifications'],
        careerPath: 'Mid-level developer role with specialization opportunities',
        estimatedLevel: 'mid',
        topSkillGaps: ['Advanced cloud architecture', 'Machine learning fundamentals']
      };
    }
  }

  // Enhanced learning path generation with comprehensive course database
  async getLearningPath(skillGaps: string[], targetRole: string): Promise<LearningResource[]> {
    const learningResources: LearningResource[] = [];

    // Comprehensive course database with multiple platforms and difficulty levels
    const courseDatabase: { [key: string]: any } = {
      'JavaScript': {
        courses: [
          {
            title: 'JavaScript - The Complete Guide 2024',
            platform: 'Udemy',
            duration: '52 hours',
            difficulty: 'beginner',
            url: 'https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/',
            cost: 'paid' as const
          },
          {
            title: 'The Modern JavaScript Tutorial',
            platform: 'JavaScript.info',
            duration: '40 hours',
            difficulty: 'intermediate',
            url: 'https://javascript.info',
            cost: 'free' as const
          },
          {
            title: 'JavaScript Algorithms and Data Structures',
            platform: 'freeCodeCamp',
            duration: '300 hours',
            difficulty: 'intermediate',
            url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
            cost: 'free' as const
          }
        ],
        hours: 50,
        priority: 'critical'
      },
      'React': {
        courses: [
          {
            title: 'React - The Complete Guide',
            platform: 'Udemy',
            duration: '48 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
            cost: 'paid' as const
          },
          {
            title: 'React Documentation',
            platform: 'React.dev',
            duration: '20 hours',
            difficulty: 'intermediate',
            url: 'https://react.dev/learn',
            cost: 'free' as const
          },
          {
            title: 'Full Stack Open - React',
            platform: 'University of Helsinki',
            duration: '60 hours',
            difficulty: 'advanced',
            url: 'https://fullstackopen.com/en/',
            cost: 'free' as const
          }
        ],
        hours: 48,
        priority: 'critical'
      },
      'Node.js': {
        courses: [
          {
            title: 'Node.js, Express, MongoDB & More',
            platform: 'Udemy',
            duration: '42 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
            cost: 'paid' as const
          },
          {
            title: 'Node.js Complete Course',
            platform: 'YouTube - Programming with Mosh',
            duration: '6 hours',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
            cost: 'free' as const
          },
          {
            title: 'Node.js Design Patterns',
            platform: 'Packt',
            duration: '25 hours',
            difficulty: 'advanced',
            url: 'https://www.packtpub.com/product/node-js-design-patterns-third-edition/9781839214110',
            cost: 'paid' as const
          }
        ],
        hours: 42,
        priority: 'high'
      },
      'TypeScript': {
        courses: [
          {
            title: 'Understanding TypeScript',
            platform: 'Udemy',
            duration: '15 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/understanding-typescript/',
            cost: 'paid' as const
          },
          {
            title: 'TypeScript Handbook',
            platform: 'TypeScript Official',
            duration: '20 hours',
            difficulty: 'intermediate',
            url: 'https://www.typescriptlang.org/docs/',
            cost: 'free' as const
          },
          {
            title: 'TypeScript Complete Course',
            platform: 'YouTube - Hitesh Choudhary',
            duration: '4 hours',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=30LWjhZzg50',
            cost: 'free' as const
          }
        ],
        hours: 20,
        priority: 'high'
      },
      'Python': {
        courses: [
          {
            title: 'Complete Python Bootcamp',
            platform: 'Udemy',
            duration: '22 hours',
            difficulty: 'beginner',
            url: 'https://www.udemy.com/course/complete-python-bootcamp/',
            cost: 'paid' as const
          },
          {
            title: 'Python for Everybody Specialization',
            platform: 'Coursera',
            duration: '8 months',
            difficulty: 'beginner',
            url: 'https://www.coursera.org/specializations/python',
            cost: 'paid' as const
          },
          {
            title: 'Python Complete Course',
            platform: 'YouTube - Programming with Mosh',
            duration: '6 hours',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
            cost: 'free' as const
          }
        ],
        hours: 30,
        priority: 'critical'
      },
      'AWS': {
        courses: [
          {
            title: 'AWS Certified Solutions Architect',
            platform: 'A Cloud Guru',
            duration: '60 hours',
            difficulty: 'advanced',
            url: 'https://acloudguru.com/course/aws-certified-solutions-architect-associate-saa-c03',
            cost: 'paid' as const
          },
          {
            title: 'AWS Cloud Practitioner Essentials',
            platform: 'AWS Training',
            duration: '6 hours',
            difficulty: 'beginner',
            url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',
            cost: 'free' as const
          },
          {
            title: 'AWS Full Course',
            platform: 'YouTube - freeCodeCamp',
            duration: '10 hours',
            difficulty: 'intermediate',
            url: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            cost: 'free' as const
          }
        ],
        hours: 60,
        priority: 'high'
      },
      'Docker': {
        courses: [
          {
            title: 'Docker Mastery',
            platform: 'Udemy',
            duration: '19 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/docker-mastery/',
            cost: 'paid' as const
          },
          {
            title: 'Docker Tutorial for Beginners',
            platform: 'YouTube - Programming with Mosh',
            duration: '1 hour',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
            cost: 'free' as const
          },
          {
            title: 'Docker Documentation',
            platform: 'Docker Official',
            duration: '15 hours',
            difficulty: 'intermediate',
            url: 'https://docs.docker.com/get-started/',
            cost: 'free' as const
          }
        ],
        hours: 20,
        priority: 'medium'
      },
      'Kubernetes': {
        courses: [
          {
            title: 'Kubernetes for Developers',
            platform: 'Udemy',
            duration: '13 hours',
            difficulty: 'advanced',
            url: 'https://www.udemy.com/course/kubernetes-for-developers/',
            cost: 'paid' as const
          },
          {
            title: 'Kubernetes Tutorial',
            platform: 'YouTube - TechWorld with Nana',
            duration: '4 hours',
            difficulty: 'intermediate',
            url: 'https://www.youtube.com/watch?v=X48VuDVv0do',
            cost: 'free' as const
          },
          {
            title: 'Kubernetes Documentation',
            platform: 'Kubernetes Official',
            duration: '20 hours',
            difficulty: 'advanced',
            url: 'https://kubernetes.io/docs/tutorials/',
            cost: 'free' as const
          }
        ],
        hours: 25,
        priority: 'medium'
      },
      'SQL': {
        courses: [
          {
            title: 'The Complete SQL Bootcamp',
            platform: 'Udemy',
            duration: '9 hours',
            difficulty: 'beginner',
            url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
            cost: 'paid' as const
          },
          {
            title: 'SQL Tutorial',
            platform: 'W3Schools',
            duration: '10 hours',
            difficulty: 'beginner',
            url: 'https://www.w3schools.com/sql/',
            cost: 'free' as const
          },
          {
            title: 'Relational Database Course',
            platform: 'freeCodeCamp',
            duration: '300 hours',
            difficulty: 'intermediate',
            url: 'https://www.freecodecamp.org/learn/relational-database/',
            cost: 'free' as const
          }
        ],
        hours: 15,
        priority: 'high'
      },
      'HTML': {
        courses: [
          {
            title: 'HTML5 and CSS3 Complete Course',
            platform: 'Udemy',
            duration: '37 hours',
            difficulty: 'beginner',
            url: 'https://www.udemy.com/course/design-and-develop-a-killer-website-with-html5-and-css3/',
            cost: 'paid' as const
          },
          {
            title: 'Responsive Web Design',
            platform: 'freeCodeCamp',
            duration: '300 hours',
            difficulty: 'beginner',
            url: 'https://www.freecodecamp.org/learn/responsive-web-design/',
            cost: 'free' as const
          }
        ],
        hours: 20,
        priority: 'critical'
      },
      'CSS': {
        courses: [
          {
            title: 'Advanced CSS and Sass',
            platform: 'Udemy',
            duration: '28 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/advanced-css-and-sass/',
            cost: 'paid' as const
          },
          {
            title: 'CSS Complete Guide',
            platform: 'YouTube - Web Dev Simplified',
            duration: '8 hours',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
            cost: 'free' as const
          }
        ],
        hours: 25,
        priority: 'high'
      },
      'Git': {
        courses: [
          {
            title: 'Git Complete Course',
            platform: 'YouTube - Kunal Kushwaha',
            duration: '4 hours',
            difficulty: 'beginner',
            url: 'https://www.youtube.com/watch?v=apGV9Kg7ics',
            cost: 'free' as const
          },
          {
            title: 'Git and GitHub Bootcamp',
            platform: 'Udemy',
            duration: '17 hours',
            difficulty: 'intermediate',
            url: 'https://www.udemy.com/course/git-and-github-bootcamp/',
            cost: 'paid' as const
          }
        ],
        hours: 10,
        priority: 'high'
      }
    };

    // Process skill gaps and create learning resources
    skillGaps.forEach((skill, index) => {
      // Normalize skill name for lookup
      const normalizedSkill = skill.trim();
      let courseData = courseDatabase[normalizedSkill];
      
      // Try alternative lookups if direct match fails
      if (!courseData) {
        const alternativeKeys = Object.keys(courseDatabase).find(key => 
          key.toLowerCase().includes(normalizedSkill.toLowerCase()) ||
          normalizedSkill.toLowerCase().includes(key.toLowerCase())
        );
        if (alternativeKeys) {
          courseData = courseDatabase[alternativeKeys];
        }
      }

      if (courseData) {
        learningResources.push({
          skill: normalizedSkill,
          courses: courseData.courses,
          estimatedHours: courseData.hours,
          priority: index < 2 ? 'critical' : index < 4 ? 'high' : 'medium'
        });
      } else {
        // Create generic learning resource for skills not in database
        learningResources.push({
          skill: normalizedSkill,
          courses: [
            {
              title: `${normalizedSkill} Complete Course`,
              platform: 'YouTube',
              duration: '10 hours',
              difficulty: 'intermediate',
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(normalizedSkill + ' tutorial')}`,
              cost: 'free' as const
            },
            {
              title: `Learn ${normalizedSkill}`,
              platform: 'Udemy',
              duration: '20 hours',
              difficulty: 'intermediate',
              url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(normalizedSkill)}`,
              cost: 'paid' as const
            }
          ],
          estimatedHours: 15,
          priority: index < 2 ? 'critical' : 'medium'
        });
      }
    });

    // If no skill gaps provided, create role-based recommendations
    if (learningResources.length === 0) {
      const roleBasedSkills = this.getRoleBasedSkills(targetRole);
      roleBasedSkills.forEach((skill, index) => {
        const courseData = courseDatabase[skill];
        if (courseData) {
          learningResources.push({
            skill,
            courses: courseData.courses,
            estimatedHours: courseData.hours,
            priority: index < 2 ? 'critical' : 'high'
          });
        }
      });
    }

    return learningResources.slice(0, 8); // Limit to top 8 resources
  }

  // Get role-based skill recommendations
  private getRoleBasedSkills(targetRole: string): string[] {
    const roleSkillsMap: { [key: string]: string[] } = {
      'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML'],
      'Backend Developer': ['Node.js', 'Python', 'SQL', 'Docker', 'AWS'],
      'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'SQL', 'TypeScript'],
      'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Git', 'Python'],
      'Data Engineer': ['Python', 'SQL', 'AWS', 'Docker'],
      'Machine Learning Engineer': ['Python', 'SQL', 'AWS'],
      'Cloud Architect': ['AWS', 'Docker', 'Kubernetes'],
      'Security Engineer': ['Python', 'AWS', 'Docker'],
      'QA Engineer': ['JavaScript', 'Python', 'SQL'],
      'Solution Architect': ['AWS', 'Docker', 'SQL']
    };

    return roleSkillsMap[targetRole] || ['JavaScript', 'Python', 'SQL', 'Git', 'AWS'];
  }

  // Main analysis function with comprehensive error handling
  async analyzeResume(resumeText: string): Promise<EnhancedATSResult> {
    try {
      // Validate input
      if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
        throw new Error('Invalid resume text provided');
      }

      // Extract skills with error handling
      let extractedSkills: ExtractedSkills;
      try {
        extractedSkills = await this.extractSkills(resumeText);
      } catch (error) {
        console.error('Error extracting skills:', error);
        // Provide fallback empty skills structure
        extractedSkills = {
          technical: [],
          softSkills: [],
          tools: [],
          languages: [],
          certifications: [],
          experience: {
            yearsTotal: 0,
            companies: [],
            roles: []
          }
        };
      }

      // Get AI analysis with error handling
      let aiAnalysis: AIAnalysis;
      try {
        aiAnalysis = await this.getAIAnalysis(resumeText, extractedSkills);
      } catch (error) {
        console.error('Error getting AI analysis:', error);
        // Provide fallback AI analysis
        aiAnalysis = {
          strengths: ['Professional experience', 'Technical skills'],
          weaknesses: ['Need stronger specialization'],
          opportunities: ['Cloud technologies', 'Modern frameworks'],
          recommendations: ['Focus on one technology stack', 'Obtain industry certifications'],
          careerPath: 'Mid-level developer role with specialization opportunities',
          estimatedLevel: 'mid',
          topSkillGaps: ['JavaScript', 'React', 'Node.js', 'AWS', 'Docker']
        };
      }

      // Calculate role matches with error handling
      let roleMatches: RoleMatch[] = [];
      try {
        roleMatches = PREDEFINED_ROLES.map(role => {
          try {
            return this.calculateRoleMatch(extractedSkills, role);
          } catch (error) {
            console.error(`Error calculating match for role ${role.role}:`, error);
            // Return a fallback role match
            return {
              role: role.role,
              score: 0,
              matchedRequired: [],
              matchedPreferred: [],
              missingRequired: role.requiredSkills || [],
              missingPreferred: role.preferredSkills || [],
              suitability: 'poor' as const
            };
          }
        }).sort((a, b) => b.score - a.score);
      } catch (error) {
        console.error('Error calculating role matches:', error);
        roleMatches = [];
      }

      // Get top 3 matches with safety checks
      let bestMatches = roleMatches.slice(0, 3);

      // Safety check: ensure bestMatches is not empty
      if (!bestMatches || bestMatches.length === 0) {
        const fallbackRole = PREDEFINED_ROLES[0] || {
          role: 'Frontend Developer',
          requiredSkills: ['JavaScript', 'HTML', 'CSS'],
          preferredSkills: ['React', 'TypeScript'],
          level: 'mid' as const,
          experienceYears: 2,
          description: 'Frontend development role',
          jobCategories: ['Frontend']
        };

        bestMatches = [{
          role: fallbackRole.role,
          score: 0,
          matchedRequired: [],
          matchedPreferred: [],
          missingRequired: fallbackRole.requiredSkills || [],
          missingPreferred: fallbackRole.preferredSkills || [],
          suitability: 'poor' as const
        }];
      }

      // Get learning path with error handling
      let learningPath: LearningResource[] = [];
      try {
        const skillGaps = aiAnalysis.topSkillGaps?.slice(0, 5) || [];
        const targetRole = bestMatches[0]?.role || 'General Tech Role';
        learningPath = await this.getLearningPath(skillGaps, targetRole);
      } catch (error) {
        console.error('Error generating learning path:', error);
        learningPath = [];
      }

      // Calculate overall score with safety checks
      const overallScore = bestMatches && bestMatches.length > 0 
        ? Math.round(bestMatches.reduce((sum, match) => sum + (match?.score || 0), 0) / bestMatches.length)
        : 0;

      // Ensure all required properties are present
      const result: EnhancedATSResult = {
        resumeText: resumeText || '',
        extractedSkills: extractedSkills || {
          technical: [],
          softSkills: [],
          tools: [],
          languages: [],
          certifications: [],
          experience: { yearsTotal: 0, companies: [], roles: [] }
        },
        roleMatches: roleMatches || [],
        bestMatches: bestMatches || [],
        aiAnalysis: aiAnalysis || {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          recommendations: [],
          careerPath: '',
          estimatedLevel: 'mid',
          topSkillGaps: []
        },
        learningPath: learningPath || [],
        overallScore: overallScore || 0,
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      console.error('Error in analyzeResume:', error);
      
      // Return a safe fallback result instead of throwing
      return {
        resumeText: resumeText || '',
        extractedSkills: {
          technical: [],
          softSkills: [],
          tools: [],
          languages: [],
          certifications: [],
          experience: { yearsTotal: 0, companies: [], roles: [] }
        },
        roleMatches: [],
        bestMatches: [{
          role: 'Frontend Developer',
          score: 0,
          matchedRequired: [],
          matchedPreferred: [],
          missingRequired: ['JavaScript', 'HTML', 'CSS'],
          missingPreferred: ['React', 'TypeScript'],
          suitability: 'poor'
        }],
        aiAnalysis: {
          strengths: ['Professional experience'],
          weaknesses: ['Need skill development'],
          opportunities: ['Learn modern technologies'],
          recommendations: ['Focus on core web technologies'],
          careerPath: 'Entry-level development role',
          estimatedLevel: 'junior',
          topSkillGaps: ['JavaScript', 'HTML', 'CSS']
        },
        learningPath: [],
        overallScore: 0,
        timestamp: new Date()
      };
    }
  }

  // Save analysis to Firebase
  async saveAnalysis(userId: string, result: EnhancedATSResult): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'atsAnalyses'), {
        userId,
        ...result,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }
}

export const enhancedATSService = new EnhancedATSService();
