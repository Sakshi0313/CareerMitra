interface BodyLanguageMetrics {
  isUnusualMovement: boolean;
  movementType: 'dancing' | 'excessive_gesturing' | 'fidgeting' | 'looking_away' | 'leaning_too_much' | 'normal';
  eyeContact: number;
  posture: 'good' | 'slouching' | 'leaning' | 'moving_too_much' | 'looking_away';
  confidence: number;
  engagement: number;
  nervousness: number;
  lastMovementTime: number;
  lookingAwayCount: number;
  excessiveMovementCount: number;
}

interface MovementData {
  timestamp: number;
  intensity: number;
  type: string;
}

class BodyLanguageDetector {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private previousFrame: ImageData | null = null;
  private movementHistory: MovementData[] = [];
  private isAnalyzing = false;
  private analysisInterval: NodeJS.Timeout | null = null;
  private lastWarningTime = 0; // Add cooldown for warnings
  private warningCooldown = 5000; // 5 seconds between warnings
  private lookingAwayCount = 0;
  private excessiveMovementCount = 0;
  private centerRegionThreshold = 0.3; // 30% of frame center for face detection
  
  // Callbacks
  private onUnusualMovementCallback: ((type: string, message: string) => void) | null = null;
  private onMetricsUpdateCallback: ((metrics: BodyLanguageMetrics) => void) | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.canvas.width = 320;
    this.canvas.height = 240;
  }

  // Set up callbacks
  onUnusualMovement(callback: (type: string, message: string) => void) {
    this.onUnusualMovementCallback = callback;
  }

  onMetricsUpdate(callback: (metrics: BodyLanguageMetrics) => void) {
    this.onMetricsUpdateCallback = callback;
  }

  // Start analyzing video stream
  startAnalysis(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.isAnalyzing = true;
    
    // Analyze every 500ms
    this.analysisInterval = setInterval(() => {
      this.analyzeFrame();
    }, 500);
    
    console.log('Body language analysis started');
  }

  // Stop analysis
  stopAnalysis() {
    this.isAnalyzing = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.videoElement = null;
    this.previousFrame = null;
    this.movementHistory = [];
    this.lastWarningTime = 0; // Reset warning cooldown
    
    console.log('Body language analysis stopped');
  }

  // Analyze current frame for movement
  private analyzeFrame() {
    if (!this.videoElement || !this.isAnalyzing) return;

    try {
      // Draw current frame to canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const currentFrame = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      if (this.previousFrame) {
        const movementIntensity = this.calculateMovementIntensity(this.previousFrame, currentFrame);
        const timestamp = Date.now();
        
        // Add to movement history
        this.movementHistory.push({
          timestamp,
          intensity: movementIntensity,
          type: this.classifyMovement(movementIntensity)
        });
        
        // Keep only last 10 seconds of data
        this.movementHistory = this.movementHistory.filter(
          data => timestamp - data.timestamp < 10000
        );
        
        // Analyze movement patterns
        this.analyzeMovementPatterns();
      }
      
      this.previousFrame = currentFrame;
    } catch (error) {
      console.error('Error analyzing frame:', error);
    }
  }

  // Calculate movement intensity between frames
  private calculateMovementIntensity(prevFrame: ImageData, currentFrame: ImageData): number {
    const prevData = prevFrame.data;
    const currentData = currentFrame.data;
    let totalDiff = 0;
    let pixelCount = 0;
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < prevData.length; i += 16) {
      const prevR = prevData[i];
      const prevG = prevData[i + 1];
      const prevB = prevData[i + 2];
      
      const currentR = currentData[i];
      const currentG = currentData[i + 1];
      const currentB = currentData[i + 2];
      
      const diff = Math.abs(prevR - currentR) + Math.abs(prevG - currentG) + Math.abs(prevB - currentB);
      totalDiff += diff;
      pixelCount++;
    }
    
    return pixelCount > 0 ? totalDiff / pixelCount : 0;
  }

  // Classify movement type based on intensity
  private classifyMovement(intensity: number): string {
    if (intensity > 50) return 'high';
    if (intensity > 25) return 'medium';
    if (intensity > 10) return 'low';
    return 'minimal';
  }

  // Analyze movement patterns to detect unusual behavior
  private analyzeMovementPatterns() {
    if (this.movementHistory.length < 3) return;

    const recentMovements = this.movementHistory.slice(-8);
    const avgIntensity = recentMovements.reduce((sum, data) => sum + data.intensity, 0) / recentMovements.length;
    const highIntensityCount = recentMovements.filter(data => data.intensity > 30).length;
    const mediumIntensityCount = recentMovements.filter(data => data.intensity > 20).length;
    const lowIntensityCount = recentMovements.filter(data => data.intensity < 5).length;
    
    let movementType: 'dancing' | 'excessive_gesturing' | 'fidgeting' | 'looking_away' | 'leaning_too_much' | 'normal' = 'normal';
    let isUnusualMovement = false;
    let message = '';

    // Generate metrics first to check scores
    const eyeContact = this.estimateEyeContact(avgIntensity);
    const confidence = this.estimateConfidence(avgIntensity, false);
    const engagement = this.estimateEngagement(avgIntensity);

    // Only warn if scores are actually low (below 60%)
    const shouldWarn = eyeContact < 60 || confidence < 60 || engagement < 60;

    if (shouldWarn) {
      // Detect looking away (very low movement in center)
      if (lowIntensityCount >= 6 && this.detectLookingAway()) {
        movementType = 'looking_away';
        isUnusualMovement = true;
        this.lookingAwayCount++;
        message = "Please maintain eye contact with the camera for better engagement.";
      }
      // Detect dancing (very high intensity movements)
      else if (highIntensityCount >= 4 && avgIntensity > 35) {
        movementType = 'dancing';
        isUnusualMovement = true;
        this.excessiveMovementCount++;
        message = "Please try to sit still and maintain professional posture.";
      }
      // Detect excessive gesturing
      else if (mediumIntensityCount >= 6 && avgIntensity > 25) {
        movementType = 'excessive_gesturing';
        isUnusualMovement = true;
        this.excessiveMovementCount++;
        message = "Try to keep your hand movements more controlled.";
      }
      // Detect excessive leaning
      else if (this.detectExcessiveLeaning(recentMovements)) {
        movementType = 'leaning_too_much';
        isUnusualMovement = true;
        message = "Please maintain good posture and sit up straight.";
      }
      // Detect fidgeting (only if confidence is very low)
      else if (confidence < 50 && avgIntensity > 15) {
        movementType = 'fidgeting';
        isUnusualMovement = true;
        message = "Take a deep breath and try to relax.";
      }
    }

    // Generate final metrics
    const metrics: BodyLanguageMetrics = {
      isUnusualMovement,
      movementType,
      eyeContact,
      posture: this.estimatePosture(avgIntensity, highIntensityCount, movementType),
      confidence,
      engagement,
      nervousness: this.estimateNervousness(avgIntensity, highIntensityCount),
      lastMovementTime: Date.now(),
      lookingAwayCount: this.lookingAwayCount,
      excessiveMovementCount: this.excessiveMovementCount
    };

    // Trigger callbacks - only warn if scores are low AND cooldown has passed
    if (isUnusualMovement && this.onUnusualMovementCallback) {
      const now = Date.now();
      if (now - this.lastWarningTime > this.warningCooldown) {
        this.onUnusualMovementCallback(movementType, message);
        this.lastWarningTime = now;
      }
    }

    if (this.onMetricsUpdateCallback) {
      this.onMetricsUpdateCallback(metrics);
    }
  }

  // Detect if user is looking away from camera
  private detectLookingAway(): boolean {
    if (!this.previousFrame) return false;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const centerWidth = this.canvas.width * this.centerRegionThreshold;
    const centerHeight = this.canvas.height * this.centerRegionThreshold;
    
    // Check movement in center region vs edges
    const centerMovement = this.getRegionMovement(
      centerX - centerWidth/2, 
      centerY - centerHeight/2, 
      centerWidth, 
      centerHeight
    );
    
    const totalMovement = this.calculateMovementIntensity(this.previousFrame, 
      this.context.getImageData(0, 0, this.canvas.width, this.canvas.height));
    
    // If center movement is significantly less than total, user might be looking away
    return centerMovement < totalMovement * 0.3;
  }

  // Detect excessive leaning
  private detectExcessiveLeaning(movements: MovementData[]): boolean {
    if (movements.length < 5) return false;
    
    // Check if movement is consistently high (indicating leaning/shifting)
    const consistentMovement = movements.filter(m => m.intensity > 20).length;
    return consistentMovement >= 4;
  }

  // Get movement in a specific region
  private getRegionMovement(x: number, y: number, width: number, height: number): number {
    if (!this.previousFrame) return 0;
    
    const currentFrame = this.context.getImageData(x, y, width, height);
    const prevRegion = this.context.getImageData(x, y, width, height);
    
    return this.calculateMovementIntensity(prevRegion, currentFrame);
  }

  // Estimate eye contact based on movement (less movement = better eye contact)
  private estimateEyeContact(avgIntensity: number): number {
    if (avgIntensity < 10) return 85;
    if (avgIntensity < 20) return 70;
    if (avgIntensity < 30) return 55;
    return 40;
  }

  // Estimate posture based on movement intensity
  private estimatePosture(avgIntensity: number, highIntensityCount: number, movementType: string): 'good' | 'slouching' | 'leaning' | 'moving_too_much' | 'looking_away' {
    if (movementType === 'looking_away') return 'looking_away';
    if (highIntensityCount >= 3) return 'moving_too_much';
    if (avgIntensity < 15) return 'good';
    if (avgIntensity < 25) return 'leaning';
    return 'slouching';
  }

  // Estimate confidence (excessive movement can indicate nervousness)
  private estimateConfidence(avgIntensity: number, isUnusualMovement: boolean): number {
    let confidence = 75;
    
    if (isUnusualMovement) confidence -= 20;
    if (avgIntensity > 30) confidence -= 15;
    if (avgIntensity < 10) confidence += 10;
    
    return Math.max(20, Math.min(95, confidence));
  }

  // Estimate engagement (some movement is good, too much or too little is bad)
  private estimateEngagement(avgIntensity: number): number {
    if (avgIntensity < 5) return 60; // Too still
    if (avgIntensity < 20) return 85; // Good engagement
    if (avgIntensity < 35) return 70; // A bit too much
    return 50; // Way too much movement
  }

  // Estimate nervousness based on movement patterns
  private estimateNervousness(avgIntensity: number, highIntensityCount: number): number {
    let nervousness = 30;
    
    if (highIntensityCount >= 3) nervousness += 30;
    if (avgIntensity > 25) nervousness += 20;
    if (avgIntensity < 8) nervousness -= 10;
    
    return Math.max(10, Math.min(90, nervousness));
  }

  // Get current metrics without triggering callbacks
  getCurrentMetrics(): BodyLanguageMetrics | null {
    if (this.movementHistory.length < 3) return null;

    const recentMovements = this.movementHistory.slice(-5);
    const avgIntensity = recentMovements.reduce((sum, data) => sum + data.intensity, 0) / recentMovements.length;
    const highIntensityCount = recentMovements.filter(data => data.intensity > 40).length;

    return {
      isUnusualMovement: highIntensityCount >= 2,
      movementType: highIntensityCount >= 2 ? 'dancing' : 'normal',
      eyeContact: this.estimateEyeContact(avgIntensity),
      posture: this.estimatePosture(avgIntensity, highIntensityCount),
      confidence: this.estimateConfidence(avgIntensity, highIntensityCount >= 2),
      engagement: this.estimateEngagement(avgIntensity),
      nervousness: this.estimateNervousness(avgIntensity, highIntensityCount),
      lastMovementTime: Date.now()
    };
  }
}

export default BodyLanguageDetector;
export type { BodyLanguageMetrics };