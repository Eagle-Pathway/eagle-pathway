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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B2A5B] to-[#1E4D9B] text-white rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 text-[#DFBE60] text-xs font-bold border border-[#C9A84C]/30">
            <Sparkles size={13} />
            <span>Hall of Fame &amp; Verified Scholars</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Ethiopian Students Soaring to the World&apos;s Top Universities
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Read inspiring stories from students who prepared with Eagle Pathway tutors, mastered their admissions essays, and earned life-changing international scholarships.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-2xl font-black text-[#C9A84C]">$4.8M+</div>
              <div className="text-[11px] text-slate-300">Scholarships Secured</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">250+</div>
              <div className="text-[11px] text-slate-300">Scholars Admitted</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">98%</div>
              <div className="text-[11px] text-slate-300">Visa Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STORIES.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/15 text-[#9A7B2C] border border-[#C9A84C]/30">
                  {story.badge}
                </span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0B2A5B] text-[#C9A84C] font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                  {story.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{story.name}</h3>
                  <p className="text-xs font-semibold text-[#0B2A5B] flex items-center gap-1">
                    <GraduationCap size={13} />
                    <span>{story.institution}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{story.degree}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                <div className="text-[11px] font-bold text-slate-700">Awarded Scholarship:</div>
                <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {story.scholarship}
                </div>
              </div>

              <blockquote className="text-xs text-slate-600 italic leading-relaxed relative pl-6 border-l-2 border-[#C9A84C]">
                &quot;{story.quote}&quot;
              </blockquote>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{story.highSchool}</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck size={12} /> Verified Scholar
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Ready to Write Your Own Success Story?
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Book a 1-on-1 verified tutor for your exams or explore 100+ fully funded international scholarships open right now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/request-tutor"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
          >
            Request 1-on-1 Tutor
          </Link>
          <Link
            href="/scholarships"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Browse Scholarships
          </Link>
        </div>
      </div>
    </div>
  );
}

