'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Feedback';
import { Career, EmploymentType, ExperienceLevel } from '@/types/careers';
import {
  X,
  Loader2,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  Award,
} from 'lucide-react';

interface CareerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedCareer: Career) => void;
  career?: Career | null;
}

const DEPARTMENT_PRESETS = [
  'Education & Tutoring',
  'Admissions & Advisory',
  'Engineering & Tech',
  'Operations & Growth',
  'Product & Design',
  'Marketing & Community',
  'Finance & Legal',
];

const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Entry Level', 'Mid-Level', 'Senior', 'Lead'];

const formatDateToDisplay = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-').map(Number);
  if (!year || !month || !day) return isoDateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const tryExtractIsoDate = (str: string): string => {
  if (!str || str.toLowerCase() === 'rolling') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
};

export default function CareerFormModal({
  isOpen,
  onClose,
  onSuccess,
  career,
}: CareerFormModalProps) {
  const toast = useToast();
  const isEditing = Boolean(career);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Education & Tutoring');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);

  const [location, setLocation] = useState('Addis Ababa / Hybrid');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
  const [salaryRange, setSalaryRange] = useState('');
  const [deadline, setDeadline] = useState('Rolling');
  const [deadlineType, setDeadlineType] = useState<'date' | 'rolling' | 'custom'>('rolling');
  const [datePickerValue, setDatePickerValue] = useState('');

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');

  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);

  const [isActive, setIsActive] = useState(true);
  const [featured, setFeatured] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (career) {
      setTitle(career.title || '');
      if (DEPARTMENT_PRESETS.includes(career.department)) {
        setDepartment(career.department);
        setIsCustomDept(false);
        setCustomDepartment('');
      } else {
        setDepartment('Other');
        setIsCustomDept(true);
        setCustomDepartment(career.department || '');
      }
      setLocation(career.location || 'Addis Ababa / Hybrid');
      setEmploymentType(career.employment_type || 'Full-time');
      setExperienceLevel(career.experience_level || 'Mid-Level');
      setSalaryRange(career.salary_range || '');

      const dl = career.deadline?.trim() || 'Rolling';
      setDeadline(dl);
      const iso = tryExtractIsoDate(dl);
      if (dl.toLowerCase() === 'rolling' || !dl) {
        setDeadlineType('rolling');
        setDatePickerValue('');
      } else if (iso) {
        setDeadlineType('date');
        setDatePickerValue(iso);
      } else {
        setDeadlineType('custom');
        setDatePickerValue('');
      }

      setSummary(career.summary || '');
      setDescription(career.description || '');

      setResponsibilities(
        career.responsibilities && career.responsibilities.length > 0
          ? career.responsibilities
          : ['']
      );
      setRequirements(
        career.requirements && career.requirements.length > 0 ? career.requirements : ['']
      );
      setBenefits(career.benefits && career.benefits.length > 0 ? career.benefits : ['']);

      setIsActive(career.is_active ?? true);
      setFeatured(career.featured ?? false);
    } else {
      // Defaults for new job
      setTitle('');
      setDepartment('Education & Tutoring');
      setIsCustomDept(false);
      setCustomDepartment('');
      setLocation('Addis Ababa / Hybrid');
      setEmploymentType('Full-time');
      setExperienceLevel('Mid-Level');
      setSalaryRange('Competitive ETB + Bonuses');
      setDeadline('Rolling');
      setDeadlineType('rolling');
      setDatePickerValue('');
      setSummary('');
      setDescription('');
      setResponsibilities(['']);
      setRequirements(['']);
      setBenefits(['Hybrid work flexibility', 'Professional growth & mentorship allowance']);
      setIsActive(true);
      setFeatured(false);
    }
  }, [career, isOpen]);

  if (!isOpen) return null;

  // List management helpers
  const handleListChange = (
    list: string[],
    setList: (val: string[]) => void,
    index: number,
    value: string
  ) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const handleAddListItem = (list: string[], setList: (val: string[]) => void) => {
    setList([...list, '']);
  };

  const handleRemoveListItem = (
    list: string[],
    setList: (val: string[]) => void,
    index: number
  ) => {
    if (list.length <= 1) {
      setList(['']);
    } else {
      setList(list.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast('error', 'Job title is required.');
      return;
    }

    const effectiveDept = isCustomDept ? customDepartment.trim() : department.trim();
    if (!effectiveDept) {
      toast('error', 'Please specify a department.');
      return;
    }

    if (!summary.trim()) {
      toast('error', 'Please provide a short summary for candidates.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const payload = {
        title: title.trim(),
        department: effectiveDept,
        location: location.trim() || 'Addis Ababa / Hybrid',
        employment_type: employmentType,
        experience_level: experienceLevel,
        salary_range: salaryRange.trim() || null,
        deadline: deadline.trim() || 'Rolling',
        summary: summary.trim(),
        description: description.trim() || null,
        responsibilities: responsibilities.map((r) => r.trim()).filter(Boolean),
        requirements: requirements.map((r) => r.trim()).filter(Boolean),
        benefits: benefits.map((b) => b.trim()).filter(Boolean),
        is_active: isActive,
        featured,
      };

      const url = isEditing ? `/api/admin/careers/${career!.id}` : '/api/admin/careers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save job posting.');
      }

      toast('success', isEditing ? 'Job posting updated successfully.' : 'New job posted successfully.');
      onSuccess(data.career);
      onClose();
    } catch (err: any) {
      console.error('Save career error:', err);
      toast('error', err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Job Posting' : 'Post New Job Opening'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update role specifications, requirements, and publishing status'
                  : 'Create a new career opening for display on the marketing careers page'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Layers size={16} className="text-blue-600" />
              <span>Role Overview</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior SAT Math Educator & Mentor"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={isCustomDept ? 'Other' : department}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setIsCustomDept(true);
                    } else {
                      setIsCustomDept(false);
                      setDepartment(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                >
                  {DEPARTMENT_PRESETS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Department)...</option>
                </select>

                {isCustomDept && (
                  <input
                    type="text"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Enter custom department name"
                    className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Addis Ababa / Hybrid, Remote"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employment Type
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Salary / Compensation Range
                </label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. Competitive ETB + Bonuses"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Application Deadline
                </label>

                {/* Deadline Mode Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-2 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setDeadlineType('date');
                      if (!datePickerValue) {
                        const target = new Date(Date.now() + 14 * 86400000);
                        const yyyy = target.getFullYear();
                        const mm = String(target.getMonth() + 1).padStart(2, '0');
                        const dd = String(target.getDate()).padStart(2, '0');
                        const iso = `${yyyy}-${mm}-${dd}`;
                        setDatePickerValue(iso);
                        setDeadline(formatDateToDisplay(iso));
                      } else {
                        setDeadline(formatDateToDisplay(datePickerValue));
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      deadlineType === 'date'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar size={13} className={deadlineType === 'date' ? 'text-blue-600' : 'text-slate-400'} />
                    <span>Pick Date</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeadlineType('rolling');
                      setDeadline('Rolling');
                    }}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      deadlineType === 'rolling'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock size={13} className={deadlineType === 'rolling' ? 'text-blue-600' : 'text-slate-400'} />
                    <span>Rolling</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeadlineType('custom');
                    }}
                    className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-all ${
                      deadlineType === 'custom'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Custom Text
                  </button>
                </div>

                {/* Mode 1: Calendar Date Picker */}
                {deadlineType === 'date' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={datePickerValue}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDatePickerValue(val);
                          if (val) {
                            setDeadline(formatDateToDisplay(val));
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 cursor-pointer"
                      />
                    </div>

                    {/* Quick future shortcuts */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                      {[
                        { label: '+1 Week', days: 7 },
                        { label: '+2 Weeks', days: 14 },
                        { label: '+1 Month', days: 30 },
                        { label: '+60 Days', days: 60 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            const target = new Date(Date.now() + item.days * 86400000);
                            const yyyy = target.getFullYear();
                            const mm = String(target.getMonth() + 1).padStart(2, '0');
                            const dd = String(target.getDate()).padStart(2, '0');
                            const iso = `${yyyy}-${mm}-${dd}`;
                            setDatePickerValue(iso);
                            setDeadline(formatDateToDisplay(iso));
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-2xs"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 2: Rolling Continuous */}
                {deadlineType === 'rolling' && (
                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                    <span className="text-slate-600">Continuous review without a cutoff date.</span>
                    <span className="px-2 py-0.5 bg-white border border-blue-200 text-blue-700 font-semibold rounded text-[11px] shadow-2xs">
                      Rolling
                    </span>
                  </div>
                )}

                {/* Mode 3: Custom Text */}
                {deadlineType === 'custom' && (
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="e.g. 25 Nov 2026, Until Filled, Spring 2027"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                )}

                {/* Live Public Badge Preview */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                  <span>Public website badge:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md font-semibold text-[10px]">
                    <Calendar size={10} className="text-amber-600" />
                    Apply by {deadline.trim() || 'Rolling'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Descriptions & Summaries */}
          <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText size={16} className="text-blue-600" />
              <span>Job Description & Scope</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Executive Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Brief 2-3 sentence overview of this role and its direct impact on Ethiopian scholars..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                required
              />
              <span className="text-[11px] text-slate-400">
                This short summary appears on career directory preview cards.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Detailed Role Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Full contextual narrative regarding team mission, day-to-day work, and impact..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Section 3: Dynamic Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsibilities */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Key Responsibilities
                </span>
                <button
                  type="button"
                  onClick={() => handleAddListItem(responsibilities, setResponsibilities)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-2 flex-1">
                {responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resp}
                      onChange={(e) =>
                        handleListChange(responsibilities, setResponsibilities, idx, e.target.value)
                      }
                      placeholder={`Responsibility ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveListItem(responsibilities, setResponsibilities, idx)
                      }
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Requirements & Qualifications
                </span>
                <button
                  type="button"
                  onClick={() => handleAddListItem(requirements, setRequirements)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-2 flex-1">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) =>
                        handleListChange(requirements, setRequirements, idx, e.target.value)
                      }
                      placeholder={`Requirement ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveListItem(requirements, setRequirements, idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="md:col-span-2 bg-slate-50/70 rounded-xl p-5 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Perks & Benefits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddListItem(benefits, setBenefits)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={14} /> Add Perk
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) =>
                        handleListChange(benefits, setBenefits, idx, e.target.value)
                      }
                      placeholder={`Benefit / Perk ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveListItem(benefits, setBenefits, idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Publishing Toggles */}
          <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Active (Publicly Visible)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Candidates can see and apply for this opening.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded-sm border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    Featured Role
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pinned to the top of careers directory.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Publish Job Opening
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

