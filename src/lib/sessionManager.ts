/**
 * Global Session Manager
 * Handles complete termination of all voice agents and audio processes
 */

class SessionManager {
  private static instance: SessionManager;
  private activeSessions: Set<string> = new Set();
  private speechSynthesisActive = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Register a new session
   */
  registerSession(sessionId: string): void {
    console.log(`📝 Registering session: ${sessionId}`);
    this.activeSessions.add(sessionId);
  }

  /**
   * Unregister a session
   */
  unregisterSession(sessionId: string): void {
    console.log(`📝 Unregistering session: ${sessionId}`);
    this.activeSessions.delete(sessionId);
  }

  /**
   * Mark speech synthesis as active
   */
  setSpeechActive(active: boolean): void {
    this.speechSynthesisActive = active;
    console.log(`🔊 Speech synthesis ${active ? 'activated' : 'deactivated'}`);
  }

  /**
   * Force stop all speech synthesis globally
   */
  forceStopAllSpeech(): void {
    console.log('🛑 GLOBAL FORCE STOP ALL SPEECH');
    
    if (typeof speechSynthesis !== 'undefined') {
      // Cancel immediately
      speechSynthesis.cancel();
      
      // Cancel multiple times with delays
      const delays = [0, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
      delays.forEach(delay => {
        setTimeout(() => {
          speechSynthesis.cancel();
        }, delay);
      });
      
      // Set all utterances to stop
      try {
        speechSynthesis.getVoices().forEach(() => {
          speechSynthesis.cancel();
        });
      } catch (error) {
        console.warn('Error stopping voices:', error);
      }
    }
    
    this.speechSynthesisActive = false;
    console.log('✅ Global speech stop completed');
  }

  /**
   * Terminate all active sessions
   */
  terminateAllSessions(): void {
    console.log('🔥 TERMINATING ALL ACTIVE SESSIONS');
    console.log(`Active sessions: ${Array.from(this.activeSessions).join(', ')}`);
    
    // Stop all speech first
    this.forceStopAllSpeech();
    
    // Clear all timers (brute force approach)
    this.clearAllTimers();
    
    // Close all audio contexts
    this.closeAllAudioContexts();
    
    // Clear all sessions
    this.activeSessions.clear();
    
    console.log('🏁 ALL SESSIONS TERMINATED');
  }

  /**
   * Clear all timers in the application
   */
  private clearAllTimers(): void {
    console.log('⏰ Clearing all timers');
    
    // Clear timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Clear intervals
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    
    console.log('✅ All timers cleared');
  }

  /**
   * Close all Web Audio API contexts
   */
  private closeAllAudioContexts(): void {
    console.log('🔊 Closing all audio contexts');
    
    try {
      // Close any existing audio contexts stored globally
      const audioContexts = (window as any).audioContexts || [];
      audioContexts.forEach((ctx: AudioContext) => {
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      });
      
      // Clear the global array
      (window as any).audioContexts = [];
    } catch (error) {
      console.warn('Error closing audio contexts:', error);
    }
    
    console.log('✅ All audio contexts closed');
  }

  /**
   * Emergency shutdown - use when everything else fails
   */
  emergencyShutdown(): void {
    console.log('🚨 EMERGENCY SHUTDOWN INITIATED');
    
    // Stop speech aggressively
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        if (typeof speechSynthesis !== 'undefined') {
          speechSynthesis.cancel();
        }
      }, i * 50);
    }
    
    // Clear everything
    this.clearAllTimers();
    this.closeAllAudioContexts();
    this.activeSessions.clear();
    this.speechSynthesisActive = false;
    
    // Try to stop all media streams
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          // Ignore errors - this is emergency cleanup
        });
    }
    
    console.log('🏁 EMERGENCY SHUTDOWN COMPLETED');
  }

  /**
   * Get current session status
   */
  getStatus(): {
    activeSessions: string[];
    speechActive: boolean;
    sessionCount: number;
  } {
    return {
      activeSessions: Array.from(this.activeSessions),
      speechActive: this.speechSynthesisActive,
      sessionCount: this.activeSessions.size
    };
  }

  /**
   * Check if any sessions are active
   */
  hasActiveSessions(): boolean {
    return this.activeSessions.size > 0 || this.speechSynthesisActive;
  }
}

// Global instance
export const sessionManager = SessionManager.getInstance();

// Global emergency stop function
export const emergencyStopAllVoiceAgents = () => {
  console.log('🚨 GLOBAL EMERGENCY STOP TRIGGERED');
  sessionManager.emergencyShutdown();
};

// Window beforeunload handler to ensure cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    console.log('🔄 Page unloading - terminating all sessions');
    sessionManager.terminateAllSessions();
  });
  
  // Also handle page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sessionManager.hasActiveSessions()) {
      console.log('📱 Page hidden with active sessions - stopping speech');
      sessionManager.forceStopAllSpeech();
    }
  });
}

export default SessionManager;