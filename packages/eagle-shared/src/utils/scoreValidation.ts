export interface ScoreValidationResult {
  isValid: boolean;
  error?: string;
  normalizedGpa?: number; // Normalized to 4.0 scale
}

export function validateAcademicScore(scoreStr: string, scale: number): ScoreValidationResult {
  const cleanStr = scoreStr.trim();
  if (!cleanStr) {
    return { isValid: true }; // Optional field
  }

  const score = parseFloat(cleanStr);
  if (isNaN(score)) {
    return { isValid: false, error: 'Please enter a valid numeric score' };
  }

  if (score <= 0) {
    return { isValid: false, error: 'Score must be greater than 0' };
  }

  if (score > scale) {
    return { 
      isValid: false, 
      error: `Score cannot exceed ${scale.toLocaleString()} (out of ${scale.toLocaleString()})` 
    };
  }

  // Calculate equivalent GPA normalized to standard 4.0 scale
  const normalizedGpa = Math.min(Math.max((score / scale) * 4.0, 0), 4.0);

  return {
    isValid: true,
    normalizedGpa: Math.round(normalizedGpa * 100) / 100,
  };
}
