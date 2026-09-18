'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  X, Loader2, Image as ImageIcon, GraduationCap, Globe, FileText, Settings,
  DollarSign, Briefcase, Languages, ShieldCheck, CheckSquare, Plus, Trash2
} from 'lucide-react';
import {
  ALL_COUNTRIES, REGIONS, expandRegionsToCountries, getDevelopingCountriesList,
  SCHOLARSHIP_TAXONOMY, getBroadFields, getSpecificFields, getAcceptedRelatedFields,
  DEPARTMENTS, DEGREE_LEVELS
} from '@eagle-pathway/shared';

const FUNDING_PRESETS = [
  'Full tuition',
  'Half tuition',
  'Full tuition plus stipend',
  'Full tuition plus stipend plus Accomodation',
  'Full tuition plus stipend plus Meals',
  'Full tuition plus stipend plus Accomodation plus meals',
  'Others (Custom Amount)',
];

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon, title, description, children }: SectionProps) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InputField({ label, name, value, onChange, required, type = 'text', placeholder, rows, helper }: {
  label: string; name: string; value: any; onChange: (e: any) => void;
  required?: boolean; type?: string; placeholder?: string; rows?: number; helper?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {rows ? (
        <textarea name={name} value={value ?? ''} onChange={onChange} rows={rows} required={required}
          placeholder={placeholder} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none bg-white" />
      ) : (
        <input type={type} name={name} value={value ?? ''} onChange={onChange} required={required}
          placeholder={placeholder} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white" />
      )}
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

function CheckboxField({ label, checked, onChange, subtitle }: { label: string; checked: boolean; onChange: (checked: boolean) => void; subtitle?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none">
      <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors ${checked ? 'bg-brand-blue border-brand-blue' : 'border-gray-300 group-hover:border-brand-blue/50 bg-white'}`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div>
        <span className="text-sm text-gray-700 font-medium block">{label}</span>
        {subtitle && <span className="text-xs text-gray-400 block">{subtitle}</span>}
      </div>
    </label>
  );
}

interface ScholarshipFormProps {
  scholarship?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScholarshipForm({ scholarship, onClose, onSuccess }: ScholarshipFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Country search state
  const [countrySearch, setCountrySearch] = useState('');
  const [newRelatedField, setNewRelatedField] = useState('');

  const [formData, setFormData] = useState({
    // Basic Info
    name: scholarship?.name || '',
    organization: scholarship?.organization || '',
    country: scholarship?.country || '',
    country_flag: scholarship?.country_flag || '🌍',
    description: scholarship?.description || '',
    requirements: (scholarship?.requirements || []).join('\n'),
    website_url: scholarship?.website_url || '',

    // 1. Nationality & Geography
    eligible_nationalities_mode: scholarship?.eligible_nationalities_mode || 'all',
    eligible_countries: scholarship?.eligible_countries || ([] as string[]),
    eligible_regions: scholarship?.eligible_regions || ([] as string[]),

    // 2. Degree & Status
    degree_levels: scholarship?.degree_levels || ['masters'],
    required_previous_degree: scholarship?.required_previous_degree || 'bachelors',
    current_student_status: scholarship?.current_student_status || 'any',

    // 3. Field of Study Taxonomy
    broad_field: scholarship?.broad_field || 'Business & Economics',
    specific_field: scholarship?.specific_field || 'Economics',
    related_fields: scholarship?.related_fields || ['Finance', 'Development Studies'],

    // 4. GPA Requirements
    gpa_requirement_type: scholarship?.gpa_requirement_type || 'min_gpa',
    min_gpa: scholarship?.min_gpa != null ? String(scholarship.min_gpa) : '',
    min_gpa_max: scholarship?.min_gpa_max != null ? String(scholarship.min_gpa_max) : '4.0',
    min_percentage: scholarship?.min_percentage != null ? String(scholarship.min_percentage) : '',
    min_class_honors: scholarship?.min_class_honors || '',

    // 5. Work Experience Rules
    work_exp_required: scholarship?.work_exp_required || 'no',
    work_exp_min_years: scholarship?.work_exp_min_years != null ? String(scholarship.work_exp_min_years) : '0',
    work_exp_after_degree: scholarship?.work_exp_after_degree || 'any',
    work_exp_sectors: (scholarship?.work_exp_sectors || []).join(', '),

    // 6. Age Rules
    age_requirement_type: scholarship?.age_requirement_type || 'none',
    min_age: scholarship?.min_age != null ? String(scholarship.min_age) : '',
    max_age: scholarship?.max_age != null ? String(scholarship.max_age) : '',
    age_reference_point: scholarship?.age_reference_point || 'deadline',

    // 7. Language Requirements
    english_test_required: scholarship?.english_test_required || scholarship?.requires_ielts || false,
    ielts_min: scholarship?.ielts_min != null ? String(scholarship.ielts_min) : '6.5',
    toefl_ibt_min: scholarship?.toefl_ibt_min != null ? String(scholarship.toefl_ibt_min) : '85',
    pte_min: scholarship?.pte_min != null ? String(scholarship.pte_min) : '',
    duolingo_min: scholarship?.duolingo_min != null ? String(scholarship.duolingo_min) : '',
    cambridge_min: scholarship?.cambridge_min || '',
    other_language_req: scholarship?.other_language_req || '',
    accepts_english_medium: scholarship?.accepts_english_medium || true,
    english_medium_accepted: scholarship?.english_medium_accepted || 'yes',

    // 8. Structured Funding Benefits
    funding_type: scholarship?.funding_type || 'fully_funded',
    funding_details: scholarship?.funding_details || 'Full tuition plus stipend',
    tuition_coverage: scholarship?.tuition_coverage || 'full',
    stipend_provided: scholarship?.stipend_provided || true,
    stipend_monthly_amount: scholarship?.stipend_monthly_amount != null ? String(scholarship.stipend_monthly_amount) : '1200',
    stipend_currency: scholarship?.stipend_currency || 'USD',
    accommodation_coverage: scholarship?.accommodation_coverage || 'full',
    meals_coverage: scholarship?.meals_coverage || 'partial',
    travel_allowance: scholarship?.travel_allowance || true,
    travel_allowance_amount: scholarship?.travel_allowance_amount != null ? String(scholarship.travel_allowance_amount) : '',
    health_insurance_covered: scholarship?.health_insurance_covered || true,
    application_fee_covered: scholarship?.application_fee_covered || false,

    // 9. Application Details & URLs
    application_status: scholarship?.application_status || 'open',
    deadline: scholarship?.deadline || '',
    intake_period: scholarship?.intake_period || 'Fall 2027',
    program_duration: scholarship?.program_duration || '2 Years',
    application_method: scholarship?.application_method || 'scholarship_portal',
    application_url: scholarship?.application_url || '',

    // 10. Structured Document Checklist
    requires_cv: scholarship?.requires_cv || true,
    requires_motivation_letter: scholarship?.requires_motivation_letter || true,
    requires_recommendation_letter: scholarship?.requires_recommendation_letter || true,
    recommendation_letters_count: scholarship?.recommendation_letters_count != null ? String(scholarship.recommendation_letters_count) : '2',
    requires_transcript: scholarship?.requires_transcript || true,
    requires_degree_certificate: scholarship?.requires_degree_certificate || true,
    requires_passport: scholarship?.requires_passport || true,
    requires_writing_sample: scholarship?.requires_writing_sample || false,
    requires_portfolio: scholarship?.requires_portfolio || false,
    requires_research_proposal: scholarship?.requires_research_proposal || false,
    requires_work_certificate: scholarship?.requires_work_certificate || false,
    other_required_docs: (scholarship?.other_required_docs || []).join(', '),

    // 11. Verification & Provenance
    verification_status: scholarship?.verification_status || 'verified',
    source_url: scholarship?.source_url || '',
    deadline_verified: scholarship?.deadline_verified || true,
    eligibility_verified: scholarship?.eligibility_verified || true,
    application_link_verified: scholarship?.application_link_verified || true,
    confidence_score: scholarship?.confidence_score != null ? String(scholarship.confidence_score) : '100',
    admin_internal_notes: scholarship?.admin_internal_notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  // Nationality Mode Handler
  const handleNationalityModeChange = (mode: string) => {
    if (mode === 'all') {
      setFormData(prev => ({ ...prev, eligible_nationalities_mode: 'all', eligible_countries: [], eligible_regions: [] }));
    } else if (mode === 'developing_countries') {
      const devList = getDevelopingCountriesList();
      setFormData(prev => ({ ...prev, eligible_nationalities_mode: 'developing_countries', eligible_countries: devList, eligible_regions: [] }));
    } else if (mode === 'regions') {
      setFormData(prev => ({ ...prev, eligible_nationalities_mode: 'regions', eligible_countries: expandRegionsToCountries(['Sub-Saharan Africa', 'East Africa']), eligible_regions: ['Sub-Saharan Africa', 'East Africa'] }));
    } else {
      setFormData(prev => ({ ...prev, eligible_nationalities_mode: mode, eligible_countries: prev.eligible_countries.length > 0 ? prev.eligible_countries : ['Ethiopia'] }));
    }
  };

  const toggleRegion = (region: string) => {
    const exists = formData.eligible_regions.includes(region);
    const updatedRegions = exists
      ? formData.eligible_regions.filter((r: string) => r !== region)
      : [...formData.eligible_regions, region];
    const expanded = expandRegionsToCountries(updatedRegions);
    setFormData(prev => ({ ...prev, eligible_regions: updatedRegions, eligible_countries: expanded }));
  };

  const addCountry = (countryName: string) => {
    if (!formData.eligible_countries.includes(countryName)) {
      setFormData(prev => ({ ...prev, eligible_countries: [...prev.eligible_countries, countryName] }));
    }
    setCountrySearch('');
  };

  const removeCountry = (countryName: string) => {
    setFormData(prev => ({ ...prev, eligible_countries: prev.eligible_countries.filter((c: string) => c !== countryName) }));
  };

  const handleBroadFieldChange = (broad: string) => {
    const specifics = getSpecificFields(broad);
    const firstSpec = specifics[0] || '';
    const related = getAcceptedRelatedFields(firstSpec);
    setFormData(prev => ({
      ...prev,
      broad_field: broad,
      specific_field: firstSpec,
      related_fields: related,
    }));
  };

  const handleSpecificFieldChange = (spec: string) => {
    const related = getAcceptedRelatedFields(spec);
    setFormData(prev => ({
      ...prev,
      specific_field: spec,
      related_fields: related,
    }));
  };

  const addRelatedField = () => {
    if (newRelatedField.trim() && !formData.related_fields.includes(newRelatedField.trim())) {
      setFormData(prev => ({ ...prev, related_fields: [...prev.related_fields, newRelatedField.trim()] }));
      setNewRelatedField('');
    }
  };

  const removeRelatedField = (field: string) => {
    setFormData(prev => ({ ...prev, related_fields: prev.related_fields.filter((f: string) => f !== field) }));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('scholarship-images').upload(`scholarship-thumbnails/${fileName}`, imageFile);
    if (uploadError) throw uploadError;
    return supabase.storage.from('scholarship-images').getPublicUrl(`scholarship-thumbnails/${fileName}`).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let publicImageUrl = '';
      if (imageFile) publicImageUrl = await uploadImage() || '';

      const reqArray = formData.requirements.split('\n').map((s: string) => s.trim()).filter(Boolean);
      const sectorsArray = formData.work_exp_sectors.split(',').map((s: string) => s.trim()).filter(Boolean);
      const otherDocsArray = formData.other_required_docs.split(',').map((s: string) => s.trim()).filter(Boolean);

      const dataToSave = {
        name: formData.name,
        organization: formData.organization,
        country: formData.country,
        country_flag: formData.country_flag,
        description: formData.description,
        requirements: reqArray,
        website_url: formData.website_url,
        is_active: formData.verification_status === 'verified' || formData.verification_status === 'published',

        // 1. Nationality & Geography
        eligible_nationalities_mode: formData.eligible_nationalities_mode,
        eligible_countries: formData.eligible_countries,
        eligible_regions: formData.eligible_regions,

        // 2. Degree & Status
        degree_levels: formData.degree_levels,
        required_previous_degree: formData.required_previous_degree,
        current_student_status: formData.current_student_status,

        // 3. Field Taxonomy
        broad_field: formData.broad_field,
        specific_field: formData.specific_field,
        related_fields: formData.related_fields,
        fields_of_study: [formData.broad_field, formData.specific_field, ...formData.related_fields],

        // 4. GPA Requirements
        gpa_requirement_type: formData.gpa_requirement_type,
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
        min_gpa_max: formData.min_gpa_max ? parseFloat(formData.min_gpa_max) : 4.0,
        min_percentage: formData.min_percentage ? parseFloat(formData.min_percentage) : null,
        min_class_honors: formData.min_class_honors || null,

        // 5. Work Experience Rules
        work_exp_required: formData.work_exp_required,
        work_exp_min_years: formData.work_exp_min_years ? parseFloat(formData.work_exp_min_years) : 0,
        work_exp_after_degree: formData.work_exp_after_degree,
        work_exp_sectors: sectorsArray,

        // 6. Age Rules
        age_requirement_type: formData.age_requirement_type,
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        age_reference_point: formData.age_reference_point,

        // 7. Language Matrix
        english_test_required: formData.english_test_required,
        requires_ielts: formData.english_test_required,
        ielts_min: formData.ielts_min ? parseFloat(formData.ielts_min) : null,
        toefl_ibt_min: formData.toefl_ibt_min ? parseInt(formData.toefl_ibt_min) : null,
        pte_min: formData.pte_min ? parseInt(formData.pte_min) : null,
        duolingo_min: formData.duolingo_min ? parseInt(formData.duolingo_min) : null,
        cambridge_min: formData.cambridge_min || null,
        other_language_req: formData.other_language_req || null,
        accepts_english_medium: formData.accepts_english_medium,
        english_medium_accepted: formData.english_medium_accepted,

        // 8. Structured Benefits & Funding
        funding_type: formData.funding_type,
        funding_details: formData.funding_details,
        tuition_coverage: formData.tuition_coverage,
        stipend_provided: formData.stipend_provided,
        stipend_monthly_amount: formData.stipend_monthly_amount ? parseFloat(formData.stipend_monthly_amount) : null,
        stipend_currency: formData.stipend_currency,
        accommodation_coverage: formData.accommodation_coverage,
        meals_coverage: formData.meals_coverage,
        travel_allowance: formData.travel_allowance,
        travel_allowance_amount: formData.travel_allowance_amount ? parseFloat(formData.travel_allowance_amount) : null,
        health_insurance_covered: formData.health_insurance_covered,
        application_fee_covered: formData.application_fee_covered,

        // 9. Application Details & URLs
        application_status: formData.application_status,
        deadline: formData.deadline,
        intake_period: formData.intake_period || null,
        program_duration: formData.program_duration || null,
        application_method: formData.application_method,
        application_url: formData.application_url || null,

        // 10. Structured Document Checklist
        requires_cv: formData.requires_cv,
        requires_motivation_letter: formData.requires_motivation_letter,
        requires_recommendation_letter: formData.requires_recommendation_letter,
        recommendation_letters_count: formData.recommendation_letters_count ? parseInt(formData.recommendation_letters_count) : 0,
        requires_transcript: formData.requires_transcript,
        requires_degree_certificate: formData.requires_degree_certificate,
        requires_passport: formData.requires_passport,
        requires_writing_sample: formData.requires_writing_sample,
        requires_portfolio: formData.requires_portfolio,
        requires_research_proposal: formData.requires_research_proposal,
        requires_work_certificate: formData.requires_work_certificate,
        other_required_docs: otherDocsArray,

        // 11. Verification & Provenance
        verification_status: formData.verification_status,
        source_url: formData.source_url || formData.website_url || null,
        source_status: formData.verification_status === 'verified' ? 'verified' : 'unverified',
        last_verified_at: new Date().toISOString(),
        deadline_verified: formData.deadline_verified,
        eligibility_verified: formData.eligibility_verified,
        application_link_verified: formData.application_link_verified,
        confidence_score: formData.confidence_score ? parseInt(formData.confidence_score) : 100,
        admin_internal_notes: formData.admin_internal_notes || null,

        ...(publicImageUrl ? { image_url: publicImageUrl } : {}),
      };

      const { error: saveError } = scholarship?.id 
        ? await supabase.from('scholarships').update(dataToSave).eq('id', scholarship.id)
        : await supabase.from('scholarships').insert([dataToSave]);

      if (saveError) {
        if (saveError.code === '42501') throw new Error('Permission denied: Admin access required.');
        throw saveError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{scholarship ? 'Edit Scholarship & Eligibility Rules' : 'Add Structured Scholarship'}</h2>
            <p className="text-xs text-gray-500">Configuring structured intelligence fields for rule-based & ML student matching</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center gap-2"><span className="text-lg">⚠️</span> {error}</div>}
          
          <form id="scholarship-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Upload */}
            <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-blue/30 transition-colors bg-gray-50">
              <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                {imageFile ? <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                 : scholarship?.image_url ? <img src={scholarship.image_url} alt="Current" className="h-full w-full object-cover" />
                 : <ImageIcon className="h-8 w-8 text-gray-300" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 mb-0.5">Scholarship Image / Banner</p>
                <p className="text-xs text-gray-500 mb-2">Upload visual thumbnail (JPG/PNG, 600x400)</p>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700 cursor-pointer" />
              </div>
            </div>

            {/* 1. Basic Information */}
            <Section icon={<GraduationCap className="w-5 h-5" />} title="1. Basic Information" description="Program name, organization, study destination">
              <div className="grid grid-cols-1 gap-4">
                <InputField label="Scholarship Program Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. DAAD EPOS Development-Related Postgraduate Courses" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Organization / University" name="organization" value={formData.organization} onChange={handleChange} required placeholder="e.g. German Academic Exchange Service (DAAD)" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Study Destination Country <span className="text-red-500">*</span></label>
                    <select name="country" value={formData.country} onChange={(e) => {
                      const selected = ALL_COUNTRIES.find(c => c.name === e.target.value);
                      if (selected) setFormData(prev => ({ ...prev, country: selected.name, country_flag: selected.flag }));
                    }} required className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                      <option value="">Select Destination Country</option>
                      {ALL_COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* 2. Nationality & Geographic Eligibility */}
            <Section icon={<Globe className="w-5 h-5" />} title="2. Nationality & Geographic Eligibility" description="Define which student nationalities qualify for this scholarship">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Nationalities Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: '🌍 All Countries' },
                    { id: 'developing_countries', label: '🌱 Developing Countries' },
                    { id: 'regions', label: '🗺️ Specific Regions' },
                    { id: 'specific_countries', label: '📍 Specific Countries' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleNationalityModeChange(m.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        formData.eligible_nationalities_mode === m.id
                          ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-brand-blue/30'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Regions Selector */}
              {formData.eligible_nationalities_mode === 'regions' && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Select Qualifying Regions:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REGIONS.map(reg => (
                      <CheckboxField
                        key={reg}
                        label={reg}
                        checked={formData.eligible_regions.includes(reg)}
                        onChange={() => toggleRegion(reg)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Concrete Eligible Countries Tags */}
              {formData.eligible_nationalities_mode !== 'all' && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Exact Eligible Countries ({formData.eligible_countries.length} selected):
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eligible_countries: [] }))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Search & Add Country */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type country name to add (e.g. Kenya, Ghana, Germany)..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-brand-blue"
                    />
                    {countrySearch.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-1">
                        {ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 8).map(c => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => addCountry(c.name)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-blue/10 rounded flex items-center justify-between"
                          >
                            <span>{c.flag} {c.name}</span>
                            <span className="text-[10px] text-gray-400">{c.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Country Badges */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-100">
                    {formData.eligible_countries.length === 0 ? (
                      <p className="text-xs text-gray-400 p-1 italic">No countries selected yet.</p>
                    ) : (
                      formData.eligible_countries.map((cName: string) => {
                        const cObj = ALL_COUNTRIES.find(x => x.name === cName);
                        return (
                          <span key={cName} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 rounded-lg shadow-2xs">
                            <span>{cObj?.flag || '🌍'}</span>
                            <span>{cName}</span>
                            <button type="button" onClick={() => removeCountry(cName)} className="text-gray-400 hover:text-red-600 font-bold ml-1">×</button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* 3. Degree Level & Previous Degree Status */}
            <Section icon={<GraduationCap className="w-5 h-5" />} title="3. Degree Levels & Academic Progression" description="Degree level of the scholarship and required previous qualifications">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Degree Level</label>
                  <select
                    name="degree_levels"
                    value={formData.degree_levels[0] || 'masters'}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree_levels: [e.target.value as any] }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="undergraduate">Undergraduate (Bachelor's)</option>
                    <option value="masters">Master's Degree</option>
                    <option value="phd">PhD / Doctorate</option>
                    <option value="all">All Degree Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Previous Degree</label>
                  <select
                    name="required_previous_degree"
                    value={formData.required_previous_degree}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="any">Any / No restriction</option>
                    <option value="high_school">High School Diploma</option>
                    <option value="bachelors">Bachelor's Degree Holder</option>
                    <option value="masters">Master's Degree Holder</option>
                    <option value="phd">PhD Degree Holder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Student Status</label>
                  <select
                    name="current_student_status"
                    value={formData.current_student_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="any">Any Status</option>
                    <option value="graduated">Already Graduated</option>
                    <option value="final_year">Final-Year Student Accepted</option>
                    <option value="enrolled">Currently Enrolled</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* 4. Granular Field of Study Taxonomy */}
            <Section icon={<Settings className="w-5 h-5" />} title="4. Academic Field Taxonomy" description="Standardized discipline matching (Broad -> Specific -> Related)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Broad Field Category</label>
                  <select
                    name="broad_field"
                    value={formData.broad_field}
                    onChange={(e) => handleBroadFieldChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    {getBroadFields().map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specific Field Specialization</label>
                  <select
                    name="specific_field"
                    value={formData.specific_field}
                    onChange={(e) => handleSpecificFieldChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    {getSpecificFields(formData.broad_field).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Related Fields Tags */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Accepted / Related Academic Fields:</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.related_fields.map((rf: string) => (
                    <span key={rf} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-brand-blue/10 text-brand-blue rounded-lg font-medium">
                      <span>{rf}</span>
                      <button type="button" onClick={() => removeRelatedField(rf)} className="text-brand-blue hover:text-red-600 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add custom accepted related field..."
                    value={newRelatedField}
                    onChange={(e) => setNewRelatedField(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRelatedField(); } }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white"
                  />
                  <button type="button" onClick={addRelatedField} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                    Add
                  </button>
                </div>
              </div>
            </Section>

            {/* 5. GPA & Academic Performance */}
            <Section icon={<FileText className="w-5 h-5" />} title="5. GPA & Academic Requirements" description="Configurable grade thresholds and grading scales">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPA Requirement Type</label>
                  <select name="gpa_requirement_type" value={formData.gpa_requirement_type} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                    <option value="min_gpa">Minimum Scaled GPA</option>
                    <option value="min_percentage">Minimum Percentage (%)</option>
                    <option value="min_class">Class / Honors Rank</option>
                    <option value="none">No Specific Minimum</option>
                  </select>
                </div>

                {formData.gpa_requirement_type === 'min_gpa' && (
                  <>
                    <InputField label="Min Actual GPA" name="min_gpa" value={formData.min_gpa} onChange={handleChange} type="number" placeholder="e.g. 3.5" />
                    <InputField label="Scale Out Of" name="min_gpa_max" value={formData.min_gpa_max} onChange={handleChange} type="number" placeholder="e.g. 4.0" />
                  </>
                )}

                {formData.gpa_requirement_type === 'min_percentage' && (
                  <InputField label="Minimum Percentage (%)" name="min_percentage" value={formData.min_percentage} onChange={handleChange} type="number" placeholder="e.g. 80" />
                )}

                {formData.gpa_requirement_type === 'min_class' && (
                  <InputField label="Minimum Honors Class" name="min_class_honors" value={formData.min_class_honors} onChange={handleChange} placeholder="e.g. First Class Honours / Very Great Distinction" />
                )}
              </div>
            </Section>

            {/* 6. Work Experience & Age Rules */}
            <Section icon={<Briefcase className="w-5 h-5" />} title="6. Work Experience & Age Restrictions" description="Hard eligibility filters for career requirements and age limits">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience Required?</label>
                  <select name="work_exp_required" value={formData.work_exp_required} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                    <option value="no">No Experience Required</option>
                    <option value="yes">Yes — Mandatory Requirement</option>
                    <option value="preferred">Preferred / Advantage</option>
                  </select>
                </div>

                {formData.work_exp_required !== 'no' && (
                  <>
                    <InputField label="Minimum Years" name="work_exp_min_years" value={formData.work_exp_min_years} onChange={handleChange} type="number" placeholder="e.g. 2" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience Completed After</label>
                      <select name="work_exp_after_degree" value={formData.work_exp_after_degree} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                        <option value="any">Any Time / During Studies</option>
                        <option value="bachelors">After Bachelor's Degree</option>
                        <option value="masters">After Master's Degree</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {formData.work_exp_required !== 'no' && (
                <InputField label="Relevant Sectors / Fields (comma separated)" name="work_exp_sectors" value={formData.work_exp_sectors} onChange={handleChange} placeholder="e.g. NGO, Government, Private Sector, Research, Academic" />
              )}

              {/* Age Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Requirement</label>
                  <select name="age_requirement_type" value={formData.age_requirement_type} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                    <option value="none">No Age Restriction</option>
                    <option value="max_age">Maximum Age Limit</option>
                    <option value="min_age">Minimum Age Limit</option>
                    <option value="range">Specific Age Range</option>
                  </select>
                </div>

                {formData.age_requirement_type !== 'none' && (
                  <>
                    <InputField label="Max Age" name="max_age" value={formData.max_age} onChange={handleChange} type="number" placeholder="e.g. 35" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Measured At</label>
                      <select name="age_reference_point" value={formData.age_reference_point} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                        <option value="deadline">Application Deadline</option>
                        <option value="programme_start">Programme Start Date</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </Section>

            {/* 7. Language Proficiency Matrix */}
            <Section icon={<Languages className="w-5 h-5" />} title="7. Language Requirements Matrix" description="Standardized English test scores and English-medium waiver policies">
              <div className="flex flex-wrap gap-6 items-center">
                <CheckboxField
                  label="Official English Test Required"
                  checked={formData.english_test_required}
                  onChange={(checked) => setFormData(f => ({ ...f, english_test_required: checked }))}
                  subtitle="Requires official IELTS, TOEFL, PTE, or Duolingo score report"
                />
              </div>

              {formData.english_test_required && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <InputField label="IELTS Min" name="ielts_min" value={formData.ielts_min} onChange={handleChange} type="number" placeholder="e.g. 6.5" />
                  <InputField label="TOEFL iBT Min" name="toefl_ibt_min" value={formData.toefl_ibt_min} onChange={handleChange} type="number" placeholder="e.g. 85" />
                  <InputField label="Duolingo Min" name="duolingo_min" value={formData.duolingo_min} onChange={handleChange} type="number" placeholder="e.g. 115" />
                  <InputField label="PTE Academic Min" name="pte_min" value={formData.pte_min} onChange={handleChange} type="number" placeholder="e.g. 58" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English-Medium Degree Accepted?</label>
                  <select
                    name="english_medium_accepted"
                    value={formData.english_medium_accepted}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="yes">Yes — Official English-Medium Letter Accepted</option>
                    <option value="conditional">Conditional — Case-by-case evaluation</option>
                    <option value="no">No — Standardized Test Mandatory</option>
                  </select>
                </div>
                <InputField label="Other Language / Score Requirements" name="other_language_req" value={formData.other_language_req} onChange={handleChange} placeholder="e.g. German A1 required before departure" />
              </div>
            </Section>

            {/* 8. Structured Benefits & Funding */}
            <Section icon={<DollarSign className="w-5 h-5" />} title="8. Structured Benefits & Funding Breakdown" description="Granular breakdown of what is covered for student filtering">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Funding Presets</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {FUNDING_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, funding_details: preset }))}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                          formData.funding_details === preset
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-blue/30'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <InputField label="Funding Summary Text" name="funding_details" value={formData.funding_details} onChange={handleChange} required placeholder="Full tuition + stipend..." />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Coverage</label>
                    <select name="tuition_coverage" value={formData.tuition_coverage} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white">
                      <option value="full">100% Full Tuition Coverage</option>
                      <option value="partial">Partial Tuition Waiver</option>
                      <option value="none">No Tuition Covered</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
                      <select name="accommodation_coverage" value={formData.accommodation_coverage} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white">
                        <option value="full">Full Housing Provided</option>
                        <option value="partial">Partial Housing Allowance</option>
                        <option value="none">Not Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meals Coverage</label>
                      <select name="meals_coverage" value={formData.meals_coverage} onChange={handleChange} className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white">
                        <option value="full">Full Meals Provided</option>
                        <option value="partial">Partial Meal Allowance</option>
                        <option value="none">Not Included</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stipend & Allowances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                <CheckboxField
                  label="Monthly Living Stipend"
                  checked={formData.stipend_provided}
                  onChange={(checked) => setFormData(f => ({ ...f, stipend_provided: checked }))}
                />
                {formData.stipend_provided && (
                  <>
                    <InputField label="Monthly Amount" name="stipend_monthly_amount" value={formData.stipend_monthly_amount} onChange={handleChange} type="number" placeholder="e.g. 1200" />
                    <InputField label="Currency" name="stipend_currency" value={formData.stipend_currency} onChange={handleChange} placeholder="USD / EUR / GBP" />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CheckboxField label="Roundtrip Travel / Flights" checked={formData.travel_allowance} onChange={(checked) => setFormData(f => ({ ...f, travel_allowance: checked }))} />
                <CheckboxField label="Health Insurance Covered" checked={formData.health_insurance_covered} onChange={(checked) => setFormData(f => ({ ...f, health_insurance_covered: checked }))} />
                <CheckboxField label="Application Fee Waiver" checked={formData.application_fee_covered} onChange={(checked) => setFormData(f => ({ ...f, application_fee_covered: checked }))} />
              </div>
            </Section>

            {/* 9. Application Details & URLs */}
            <Section icon={<Globe className="w-5 h-5" />} title="9. Application Details & Timelines" description="Application deadlines, methods, and separate URLs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Application Deadline" name="deadline" value={formData.deadline} onChange={handleChange} type="date" required />
                <InputField label="Intake Period" name="intake_period" value={formData.intake_period} onChange={handleChange} placeholder="e.g. September 2027" />
                <InputField label="Program Duration" name="program_duration" value={formData.program_duration} onChange={handleChange} placeholder="e.g. 2 Years" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Official Program / University Website" name="website_url" value={formData.website_url} onChange={handleChange} type="url" placeholder="https://daad.de/program" />
                <InputField label="Direct Application Portal URL" name="application_url" value={formData.application_url} onChange={handleChange} type="url" placeholder="https://portal.daad.de/apply" />
              </div>
            </Section>

            {/* 10. Structured Document Checklist */}
            <Section icon={<CheckSquare className="w-5 h-5" />} title="10. Required Documents Checklist" description="Mark all mandatory documents so students know what to prepare">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <CheckboxField label="CV / Resume" checked={formData.requires_cv} onChange={(c) => setFormData(f => ({ ...f, requires_cv: c }))} />
                <CheckboxField label="Motivation Letter / SOP" checked={formData.requires_motivation_letter} onChange={(c) => setFormData(f => ({ ...f, requires_motivation_letter: c }))} />
                <CheckboxField label="Degree Certificate" checked={formData.requires_degree_certificate} onChange={(c) => setFormData(f => ({ ...f, requires_degree_certificate: c }))} />
                <CheckboxField label="Official Transcript" checked={formData.requires_transcript} onChange={(c) => setFormData(f => ({ ...f, requires_transcript: c }))} />
                <CheckboxField label="Passport Copy" checked={formData.requires_passport} onChange={(c) => setFormData(f => ({ ...f, requires_passport: c }))} />
                <CheckboxField label="Work Certificate" checked={formData.requires_work_certificate} onChange={(c) => setFormData(f => ({ ...f, requires_work_certificate: c }))} />
                <CheckboxField label="Research Proposal" checked={formData.requires_research_proposal} onChange={(c) => setFormData(f => ({ ...f, requires_research_proposal: c }))} />
                <CheckboxField label="Writing Sample" checked={formData.requires_writing_sample} onChange={(c) => setFormData(f => ({ ...f, requires_writing_sample: c }))} />
                <CheckboxField label="Portfolio" checked={formData.requires_portfolio} onChange={(c) => setFormData(f => ({ ...f, requires_portfolio: c }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <InputField label="Recommendation Letters Needed" name="recommendation_letters_count" value={formData.recommendation_letters_count} onChange={handleChange} type="number" placeholder="2" />
                <InputField label="Other Required Documents (comma separated)" name="other_required_docs" value={formData.other_required_docs} onChange={handleChange} placeholder="e.g. Police clearance, Medical report" />
              </div>
            </Section>

            {/* Unstructured Narrative (Description & Requirements) */}
            <Section icon={<FileText className="w-5 h-5" />} title="Full Narrative Description" description="Descriptive text for semantic matching and student reading">
              <InputField label="Full Program Description" name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Describe the scholarship, eligible profiles, benefits, and special instructions..." />
              <InputField label="Requirements List (One per line)" name="requirements" value={formData.requirements} onChange={handleChange} required rows={4} placeholder="Enter each requirement on a separate line..." />
            </Section>

            {/* 11. Verification & Quality Metadata */}
            <Section icon={<ShieldCheck className="w-5 h-5" />} title="11. Verification & Data Provenance" description="Internal verification state and trust audit checkboxes">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                  <select name="verification_status" value={formData.verification_status} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white font-semibold text-brand-blue">
                    <option value="verified">🟢 Verified & Published</option>
                    <option value="under_review">🟡 Under Review</option>
                    <option value="draft">⚪ Draft</option>
                    <option value="needs_info">⚠️ Needs More Info</option>
                    <option value="rejected">🔴 Rejected</option>
                  </select>
                </div>
                <InputField label="Confidence Score (0-100)" name="confidence_score" value={formData.confidence_score} onChange={handleChange} type="number" placeholder="100" />
                <InputField label="Source Reference" name="source_url" value={formData.source_url} onChange={handleChange} placeholder="e.g. Official Embassy Portal" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <CheckboxField label="Deadline Verified" checked={formData.deadline_verified} onChange={(c) => setFormData(f => ({ ...f, deadline_verified: c }))} />
                <CheckboxField label="Eligibility Rules Verified" checked={formData.eligibility_verified} onChange={(c) => setFormData(f => ({ ...f, eligibility_verified: c }))} />
                <CheckboxField label="Application Link Verified" checked={formData.application_link_verified} onChange={(c) => setFormData(f => ({ ...f, application_link_verified: c }))} />
              </div>

              <InputField label="Internal Admin Notes" name="admin_internal_notes" value={formData.admin_internal_notes} onChange={handleChange} rows={2} placeholder="Internal verification notes, caveats, or annual review reminders..." />
            </Section>

          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button form="scholarship-form" type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-brand-blue rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : scholarship ? 'Update Scholarship Intelligence' : 'Publish Verified Scholarship'}
          </button>
        </div>
      </div>
    </div>
  );
}
