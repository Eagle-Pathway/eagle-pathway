import { describe, it, expect } from 'vitest';
import { Colors, Typography, Spacing, Radius } from '../src/utils/theme';

describe('theme', () => {
  describe('Colors', () => {
    it('should have required brand colors', () => {
      expect(Colors.blue).toBe('#1E4D9B');
      expect(Colors.gold).toBe('#C9A84C');
    });

    it('should have semantic colors', () => {
      expect(Colors.green).toBe('#16a34a');
      expect(Colors.red).toBe('#dc2626');
      expect(Colors.orange).toBe('#ea580c');
    });

    it('should have neutral colors', () => {
      expect(Colors.text).toBe('#111827');
      expect(Colors.bg).toBe('#F5F6FA');
    });
  });

  describe('Typography', () => {
    it('should have font sizes in ascending order', () => {
      expect(Typography.xs).toBeLessThan(Typography.sm);
      expect(Typography.sm).toBeLessThan(Typography.base);
      expect(Typography.base).toBeLessThan(Typography.lg);
    });

    it('should have font weights', () => {
      expect(Typography.regular).toBe('400');
      expect(Typography.bold).toBe('700');
    });
  });

  describe('Spacing', () => {
    it('should have increasing spacing values', () => {
      expect(Spacing.xs).toBeLessThan(Spacing.sm);
      expect(Spacing.sm).toBeLessThan(Spacing.md);
    });
  });

  describe('Radius', () => {
    it('should have full radius for pills', () => {
      expect(Radius.full).toBe(999);
    });
  });
});