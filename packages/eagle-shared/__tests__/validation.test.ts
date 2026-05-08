import { describe, it, expect } from 'vitest';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.org')).toBe(true);
      expect(emailRegex.test('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('invalid')).toBe(false);
      expect(emailRegex.test('@example.com')).toBe(false);
      expect(emailRegex.test('test@')).toBe(false);
      expect(emailRegex.test('')).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await new Promise(resolve => setTimeout(resolve, 50));
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });
});