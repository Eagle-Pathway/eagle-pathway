import { describe, it, expect } from 'vitest';
import { parseJson } from '@eagle-pathway/shared';

describe('SOP Review API', () => {
  describe('parseJson', () => {
    it('should parse valid JSON response', () => {
      const input = '{"score": 85, "feedback": "Good", "suggestions": ["Improve"]}';
      const result = parseJson<{ score: number; feedback: string; suggestions: string[] }>(input);
      expect(result.score).toBe(85);
      expect(result.feedback).toBe('Good');
    });

    it('should extract JSON from text with surrounding content', () => {
      const input = 'Here is my review: {"score": 90, "feedback": "Excellent work", "suggestions": ["Add more details"]}';
      const result = parseJson<{ score: number; feedback: string; suggestions: string[] }>(input);
      expect(result.score).toBe(90);
    });

    it('should throw on empty content', () => {
      expect(() => parseJson('')).toThrow('empty response');
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseJson('not valid json')).toThrow('invalid JSON');
    });
  });

  describe('JSON extraction edge cases', () => {
    it('should handle nested JSON', () => {
      const input = '{"result": {"score": 75}}';
      const result = parseJson<{ result: { score: number } }>(input);
      expect(result.result.score).toBe(75);
    });

    it('should handle array values', () => {
      const input = '{"suggestions": ["a", "b", "c"]}';
      const result = parseJson<{ suggestions: string[] }>(input);
      expect(result.suggestions).toHaveLength(3);
    });
  });
});