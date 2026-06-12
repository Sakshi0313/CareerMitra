import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, increment, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Resource {
  id?: string;
  title: string;
  description: string;
  url: string;
  type: 'course' | 'certification' | 'tutorial' | 'documentation' | 'tool' | 'article';
  category: string; // frontend, backend, devops, etc.
  provider: string; // Coursera, Udemy, YouTube, etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string; // "4 weeks", "2 hours", etc.
  price: 'free' | 'paid' | 'freemium';
  rating?: number;
  tags: string[];
  imageUrl?: string;
  accessCount: number;
  bookmarkCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserBookmark {
  id?: string;
  userId: string;
  resourceId: string;
  createdAt: Date;
}

export interface ResourceAnalytics {
  totalResources: number;
  totalBookmarks: number;
  topCategories: { [category: string]: number };
  trendingResources: Resource[];
  recentlyAdded: Resource[];
}

class ResourcesService {
  private resourcesCollection = 'resources';
  private bookmarksCollection = 'user_bookmarks';

  // Add a new resource
  async addResource(resource: Omit<Resource, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.resourcesCollection), {
        ...resource,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Resource added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  }

  // Get all resources with filtering and sorting
  async getResources(filters?: {
    category?: string;
    type?: string;
    difficulty?: string;
    price?: string;
    tags?: string[];
  }): Promise<Resource[]> {
    try {
      let q = query(
        collection(db, this.resourcesCollection),
        where('isActive', '==', true),
        orderBy('accessCount', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let resources: Resource[] = [];

      querySnapshot.forEach((doc) => {
        resources.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        } as Resource);
      });

      // Apply client-side filtering if needed
      if (filters) {
        resources = resources.filter(resource => {
          if (filters.category && resource.category !== filters.category) return false;
          if (filters.type && resource.type !== filters.type) return false;
          if (filters.difficulty && resource.difficulty !== filters.difficulty) return false;
          if (filters.price && resource.price !== filters.price) return false;
          if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some(tag => 
              resource.tags.some(resourceTag => 
                resourceTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            if (!hasMatchingTag) return false;
          }
          return true;
        });
      }

      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  // Get trending resources (most accessed/bookmarked recently)
  async getTrendingResources(limit: number = 10): Promise<Resource[]> {
    try {
      const q = query(
        collection(db, this.resourcesCollection),
        where('isActive', '==', true),
        orderBy('bookmarkCount', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const resources: Resource[] = [];

      querySnapshot.forEach((doc) => {
        if (resources.length < limit) {
          resources.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          } as Resource);
        }
      });

      return resources;
    } catch (error) {
      console.error('Error fetching trending resources:', error);
      return [];
    }
  }

  // Get user's bookmarked resources
  async getUserBookmarks(userId: string): Promise<Resource[]> {
    try {
      const bookmarksQuery = query(
        collection(db, this.bookmarksCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      const resourceIds: string[] = [];

      bookmarksSnapshot.forEach((doc) => {
        resourceIds.push(doc.data().resourceId);
      });

      if (resourceIds.length === 0) return [];

      // Get the actual resources
      const resources: Resource[] = [];
      for (const resourceId of resourceIds) {
        try {
          const resourceQuery = query(
            collection(db, this.resourcesCollection),
            where('__name__', '==', resourceId)
          );
          const resourceSnapshot = await getDocs(resourceQuery);
          
          resourceSnapshot.forEach((doc) => {
            resources.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate()
            } as Resource);
          });
        } catch (error) {
          console.log(`Resource ${resourceId} not found or deleted`);
        }
      }

      return resources;
    } catch (error) {
      console.error('Error fetching user bookmarks:', error);
      return [];
    }
  }

  // Check if resource is bookmarked by user
  async isBookmarked(userId: string, resourceId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.bookmarksCollection),
        where('userId', '==', userId),
        where('resourceId', '==', resourceId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  // Add bookmark
  async addBookmark(userId: string, resourceId: string): Promise<void> {
    try {
      // Check if already bookmarked
      const isAlreadyBookmarked = await this.isBookmarked(userId, resourceId);
      if (isAlreadyBookmarked) return;

      // Add bookmark
      await addDoc(collection(db, this.bookmarksCollection), {
        userId,
        resourceId,
        createdAt: new Date()
      });

      // Increment bookmark count on resource
      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      await updateDoc(resourceRef, {
        bookmarkCount: increment(1),
        updatedAt: new Date()
      });

      console.log('Bookmark added successfully');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, resourceId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.bookmarksCollection),
        where('userId', '==', userId),
        where('resourceId', '==', resourceId)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Delete bookmark
        await deleteDoc(querySnapshot.docs[0].ref);

        // Decrement bookmark count on resource
        const resourceRef = doc(db, this.resourcesCollection, resourceId);
        await updateDoc(resourceRef, {
          bookmarkCount: increment(-1),
          updatedAt: new Date()
        });

        console.log('Bookmark removed successfully');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  // Track resource access (for trending calculation)
  async trackResourceAccess(resourceId: string): Promise<void> {
    try {
      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      await updateDoc(resourceRef, {
        accessCount: increment(1),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error tracking resource access:', error);
    }
  }

  // Get resource analytics
  async getResourceAnalytics(): Promise<ResourceAnalytics> {
    try {
      const resources = await this.getResources();
      
      const totalResources = resources.length;
      const totalBookmarks = resources.reduce((sum, resource) => sum + resource.bookmarkCount, 0);
      
      // Top categories
      const topCategories: { [category: string]: number } = {};
      resources.forEach(resource => {
        topCategories[resource.category] = (topCategories[resource.category] || 0) + 1;
      });

      // Trending resources (top 10 by bookmark count)
      const trendingResources = resources
        .sort((a, b) => b.bookmarkCount - a.bookmarkCount)
        .slice(0, 10);

      // Recently added (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentlyAdded = resources
        .filter(resource => resource.createdAt > thirtyDaysAgo)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      return {
        totalResources,
        totalBookmarks,
        topCategories,
        trendingResources,
        recentlyAdded
      };
    } catch (error) {
      console.error('Error getting resource analytics:', error);
      return {
        totalResources: 0,
        totalBookmarks: 0,
        topCategories: {},
        trendingResources: [],
        recentlyAdded: []
      };
    }
  }

  // Initialize with sample data (for development)
  async initializeSampleResources(): Promise<void> {
    try {
      const sampleResources: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
        // Frontend Resources
        {
          title: "Complete React Developer Course",
          description: "Master React from basics to advanced concepts including hooks, context, and testing",
          url: "https://www.udemy.com/course/react-the-complete-guide/",
          type: "course",
          category: "frontend",
          provider: "Udemy",
          difficulty: "intermediate",
          duration: "40 hours",
          price: "paid",
          rating: 4.8,
          tags: ["react", "javascript", "hooks", "redux"],
          imageUrl: "https://img-c.udemycdn.com/course/240x135/1362070_b9a1_2.jpg",
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Frontend Masters - Complete Intro to React",
          description: "Learn React fundamentals with hands-on projects and real-world examples",
          url: "https://frontendmasters.com/courses/complete-react-v8/",
          type: "course",
          category: "frontend",
          provider: "Frontend Masters",
          difficulty: "beginner",
          duration: "6 hours",
          price: "paid",
          rating: 4.9,
          tags: ["react", "javascript", "components", "jsx"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Vue.js 3 Composition API",
          description: "Deep dive into Vue 3's Composition API and modern Vue development",
          url: "https://www.vuemastery.com/courses/vue-3-essentials/",
          type: "course",
          category: "frontend",
          provider: "Vue Mastery",
          difficulty: "intermediate",
          duration: "4 hours",
          price: "freemium",
          rating: 4.7,
          tags: ["vue", "composition-api", "javascript"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // Backend Resources
        {
          title: "Node.js Complete Guide",
          description: "Build scalable backend applications with Node.js, Express, and MongoDB",
          url: "https://www.udemy.com/course/nodejs-the-complete-guide/",
          type: "course",
          category: "backend",
          provider: "Udemy",
          difficulty: "intermediate",
          duration: "35 hours",
          price: "paid",
          rating: 4.6,
          tags: ["nodejs", "express", "mongodb", "api"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Python Django REST Framework",
          description: "Build powerful REST APIs with Django and Python",
          url: "https://www.django-rest-framework.org/tutorial/",
          type: "tutorial",
          category: "backend",
          provider: "Django",
          difficulty: "intermediate",
          duration: "8 hours",
          price: "free",
          rating: 4.5,
          tags: ["python", "django", "rest-api", "backend"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // DevOps Resources
        {
          title: "Docker Mastery Course",
          description: "Complete Docker course from basics to production deployment",
          url: "https://www.udemy.com/course/docker-mastery/",
          type: "course",
          category: "devops",
          provider: "Udemy",
          difficulty: "intermediate",
          duration: "20 hours",
          price: "paid",
          rating: 4.8,
          tags: ["docker", "containers", "devops", "kubernetes"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Kubernetes Official Documentation",
          description: "Comprehensive guide to Kubernetes concepts and operations",
          url: "https://kubernetes.io/docs/home/",
          type: "documentation",
          category: "devops",
          provider: "Kubernetes",
          difficulty: "advanced",
          price: "free",
          rating: 4.9,
          tags: ["kubernetes", "orchestration", "devops", "containers"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // Certifications
        {
          title: "AWS Certified Solutions Architect",
          description: "Official AWS certification for cloud architecture",
          url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
          type: "certification",
          category: "cloud-engineer",
          provider: "AWS",
          difficulty: "intermediate",
          duration: "3 months prep",
          price: "paid",
          rating: 4.7,
          tags: ["aws", "cloud", "certification", "architecture"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Google Cloud Professional Developer",
          description: "Google Cloud certification for application developers",
          url: "https://cloud.google.com/certification/cloud-developer",
          type: "certification",
          category: "cloud-engineer",
          provider: "Google Cloud",
          difficulty: "advanced",
          duration: "4 months prep",
          price: "paid",
          rating: 4.6,
          tags: ["gcp", "cloud", "certification", "development"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // Data Science Resources
        {
          title: "Machine Learning Specialization",
          description: "Complete machine learning course by Andrew Ng",
          url: "https://www.coursera.org/specializations/machine-learning-introduction",
          type: "course",
          category: "data-science",
          provider: "Coursera",
          difficulty: "intermediate",
          duration: "3 months",
          price: "freemium",
          rating: 4.9,
          tags: ["machine-learning", "python", "tensorflow", "data-science"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // Mobile Development
        {
          title: "React Native Complete Course",
          description: "Build mobile apps with React Native for iOS and Android",
          url: "https://www.udemy.com/course/the-complete-react-native-and-redux-course/",
          type: "course",
          category: "mobile",
          provider: "Udemy",
          difficulty: "intermediate",
          duration: "30 hours",
          price: "paid",
          rating: 4.5,
          tags: ["react-native", "mobile", "ios", "android"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },

        // UI/UX Design
        {
          title: "Figma UI/UX Design Course",
          description: "Complete guide to UI/UX design using Figma",
          url: "https://www.figma.com/resources/learn-design/",
          type: "course",
          category: "ui-ux-designer",
          provider: "Figma",
          difficulty: "beginner",
          duration: "10 hours",
          price: "free",
          rating: 4.7,
          tags: ["figma", "ui-design", "ux-design", "prototyping"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        }
      ];

      // Add each resource to Firestore
      for (const resource of sampleResources) {
        await addDoc(collection(db, this.resourcesCollection), {
          ...resource,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('Sample resources initialized successfully');
    } catch (error) {
      console.error('Error initializing sample resources:', error);
    }
  }
}

export const resourcesService = new ResourcesService();