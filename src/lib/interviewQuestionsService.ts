export interface InterviewQA {
  question: string;
  category: 'hr' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard';
  goodAnswer: string;
  keyPoints: string[];
  tips: string[];
}

export interface InterviewQuestionsExport {
  role: string;
  difficulty: string;
  questions: InterviewQA[];
  generatedAt: Date;
}

class InterviewQuestionsService {
  
  // Get comprehensive interview questions with good answers for a role
  getInterviewQuestionsWithAnswers(role: string, difficulty: string): InterviewQuestionsExport {
    const questions = this.generateQuestionsWithAnswers(role, difficulty);
    
    return {
      role,
      difficulty,
      questions,
      generatedAt: new Date()
    };
  }

  private generateQuestionsWithAnswers(role: string, difficulty: string): InterviewQA[] {
    const hrQuestions = this.getHRQuestionsWithAnswers(difficulty);
    const technicalQuestions = this.getTechnicalQuestionsWithAnswers(role, difficulty);
    
    return [...hrQuestions, ...technicalQuestions];
  }

  private getHRQuestionsWithAnswers(difficulty: string): InterviewQA[] {
    const baseQuestions: InterviewQA[] = [
      {
        question: "Tell me about yourself.",
        category: 'hr',
        difficulty: difficulty as any,
        goodAnswer: "I'm a passionate software developer with [X] years of experience in [specific technologies]. I've worked on [specific projects/achievements] and I'm particularly interested in [relevant area]. I'm excited about this opportunity because [connection to role/company].",
        keyPoints: [
          "Keep it professional and relevant",
          "Focus on recent experience",
          "Connect to the role you're applying for",
          "Be concise (2-3 minutes max)"
        ],
        tips: [
          "Practice this answer beforehand",
          "Don't recite your entire resume",
          "End with why you're interested in this role"
        ]
      },
      {
        question: "Why do you want to work here?",
        category: 'hr',
        difficulty: difficulty as any,
        goodAnswer: "I'm impressed by [specific company achievement/product/mission]. Your focus on [relevant company value] aligns with my career goals. I've researched your recent [project/expansion/innovation] and I believe my experience in [relevant skill] would contribute to your team's success.",
        keyPoints: [
          "Show you've researched the company",
          "Connect your skills to their needs",
          "Mention specific company achievements",
          "Align with company values"
        ],
        tips: [
          "Research the company thoroughly",
          "Avoid generic answers",
          "Be specific about what attracts you"
        ]
      },
      {
        question: "What are your strengths and weaknesses?",
        category: 'hr',
        difficulty: difficulty as any,
        goodAnswer: "My key strength is [specific strength with example]. For example, [concrete example]. As for weaknesses, I've been working on [genuine weakness] by [specific improvement actions]. I've seen improvement through [measurable result].",
        keyPoints: [
          "Choose relevant strengths",
          "Provide specific examples",
          "Choose real but improvable weaknesses",
          "Show how you're addressing weaknesses"
        ],
        tips: [
          "Don't say you have no weaknesses",
          "Don't choose strengths disguised as weaknesses",
          "Show self-awareness and growth mindset"
        ]
      }
    ];

    if (difficulty === 'medium' || difficulty === 'hard') {
      baseQuestions.push({
        question: "Describe a challenging situation you faced and how you handled it.",
        category: 'hr',
        difficulty: difficulty as any,
        goodAnswer: "In my previous role, I faced [specific challenge]. The situation was difficult because [context]. I approached it by [specific actions taken]. The result was [positive outcome with metrics if possible]. I learned [key learning] from this experience.",
        keyPoints: [
          "Use the STAR method (Situation, Task, Action, Result)",
          "Choose a work-related example",
          "Focus on your actions and decisions",
          "Highlight the positive outcome"
        ],
        tips: [
          "Prepare 2-3 STAR examples beforehand",
          "Choose examples that show problem-solving",
          "Don't blame others in your story"
        ]
      });
    }

    if (difficulty === 'hard') {
      baseQuestions.push({
        question: "Where do you see yourself in 5 years?",
        category: 'hr',
        difficulty: difficulty as any,
        goodAnswer: "In 5 years, I see myself having grown significantly in [relevant area]. I'd like to have mastered [specific skills/technologies] and taken on more [leadership/technical] responsibilities. I hope to have contributed to [type of projects/impact] and potentially be mentoring junior developers.",
        keyPoints: [
          "Show ambition but be realistic",
          "Align with potential career path at the company",
          "Focus on skills and contributions",
          "Show you plan to stay and grow"
        ],
        tips: [
          "Research typical career progression",
          "Don't mention other companies",
          "Show you're thinking long-term"
        ]
      });
    }

    return baseQuestions;
  }

