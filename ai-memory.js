// ai-memory.js - Simple memory system for our AI
import fs from 'fs/promises';
import path from 'path';

class SimpleAIMemory {
  constructor() {
    this.memoryFile = 'ai-memory.json';
    this.memory = {
      recommendations: [], // What we recommended
      outcomes: [],       // What actually happened
      patterns: {},       // What we've learned works
      failures: {}        // What doesn't work
    };
    this.loadMemory();
  }

  // Load memory from file (so we remember between server restarts)
  async loadMemory() {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      this.memory = JSON.parse(data);
      console.log('✅ AI Memory loaded successfully');
    } catch (error) {
      console.log('📝 Creating new AI memory file');
      await this.saveMemory();
    }
  }

  // Save memory to file
  async saveMemory() {
    try {
      await fs.writeFile(this.memoryFile, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('❌ Error saving AI memory:', error);
    }
  }

  // Store a recommendation we made
  async storeRecommendation(accountId, recommendation) {
    const id = `${accountId}_${Date.now()}`;
    
    const record = {
      id: id,
      accountId: accountId,
      timestamp: new Date().toISOString(),
      recommendation: recommendation,
      status: 'pending' // waiting to see results
    };
    
    this.memory.recommendations.push(record);
    await this.saveMemory();
    
    console.log(`💾 Stored recommendation ${id} for account ${accountId}`);
    return id;
  }

  // Update with actual results
  async storeOutcome(recommendationId, actualResults) {
    const recommendation = this.memory.recommendations.find(r => r.id === recommendationId);
    
    if (!recommendation) {
      console.log('❌ Recommendation not found:', recommendationId);
      return;
    }

    // Calculate if our prediction was accurate
    const wasSuccessful = this.calculateSuccess(recommendation.recommendation, actualResults);
    
    const outcome = {
      recommendationId: recommendationId,
      timestamp: new Date().toISOString(),
      actualResults: actualResults,
      wasSuccessful: wasSuccessful,
      accuracyScore: this.calculateAccuracy(recommendation.recommendation, actualResults)
    };

    this.memory.outcomes.push(outcome);
    
    // Update our learning patterns
    await this.updatePatterns(recommendation, outcome);
    
    // Mark recommendation as completed
    recommendation.status = 'completed';
    recommendation.outcome = wasSuccessful;
    
    await this.saveMemory();
    console.log(`📊 Updated outcome for ${recommendationId}: ${wasSuccessful ? 'SUCCESS' : 'FAILED'}`);
  }

  // Learn patterns from successful/failed recommendations
  async updatePatterns(recommendation, outcome) {
    const patternKey = `${recommendation.recommendation.type}_${recommendation.accountId}`;
    
    if (!this.memory.patterns[patternKey]) {
      this.memory.patterns[patternKey] = {
        type: recommendation.recommendation.type,
        accountId: recommendation.accountId,
        successCount: 0,
        failureCount: 0,
        confidence: 0.5,
        bestPractices: []
      };
    }

    const pattern = this.memory.patterns[patternKey];
    
    if (outcome.wasSuccessful) {
      pattern.successCount++;
      pattern.bestPractices.push(recommendation.recommendation.action);
      console.log(`✅ Pattern success: ${patternKey} now ${pattern.successCount} successes`);
    } else {
      pattern.failureCount++;
      
      // Store what didn't work
      if (!this.memory.failures[patternKey]) {
        this.memory.failures[patternKey] = [];
      }
      this.memory.failures[patternKey].push({
        action: recommendation.recommendation.action,
        reason: outcome.actualResults.reason || 'Unknown',
        timestamp: outcome.timestamp
      });
      console.log(`❌ Pattern failure: ${patternKey} now ${pattern.failureCount} failures`);
    }

    // Update confidence based on success rate
    const totalAttempts = pattern.successCount + pattern.failureCount;
    pattern.confidence = totalAttempts > 0 ? pattern.successCount / totalAttempts : 0.5;
  }

  // Get learned insights for an account
  getInsights(accountId) {
    const accountPatterns = Object.values(this.memory.patterns)
      .filter(p => p.accountId === accountId);
    
    const insights = {
      totalRecommendations: this.memory.recommendations.filter(r => r.accountId === accountId).length,
      successfulPatterns: accountPatterns.filter(p => p.confidence > 0.7),
      risky Patterns: accountPatterns.filter(p => p.confidence < 0.3),
      overallSuccessRate: this.calculateOverallSuccessRate(accountId),
      bestPractices: this.getBestPractices(accountId),
      thingsToAvoid: this.getThingsToAvoid(accountId)
    };

    return insights;
  }

  // Helper methods
  calculateSuccess(recommendation, actualResults) {
    // Simple success criteria - you can make this more sophisticated
    if (recommendation.expectedImpact && actualResults.actualImpact) {
      const expectedImprovement = parseFloat(recommendation.expectedImpact.replace(/[^0-9.-]/g, ''));
      const actualImprovement = actualResults.actualImpact;
      
      // Consider it successful if we got at least 70% of expected improvement
      return actualImprovement >= (expectedImprovement * 0.7);
    }
    
    return actualResults.improved === true;
  }

  calculateAccuracy(recommendation, actualResults) {
    // Simple accuracy calculation (0-1 score)
    if (recommendation.expectedImpact && actualResults.actualImpact) {
      const expected = parseFloat(recommendation.expectedImpact.replace(/[^0-9.-]/g, ''));
      const actual = actualResults.actualImpact;
      
      if (expected === 0) return actual === 0 ? 1 : 0;
      
      const accuracy = 1 - Math.abs(expected - actual) / Math.abs(expected);
      return Math.max(0, Math.min(1, accuracy));
    }
    
    return actualResults.improved === true ? 1 : 0;
  }

  calculateOverallSuccessRate(accountId) {
    const accountRecs = this.memory.recommendations.filter(r => 
      r.accountId === accountId && r.status === 'completed'
    );
    
    if (accountRecs.length === 0) return 0;
    
    const successful = accountRecs.filter(r => r.outcome === true).length;
    return successful / accountRecs.length;
  }

  getBestPractices(accountId) {
    const successfulPatterns = Object.values(this.memory.patterns)
      .filter(p => p.accountId === accountId && p.confidence > 0.7);
    
    return successfulPatterns.flatMap(p => p.bestPractices);
  }

  getThingsToAvoid(accountId) {
    return this.memory.failures[accountId] || [];
  }
}

export default SimpleAIMemory;
