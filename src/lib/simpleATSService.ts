// Simple ATS Analyzer Service - Focused on core functionality
export interface SimpleATSResult {
  // Basic info
  extractedSkills: string[];
  overallScore: number;
  
  // Target roles analysis
  targetRolesAnalysis: RoleAnalysis[];
  
  // Best matching role (might not be in targets)
  bestMatchingRole: RoleAnalysis;
  
  // All roles analysis (to find better matches)
  allRolesAnalysis: RoleAnalysis[];
  
  // Learning recommendations
  learningPath: LearningResource[];
}

export interface RoleAnalysis {
  role: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  requiredSkills: string[];
  isTargetRole: boolean;
}

export interface LearningResource {
  title: string;
  type: 'course' | 'certification' | 'tutorial';
  provider: string;
  url: string;
  duration: string;
  skill: string;
}

class SimpleATSService {
  // Comprehensive skill database
  private skillDatabase = [
    // Frontend
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 
    'Bootstrap', 'Tailwind CSS', 'Sass', 'jQuery', 'Next.js', 'Nuxt.js',
    
    // Backend
    'Node.js', 'Express', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 
    'Spring Boot', 'C#', 'ASP.NET', 'PHP', 'Laravel', 'Ruby', 'Rails',
    
    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 
    'SQLite', 'DynamoDB', 'Cassandra', 'Elasticsearch',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 
    'CI/CD', 'Terraform', 'Ansible', 'GitHub Actions', 'GitLab CI',
    
    // Tools & Others
    'Git', 'GitHub', 'GitLab', 'JIRA', 'Postman', 'Linux', 'Bash',
    'REST API', 'GraphQL', 'Microservices', 'Machine Learning', 'AI',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Agile', 'Scrum'
  ];

  // Role requirements database
  private roleRequirements: { [key: string]: string[] } = {
    'Frontend Developer': [
      'JavaScript', 'HTML5', 'CSS3', 'React', 'TypeScript', 'Git'
    ],
    'Backend Developer': [
      'Python', 'Java', 'Node.js', 'MySQL', 'REST API', 'Git'
    ],
    'Full Stack Developer': [
      'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'React', 'MySQL', 'Git'
    ],
    'DevOps Engineer': [
      'Docker', 'Kubernetes', 'AWS', 'Git', 'Linux', 'CI/CD'
    ],
    'Data Scientist': [
      'Python', 'Machine Learning', 'Pandas', 'NumPy', 'SQL'
    ],
    'Mobile Developer': [
      'React Native', 'Flutter', 'JavaScript', 'TypeScript', 'Git'
    ],
    'Cloud Engineer': [
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Linux'
    ],
    'Machine Learning Engineer': [
      'Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'AWS'
    ]
  };

  // Extract skills from text
  extractSkills(text: string): string[] {
    const textLower = text.toLowerCase();
    const foundSkills: string[] = [];

    this.skillDatabase.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Create variations for better matching
      const variations = [
        skillLower,
        skillLower.replace(/\./g, ''),
        skillLower.replace(/\s/g, ''),
        skillLower.replace(/-/g, '')
      ];

      // Add common aliases
      if (skillLower === 'javascript') variations.push('js');
      if (skillLower === 'node.js') variations.push('nodejs', 'node');
      if (skillLower === 'html5') variations.push('html');
      if (skillLower === 'css3') variations.push('css');
      if (skillLower === 'react') variations.push('reactjs');
      if (skillLower === 'vue.js') variations.push('vue', 'vuejs');

      // Check if any variation exists in text
      const isFound = variations.some(variation => {
        if (variation.length < 2) return false;
        
        // Use word boundaries for better matching
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text) || textLower.includes(variation);
      });

      if (isFound && !foundSkills.includes(skill)) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  // Analyze role compatibility
  analyzeRole(extractedSkills: string[], role: string): RoleAnalysis {
    const requiredSkills = this.roleRequirements[role] || [];
    const matchedSkills = extractedSkills.filter(skill => 
      requiredSkills.some(required => 
        required.toLowerCase() === skill.toLowerCase() ||
        this.isSkillMatch(skill, required)
      )
    );
    
    const missingSkills = requiredSkills.filter(required =>
      !extractedSkills.some(skill => 
        skill.toLowerCase() === required.toLowerCase() ||
        this.isSkillMatch(skill, required)
      )
    );

    const score = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;

    return {
      role,
      score,
      matchedSkills,
      missingSkills,
      requiredSkills,
      isTargetRole: false // Will be set later
    };
  }

