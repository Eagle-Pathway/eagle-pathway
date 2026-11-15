import { SupabaseClient } from '@supabase/supabase-js';

export interface ScholarshipOption {
  id: string;
  name: string;
  country?: string;
  degree?: string;
}

export const DEFAULT_SCHOLARSHIPS: ScholarshipOption[] = [
  { id: 'cat-turkiye', name: 'Turkiye Burslari Scholarships', country: 'Turkey', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-hungaricum', name: 'Stipendium Hungaricum Scholarship', country: 'Hungary', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-daad', name: 'DAAD Scholarship (EPOS / Development Studies)', country: 'Germany', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-chevening', name: 'Chevening Scholarship', country: 'United Kingdom', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-fulbright', name: 'Fulbright Foreign Student Program', country: 'United States', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-erasmus', name: 'Erasmus Mundus Joint Masters (EMJM)', country: 'European Union', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-sweden', name: 'Swedish Institute Scholarships for Global Professionals (SISGP)', country: 'Sweden', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-csc', name: 'Chinese Government Scholarship (CSC)', country: 'China', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-swiss', name: 'Swiss Government Excellence Scholarships', country: 'Switzerland', degree: 'Doctorate / PhD' },
  { id: 'cat-mcf', name: 'Mastercard Foundation Scholars Program', country: 'Global / Africa', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-australia', name: 'Australia Awards Scholarships', country: 'Australia', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-mext', name: 'MEXT Japanese Government Scholarship', country: 'Japan', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-kgsp', name: 'Global Korea Scholarship (GKS / KGSP)', country: 'South Korea', degree: "Master's Degree (MSc/MA)" },
  { id: 'cat-gates', name: 'Gates Cambridge Scholarship', country: 'United Kingdom', degree: 'Doctorate / PhD' },
];

export async function fetchScholarshipCatalog(supabaseClient: SupabaseClient): Promise<ScholarshipOption[]> {
  try {
    const { data, error } = await supabaseClient
      .from('scholarships')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const dbList: ScholarshipOption[] = data
        .map((s: any) => ({
          id: s.id,
          name: s.name || s.title || '',
          country: s.country || s.host_country || '',
          degree: s.degree_level || (Array.isArray(s.degree_levels) ? s.degree_levels.join(', ') : '') || '',
        }))
        .filter((s: ScholarshipOption) => s.name.trim().length > 0);

      const dbNames = new Set(dbList.map((s) => s.name.toLowerCase().trim()));
      const merged = [
        ...dbList,
        ...DEFAULT_SCHOLARSHIPS.filter((def) => !dbNames.has(def.name.toLowerCase().trim())),
      ];
      return merged;
    }
  } catch (err) {
    console.warn('Failed to fetch scholarships catalog:', err);
  }

  return DEFAULT_SCHOLARSHIPS;
}
