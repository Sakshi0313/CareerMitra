import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserStats {
  atsScore: number;
  mockInterviews: number;
  skillsCount: number;
  roadmapProgress: number;
  profileCompleteness: number;
  lastInterviewScore: number;
  totalInterviewTime: number;
  averageScore: number;
  improvementTrend: number;
  lastUpdated: Date;
}

export interface InterviewResult {
  id: string;
  userId: string;
  role: string;
  difficulty: string;
  questionsAnswered: number;
  totalQuestions: number;
  averageScore: number;
  totalScore: number;
  duration: number;
  timestamp: Date;
  type: 'audio' | 'video';
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

export interface ATSAnalysis {
  id: string;
  userId: string;
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordsFound: string[];
  missingKeywords: string[];
  suggestions: string[];
  jobTitle: string;
  timestamp: Date;
  resumeText?: string;
}

export interface RoadmapProgress {
  id: string;
  userId: string;
  currentLevel: string;
  targetRole: string;
  completedSkills: string[];
  inProgressSkills: string[];
  recommendedSkills: string[];
  milestones: {
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  overallProgress: number;
  lastUpdated: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'interview' | 'ats_analysis' | 'profile_update' | 'skill_added' | 'roadmap_update';
  description: string;
  timestamp: Date;
  metadata?: any;
}

class RealtimeDataService {
  // Subscribe to user stats
  subscribeToUserStats(
    userId: string,
    callback: (stats: UserStats) => void
  ): () => void {
    const userStatsRef = doc(db, 'userStats', userId);
    
    return onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const stats: UserStats = {
          atsScore: data.atsScore || 0,
          mockInterviews: data.mockInterviews || 0,
          skillsCount: data.skillsCount || 0,
          roadmapProgress: data.roadmapProgress || 0,
          profileCompleteness: data.profileCompleteness || 0,
          lastInterviewScore: data.lastInterviewScore || 0,
          totalInterviewTime: data.totalInterviewTime || 0,
          averageScore: data.averageScore || 0,
          improvementTrend: data.improvementTrend || 0,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        };
        callback(stats);
      } else {
        // Initialize empty stats if document doesn't exist
        const emptyStats: UserStats = {
          atsScore: 0,
          mockInterviews: 0,
          skillsCount: 0,
          roadmapProgress: 0,
          profileCompleteness: 0,
          lastInterviewScore: 0,
          totalInterviewTime: 0,
          averageScore: 0,
          improvementTrend: 0,
          lastUpdated: new Date()
        };
        callback(emptyStats);
      }
    }, (error) => {
      console.error('Error subscribing to user stats:', error);
    });
  }

  // Subscribe to interview results
  subscribeToInterviewResults(
    userId: string,
    callback: (interviews: InterviewResult[]) => void,
    limitCount: number = 10
  ): () => void {
    const interviewsRef = collection(db, 'interviewResults');
    const q = query(
      interviewsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const interviews: InterviewResult[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as InterviewResult[];
      
      callback(interviews);
    }, (error) => {
      console.error('Error subscribing to interview results:', error);
    });
  }

  // Subscribe to ATS analyses
  subscribeToATSAnalyses(
    userId: string,
    callback: (analyses: ATSAnalysis[]) => void,
    limitCount: number = 5
  ): () => void {
    const atsRef = collection(db, 'atsAnalyses');
    const q = query(
      atsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const analyses: ATSAnalysis[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ATSAnalysis[];
      
      callback(analyses);
    }, (error) => {
      console.error('Error subscribing to ATS analyses:', error);
    });
  }

  // Subscribe to roadmap progress
  subscribeToRoadmapProgress(
    userId: string,
    callback: (roadmap: RoadmapProgress | null) => void
  ): () => void {
    const roadmapRef = doc(db, 'roadmapProgress', userId);
    
    return onSnapshot(roadmapRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const roadmap: RoadmapProgress = {
          id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          milestones: data.milestones?.map((m: any) => ({
            ...m,
            completedAt: m.completedAt?.toDate()
          })) || []
        };
        callback(roadmap);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to roadmap progress:', error);
    });
  }

  // Subscribe to user activities
  subscribeToUserActivities(
    userId: string,
    callback: (activities: UserActivity[]) => void,
    limitCount: number = 20
  ): () => void {
    const activitiesRef = collection(db, 'userActivities');
    const q = query(
      activitiesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const activities: UserActivity[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as UserActivity[];
      
      callback(activities);
    }, (error) => {
      console.error('Error subscribing to user activities:', error);
    });
  }

  // Update user stats
  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
    try {
      const userStatsRef = doc(db, 'userStats', userId);
      await updateDoc(userStatsRef, {
        ...stats,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Save interview result
  async saveInterviewResult(result: Omit<InterviewResult, 'id'>): Promise<string> {
    try {
      const interviewsRef = collection(db, 'interviewResults');
      const docRef = await setDoc(doc(interviewsRef), {
        ...result,
        timestamp: serverTimestamp()
      });
      
      // Update user stats
      await this.recalculateUserStats(result.userId);
      
      // Add activity
      await this.addUserActivity(result.userId, 'interview', 
        `Completed ${result.type} interview for ${result.role} role`, {
          score: result.averageScore,
          duration: result.duration
        });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving interview result:', error);
      throw error;
    }
  }

  // Save ATS analysis
  async saveATSAnalysis(analysis: Omit<ATSAnalysis, 'id'>): Promise<string> {
    try {
      const atsRef = collection(db, 'atsAnalyses');
      const docRef = await setDoc(doc(atsRef), {
        ...analysis,
        timestamp: serverTimestamp()
      });
      
      // Update user stats
      await this.recalculateUserStats(analysis.userId);
      
      // Add activity
      await this.addUserActivity(analysis.userId, 'ats_analysis', 
        `Resume analyzed for ${analysis.jobTitle} - Score: ${analysis.overallScore}%`, {
          score: analysis.overallScore,
          jobTitle: analysis.jobTitle
        });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving ATS analysis:', error);
      throw error;
    }
  }

  // Update roadmap progress
  async updateRoadmapProgress(userId: string, progress: Omit<RoadmapProgress, 'id' | 'userId'>): Promise<void> {
    try {
      const roadmapRef = doc(db, 'roadmapProgress', userId);
      await setDoc(roadmapRef, {
        ...progress,
        userId,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Update user stats
      await this.recalculateUserStats(userId);
      
      // Add activity
      await this.addUserActivity(userId, 'roadmap_update', 
        `Roadmap updated - ${progress.overallProgress}% complete`, {
          progress: progress.overallProgress,
          targetRole: progress.targetRole
        });
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
      throw error;
    }
  }

  // Add user activity
  async addUserActivity(userId: string, type: UserActivity['type'], description: string, metadata?: any): Promise<void> {
    try {
      const activitiesRef = collection(db, 'userActivities');
      await setDoc(doc(activitiesRef), {
        userId,
        type,
        description,
        metadata,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding user activity:', error);
    }
  }

  // Recalculate user stats based on all data
  private async recalculateUserStats(userId: string): Promise<void> {
    try {
      // This would typically fetch all user data and recalculate stats
      // For now, we'll implement a basic version
      console.log('Recalculating stats for user:', userId);
      
      // In a real implementation, you would:
      // 1. Fetch all interview results
      // 2. Fetch latest ATS analysis
      // 3. Fetch user profile
      // 4. Calculate all stats
      // 5. Update userStats document
      
    } catch (error) {
      console.error('Error recalculating user stats:', error);
    }
  }

  // Calculate profile completeness
  calculateProfileCompleteness(userProfile: any): number {
    if (!userProfile) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    // Basic info (40 points)
    if (userProfile.displayName) score += 10;
    if (userProfile.email) score += 10;
    if (userProfile.bio) score += 10;
    if (userProfile.location) score += 10;
    
    // Professional info (30 points)
    if (userProfile.currentRole) score += 10;
    if (userProfile.experience) score += 10;
    if (userProfile.targetRoles?.length > 0) score += 10;
    
    // Skills and education (20 points)
    if (userProfile.skills?.length >= 3) score += 10;
    if (userProfile.university || userProfile.college) score += 10;
    
    // Links and extras (10 points)
    if (userProfile.linkedinUrl) score += 5;
    if (userProfile.githubUrl || userProfile.portfolioUrl) score += 5;
    
    return Math.min(score, maxScore);
  }
}

export const realtimeDataService = new RealtimeDataService();