  // Check if two skills match (considering aliases)
  private isSkillMatch(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    const aliases: { [key: string]: string[] } = {
      'javascript': ['js'],
      'typescript': ['ts'],
      'node.js': ['nodejs', 'node'],
      'html5': ['html'],
      'css3': ['css'],
      'react': ['reactjs'],
      'vue.js': ['vue', 'vuejs'],
      'mysql': ['sql'],
      'postgresql': ['postgres', 'sql'],
      'mongodb': ['mongo'],
      'rest api': ['api', 'rest'],
      'machine learning': ['ml', 'ai']
    };

    // Check direct aliases
    for (const [main, aliasList] of Object.entries(aliases)) {
      if ((s1 === main && aliasList.includes(s2)) ||
          (s2 === main && aliasList.includes(s1)) ||
          (aliasList.includes(s1) && aliasList.includes(s2))) {
        return true;
      }
    }

    return false;
  }

  // Generate learning path for missing skills
  generateLearningPath(missingSkills: string[]): LearningResource[] {
    const learningResources: LearningResource[] = [];

    missingSkills.forEach(skill => {
      const resources = this.getSkillResources(skill);
      learningResources.push(...resources);
    });

    return learningResources.slice(0, 10); // Limit to top 10 resources
  }

  // Get learning resources for a specific skill
  private getSkillResources(skill: string): LearningResource[] {
    const resourceMap: { [key: string]: LearningResource[] } = {
      'JavaScript': [
        {
          title: 'JavaScript Complete Course',
          type: 'course',
          provider: 'YouTube - Code with Harry',
          url: 'https://youtube.com',
          duration: '6 hours',
          skill: 'JavaScript'
        }
      ],
      'React': [
        {
          title: 'React Complete Tutorial',
          type: 'course',
          provider: 'YouTube - freeCodeCamp',
          url: 'https://youtube.com',
          duration: '8 hours',
          skill: 'React'
        }
      ],
      'Python': [
        {
          title: 'Python for Beginners',
          type: 'course',
          provider: 'YouTube - Programming with Mosh',
          url: 'https://youtube.com',
          duration: '6 hours',
          skill: 'Python'
        }
      ],
      'Docker': [
        {
          title: 'Docker Complete Course',
          type: 'course',
          provider: 'YouTube - TechWorld with Nana',
          url: 'https://youtube.com',
          duration: '4 hours',
          skill: 'Docker'
        }
      ],
      'AWS': [
        {
          title: 'AWS Cloud Practitioner',
          type: 'certification',
          provider: 'Amazon',
          url: 'https://aws.amazon.com/certification/',
          duration: '40 hours',
          skill: 'AWS'
        }
      ]
    };

    return resourceMap[skill] || [
      {
        title: `${skill} Complete Guide`,
        type: 'course',
        provider: 'YouTube',
        url: 'https://youtube.com',
        duration: '4 hours',
        skill
      }
    ];
  }

  // Main analysis function
  async analyzeResume(
    resumeText: string, 
    targetRoles: string[] = []
  ): Promise<SimpleATSResult> {
    
    console.log('🔍 Starting simple ATS analysis...');
    console.log('Resume text length:', resumeText.length);
    console.log('Target roles:', targetRoles);

    // Step 1: Extract skills
    const extractedSkills = this.extractSkills(resumeText);
    console.log('✅ Extracted skills:', extractedSkills);

    // Step 2: Analyze target roles
    const targetRolesAnalysis = targetRoles.map(role => {
      const analysis = this.analyzeRole(extractedSkills, role);
      analysis.isTargetRole = true;
      return analysis;
    });

    // Step 3: Analyze all roles to find best matches
    const allRoles = Object.keys(this.roleRequirements);
    const allRolesAnalysis = allRoles.map(role => {
      const analysis = this.analyzeRole(extractedSkills, role);
      analysis.isTargetRole = targetRoles.includes(role);
      return analysis;
    }).sort((a, b) => b.score - a.score);

    // Step 4: Find best matching role
    const bestMatchingRole = allRolesAnalysis[0];

    // Step 5: Generate learning path (focus on best matching role's missing skills)
    const learningPath = this.generateLearningPath(bestMatchingRole.missingSkills);

    // Step 6: Calculate overall score (average of target roles or best match)
    const overallScore = targetRolesAnalysis.length > 0
      ? Math.round(targetRolesAnalysis.reduce((sum, role) => sum + role.score, 0) / targetRolesAnalysis.length)
      : bestMatchingRole.score;

    const result: SimpleATSResult = {
      extractedSkills,
      overallScore,
      targetRolesAnalysis,
      bestMatchingRole,
      allRolesAnalysis,
      learningPath
    };

    console.log('✅ Simple ATS analysis completed:', result);
    return result;
  }

  // Extract text from file (simplified version)
  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (file.type === 'application/pdf') {
          // For PDF, we'll extract what we can (simplified)
          resolve(text || '');
        } else {
          // For text files and others
          resolve(text || '');
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const simpleATSService = new SimpleATSService();