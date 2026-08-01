export * from './types';
export * from './utils/theme';
export * from './utils/logger';
export * from './utils/passwordStrength';
export * from './utils/scoreValidation';
export * from './constants/metadata';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const calculateMatchScore = (user: {
  grade_level?: string;
  gpa?: number;
  gpa_max?: number;
  interested_subjects?: string[];
}, scholarship: {
  degree_levels: string[];
  min_gpa?: number;
  fields_of_study?: string[];
}): number => {
  let score = 30;
  
  const userLevel = (user.grade_level || '').toLowerCase();
  if (scholarship.degree_levels.some(l => l.toLowerCase() === userLevel || l.toLowerCase() === 'all')) {
    score += 35;
  }
  
  if (user.gpa && scholarship.min_gpa) {
    const scale = user.gpa_max || (user.gpa > 5 ? 700 : 4.0);
    const normalizedGpa = scale > 5 ? (user.gpa / scale) * 4.0 : user.gpa;
    if (normalizedGpa >= scholarship.min_gpa) {
      score += 20;
    } else {
      score -= 15;
    }
  } else {
    score += 10;
  }
  
  if (user.interested_subjects?.length && scholarship.fields_of_study?.length) {
    const matches = scholarship.fields_of_study.filter(f =>
      user.interested_subjects!.some(s => f.toLowerCase().includes(s.toLowerCase()))
    );
    score += matches.length * 10;
  }
  
  return Math.min(Math.max(score, 0), 100);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#ea580c',
    confirmed: '#16a34a',
    completed: '#16a34a',
    cancelled: '#dc2626',
    draft: '#6b7280',
    submitted: '#2563EB',
    accepted: '#16a34a',
    rejected: '#dc2626',
  };
  return colors[status] || '#6b7280';
};

export const validatePhone = (phone: string): boolean => {
  const ethiopianPhoneRegex = /^(\+251|251|0)?[9]\d{8}$/;
  return ethiopianPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const parseJson = <T>(content: string | undefined): T => {
  if (!content) throw new Error('AI provider returned an empty response.');
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI provider returned invalid JSON.');
  return JSON.parse(match[0]) as T;
};

export const getFlagEmoji = (flagOrName: string | undefined | null): string => {
  if (!flagOrName) return '🌍';
  const clean = flagOrName.trim().toLowerCase();
  
  const nameToFlag: Record<string, string> = {
    'united kingdom': '🇬🇧',
    'uk': '🇬🇧',
    'united states': '🇺🇸',
    'us': '🇺🇸',
    'usa': '🇺🇸',
    'canada': '🇨🇦',
    'australia': '🇦🇺',
    'china': '🇨🇳',
    'germany': '🇩🇪',
    'hungary': '🇭🇺',
    'turkey': '🇹🇷',
    'russia': '🇷🇺',
    'japan': '🇯🇵',
    'south korea': '🇰🇷',
    'france': '🇫🇷',
    'italy': '🇮🇹',
    'netherlands': '🇳🇱',
    'norway': '🇳🇴',
    'sweden': '🇸🇪',
    'ethiopia': '🇪🇹',
    'egypt': '🇪🇬',
    'south africa': '🇿🇦',
    'kenya': '🇰🇪',
    'nigeria': '🇳🇬',
    'ghana': '🇬🇭',
    'singapore': '🇸🇬',
    'malaysia': '🇲🇾',
    'india': '🇮🇳',
    'thailand': '🇹🇭',
    'vietnam': '🇻🇳',
    'indonesia': '🇮🇩',
    'philippines': '🇵🇭',
    'brazil': '🇧🇷',
    'mexico': '🇲🇽',
    'argentina': '🇦🇷',
    'spain': '🇪🇸',
    'portugal': '🇵🇹',
    'switzerland': '🇨🇭',
    'austria': '🇦🇹',
    'belgium': '🇧🇪',
    'poland': '🇵🇱',
  };

  if (nameToFlag[clean]) {
    return nameToFlag[clean];
  }

  if (flagOrName.length <= 4) {
    return flagOrName;
  }

  return '🌍';
};