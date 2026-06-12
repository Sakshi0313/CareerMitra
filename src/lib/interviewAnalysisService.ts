import { toast } from "sonner";

interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer: string;
  keywords: string[];
  followUp?: string;
  timeLimit: number;
  category: 'hr' | 'technical';
}

interface AnswerAnalysisRequest {
  answer: string;
  question: InterviewQuestion;
  role: string;
  difficulty: string;
  timeSpent: number;
}

interface AnswerAnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  keywordMatches: string[];
  missingKeywords: string[];
  communicationScore: number;
  technicalAccuracy: number;
  completeness: number;
  clarity: number;
}

class InterviewAnalysisService {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;
  private apiVersion: string;

  constructor() {
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
    this.deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;
    this.apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;

    if (!this.endpoint || !this.apiKey || !this.deployment) {
      console.error('Azure OpenAI configuration missing for interview analysis.');
    }
  }

  // Generate role-specific interview questions (3 HR + 5+ Technical)
  generateInterviewQuestions(role: string, difficulty: string): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    
    // Add 3 HR/Behavioral questions (same for all roles but difficulty-adjusted)
    questions.push(...this.getHRQuestions(difficulty));
    
    // Add 5+ Technical questions based on role and difficulty
    questions.push(...this.getTechnicalQuestions(role, difficulty));
    
