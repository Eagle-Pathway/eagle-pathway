import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  truncateText,
  getInitials,
  calculateMatchScore,
  getStatusColor,
  validatePhone,
  validateEmail,
  sleep,
} from '../src/index';

describe('formatDate', () => {
  it('should format date string to readable format', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });

  it('should handle invalid date', () => {
    const result = formatDate('invalid');
    expect(result).toBe('Invalid Date');
  });
});

describe('formatCurrency', () => {
  it('should format USD amount by default', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
    expect(result).toContain('$');
  });

  it('should format with custom currency', () => {
    const result = formatCurrency(500, 'EUR');
    expect(result).toContain('500');
    expect(result).toContain('€');
  });
});

describe('truncateText', () => {
  it('should return original text if under maxLength', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('should truncate and add ellipsis if over maxLength', () => {
    expect(truncateText('hello world', 8)).toBe('hello...');
  });
});

describe('getInitials', () => {
  it('should return first letters of each word', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should handle more than two words', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('calculateMatchScore', () => {
  it('should return base score when no matches', () => {
    const user = { grade_level: 'highschool', gpa: 3.5, interested_subjects: [] };
    const scholarship = { degree_levels: ['undergraduate'], min_gpa: 3.0, fields_of_study: [] };
    
    const score = calculateMatchScore(user, scholarship);
    expect(score).toBeGreaterThan(30);
  });

  it('should add points for degree level match', () => {
    const user = { grade_level: 'undergraduate', gpa: 3.5 };
    const scholarship = { degree_levels: ['undergraduate'], min_gpa: 3.0 };
    
    const score = calculateMatchScore(user, scholarship);
    expect(score).toBeGreaterThan(65);
  });

  it('should add points for GPA match', () => {
    const user = { grade_level: 'undergraduate', gpa: 4.0 };
    const scholarship = { degree_levels: ['undergraduate'], min_gpa: 3.5 };
    
    const score = calculateMatchScore(user, scholarship);
    expect(score).toBeGreaterThan(80);
  });

  it('should clamp score between 0 and 100', () => {
    const user = { grade_level: 'undergraduate', gpa: 4.0, interested_subjects: ['Computer Science', 'Engineering'] };
    const scholarship = { degree_levels: ['undergraduate'], min_gpa: 3.0, fields_of_study: ['Computer Science', 'Engineering'] };
    
    const score = calculateMatchScore(user, scholarship);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('getStatusColor', () => {
  it('should return correct color for pending', () => {
    expect(getStatusColor('pending')).toBe('#ea580c');
  });

  it('should return correct color for confirmed', () => {
    expect(getStatusColor('confirmed')).toBe('#16a34a');
  });

  it('should return correct color for completed', () => {
    expect(getStatusColor('completed')).toBe('#16a34a');
  });

  it('should return default color for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('#6b7280');
  });
});

describe('validatePhone', () => {
  it('should validate Ethiopian phone numbers', () => {
    expect(validatePhone('0912345678')).toBe(true);
    expect(validatePhone('+251912345678')).toBe(true);
    expect(validatePhone('251912345678')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('1234567890')).toBe(false);
    expect(validatePhone('invalid')).toBe(false);
  });
});