  private getTechnicalQuestionsWithAnswers(role: string, difficulty: string): InterviewQA[] {
    switch (role.toLowerCase()) {
      case 'frontend':
        return this.getFrontendQuestions(difficulty);
      case 'backend':
        return this.getBackendQuestions(difficulty);
      case 'fullstack':
        return this.getFullstackQuestions(difficulty);
      case 'mobile':
        return this.getMobileQuestions(difficulty);
      case 'devops':
        return this.getDevOpsQuestions(difficulty);
      case 'data-science':
        return this.getDataScienceQuestions(difficulty);
      case 'qa-engineer':
        return this.getQAEngineerQuestions(difficulty);
      case 'ui-ux-designer':
        return this.getUIUXDesignerQuestions(difficulty);
      case 'product-manager':
        return this.getProductManagerQuestions(difficulty);
      case 'business-analyst':
        return this.getBusinessAnalystQuestions(difficulty);
      case 'cybersecurity':
        return this.getCybersecurityQuestions(difficulty);
      case 'cloud-engineer':
        return this.getCloudEngineerQuestions(difficulty);
      case 'machine-learning':
        return this.getMachineLearningQuestions(difficulty);
      case 'game-developer':
        return this.getGameDeveloperQuestions(difficulty);
      case 'blockchain-developer':
        return this.getBlockchainDeveloperQuestions(difficulty);
      case 'software-engineer':
        return this.getSoftwareEngineerQuestions(difficulty);
      case 'data-analyst':
        return this.getDataAnalystQuestions(difficulty);
      case 'technical-writer':
        return this.getTechnicalWriterQuestions(difficulty);
      case 'sales-engineer':
        return this.getSalesEngineerQuestions(difficulty);
      case 'project-manager':
        return this.getProjectManagerQuestions(difficulty);
      default:
        return this.getGeneralTechQuestions(difficulty);
    }
  }

