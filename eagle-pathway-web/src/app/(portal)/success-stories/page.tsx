'use client';

import {
  Award,
  GraduationCap,
  Sparkles,
  Quote,
  Star,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

const STORIES = [
  {
    id: 1,
    name: 'Natnael Girma',
    institution: 'University of Oxford, UK',
    scholarship: 'Rhodes Scholarship (Full Ride + Stipend)',
    degree: "Master's in Computer Science",
    highSchool: 'St. Joseph School, Addis Ababa',
    quote:
      'Eagle Pathway was instrumental during my Oxford interview prep and SOP drafting. Having seasoned mentors critique my research motivation helped me articulate my vision with crystal clarity.',
    badge: 'Fully Funded',
  },
  {
    id: 2,
    name: 'Bethelhem Tadesse',
    institution: 'Eötvös Loránd University (ELTE), Hungary',
    scholarship: 'Stipendium Hungaricum (100% Tuition & Accommodation)',
    degree: 'BSc in Software Engineering',
    highSchool: 'Cathedral School, Addis Ababa',
    quote:
      'The step-by-step document vault and deadline tracker kept me calm throughout the entire Hungarian government application process. I highly recommend Eagle Pathway to any Ethiopian scholar.',
    badge: 'Full Scholarship',
  },
  {
    id: 3,
    name: 'Yared Alemayehu',
    institution: 'Middle East Technical University (METU), Turkey',
    scholarship: 'Türkiye Bursları (Full Ride + Turkish Language)',
    degree: 'BSc in Mechanical Engineering',
    highSchool: 'Menelik II Secondary School',
    quote:
      'My 1-on-1 Math tutor from Eagle Pathway raised my national exam prep score to the 99th percentile. That foundation made my scholarship application undeniable to the Turkish committee.',
    badge: 'Full Ride',
  },
  {
    id: 4,
    name: 'Marta Hailemariam',
    institution: 'African Leadership University (ALU), Rwanda',
    scholarship: 'Mastercard Foundation Scholars Program',
    degree: 'BA in Entrepreneurial Leadership',
    highSchool: 'Nazareth School, Addis Ababa',
    quote:
      'Eagle AI Magic Draft and the Mock Interview simulator prepped me for the exact scenario questions asked during the Mastercard Foundation panel.',
    badge: 'Full Scholarship',
  },
];

export default function SuccessStoriesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Award size={14} className="text-brand-gold" />
            <span>Alumni Hall of Fame</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ethiopian Students at World-Class Universities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Read inspiring stories from students who prepared with Eagle Pathway tutors, mastered their admissions essays, and earned life-changing international scholarships.
          </p>
        </div>
      </div>

      {/* Verified Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Scholarships Secured
          </span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">$4.8M+</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified financial aid grants</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Scholars Admitted
          </span>
          <div className="text-2xl font-bold text-brand-blue tracking-tight mt-1">250+</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Global university placements</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Visa Success Rate
          </span>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight mt-1">98%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Embassy interview clearances</div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STORIES.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-brand-blue border border-blue-200/60 uppercase">
                  {story.badge}
                </span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {story.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{story.name}</h3>
                  <p className="text-xs font-medium text-brand-blue flex items-center gap-1">
                    <GraduationCap size={13} />
                    <span>{story.institution}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{story.degree}</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50/70 rounded-lg mb-3 border border-slate-100">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Awarded Scholarship:</div>
                <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {story.scholarship}
                </div>
              </div>

              <blockquote className="text-xs text-slate-600 italic leading-relaxed relative pl-4 border-l-2 border-brand-blue">
                &quot;{story.quote}&quot;
              </blockquote>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{story.highSchool}</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
                <ShieldCheck size={12} /> Verified Scholar
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 text-center max-w-xl mx-auto space-y-3 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">
          Ready to Write Your Own Success Story?
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Book a 1-on-1 verified tutor for your exams or explore 100+ fully funded international scholarships open right now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <Link
            href="/request-tutor"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
          >
            Request 1-on-1 Tutor
          </Link>
          <Link
            href="/scholarships"
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            Browse Scholarships
          </Link>
        </div>
      </div>
    </div>
  );
}
