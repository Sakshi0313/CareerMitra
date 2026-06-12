import { toast } from "sonner";

interface ResumeAnalysisRequest {
  resumeText: string;
  targetRoles: string[];
  userSkills: string[];
}

interface RoleMatch {
  role: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalRequired: number;
  totalPreferred: number;
  requiredMatched: number;
  preferredMatched: number;
  matchDetails?: Array<{
    skill: string;
    found: string[];
    category: 'required' | 'preferred';
  }>;
}

interface ResumeAnalysisResult {
  overallScore: number;
  extractedSkills: string[];
  roleAnalysis: RoleMatch[];
  allRoleAnalysis: RoleMatch[];
  bestMatch: RoleMatch;
  suggestedRole: RoleMatch | null;
  sections: {
    [key: string]: {
      score: number;
      status: string;
      feedback: string;
    };
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordAnalysis: {
    found: string[];
    missing: string[];
    density: number;
  };
  learningPath: Array<{
    title: string;
    type: string;
    provider: string;
    url: string;
    duration: string;
  }>;
  // Enhanced document parsing results
  documentMetadata?: {
    wordCount: number;
    pageCount?: number;
    fileType: string;
    extractionMethod: string;
  };
  enhancedKeywords?: string[];
  enhancedSkills?: string[];
  skillsGapAnalysis?: Array<{
    matchingSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
    recommendations: string[];
  }>;
  // Debug information
  resumeTextLength?: number;
  extractionMethod?: string;
  originalExtractedCount?: number;
  verifiedCount?: number;
}

class AIService {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;
  private apiVersion: string;
  
  // OpenAI direct API fallback
  private openaiApiKey: string;
  private useOpenAI: boolean = false;

  constructor() {
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
    this.deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;
    this.apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;
    
    // OpenAI direct API fallback
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // Determine which API to use
    if (this.endpoint && this.apiKey && this.deployment) {
      this.useOpenAI = false;
    } else if (this.openaiApiKey) {
      this.useOpenAI = true;
    } else {
      throw new Error('No AI API configured. Please check environment variables.');
    }
  }

  async analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResult> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Validate API configuration
        if (!this.useOpenAI && (!this.endpoint || !this.apiKey || !this.deployment)) {
          throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.');
        }
        
        if (this.useOpenAI && !this.openaiApiKey) {
          throw new Error('OpenAI API key is missing. Please check your environment variables.');
        }

        const prompt = this.createAnalysisPrompt(request);
        
        let response;
        
