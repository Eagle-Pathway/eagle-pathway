export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Too Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  isMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Check for trivially common passwords
  const commonWeak = /^(12345678|password|qwertyui|admin123|123456789|1234567890|password123)$/i.test(password);

  const errors: string[] = [];
  if (!isMinLength) errors.push('At least 8 characters');
  if (!hasUpper) errors.push('At least 1 uppercase letter (A-Z)');
  if (!hasLower) errors.push('At least 1 lowercase letter (a-z)');
  if (!hasNumber) errors.push('At least 1 number (0-9)');
  if (!hasSpecial) errors.push('At least 1 special character (!@#$%^&*)');
  if (commonWeak) errors.push('Password is too common or easily guessed');

  const passedCriteria = [isMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  let score = 0;
  if (password.length > 0) {
    if (commonWeak || passedCriteria <= 2) {
      score = 1;
    } else if (passedCriteria === 3) {
      score = 2;
    } else if (passedCriteria === 4) {
      score = 3;
    } else {
      score = 4;
    }
  }

  let label: 'Too Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Too Weak';
  let color = '#ef4444'; // Red

  switch (score) {
    case 1:
      label = 'Weak';
      color = '#f97316'; // Orange
      break;
    case 2:
      label = 'Fair';
      color = '#eab308'; // Yellow
      break;
    case 3:
      label = 'Good';
      color = '#3b82f6'; // Blue
      break;
    case 4:
      label = 'Strong';
      color = '#22c55e'; // Green
      break;
  }

  const isValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial && !commonWeak;

  return {
    score,
    label,
    color,
    isMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid,
    errors,
  };
}
