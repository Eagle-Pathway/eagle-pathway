'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Image as ImageIcon, GraduationCap, Globe, FileText, Settings } from 'lucide-react';
import { COUNTRIES, DEPARTMENTS, DEGREE_LEVELS, FIELDS_OF_STUDY } from '@eagle-pathway/shared';

const FUNDING_PRESETS = [
  'Full tuition',
  'Half tuition',
  'Full tuition plus stipend',
  'Full tuition plus stipend plus Accomodation',
  'Full tuition plus stipend plus Meals',
  'Full tuition plus stipend plus Accomodation plus meals',
  'Others (Custom Amount)',
];

// Using centralized metadata from @eagle-pathway/shared

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
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
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

function InputField({ label, name, value, onChange, required, type = 'text', placeholder, rows }: {
  label: string; name: string; value: string; onChange: (e: any) => void;
  required?: boolean; type?: string; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {rows ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows} required={required}
          placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none" />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required}
          placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
      )}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${checked ? 'bg-brand-blue border-brand-blue' : 'border-gray-300 group-hover:border-brand-blue/50'}`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </label>
  );
}

function MultiSelectField({ label, name, values, options, onChange }: {
  label: string; name: string; values: string[]; options: { value: string; label: string }[]; onChange: (values: string[]) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    onChange(selected);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-gray-400 font-normal">(Ctrl+Click to select multiple)</span>
      </label>
      <select multiple name={name} value={values} onChange={handleChange}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white min-h-[100px]">
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
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
  
  const [formData, setFormData] = useState({
    name: scholarship?.name || '',
    organization: scholarship?.organization || '',
    funding_details: scholarship?.funding_details || '',
    funding_type: scholarship?.funding_type || 'fully_funded',
    deadline: scholarship?.deadline || '',
    country: scholarship?.country || '',
    country_flag: scholarship?.country_flag || '🌍',
    degree_levels: scholarship?.degree_levels || ['undergraduate'],
    fields_of_study: scholarship?.fields_of_study || ['any'],
    min_gpa: scholarship?.min_gpa || '',
    min_gpa_max: scholarship?.min_gpa_max || '4.0',
    description: scholarship?.description || '',
    requirements: (scholarship?.requirements || []).join('\n'),
    website_url: scholarship?.website_url || '',
    requires_ielts: scholarship?.requires_ielts || false,
    accepts_english_medium: scholarship?.accepts_english_medium || false,
    target_departments: scholarship?.target_departments || ['Any'],
    recommendation_letters_count: scholarship?.recommendation_letters_count || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const handleMultiSelect = (field: string) => (values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
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
      const dataToSave = {
        name: formData.name, organization: formData.organization, funding_details: formData.funding_details,
        funding_type: formData.funding_type, deadline: formData.deadline, country: formData.country, country_flag: formData.country_flag,
        degree_levels: formData.degree_levels, fields_of_study: formData.fields_of_study,
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
        min_gpa_max: formData.min_gpa_max ? parseFloat(formData.min_gpa_max) : 4.0,
        description: formData.description,
        requirements: reqArray, website_url: formData.website_url, is_active: true,
        source_url: formData.website_url || null,
        source_status: scholarship?.source_status || 'unverified',
        requires_ielts: formData.requires_ielts, accepts_english_medium: formData.accepts_english_medium,
        target_departments: formData.target_departments, recommendation_letters_count: formData.recommendation_letters_count,
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
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{scholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h2>
            <p className="text-xs text-gray-500">{scholarship ? 'Update details below' : 'Fill in the details to create a new scholarship'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center gap-2"><span className="text-lg">⚠️</span> {error}</div>}
          
          <form id="scholarship-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-blue/30 transition-colors bg-gray-50">
              <div className="h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden">
                {imageFile ? <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                 : scholarship?.image_url ? <img src={scholarship.image_url} alt="Current" className="h-full w-full object-cover" />
                 : <ImageIcon className="h-10 w-10 text-gray-300" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">Scholarship Image</p>
                <p className="text-xs text-gray-500 mb-3">Upload a thumbnail (JPG/PNG, 600x400)</p>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700 cursor-pointer" />
              </div>
            </div>

            {/* Basic Info */}
            <Section icon={<GraduationCap className="w-5 h-5" />} title="Basic Information" description="Main scholarship details">
              <div className="grid grid-cols-1 gap-4">
                <InputField label="Scholarship Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Mastercard Foundation Scholars Program" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Organization" name="organization" value={formData.organization} onChange={handleChange} required placeholder="e.g. Mastercard Foundation" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Funding Amount & Presets</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {FUNDING_PRESETS.map(preset => {
                        const isSelected = preset === 'Others (Custom Amount)'
                          ? Boolean(formData.funding_details && !FUNDING_PRESETS.slice(0, 6).includes(formData.funding_details))
                          : formData.funding_details === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              if (preset === 'Others (Custom Amount)') {
                                setFormData(f => ({ ...f, funding_details: '' }));
                              } else {
                                setFormData(f => ({ ...f, funding_details: preset }));
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-blue/40'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      name="funding_details"
                      value={formData.funding_details}
                      onChange={handleChange}
                      required
                      placeholder="Select preset above or type custom amount..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Eligibility */}
            <Section icon={<Settings className="w-5 h-5" />} title="Eligibility & Requirements" description="Who qualifies for this scholarship">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Funding Type</label>
                  <select name="funding_type" value={formData.funding_type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white">
                    <option value="fully_funded">Fully Funded</option>
                    <option value="partial">Partial</option>
                    <option value="stipend_only">Stipend Only</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Min Actual GPA" name="min_gpa" value={formData.min_gpa} onChange={handleChange} type="number" placeholder="e.g. 3.5" />
                  <InputField label="Out Of" name="min_gpa_max" value={formData.min_gpa_max} onChange={handleChange} type="number" placeholder="e.g. 4.0" />
                </div>
              </div>
              
              <MultiSelectField
                label="Degree Levels"
                name="degree_levels"
                values={formData.degree_levels}
                options={[
                  { value: 'undergraduate', label: 'Undergraduate' },
                  { value: 'masters', label: "Master's" },
                  { value: 'phd', label: 'PhD' },
                  { value: 'all', label: 'All Levels' },
                ]}
                onChange={handleMultiSelect('degree_levels')}
              />

              <MultiSelectField
                label="Fields of Study"
                name="fields_of_study"
                values={formData.fields_of_study}
                options={[
                  { value: 'any', label: 'Any / All Fields' },
                  { value: 'stem', label: 'STEM (Science, Tech, Engineering, Math)' },
                  { value: 'healthcare', label: 'Healthcare & Medicine' },
                  { value: 'business', label: 'Business & Economics' },
                  { value: 'humanities', label: 'Humanities & Social Sciences' },
                  { value: 'arts', label: 'Arts & Design' },
                  { value: 'law', label: 'Law & Policy' },
                ]}
                onChange={handleMultiSelect('fields_of_study')}
              />
            </Section>

            {/* Location & Deadline */}
            <Section icon={<Globe className="w-5 h-5" />} title="Location & Timeline" description="Where and when to apply">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <select name="country" value={formData.country} onChange={(e) => {
                    const selected = COUNTRIES.find(c => c.name === e.target.value);
                    if (selected) setFormData(prev => ({ ...prev, country: selected.name, country_flag: selected.flag }));
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white">
                    <option value="">Select a Country</option>
                    {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <InputField label="Application Deadline" name="deadline" value={formData.deadline} onChange={handleChange} type="date" />
              </div>
            </Section>

            {/* Language & Documents */}
            <Section icon={<FileText className="w-5 h-5" />} title="Language & Documents" description="English requirements and recommendation letters">
              <div className="flex flex-wrap gap-6">
                <CheckboxField label="Requires IELTS/TOEFL" checked={formData.requires_ielts} onChange={(checked) => setFormData(f => ({ ...f, requires_ielts: checked }))} />
                <CheckboxField label="Accepts English Medium" checked={formData.accepts_english_medium} onChange={(checked) => setFormData(f => ({ ...f, accepts_english_medium: checked }))} />
              </div>
              <InputField label="Recommendation Letters Needed" name="recommendation_letters_count" value={String(formData.recommendation_letters_count)} onChange={(e) => setFormData(f => ({ ...f, recommendation_letters_count: parseInt(e.target.value) || 0 }))} type="number" placeholder="0" />
            </Section>

            {/* Target Departments */}
            <MultiSelectField
              label="Target Departments"
              name="target_departments"
              values={formData.target_departments}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              onChange={handleMultiSelect('target_departments')}
            />

            <InputField label="Official Website URL" name="website_url" value={formData.website_url} onChange={handleChange} type="url" placeholder="https://..." />
            <InputField label="Description" name="description" value={formData.description} onChange={handleChange} required rows={4} placeholder="Describe the scholarship, its benefits, and who should apply..." />
            <InputField label="Requirements List" name="requirements" value={formData.requirements} onChange={handleChange} required rows={4} placeholder="Enter each requirement on a new line" />
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button form="scholarship-form" type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-brand-blue rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : scholarship ? 'Update Scholarship' : 'Create Scholarship'}
          </button>
        </div>
      </div>
    </div>
  );
}