        if (this.useOpenAI) {
          // Use OpenAI direct API
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.openaiApiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini', // Using the latest and most cost-effective model
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert ATS (Applicant Tracking System) analyzer and career counselor specializing in the Indian job market. Analyze resumes and provide detailed, actionable feedback. Always respond with valid JSON format.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 4000,
              temperature: 0.3,
              response_format: { type: "json_object" }
            }),
          });
        } else {
          // Use Azure OpenAI
          response = await fetch(
            `${this.endpoint}openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey,
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert ATS (Applicant Tracking System) analyzer and career counselor specializing in the Indian job market. Analyze resumes and provide detailed, actionable feedback. Always respond with valid JSON format.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                max_tokens: 4000,
                temperature: 0.3,
                response_format: { type: "json_object" }
              }),
            }
          );
        }

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle rate limit with exponential backoff
          if (response.status === 429 && attempt < MAX_RETRIES) {
            const delayMs = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
            toast.warning('Rate Limited - Retrying', {
              description: `API rate limit hit. Retrying in ${Math.ceil(delayMs / 1000)} seconds... (Attempt ${attempt + 1}/${MAX_RETRIES})`,
              duration: 3000,
            });
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue; // Retry the request
          }
          
          throw new Error(`${this.useOpenAI ? 'OpenAI' : 'Azure OpenAI'} API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error(`Invalid response format from ${this.useOpenAI ? 'OpenAI' : 'Azure OpenAI'}`);
        }

        let analysisResult;
        try {
          analysisResult = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
          throw new Error('AI returned invalid JSON format');
        }
        
        return this.processAnalysisResult(analysisResult, request);
        
      } catch (error: any) {
        // If it's not a rate limit error or we've exhausted retries, throw immediately
        if (!error.message.includes('429') || attempt === MAX_RETRIES) {
          
          // Provide more specific error messages
          let errorMessage = 'Failed to analyze resume with AI. Please try again.';
          if (error.message.includes('configuration')) {
            errorMessage = 'AI service configuration error. Please contact support.';
          } else if (error.message.includes('API error: 401')) {
            errorMessage = 'AI service authentication failed. Please contact support.';
          } else if (error.message.includes('API error: 429')) {
            errorMessage = `Rate limit exceeded after ${MAX_RETRIES} retries. Please try again in a few minutes.`;
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          }
          
          toast.error('AI Analysis Failed', {
            description: errorMessage,
          });
          throw error;
        }
      }
    }
  }

  private createAnalysisPrompt(request: ResumeAnalysisRequest): string {
    return `
Analyze this resume for ATS compatibility and career fit. CRITICALLY IMPORTANT: Extract ALL skills that are explicitly mentioned in the resume text. Be thorough and comprehensive.

RESUME TEXT:
${request.resumeText}

TARGET ROLES: ${request.targetRoles.join(', ')}
USER'S CURRENT SKILLS: ${request.userSkills.join(', ')}

CRITICAL INSTRUCTIONS FOR SKILL EXTRACTION:
1. EXTRACT ALL SKILLS explicitly written in the resume - search thoroughly word by word
2. Do NOT infer or assume skills that are not mentioned
3. Do NOT add skills based on job titles or company names alone  
4. Look for exact mentions of: programming languages, frameworks, libraries, tools, platforms, databases, cloud services, methodologies
5. IMPORTANT: Include common skill variations together:
   - "HTML" and "HTML5" are the same - extract as "HTML5" or list both
   - "CSS" and "CSS3" are the same - extract as "CSS3" or list both
   - "JS" = "JavaScript" - extract as "JavaScript"
   - "Node" = "Node.js" - extract as "Node.js"
   - "React.js" = "React" - extract as "React"
   - "Database" matches MySQL, PostgreSQL, MongoDB, Oracle, etc.
6. DO NOT be conservative - if there's reasonable evidence of a skill, include it
7. MUST CHECK FOR THESE COMMON SKILLS:
   - Frontend: HTML, HTML5, CSS, CSS3, JavaScript, JS, React, Angular, Vue, Next.js, TypeScript, Bootstrap, Tailwind, Sass, Webpack, Vite
   - Backend: Node.js, Express, Python, Django, Flask, Java, Spring Boot, C#, ASP.NET, PHP, Laravel, Ruby, Go
   - Databases: MySQL, PostgreSQL, MongoDB, Redis, Oracle, SQL, NoSQL, DynamoDB, Elasticsearch, SQLite
   - Cloud/DevOps: AWS, Azure, Google Cloud, GCP, Docker, Kubernetes, K8s, CI/CD, Jenkins, GitHub Actions, Terraform
   - Testing: Jest, Cypress, Selenium, JUnit, PyTest, Mocha, Unit Testing, E2E Testing
   - Tools & Control: Git, GitHub, GitLab, JIRA, Postman, VS Code, IntelliJ, Figma, Adobe XD
   - Concepts: REST API, GraphQL, Microservices, Machine Learning, AI, Agile, Scrum, DevOps
8. Return ALL found skills - it's better to be comprehensive than to miss important ones

KEYWORD ANALYSIS INSTRUCTIONS:
1. "found" keywords should ONLY be skills actually present in the resume text
2. "missing" keywords should be important skills for target roles that are NOT in the resume
3. Calculate density as: (found keywords / total target skills) × 100

Please provide analysis in this exact JSON structure:
{
  "overallScore": number (0-100, based on ATS compatibility: contact info, sections, keyword density, formatting),
  "extractedSkills": ["skill1", "skill2", "skill3", ...] (ONLY skills explicitly found in resume text - be thorough),
  "sections": {
    "contactInfo": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"},
    "summary": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"},
    "experience": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"},
    "skills": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"},
    "education": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"},
    "keywords": {"score": number, "status": "excellent|good|needs-improvement", "feedback": "string"}
  },
  "roleAnalysis": [
    {
      "role": "string",
      "score": number (0-100, based on skill matches with extracted skills only),
      "matchedSkills": ["skill1", "skill2", ...] (only from extractedSkills),
      "missingSkills": ["skill1", "skill2", ...] (required for role but not in resume),
      "reasoning": "string explaining the match percentage based on actual skills found"
    }
  ],
  "suggestedRole": {
    "role": "string (best matching role based on extracted skills)",
    "score": number,
    "reasoning": "string explaining why this role is suggested based on actual resume content"
  },
  "strengths": ["strength1", "strength2", ...] (based on actual resume content),
  "weaknesses": ["weakness1", "weakness2", ...] (based on missing elements for target roles),
  "suggestions": ["suggestion1", "suggestion2", ...] (actionable improvements specific to target roles),
  "keywordAnalysis": {
    "found": ["keyword1", "keyword2", ...] (ONLY keywords actually in resume),
    "missing": ["keyword1", "keyword2", ...] (important for target roles but missing from resume),
    "density": number (percentage of target role keywords found in resume, 0-100)
  }
}

IMPORTANT REMINDERS:
- Be thorough in skill extraction - search the entire resume text for all technical skills
- Only include skills that are clearly mentioned (not inferred)
- Provide specific, actionable feedback
- Focus on Indian job market standards
- Ensure all arrays contain actual extracted data, not placeholders

REMEMBER: Better to extract many skills accurately than miss important ones. Only be conservative if truly unsure.
`;
  }

  private processAnalysisResult(analysisResult: any, request: ResumeAnalysisRequest): ResumeAnalysisResult {
    // Start with AI extracted skills
    let extractedSkills = analysisResult.extractedSkills || [];
    
    // ALWAYS run fallback extraction to catch any skills AI might have missed
    const fallbackSkills = this.fallbackSkillExtraction(request.resumeText);
    
    // Merge both - AI skills + fallback skills, keeping unique entries
    const allSkills = new Set<string>();
    extractedSkills.forEach(skill => allSkills.add(skill));
    fallbackSkills.forEach(skill => allSkills.add(skill));
    
    extractedSkills = Array.from(allSkills);
    
    // If somehow still empty, use user profile skills as last resort
    if (extractedSkills.length === 0 && request.userSkills.length > 0) {
      extractedSkills = request.userSkills;
    }

    // Verify skills are actually in the resume text
    const verifiedSkills = this.verifySkillsInResume(extractedSkills, request.resumeText);
    
    // Generate proper keyword analysis based on target roles and verified skills
    const keywordAnalysis = this.generateKeywordAnalysis(verifiedSkills, request.targetRoles, request.resumeText);
    
    // Generate learning path based on missing skills and target roles
    const learningPath = this.generateLearningPath(analysisResult.roleAnalysis, request.targetRoles);
    
    // Analyze all roles to find best matches using verified skills
    const allRoles = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps Engineer", "Mobile Developer", "UI/UX Designer", "Product Manager", "QA Engineer", "Data Analyst", "Machine Learning Engineer", "Cloud Engineer"];
    
    const allRoleAnalysis = allRoles.map(role => {
      const roleMatch = this.analyzeRoleCompatibility(verifiedSkills, role);
      return {
        role,
        score: roleMatch.score,
        matchedSkills: roleMatch.matchedSkills,
        missingSkills: roleMatch.missingSkills,
        totalRequired: roleMatch.totalRequired,
        totalPreferred: roleMatch.totalPreferred,
        requiredMatched: roleMatch.requiredMatched,
        preferredMatched: roleMatch.preferredMatched,
        matchDetails: roleMatch.matchDetails
      };
    }).sort((a, b) => b.score - a.score);

    // Find best match (highest scoring role)
    const bestMatch = allRoleAnalysis[0];

    // Process user's target roles with verified skills
    const userRoleAnalysis = request.targetRoles.map(role => {
      const roleMatch = this.analyzeRoleCompatibility(verifiedSkills, role);
      return {
        role,
        score: roleMatch.score,
        matchedSkills: roleMatch.matchedSkills,
        missingSkills: roleMatch.missingSkills,
        totalRequired: roleMatch.totalRequired,
        totalPreferred: roleMatch.totalPreferred,
        requiredMatched: roleMatch.requiredMatched,
        preferredMatched: roleMatch.preferredMatched,
        matchDetails: roleMatch.matchDetails
      };
    });
    
    return {
      ...analysisResult,
      extractedSkills: verifiedSkills, // Use only verified skills
      roleAnalysis: userRoleAnalysis,
      allRoleAnalysis,
      bestMatch,
      learningPath,
      keywordAnalysis, // Use our generated keyword analysis
      // Debug information
      resumeTextLength: request.resumeText.length,
      extractionMethod: verifiedSkills.length > 0 ? 'AI + Verification' : 'Fallback Only',
      originalExtractedCount: extractedSkills.length,
      verifiedCount: verifiedSkills.length,
      // Ensure all required fields exist with defaults
      overallScore: analysisResult.overallScore || 0,
      sections: analysisResult.sections || {},
      strengths: analysisResult.strengths || [],
      weaknesses: analysisResult.weaknesses || [],
      suggestions: analysisResult.suggestions || []
    };
  }

  // Verify that extracted skills are actually present in the resume text
  private verifySkillsInResume(extractedSkills: string[], resumeText: string): string[] {
    const resumeTextLower = resumeText.toLowerCase();
    const verifiedSkills: string[] = [];

    // Map of skill variations to handle synonyms and abbreviations
    const skillVariations: { [key: string]: string[] } = {
      // Frontend Skills - bidirectional matching
      'HTML5': ['html5', 'html', 'hypertext markup language'],
      'HTML': ['html', 'html5', 'hypertext markup language'],
      'CSS3': ['css3', 'css', 'cascading style sheets'],
      'CSS': ['css', 'css3', 'cascading style sheets'],
      
      // Programming Languages
      'JavaScript': ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020'],
      'JS': ['javascript', 'js', 'ecmascript'],
      'TypeScript': ['typescript', 'ts'],
      'Python': ['python', 'python3', 'python 3'],
      'Java': ['java', 'j2ee', 'java enterprise'],
      'C++': ['c++', 'cpp', 'c plus plus'],
      'C#': ['c#', 'csharp', 'c sharp', 'dotnet'],
      'Ruby': ['ruby', 'ruby on rails'],
      'PHP': ['php', 'php7', 'php8'],
      'Go': ['golang', 'go'],
      'Rust': ['rust'],
      
      // Frontend Frameworks
      'React': ['react', 'reactjs', 'react.js'],
      'Angular': ['angular', 'angularjs', 'angular.js'],
      'Vue': ['vue', 'vuejs', 'vue.js'],
      'Svelte': ['svelte'],
      'Next.js': ['next.js', 'nextjs', 'next'],
      
      // Backend/Runtime
      'Node.js': ['node.js', 'nodejs', 'node'],
      'Express': ['express', 'expressjs'],
      'Django': ['django'],
      'Flask': ['flask'],
      'Spring': ['spring', 'spring boot', 'spring framework'],
      
      // Databases - KEY FIX: Database skill matches specific databases
      'Database': ['database', 'sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'mongodb', 'nosql', 'mariadb', 'sqlite'],
      'SQL': ['sql', 'tsql', 't-sql', 'database'],
      'MySQL': ['mysql', 'database', 'relational database'],
      'PostgreSQL': ['postgresql', 'postgres', 'database'],
      'Oracle': ['oracle', 'database', 'oracle database'],
      'MongoDB': ['mongodb', 'mongo', 'nosql', 'database'],
      'NoSQL': ['nosql', 'mongodb', 'redis', 'database'],
      
      // Tools & Version Control
      'Git': ['git', 'github', 'gitlab', 'gitbucket', 'version control'],
      'GitHub': ['github', 'git'],
      'GitLab': ['gitlab', 'git'],
      
      // DevOps & Cloud
      'Docker': ['docker', 'containerization', 'containers'],
      'Kubernetes': ['kubernetes', 'k8s'],
      'AWS': ['aws', 'amazon', 'amazon web services', 'ec2', 's3'],
      'Azure': ['azure', 'microsoft azure'],
      'GCP': ['gcp', 'google cloud', 'google cloud platform'],
      'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment', 'jenkins', 'gitlab ci', 'github actions'],
      
      // APIs & Services
      'REST API': ['rest api', 'rest', 'restful', 'restful api'],
      'API': ['api', 'rest api', 'rest', 'restful', 'web api', 'application programming interface'],
      'GraphQL': ['graphql', 'graph ql'],
      'WebSocket': ['websocket', 'socket.io'],
      
      // Testing & Quality
      'Testing': ['testing', 'unit test', 'jest', 'mocha', 'selenium', 'cypress'],
      'Jest': ['jest', 'testing'],
      'Selenium': ['selenium', 'testing'],
      
      // Data & ML
      'Machine Learning': ['machine learning', 'ml', 'artificial intelligence', 'ai', 'tensorflow', 'pytorch'],
      'Pandas': ['pandas', 'data analysis', 'python'],
      'NumPy': ['numpy', 'numerical python'],
      
      // Other Popular Skills
      'Agile': ['agile', 'scrum', 'kanban'],
      'Scrum': ['scrum', 'agile'],
      'Linux': ['linux', 'ubuntu', 'centos'],
      'Responsive Design': ['responsive', 'responsive design', 'mobile first'],
    };

    extractedSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      try {
        // Get variations for this skill
        const variations = skillVariations[skill] || [skillLower];
        
        // Create comprehensive search patterns
        const searchPatterns = [
          ...variations,
          skillLower,
          skillLower.replace(/\./g, ''),
          skillLower.replace(/\s/g, ''),
          skillLower.replace(/-/g, '')
        ];

        // Check if any pattern exists in the resume
        const isFound = searchPatterns.some(pattern => {
          if (pattern.length < 2) return false;
          
          try {
            // Properly escape special regex characters
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedPattern}\\b`, 'i');
            return regex.test(resumeText);
          } catch (regexError) {
            // Fallback to simple string matching if regex fails
            return resumeTextLower.includes(pattern);
          }
        });

        if (isFound) {
          verifiedSkills.push(skill);
          console.log(`✓ Verified skill: ${skill}`);
        }
      } catch (error) {
        console.warn(`Error verifying skill "${skill}":`, error);
        // Fallback to simple string matching
        if (resumeTextLower.includes(skillLower)) {
          verifiedSkills.push(skill);
        }
      }
    });

    return verifiedSkills;
  }

  // Generate accurate keyword analysis based on target roles and actual resume content
  private generateKeywordAnalysis(verifiedSkills: string[], targetRoles: string[], resumeText: string) {
    // Get all required and preferred skills for target roles
    const allTargetSkills = new Set<string>();
    
    targetRoles.forEach(role => {
      const roleReqs = this.getRoleRequirements(role);
      if (roleReqs) {
        roleReqs.required.forEach((skill: string) => allTargetSkills.add(skill));
        roleReqs.preferred.forEach((skill: string) => allTargetSkills.add(skill));
      }
    });

    // Found keywords are the intersection of verified skills and target skills
    const foundKeywords = verifiedSkills.filter(skill => 
      Array.from(allTargetSkills).some(targetSkill => 
        targetSkill.toLowerCase() === skill.toLowerCase() ||
        this.isSkillMatch(skill, targetSkill)
      )
    );

    // Missing keywords are target skills not found in resume
    const missingKeywords = Array.from(allTargetSkills).filter(targetSkill =>
      !verifiedSkills.some(skill => 
        skill.toLowerCase() === targetSkill.toLowerCase() ||
        this.isSkillMatch(skill, targetSkill)
      )
    );

    // Calculate keyword density
    const totalTargetKeywords = allTargetSkills.size;
    const density = totalTargetKeywords > 0 ? (foundKeywords.length / totalTargetKeywords) * 100 : 0;

    return {
      found: foundKeywords,
      missing: missingKeywords,
      density: Math.round(density * 10) / 10 // Round to 1 decimal place
    };
  }

  // Helper method to get role requirements
  private getRoleRequirements(role: string) {
    const roleSkillRequirements: { [key: string]: any } = {
      "Frontend Developer": {
        required: ["JavaScript", "HTML5", "CSS3", "React", "TypeScript", "Git"],
        preferred: ["Vue.js", "Angular", "Sass", "Webpack", "Testing", "Responsive Design"]
      },
      "Backend Developer": {
        required: ["Python", "Java", "Node.js", "Database", "API", "Git"],
        preferred: ["Docker", "Kubernetes", "Microservices", "Cloud", "Testing", "Security"]
      },
      "Full Stack Developer": {
        required: ["JavaScript", "HTML5", "CSS3", "Node.js", "Database", "Git"],
        preferred: ["React", "Python", "Docker", "Cloud", "Testing", "DevOps"]
      },
      "Data Scientist": {
        required: ["Python", "Machine Learning", "Pandas", "NumPy", "Statistics"],
        preferred: ["TensorFlow", "PyTorch", "SQL", "Tableau", "R", "Deep Learning"]
      },
      "DevOps Engineer": {
        required: ["Docker", "Kubernetes", "AWS", "Git", "Linux", "CI/CD"],
        preferred: ["Terraform", "Jenkins", "Monitoring", "Security", "Automation"]
      }
    };

    return roleSkillRequirements[role];
  }

  // Helper method to check if two skills match (considering aliases)
  private isSkillMatch(skill1: string, skill2: string): boolean {
    const skill1Lower = skill1.toLowerCase();
    const skill2Lower = skill2.toLowerCase();
    
    // Direct match
    if (skill1Lower === skill2Lower) return true;
    
    // Handle special characters safely
    const normalizeSkill = (skill: string) => {
      return skill.toLowerCase()
        .replace(/\+\+/g, 'plusplus')
        .replace(/#/g, 'sharp')
        .replace(/\*/g, 'star')
        .replace(/\./g, '')
        .replace(/\s/g, '')
        .replace(/-/g, '');
    };
    
    const normalized1 = normalizeSkill(skill1);
    const normalized2 = normalizeSkill(skill2);
    
    if (normalized1 === normalized2) return true;
    
    // Common aliases with safe matching
    const aliases: { [key: string]: string[] } = {
      'javascript': ['js', 'ecmascript'],
      'typescript': ['ts'],
      'css3': ['css'],
      'html5': ['html'],
      'nodejs': ['node', 'nodedotjs'],
      'react': ['reactjs', 'reactdotjs'],
      'vuejs': ['vue', 'vuedotjs'],
      'angular': ['angularjs'],
      'mongodb': ['mongo'],
      'postgresql': ['postgres'],
      'cicd': ['continuous integration', 'continuous deployment'],
      'cplusplus': ['cpp', 'cplus'],
      'csharp': ['cdotnet']
    };

    // Check if either skill is an alias of the other
    for (const [main, aliasList] of Object.entries(aliases)) {
      if ((normalized1 === main && aliasList.includes(normalized2)) ||
          (normalized2 === main && aliasList.includes(normalized1)) ||
          (aliasList.includes(normalized1) && aliasList.includes(normalized2))) {
        return true;
      }
    }

    return false;
  }

  // Simple skill matching for debugging
  public simpleSkillMatch(resumeText: string, skillsToCheck: string[]): { found: string[], missing: string[] } {
    const resumeTextLower = resumeText.toLowerCase();
    const found: string[] = [];
    const missing: string[] = [];
    
    skillsToCheck.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check multiple variations
      const variations = [
        skillLower,
        skillLower.replace(/\./g, ''),
        skillLower.replace(/\s/g, ''),
        skillLower.replace(/-/g, ''),
      ];
      
      // Add common aliases
      if (skillLower === 'javascript') variations.push('js');
      if (skillLower === 'node.js') variations.push('nodejs', 'node');
      if (skillLower === 'html5') variations.push('html');
      if (skillLower === 'css3') variations.push('css');
      if (skillLower === 'docker') variations.push('containerization', 'containers');
      if (skillLower === 'kubernetes') variations.push('k8s');
      if (skillLower === 'ci/cd') variations.push('continuous integration', 'continuous deployment');
      if (skillLower === 'git') variations.push('github', 'gitlab', 'version control');
      if (skillLower === 'database') variations.push('sql', 'mysql', 'postgresql', 'mongodb');
      if (skillLower === 'api') variations.push('rest', 'restful', 'rest api');
      
      const isFound = variations.some(variation => resumeTextLower.includes(variation));
      
      if (isFound) {
        found.push(skill);
      } else {
        missing.push(skill);
      }
    });
    
    return { found, missing };
  }
  private fallbackSkillExtraction(resumeText: string): string[] {
    
    const skillDatabase = [
      // Programming Languages
      { skill: 'JavaScript', aliases: ['js', 'javascript', 'ecmascript', 'es6', 'es2015', 'nodejs'] },
      { skill: 'Python', aliases: ['python', 'python3', 'py'] },
      { skill: 'Java', aliases: ['java', 'j2ee'] },
      { skill: 'TypeScript', aliases: ['ts', 'typescript'] },
      { skill: 'C++', aliases: ['cpp', 'c++', 'c plus plus'] },
      { skill: 'C#', aliases: ['csharp', 'c#', 'c sharp', '.net'] },
      { skill: 'PHP', aliases: ['php', 'php7', 'php8'] },
      { skill: 'Ruby', aliases: ['ruby', 'rails'] },
      { skill: 'Go', aliases: ['go', 'golang'] },
      { skill: 'Rust', aliases: ['rust'] },
      { skill: 'Swift', aliases: ['swift'] },
      { skill: 'Kotlin', aliases: ['kotlin'] },
      { skill: 'R', aliases: ['r programming', 'r studio'] },
      { skill: 'SQL', aliases: ['sql', 'tsql', 't-sql'] },
      
      // Frontend Technologies
      { skill: 'React', aliases: ['react', 'reactjs', 'react.js', 'react native'] },
      { skill: 'Angular', aliases: ['angular', 'angularjs'] },
      { skill: 'Vue', aliases: ['vue', 'vuejs', 'vue.js'] },
      { skill: 'Next.js', aliases: ['nextjs', 'next.js', 'next'] },
      { skill: 'HTML', aliases: ['html', 'html5'] },
      { skill: 'CSS', aliases: ['css', 'css3', 'scss', 'sass', 'less'] },
      { skill: 'Bootstrap', aliases: ['bootstrap'] },
      { skill: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind css'] },
      { skill: 'jQuery', aliases: ['jquery'] },
      { skill: 'Redux', aliases: ['redux'] },
      { skill: 'Webpack', aliases: ['webpack', 'bundler'] },
      { skill: 'Vite', aliases: ['vite'] },
      
      // Backend Technologies
      { skill: 'Node.js', aliases: ['nodejs', 'node', 'node.js'] },
      { skill: 'Express', aliases: ['express', 'express.js'] },
      { skill: 'Django', aliases: ['django'] },
      { skill: 'Flask', aliases: ['flask'] },
      { skill: 'FastAPI', aliases: ['fastapi'] },
      { skill: 'Spring', aliases: ['spring', 'spring boot', 'springboot'] },
      { skill: 'Spring Boot', aliases: ['spring boot', 'springboot'] },
      { skill: 'Hibernate', aliases: ['hibernate', 'orm'] },
      { skill: 'Laravel', aliases: ['laravel'] },
      { skill: 'ASP.NET', aliases: ['asp.net', 'aspnet'] },
      { skill: 'NestJS', aliases: ['nestjs', 'nest.js'] },
      { skill: 'Ruby on Rails', aliases: ['rails', 'ruby on rails'] },
      
      // Databases
      { skill: 'MySQL', aliases: ['mysql', 'my sql'] },
      { skill: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
      { skill: 'MongoDB', aliases: ['mongodb', 'mongo'] },
      { skill: 'Redis', aliases: ['redis'] },
      { skill: 'Oracle', aliases: ['oracle', 'oracledb'] },
      { skill: 'SQL Server', aliases: ['sql server', 'mssql'] },
      { skill: 'SQLite', aliases: ['sqlite'] },
      { skill: 'DynamoDB', aliases: ['dynamodb', 'dynamo'] },
      { skill: 'Cassandra', aliases: ['cassandra'] },
      { skill: 'Neo4j', aliases: ['neo4j', 'graph database'] },
      { skill: 'Elasticsearch', aliases: ['elasticsearch', 'elastic'] },
      
      // Cloud & DevOps
      { skill: 'AWS', aliases: ['aws', 'amazon', 'ec2', 's3', 'lambda', 'rds'] },
      { skill: 'Azure', aliases: ['azure', 'microsoft azure'] },
      { skill: 'Google Cloud', aliases: ['google cloud', 'gcp'] },
      { skill: 'Docker', aliases: ['docker', 'containerization'] },
      { skill: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
      { skill: 'Jenkins', aliases: ['jenkins'] },
      { skill: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'continuous deployment'] },
      { skill: 'Terraform', aliases: ['terraform', 'infrastructure as code'] },
      { skill: 'Ansible', aliases: ['ansible'] },
      { skill: 'GitHub Actions', aliases: ['github actions'] },
      { skill: 'GitLab CI', aliases: ['gitlab ci'] },
      
      // Version Control
      { skill: 'Git', aliases: ['git', 'version control'] },
      { skill: 'GitHub', aliases: ['github'] },
      { skill: 'GitLab', aliases: ['gitlab'] },
      { skill: 'Bitbucket', aliases: ['bitbucket'] },
      
      // Tools & Platforms
      { skill: 'JIRA', aliases: ['jira'] },
      { skill: 'Postman', aliases: ['postman'] },
      { skill: 'VS Code', aliases: ['vs code', 'vscode', 'visual studio code'] },
      { skill: 'IntelliJ', aliases: ['intellij', 'jetbrains'] },
      { skill: 'Eclipse', aliases: ['eclipse'] },
      { skill: 'Figma', aliases: ['figma'] },
      { skill: 'Adobe XD', aliases: ['adobe xd', 'xd'] },
      { skill: 'Photoshop', aliases: ['photoshop'] },
      
      // Methodologies
      { skill: 'Agile', aliases: ['agile', 'scrum', 'kanban'] },
      { skill: 'Scrum', aliases: ['scrum'] },
      { skill: 'TDD', aliases: ['tdd', 'test driven development'] },
      { skill: 'DevOps', aliases: ['devops'] },
      
      // Concepts & Patterns
      { skill: 'Microservices', aliases: ['microservices', 'microservice'] },
      { skill: 'REST API', aliases: ['rest', 'restful', 'rest api', 'api development'] },
      { skill: 'GraphQL', aliases: ['graphql'] },
      { skill: 'Machine Learning', aliases: ['machine learning', 'ml', 'ai'] },
      { skill: 'Deep Learning', aliases: ['deep learning', 'neural network'] },
      { skill: 'TensorFlow', aliases: ['tensorflow'] },
      { skill: 'PyTorch', aliases: ['pytorch'] },
      { skill: 'Pandas', aliases: ['pandas'] },
      { skill: 'NumPy', aliases: ['numpy'] },
      { skill: 'Scikit-learn', aliases: ['scikit-learn', 'sklearn'] },
      { skill: 'Blockchain', aliases: ['blockchain', 'web3'] },
      
      // Testing
      { skill: 'Jest', aliases: ['jest'] },
      { skill: 'Cypress', aliases: ['cypress'] },
      { skill: 'Selenium', aliases: ['selenium'] },
      { skill: 'JUnit', aliases: ['junit'] },
      { skill: 'PyTest', aliases: ['pytest'] },
      { skill: 'Mocha', aliases: ['mocha'] },
      { skill: 'Jasmine', aliases: ['jasmine'] },
      { skill: 'Unit Testing', aliases: ['unit test', 'unit testing'] },
      { skill: 'Integration Testing', aliases: ['integration test', 'integration testing'] },
      
      // Mobile Development
      { skill: 'React Native', aliases: ['react native'] },
      { skill: 'Flutter', aliases: ['flutter'] },
      { skill: 'iOS', aliases: ['ios', 'iphone'] },
      { skill: 'Android', aliases: ['android'] },
      { skill: 'Xamarin', aliases: ['xamarin'] },
      { skill: 'Ionic', aliases: ['ionic'] },
      
      // Operating Systems & Shell
      { skill: 'Linux', aliases: ['linux', 'ubuntu', 'centos'] },
      { skill: 'Windows', aliases: ['windows'] },
      { skill: 'macOS', aliases: ['macos', 'mac'] },
      { skill: 'Bash', aliases: ['bash', 'shell', 'sh'] },
      { skill: 'PowerShell', aliases: ['powershell'] },
      
      // Data & Analytics
      { skill: 'Tableau', aliases: ['tableau'] },
      { skill: 'Power BI', aliases: ['power bi', 'powerbi'] },
      { skill: 'Apache Spark', aliases: ['spark', 'apache spark'] },
      { skill: 'Hadoop', aliases: ['hadoop'] },
      { skill: 'Excel', aliases: ['excel'] },
      
      // Additional
      { skill: 'JSON', aliases: ['json'] },
      { skill: 'XML', aliases: ['xml'] },
      { skill: 'YAML', aliases: ['yaml'] },
      { skill: 'API', aliases: ['api', 'rest', 'endpoint'] },
      { skill: 'Database Design', aliases: ['database design', 'database architecture'] },
      { skill: 'System Design', aliases: ['system design', 'architecture'] },
    ];

    const extractedSkills: string[] = [];
    const resumeTextLower = resumeText.toLowerCase();
    const foundSkillsSet = new Set<string>();
    
    // First pass: Exact alias matching with word boundaries
    skillDatabase.forEach(skillEntry => {
      skillEntry.aliases.forEach(alias => {
        try {
          if (alias.length < 2) return;
          
          // Create word boundary regex
          const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedAlias}\\b`, 'gi');
          
          if (regex.test(resumeTextLower)) {
            foundSkillsSet.add(skillEntry.skill);
          }
        } catch (error) {
          // Fallback to simple string matching
          if (resumeTextLower.includes(alias.toLowerCase())) {
            foundSkillsSet.add(skillEntry.skill);
          }
        }
      });
    });

    // Convert set to array
    const uniqueSkills = Array.from(foundSkillsSet);
    
    return uniqueSkills.length > 0 ? uniqueSkills : [];
  }

  private analyzeRoleCompatibility(extractedSkills: string[], targetRole: string) {
    const roleSkillRequirements: { [key: string]: any } = {
      "Frontend Developer": {
        required: ["JavaScript", "HTML5", "CSS3", "React", "TypeScript", "Git"],
        preferred: ["Vue.js", "Angular", "Sass", "Webpack", "Testing", "Responsive Design"],
        skillAliases: {
          "JavaScript": ["JS", "ECMAScript", "ES6", "ES2015", "Javascript"],
          "TypeScript": ["TS", "Typescript"],
          "CSS3": ["CSS", "Cascading Style Sheets", "CSS3"],
          "HTML5": ["HTML", "Hypertext Markup Language", "HTML5"],
          "React": ["React.js", "ReactJS", "React Native"],
          "Vue.js": ["Vue", "VueJS", "Vue.js"],
          "Angular": ["AngularJS", "Angular2", "Angular4", "Angular6", "Angular8", "Angular10", "Angular12"],
          "Testing": ["Jest", "Cypress", "Mocha", "Jasmine", "Unit Testing", "E2E Testing", "Test Driven Development"],
          "Git": ["Version Control", "GitHub", "GitLab", "Bitbucket"],
          "Sass": ["SCSS", "Sass", "LESS"],
          "Webpack": ["Bundler", "Build Tools", "Vite", "Parcel"],
          "Responsive Design": ["Mobile First", "Responsive Web Design", "RWD", "Media Queries"]
        }
      },
      "Backend Developer": {
        required: ["Python", "Java", "Node.js", "Database", "API", "Git"],
        preferred: ["Docker", "Kubernetes", "Microservices", "Cloud", "Testing", "Security"],
        skillAliases: {
          "Python": ["Django", "Flask", "FastAPI", "Python3"],
          "Java": ["Spring", "Spring Boot", "Hibernate", "Maven", "Gradle"],
          "Node.js": ["NodeJS", "Express", "Express.js", "NestJS"],
          "Database": ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "SQL Server", "SQLite", "Redis", "DynamoDB", "SQL"],
          "API": ["REST API", "RESTful", "GraphQL", "Web API", "API Development"],
          "Git": ["Version Control", "GitHub", "GitLab", "Bitbucket"],
          "Docker": ["Containerization", "Container"],
          "Kubernetes": ["K8s", "Container Orchestration"],
          "Microservices": ["Microservice Architecture", "Service Oriented Architecture"],
          "Cloud": ["AWS", "Azure", "Google Cloud", "GCP", "Cloud Computing"],
          "Testing": ["Unit Testing", "Integration Testing", "API Testing", "Jest", "JUnit", "PyTest"],
          "Security": ["Authentication", "Authorization", "JWT", "OAuth", "HTTPS", "Encryption"]
        }
      },
      "Full Stack Developer": {
        required: ["JavaScript", "HTML5", "CSS3", "Node.js", "Database", "Git"],
        preferred: ["React", "Python", "Docker", "Cloud", "Testing", "DevOps"],
        skillAliases: {
          "JavaScript": ["JS", "ECMAScript", "ES6", "Javascript"],
          "HTML5": ["HTML", "HTML5"],
          "CSS3": ["CSS", "CSS3"],
          "Node.js": ["NodeJS", "Express", "Express.js", "NestJS"],
          "Database": ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "SQL Server", "SQLite", "Redis", "SQL"],
          "Git": ["Version Control", "GitHub", "GitLab", "Bitbucket"],
          "React": ["React.js", "ReactJS"],
          "Python": ["Django", "Flask", "FastAPI", "Python3"],
          "Docker": ["Containerization", "Container"],
          "Cloud": ["AWS", "Azure", "Google Cloud", "GCP"],
          "Testing": ["Jest", "Cypress", "Unit Testing", "Integration Testing", "E2E Testing"],
          "DevOps": ["Docker", "Kubernetes", "CI/CD", "Jenkins", "DevOps"]
        }
      },
      "Data Scientist": {
        required: ["Python", "Machine Learning", "Pandas", "NumPy", "Statistics"],
        preferred: ["TensorFlow", "PyTorch", "SQL", "Tableau", "R", "Deep Learning"],
        skillAliases: {
          "Python": ["Pandas", "NumPy", "Scikit-learn", "Matplotlib", "Seaborn", "Python3"],
          "Machine Learning": ["ML", "Artificial Intelligence", "AI", "Supervised Learning", "Unsupervised Learning"],
          "Statistics": ["Statistical Analysis", "Probability", "Hypothesis Testing", "Data Analysis"],
          "SQL": ["MySQL", "PostgreSQL", "Oracle", "SQL Server", "Database"],
          "Deep Learning": ["Neural Networks", "CNN", "RNN", "LSTM", "Transformer"],
          "TensorFlow": ["TF", "Keras"],
          "PyTorch": ["Torch"],
          "Tableau": ["Data Visualization", "Power BI", "Looker"],
          "R": ["R Programming", "R Studio"]
        }
      },
      "DevOps Engineer": {
        required: ["Docker", "Kubernetes", "AWS", "Git", "Linux", "CI/CD"],
        preferred: ["Terraform", "Jenkins", "Monitoring", "Security", "Automation"],
        skillAliases: {
          "Docker": ["Containerization", "Container"],
          "Kubernetes": ["K8s", "Container Orchestration"],
          "AWS": ["Amazon Web Services", "EC2", "S3", "Lambda"],
          "Git": ["Version Control", "GitHub", "GitLab", "Bitbucket", "GitHub Actions"],
          "Linux": ["Ubuntu", "CentOS", "RHEL", "Unix", "Shell Scripting", "Bash"],
          "CI/CD": ["Continuous Integration", "Continuous Deployment", "Jenkins", "GitLab CI", "GitHub Actions"],
          "Terraform": ["Infrastructure as Code", "IaC"],
          "Jenkins": ["Build Automation", "CI/CD Pipeline"],
          "Monitoring": ["Prometheus", "Grafana", "ELK Stack", "CloudWatch"],
          "Security": ["DevSecOps", "Security Scanning", "Vulnerability Assessment"],
          "Automation": ["Scripting", "Process Automation", "Infrastructure Automation"]
        }
      },
      "Mobile Developer": {
        required: ["React Native", "Flutter", "iOS", "Android"],
        preferred: ["Swift", "Kotlin", "Xamarin", "Ionic"],
        skillAliases: {
          "React Native": ["RN", "React-Native"],
          "iOS": ["Swift", "Objective-C", "Xcode"],
          "Android": ["Kotlin", "Java", "Android Studio"],
          "Flutter": ["Dart"],
          "Xamarin": ["C#", ".NET"],
          "Ionic": ["Cordova", "PhoneGap"]
        }
      },
      "UI/UX Designer": {
        required: ["Figma", "Adobe XD", "Sketch", "Prototyping"],
        preferred: ["Photoshop", "Illustrator", "User Research", "Wireframing"],
        skillAliases: {
          "Figma": ["Design Tool"],
          "Adobe XD": ["XD", "Adobe Experience Design"],
          "Sketch": ["Sketch App"],
          "Prototyping": ["Interactive Design", "Mockups"],
          "User Research": ["UX Research", "User Testing"],
          "Wireframing": ["Wireframes", "Low-fidelity Design"]
        }
      },
      "Product Manager": {
        required: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Analytics"],
        preferred: ["Agile", "Scrum", "JIRA", "Market Research"],
        skillAliases: {
          "Product Strategy": ["Product Planning", "Strategic Planning"],
          "Roadmapping": ["Product Roadmap", "Feature Planning"],
          "Stakeholder Management": ["Communication", "Leadership"],
          "Analytics": ["Data Analysis", "Metrics", "KPIs"],
          "Market Research": ["Competitive Analysis", "User Research"]
        }
      },
      "QA Engineer": {
        required: ["Manual Testing", "Test Cases", "Bug Tracking", "Regression Testing"],
        preferred: ["Automation Testing", "Selenium", "API Testing", "Performance Testing"],
        skillAliases: {
          "Manual Testing": ["Functional Testing", "User Acceptance Testing"],
          "Test Cases": ["Test Planning", "Test Design"],
          "Bug Tracking": ["JIRA", "Bugzilla", "Defect Management"],
          "Automation Testing": ["Test Automation", "Automated Testing"],
          "Selenium": ["WebDriver", "Test Automation Framework"],
          "API Testing": ["Postman", "REST API Testing"],
          "Performance Testing": ["Load Testing", "Stress Testing"]
        }
      },
      "Data Analyst": {
        required: ["SQL", "Excel", "Data Visualization", "Statistics"],
        preferred: ["Python", "R", "Tableau", "Power BI"],
        skillAliases: {
          "SQL": ["MySQL", "PostgreSQL", "Database Queries"],
          "Excel": ["Microsoft Excel", "Spreadsheets"],
          "Data Visualization": ["Charts", "Graphs", "Dashboards"],
          "Statistics": ["Statistical Analysis", "Data Analysis"],
          "Tableau": ["Data Viz Tool"],
          "Power BI": ["Microsoft Power BI", "Business Intelligence"]
        }
      },
      "Machine Learning Engineer": {
        required: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Data Science"],
        preferred: ["Deep Learning", "MLOps", "AWS", "Docker", "Kubernetes"],
        skillAliases: {
          "Machine Learning": ["ML", "Artificial Intelligence", "AI"],
          "TensorFlow": ["TF", "Keras"],
          "PyTorch": ["Torch"],
          "Data Science": ["Data Analysis", "Statistics"],
          "Deep Learning": ["Neural Networks", "CNN", "RNN"],
          "MLOps": ["ML Operations", "Model Deployment"]
        }
      },
      "Cloud Engineer": {
        required: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform"],
        preferred: ["DevOps", "Monitoring", "Security", "Networking"],
        skillAliases: {
          "AWS": ["Amazon Web Services", "EC2", "S3", "Lambda"],
          "Azure": ["Microsoft Azure", "Azure Cloud"],
          "Google Cloud": ["GCP", "Google Cloud Platform"],
          "Docker": ["Containerization"],
          "Kubernetes": ["K8s", "Container Orchestration"],
          "Terraform": ["Infrastructure as Code", "IaC"],
          "Networking": ["VPC", "Load Balancing", "DNS"],
          "Security": ["IAM", "Security Groups", "Encryption"]
        }
      }
    };

    const roleReqs = roleSkillRequirements[targetRole];
    if (!roleReqs) return { 
      score: 0, 
      matchedSkills: [], 
      missingSkills: [], 
      matchDetails: [], 
      totalRequired: 0, 
      totalPreferred: 0, 
      requiredMatched: 0, 
      preferredMatched: 0 
    };

    const allRequiredSkills = [...roleReqs.required, ...roleReqs.preferred];
    const matchedSkills: string[] = [];
    const matchDetails: Array<{skill: string, found: string[], category: 'required' | 'preferred'}> = [];
    
    // More precise skill matching
    allRequiredSkills.forEach(requiredSkill => {
      const aliases = roleReqs.skillAliases?.[requiredSkill] || [];
      const allVariants = [requiredSkill, ...aliases];
      
      // Find exact or close matches with stricter criteria
      const foundVariants = extractedSkills.filter(extractedSkill => {
        const extractedLower = extractedSkill.toLowerCase().trim();
        
        return allVariants.some(variant => {
          const variantLower = variant.toLowerCase().trim();
          
          // Exact match (highest priority)
          if (extractedLower === variantLower) return true;
          
          // Partial match with minimum length requirement (avoid false positives)
          if (variantLower.length >= 3 && extractedLower.length >= 3) {
            // Check if one contains the other, but with reasonable length ratio
            const lengthRatio = Math.min(extractedLower.length, variantLower.length) / Math.max(extractedLower.length, variantLower.length);
            
            if (lengthRatio >= 0.6) { // At least 60% length similarity
              return extractedLower.includes(variantLower) || variantLower.includes(extractedLower);
            }
          }
          
          return false;
        });
      });

      if (foundVariants.length > 0) {
        matchedSkills.push(requiredSkill);
        matchDetails.push({
          skill: requiredSkill,
          found: [...new Set(foundVariants)], // Remove duplicates
          category: roleReqs.required.includes(requiredSkill) ? 'required' : 'preferred'
        });
      }
    });

    const missingRequired = roleReqs.required.filter((req: string) => !matchedSkills.includes(req));
    const missingPreferred = roleReqs.preferred.filter((pref: string) => !matchedSkills.includes(pref));
    
    // More realistic scoring: Required skills worth 80%, Preferred skills worth 20%
    const requiredMatchRatio = (roleReqs.required.length - missingRequired.length) / roleReqs.required.length;
    const preferredMatchRatio = (roleReqs.preferred.length - missingPreferred.length) / roleReqs.preferred.length;
    
    const requiredScore = requiredMatchRatio * 80;
    const preferredScore = preferredMatchRatio * 20;
    const totalScore = Math.min(98, requiredScore + preferredScore); // Cap at 98% to be more realistic
    
    return {
      score: Math.round(totalScore),
      matchedSkills,
      missingSkills: missingRequired,
      missingPreferred,
      matchDetails,
      totalRequired: roleReqs.required.length,
      totalPreferred: roleReqs.preferred.length,
      requiredMatched: roleReqs.required.length - missingRequired.length,
      preferredMatched: roleReqs.preferred.length - missingPreferred.length
    };
  }

  private generateLearningPath(roleAnalysis: any[], targetRoles: string[]): Array<{
    title: string;
    type: string;
    provider: string;
    url: string;
    duration: string;
  }> {
    const learningResources: { [key: string]: any[] } = {
      "Frontend Developer": [
        { title: "React Complete Course", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com/watch?v=RGKi6LSPDLU", duration: "6 hours" },
        { title: "JavaScript ES6+ Features", type: "course", provider: "freeCodeCamp", url: "https://freecodecamp.org", duration: "4 hours" },
        { title: "TypeScript for Beginners", type: "course", provider: "YouTube - Traversy Media", url: "https://youtube.com", duration: "3 hours" },
        { title: "CSS Grid & Flexbox", type: "course", provider: "YouTube - Traversy Media", url: "https://youtube.com", duration: "2 hours" },
        { title: "HTML5 Semantic Elements", type: "course", provider: "MDN Web Docs", url: "https://developer.mozilla.org", duration: "1 hour" },
        { title: "Git Version Control", type: "course", provider: "YouTube - Kunal Kushwaha", url: "https://youtube.com", duration: "2 hours" }
      ],
      "Backend Developer": [
        { title: "Node.js Complete Guide", type: "course", provider: "YouTube - Thapa Technical", url: "https://youtube.com", duration: "8 hours" },
        { title: "Python Django Tutorial", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com", duration: "10 hours" },
        { title: "Java Spring Boot", type: "course", provider: "YouTube - Java Brains", url: "https://youtube.com", duration: "12 hours" },
        { title: "Database Design & SQL", type: "course", provider: "Khan Academy", url: "https://khanacademy.org", duration: "5 hours" },
        { title: "REST API Development", type: "course", provider: "YouTube - Programming with Mosh", url: "https://youtube.com", duration: "4 hours" },
        { title: "MongoDB Tutorial", type: "course", provider: "YouTube - Net Ninja", url: "https://youtube.com", duration: "3 hours" }
      ],
      "Full Stack Developer": [
        { title: "MERN Stack Development", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com", duration: "12 hours" },
        { title: "Full Stack JavaScript", type: "course", provider: "freeCodeCamp", url: "https://freecodecamp.org", duration: "15 hours" },
        { title: "React + Node.js Project", type: "course", provider: "YouTube - Traversy Media", url: "https://youtube.com", duration: "8 hours" },
        { title: "Database Integration", type: "course", provider: "YouTube - Programming with Mosh", url: "https://youtube.com", duration: "6 hours" },
        { title: "System Design Fundamentals", type: "course", provider: "YouTube - Gaurav Sen", url: "https://youtube.com", duration: "8 hours" }
      ],
      "Data Scientist": [
        { title: "Python for Data Science", type: "course", provider: "YouTube - Krish Naik", url: "https://youtube.com", duration: "10 hours" },
        { title: "Machine Learning A-Z", type: "course", provider: "Udemy", url: "https://udemy.com", duration: "40 hours" },
        { title: "Pandas Complete Tutorial", type: "course", provider: "YouTube - Corey Schafer", url: "https://youtube.com", duration: "6 hours" },
        { title: "NumPy Fundamentals", type: "course", provider: "YouTube - Keith Galli", url: "https://youtube.com", duration: "4 hours" },
        { title: "Statistics for Data Science", type: "course", provider: "Khan Academy", url: "https://khanacademy.org", duration: "15 hours" }
      ],
      "DevOps Engineer": [
        { title: "Docker Complete Course", type: "course", provider: "YouTube - TechWorld with Nana", url: "https://youtube.com", duration: "4 hours" },
        { title: "Kubernetes Tutorial", type: "course", provider: "YouTube - Kunal Kushwaha", url: "https://youtube.com", duration: "8 hours" },
        { title: "AWS Fundamentals", type: "course", provider: "YouTube - Abhishek Veeramalla", url: "https://youtube.com", duration: "10 hours" },
        { title: "Linux Command Line", type: "course", provider: "YouTube - NetworkChuck", url: "https://youtube.com", duration: "5 hours" },
        { title: "CI/CD with Jenkins", type: "course", provider: "YouTube - Abhishek Veeramalla", url: "https://youtube.com", duration: "6 hours" }
      ],
      "Mobile Developer": [
        { title: "React Native Complete Course", type: "course", provider: "YouTube - Code with Harry", url: "https://youtube.com", duration: "12 hours" },
        { title: "Flutter Development", type: "course", provider: "YouTube - Net Ninja", url: "https://youtube.com", duration: "10 hours" },
        { title: "iOS Development with Swift", type: "course", provider: "YouTube - CodeWithChris", url: "https://youtube.com", duration: "15 hours" },
        { title: "Android Development", type: "course", provider: "YouTube - Coding in Flow", url: "https://youtube.com", duration: "20 hours" }
      ],
      "UI/UX Designer": [
        { title: "Figma Complete Course", type: "course", provider: "YouTube - AJ&Smart", url: "https://youtube.com", duration: "4 hours" },
        { title: "UI/UX Design Principles", type: "course", provider: "YouTube - Flux", url: "https://youtube.com", duration: "6 hours" },
        { title: "Adobe XD Tutorial", type: "course", provider: "YouTube - Adobe", url: "https://youtube.com", duration: "3 hours" },
        { title: "User Research Methods", type: "course", provider: "Coursera", url: "https://coursera.org", duration: "8 hours" }
      ]
    };

    // Get learning resources for the primary target role
    const primaryRole = targetRoles[0] || "Frontend Developer";
    let resources = learningResources[primaryRole] || learningResources["Frontend Developer"];
    
    // If we have role analysis, customize based on missing skills
    if (roleAnalysis && roleAnalysis.length > 0) {
      const customResources: any[] = [];
      
      roleAnalysis.forEach(role => {
        if (role.missingSkills && role.missingSkills.length > 0) {
          role.missingSkills.forEach((skill: string) => {
            const skillResources = this.getSkillSpecificCourses(skill);
            customResources.push(...skillResources);
          });
        }
      });
      
      // Combine role-specific and skill-specific resources
      if (customResources.length > 0) {
        resources = [...customResources.slice(0, 3), ...resources.slice(0, 2)];
      }
    }
    
    return resources.slice(0, 6); // Return top 6 resources
  }

  // Generate skill-specific courses for missing skills
  private getSkillSpecificCourses(skill: string): any[] {
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
      ],
      "Docker": [
        { title: "Docker Tutorial for Beginners", type: "course", provider: "YouTube - TechWorld with Nana", url: "https://youtube.com", duration: "3 hours" },
        { title: "Docker Compose Guide", type: "course", provider: "YouTube - NetworkChuck", url: "https://youtube.com", duration: "2 hours" }
      ],
      "Kubernetes": [
        { title: "Kubernetes Complete Course", type: "course", provider: "YouTube - Kunal Kushwaha", url: "https://youtube.com", duration: "8 hours" },
        { title: "Kubernetes for Beginners", type: "course", provider: "YouTube - TechWorld with Nana", url: "https://youtube.com", duration: "4 hours" }
      ],
      "AWS": [
        { title: "AWS Cloud Practitioner", type: "course", provider: "YouTube - Abhishek Veeramalla", url: "https://youtube.com", duration: "10 hours" },
        { title: "AWS Services Overview", type: "course", provider: "YouTube - freeCodeCamp", url: "https://youtube.com", duration: "12 hours" }
      ],
      "Git": [
        { title: "Git & GitHub Complete Course", type: "course", provider: "YouTube - Kunal Kushwaha", url: "https://youtube.com", duration: "3 hours" },
        { title: "Git Version Control", type: "course", provider: "YouTube - Traversy Media", url: "https://youtube.com", duration: "2 hours" }
      ],
      "Database": [
        { title: "SQL Complete Course", type: "course", provider: "YouTube - freeCodeCamp", url: "https://youtube.com", duration: "4 hours" },
        { title: "MongoDB Tutorial", type: "course", provider: "YouTube - Net Ninja", url: "https://youtube.com", duration: "3 hours" }
      ]
    };

    return skillCourses[skill] || [
      { title: `${skill} Fundamentals`, type: "course", provider: "YouTube", url: "https://youtube.com", duration: "3 hours" }
    ];
  }

  async extractTextFromFile(file: File): Promise<string> {
    try {
      console.log('🔍 Extracting text from file:', file.name);
      
      // Use the new document parser for better extraction
      const { documentParser } = await import('./documentParser');
      const parsedDoc = await documentParser.parseDocument(file);
      
      console.log('✅ Document parsed successfully');
      console.log('📊 Stats:', parsedDoc.metadata);
      console.log('🔑 Keywords found:', parsedDoc.keywords.length);
      console.log('🛠️ Skills found:', parsedDoc.skills.length);
      
      // Store extracted data for later use
      (this as any)._lastParsedDocument = parsedDoc;
      
      return parsedDoc.text;
    } catch (error) {
      console.error('❌ Document parsing failed:', error);
      
      // Fallback to old method
      console.log('🔄 Falling back to legacy extraction method...');
      return this.legacyExtractTextFromFile(file);
    }
  }

  // Renamed old method as fallback
  private async legacyExtractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (file.type === 'application/pdf') {
            // For PDF files, extract text using pdf-parse
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const text = await this.extractTextFromPDF(arrayBuffer);
            resolve(text);
          } else if (file.type.includes('document') || file.type.includes('wordprocessingml') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            // For Word documents, extract text
            const text = e.target?.result as string;
            const extracted = this.extractTextFromWord(text);
            if (!extracted || extracted.trim().length < 30) {
              throw new Error('Could not extract readable text from Word document. File may be corrupt or empty.');
            }
            resolve(extracted);
          } else {
            // For text-based files
            const text = e.target?.result as string;
            resolve(text);
          }
        } catch (error) {
          console.error('Error extracting text from file:', error);
          reject(new Error(`Failed to extract text: ${(error as Error).message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  private async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    console.log('Starting PDF text extraction, file size:', arrayBuffer.byteLength);
    
    try {
      // Dynamic import for pdf-parse to avoid build issues
      const pdfParseModule = await import('pdf-parse');
      // Handle both CommonJS and ES module exports
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      
      console.log('PDF-parse library loaded successfully');
      
      // Add options to improve text extraction
      const options = {
        // Normalize whitespace and clean up text
        normalizeWhitespace: true,
        // Don't include metadata that might interfere
        max: 0 // Extract all pages
      };
      
      const data = await pdfParse(arrayBuffer, options);
      
      console.log('PDF parsing completed:');
      console.log('- Pages:', data.numpages);
      console.log('- Text length:', data.text?.length || 0);
      console.log('- Info:', data.info);
      
      if (!data.text || data.text.trim().length === 0) {
        console.warn('PDF parsed but no text content found');
        throw new Error('No readable text found in PDF. This appears to be a scanned document or image-based PDF.');
      }
      
      // Clean up any PDF structure artifacts from the text
      let text = data.text.trim();
      
      // Remove common PDF structure elements while preserving actual content
      text = text.replace(/%PDF-[^\n]*/g, '');
      text = text.replace(/xref[^\n]*/g, '');
      text = text.replace(/trailer[^\n]*/g, '');
      text = text.replace(/startxref[^\n]*/g, '');
      text = text.replace(/endobj[^\n]*/g, '');
      text = text.replace(/<<|>>/g, '');
      text = text.replace(/\/[A-Z]+\s+/g, '');
      
      // Clean up remaining whitespace
      text = text.replace(/\n{3,}/g, '\n\n');
      text = text.trim();
      
      // If we still have content after cleanup, use it
      if (text.length < 30) {
        console.warn('PDF text too short after cleanup');
        throw new Error('Not enough readable text found in PDF. This appears to be a scanned document or image-based PDF.');
      }
      
      console.log('PDF text extraction successful');
      console.log('First 500 characters:', text.substring(0, 500));
      
      return text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      console.log('PDF-parse failed, trying alternative extraction methods');
      
      // Try alternative extraction method
      const alternativeText = await this.alternativePDFExtraction(arrayBuffer);
      
      if (alternativeText && alternativeText.length > 100 && !alternativeText.includes('PDF Processing Issue')) {
        console.log('Alternative PDF extraction successful');
        return alternativeText;
      }
      
      // If all methods fail, provide helpful error message
      throw new Error('Unable to extract text from this PDF. Please try: 1) Converting to Word document (.docx), 2) Using a PDF with selectable text (not scanned), 3) Simplifying the PDF format.');
    }
  }

  // Alternative PDF extraction method
  private async alternativePDFExtraction(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Try using PDF.js if available (browser environment)
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        console.log('Trying PDF.js extraction...');
        const pdfjsLib = (window as any).pdfjsLib;
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        if (fullText.trim().length > 0) {
          return fullText.trim();
        }
      }
    } catch (error) {
      console.warn('PDF.js extraction failed:', error);
    }
    
    // Fallback to manual extraction
    return this.fallbackPDFExtraction(arrayBuffer);
  }

  private fallbackPDFExtraction(arrayBuffer: ArrayBuffer): string {
    // Basic fallback for PDF text extraction
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(uint8Array);
    
    console.log('Fallback PDF extraction - raw text length:', text.length);
    console.log('First 500 chars of raw PDF:', text.substring(0, 500));
    
    // Try to extract readable text patterns from PDF
    const textMatches = text.match(/[A-Za-z0-9\s\.,;:!?\-@#$%^&*()_+=\[\]{}|\\<>\/~`'"]+/g);
    
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      console.log('Fallback extraction successful, length:', extractedText.length);
      return extractedText;
    }
    
    // If no readable text found, try different encoding
    try {
      const latin1Decoder = new TextDecoder('latin1');
      const latin1Text = latin1Decoder.decode(uint8Array);
      const latin1Matches = latin1Text.match(/[A-Za-z0-9\s\.,;:!?\-@#$%^&*()_+=\[\]{}|\\<>\/~`'"]+/g);
      
      if (latin1Matches && latin1Matches.length > 0) {
        const extractedText = latin1Matches.join(' ').replace(/\s+/g, ' ').trim();
        console.log('Latin1 fallback extraction successful, length:', extractedText.length);
        return extractedText;
      }
    } catch (error) {
      console.warn('Latin1 decoding failed:', error);
    }
    
    // Last resort - return a message indicating PDF processing issue
    console.warn('PDF text extraction failed - no readable text found');
    return `
    Resume Content Detected (PDF Processing Issue)
    
    This PDF file was uploaded but text extraction encountered difficulties.
    This might be because:
    - The PDF contains scanned images instead of selectable text
    - The PDF has complex formatting or encryption
    - The file might be corrupted
    
    For best results, please try:
    1. Converting your PDF to a Word document (.docx)
    2. Using a PDF with selectable text (not scanned images)
    3. Simplifying the PDF formatting
    
    File size: ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB
    `;
  }

  private extractTextFromWord(content: string): string {
    console.log('Extracting text from Word document...');
    
    let text = content;
    
    // Step 0: Handle different document formats
    // Check if it's binary Word format (starts with PK for zip) or XML
    const isZipFormat = content.charCodeAt(0) === 0x50 && content.charCodeAt(1) === 0x4B; // 'PK'
    
    if (isZipFormat) {
      console.log('Detected binary DOCX format, attempting text extraction from archive');
      // For binary DOCX, we can try to extract from document.xml which is text-based
      const docXmlMatch = content.match(/<document[^>]*>.*?<\/document>/s);
      if (docXmlMatch) {
        text = docXmlMatch[0];
      }
    }
    
    // Step 1: Remove XML namespace declarations and processing instructions
    text = text.replace(/xmlns[^=]*="[^"]*"/g, '');
    text = text.replace(/<\?[^?]*\?>/g, ''); // XML declarations
    
    // Step 2: Extract text from Word elements - preserve content structure
    // First, get all text nodes from w:t tags
    const textMatches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    if (textMatches.length > 0) {
      // If we have w:t tags, extract just the text content
      text = textMatches
        .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1'))
        .join(' ');
    } else {
      // Fallback: Remove Office Open XML specific tags while preserving text
      const tagsToRemove = [
        /<\/?w:p>/g,           // Paragraphs
        /<\/?w:t>/g,           // Text runs
        /<\/?w:r>/g,           // Runs
        /<\/?w:pPr>/g,         // Paragraph properties
        /<\/?w:rPr>/g,         // Run properties
        /<\/?w:tab>/g,         // Tabs
        /<\/?w:br>/g,          // Line breaks
        /<\/?wp:anchor>/g,     // Anchored objects
        /<\/?wp:inline>/g,     // Inline objects
        /<\/?pic:pic>/g,       // Pictures
        /<\/?a:p>/g,           // Drawing paragraphs
        /<w:[a-z]+[^>]*>/gi,   // All w: tags
        /<a:[a-z]+[^>]*>/gi,   // All a: tags
        /<pic:[a-z]+[^>]*>/gi, // All pic: tags
        /<wp:[a-z]+[^>]*>/gi,  // All wp: tags
        /<v:[a-z]+[^>]*>/gi,   // All v: tags
        /<o:[a-z]+[^>]*>/gi,   // All o: tags
        /<r:[a-z]+[^>]*>/gi    // All r: tags
      ];
      
      tagsToRemove.forEach(regex => {
        text = text.replace(regex, ' ');
      });
    }
    
    // Step 3: Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&quot;/g, '"')
               .replace(/&apos;/g, "'")
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&#\d+;/g, ' '); // Numeric entities
    
    // Step 4: Remove any remaining XML/HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Step 5: Clean up whitespace
    text = text.replace(/[\r\n\t]+/g, ' ')  // Multiple whitespace to single space
               .replace(/\s{2,}/g, ' ')    // Multiple spaces to single space
               .trim();
    
    console.log(`Word extraction: ${text.length} characters extracted`);
    
    if (text.length < 30) {
      throw new Error('Could not extract enough text from Word document. File may be corrupt, password-protected, or empty.');
    }
    
    return text;
  }
}

export const aiService = new AIService();
export type { ResumeAnalysisRequest, ResumeAnalysisResult, RoleMatch };