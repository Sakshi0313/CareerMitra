/**
 * Enhanced Document Parser for PDF and DOCX files
 * Extracts text and keywords with better accuracy
 */

interface ParsedDocument {
  text: string;
  keywords: string[];
  skills: string[];
  metadata: {
    wordCount: number;
    pageCount?: number;
    fileType: string;
    extractionMethod: string;
  };
}

interface SkillDatabase {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  languages: string[];
  certifications: string[];
}

// Comprehensive skill database for keyword matching
const SKILL_DATABASE: SkillDatabase = {
  technical: [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'HTML', 'CSS', 'SQL', 'NoSQL', 'GraphQL', 'R', 'MATLAB', 'Scala', 'Perl', 'Shell', 'Bash',
    
    // Web Technologies
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Next.js', 'Nuxt.js', 'Svelte', 'jQuery',
    'Bootstrap', 'Tailwind CSS', 'SASS', 'LESS', 'Webpack', 'Vite', 'Parcel',
    
    // Backend & Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase',
    'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Nginx', 'Apache',
    
    // Data & Analytics
    'Machine Learning', 'Deep Learning', 'Data Science', 'Big Data', 'Hadoop', 'Spark', 'Kafka',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Tableau', 'Power BI',
    
    // Mobile Development
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin', 'Ionic',
    
    // Testing & Quality
    'Jest', 'Cypress', 'Selenium', 'Playwright', 'Unit Testing', 'Integration Testing', 'E2E Testing',
    'Test Automation', 'Quality Assurance', 'Performance Testing'
  ],
  
  soft: [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Project Management', 'Time Management', 'Adaptability', 'Creativity', 'Innovation',
    'Collaboration', 'Mentoring', 'Public Speaking', 'Presentation Skills', 'Negotiation',
    'Customer Service', 'Analytical Thinking', 'Decision Making', 'Conflict Resolution',
    'Emotional Intelligence', 'Strategic Planning', 'Risk Management'
  ],
  
  tools: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Microsoft Teams',
    'Visual Studio Code', 'IntelliJ IDEA', 'Eclipse', 'Sublime Text', 'Atom',
    'Postman', 'Insomnia', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
    'Trello', 'Asana', 'Monday.com', 'Notion', 'Miro', 'Lucidchart'
  ],
  
  frameworks: [
    'Spring Framework', 'Hibernate', 'Struts', 'ASP.NET', '.NET Core', 'Entity Framework',
    'CodeIgniter', 'CakePHP', 'Symfony', 'Zend', 'Meteor', 'Ember.js', 'Backbone.js',
    'Material-UI', 'Ant Design', 'Chakra UI', 'Semantic UI', 'Foundation'
  ],
  
  languages: [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese',
    'Italian', 'Russian', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian'
  ],
  
  certifications: [
    'AWS Certified', 'Azure Certified', 'Google Cloud Certified', 'PMP', 'Scrum Master',
    'CISSP', 'CompTIA', 'Cisco Certified', 'Oracle Certified', 'Microsoft Certified',
    'Salesforce Certified', 'Kubernetes Certified', 'Docker Certified'
  ]
};

