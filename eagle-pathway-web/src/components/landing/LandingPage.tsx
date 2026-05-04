'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  faqs,
  internationalServices,
  pricingPlans,
  serviceTracks,
  timeline,
  trustPoints,
  whoWeHelp,
  destinations,
  stats,
} from '@/src/content/landing';

function AnimatedSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      className={`section ${className || ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}

function AnimatedCard({ children, className, style, ...props }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.article
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function useFadeUp() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useFadeUp();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const primaryCtaLabel = 'Start Your Journey';

  const statsData = [
    { value: stats.totalUsers, label: 'Active Students' },
    { value: stats.placements, label: 'University Placements' },
    { value: stats.scholarshipValue, label: 'Scholarship Value' },
    { value: stats.countries, label: 'Countries' },
    { value: stats.successRate, label: 'Success Rate' },
  ];

  const modules = ['LEARN', 'SKILL', 'NET', 'OPP', 'GOAL', 'COACH'];

  const marqueeItems = [
    'Personal Mentorship',
    'Application Strategy',
    'Essay Review',
    'Interview Prep',
    'Financial Aid',
    'Visa Guidance',
    'AI SOP Generator',
    'Weekly Tracking',
  ];

  const audiences = whoWeHelp.map((item, i) => ({
    number: String(i + 1).padStart(2, '0'),
    ...item,
  }));

  return (
    <div className="page-layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-grid">
            <div className="logo-group">
              <div className="logo-icon">
                <Image src="/favicon.ico" alt="Eagle Pathway logo" width={32} height={32} />
              </div>
              <span className="logo-text">Eagle Pathway</span>
            </div>
            <ul className="nav-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/team">Team</Link></li>
              <li><Link href="/testimonials">Success Stories</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
            <div className="nav-cta">
              <Link href="/login" className="btn btn-outline">Client Portal</Link>
            </div>
            <button 
              className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

      </nav>

      <main>
        <motion.section
          ref={heroRef}
          className="hero"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="hero-shapes">
            <div className="hero-shape hero-shape-1"></div>
            <div className="hero-shape hero-shape-2"></div>
            <div className="hero-shape hero-shape-3"></div>
            <div className="hero-shape hero-shape-4"></div>
          </div>

          <div className="hero-content">
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="hero-badge-dot"></span>
              Trusted by 1500+ Ethiopian students
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Your gateway to <span className="gold">global education</span>
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Expert scholarship advising and academic tutoring to help you secure admissions and funding at world-class universities in Canada, UK, USA, and Europe.
            </motion.p>

            <motion.div
              className="hero-ctas"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              <a href="#contact" className="btn btn-primary">Start Your Journey</a>
              <a href="#proof" className="btn btn-outline">How It Works</a>
            </motion.div>

            <motion.div
              className="hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.8 }}
            >
              {statsData.map((stat, i) => (
                <div key={i} className="hero-stat">
                  <span className="hero-stat-value">{stat.value}</span>
                  <span className="hero-stat-label">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="hero-divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <span>Students placed at</span>
              <div className="hero-flags">
                <span>🇬🇧</span>
                <span>🇨🇦</span>
                <span>🇺🇸</span>
                <span>🇪🇺</span>
                <span>🇦🇺</span>
              </div>
              <span>Oxford · McGill · MIT · EPFL · UNSW</span>
            </motion.div>
          </div>
        </motion.section>

        <div className="marquee-strip">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="marquee-item">{item}</span>
            ))}
          </div>
        </div>

        <AnimatedSection id="problem" className="section">
          <div className="container">
            <div className="grid-2" style={{ alignItems: 'center' }}>
              <div className="fade-up">
                <SectionLabel>THE CHALLENGE</SectionLabel>
                <h2 style={{ marginTop: '0.75rem', marginBottom: '1rem', color: 'var(--white)' }}>
                  Navigating international admissions is overwhelming
                </h2>
                <p>
                  With thousands of scholarships, endless requirements, and complex applications,
                  the process feels impossible. Most qualified Ethiopian students never apply because
                  they don't know where to start.
                </p>
              </div>
              <div className="stats-grid fade-up">
                {statsData.map((stat, i) => (
                  <div key={i} className="stat-cell">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="solution" className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="fade-up">
              <SectionLabel>THE SOLUTION</SectionLabel>
              <h2 style={{ marginTop: '0.75rem' }}>Your AI-Powered Pathway</h2>
            </div>
            <div className="solution-flow fade-up">
              <div className="flow-node">
                <div className="flow-circle">YOU</div>
                <div className="flow-line"></div>
                <div className="flow-circle" style={{ width: '80px', height: '80px' }}>AI CORE</div>
                <div className="flow-line"></div>
              </div>
              <div className="modules-grid">
                {modules.map((mod) => (
                  <div key={mod} className="module-chip">{mod}</div>
                ))}
              </div>
              <div className="stat-bar">
                <div className="stat-bar-item">
                  <strong>6 modules</strong>
                  <span>Continuous support</span>
                </div>
                <div className="stat-bar-item">
                  <strong>&lt; 5 min daily</strong>
                  <span>Touchpoint</span>
                </div>
                <div className="stat-bar-item">
                  <strong>Weekly tracking</strong>
                  <span>Always progressing</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="destinations" className="section section-soft">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>DESTINATIONS</SectionLabel>
              <h2>Where our students go</h2>
            </div>
            <div className="grid-5" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {destinations.map((dest, i) => (
                <AnimatedCard key={dest.country} className="destination-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{dest.flag}</div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--white)' }}>{dest.country}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{dest.programs} programs</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="audience" className="section">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>WHO WE HELP</SectionLabel>
              <h2>Tailored for your journey</h2>
            </div>
            <div className="grid-3" style={{ marginTop: '2rem' }}>
              {audiences.map((item) => (
                <AnimatedCard key={item.number} className="audience-card">
                  <span className="audience-number">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="proof" className="section section-soft">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>WHY EAGLE PATHWAY</SectionLabel>
              <h2>Standards that deliver results</h2>
            </div>
            <div className="grid-3" style={{ marginTop: '2rem' }}>
              {trustPoints.map((item) => (
                <AnimatedCard key={item.title} className="feature-card">
                  <div className="feature-icon">✦</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="services" className="section">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>SERVICE TRACKS</SectionLabel>
              <h2>Detailed pathways</h2>
              <p>Specific deliverables, not vague promises.</p>
            </div>
            <div className="grid-2" style={{ marginTop: '2rem' }}>
              {serviceTracks.map((track) => (
                <AnimatedCard key={track.title} className="card">
                  <h3>{track.title}</h3>
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{track.subtitle}</p>
                  <ul className="check-list">
                    {track.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="intlservices" className="section section-soft">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>GLOBAL SERVICES</SectionLabel>
              <h2>International financial solutions</h2>
            </div>
            <div className="grid-3" style={{ marginTop: '2rem' }}>
              {internationalServices.map((service) => (
                <AnimatedCard key={service.type} className="card">
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="pricing" className="section">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>PRICING</SectionLabel>
              <h2>Transparent packages</h2>
              <p>Choose the support that fits your needs.</p>
            </div>
            <div className="grid-3" style={{ marginTop: '2rem' }}>
              {pricingPlans.map((plan) => (
                <AnimatedCard
                  key={plan.name}
                  className={`pricing-card${plan.featured ? ' pricing-featured' : ''}`}
                >
                  <h3>{plan.name}</h3>
                  {plan.price && <div className="price">{plan.price}</div>}
                  <p style={{ fontSize: '0.85rem' }}>{plan.description}</p>
                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <a href="#contact" className={`btn ${plan.featured ? 'btn-primary' : 'btn-outline'}`}>
                    {primaryCtaLabel}
                  </a>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="faq" className="section">
          <div className="container">
            <div className="section-head fade-up">
              <SectionLabel>FAQ</SectionLabel>
              <h2>Common questions</h2>
            </div>
            <div style={{ marginTop: '2rem', maxWidth: '800px', margin: '2rem auto 0' }}>
              {faqs.map((item) => (
                <motion.details
                  key={item.question}
                  className="faq-item"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="contact" className="section">
          <div className="container">
            <div className="cta-band fade-up">
              <h2>
                Ready to write your{' '}
                <span className="gradient-text">success story?</span>
              </h2>
              <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.55)' }}>
                Book a consultation and get a structured pathway within your first week.
              </p>
              <div className="cta-group" style={{ marginTop: '1.5rem' }}>
                <a href="#contact" className="btn btn-primary">{primaryCtaLabel}</a>
                <Link href="/login" className="btn btn-outline">Portal Login</Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="logo-group" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div className="logo-icon"><img src="/favicon.ico" alt="Eagle Pathway logo" width={32} height={32} /></div>
            <span className="logo-text">Eagle Pathway</span>
          </div>
          <p>© {new Date().getFullYear()} Eagle Pathway Ethiopia. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
            Contact: info@eaglepathway.com · +251 912 345 678
          </p>
        </div>
      </footer>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mobile-overlay-content">
              <nav className="mobile-nav">
                <Link href="/about" onClick={closeMenu}>About</Link>
                <Link href="/team" onClick={closeMenu}>Team</Link>
                <Link href="/testimonials" onClick={closeMenu}>Success Stories</Link>
                <Link href="/blog" onClick={closeMenu}>Blog</Link>
                <a href="#services" onClick={closeMenu}>Services</a>
                <a href="#pricing" onClick={closeMenu}>Pricing</a>
                <Link href="/login" className="btn btn-primary" onClick={closeMenu}>Client Portal</Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}