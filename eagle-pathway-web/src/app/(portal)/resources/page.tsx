'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  BookOpen,
  Search,
  Download,
  ExternalLink,
  FileText,
  Bookmark,
  Sparkles,
  GraduationCap,
  Award,
  Layers,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  audience: string;
  resource_type: 'file' | 'link';
  file_path?: string | null;
  file_name?: string | null;
  external_url?: string | null;
  download_count?: number;
  created_at: string;
}

const STATIC_GUIDES: Resource[] = [
  {
    id: 'guide-1',
    title: 'The Ultimate Ethiopian Student Guide to SAT (1400+ Score Strategy)',
    description: 'Comprehensive breakdown of Math and Reading sections, recommended free practice tests on Khan Academy, and registration waiver instructions.',
    category: 'Test Prep',
    audience: 'student',
    resource_type: 'link',
    external_url: 'https://satsuite.collegeboard.org/sat/practice-preparation',
    download_count: 1420,
    created_at: '2026-01-15',
  },
  {
    id: 'guide-2',
    title: 'Winning Statement of Purpose (SOP) Templates for Europe & US',
    description: 'Deconstructed winning essays for Turkiye Burslari, Stipendium Hungaricum, DAAD, and US undergraduate universities with line-by-line commentary.',
    category: 'Admissions',
    audience: 'all',
    resource_type: 'link',
    external_url: '/tools/sop',
    download_count: 2890,
    created_at: '2026-01-20',
  },
  {
    id: 'guide-3',
    title: 'IELTS Academic 7.5+ Band Master Blueprint',
    description: 'Speaking cue cards, Academic Writing Task 1 & 2 templates, and common grammar pitfalls for non-native English speakers.',
    category: 'English Proficiency',
    audience: 'student',
    resource_type: 'link',
    external_url: 'https://ielts.org',
    download_count: 980,
    created_at: '2026-02-01',
  },
  {
    id: 'guide-4',
    title: 'Ethiopian High School National Exam Past Papers (Math & Natural Sciences)',
    description: 'Archive of Ethiopian national exam papers with full step-by-step answer keys and exam solving strategies.',
    category: 'National Exams',
    audience: 'student',
    resource_type: 'link',
    external_url: '/request-tutor',
    download_count: 3400,
    created_at: '2026-02-10',
  },
  {
    id: 'guide-5',
    title: "Parent's University Financing & Scholarship Readiness Roadmap",
    description: 'Everything Ethiopian parents need to know regarding passport timing, credential evaluation (WES), and fully funded international aid.',
    category: 'Parent Guidance',
    audience: 'parent',
    resource_type: 'link',
    external_url: '/packages',
    download_count: 650,
    created_at: '2026-02-14',
  },
];

export default function ResourcesPage() {
  const { user } = useAuthStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const role = user?.role || 'student';

  useEffect(() => {
    async function fetchResources() {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('is_published', true)
          .in('audience', ['all', role])
          .order('category', { ascending: true });

        if (!error && data && data.length > 0) {
          setResources(data);
        } else {
          setResources(STATIC_GUIDES);
        }
      } catch (err) {
        setResources(STATIC_GUIDES);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [role]);

  const categories = ['All', ...Array.from(new Set(resources.map((r) => r.category || 'General')))];

  const filtered = resources.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="text-[#0B2A5B]" size={26} />
          <span>Study Guides &amp; Resources Library</span>
        </h1>
        <p className="text-xs text-slate-500">
          Curated exam prep materials, admissions essay blueprints, SAT/IELTS toolkits, and academic guidance for scholars.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides by title, exam, or keyword (e.g. SAT, IELTS, SOP)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0B2A5B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Resources */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading resources library...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <FileText size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No resources found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#0B2A5B]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B2A5B]/10 text-[#0B2A5B]">
                    {item.category}
                  </span>
                  {item.download_count && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Download size={11} />
                      {item.download_count.toLocaleString()}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {item.audience === 'all' ? 'All Scholars' : `${item.audience} Guide`}
                </span>

                {item.external_url ? (
                  <a
                    href={item.external_url}
                    target={item.external_url.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0B2A5B] hover:text-white text-xs font-bold text-slate-700 transition-colors border border-slate-200"
                  >
                    <span>Open Guide</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#0B2A5B] hover:text-white text-xs font-bold text-slate-700 transition-colors border border-slate-200">
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

