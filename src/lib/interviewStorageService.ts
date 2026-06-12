import { collection, addDoc, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export interface StoredInterviewSession {
  id?: string;
  userId: string;
  role: string;
  level: string;
  mode: 'practice' | 'ai-audio' | 'ai-video';
  questions: any[];
  answers: Array<{
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
    timeSpent: number;
    analysisResult?: any;
    bodyLanguageScore?: number;
  }>;
  bodyLanguageMetrics?: any[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'abandoned';
  overallScore: number;
  bodyLanguageScore: number;
  completionPercentage: number;
  totalQuestions: number;
  answeredQuestions: number;
  duration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewAnalytics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  averageBodyLanguageScore: number;
  averageCompletionRate: number;
  roleBreakdown: { [role: string]: number };
  scoreDistribution: { [range: string]: number };
  recentTrend: number; // positive/negative trend
}

class InterviewStorageService {
  private collectionName = 'interviews';

  // Save a new interview session
  async saveInterview(session: Omit<StoredInterviewSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Attempting to save interview session for user:', session.userId);
      
      const interviewData = {
        ...session,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.collectionName), interviewData);
      console.log('Interview saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving interview:', error);
      throw error;
    }
  }

  // Update an existing interview session
  async updateInterview(interviewId: string, updates: Partial<StoredInterviewSession>): Promise<void> {
    try {
      const interviewRef = doc(db, this.collectionName, interviewId);
      await updateDoc(interviewRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('Interview updated:', interviewId);
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  }

  // Get all interviews for a user
  async getUserInterviews(userId: string): Promise<StoredInterviewSession[]> {
    try {
      console.log('Fetching interviews for user:', userId);
      
      // Try the optimized query first
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      let querySnapshot;
      
      try {
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        console.log('Composite index not available, falling back to simple query');
        // Fallback to simple query without orderBy if index doesn't exist
        q = query(
          collection(db, this.collectionName),
          where('userId', '==', userId)
        );
        querySnapshot = await getDocs(q);
      }
      
      const interviews: StoredInterviewSession[] = [];
      
      console.log('Found', querySnapshot.size, 'interviews for user');
      
      querySnapshot.forEach((doc) => {
        interviews.push({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate(),
          endTime: doc.data().endTime?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        } as StoredInterviewSession);
      });
      
      // Sort manually if we used the fallback query
      interviews.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return interviews;
    } catch (error) {
      console.error('Error fetching user interviews:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Return empty array instead of throwing error for new users or missing collections
      if (error.code === 'failed-precondition' || 
          error.code === 'not-found' || 
          error.code === 'permission-denied' ||
          error.message?.includes('index')) {
        console.log('Returning empty array - this is normal for new users or missing indexes');
        return [];
      }
      throw error;
    }
  }

  // Get interview analytics for a user
  async getUserAnalytics(userId: string): Promise<InterviewAnalytics> {
    try {
      const interviews = await this.getUserInterviews(userId);
      
      // Handle case where user has no interviews yet
      if (interviews.length === 0) {
        return {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          averageBodyLanguageScore: 0,
          averageCompletionRate: 0,
          roleBreakdown: {},
          scoreDistribution: {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
          },
          recentTrend: 0
        };
      }
      
      const totalInterviews = interviews.length;
      const completedInterviews = interviews.filter(i => i.status === 'completed').length;
      
      const completedInterviewsData = interviews.filter(i => i.status === 'completed');
      const averageScore = completedInterviewsData.length > 0 
        ? completedInterviewsData.reduce((sum, i) => sum + i.overallScore, 0) / completedInterviewsData.length 
        : 0;
      
      const averageBodyLanguageScore = completedInterviewsData.length > 0
        ? completedInterviewsData.reduce((sum, i) => sum + (i.bodyLanguageScore || 0), 0) / completedInterviewsData.length
        : 0;

      const averageCompletionRate = interviews.length > 0
        ? interviews.reduce((sum, i) => sum + i.completionPercentage, 0) / interviews.length
        : 0;

      // Role breakdown
      const roleBreakdown: { [role: string]: number } = {};
      interviews.forEach(i => {
        roleBreakdown[i.role] = (roleBreakdown[i.role] || 0) + 1;
      });

      // Score distribution
      const scoreDistribution: { [range: string]: number } = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      };

      completedInterviewsData.forEach(i => {
        const score = i.overallScore;
        if (score <= 20) scoreDistribution['0-20']++;
        else if (score <= 40) scoreDistribution['21-40']++;
        else if (score <= 60) scoreDistribution['41-60']++;
        else if (score <= 80) scoreDistribution['61-80']++;
        else scoreDistribution['81-100']++;
      });

      // Recent trend (last 5 vs previous 5)
      const recentInterviews = completedInterviewsData.slice(0, 5);
      const previousInterviews = completedInterviewsData.slice(5, 10);
      
      const recentAvg = recentInterviews.length > 0 
        ? recentInterviews.reduce((sum, i) => sum + i.overallScore, 0) / recentInterviews.length 
        : 0;
      const previousAvg = previousInterviews.length > 0 
        ? previousInterviews.reduce((sum, i) => sum + i.overallScore, 0) / previousInterviews.length 
        : 0;
      
      const recentTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

      return {
        totalInterviews,
        completedInterviews,
        averageScore: Math.round(averageScore),
        averageBodyLanguageScore: Math.round(averageBodyLanguageScore),
        averageCompletionRate: Math.round(averageCompletionRate),
        roleBreakdown,
        scoreDistribution,
        recentTrend: Math.round(recentTrend)
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      // Return default analytics instead of throwing error
      return {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        averageBodyLanguageScore: 0,
        averageCompletionRate: 0,
        roleBreakdown: {},
        scoreDistribution: {
          '0-20': 0,
          '21-40': 0,
          '41-60': 0,
          '61-80': 0,
          '81-100': 0
        },
        recentTrend: 0
      };
    }
  }

  // Calculate completion percentage
  calculateCompletionPercentage(answeredQuestions: number, totalQuestions: number): number {
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  }

  // Calculate duration in seconds
  calculateDuration(startTime: Date, endTime?: Date): number {
    const end = endTime || new Date();
    return Math.round((end.getTime() - startTime.getTime()) / 1000);
  }
}

export const interviewStorageService = new InterviewStorageService();