class DocumentParser {
  /**
   * Parse PDF file and extract text with keywords
   */
  async parsePDF(file: File): Promise<ParsedDocument> {
    try {
      console.log('🔍 Parsing PDF file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Dynamic import for pdf-parse
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      
      const options = {
        normalizeWhitespace: true,
        max: 0 // Extract all pages
      };
      
      const data = await pdfParse(arrayBuffer, options);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No readable text found in PDF. This may be a scanned document.');
      }
      
      // Clean up PDF text
      let text = this.cleanPDFText(data.text);
      
      // Extract keywords and skills
      const keywords = this.extractKeywords(text);
      const skills = this.extractSkills(text);
      
      console.log('✅ PDF parsed successfully');
      console.log('📊 Extracted', keywords.length, 'keywords and', skills.length, 'skills');
      
      return {
        text,
        keywords,
        skills,
        metadata: {
          wordCount: text.split(/\s+/).length,
          pageCount: data.numpages,
          fileType: 'PDF',
          extractionMethod: 'pdf-parse'
        }
      };
    } catch (error) {
      console.error('❌ PDF parsing failed:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
  
  /**
   * Parse DOCX file and extract text with keywords
   */
  async parseDOCX(file: File): Promise<ParsedDocument> {
    try {
      console.log('🔍 Parsing DOCX file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No readable text found in DOCX file.');
      }
      
      const text = result.value.trim();
      
      // Extract keywords and skills
      const keywords = this.extractKeywords(text);
      const skills = this.extractSkills(text);
      
      console.log('✅ DOCX parsed successfully');
      console.log('📊 Extracted', keywords.length, 'keywords and', skills.length, 'skills');
      
      if (result.messages.length > 0) {
        console.warn('⚠️ DOCX parsing warnings:', result.messages);
      }
      
      return {
        text,
        keywords,
        skills,
        metadata: {
          wordCount: text.split(/\s+/).length,
          fileType: 'DOCX',
          extractionMethod: 'mammoth'
        }
      };
    } catch (error) {
      console.error('❌ DOCX parsing failed:', error);
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }
  
  /**
   * Parse DOC file (legacy Word format)
   */
  async parseDOC(file: File): Promise<ParsedDocument> {
    try {
      console.log('🔍 Parsing DOC file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No readable text found in DOC file. Legacy format may not be fully supported.');
      }
      
      const text = result.value.trim();
      
      // Extract keywords and skills
      const keywords = this.extractKeywords(text);
      const skills = this.extractSkills(text);
      
      console.log('✅ DOC parsed successfully');
      console.log('📊 Extracted', keywords.length, 'keywords and', skills.length, 'skills');
      
      return {
        text,
        keywords,
        skills,
        metadata: {
          wordCount: text.split(/\s+/).length,
          fileType: 'DOC',
          extractionMethod: 'mammoth'
        }
      };
    } catch (error) {
      console.error('❌ DOC parsing failed:', error);
      throw new Error(`Failed to parse DOC: ${error.message}`);
    }
  }
  
  /**
   * Clean up PDF text artifacts
   */
  private cleanPDFText(text: string): string {
    // Remove PDF structure artifacts
    text = text.replace(/%PDF-[^\n]*/g, '');
    text = text.replace(/xref[^\n]*/g, '');
    text = text.replace(/trailer[^\n]*/g, '');
    text = text.replace(/startxref[^\n]*/g, '');
    text = text.replace(/endobj[^\n]*/g, '');
    text = text.replace(/<<|>>/g, '');
    text = text.replace(/\/[A-Z]+\s+/g, '');
    
    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\s{3,}/g, ' ');
    
    return text.trim();
  }
  
  /**
   * Extract keywords from text using NLP techniques
   */
  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    
    // Convert to lowercase for matching
    const lowerText = text.toLowerCase();
    
    // Extract all skill categories
    Object.values(SKILL_DATABASE).flat().forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check for exact matches and variations
      if (lowerText.includes(skillLower)) {
        keywords.add(skill);
      }
      
      // Check for variations (e.g., "React.js" vs "React")
      if (skill.includes('.')) {
        const baseSkill = skill.split('.')[0];
        if (lowerText.includes(baseSkill.toLowerCase())) {
          keywords.add(skill);
        }
      }
    });
    
    // Extract additional keywords using patterns
    const additionalKeywords = this.extractPatternKeywords(text);
    additionalKeywords.forEach(keyword => keywords.add(keyword));
    
    return Array.from(keywords).sort();
  }
  
  /**
   * Extract skills specifically from text
   */
  private extractSkills(text: string): string[] {
    const skills = new Set<string>();
    const lowerText = text.toLowerCase();
    
    // Technical skills
    SKILL_DATABASE.technical.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });
    
    // Tools and frameworks
    [...SKILL_DATABASE.tools, ...SKILL_DATABASE.frameworks].forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });
    
    return Array.from(skills).sort();
  }
  
  /**
   * Extract keywords using patterns (years of experience, etc.)
   */
  private extractPatternKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // Years of experience patterns
    const experiencePattern = /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi;
    const experienceMatches = text.match(experiencePattern);
    if (experienceMatches) {
      experienceMatches.forEach(match => {
        keywords.push(match.trim());
      });
    }
    
    // Degree patterns
    const degreePattern = /(bachelor|master|phd|doctorate|mba|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?)\s*(?:in|of)?\s*([a-z\s]+)/gi;
    const degreeMatches = text.match(degreePattern);
    if (degreeMatches) {
      degreeMatches.forEach(match => {
        keywords.push(match.trim());
      });
    }
    
    // Certification patterns
    const certPattern = /certified\s+([a-z\s]+)|([a-z\s]+)\s+certified/gi;
    const certMatches = text.match(certPattern);
    if (certMatches) {
      certMatches.forEach(match => {
        keywords.push(match.trim());
      });
    }
    
    return keywords;
  }
  
  /**
   * Main parsing function that handles all file types
   */
  async parseDocument(file: File): Promise<ParsedDocument> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.parsePDF(file);
    } else if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      return this.parseDOCX(file);
    } else if (fileType.includes('msword') || fileName.endsWith('.doc')) {
      return this.parseDOC(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF, DOC, or DOCX file.`);
    }
  }
  
  /**
   * Analyze skills gap for target roles
   */
  analyzeSkillsGap(extractedSkills: string[], targetRole: string): {
    matchingSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
    recommendations: string[];
  } {
    // Define role-specific skill requirements
    const roleRequirements = this.getRoleRequirements(targetRole);
    
    const matchingSkills = extractedSkills.filter(skill => 
      roleRequirements.some(req => req.toLowerCase() === skill.toLowerCase())
    );
    
    const missingSkills = roleRequirements.filter(req => 
      !extractedSkills.some(skill => skill.toLowerCase() === req.toLowerCase())
    );
    
    const matchPercentage = Math.round((matchingSkills.length / roleRequirements.length) * 100);
    
    const recommendations = this.generateRecommendations(missingSkills, targetRole);
    
    return {
      matchingSkills,
      missingSkills,
      matchPercentage,
      recommendations
    };
  }
  
  /**
   * Get skill requirements for specific roles
   */
  private getRoleRequirements(role: string): string[] {
    const roleMap: { [key: string]: string[] } = {
      'frontend developer': ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript', 'Git', 'Responsive Design'],
      'backend developer': ['Node.js', 'Python', 'SQL', 'API Development', 'Git', 'Database Design'],
      'full stack developer': ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'API Development', 'HTML', 'CSS'],
      'data scientist': ['Python', 'Machine Learning', 'SQL', 'Pandas', 'NumPy', 'Statistics', 'Data Visualization'],
      'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Git', 'Infrastructure as Code'],
      'mobile developer': ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Mobile UI/UX'],
      'ui/ux designer': ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems', 'Usability Testing'],
      'product manager': ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmap Planning'],
      'software engineer': ['Programming', 'Data Structures', 'Algorithms', 'System Design', 'Git', 'Testing']
    };
    
    const normalizedRole = role.toLowerCase();
    return roleMap[normalizedRole] || roleMap['software engineer'];
  }
  
  /**
   * Generate skill recommendations
   */
  private generateRecommendations(missingSkills: string[], targetRole: string): string[] {
    const recommendations: string[] = [];
    
    missingSkills.slice(0, 5).forEach(skill => {
      recommendations.push(`Learn ${skill} to improve your ${targetRole} profile`);
    });
    
    if (missingSkills.length > 5) {
      recommendations.push(`Focus on ${missingSkills.length - 5} additional skills for comprehensive expertise`);
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const documentParser = new DocumentParser();
export type { ParsedDocument, SkillDatabase };