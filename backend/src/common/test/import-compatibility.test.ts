import { SurveyType, AuthToken, SurveySession, SessionStatus, Survey, SurveyResults, CategoryResult } from 'bizass-shared';

/**
 * Import Compatibility Tests
 * Verifies that direct imports from bizass-shared work correctly
 * Tests the simplified import approach
 */
describe('Direct Import Compatibility', () => {
  describe('Type Imports', () => {
    it('should import SurveyType enum successfully', () => {
      expect(SurveyType).toBeDefined();
      expect(SurveyType.EXPRESS).toBeDefined();
      expect(SurveyType.FULL).toBeDefined();
    });

    it('should import SessionStatus enum successfully', () => {
      expect(SessionStatus).toBeDefined();
      expect(SessionStatus.IN_PROGRESS).toBeDefined();
      expect(SessionStatus.COMPLETED).toBeDefined();
    });

    it('should import interface types successfully', () => {
      // These should not throw compilation errors
      const authToken: AuthToken = {
        token: 'test-token',
        expiresAt: new Date().toISOString(),
        telegramId: 123456789
      };

      const surveySession: SurveySession = {
        id: 'test-session-id',
        userId: 123456789,
        surveyType: SurveyType.EXPRESS,
        status: SessionStatus.IN_PROGRESS,
        answers: {},
        createdAt: new Date().toISOString()
      };

      expect(authToken).toBeDefined();
      expect(surveySession).toBeDefined();
    });
  });

  describe('Type Usage', () => {
    it('should allow proper enum usage', () => {
      expect(typeof SurveyType.EXPRESS).toBe('string');
      expect(typeof SessionStatus.IN_PROGRESS).toBe('string');
    });

    it('should maintain type safety', () => {
      // TypeScript should enforce type safety at compile time
      // This test mainly verifies the imports are accessible
      expect(SurveyType).toHaveProperty('EXPRESS');
      expect(SurveyType).toHaveProperty('FULL');
      expect(SessionStatus).toHaveProperty('IN_PROGRESS');
      expect(SessionStatus).toHaveProperty('COMPLETED');
    });
  });
});