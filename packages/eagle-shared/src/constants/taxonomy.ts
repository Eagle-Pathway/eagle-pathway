export interface SpecificFieldDef {
  name: string;
  acceptedRelated: string[];
}

export interface BroadFieldDef {
  broadField: string;
  icon?: string;
  specificFields: SpecificFieldDef[];
}

export const SCHOLARSHIP_TAXONOMY: BroadFieldDef[] = [
  {
    broadField: 'Business & Economics',
    icon: 'briefcase',
    specificFields: [
      { name: 'Economics', acceptedRelated: ['Finance', 'Development Studies', 'Applied Statistics', 'Econometrics', 'Public Policy'] },
      { name: 'Finance & Banking', acceptedRelated: ['Economics', 'Accounting', 'Financial Technology', 'Business Analytics'] },
      { name: 'Accounting & Auditing', acceptedRelated: ['Finance', 'Taxation', 'Business Administration'] },
      { name: 'Business Administration & Management', acceptedRelated: ['Marketing', 'Operations', 'International Business', 'Human Resources'] },
      { name: 'Marketing & Digital Strategy', acceptedRelated: ['Communications', 'Media Studies', 'Business Administration', 'E-Commerce'] },
      { name: 'Business Analytics & Supply Chain', acceptedRelated: ['Data Science', 'Operations Research', 'Industrial Engineering', 'Information Systems'] },
    ],
  },
  {
    broadField: 'STEM & Engineering',
    icon: 'cpu',
    specificFields: [
      { name: 'Computer Science & Software Engineering', acceptedRelated: ['Information Technology', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Electrical Engineering'] },
      { name: 'Artificial Intelligence & Machine Learning', acceptedRelated: ['Computer Science', 'Data Science', 'Computational Mathematics', 'Robotics'] },
      { name: 'Civil & Structural Engineering', acceptedRelated: ['Environmental Engineering', 'Urban Planning', 'Construction Management', 'Water Resources'] },
      { name: 'Electrical & Electronics Engineering', acceptedRelated: ['Telecommunications', 'Embedded Systems', 'Computer Engineering', 'Robotics'] },
      { name: 'Mechanical & Mechatronics Engineering', acceptedRelated: ['Aerospace Engineering', 'Manufacturing', 'Automotive Engineering', 'Robotics'] },
      { name: 'Chemical & Materials Engineering', acceptedRelated: ['Biochemical Engineering', 'Nanotechnology', 'Chemistry', 'Polymer Science'] },
      { name: 'Data Science & Applied Mathematics', acceptedRelated: ['Statistics', 'Computer Science', 'Computational Science', 'Operations Research'] },
      { name: 'Physics & Astronomy', acceptedRelated: ['Applied Physics', 'Astrophysics', 'Materials Science', 'Quantum Computing'] },
      { name: 'Chemistry & Biochemistry', acceptedRelated: ['Chemical Biology', 'Pharmacology', 'Materials Chemistry'] },
    ],
  },
  {
    broadField: 'Healthcare & Life Sciences',
    icon: 'heart-pulse',
    specificFields: [
      { name: 'Public Health & Global Epidemiology', acceptedRelated: ['Global Health', 'Health Policy', 'Biostatistics', 'Community Medicine', 'Tropical Medicine'] },
      { name: 'Medicine & Clinical Practice (MD/MBBS)', acceptedRelated: ['Biomedical Sciences', 'Clinical Research', 'Pharmacology', 'Surgery'] },
      { name: 'Nursing & Healthcare Delivery', acceptedRelated: ['Public Health', 'Midwifery', 'Health Administration'] },
      { name: 'Pharmacy & Pharmaceutical Sciences', acceptedRelated: ['Pharmacology', 'Medicinal Chemistry', 'Biotechnology', 'Toxicology'] },
      { name: 'Biomedical Engineering & Biotechnology', acceptedRelated: ['Bioinformatics', 'Molecular Biology', 'Genetics', 'Tissue Engineering'] },
      { name: 'Nutrition & Dietetics', acceptedRelated: ['Public Health', 'Food Science', 'Biochemistry'] },
    ],
  },
  {
    broadField: 'Social Sciences & Humanities',
    icon: 'users',
    specificFields: [
      { name: 'Development Studies & International Development', acceptedRelated: ['Economics', 'Political Science', 'Public Administration', 'Human Rights', 'Sociology'] },
      { name: 'International Relations & Diplomacy', acceptedRelated: ['Political Science', 'Peace & Conflict Studies', 'Global Governance', 'Security Studies'] },
      { name: 'Geography & Urban Planning', acceptedRelated: ['Environmental Science', 'GIS & Remote Sensing', 'Regional Development', 'Human Geography'] },
      { name: 'Law & Human Rights Policy', acceptedRelated: ['International Law', 'Public Policy', 'Criminology', 'Constitutional Law'] },
      { name: 'Public Policy & Administration', acceptedRelated: ['Political Science', 'Economics', 'Governance', 'Social Policy'] },
      { name: 'Sociology & Social Work', acceptedRelated: ['Anthropology', 'Social Policy', 'Community Development', 'Psychology'] },
      { name: 'Education, Pedagogy & Curriculum Design', acceptedRelated: ['Educational Leadership', 'Applied Linguistics', 'Instructional Design'] },
      { name: 'Media, Journalism & Mass Communication', acceptedRelated: ['Digital Media', 'Public Relations', 'Strategic Communications'] },
      { name: 'Literature, Languages & Translation', acceptedRelated: ['Linguistics', 'Comparative Literature', 'Cultural Studies'] },
    ],
  },
  {
    broadField: 'Agriculture & Environmental Sciences',
    icon: 'sprout',
    specificFields: [
      { name: 'Agricultural Sciences & Agronomy', acceptedRelated: ['Crop Science', 'Soil Science', 'Agribusiness', 'Horticulture', 'Plant Breeding'] },
      { name: 'Climate Change, Forestry & Sustainability', acceptedRelated: ['Environmental Management', 'Renewable Energy', 'Ecology', 'Conservation Biology'] },
      { name: 'Animal Science & Veterinary Medicine', acceptedRelated: ['Zoology', 'Livestock Production', 'Animal Nutrition'] },
      { name: 'Food Science & Agricultural Technology', acceptedRelated: ['Post-Harvest Technology', 'Food Engineering', 'Nutrition'] },
    ],
  },
  {
    broadField: 'Arts, Architecture & Design',
    icon: 'palette',
    specificFields: [
      { name: 'Architecture & Built Environment', acceptedRelated: ['Urban Design', 'Landscape Architecture', 'Interior Design', 'Civil Engineering'] },
      { name: 'Graphic, UX/UI & Digital Design', acceptedRelated: ['Visual Arts', 'Human-Computer Interaction', 'Industrial Design', 'Animation'] },
      { name: 'Fine Arts & Creative Media', acceptedRelated: ['Art History', 'Sculpture', 'Photography', 'Film Production'] },
      { name: 'Music & Performing Arts', acceptedRelated: ['Theatre Arts', 'Sound Design', 'Choreography'] },
    ],
  },
];

/**
 * Returns all broad field names.
 */
export function getBroadFields(): string[] {
  return SCHOLARSHIP_TAXONOMY.map(b => b.broadField);
}

/**
 * Returns specific fields under a broad field.
 */
export function getSpecificFields(broadField: string): string[] {
  const node = SCHOLARSHIP_TAXONOMY.find(b => b.broadField.toLowerCase() === broadField.trim().toLowerCase());
  if (!node) return [];
  return node.specificFields.map(s => s.name);
}

/**
 * Returns related/accepted fields for a given specific field.
 */
export function getAcceptedRelatedFields(specificField: string): string[] {
  for (const b of SCHOLARSHIP_TAXONOMY) {
    const s = b.specificFields.find(x => x.name.toLowerCase() === specificField.trim().toLowerCase());
    if (s) return s.acceptedRelated;
  }
  return [];
}

/**
 * Checks field alignment score between student's interest/degree and scholarship field.
 * Returns:
 * 1.0 = Exact specific field match
 * 0.75 = Related accepted field match
 * 0.40 = Broad field match
 * 0.0 = No match
 */
export function calculateFieldAlignmentScore(
  studentSubject: string,
  scholarship: { broad_field?: string; specific_field?: string; related_fields?: string[]; fields_of_study?: string[] }
): { score: number; matchType: 'exact' | 'related' | 'broad' | 'none' } {
  if (!studentSubject) return { score: 0, matchType: 'none' };
  const target = studentSubject.trim().toLowerCase();

  // 1. Exact specific field match
  if (scholarship.specific_field && scholarship.specific_field.toLowerCase() === target) {
    return { score: 1.0, matchType: 'exact' };
  }

  // 2. Direct string containment in specific field or name
  if (scholarship.specific_field && (scholarship.specific_field.toLowerCase().includes(target) || target.includes(scholarship.specific_field.toLowerCase()))) {
    return { score: 1.0, matchType: 'exact' };
  }

  // 3. Related fields match
  const related = scholarship.related_fields || (scholarship.specific_field ? getAcceptedRelatedFields(scholarship.specific_field) : []);
  if (related.some(r => r.toLowerCase().includes(target) || target.includes(r.toLowerCase()))) {
    return { score: 0.75, matchType: 'related' };
  }

  // 4. Broad field match
  if (scholarship.broad_field) {
    const broadSpecifics = getSpecificFields(scholarship.broad_field).map(s => s.toLowerCase());
    if (broadSpecifics.some(s => s.includes(target) || target.includes(s))) {
      return { score: 0.40, matchType: 'broad' };
    }
  }

  // 5. Fallback check on legacy fields_of_study array
  if (scholarship.fields_of_study && scholarship.fields_of_study.length > 0) {
    if (scholarship.fields_of_study.includes('any')) return { score: 1.0, matchType: 'exact' };
    if (scholarship.fields_of_study.some(f => f.toLowerCase().includes(target) || target.includes(f.toLowerCase()))) {
      return { score: 0.50, matchType: 'broad' };
    }
  }

  return { score: 0, matchType: 'none' };
}
