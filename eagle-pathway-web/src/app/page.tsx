'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  MapPin,
  ChevronRight,
  Menu,
  X,
  Wand2,
  Smartphone,
  Download,
  Search,
  HelpCircle,
  ChevronDown,
  Globe,
  Clock,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'students' | 'tutors' | 'parents'>('students');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Search State
  const [heroSearchType, setHeroSearchType] = useState<'scholarships' | 'tutors'>('scholarships');
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // Scholarship Explorer Filter State
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');

  // Tutor Matcher Filter State
  const [tutorFilter, setTutorFilter] = useState<string>('all');

  // Interactive AI Demo State
  const [aiPresetIndex, setAiPresetIndex] = useState(0);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiShowResult, setAiShowResult] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
      category: 'asia',
      degreeType: 'all',
      funding: 'Fully Funded',
      coverage: '100% Tuition, Free Dormitory, Health Insurance & Monthly Stipend',
      degrees: 'Bachelor, Master & PhD',
      deadline: 'Rolling 2026',
    },
    {
      id: 'stipendium-hungaricum',
      name: 'Stipendium Hungaricum Programme',
      country: 'Hungary 🇭🇺',
      category: 'europe',
      degreeType: 'undergrad_grad',
      funding: '100% Full Ride',
      coverage: 'Full Tuition, Free Accommodation, Medical Insurance & Monthly Living Allowance',
      degrees: 'Undergraduate & Graduate',
      deadline: 'Spring 2026',
    },
    {
      id: 'daad-germany',
      name: 'DAAD Helmut-Schmidt Programme',
      country: 'Germany 🇩🇪',
      category: 'europe',
      degreeType: 'graduate',
      funding: 'Full Ride + German Course',
      coverage: '100% Tuition, €934/month Living Allowance, Travel Subsidy & Health Insurance',
      degrees: "Master's Degree",
      deadline: 'Summer 2026',
    },
    {
      id: 'rhodes-oxford',
      name: 'Rhodes Scholarship at Oxford',
      country: 'United Kingdom 🇬🇧',
      category: 'usa_uk',
      degreeType: 'graduate',
      funding: 'Fully Funded + Stipend',
      coverage: '100% University Fees, Economy Flight & £18,000/yr Living Stipend',
      degrees: 'Postgraduate / Master',
      deadline: 'Autumn 2026',
    },
    {
      id: 'fulbright-usa',
      name: 'Fulbright Foreign Student Program',
      country: 'United States 🇺🇸',
      category: 'usa_uk',
      degreeType: 'graduate',
      funding: 'Full Ride 100%',
      coverage: 'Full Tuition, Monthly Living Stipend, J-1 Visa Sponsorship & Airfare',
      degrees: "Master's & PhD",
      deadline: 'Fall 2026',
    },
    {
      id: 'csc-china',
      name: 'Chinese Government Scholarship (CSC)',
      country: 'China 🇨🇳',
      category: 'asia',
      degreeType: 'all',
      funding: 'Fully Funded',
      coverage: 'Free University Tuition, On-Campus Dormitory & Comprehensive Medical',
      degrees: 'Undergraduate, Master & PhD',
      deadline: 'Spring 2026',
    },
    {
      id: 'gks-korea',
      name: 'Global Korea Scholarship (GKS)',
      country: 'South Korea 🇰🇷',
      category: 'asia',
      degreeType: 'all',
      funding: 'Full Ride + Korean Training',
      coverage: 'Round-Trip Airfare, Settlement Allowance, 100% Tuition & KRW 1,000,000/mo',
      degrees: 'Bachelor, Master & PhD',
      deadline: 'Summer 2026',
    },
    {
      id: 'swedish-institute',
      name: 'Swedish Institute Scholarships (SISGP)',
      country: 'Sweden 🇸🇪',
      category: 'europe',
      degreeType: 'graduate',
      funding: 'Full Ride + SEK 12k/mo',
      coverage: 'Full Tuition directly covered, SEK 12,000/mo living grant & Travel insurance',
      degrees: "Master's Degree",
      deadline: 'Winter 2026',
    },
  ];

  const tutors = [
    {
      name: 'Ermias Haile',
      subject: 'Calculus, Linear Algebra & SAT Math',
      category: 'math',
      education: 'BSc Computer Engineering (AAU, 3.9 GPA)',
      rating: '5.0',
      reviews: 38,
      rate: '500 ETB / hr',
      mode: 'Bole, CMC & Online',
    },
    {
      name: 'Dr. Bethlehem Abebe',
      subject: 'Organic Chemistry & Biology',
      category: 'physics_chem',
      education: 'MD / AAU School of Medicine',
      rating: '4.9',
      reviews: 42,
      rate: '600 ETB / hr',
      mode: 'Online (Google Meet)',
    },
    {
      name: 'Dawit Mengistu',
      subject: 'IELTS Academic, TOEFL & College Essays',
      category: 'ielts_english',
      education: 'English Literature & SAT Coach (8.5 IELTS)',
      rating: '5.0',
      reviews: 29,
      rate: '550 ETB / hr',
      mode: 'Sarbet & Online',
    },
    {
      name: 'Yonas Tadesse',
      subject: 'Grade 9-12 Physics & National Exam Prep',
      category: 'high_school',
      education: 'BSc Physics (Top 1% National Exam)',
      rating: '4.9',
      reviews: 31,
      rate: '450 ETB / hr',
      mode: 'In-person Addis & Online',
    },
    {
      name: 'Selamawit Bekele',
      subject: 'SAT Verbal & Ivy League Essay Strategy',
      category: 'sat',
      education: 'Ivy League Admissions Mentor & Researcher',
      rating: '5.0',
      reviews: 47,
      rate: '700 ETB / hr',
      mode: 'Online (1-on-1 Meet)',
    },
    {
      name: 'Henok Assefa',
      subject: 'AP Chemistry & General Science',
      category: 'physics_chem',
      education: 'BSc Chemical Engineering (AAU Tech)',
      rating: '4.8',
      reviews: 24,
      rate: '500 ETB / hr',
      mode: 'Megenagna & Online',
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

  // AI Demo Presets
  const aiPresets = [
    {
      title: 'Informatics & AI (DAAD Germany)',
      tag: 'Engineering & Tech',
      text: 'Growing up in Addis Ababa, I witnessed how localized AI diagnostics could bridge healthcare shortages in rural clinics. At Addis Ababa University, my capstone project deployed edge-computing vision models on low-power devices. I am applying to the DAAD Helmut-Schmidt Programme in Informatics to develop decentralized biomedical systems that solve real-world African infrastructure bottlenecks.',
      score: 95,
      metrics: { content: 96, motivation: 94, structure: 95 },
      strength: 'Clear nexus between personal background in Addis Ababa, technical capstone, and target German curriculum.',
      recommendation: 'Specify 1 target research lab or professor at your chosen German university to demonstrate deep institutional research.',
    },
    {
      title: 'Pediatric Oncology (Hungary Stipendium)',
      tag: 'Medical Sciences',
      text: 'My commitment to pediatric oncology was forged while volunteering at Tikur Anbessa Specialized Hospital. Through the Stipendium Hungaricum at Semmelweis University, I seek to master next-generation immunotherapy protocols and return to establish specialized pediatric clinical trials in East Africa.',
      score: 92,
      metrics: { content: 93, motivation: 92, structure: 91 },
      strength: 'Compelling clinical volunteer experience with a high-conviction long-term return commitment.',
      recommendation: 'Highlight specific laboratory coursework (e.g. molecular biology assays) to confirm empirical readiness.',
    },
    {
      title: 'Trade & Monetary Policy (Oxford Rhodes)',
      tag: 'Economics & Law',
      text: 'African economic integration through the AfCFTA requires innovative trade finance mechanisms and monetary policy coordination. With a 3.9 GPA in Economics and experience modeling inflation telemetry at the National Bank, my goal at Oxford is to design cross-border settlement architectures for developing markets.',
      score: 97,
      metrics: { content: 98, motivation: 97, structure: 96 },
      strength: 'Superb quantitative credentials paired with macroscopic vision for continental economic infrastructure.',
      recommendation: 'Seamless statement. Pair with strong Oxford faculty citations in trade macroeconomics for maximum impact.',
    },
  ];

  // FAQ Items
  const faqs = [
    {
      question: 'Is Eagle Pathway free to create an account?',
      answer:
        'Yes! Registering an account is 100% free with no credit card required. Students can browse all 100+ global scholarships, generate initial essay drafts with Eagle AI, and search verified tutors at zero upfront cost.',
    },
    {
      question: 'How do 1-on-1 tutoring sessions work in Addis Ababa vs Online?',
      answer:
        'For in-person tutoring in Addis Ababa (available across Bole, CMC, Sarbet, Megenagna, and other sub-cities), our verified educators come directly to your home. For students elsewhere in Ethiopia or abroad, classes take place online via integrated 1-click Google Meet rooms with zero software installs required.',
    },
    {
      question: 'What payment methods are supported for tutor sessions?',
      answer:
        'We support Commercial Bank of Ethiopia (CBE), CBE Birr, Telebirr, and direct bank transfers. Simply upload your screenshot receipt in the app or web portal, and our automated verification confirms your session instantly.',
    },
    {
      question: 'How do parents link to their child’s account?',
      answer:
        'Parents create a dedicated Parent account and enter their child’s unique 6-character Student ID or phone number. Once linked, parents receive real-time updates on completed tutoring hours, tutor notes, and scholarship application milestones.',
    },
    {
      question: 'Can I access Eagle Pathway on Android and Web simultaneously?',
      answer:
        'Absolutely. Your account synchronizes in real time across the Web Portal (web.eaglespathway.com) and the official Eagle Pathway Android Mobile App available on Google Play. Start an application on your laptop and continue reviewing on your phone seamlessly.',
    },
    {
      question: 'How does the Eagle AI Statement of Purpose (SOP) tool work?',
      answer:
        'Eagle AI evaluates your essays against admissions rubrics from top global scholarship committees. It provides an objective 0-100 score, breaks down your essay into Content, Structure, and Motivation metrics, and suggests concrete line-by-line improvements.',
    },
  ];

  // Filtered Scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      if (scholarshipFilter === 'all') return true;
      if (scholarshipFilter === 'undergraduate') return s.degreeType === 'all' || s.degreeType === 'undergrad_grad';
      if (scholarshipFilter === 'graduate') return s.degreeType === 'all' || s.degreeType === 'graduate' || s.degreeType === 'undergrad_grad';
      if (scholarshipFilter === 'full_ride') return s.funding.toLowerCase().includes('full');
      if (scholarshipFilter === 'europe') return s.category === 'europe';
      if (scholarshipFilter === 'usa_uk') return s.category === 'usa_uk';
      if (scholarshipFilter === 'asia') return s.category === 'asia';
      return true;
    });
  }, [scholarships, scholarshipFilter]);

  // Filtered Tutors
  const filteredTutors = useMemo(() => {
    return tutors.filter((t) => {
      if (tutorFilter === 'all') return true;
      if (tutorFilter === 'sat') return t.category === 'sat';
      if (tutorFilter === 'math') return t.category === 'math';
      if (tutorFilter === 'physics_chem') return t.category === 'physics_chem';
      if (tutorFilter === 'ielts_english') return t.category === 'ielts_english';
      if (tutorFilter === 'high_school') return t.category === 'high_school';
      return true;
    });
  }, [tutors, tutorFilter]);

  // Trigger Hero Search
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearchQuery.trim();
    if (heroSearchType === 'scholarships') {
      router.push(`/scholarships${query ? `?search=${encodeURIComponent(query)}` : ''}`);
    } else {
      router.push(`/tutors${query ? `?search=${encodeURIComponent(query)}` : ''}`);
    }
  };

  const handleSimulateAiReview = () => {
    setIsAiAnalyzing(true);
    setAiShowResult(false);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiShowResult(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#C9A84C]/30 selection:text-[#0B2A5B] pb-16 sm:pb-0">
      {/* ========================================================= */}
      {/* 1. STICKY NAVIGATION BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex-shrink-0">
              <Image
                src="/brand/icon-light.svg"
                alt="Eagle Pathway"
                width={36}
                height={36}
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#0B2A5B] leading-none">
                Eagle Pathway
              </span>
              <span className="text-[10px] text-[#C9A84C] font-bold tracking-widest uppercase mt-0.5">
                Scholarships &amp; Tutoring
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#audiences" onClick={() => setActiveTab('students')} className="hover:text-slate-900 transition-colors">
              For Students
            </a>
            <a href="#audiences" onClick={() => setActiveTab('tutors')} className="hover:text-slate-900 transition-colors">
              For Tutors
            </a>
            <a href="#audiences" onClick={() => setActiveTab('parents')} className="hover:text-slate-900 transition-colors">
              For Parents
            </a>
            <a href="#scholarships" className="hover:text-slate-900 transition-colors">
              Scholarships
            </a>
            <a href="#tutors" className="hover:text-slate-900 transition-colors">
              1-on-1 Tutors
            </a>
            <a href="#ai-suite" className="hover:text-slate-900 transition-colors flex items-center gap-1 text-[#9A7B2C] font-bold">
              <Sparkles size={13} className="text-[#C9A84C]" />
              <span>Eagle AI</span>
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all"
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
            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-3 text-xs font-semibold text-slate-800">
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
              <a href="#tutors" onClick={() => setMobileMenuOpen(false)}>
                Verified Tutors
              </a>
              <a href="#ai-suite" onClick={() => setMobileMenuOpen(false)} className="text-[#9A7B2C] font-bold">
                Eagle AI Engine
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
                Frequently Asked Questions
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-center font-semibold text-xs shadow-xs"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-800 text-center font-semibold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-center font-semibold text-xs shadow-xs"
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
      {/* 2. HERO SECTION WITH INTERACTIVE LIVE SEARCH */}
      {/* ========================================================= */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200/80">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-r from-[#0B2A5B]/5 via-[#C9A84C]/10 to-[#1E4D9B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Addis Ababa 🇪🇹 &amp; Worldwide • Verified Academic Gateway</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Soar to World-Class Universities with{' '}
            <span className="bg-gradient-to-r from-[#0B2A5B] via-[#1E4D9B] to-[#C9A84C] bg-clip-text text-transparent">
              Expert Guidance
            </span>{' '}
            &amp; 1-on-1 Tutoring.
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover 100+ fully funded global scholarships, connect with verified educators across Addis Ababa and online, and master winning application essays with Eagle AI.
          </p>

          {/* INTERACTIVE UNIFIED HERO SEARCH BAR */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-2 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setHeroSearchType('scholarships')}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      heroSearchType === 'scholarships'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎓 Scholarships
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSearchType('tutors')}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      heroSearchType === 'tutors'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👨‍🏫 Tutors
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Press Enter to explore</span>
              </div>

              <form onSubmit={handleHeroSearch} className="flex items-center gap-2 px-1">
                <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder={
                    heroSearchType === 'scholarships'
                      ? 'Search scholarships (e.g. Turkiye, DAAD, Hungary, Full Ride)...'
                      : 'Search tutors (e.g. SAT Math, Physics, IELTS, Chemistry)...'
                  }
                  className="flex-1 bg-transparent border-0 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none py-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Search Now
                </button>
              </form>
            </div>

            {/* Quick Keyword Chips */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2.5 text-[11px]">
              <span className="text-slate-400 font-medium">Popular:</span>
              {['Türkiye Bursları', 'DAAD Germany', 'SAT Math', 'IELTS Prep', 'Stipendium Hungaricum'].map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => {
                    setHeroSearchQuery(keyword);
                    if (keyword.includes('Math') || keyword.includes('IELTS')) {
                      setHeroSearchType('tutors');
                    } else {
                      setHeroSearchType('scholarships');
                    }
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started on Web</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Smartphone size={15} className="text-[#C9A84C]" />
              <span>Get Android App (5.0★)</span>
            </a>

            <Link
              href="/request-tutor"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>Request Home Tutor</span>
            </Link>
          </div>

          {/* Social Proof Metric Counters */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {stats.map((s, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{s.value}</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MULTI-ROLE SHOWCASE (STUDENTS • TUTORS • PARENTS) */}
      {/* ========================================================= */}
      <section id="audiences" className="py-16 md:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tailored Ecosystem
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              One Unified Platform. Three Specialized Experiences.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Whether you are an ambitious scholar, an expert educator, or a parent supporting your child, Eagle Pathway provides the exact tools you need.
            </p>
          </div>

          {/* Overview-Style Segmented Tab Switcher */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 w-max">
              {[
                { id: 'students', label: 'For Students 👨‍🎓' },
                { id: 'tutors', label: 'For Tutors 👨‍🏫' },
                { id: 'parents', label: 'For Parents 👨‍👩‍👧' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
            {activeTab === 'students' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-brand-blue border border-blue-200/60">
                    Student &amp; Scholar Experience
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    Your Complete University &amp; Scholarship Launchpad
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Access verified global full-ride scholarships, match with educators for exam prep (SAT, IELTS, National Exams), and craft winning motivation letters with real-time AI scoring.
                  </p>

                  <div className="space-y-2.5">
                    {[
                      '100+ Fully Funded International Scholarships (Turkiye, Hungary, DAAD, USA)',
                      'Verified 1-on-1 Tutors in Addis Ababa (In-Person) or Global (Online)',
                      'Eagle AI SOP Reviewer: 100-point rubric scoring & inline rewrites',
                      'Scholarship Mock Interview Simulator with real-time audio/text grading',
                      'Visual Application Kanban Board with deadline notifications',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
                    >
                      Create Student Account
                    </Link>
                    <Link
                      href="/scholarships"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      Browse Scholarships
                    </Link>
                  </div>
                </div>

                {/* Student Card Mockup */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Award size={15} className="text-[#C9A84C]" />
                      <span>AI Statement of Purpose Evaluation</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Score: 95 / 100
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-lg text-xs text-slate-600 leading-relaxed italic border border-slate-100">
                    &quot;Your statement demonstrates extraordinary academic purpose. With direct bridges between your AAU capstone and decentralized biomedical engineering, this essay is highly competitive for German selection boards.&quot;
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                      <div className="font-bold text-brand-blue">Target Country</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Germany 🇩🇪 / DAAD</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="font-bold text-amber-900">Application Deadline</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Closes in 24 Days</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutors' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    Educators &amp; Mentors Experience
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    Teach Motivated Scholars &amp; Earn on Your Own Schedule
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Set your own hourly fees in ETB, receive student booking requests in Addis Ababa or teach online worldwide, and withdraw earnings directly to CBE or Telebirr.
                  </p>

                  <div className="space-y-2.5">
                    {[
                      'Set your own hourly rate (500 – 1,500+ ETB/hr) & teaching subjects',
                      'Browse open student tutoring requests across Addis Ababa neighborhoods',
                      'Conduct interactive sessions online with built-in Google Meet rooms',
                      'Guaranteed payments: 24-hour payouts via Commercial Bank of Ethiopia & Telebirr',
                      'Access free teaching toolkits, pedagogy guides, and graduate scholarship mentors',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
                    >
                      Apply to Teach
                    </Link>
                    <Link
                      href="/tutor-jobs"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      View Student Requests
                    </Link>
                  </div>
                </div>

                {/* Tutor Card Mockup */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wallet size={15} className="text-emerald-600" />
                      <span>Tutor Earnings &amp; Wallet</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Settled Balance
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 tracking-tight">7,200 ETB</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Available for instant withdrawal</div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold">
                      Withdraw via CBE / Telebirr
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-lg text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student:</span>
                      <span className="font-semibold text-slate-900">Kidist M. (Grade 12 Physics)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Next Session:</span>
                      <span className="font-semibold text-emerald-700">Tomorrow, 4:00 PM (Google Meet)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parents' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                    Parent &amp; Family Experience
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    Full Visibility into Your Child&apos;s Academic Future
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Link your child with a simple 6-character code, monitor university applications and deadlines, book verified background-checked tutors, and access parent admissions roadmaps.
                  </p>

                  <div className="space-y-2.5">
                    {[
                      'Link children instantly using student code or phone number',
                      'Track all university and scholarship applications in real time',
                      'Monitor tutoring session attendance, hours completed, and teacher notes',
                      'Request home tutors in Addis Ababa neighborhoods with 100% verified credentials',
                      "Access Parent's Guides to SAT, university financing, and embassy visas",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/register"
                      className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
                    >
                      Create Parent Account
                    </Link>
                    <Link
                      href="/request-tutor"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"
                    >
                      Book a Tutor for Child
                    </Link>
                  </div>
                </div>

                {/* Parent Card Mockup */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        M
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Michael Bekele</div>
                        <div className="text-[10px] text-slate-400">Grade 12 • St. Joseph School</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Linked Child
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50/80 rounded-lg flex items-center justify-between border border-slate-100">
                      <span className="font-medium text-slate-700">Hungarian Scholarship (ELTE)</span>
                      <span className="font-bold text-brand-blue text-[11px]">Submitted</span>
                    </div>
                    <div className="p-2.5 bg-slate-50/80 rounded-lg flex items-center justify-between border border-slate-100">
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
      {/* 4. INTERACTIVE "TRY EAGLE AI" LIVE DEMO WIDGET */}
      {/* ========================================================= */}
      <section id="ai-suite" className="py-16 md:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold border border-white/10">
              <Sparkles size={13} />
              <span>Interactive Live Demo</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Test Eagle AI with Sample Statements of Purpose
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Experience instant rubric evaluation calibrated to international scholarship selection boards.
            </p>
          </div>

          {/* Interactive Playground Widget */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700 pb-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Select Sample Preset</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {aiPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPresetIndex(idx);
                        setAiShowResult(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        aiPresetIndex === idx
                          ? 'bg-[#C9A84C] text-slate-950 shadow-xs'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateAiReview}
                disabled={isAiAnalyzing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sparkles size={14} className={isAiAnalyzing ? 'animate-spin' : ''} />
                <span>{isAiAnalyzing ? 'Evaluating Rubric…' : 'Re-Analyze with Eagle AI'}</span>
              </button>
            </div>

            {/* Content Display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Sample Essay Text */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white">{aiPresets[aiPresetIndex].title}</span>
                  <span>108 words</span>
                </div>
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-serif italic">
                  &quot;{aiPresets[aiPresetIndex].text}&quot;
                </div>
              </div>

              {/* Right Column: AI Rubric Breakdown */}
              <div className="lg:col-span-5 bg-slate-900/90 rounded-xl p-5 border border-slate-700/80 space-y-4">
                {isAiAnalyzing ? (
                  <div className="py-12 text-center space-y-2">
                    <Sparkles className="w-6 h-6 animate-spin text-[#C9A84C] mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">Running multi-metric admissions rubric evaluation…</p>
                  </div>
                ) : aiShowResult ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Score</div>
                        <div className="text-2xl font-black text-emerald-400">{aiPresets[aiPresetIndex].score} / 100</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Top 5% Tier
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                          <span>Academic Fit</span>
                          <span>{aiPresets[aiPresetIndex].metrics.content}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${aiPresets[aiPresetIndex].metrics.content}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                          <span>Personal Motivation</span>
                          <span>{aiPresets[aiPresetIndex].metrics.motivation}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${aiPresets[aiPresetIndex].metrics.motivation}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-lg text-[11px] space-y-1.5 border border-slate-700">
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={12} />
                        <span>Key Strength</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{aiPresets[aiPresetIndex].strength}</p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg text-[11px] space-y-1.5 border border-amber-500/20">
                      <div className="font-bold text-[#C9A84C] flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>AI Polish Recommendation</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{aiPresets[aiPresetIndex].recommendation}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* CTAs to AI Suite */}
            <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Want to evaluate your own essay or practice mock interviews?</span>
              <div className="flex items-center gap-2">
                <Link
                  href="/tools/sop"
                  className="px-3.5 py-1.5 bg-[#C9A84C] hover:bg-[#DFBE60] text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Open SOP Evaluator →
                </Link>
                <Link
                  href="/tools/interview"
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Mock Interview Simulator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE LIVE SCHOLARSHIP DIRECTORY EXPLORER */}
      {/* ========================================================= */}
      <section id="scholarships" className="py-16 md:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Curated Global Directory
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Featured International Scholarships
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                100+ fully vetted scholarship opportunities open for Ethiopian and African applicants.
              </p>
            </div>

            <Link
              href="/scholarships"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              <span>Explore All 100+ Listings</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Interactive Scholarship Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Opportunities' },
              { id: 'undergraduate', label: 'Bachelor’s Degrees' },
              { id: 'graduate', label: 'Master’s & PhD' },
              { id: 'full_ride', label: '100% Fully Funded' },
              { id: 'europe', label: 'Europe 🇪🇺' },
              { id: 'usa_uk', label: 'USA & UK 🇺🇸🇬🇧' },
              { id: 'asia', label: 'Asia 🇹🇷🇨🇳' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScholarshipFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  scholarshipFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Scholarship Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredScholarships.map((s) => (
              <div
                key={s.id}
                className="bg-white hover:bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-700">{s.country}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {s.funding}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug mb-1.5 line-clamp-2">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {s.coverage}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">{s.degrees}</span>
                  <Link
                    href={`/scholarships/${s.id}`}
                    className="font-bold text-brand-blue hover:underline"
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
      {/* 6. INTERACTIVE 1-ON-1 TUTOR MATCHER SHOWCASE */}
      {/* ========================================================= */}
      <section id="tutors" className="py-16 md:py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Expert 1-on-1 Mentorship
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Top-Rated Verified Educators
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Screened educators across Addis Ababa and internationally for STEM, SAT, and IELTS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/request-tutor"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
              >
                Request a Tutor
              </Link>
              <Link
                href="/tutors"
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white"
              >
                Browse All Tutors
              </Link>
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'sat', label: 'SAT & College Prep' },
              { id: 'math', label: 'Calculus & Math' },
              { id: 'physics_chem', label: 'Physics & Chemistry' },
              { id: 'ielts_english', label: 'IELTS & English' },
              { id: 'high_school', label: 'Grade 9-12 Prep' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTutorFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  tutorFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tutors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredTutors.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                        {t.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900">{t.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                          <Star size={11} fill="currentColor" />
                          <span>{t.rating}</span>
                          <span className="text-slate-400 font-normal">({t.reviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3 text-xs">
                    <div className="font-semibold text-slate-900">{t.subject}</div>
                    <div className="text-slate-500 text-[11px]">{t.education}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 pt-0.5">
                      <MapPin size={11} /> {t.mode}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{t.rate}</span>
                  <Link
                    href="/tutors"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
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
      <section id="stories" className="py-16 md:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Hall of Fame
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Real Ethiopian Scholars. Global Success.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Read how Ethiopian students used Eagle Pathway to unlock full-ride admissions to Oxford, Hungary, Turkey, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((story, i) => (
              <div
                key={i}
                className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between hover:bg-white hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {story.imageInitial}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900">{story.name}</h3>
                      <div className="text-xs font-semibold text-brand-blue">{story.institution}</div>
                      <div className="text-[10px] text-slate-400">{story.degree}</div>
                    </div>
                  </div>

                  <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 inline-block">
                    {story.scholarship}
                  </div>

                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    &quot;{story.quote}&quot;
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck size={14} />
                  <span>Verified Scholar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. SIMPLE 3-STEP JOURNEY */}
      {/* ========================================================= */}
      <section className="py-16 md:py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Simple 3-Step Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Eagle Pathway Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Create Free Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sign up as a Student, Tutor, or Parent in under 60 seconds with zero credit card required.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Discover &amp; Match</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse curated scholarships or connect with top-ranked Ethiopian tutors for exam preparation.
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Master &amp; Soar</h3>
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
      <section className="py-16 md:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0B2A5B] text-white rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="absolute right-0 top-0 w-80 h-80 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="lg:col-span-7 space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A84C] text-xs font-bold border border-white/10">
                <Smartphone size={14} />
                <span>Multi-Platform Experience</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Experience on the Web or on Your Mobile Device
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Stay updated on scholarship deadlines, communicate instantly with 1-on-1 tutors, and manage your admissions applications seamlessly on the web or via our native Android mobile app.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  'Real-time push alerts for urgent scholarship deadlines',
                  '1-on-1 direct in-app messaging with verified educators',
                  'Interactive Google Meet rooms on both desktop & mobile',
                  'Instant cloud synchronization across your phone & laptop',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 size={14} className="text-[#C9A84C] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Smartphone size={16} />
                  <span>Download on Google Play</span>
                </a>

                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 text-center"
                >
                  Continue on Web Portal
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative z-10 flex justify-center">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/brand/icon-light.svg"
                      alt="Eagle Pathway App"
                      width={26}
                      height={26}
                    />
                    <span className="font-bold text-xs text-white">Eagle Pathway Mobile</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Live on Play Store
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Package:</span>
                    <span className="font-mono text-[11px] text-[#C9A84C]">com.eaglepathway.app</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Ratings:</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star size={11} fill="currentColor" />
                      <span>5.0 Star Rating</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-300">Compatibility:</span>
                    <span className="text-emerald-400 font-semibold">Android 8.0+ &amp; Web</span>
                  </div>
                </div>

                <a
                  href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Download size={13} className="text-[#C9A84C]" />
                  <span>Install From Google Play</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. INTERACTIVE FAQ ACCORDION */}
      {/* ========================================================= */}
      <section id="faq" className="py-16 md:py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Frequently Asked Questions
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear answers on admissions guidance, tutor booking, and payment methods.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50/60 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-blue' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. FINAL CONVERSION BANNER */}
      {/* ========================================================= */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to Begin Your Educational Journey?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join hundreds of Ethiopian scholars, certified educators, and families on Eagle Pathway today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
            >
              Get Started Free Today
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. COMPREHENSIVE FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-white/70 py-12 text-xs border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/icon-light.svg"
                alt="Eagle Pathway"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-bold text-white text-sm">Eagle Pathway</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Empowering Ethiopian and African scholars with international university scholarships, verified 1-on-1 tutoring, and AI admissions counseling.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2.5">For Students</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li><Link href="/scholarships" className="hover:text-white">Scholarships Directory</Link></li>
              <li><Link href="/tutors" className="hover:text-white">Find a Verified Tutor</Link></li>
              <li><Link href="/request-tutor" className="hover:text-white">Post Tutor Request</Link></li>
              <li><Link href="/tools/sop" className="hover:text-white">AI SOP Reviewer</Link></li>
              <li><Link href="/tools/interview" className="hover:text-white">Mock Interview Simulator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2.5">For Tutors &amp; Parents</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li><Link href="/register" className="hover:text-white">Apply to Teach (Educators)</Link></li>
              <li><Link href="/tutor-jobs" className="hover:text-white">Browse Student Jobs</Link></li>
              <li><Link href="/earnings" className="hover:text-white">Tutor Earnings &amp; CBE Payouts</Link></li>
              <li><Link href="/parent/children" className="hover:text-white">Parent Portal &amp; Child Tracking</Link></li>
              <li><Link href="/resources" className="hover:text-white">Parent Admissions Guides</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Office &amp; Support</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
              Addis Ababa, Ethiopia<br />
              Email: admissions@eaglespathway.com<br />
              Support: 24/7 via WhatsApp &amp; In-App Chat
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <Link
                href="/login"
                className="inline-block px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] text-center"
              >
                Log In to Portal
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] text-center"
              >
                <Smartphone size={13} />
                <span>Get App on Google Play</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>&copy; {new Date().getFullYear()} Eagle Pathway Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/services" className="hover:text-slate-400">Advisory Services</Link>
            <Link href="/success-stories" className="hover:text-slate-400">Success Stories</Link>
            <Link href="/resources" className="hover:text-slate-400">Study Guides</Link>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 13. FLOATING MOBILE BOTTOM ACTION BAR */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2 flex items-center justify-around sm:hidden shadow-lg">
        <a
          href="#scholarships"
          className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-slate-900"
        >
          <Search size={16} />
          <span className="text-[10px] font-semibold">Scholarships</span>
        </a>
        <a
          href="#tutors"
          className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-slate-900"
        >
          <Users size={16} />
          <span className="text-[10px] font-semibold">Tutors</span>
        </a>
        <a
          href="#ai-suite"
          className="flex flex-col items-center gap-0.5 text-amber-600 hover:text-amber-700"
        >
          <Sparkles size={16} />
          <span className="text-[10px] font-semibold">Eagle AI</span>
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.eaglepathway.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 text-emerald-600 hover:text-emerald-700 font-bold"
        >
          <Download size={16} />
          <span className="text-[10px] font-bold">App</span>
        </a>
      </div>
    </div>
  );
}
