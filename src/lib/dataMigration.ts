import { realtimeDataService, type InterviewResult, type ATSAnalysis } from './realtimeDataService';

export class DataMigrationService {
  // Migrate interview results from localStorage to Firebase
  static async migrateInterviewResults(userId: string): Promise<void> {
    try {
      console.log('Migrating interview results for user:', userId);
      
      const localData = localStorage.getItem('interviewResults');
      if (!localData) {
        console.log('No interview results found in localStorage');
        return;
      }

      const interviews = JSON.parse(localData) as any[];
      console.log('Found', interviews.length, 'interview results to migrate');

      for (const interview of interviews) {
        const interviewResult: Omit<InterviewResult, 'id'> = {
          userId,
          role: interview.role || 'Unknown',
          difficulty: interview.difficulty || 'Medium',
          questionsAnswered: interview.questionsAnswered || 0,
          totalQuestions: interview.totalQuestions || 0,
          averageScore: interview.averageScore || 0,
          totalScore: interview.totalScore || 0,
          duration: interview.duration || 0,
          timestamp: new Date(interview.timestamp || Date.now()),
          type: interview.type || 'audio',
          feedback: interview.feedback,
          strengths: interview.strengths || [],
          improvements: interview.improvements || []
        };

        await realtimeDataService.saveInterviewResult(interviewResult);
      }

      console.log('Successfully migrated', interviews.length, 'interview results');
      
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem('interviewResults');
      
    } catch (error) {
      console.error('Error migrating interview results:', error);
      throw error;
    }
  }

  // Migrate ATS analysis from localStorage to Firebase
  static async migrateATSAnalysis(userId: string): Promise<void> {
    try {
      console.log('Migrating ATS analysis for user:', userId);
      
      // Try both user-specific and general keys
      const atsDataKey = `ats_analysis_${userId}`;
      let atsData = localStorage.getItem(atsDataKey) || localStorage.getItem('atsAnalysisResult');
      
      if (!atsData) {
        console.log('No ATS analysis found in localStorage');
        return;
      }

      const parsedAts = JSON.parse(atsData);
      console.log('Found ATS analysis to migrate:', parsedAts);

      const atsAnalysis: Omit<ATSAnalysis, 'id'> = {
        userId,
        overallScore: parsedAts.overallScore || parsedAts.score || parsedAts.atsScore || 0,
        skillsMatch: parsedAts.skillsMatch || 0,
        experienceMatch: parsedAts.experienceMatch || 0,
        educationMatch: parsedAts.educationMatch || 0,
        keywordsFound: parsedAts.keywordsFound || [],
        missingKeywords: parsedAts.missingKeywords || [],
        suggestions: parsedAts.suggestions || [],
        jobTitle: parsedAts.jobTitle || 'Unknown Position',
        timestamp: new Date(parsedAts.timestamp || Date.now()),
        resumeText: parsedAts.resumeText
      };

      await realtimeDataService.saveATSAnalysis(atsAnalysis);
      console.log('Successfully migrated ATS analysis');
      
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem(atsDataKey);
      // localStorage.removeItem('atsAnalysisResult');
      
    } catch (error) {
      console.error('Error migrating ATS analysis:', error);
      throw error;
    }
  }

  // Migrate all user data
  static async migrateAllUserData(userId: string): Promise<void> {
    try {
      console.log('Starting full data migration for user:', userId);
      
      await this.migrateInterviewResults(userId);
      await this.migrateATSAnalysis(userId);
      
      console.log('Full data migration completed successfully');
      
    } catch (error) {
      console.error('Error during full data migration:', error);
      throw error;
    }
  }

  // Check if user has data in localStorage that needs migration
  static hasDataToMigrate(): boolean {
    const hasInterviews = !!localStorage.getItem('interviewResults');
    const hasATS = !!localStorage.getItem('atsAnalysisResult');
    
    return hasInterviews || hasATS;
  }

  // Get migration status
  static getMigrationStatus(): {
    hasInterviews: boolean;
    hasATS: boolean;
    interviewCount: number;
    needsMigration: boolean;
  } {
    const interviewData = localStorage.getItem('interviewResults');
    const atsData = localStorage.getItem('atsAnalysisResult');
    
    const hasInterviews = !!interviewData;
    const hasATS = !!atsData;
    const interviewCount = hasInterviews ? JSON.parse(interviewData).length : 0;
    
    return {
      hasInterviews,
      hasATS,
      interviewCount,
      needsMigration: hasInterviews || hasATS
    };
  }
}

export const dataMigrationService = DataMigrationService;