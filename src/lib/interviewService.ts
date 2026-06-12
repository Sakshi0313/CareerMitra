// Interview Service for AI Analysis and LiveKit Integration

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer: string;
  keywords: string[];
  followUp?: string;
  timeLimit: number;
}

export interface BodyLanguageMetrics {
  eyeContact: number;
  facialExpression: 'neutral' | 'positive' | 'negative' | 'confused';
  handGestures: number;
  posture: 'good' | 'slouching' | 'leaning';
  confidence: number;
  engagement: number;
  nervousness: number;
}

export interface InterviewAnalysis {
  answerScore: number;
  bodyLanguageScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

class InterviewService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // Generate LiveKit token for interview room
  async generateLiveKitToken(roomName: string, participantName: string): Promise<string> {
    try {
      // In a real implementation, this would call your backend
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
          metadata: JSON.stringify({
            role: 'interviewee',
            timestamp: Date.now()
          })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate LiveKit token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      // Return mock token for development
      return `mock-token-${Date.now()}`;
    }
  }

  // Analyze interview answer using AI
  async analyzeAnswer(
    answer: string, 
    question: InterviewQuestion, 
    bodyLanguageMetrics?: BodyLanguageMetrics
  ): Promise<InterviewAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(answer, question, bodyLanguageMetrics);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical interviewer and career coach. Analyze interview responses and provide constructive feedback.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze answer');
      }

      const data = await response.json();
      return this.parseAnalysisResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing answer:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(answer, question, bodyLanguageMetrics);
    }
  }

  // Generate AI interviewer questions based on role and difficulty
  async generateQuestions(role: string, difficulty: string, count: number = 5): Promise<InterviewQuestion[]> {
    try {
      const prompt = `Generate ${count} interview questions for a ${role} position at ${difficulty} level. 
      Include a mix of behavioral, technical, and situational questions. 
      Format as JSON array with id, question, type, difficulty, expectedAnswer, keywords, and timeLimit fields.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical interviewer. Generate relevant interview questions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating questions:', error);
      return this.getFallbackQuestions(role, difficulty);
    }
  }

  // Generate AI interviewer response for live calls
  async generateAIResponse(
    context: string, 
    userResponse: string, 
    role: string, 
    difficulty: string
  ): Promise<string> {
    try {
      const prompt = `You are an AI interviewer conducting a ${role} interview at ${difficulty} level.
      Context: ${context}
      Candidate's response: ${userResponse}
      
      Provide a natural, encouraging follow-up response. Ask the next question or provide feedback as appropriate.
      Keep responses conversational and professional.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a friendly, professional AI interviewer. Conduct natural conversations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "Thank you for your response. Let's move on to the next question.";
    }
  }

  // Text-to-Speech for AI interviewer
  async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  // Speech-to-Text for user responses
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // Private helper methods
  private buildAnalysisPrompt(
    answer: string, 
    question: InterviewQuestion, 
    bodyLanguageMetrics?: BodyLanguageMetrics
  ): string {
    let prompt = `Analyze this interview response:

Question: ${question.question}
Type: ${question.type}
Difficulty: ${question.difficulty}
Expected keywords: ${question.keywords.join(', ')}

Candidate's Answer: ${answer}

`;

    if (bodyLanguageMetrics) {
      prompt += `Body Language Metrics:
- Eye Contact: ${bodyLanguageMetrics.eyeContact}%
- Facial Expression: ${bodyLanguageMetrics.facialExpression}
- Posture: ${bodyLanguageMetrics.posture}
- Confidence: ${bodyLanguageMetrics.confidence}%
- Engagement: ${bodyLanguageMetrics.engagement}%
- Nervousness: ${bodyLanguageMetrics.nervousness}%

`;
    }

    prompt += `Provide analysis in this JSON format:
{
  "answerScore": number (0-100),
  "bodyLanguageScore": number (0-100, or 0 if no metrics),
  "feedback": "detailed feedback string",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    return prompt;
  }

  private parseAnalysisResponse(response: string): InterviewAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        answerScore: parsed.answerScore || 0,
        bodyLanguageScore: parsed.bodyLanguageScore || 0,
        feedback: parsed.feedback || 'No feedback available',
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return {
        answerScore: 50,
        bodyLanguageScore: 50,
        feedback: 'Analysis temporarily unavailable',
        strengths: ['Communication'],
        weaknesses: ['Technical depth'],
        recommendations: ['Practice more technical concepts']
      };
    }
  }

  private getFallbackAnalysis(
    answer: string, 
    question: InterviewQuestion, 
    bodyLanguageMetrics?: BodyLanguageMetrics
  ): InterviewAnalysis {
    // Simple keyword-based scoring as fallback
    const answerWords = answer.toLowerCase().split(/\s+/);
    const keywordMatches = question.keywords.filter(keyword => 
      answerWords.some(word => word.includes(keyword.toLowerCase()))
    ).length;
    
    const answerScore = Math.min(Math.round((keywordMatches / question.keywords.length) * 70 + 
                                           (answer.length / 200) * 30), 100);
    
    const bodyLanguageScore = bodyLanguageMetrics ? 
      Math.round((bodyLanguageMetrics.confidence + bodyLanguageMetrics.engagement) / 2) : 0;

    return {
      answerScore,
      bodyLanguageScore,
      feedback: `You covered ${keywordMatches} out of ${question.keywords.length} key concepts. ${
        answer.length < 100 ? 'Try to provide more detailed explanations.' : 'Good level of detail in your response.'
      }`,
      strengths: answerScore >= 70 ? ['Good understanding', 'Clear communication'] : ['Basic understanding'],
      weaknesses: answerScore < 70 ? ['Needs more detail', 'Missing key concepts'] : ['Minor improvements needed'],
      recommendations: ['Practice more examples', 'Review key concepts', 'Work on confidence']
    };
  }

  private getFallbackQuestions(role: string, difficulty: string): InterviewQuestion[] {
    // Return basic questions as fallback
    const baseQuestions = [
      {
        id: `${role}_${difficulty}_1`,
        question: `Tell me about your experience with ${role} development.`,
        type: 'behavioral' as const,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        expectedAnswer: `Should mention relevant experience, projects, and skills related to ${role}`,
        keywords: [role, 'experience', 'projects', 'skills'],
        timeLimit: 180
      },
      {
        id: `${role}_${difficulty}_2`,
        question: `What are the key technologies used in ${role} development?`,
        type: 'technical' as const,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        expectedAnswer: `Should mention relevant technologies and frameworks for ${role}`,
        keywords: ['technologies', 'frameworks', 'tools'],
        timeLimit: 150
      }
    ];

    return baseQuestions;
  }
}

export const interviewService = new InterviewService();