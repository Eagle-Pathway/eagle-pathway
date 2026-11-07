'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import {
  GraduationCap,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Award,
  BookOpen,
  Wallet,
  ShieldCheck,
  Video,
  Clock,
  MapPin,
  ChevronRight,
  Menu,
  X,
  FileText,
  Wand2,
  DollarSign,
  TrendingUp,
  Smartphone,
  Download,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'students' | 'tutors' | 'parents'>('students');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = [
    { label: 'Scholarships Secured', value: '$4.8M+' },
    { label: 'Verified Educators', value: '100+' },
    { label: 'Visa Success Rate', value: '98%' },
    { label: 'Scholars Admitted', value: '250+' },
  ];

  const scholarships = [
    {
      id: 'turkiye-burslari',
      name: 'Türkiye Bursları Scholarship 2026',
      country: 'Turkey 🇹🇷',
      funding: 'Fully Funded',
      coverage: 'Tuition, Accommodation, Health Insurance & Monthly Stipend',
      degrees: 'Bachelor, Master & PhD',
      deadline: 'Rolling 2026',
    },
    {
      id: 'stipendium-hungaricum',
      name: 'Stipendium Hungaricum Programme',
      country: 'Hungary 🇭🇺',
      funding: '100% Tuition & Housing',
      coverage: 'Full Tuition, Free Dormitory & Medical Coverage',
      degrees: 'Undergraduate & Graduate',
      deadline: 'Spring 2026',
    },
    {
      id: 'daad-germany',
      name: 'DAAD Helmut-Schmidt Programme',
      country: 'Germany 🇩🇪',
      funding: 'Full Ride + German Course',
      coverage: 'Full Tuition, €934/month Stipend & Travel Allowance',
      degrees: "Master's Degree",
      deadline: 'Summer 2026',
    },
    {
      id: 'rhodes-oxford',
      name: 'Rhodes Scholarship at Oxford',
      country: 'United Kingdom 🇬🇧',
      funding: 'Fully Funded + Stipend',
      coverage: '100% University Fees, Economy Flight & £18,000/yr Living Stipend',
      degrees: 'Postgraduate / Master',
      deadline: 'Autumn 2026',
    },
  ];

  const tutors = [
    {
      name: 'Ermias Haile',
      subject: 'Calculus, Linear Algebra & SAT Math',
      education: 'BSc Computer Engineering (AAU, 3.9 GPA)',
      rating: '5.0',
      reviews: 38,
      rate: '500 ETB / hr',
      mode: 'In-person Addis & Online',
    },
    {
      name: 'Dr. Bethlehem Abebe',
      subject: 'Organic Chemistry & Biology',
      education: 'MD / AAU School of Medicine',
      rating: '4.9',
      reviews: 42,
      rate: '600 ETB / hr',
      mode: 'Online (Google Meet)',
    },
    {
      name: 'Dawit Mengistu',
      subject: 'IELTS Academic, TOEFL & College Essays',
      education: 'English Literature & SAT Coach (8.5 IELTS)',
      rating: '5.0',
      reviews: 29,
      rate: '550 ETB / hr',
      mode: 'In-person Addis & Online',
    },
  ];

  const stories = [
    {
      name: 'Natnael Girma',
      institution: 'University of Oxford, UK',
      scholarship: 'Rhodes Scholar',
      degree: "Master's in Computer Science",
      quote:
        'Eagle Pathway was crucial for my Oxford interview and SOP prep. Practicing with seasoned mentors gave me the exact clarity needed to win.',
      imageInitial: 'N',
    },
    {
      name: 'Bethelhem Tadesse',
      institution: 'Eötvös Loránd University, Hungary',
      scholarship: 'Stipendium Hungaricum Full Ride',
      degree: 'BSc Software Engineering',
      quote:
        'The step-by-step document vault and deadline tracker made my Hungarian application completely stress-free. Truly life-changing!',
      imageInitial: 'B',
    },
    {
      name: 'Yared Alemayehu',
      institution: 'METU, Turkey',
      scholarship: 'Türkiye Bursları Scholar',
      degree: 'BSc Mechanical Engineering',
      quote:
        'My 1-on-1 Math tutor from Eagle Pathway raised my national exam score to the top 1 percentile. That foundation made my scholarship win inevitable.',
      imageInitial: 'Y',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#C9A84C]/30 selection:text-[#0B2A5B]">
      {/* ========================================================= */}
      {/* 1. STICKY NAVIGATION BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/brand/icon-light.svg"
                alt="Eagle Pathway"
                width={40}
                height={40}
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-[#0B2A5B] leading-none">
                Eagle Pathway
              </span>
              <span className="text-[10px] text-[#C9A84C] font-bold tracking-widest uppercase mt-1">
                Scholarships &amp; Tutoring
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-700">
            <a href="#audiences" className="hover:text-[#0B2A5B] transition-colors">
              For Students
            </a>
            <a href="#audiences" onClick={() => setActiveTab('tutors')} className="hover:text-[#0B2A5B] transition-colors">
              For Tutors
            </a>
            <a href="#audiences" onClick={() => setActiveTab('parents')} className="hover:text-[#0B2A5B] transition-colors">
              For Parents
            </a>
            <a href="#scholarships" className="hover:text-[#0B2A5B] transition-colors">
              Scholarships
            </a>
            <a href="#ai-suite" className="hover:text-[#0B2A5B] transition-colors flex items-center gap-1 text-[#C9A84C]">
              <Sparkles size={13} />
              <span>Eagle AI</span>
            </a>
            <a href="#stories" className="hover:text-[#0B2A5B] transition-colors">
              Success Stories
            </a>
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 shadow-sm transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0B2A5B] hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-black hover:brightness-105 shadow-sm transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-[#0B2A5B] hover:bg-slate-100 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-800">
              <a
                href="#audiences"
                onClick={() => {
                  setActiveTab('students');
                  setMobileMenuOpen(false);
                }}
              >
                For Students
              </a>
              <a
                href="#audiences"
                onClick={() => {
                  setActiveTab('tutors');
                  setMobileMenuOpen(false);
                }}
              >
                For Tutors
              </a>
              <a
                href="#audiences"
                onClick={() => {
                  setActiveTab('parents');
                  setMobileMenuOpen(false);
                }}
              >
                For Parents
              </a>
              <a href="#scholarships" onClick={() => setMobileMenuOpen(false)}>
                Scholarships Directory
              </a>
              <a href="#ai-suite" onClick={() => setMobileMenuOpen(false)} className="text-[#C9A84C]">
                Eagle AI Suite
              </a>
              <a href="#stories" onClick={() => setMobileMenuOpen(false)}>
                Success Stories
              </a>
            </nav>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#0B2A5B] text-white text-center font-bold text-xs"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 text-center font-bold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-xl bg-[#0B2A5B] text-white text-center font-bold text-xs"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-[#0B2A5B]/5 via-[#C9A84C]/10 to-[#1E4D9B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B2A5B]/5 border border-[#0B2A5B]/15 text-[#0B2A5B] text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            <span>Ethiopia&apos;s Leading Platform for Scholarships &amp; 1-on-1 Tutoring</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Soar to World-Class Universities with{' '}
            <span className="bg-gradient-to-r from-[#0B2A5B] via-[#1E4D9B] to-[#C9A84C] bg-clip-text text-transparent">
              End-to-End Admissions Support
            </span>{' '}
            &amp; AI Admissions.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover 100+ fully funded global scholarships, connect with verified STEM educators across Addis Ababa and online, and master winning application essays with Eagle AI.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs sm:text-sm font-bold hover:brightness-110 shadow-lg shadow-[#0B2A5B]/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started on Web</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Smartphone size={16} className="text-[#C9A84C]" />
              <span>Get Android App</span>
            </a>

            <Link
              href="/request-tutor"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-[#C9A84C]" />
              <span>Request a Tutor</span>
            </Link>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 pt-1">
            Seamless multi-platform access: Use our full-featured web portal or download the Android app on Google Play.
          </div>

          {/* Social Proof Stats Banner */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-[#0B2A5B]">{s.value}</div>
                  <div className="text-xs font-semibold text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MULTI-ROLE SHOWCASE (STUDENTS • TUTORS • PARENTS) */}
      {/* ========================================================= */}
      <section id="audiences" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#0B2A5B] uppercase tracking-widest">
              Tailored for Every Need
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              One Unified Platform. Three Specialized Experiences.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Whether you are an ambitious scholar, an expert educator, or a parent supporting your child, Eagle Pathway provides the exact tools you need.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 max-w-md w-full">
              {[
                { id: 'students', label: 'For Students 👨‍🎓' },
                { id: 'tutors', label: 'For Tutors 👨‍🏫' },
                { id: 'parents', label: 'For Parents 👨‍👩‍👧' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                    ? 'bg-white text-[#0B2A5B] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-xs">
            {activeTab === 'students' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0B2A5B]/10 text-[#0B2A5B]">
                    Student &amp; Scholar Experience
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Your Complete University &amp; Scholarship Launchpad
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Access verified global full-ride scholarships, match with educators for exam prep (SAT, IELTS, National Exams), and craft winning motivation letters with real-time AI scoring.
                  </p>

                  <div className="space-y-3">
                    {[
                      '100+ Fully Funded International Scholarships (Turkiye, Hungary, DAAD, USA)',
                      'Verified 1-on-1 Tutors in Addis Ababa (In-Person) or Global (Online)',
                      'Eagle AI SOP Reviewer: 100-point rubric scoring & inline rewrites',
                      'Scholarship Mock Interview Simulator with real-time audio/text grading',
                      'Visual Application Kanban Board with deadline notifications',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-6 py-3 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
                    >
                      Create Student Account
                    </Link>
                    <Link
                      href="/scholarships"
                      className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      Browse Scholarships
                    </Link>
                  </div>
                </div>

                {/* Card Preview Mockup */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Award size={16} className="text-[#C9A84C]" />
                      <span>AI Statement of Purpose Evaluation</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Score: 88 / 100
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed italic border border-slate-100">
                    &quot;Your statement demonstrates excellent academic motivation. With concrete links between your past projects and the laboratory curriculum, this essay stands out to selection boards.&quot;
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="font-bold text-[#0B2A5B]">Target Country</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Germany 🇩🇪 / DAAD</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div className="font-bold text-amber-900">Deadline</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Closes in 24 Days</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutors' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C9A84C]/20 text-[#9A7B2C] border border-[#C9A84C]/30">
                    Educators &amp; Mentors Experience
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Teach Motivated Scholars &amp; Earn on Your Own Schedule
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Set your own hourly fees in ETB, receive student booking requests in Addis Ababa or teach online worldwide, and withdraw earnings directly to CBE or Telebirr.
                  </p>

                  <div className="space-y-3">
                    {[
                      'Set your own hourly rate (500 – 1,500+ ETB/hr) & teaching subjects',
                      'Browse open student tutoring requests across Addis Ababa neighborhoods',
                      'Conduct interactive sessions online with built-in Google Meet rooms',
                      'Guaranteed payments: 24-hour payouts via Commercial Bank of Ethiopia & Telebirr',
                      'Access free teaching toolkits, pedagogy guides, and graduate scholarship mentors',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-6 py-3 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
                    >
                      Apply to Teach
                    </Link>
                    <Link
                      href="/tutor-jobs"
                      className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      View Student Requests
                    </Link>
                  </div>
                </div>

                {/* Tutor Card Mockup */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wallet size={16} className="text-[#0B2A5B]" />
                      <span>Tutor Earnings &amp; Wallet</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Balance
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-3xl font-black text-slate-900">7,200 ETB</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Available for instant withdrawal</div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold">
                      Withdraw via CBE / Telebirr
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student:</span>
                      <span className="font-bold text-slate-800">Kidist M. (Grade 12 Physics)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Next Session:</span>
                      <span className="font-bold text-emerald-700">Tomorrow, 4:00 PM (Google Meet)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parents' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Parent &amp; Family Experience
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Full Visibility into Your Child&apos;s Academic Future
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Link your child with a simple 6-character code, monitor university applications and deadlines, book verified background-checked tutors, and access parent admissions roadmaps.
                  </p>

                  <div className="space-y-3">
                    {[
                      'Link children instantly using student code or phone number',
                      'Track all tracked university and scholarship applications in real time',
                      'Monitor tutoring session attendance, hours completed, and teacher notes',
                      'Request home tutors in Addis Ababa neighborhoods with 100% verified credentials',
                      "Access Parent's Guides to SAT, university financing, and embassy visas",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-6 py-3 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] shadow-sm"
                    >
                      Create Parent Account
                    </Link>
                    <Link
                      href="/request-tutor"
                      className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      Book a Tutor for Child
                    </Link>
                  </div>
                </div>

                {/* Parent Card Mockup */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0B2A5B] text-white text-xs font-bold flex items-center justify-center">
                        M
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Michael Bekele</div>
                        <div className="text-[10px] text-slate-400">Grade 12 • St. Joseph School</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Linked Child
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <span className="font-medium text-slate-700">Hungarian Scholarship (ELTE)</span>
                      <span className="font-bold text-[#0B2A5B] text-[11px]">Submitted</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <span className="font-medium text-slate-700">SAT Math 1-on-1 Tutoring</span>
                      <span className="font-bold text-emerald-700 text-[11px]">12 Hours Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. EAGLE AI ADMISSIONS SUITE PREVIEW */}
      {/* ========================================================= */}
      <section id="ai-suite" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold border border-white/10">
              <Sparkles size={13} />
              <span>Eagle AI Academic Engine</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              AI Tools Trained on Winning International Applications
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Eliminate guesswork from your admissions process with specialized tools built specifically for scholarship applicants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 hover:border-[#C9A84C]/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 text-[#DFBE60] flex items-center justify-center">
                <Award size={20} />
              </div>
              <h3 className="font-bold text-base text-white">AI Statement of Purpose Reviewer</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive instant admissions committee scoring (0-100), structure analysis, and specific sentence-level rewrite recommendations.
              </p>
              <Link
                href="/tools/sop"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C9A84C] hover:text-[#DFBE60]"
              >
                <span>Try SOP Reviewer</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 hover:border-[#C9A84C]/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-base text-white">Scholarship Mock Interview Simulator</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Simulate 5 realistic committee questions calibrated to your target scholarship, with real-time feedback and model exemplary answers.
              </p>
              <Link
                href="/tools/interview"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300"
              >
                <span>Practice Mock Interview</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 hover:border-[#C9A84C]/50 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Wand2 size={20} />
              </div>
              <h3 className="font-bold text-base text-white">Magic Draft Essay Drafter</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate a compelling, authentic 4-paragraph motivation letter combining your GPA, community project background, and future goals.
              </p>
              <Link
                href="/tools/magic-draft"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>Generate Magic Draft</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FEATURED SCHOLARSHIPS DIRECTORY PREVIEW */}
      {/* ========================================================= */}
      <section id="scholarships" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-[#0B2A5B] uppercase tracking-widest">
                Global Opportunities
              </h2>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Featured International Scholarships
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Fully vetted, open applications for Ethiopian and African students.
              </p>
            </div>

            <Link
              href="/scholarships"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2A5B] hover:text-[#1E4D9B]"
            >
              <span>Explore All 100+ Scholarships</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scholarships.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#0B2A5B]/30 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700">{s.country}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.funding}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug mb-2">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {s.coverage}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{s.degrees}</span>
                  <Link
                    href={`/scholarships/${s.id}`}
                    className="font-bold text-[#0B2A5B] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. TOP VERIFIED EDUCATORS SPOTLIGHT */}
      {/* ========================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-[#0B2A5B] uppercase tracking-widest">
                1-on-1 Instruction
              </h2>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Top-Rated Verified Educators
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Screened educators across Addis Ababa and internationally for STEM, SAT, and IELTS.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/request-tutor"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs font-bold hover:brightness-105 shadow-xs"
              >
                Request a Tutor
              </Link>
              <Link
                href="/tutors"
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white"
              >
                Browse All Tutors
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tutors.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B2A5B] text-[#C9A84C] font-black text-base flex items-center justify-center">
                        {t.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                          <Star size={12} fill="currentColor" />
                          <span>{t.rating}</span>
                          <span className="text-slate-400 font-normal">({t.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="font-bold text-slate-800">{t.subject}</div>
                    <div className="text-slate-500 text-[11px]">{t.education}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin size={11} /> {t.mode}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">{t.rate}</span>
                  <Link
                    href="/tutors"
                    className="px-3.5 py-1.5 rounded-lg bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B]"
                  >
                    Book Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. VERIFIED SUCCESS STORIES & HALL OF FAME */}
      {/* ========================================================= */}
      <section id="stories" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#0B2A5B] uppercase tracking-widest">
              Hall of Fame
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Real Ethiopian Scholars. Global Success.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Read how Ethiopian students used Eagle Pathway to unlock full-ride admissions to Oxford, Hungary, Turkey, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((story, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0B2A5B] text-[#C9A84C] font-black text-sm flex items-center justify-center">
                      {story.imageInitial}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{story.name}</h3>
                      <div className="text-xs font-semibold text-[#0B2A5B]">{story.institution}</div>
                      <div className="text-[10px] text-slate-400">{story.degree}</div>
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#C9A84C]/20 text-[#9A7B2C] inline-block border border-[#C9A84C]/30">
                    {story.scholarship}
                  </div>

                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    &quot;{story.quote}&quot;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                  <ShieldCheck size={14} />
                  <span>Verified Scholar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. 3-STEP JOURNEY */}
      {/* ========================================================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#0B2A5B] uppercase tracking-widest">
              Simple 3-Step Process
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Eagle Pathway Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0B2A5B] text-white font-black text-base flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">Create Free Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sign up as a Student, Tutor, or Parent in under 60 seconds with zero credit card required.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C] text-[#0B2A5B] font-black text-base flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Discover &amp; Match</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse curated scholarships or connect with top-ranked Ethiopian tutors for exam preparation.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Master &amp; Soar</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Refine essays with Eagle AI, ace your embassy interviews, and celebrate admission to world universities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. MOBILE & WEB MULTI-EXPERIENCE SHOWCASE */}
      {/* ========================================================= */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-[#0B2A5B] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="lg:col-span-7 space-y-5 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold border border-white/10">
                <Smartphone size={14} />
                <span>Multi-Platform Experience</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Experience on the Web or on Your Mobile Device
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Stay updated on scholarship deadlines, communicate instantly with 1-on-1 tutors, and manage your admissions applications seamlessly on the web or via our native Android mobile app.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Real-time push alerts for urgent scholarship deadlines',
                  '1-on-1 direct in-app messaging with verified educators',
                  'Interactive Google Meet rooms on both desktop & mobile',
                  'Instant cloud synchronization across your phone & laptop',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 size={15} className="text-[#C9A84C] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] font-black text-xs sm:text-sm hover:brightness-105 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Smartphone size={18} />
                  <span>Download on Google Play</span>
                </a>

                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 text-center"
                >
                  Continue on Web Portal
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative z-10 flex justify-center">
              <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/brand/icon-light.svg"
                      alt="Eagle Pathway App"
                      width={28}
                      height={28}
                    />
                    <span className="font-bold text-sm text-white">Eagle Pathway Mobile</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Live on Play Store
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Package:</span>
                    <span className="font-mono text-[11px] text-[#C9A84C]">com.eaglepathway.app</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Ratings:</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={12} fill="currentColor" />
                      <span>5.0 Star Rating</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Availability:</span>
                    <span className="text-emerald-400 font-semibold">Android 8.0+ &amp; Web</span>
                  </div>
                </div>

                <a
                  href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Download size={14} className="text-[#C9A84C]" />
                  <span>Install From Google Play</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FINAL CONVERSION BANNER */}
      {/* ========================================================= */}
      <section className="py-20 bg-gradient-to-br from-[#0B2A5B] via-[#0E3570] to-[#1E4D9B] text-white text-center relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Ready to Begin Your Educational Journey?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join hundreds of Ethiopian scholars, certified educators, and families on Eagle Pathway today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#DFBE60] text-[#0B2A5B] text-xs sm:text-sm font-black hover:brightness-105 shadow-lg shadow-black/20"
            >
              Get Started Free Today
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/20"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. COMPREHENSIVE FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-white/70 py-12 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/icon-light.svg"
                alt="Eagle Pathway"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-bold text-white text-base">Eagle Pathway</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Empowering Ethiopian and African scholars with international university scholarships, verified 1-on-1 tutoring, and AI admissions counseling.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">For Students</h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li><Link href="/scholarships" className="hover:text-white">Scholarships Directory</Link></li>
              <li><Link href="/tutors" className="hover:text-white">Find a Verified Tutor</Link></li>
              <li><Link href="/request-tutor" className="hover:text-white">Post Tutor Request</Link></li>
              <li><Link href="/tools/sop" className="hover:text-white">AI SOP Reviewer</Link></li>
              <li><Link href="/tools/interview" className="hover:text-white">Mock Interview Simulator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">For Tutors &amp; Parents</h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li><Link href="/register" className="hover:text-white">Apply to Teach (Educators)</Link></li>
              <li><Link href="/tutor-jobs" className="hover:text-white">Browse Student Jobs</Link></li>
              <li><Link href="/earnings" className="hover:text-white">Tutor Earnings &amp; CBE Payouts</Link></li>
              <li><Link href="/parent/children" className="hover:text-white">Parent Portal &amp; Child Tracking</Link></li>
              <li><Link href="/resources" className="hover:text-white">Parent Admissions Guides</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Office &amp; Support</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
              Addis Ababa, Ethiopia<br />
              Email: admissions@eaglespathway.com<br />
              Support: 24/7 via WhatsApp &amp; In-App Chat
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] text-center"
              >
                Log In to Portal
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] text-center"
              >
                <Smartphone size={13} />
                <span>Get App on Google Play</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>&copy; {new Date().getFullYear()} Eagle Pathway Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/services" className="hover:text-slate-400">Advisory Services</Link>
            <Link href="/success-stories" className="hover:text-slate-400">Success Stories</Link>
            <Link href="/resources" className="hover:text-slate-400">Study Guides</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