  private getFrontendQuestions(difficulty: string): InterviewQA[] {
    const questions: InterviewQA[] = [
      {
        question: "What's the difference between let, const, and var in JavaScript?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "var has function scope and is hoisted, let and const have block scope. const creates immutable bindings (can't be reassigned), while let allows reassignment. let and const are not hoisted in the same way as var - they exist in a 'temporal dead zone' until declared.",
        keyPoints: [
          "Scope differences (function vs block)",
          "Hoisting behavior",
          "Reassignment capabilities",
          "Temporal dead zone concept"
        ],
        tips: [
          "Provide examples to illustrate differences",
          "Mention best practices (prefer const, then let)",
          "Explain practical implications"
        ]
      },
      {
        question: "How does the virtual DOM work in React?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "The virtual DOM is a JavaScript representation of the actual DOM. When state changes, React creates a new virtual DOM tree, compares it with the previous tree (diffing), and updates only the changed elements in the real DOM (reconciliation). This makes updates more efficient.",
        keyPoints: [
          "Virtual DOM is a JS representation",
          "Diffing algorithm compares trees",
          "Reconciliation updates real DOM",
          "Performance benefits"
        ],
        tips: [
          "Explain the performance benefits",
          "Mention the diffing algorithm",
          "Compare with direct DOM manipulation"
        ]
      }
    ];

    if (difficulty === 'medium' || difficulty === 'hard') {
      questions.push({
        question: "Explain CSS specificity and how it works.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "CSS specificity determines which styles are applied when multiple rules target the same element. It's calculated as: inline styles (1000), IDs (100), classes/attributes/pseudo-classes (10), and elements/pseudo-elements (1). Higher specificity wins. !important overrides specificity but should be used sparingly.",
        keyPoints: [
          "Specificity calculation system",
          "Order of precedence",
          "!important usage",
          "Best practices for managing specificity"
        ],
        tips: [
          "Give examples with calculations",
          "Mention cascade and inheritance",
          "Discuss strategies to avoid specificity wars"
        ]
      });
    }

    if (difficulty === 'hard') {
      questions.push({
        question: "How would you optimize a React application's performance?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "I'd use React.memo for component memoization, useMemo and useCallback for expensive calculations, code splitting with lazy loading, optimize bundle size, implement virtualization for large lists, use proper key props, avoid inline functions in render, and profile with React DevTools.",
        keyPoints: [
          "Memoization techniques",
          "Code splitting and lazy loading",
          "Bundle optimization",
          "Virtualization for large datasets",
          "Profiling and measurement"
        ],
        tips: [
          "Mention specific tools and techniques",
          "Discuss measurement and profiling",
          "Give real-world examples"
        ]
      });
    }

    return questions;
  }

  private getBackendQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What's the difference between SQL and NoSQL databases?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "SQL databases are relational, use structured schemas, support ACID transactions, and use SQL for queries. NoSQL databases are non-relational, have flexible schemas, scale horizontally better, and use various data models (document, key-value, graph). Choose based on data structure, scalability needs, and consistency requirements.",
        keyPoints: [
          "Relational vs non-relational structure",
          "Schema flexibility",
          "Scalability characteristics",
          "ACID vs BASE properties",
          "Use case considerations"
        ],
        tips: [
          "Give examples of each type",
          "Discuss when to use which",
          "Mention specific databases"
        ]
      },
      {
        question: "Explain RESTful API design principles.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "REST uses HTTP methods (GET, POST, PUT, DELETE) for operations, stateless communication, resource-based URLs, standard status codes, and JSON for data exchange. Key principles: uniform interface, stateless, cacheable, layered system, and code on demand (optional).",
        keyPoints: [
          "HTTP methods and their purposes",
          "Stateless communication",
          "Resource-based URL design",
          "Standard status codes",
          "REST architectural constraints"
        ],
        tips: [
          "Provide URL examples",
          "Explain status codes",
          "Discuss best practices"
        ]
      }
    ];
  }

  private getFullstackQuestions(difficulty: string): InterviewQA[] {
    return [
      ...this.getFrontendQuestions(difficulty).slice(0, 2),
      ...this.getBackendQuestions(difficulty).slice(0, 2),
      {
        question: "How do you handle authentication in a full-stack application?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "I'd implement JWT tokens for stateless authentication, store tokens securely (httpOnly cookies or secure storage), use refresh tokens for long-term sessions, implement proper password hashing (bcrypt), add rate limiting, and ensure HTTPS. For frontend, protect routes and handle token expiration gracefully.",
        keyPoints: [
          "JWT token implementation",
          "Secure token storage",
          "Password hashing",
          "Session management",
          "Security best practices"
        ],
        tips: [
          "Discuss security considerations",
          "Mention token refresh strategies",
          "Explain frontend route protection"
        ]
      }
    ];
  }

  private getMobileQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What's the difference between native and cross-platform mobile development?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Native development uses platform-specific languages (Swift/Objective-C for iOS, Kotlin/Java for Android) offering best performance and platform features. Cross-platform uses frameworks like React Native or Flutter, allowing code sharing but with some performance trade-offs and platform limitations.",
        keyPoints: [
          "Platform-specific vs shared codebase",
          "Performance considerations",
          "Access to native features",
          "Development time and cost",
          "Popular frameworks"
        ],
        tips: [
          "Compare specific frameworks",
          "Discuss use case scenarios",
          "Mention pros and cons of each approach"
        ]
      }
    ];
  }

  private getDevOpsQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "Explain the CI/CD pipeline and its benefits.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "CI/CD automates code integration, testing, and deployment. Continuous Integration merges code frequently with automated testing. Continuous Deployment automatically releases to production. Benefits include faster delivery, reduced errors, better collaboration, and quick feedback loops.",
        keyPoints: [
          "Continuous Integration process",
          "Continuous Deployment automation",
          "Automated testing integration",
          "Benefits and outcomes",
          "Tools and best practices"
        ],
        tips: [
          "Mention specific tools (Jenkins, GitHub Actions)",
          "Discuss pipeline stages",
          "Explain testing strategies"
        ]
      }
    ];
  }

  private getDataScienceQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "Explain the difference between supervised and unsupervised learning.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Supervised learning uses labeled training data to predict outcomes (classification/regression). Examples: email spam detection, price prediction. Unsupervised learning finds patterns in unlabeled data through clustering, association, or dimensionality reduction. Examples: customer segmentation, anomaly detection.",
        keyPoints: [
          "Labeled vs unlabeled data",
          "Prediction vs pattern discovery",
          "Classification and regression",
          "Clustering and association",
          "Real-world applications"
        ],
        tips: [
          "Provide concrete examples",
          "Mention specific algorithms",
          "Discuss when to use each approach"
        ]
      }
    ];
  }

  private getGeneralTechQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you approach debugging a complex technical issue?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "I start by reproducing the issue consistently, then gather information (logs, error messages, environment details). I use systematic approaches like binary search to isolate the problem, check recent changes, use debugging tools, and document findings. I also consider asking colleagues for fresh perspectives.",
        keyPoints: [
          "Systematic problem-solving approach",
          "Information gathering",
          "Isolation techniques",
          "Tool utilization",
          "Collaboration and documentation"
        ],
        tips: [
          "Mention specific debugging tools",
          "Discuss documentation importance",
          "Show logical thinking process"
        ]
      }
    ];
  }

  // Export to text format
  exportToText(data: InterviewQuestionsExport): string {
    let text = `INTERVIEW QUESTIONS & ANSWERS\n`;
    text += `Role: ${data.role}\n`;
    text += `Difficulty: ${data.difficulty}\n`;
    text += `Generated: ${data.generatedAt.toLocaleDateString()}\n`;
    text += `\n${'='.repeat(50)}\n\n`;

    data.questions.forEach((qa, index) => {
      text += `${index + 1}. ${qa.question}\n`;
      text += `Category: ${qa.category.toUpperCase()}\n`;
      text += `Difficulty: ${qa.difficulty}\n\n`;
      
      text += `GOOD ANSWER:\n${qa.goodAnswer}\n\n`;
      
      text += `KEY POINTS:\n`;
      qa.keyPoints.forEach(point => text += `• ${point}\n`);
      text += `\n`;
      
      text += `TIPS:\n`;
      qa.tips.forEach(tip => text += `• ${tip}\n`);
      text += `\n${'-'.repeat(40)}\n\n`;
    });

    return text;
  }

  // Export to PDF-ready HTML format
  exportToHTML(data: InterviewQuestionsExport): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Interview Questions & Answers - ${data.role}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .question { margin-bottom: 30px; page-break-inside: avoid; }
        .question-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .meta { color: #7f8c8d; font-size: 14px; margin-bottom: 15px; }
        .answer { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        .section { margin-bottom: 15px; }
        .section-title { font-weight: bold; color: #34495e; margin-bottom: 8px; }
        ul { margin: 0; padding-left: 20px; }
        li { margin-bottom: 5px; }
        .divider { border-top: 2px solid #ecf0f1; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interview Questions & Answers</h1>
        <p><strong>Role:</strong> ${data.role} | <strong>Difficulty:</strong> ${data.difficulty}</p>
        <p><strong>Generated:</strong> ${data.generatedAt.toLocaleDateString()}</p>
    </div>
`;

    data.questions.forEach((qa, index) => {
      html += `
    <div class="question">
        <div class="question-title">${index + 1}. ${qa.question}</div>
        <div class="meta">Category: ${qa.category.toUpperCase()} | Difficulty: ${qa.difficulty}</div>
        
        <div class="answer">
            <div class="section-title">Good Answer:</div>
            <p>${qa.goodAnswer}</p>
        </div>
        
        <div class="section">
            <div class="section-title">Key Points:</div>
            <ul>
                ${qa.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
        
        <div class="section">
            <div class="section-title">Tips:</div>
            <ul>
                ${qa.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        
        ${index < data.questions.length - 1 ? '<div class="divider"></div>' : ''}
    </div>
`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  // New role-specific question methods
  private getQAEngineerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What's the difference between manual and automated testing?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Manual testing is performed by humans, automated testing uses tools and scripts. Automated testing is faster for repetitive tests, manual testing is better for exploratory and usability testing.",
        keyPoints: [
          "Manual testing involves human testers",
          "Automated testing uses scripts and tools",
          "Each has specific use cases",
          "Cost and time considerations"
        ],
        tips: [
          "Mention specific tools you've used",
          "Discuss when to use each approach",
          "Consider maintenance of automated tests"
        ]
      },
      {
        question: "Explain the software testing lifecycle (STLC).",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "STLC includes requirement analysis, test planning, test case development, test environment setup, test execution, test cycle closure. Each phase has specific deliverables and entry/exit criteria.",
        keyPoints: [
          "Systematic approach to testing",
          "Multiple phases with deliverables",
          "Entry and exit criteria",
          "Documentation at each stage"
        ],
        tips: [
          "Relate to your experience",
          "Mention specific deliverables",
          "Discuss quality gates"
        ]
      }
    ];
  }

  private getUIUXDesignerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What's the difference between UI and UX design?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "UI (User Interface) focuses on visual elements and interactions, UX (User Experience) focuses on overall user journey and satisfaction. UI is how it looks, UX is how it works and feels.",
        keyPoints: [
          "UI is visual design and interactions",
          "UX is overall user experience",
          "Both work together for good products",
          "Different skill sets and tools"
        ],
        tips: [
          "Give specific examples",
          "Mention design tools you use",
          "Discuss user research methods"
        ]
      },
      {
        question: "How do you conduct user research?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "User research involves interviews, surveys, usability testing, personas, user journey mapping. I start with understanding user needs, then validate designs through testing and iteration.",
        keyPoints: [
          "Multiple research methods",
          "Understanding user needs",
          "Validation through testing",
          "Iterative design process"
        ],
        tips: [
          "Mention specific research tools",
          "Discuss how you analyze data",
          "Show impact on design decisions"
        ]
      }
    ];
  }

  private getProductManagerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you prioritize features in a product roadmap?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "I use frameworks like RICE (Reach, Impact, Confidence, Effort) or MoSCoW. Consider user value, business impact, technical feasibility, and resource constraints. Regular stakeholder alignment is crucial.",
        keyPoints: [
          "Use prioritization frameworks",
          "Consider multiple factors",
          "Stakeholder alignment",
          "Data-driven decisions"
        ],
        tips: [
          "Mention specific frameworks you've used",
          "Give examples from your experience",
          "Discuss trade-offs and compromises"
        ]
      },
      {
        question: "How do you measure product success?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Define KPIs aligned with business goals: user engagement, retention, conversion rates, revenue metrics. Use analytics tools, A/B testing, and user feedback to track performance and iterate.",
        keyPoints: [
          "Define relevant KPIs",
          "Align with business goals",
          "Use data and analytics",
          "Continuous measurement and iteration"
        ],
        tips: [
          "Mention specific metrics you've tracked",
          "Discuss analytics tools",
          "Show how metrics influenced decisions"
        ]
      }
    ];
  }

  private getBusinessAnalystQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you gather and document business requirements?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "I use stakeholder interviews, workshops, process mapping, and documentation techniques. Create user stories, use cases, and requirement specifications. Ensure traceability and validation with stakeholders.",
        keyPoints: [
          "Multiple elicitation techniques",
          "Proper documentation methods",
          "Stakeholder validation",
          "Requirement traceability"
        ],
        tips: [
          "Mention specific documentation tools",
          "Discuss stakeholder management",
          "Show examples of requirement formats"
        ]
      },
      {
        question: "What's the difference between functional and non-functional requirements?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Functional requirements define what the system should do (features, behaviors). Non-functional requirements define how the system should perform (performance, security, usability, scalability).",
        keyPoints: [
          "Functional: what the system does",
          "Non-functional: how it performs",
          "Both are equally important",
          "Different testing approaches"
        ],
        tips: [
          "Give specific examples of each",
          "Discuss how you capture both types",
          "Mention quality attributes"
        ]
      }
    ];
  }

  private getCybersecurityQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What are the main types of cyber threats?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Main threats include malware, phishing, ransomware, DDoS attacks, insider threats, and social engineering. Each requires different prevention and mitigation strategies.",
        keyPoints: [
          "Various threat categories",
          "Different attack vectors",
          "Prevention strategies",
          "Mitigation approaches"
        ],
        tips: [
          "Stay updated on current threats",
          "Mention specific examples",
          "Discuss defense strategies"
        ]
      },
      {
        question: "Explain the CIA triad in cybersecurity.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "CIA stands for Confidentiality (protecting data from unauthorized access), Integrity (ensuring data accuracy and completeness), and Availability (ensuring systems are accessible when needed).",
        keyPoints: [
          "Three fundamental principles",
          "Confidentiality protects data access",
          "Integrity ensures data accuracy",
          "Availability ensures system access"
        ],
        tips: [
          "Give examples for each principle",
          "Discuss how they relate to security controls",
          "Mention trade-offs between them"
        ]
      }
    ];
  }

  private getCloudEngineerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What are the main cloud service models?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "IaaS (Infrastructure as a Service) provides virtual machines and networking, PaaS (Platform as a Service) provides development platforms, SaaS (Software as a Service) provides ready-to-use applications.",
        keyPoints: [
          "Three main service models",
          "Different levels of abstraction",
          "Varying management responsibilities",
          "Use case considerations"
        ],
        tips: [
          "Give examples of each model",
          "Discuss when to use each",
          "Mention major cloud providers"
        ]
      },
      {
        question: "How do you ensure security in cloud environments?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Implement identity and access management, encryption at rest and in transit, network security groups, regular security audits, compliance monitoring, and follow shared responsibility model.",
        keyPoints: [
          "Multiple security layers",
          "Shared responsibility model",
          "Identity and access management",
          "Continuous monitoring"
        ],
        tips: [
          "Mention specific cloud security tools",
          "Discuss compliance requirements",
          "Show understanding of shared responsibility"
        ]
      }
    ];
  }

  private getMachineLearningQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What's the difference between supervised and unsupervised learning?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Supervised learning uses labeled training data to predict outcomes (classification/regression). Unsupervised learning finds patterns in unlabeled data (clustering, dimensionality reduction).",
        keyPoints: [
          "Labeled vs unlabeled data",
          "Different problem types",
          "Various algorithms for each",
          "Evaluation methods differ"
        ],
        tips: [
          "Give examples of each type",
          "Mention specific algorithms",
          "Discuss when to use each approach"
        ]
      },
      {
        question: "How do you prevent overfitting in machine learning models?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Use techniques like cross-validation, regularization (L1/L2), early stopping, dropout, data augmentation, and ensemble methods. Monitor validation performance during training.",
        keyPoints: [
          "Multiple prevention techniques",
          "Regularization methods",
          "Validation strategies",
          "Model complexity management"
        ],
        tips: [
          "Explain specific techniques you've used",
          "Discuss bias-variance tradeoff",
          "Mention evaluation metrics"
        ]
      }
    ];
  }

  private getGameDeveloperQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What are the main components of a game engine?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Key components include rendering engine, physics engine, audio system, input handling, scene management, asset management, and scripting system. Each handles specific aspects of game functionality.",
        keyPoints: [
          "Multiple engine components",
          "Rendering and graphics",
          "Physics simulation",
          "Asset and scene management"
        ],
        tips: [
          "Mention engines you've worked with",
          "Discuss performance considerations",
          "Show understanding of game architecture"
        ]
      },
      {
        question: "How do you optimize game performance?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Optimize graphics (LOD, culling, batching), manage memory efficiently, use object pooling, optimize scripts, profile performance bottlenecks, and consider platform-specific optimizations.",
        keyPoints: [
          "Graphics optimization techniques",
          "Memory management",
          "Performance profiling",
          "Platform considerations"
        ],
        tips: [
          "Give specific optimization examples",
          "Mention profiling tools",
          "Discuss target platform constraints"
        ]
      }
    ];
  }

  private getBlockchainDeveloperQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What is a smart contract and how does it work?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Smart contracts are self-executing contracts with terms directly written into code. They run on blockchain networks, automatically execute when conditions are met, and are immutable once deployed.",
        keyPoints: [
          "Self-executing code",
          "Blockchain-based execution",
          "Automatic condition checking",
          "Immutability after deployment"
        ],
        tips: [
          "Mention specific platforms (Ethereum, etc.)",
          "Discuss programming languages (Solidity)",
          "Give real-world use cases"
        ]
      },
      {
        question: "Explain the concept of consensus mechanisms in blockchain.",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Consensus mechanisms ensure all network participants agree on the blockchain state. Common types include Proof of Work (Bitcoin), Proof of Stake (Ethereum 2.0), and Delegated Proof of Stake.",
        keyPoints: [
          "Network agreement mechanism",
          "Different consensus types",
          "Security and decentralization",
          "Energy and performance trade-offs"
        ],
        tips: [
          "Compare different mechanisms",
          "Discuss advantages and disadvantages",
          "Mention specific blockchain implementations"
        ]
      }
    ];
  }

  private getSoftwareEngineerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "What are SOLID principles in software development?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "SOLID principles are: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. They guide object-oriented design for maintainable, flexible code.",
        keyPoints: [
          "Five design principles",
          "Object-oriented design guidance",
          "Code maintainability",
          "Flexibility and extensibility"
        ],
        tips: [
          "Explain each principle with examples",
          "Show how they improve code quality",
          "Discuss real-world applications"
        ]
      },
      {
        question: "How do you approach debugging complex software issues?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Start by reproducing the issue, gather logs and error messages, use debugging tools, isolate the problem area, form hypotheses, test systematically, and document the solution.",
        keyPoints: [
          "Systematic debugging approach",
          "Problem reproduction",
          "Tool utilization",
          "Hypothesis-driven investigation"
        ],
        tips: [
          "Mention specific debugging tools",
          "Discuss logging strategies",
          "Show problem-solving methodology"
        ]
      }
    ];
  }

  private getDataAnalystQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you ensure data quality in your analysis?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Validate data sources, check for completeness and accuracy, handle missing values, identify outliers, verify data consistency, and document data lineage and transformations.",
        keyPoints: [
          "Data validation processes",
          "Completeness and accuracy checks",
          "Outlier identification",
          "Documentation practices"
        ],
        tips: [
          "Mention specific validation techniques",
          "Discuss data cleaning tools",
          "Show understanding of data governance"
        ]
      },
      {
        question: "What's the difference between correlation and causation?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Correlation shows statistical relationship between variables, but doesn't imply one causes the other. Causation means one variable directly influences another. Correlation can exist without causation.",
        keyPoints: [
          "Statistical vs causal relationships",
          "Common misconception",
          "Need for careful interpretation",
          "Experimental design considerations"
        ],
        tips: [
          "Give examples of spurious correlations",
          "Discuss methods to establish causation",
          "Mention experimental vs observational data"
        ]
      }
    ];
  }

  private getTechnicalWriterQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you make complex technical information accessible to different audiences?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Understand your audience's technical level, use appropriate language and terminology, provide context and examples, use visual aids, structure information logically, and test with representative users.",
        keyPoints: [
          "Audience analysis",
          "Appropriate language level",
          "Clear structure and examples",
          "User testing and feedback"
        ],
        tips: [
          "Give examples of different audience types",
          "Discuss documentation tools you use",
          "Show understanding of information architecture"
        ]
      },
      {
        question: "What's your process for creating technical documentation?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Research and understand the topic, identify audience needs, create an outline, write drafts, collaborate with SMEs, review and edit, test with users, and maintain documentation currency.",
        keyPoints: [
          "Systematic documentation process",
          "Collaboration with experts",
          "User-centered approach",
          "Maintenance and updates"
        ],
        tips: [
          "Mention specific documentation tools",
          "Discuss version control for docs",
          "Show examples of documentation types"
        ]
      }
    ];
  }

  private getSalesEngineerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you explain complex technical solutions to non-technical stakeholders?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Focus on business value and outcomes, use analogies and simple language, provide visual demonstrations, relate to their specific challenges, and confirm understanding throughout the conversation.",
        keyPoints: [
          "Business value focus",
          "Simple language and analogies",
          "Visual demonstrations",
          "Stakeholder-specific messaging"
        ],
        tips: [
          "Give examples of successful explanations",
          "Discuss presentation tools you use",
          "Show understanding of business impact"
        ]
      },
      {
        question: "How do you handle technical objections during sales presentations?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Listen carefully to understand the concern, acknowledge the objection, provide clear technical explanations, offer proof points or demonstrations, and follow up with additional resources if needed.",
        keyPoints: [
          "Active listening",
          "Objection acknowledgment",
          "Clear technical responses",
          "Proof and demonstration"
        ],
        tips: [
          "Prepare for common objections",
          "Use case studies and references",
          "Show technical credibility"
        ]
      }
    ];
  }

  private getProjectManagerQuestions(difficulty: string): InterviewQA[] {
    return [
      {
        question: "How do you manage project scope and prevent scope creep?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Define clear project scope, document requirements, establish change control process, communicate scope boundaries to stakeholders, and regularly review project objectives against deliverables.",
        keyPoints: [
          "Clear scope definition",
          "Change control processes",
          "Stakeholder communication",
          "Regular scope reviews"
        ],
        tips: [
          "Mention specific project management tools",
          "Discuss change request processes",
          "Show examples of scope management"
        ]
      },
      {
        question: "How do you handle project risks and issues?",
        category: 'technical',
        difficulty: difficulty as any,
        goodAnswer: "Identify risks early through risk assessment, create mitigation plans, monitor risk indicators, escalate when needed, maintain risk registers, and conduct regular risk reviews with the team.",
        keyPoints: [
          "Proactive risk identification",
          "Mitigation planning",
          "Regular monitoring",
          "Team communication"
        ],
        tips: [
          "Mention risk management frameworks",
          "Discuss specific risk categories",
          "Show examples of successful risk mitigation"
        ]
      }
    ];
  }
}

export const interviewQuestionsService = new InterviewQuestionsService();