    return questions;
  }

  private getHRQuestions(difficulty: string): InterviewQuestion[] {
    const baseHRQuestions = [
      {
        id: `hr_1_${difficulty}`,
        question: difficulty === 'easy' 
          ? "Tell me about yourself and why you're interested in this role."
          : difficulty === 'medium'
          ? "Walk me through your career journey and what motivates you in your professional life."
          : "Describe your professional evolution and how your experiences have shaped your approach to leadership and problem-solving.",
        type: 'behavioral' as const,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        expectedAnswer: "Should include background, relevant experience, career goals, and genuine interest in the role",
        keywords: ["experience", "background", "goals", "motivation", "passion", "career", "skills", "achievements"],
        timeLimit: difficulty === 'easy' ? 120 : difficulty === 'medium' ? 150 : 180,
        category: 'hr' as const,
        followUp: "What specific aspect of this role excites you the most?"
      },
      {
        id: `hr_2_${difficulty}`,
        question: difficulty === 'easy'
          ? "Describe a challenging situation you faced and how you handled it."
          : difficulty === 'medium'
          ? "Tell me about a time when you had to overcome a significant obstacle at work. What was your approach?"
          : "Describe a complex problem you solved that had significant impact on your team or organization. What was your strategic approach?",
        type: 'behavioral' as const,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        expectedAnswer: "Should use STAR method (Situation, Task, Action, Result) and show problem-solving skills",
        keywords: ["challenge", "problem", "solution", "approach", "result", "impact", "learned", "overcome"],
        timeLimit: difficulty === 'easy' ? 150 : difficulty === 'medium' ? 180 : 210,
        category: 'hr' as const,
        followUp: "What would you do differently if you faced a similar situation again?"
      },
      {
        id: `hr_3_${difficulty}`,
        question: difficulty === 'easy'
          ? "Where do you see yourself in the next 2-3 years?"
          : difficulty === 'medium'
          ? "What are your long-term career aspirations and how does this role align with them?"
          : "How do you envision your professional growth over the next 5 years, and what impact do you want to make in the industry?",
        type: 'behavioral' as const,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        expectedAnswer: "Should show ambition, alignment with role, realistic goals, and growth mindset",
        keywords: ["growth", "goals", "future", "development", "learning", "advancement", "skills", "impact"],
        timeLimit: difficulty === 'easy' ? 120 : difficulty === 'medium' ? 150 : 180,
        category: 'hr' as const,
        followUp: "How do you plan to achieve these goals?"
      }
    ];

    return baseHRQuestions;
  }

  private getTechnicalQuestions(role: string, difficulty: string): InterviewQuestion[] {
    const technicalQuestions: { [key: string]: { [key: string]: InterviewQuestion[] } } = {
      "frontend": {
        "easy": [
          {
            id: "fe_tech_1_easy",
            question: "Explain the difference between HTML, CSS, and JavaScript. How do they work together?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "HTML provides structure, CSS handles styling, JavaScript adds interactivity",
            keywords: ["HTML", "CSS", "JavaScript", "structure", "styling", "interactivity", "DOM", "browser"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "fe_tech_2_easy",
            question: "What is responsive design and how do you implement it?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Design that adapts to different screen sizes using media queries, flexible layouts",
            keywords: ["responsive", "media queries", "mobile-first", "flexbox", "grid", "viewport", "breakpoints"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "fe_tech_3_easy",
            question: "How do you debug JavaScript code in the browser?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Using browser developer tools, console.log, breakpoints, network tab",
            keywords: ["debugging", "developer tools", "console", "breakpoints", "network", "elements"],
            timeLimit: 120,
            category: "technical"
          },
          {
            id: "fe_tech_4_easy",
            question: "What is the DOM and how do you manipulate it with JavaScript?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Document Object Model, tree structure, getElementById, querySelector, addEventListener",
            keywords: ["DOM", "document", "getElementById", "querySelector", "addEventListener", "manipulation"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "fe_tech_5_easy",
            question: "Explain the box model in CSS.",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Content, padding, border, margin - how elements are sized and spaced",
            keywords: ["box model", "content", "padding", "border", "margin", "sizing", "layout"],
            timeLimit: 150,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "fe_tech_1_medium",
            question: "Explain React's Virtual DOM and how it improves performance.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "In-memory representation, diffing algorithm, minimal DOM updates, reconciliation",
            keywords: ["Virtual DOM", "React", "reconciliation", "diffing", "performance", "re-rendering"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "fe_tech_2_medium",
            question: "What are React Hooks and why were they introduced?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Functions to use state and lifecycle in functional components, useState, useEffect",
            keywords: ["Hooks", "useState", "useEffect", "functional components", "state management"],
            timeLimit: 210,
            category: "technical"
          },
          {
            id: "fe_tech_3_medium",
            question: "How would you optimize a React application's performance?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Memoization, code splitting, lazy loading, useMemo, useCallback, React.memo",
            keywords: ["optimization", "memoization", "code splitting", "lazy loading", "useMemo", "useCallback"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "fe_tech_4_medium",
            question: "Explain the difference between controlled and uncontrolled components in React.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Controlled: React manages state, Uncontrolled: DOM manages state with refs",
            keywords: ["controlled", "uncontrolled", "components", "state", "refs", "forms"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "fe_tech_5_medium",
            question: "What is state management and when would you use Redux?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Managing application state, Redux for complex state, actions, reducers, store",
            keywords: ["state management", "Redux", "actions", "reducers", "store", "middleware"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "fe_tech_6_medium",
            question: "How do you handle API calls in React applications?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "useEffect, fetch, axios, async/await, error handling, loading states",
            keywords: ["API", "fetch", "axios", "useEffect", "async", "await", "error handling"],
            timeLimit: 210,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "fe_tech_1_hard",
            question: "Design a scalable frontend architecture for a large application with multiple teams.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Micro-frontends, module federation, shared libraries, design systems, CI/CD",
            keywords: ["micro-frontends", "module federation", "scalability", "architecture", "design system"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "fe_tech_2_hard",
            question: "How would you implement server-side rendering (SSR) and when is it beneficial?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Next.js, Nuxt.js, SEO benefits, initial load performance, hydration",
            keywords: ["SSR", "server-side rendering", "Next.js", "SEO", "hydration", "performance"],
            timeLimit: 300,
            category: "technical"
          },
          {
            id: "fe_tech_3_hard",
            question: "Explain how you would implement real-time features in a web application.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "WebSockets, Socket.io, Server-Sent Events, real-time updates, connection management",
            keywords: ["WebSockets", "Socket.io", "real-time", "SSE", "connection", "events"],
            timeLimit: 330,
            category: "technical"
          },
          {
            id: "fe_tech_4_hard",
            question: "How would you approach performance optimization for a complex React application?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Bundle analysis, code splitting, lazy loading, memoization, virtualization, CDN",
            keywords: ["performance", "bundle analysis", "code splitting", "virtualization", "CDN", "optimization"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "fe_tech_5_hard",
            question: "Design a component library that can be used across multiple applications.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Design tokens, Storybook, versioning, documentation, testing, distribution",
            keywords: ["component library", "design tokens", "Storybook", "versioning", "documentation"],
            timeLimit: 390,
            category: "technical"
          }
        ]
      },
      "backend": {
        "easy": [
          {
            id: "be_tech_1_easy",
            question: "What is an API and explain the difference between GET and POST requests?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "API is interface for communication, GET retrieves data, POST sends data",
            keywords: ["API", "GET", "POST", "HTTP", "requests", "data", "server"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "be_tech_2_easy",
            question: "Explain what a database is and the difference between SQL and NoSQL.",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Database stores data, SQL is relational/structured, NoSQL is flexible/unstructured",
            keywords: ["database", "SQL", "NoSQL", "relational", "structured", "flexible"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "be_tech_3_easy",
            question: "What is server-side validation and why is it important?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Validating data on server for security, data integrity, cannot be bypassed",
            keywords: ["validation", "server-side", "security", "data integrity", "input validation"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "be_tech_4_easy",
            question: "How do you handle errors in backend applications?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Try-catch blocks, error codes, logging, user-friendly messages",
            keywords: ["error handling", "try-catch", "logging", "error codes", "exceptions"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "be_tech_5_easy",
            question: "What is authentication and how is it different from authorization?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Authentication verifies identity, authorization controls access permissions",
            keywords: ["authentication", "authorization", "identity", "permissions", "access control"],
            timeLimit: 150,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "be_tech_1_medium",
            question: "Explain RESTful API design principles and best practices.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Resource-based URLs, HTTP methods, stateless, proper status codes, JSON",
            keywords: ["REST", "RESTful", "HTTP methods", "stateless", "status codes", "resources"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "be_tech_2_medium",
            question: "How would you design a database schema for an e-commerce application?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Users, products, orders, relationships, normalization, indexes",
            keywords: ["database design", "schema", "relationships", "normalization", "indexes", "e-commerce"],
            timeLimit: 300,
            category: "technical"
          },
          {
            id: "be_tech_3_medium",
            question: "What is caching and how would you implement it in a web application?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Temporary storage, Redis, Memcached, browser cache, CDN, cache strategies",
            keywords: ["caching", "Redis", "Memcached", "cache strategies", "performance", "CDN"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "be_tech_4_medium",
            question: "Explain JWT tokens and how you would implement secure authentication.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "JSON Web Tokens, stateless, header/payload/signature, refresh tokens, security",
            keywords: ["JWT", "authentication", "tokens", "stateless", "security", "refresh tokens"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "be_tech_5_medium",
            question: "How do you handle concurrent requests and prevent race conditions?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Locking mechanisms, transactions, atomic operations, queue systems",
            keywords: ["concurrency", "race conditions", "locking", "transactions", "atomic operations"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "be_tech_6_medium",
            question: "What are microservices and when would you use them?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Small independent services, scalability, technology diversity, complexity trade-offs",
            keywords: ["microservices", "scalability", "independent", "distributed", "architecture"],
            timeLimit: 240,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "be_tech_1_hard",
            question: "Design a system that can handle 1 million concurrent users. What are the key considerations?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Load balancing, horizontal scaling, caching, database sharding, CDN, monitoring",
            keywords: ["scalability", "load balancing", "horizontal scaling", "sharding", "distributed systems"],
            timeLimit: 420,
            category: "technical"
          },
          {
            id: "be_tech_2_hard",
            question: "How would you implement a distributed transaction across multiple microservices?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Saga pattern, two-phase commit, event sourcing, compensation, eventual consistency",
            keywords: ["distributed transactions", "Saga pattern", "two-phase commit", "event sourcing"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "be_tech_3_hard",
            question: "Design a real-time messaging system like WhatsApp or Slack.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "WebSockets, message queues, presence system, delivery guarantees, scaling",
            keywords: ["real-time messaging", "WebSockets", "message queues", "presence", "scaling"],
            timeLimit: 390,
            category: "technical"
          },
          {
            id: "be_tech_4_hard",
            question: "How would you implement a search engine for a large e-commerce platform?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Elasticsearch, indexing strategies, relevance scoring, faceted search, performance",
            keywords: ["search engine", "Elasticsearch", "indexing", "relevance", "faceted search"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "be_tech_5_hard",
            question: "Explain how you would design a payment processing system with high reliability.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Idempotency, retry mechanisms, circuit breakers, audit trails, PCI compliance",
            keywords: ["payment processing", "idempotency", "reliability", "circuit breakers", "compliance"],
            timeLimit: 420,
            category: "technical"
          }
        ]
      },
      "fullstack": {
        "easy": [
          {
            id: "fs_tech_1_easy",
            question: "How do frontend and backend communicate in a web application?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "HTTP requests, APIs, JSON data exchange, client-server architecture",
            keywords: ["HTTP", "API", "JSON", "client-server", "requests", "responses"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "fs_tech_2_easy",
            question: "What is the difference between client-side and server-side rendering?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "CSR renders in browser, SSR renders on server, SEO and performance differences",
            keywords: ["client-side", "server-side", "rendering", "SEO", "performance", "browser"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "fs_tech_3_easy",
            question: "How do you manage state in a full-stack application?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Frontend state (React state), backend state (database), session management",
            keywords: ["state management", "frontend state", "backend state", "database", "session"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "fs_tech_4_easy",
            question: "What is CORS and why is it important?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Cross-Origin Resource Sharing, security policy, allows cross-domain requests",
            keywords: ["CORS", "cross-origin", "security", "domains", "browser policy"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "fs_tech_5_easy",
            question: "How do you handle form data from frontend to backend?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Form submission, validation, HTTP POST, request body, server processing",
            keywords: ["forms", "validation", "POST request", "data processing", "user input"],
            timeLimit: 180,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "fs_tech_1_medium",
            question: "How would you implement user authentication in a full-stack application?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "JWT tokens, password hashing, session management, protected routes, middleware",
            keywords: ["authentication", "JWT", "password hashing", "sessions", "middleware", "security"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "fs_tech_2_medium",
            question: "Explain how you would structure a MERN/MEAN stack application.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "MongoDB/MySQL, Express, React/Angular, Node.js, folder structure, separation of concerns",
            keywords: ["MERN", "MEAN", "MongoDB", "Express", "React", "Node.js", "architecture"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "fs_tech_3_medium",
            question: "How do you handle file uploads in a full-stack application?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Multer, file validation, storage (local/cloud), progress tracking, security",
            keywords: ["file upload", "Multer", "validation", "storage", "cloud", "security"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "fs_tech_4_medium",
            question: "What is API versioning and how would you implement it?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "URL versioning, header versioning, backward compatibility, migration strategies",
            keywords: ["API versioning", "backward compatibility", "migration", "URL versioning"],
            timeLimit: 210,
            category: "technical"
          },
          {
            id: "fs_tech_5_medium",
            question: "How would you implement real-time features in a full-stack app?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "WebSockets, Socket.io, real-time updates, event handling, connection management",
            keywords: ["real-time", "WebSockets", "Socket.io", "events", "connection management"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "fs_tech_6_medium",
            question: "Explain how you would deploy a full-stack application to production.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Build process, environment variables, CI/CD, hosting platforms, monitoring",
            keywords: ["deployment", "production", "CI/CD", "environment variables", "hosting"],
            timeLimit: 240,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "fs_tech_1_hard",
            question: "Design a scalable full-stack architecture for a social media platform.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Microservices, CDN, caching layers, database sharding, real-time features",
            keywords: ["scalable architecture", "microservices", "CDN", "caching", "sharding", "social media"],
            timeLimit: 420,
            category: "technical"
          },
          {
            id: "fs_tech_2_hard",
            question: "How would you implement a multi-tenant SaaS application?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Tenant isolation, database strategies, subdomain routing, billing, security",
            keywords: ["multi-tenant", "SaaS", "tenant isolation", "database strategies", "billing"],
            timeLimit: 390,
            category: "technical"
          },
          {
            id: "fs_tech_3_hard",
            question: "Design an e-commerce platform that can handle Black Friday traffic.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Auto-scaling, load balancing, caching, queue systems, database optimization",
            keywords: ["e-commerce", "high traffic", "auto-scaling", "load balancing", "optimization"],
            timeLimit: 420,
            category: "technical"
          },
          {
            id: "fs_tech_4_hard",
            question: "How would you implement a collaborative document editor like Google Docs?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Operational transforms, conflict resolution, real-time sync, version control",
            keywords: ["collaborative editing", "operational transforms", "conflict resolution", "real-time"],
            timeLimit: 450,
            category: "technical"
          },
          {
            id: "fs_tech_5_hard",
            question: "Design a monitoring and analytics system for a full-stack application.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Logging, metrics, alerting, performance monitoring, user analytics, dashboards",
            keywords: ["monitoring", "analytics", "logging", "metrics", "alerting", "performance"],
            timeLimit: 390,
            category: "technical"
          }
        ]
      }
    };

    // Add new roles with their technical questions
    const newRoles = {
      "mobile": {
        "easy": [
          {
            id: "mobile_tech_1_easy",
            question: "What's the difference between native and hybrid mobile app development?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Native uses platform-specific languages, hybrid uses web technologies in wrapper",
            keywords: ["native", "hybrid", "platform-specific", "web technologies", "performance"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "mobile_tech_2_easy",
            question: "Explain the mobile app lifecycle (Android or iOS).",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Created, started, resumed, paused, stopped, destroyed states",
            keywords: ["lifecycle", "states", "created", "started", "paused", "destroyed"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "mobile_tech_3_easy",
            question: "How do you handle different screen sizes in mobile development?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Responsive layouts, density-independent pixels, flexible layouts",
            keywords: ["responsive", "screen sizes", "layouts", "density", "flexible"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "mobile_tech_4_easy",
            question: "What is the difference between activities and fragments in Android?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Activities are screens, fragments are reusable UI components within activities",
            keywords: ["activities", "fragments", "screens", "UI components", "reusable"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "mobile_tech_5_easy",
            question: "How do you store data locally in mobile apps?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "SharedPreferences, SQLite, Room database, Core Data, UserDefaults",
            keywords: ["local storage", "SharedPreferences", "SQLite", "Room", "Core Data"],
            timeLimit: 180,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "mobile_tech_1_medium",
            question: "How would you implement offline functionality in a mobile app?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Local database, sync mechanisms, conflict resolution, network detection",
            keywords: ["offline", "local database", "sync", "conflict resolution", "network detection"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "mobile_tech_2_medium",
            question: "Explain push notifications and how to implement them.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "FCM, APNs, device tokens, notification payload, user permissions",
            keywords: ["push notifications", "FCM", "APNs", "device tokens", "permissions"],
            timeLimit: 210,
            category: "technical"
          },
          {
            id: "mobile_tech_3_medium",
            question: "How do you optimize mobile app performance?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Memory management, image optimization, lazy loading, background tasks",
            keywords: ["performance", "memory management", "optimization", "lazy loading", "background"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "mobile_tech_4_medium",
            question: "What are the security considerations for mobile apps?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Data encryption, secure storage, API security, certificate pinning",
            keywords: ["security", "encryption", "secure storage", "API security", "certificate pinning"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "mobile_tech_5_medium",
            question: "How would you implement location-based features in a mobile app?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "GPS, location permissions, geofencing, battery optimization, accuracy",
            keywords: ["location", "GPS", "permissions", "geofencing", "battery", "accuracy"],
            timeLimit: 240,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "mobile_tech_1_hard",
            question: "Design a mobile app architecture that works offline and syncs data efficiently.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "MVVM, Repository pattern, Room/Core Data, sync strategies, conflict resolution",
            keywords: ["architecture", "MVVM", "Repository pattern", "offline sync", "conflict resolution"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "mobile_tech_2_hard",
            question: "How would you implement real-time features in a mobile app?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "WebSockets, Socket.io, background processing, connection management, battery optimization",
            keywords: ["real-time", "WebSockets", "background processing", "connection management", "battery"],
            timeLimit: 330,
            category: "technical"
          },
          {
            id: "mobile_tech_3_hard",
            question: "Design a mobile app that can handle millions of users with real-time messaging.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Scalable backend, message queues, presence system, offline messages, push notifications",
            keywords: ["scalable", "message queues", "presence system", "offline messages", "millions of users"],
            timeLimit: 420,
            category: "technical"
          }
        ]
      },
      "devops": {
        "easy": [
          {
            id: "devops_tech_1_easy",
            question: "What is CI/CD and why is it important?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Continuous Integration/Deployment, automated testing and deployment, faster delivery",
            keywords: ["CI/CD", "continuous integration", "deployment", "automation", "testing"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "devops_tech_2_easy",
            question: "Explain the difference between containers and virtual machines.",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Containers share OS kernel, VMs have separate OS, containers are lighter",
            keywords: ["containers", "virtual machines", "Docker", "OS kernel", "lightweight"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "devops_tech_3_easy",
            question: "What is version control and why do we use Git?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Track code changes, collaboration, branching, merging, distributed system",
            keywords: ["version control", "Git", "branching", "merging", "collaboration"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "devops_tech_4_easy",
            question: "What is cloud computing and name some cloud providers?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "On-demand computing resources, AWS, Azure, Google Cloud, scalability",
            keywords: ["cloud computing", "AWS", "Azure", "Google Cloud", "scalability"],
            timeLimit: 120,
            category: "technical"
          },
          {
            id: "devops_tech_5_easy",
            question: "What is monitoring and why is it important in DevOps?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Track system health, performance metrics, alerts, troubleshooting",
            keywords: ["monitoring", "metrics", "alerts", "performance", "troubleshooting"],
            timeLimit: 150,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "devops_tech_1_medium",
            question: "How would you set up a CI/CD pipeline for a web application?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Source control, build automation, testing, deployment stages, Jenkins/GitHub Actions",
            keywords: ["CI/CD pipeline", "build automation", "testing", "deployment", "Jenkins"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "devops_tech_2_medium",
            question: "Explain Infrastructure as Code and its benefits.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Terraform, CloudFormation, version control for infrastructure, reproducibility",
            keywords: ["Infrastructure as Code", "Terraform", "CloudFormation", "reproducibility"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "devops_tech_3_medium",
            question: "How do you implement container orchestration?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Kubernetes, Docker Swarm, service discovery, load balancing, scaling",
            keywords: ["container orchestration", "Kubernetes", "Docker Swarm", "scaling", "load balancing"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "devops_tech_4_medium",
            question: "What are the key metrics you would monitor in a production system?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "CPU, memory, disk, network, response time, error rates, throughput",
            keywords: ["metrics", "CPU", "memory", "response time", "error rates", "throughput"],
            timeLimit: 210,
            category: "technical"
          },
          {
            id: "devops_tech_5_medium",
            question: "How would you implement security in a DevOps pipeline?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Security scanning, secrets management, access control, compliance checks",
            keywords: ["security", "scanning", "secrets management", "access control", "compliance"],
            timeLimit: 240,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "devops_tech_1_hard",
            question: "Design a highly available and scalable infrastructure for a global application.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Multi-region deployment, load balancers, auto-scaling, disaster recovery, CDN",
            keywords: ["high availability", "scalable", "multi-region", "auto-scaling", "disaster recovery"],
            timeLimit: 420,
            category: "technical"
          },
          {
            id: "devops_tech_2_hard",
            question: "How would you implement zero-downtime deployments?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Blue-green deployment, rolling updates, canary releases, health checks",
            keywords: ["zero-downtime", "blue-green", "rolling updates", "canary", "health checks"],
            timeLimit: 360,
            category: "technical"
          },
          {
            id: "devops_tech_3_hard",
            question: "Design a disaster recovery strategy for a critical business application.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "RTO/RPO requirements, backup strategies, failover mechanisms, testing procedures",
            keywords: ["disaster recovery", "RTO", "RPO", "backup", "failover", "testing"],
            timeLimit: 390,
            category: "technical"
          }
        ]
      },
      "data-science": {
        "easy": [
          {
            id: "ds_tech_1_easy",
            question: "What is the difference between supervised and unsupervised learning?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Supervised uses labeled data, unsupervised finds patterns in unlabeled data",
            keywords: ["supervised", "unsupervised", "labeled data", "patterns", "machine learning"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "ds_tech_2_easy",
            question: "Explain what Python libraries you would use for data analysis.",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Pandas for data manipulation, NumPy for numerical computing, Matplotlib for visualization",
            keywords: ["Python", "Pandas", "NumPy", "Matplotlib", "data analysis"],
            timeLimit: 150,
            category: "technical"
          },
          {
            id: "ds_tech_3_easy",
            question: "What is the difference between mean, median, and mode?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Mean is average, median is middle value, mode is most frequent value",
            keywords: ["mean", "median", "mode", "average", "statistics"],
            timeLimit: 120,
            category: "technical"
          },
          {
            id: "ds_tech_4_easy",
            question: "How do you handle missing data in a dataset?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Remove rows, fill with mean/median, forward fill, interpolation",
            keywords: ["missing data", "imputation", "mean", "median", "interpolation"],
            timeLimit: 180,
            category: "technical"
          },
          {
            id: "ds_tech_5_easy",
            question: "What is data visualization and why is it important?",
            type: "technical",
            difficulty: "easy",
            expectedAnswer: "Visual representation of data, easier understanding, pattern identification",
            keywords: ["data visualization", "charts", "patterns", "understanding", "insights"],
            timeLimit: 150,
            category: "technical"
          }
        ],
        "medium": [
          {
            id: "ds_tech_1_medium",
            question: "Explain the bias-variance tradeoff in machine learning.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Bias is underfitting, variance is overfitting, need to balance both for good model",
            keywords: ["bias", "variance", "tradeoff", "underfitting", "overfitting", "model performance"],
            timeLimit: 240,
            category: "technical"
          },
          {
            id: "ds_tech_2_medium",
            question: "How would you evaluate a machine learning model?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Train/validation/test split, cross-validation, metrics like accuracy, precision, recall",
            keywords: ["model evaluation", "cross-validation", "accuracy", "precision", "recall", "F1-score"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "ds_tech_3_medium",
            question: "What is feature engineering and why is it important?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Creating new features from existing data, improves model performance, domain knowledge",
            keywords: ["feature engineering", "feature creation", "model performance", "domain knowledge"],
            timeLimit: 210,
            category: "technical"
          },
          {
            id: "ds_tech_4_medium",
            question: "Explain different types of machine learning algorithms.",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Linear regression, decision trees, random forest, SVM, neural networks, clustering",
            keywords: ["algorithms", "linear regression", "decision trees", "random forest", "SVM", "neural networks"],
            timeLimit: 270,
            category: "technical"
          },
          {
            id: "ds_tech_5_medium",
            question: "How do you handle imbalanced datasets?",
            type: "technical",
            difficulty: "medium",
            expectedAnswer: "Oversampling, undersampling, SMOTE, class weights, different evaluation metrics",
            keywords: ["imbalanced data", "oversampling", "undersampling", "SMOTE", "class weights"],
            timeLimit: 240,
            category: "technical"
          }
        ],
        "hard": [
          {
            id: "ds_tech_1_hard",
            question: "Design a recommendation system for an e-commerce platform.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Collaborative filtering, content-based, hybrid approach, cold start problem, scalability",
            keywords: ["recommendation system", "collaborative filtering", "content-based", "cold start", "scalability"],
            timeLimit: 420,
            category: "technical"
          },
          {
            id: "ds_tech_2_hard",
            question: "How would you build a real-time fraud detection system?",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Streaming data, anomaly detection, ensemble methods, feature engineering, low latency",
            keywords: ["fraud detection", "real-time", "anomaly detection", "streaming", "ensemble methods"],
            timeLimit: 390,
            category: "technical"
          },
          {
            id: "ds_tech_3_hard",
            question: "Explain how you would implement A/B testing for a data science project.",
            type: "technical",
            difficulty: "hard",
            expectedAnswer: "Hypothesis testing, statistical significance, sample size, randomization, metrics",
            keywords: ["A/B testing", "hypothesis testing", "statistical significance", "randomization", "metrics"],
            timeLimit: 360,
            category: "technical"
          }
        ]
      }
    };

    // Merge new roles with existing ones
    Object.assign(technicalQuestions, newRoles);

    const roleQuestions = technicalQuestions[role.toLowerCase()] || technicalQuestions["frontend"];
    const difficultyQuestions = roleQuestions[difficulty] || roleQuestions["easy"];
    
    return difficultyQuestions;
  }

  // Analyze answer using real AI API
  async analyzeAnswer(request: AnswerAnalysisRequest): Promise<AnswerAnalysisResult> {
    console.log('Analyzing answer:', {
      answer: request.answer,
      question: request.question.question,
      hasApiConfig: !!(this.endpoint && this.apiKey && this.deployment)
    });
    
    try {
      if (!this.endpoint || !this.apiKey || !this.deployment) {
        console.log('Azure OpenAI configuration missing, using fallback analysis');
        return this.getFallbackAnalysis(request);
      }

      const prompt = this.createAnalysisPrompt(request);
      
      console.log('Making Azure OpenAI API request...');
      const response = await fetch(
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
                content: `You are an expert technical interviewer and HR professional with extensive experience in evaluating candidates for ${request.role} positions. Analyze interview answers comprehensively and provide detailed, actionable feedback. Always respond with valid JSON format.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.3,
            response_format: { type: "json_object" }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure OpenAI API Error:', response.status, errorText);
        console.log('Falling back to basic analysis due to API error');
        return this.getFallbackAnalysis(request);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response format from Azure OpenAI API');
        console.log('Falling back to basic analysis due to invalid response');
        return this.getFallbackAnalysis(request);
      }

      let analysisResult;
      try {
        analysisResult = JSON.parse(data.choices[0].message.content);
        console.log('Azure OpenAI analysis successful:', analysisResult);
      } catch (parseError) {
        console.error('Failed to parse interview analysis response:', data.choices[0].message.content);
        console.log('Falling back to basic analysis due to parse error');
        return this.getFallbackAnalysis(request);
      }
      
      return this.processAnalysisResult(analysisResult, request);
    } catch (error: any) {
      console.error('Interview Analysis Error:', error);
      console.log('Falling back to basic analysis due to error');
      
      let errorMessage = 'Failed to analyze interview answer. Please try again.';
      if (error.message.includes('configuration')) {
        errorMessage = 'Interview analysis service configuration error. Please contact support.';
      } else if (error.message.includes('API error: 401')) {
        errorMessage = 'Interview analysis authentication failed. Please contact support.';
      } else if (error.message.includes('API error: 429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      toast.error('Interview Analysis Failed', {
        description: errorMessage,
      });
      
      // Return fallback analysis
      return this.getFallbackAnalysis(request);
    }
  }

  private createAnalysisPrompt(request: AnswerAnalysisRequest): string {
    return `
Analyze this interview answer for a ${request.role} position at ${request.difficulty} level.

QUESTION: ${request.question.question}
QUESTION TYPE: ${request.question.type}
QUESTION CATEGORY: ${request.question.category}
EXPECTED KEYWORDS: ${request.question.keywords.join(', ')}
EXPECTED ANSWER OUTLINE: ${request.question.expectedAnswer}

CANDIDATE'S ANSWER: ${request.answer}

TIME SPENT: ${request.timeSpent} seconds (Time limit was ${request.question.timeLimit} seconds)

Please provide a comprehensive analysis in this exact JSON structure:
{
  "score": number (0-100, overall answer quality),
  "feedback": "string (detailed constructive feedback paragraph)",
  "strengths": ["strength1", "strength2", ...] (specific positive aspects),
  "improvements": ["improvement1", "improvement2", ...] (specific areas to improve),
  "keywordMatches": ["keyword1", "keyword2", ...] (keywords from expected list that were mentioned),
  "missingKeywords": ["keyword1", "keyword2", ...] (important keywords that were missed),
  "communicationScore": number (0-100, clarity and articulation),
  "technicalAccuracy": number (0-100, correctness of technical content, 0 if HR question),
  "completeness": number (0-100, how thoroughly the question was answered),
  "clarity": number (0-100, how clear and well-structured the answer was)
}

SCORING CRITERIA:
- For HR/Behavioral questions: Focus on STAR method, specific examples, self-awareness, communication
- For Technical questions: Focus on accuracy, depth of knowledge, practical understanding, examples
- Consider the difficulty level when scoring
- Be constructive but honest in feedback
- Provide specific, actionable improvement suggestions
- Recognize good communication skills and structure
- For ${request.difficulty} level, expect ${request.difficulty === 'easy' ? 'basic understanding' : request.difficulty === 'medium' ? 'solid knowledge with some depth' : 'expert-level insights and advanced concepts'}

FEEDBACK GUIDELINES:
- Start with positive aspects if any
- Be specific about what was good or missing
- Provide actionable suggestions for improvement
- Consider the time constraint in your evaluation
- For technical questions, suggest specific concepts to study
- For HR questions, suggest better storytelling or examples
`;
  }

  private processAnalysisResult(analysisResult: any, request: AnswerAnalysisRequest): AnswerAnalysisResult {
    // Ensure all required fields exist with defaults
    return {
      score: Math.max(0, Math.min(100, analysisResult.score || 0)),
      feedback: analysisResult.feedback || "Answer analyzed. Please provide more detailed responses for better evaluation.",
      strengths: Array.isArray(analysisResult.strengths) ? analysisResult.strengths : [],
      improvements: Array.isArray(analysisResult.improvements) ? analysisResult.improvements : [],
      keywordMatches: Array.isArray(analysisResult.keywordMatches) ? analysisResult.keywordMatches : [],
      missingKeywords: Array.isArray(analysisResult.missingKeywords) ? analysisResult.missingKeywords : [],
      communicationScore: Math.max(0, Math.min(100, analysisResult.communicationScore || 0)),
      technicalAccuracy: Math.max(0, Math.min(100, analysisResult.technicalAccuracy || 0)),
      completeness: Math.max(0, Math.min(100, analysisResult.completeness || 0)),
      clarity: Math.max(0, Math.min(100, analysisResult.clarity || 0))
    };
  }

  private getFallbackAnalysis(request: AnswerAnalysisRequest): AnswerAnalysisResult {
    // Basic fallback analysis when API fails
    const answerLength = request.answer.trim().length;
    const wordCount = request.answer.trim().split(/\s+/).length;
    
    console.log('Fallback analysis for answer:', {
      answer: request.answer,
      answerLength,
      wordCount,
      expectedKeywords: request.question.keywords
    });
    
    // Simple keyword matching
    const keywordMatches = request.question.keywords.filter(keyword =>
      request.answer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const missingKeywords = request.question.keywords.filter(keyword =>
      !request.answer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Basic scoring based on length and keyword matches
    let score = 0;
    if (answerLength > 50) score += 20;
    if (wordCount > 20) score += 20;
    if (keywordMatches.length > 0) score += (keywordMatches.length / request.question.keywords.length) * 40;
    if (request.timeSpent <= request.question.timeLimit) score += 20;
    
    // Ensure minimum score for any attempt
    score = Math.max(score, 25); // Minimum 25% for any answer attempt
    score = Math.min(score, 85); // Cap fallback score at 85
    
    console.log('Fallback analysis result:', {
      score,
      keywordMatches,
      missingKeywords
    });
    
    return {
      score: Math.round(score),
      feedback: `Your answer covers some key points. ${keywordMatches.length > 0 ? `Good use of relevant terms: ${keywordMatches.join(', ')}.` : ''} ${missingKeywords.length > 0 ? `Consider mentioning: ${missingKeywords.slice(0, 3).join(', ')}.` : ''} Try to provide more specific examples and elaborate on your experience.`,
      strengths: answerLength > 100 ? ["Detailed response", "Good length"] : ["Concise answer"],
      improvements: [
        ...(answerLength < 100 ? ["Provide more detailed explanations"] : []),
        ...(missingKeywords.length > 0 ? ["Include more relevant technical terms"] : []),
        "Add specific examples from your experience"
      ],
      keywordMatches,
      missingKeywords,
      communicationScore: Math.min(score + 10, 90),
      technicalAccuracy: request.question.category === 'technical' ? Math.max(score - 10, 0) : 0,
      completeness: Math.min(score + 5, 85),
      clarity: Math.min(score + 15, 90)
    };
  }
}

export const interviewAnalysisService = new InterviewAnalysisService();
export type { InterviewQuestion, AnswerAnalysisRequest, AnswerAnalysisResult };