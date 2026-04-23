'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  faqs,
  pricingPlans,
  serviceTracks,
  timeline,
  trustPoints,
  whoWeHelp,
} from '@/src/content/landing';

function AnimatedSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}

function AnimatedCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.article
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.article>
  );
}

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const primaryCtaLabel = 'Book free consultation';

  return (
    <div className="page-layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-grid">
            <div className="logo-group">
              <div className="logo-icon">🦅</div>
              <span className="logo-text">
                Eagle <span className="text-brand">Pathway</span>
              </span>
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
          </div>
        </div>
      </nav>

      <main>
        <motion.section
          ref={heroRef}
          className="hero section"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="container">
            <div className="hero-grid">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <motion.span
                  className="badge"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Trusted by ambitious Ethiopian students
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Scholarship and tutoring support,
                  {' '}
                  <span className="gradient-text">done with precision</span>
                  {' '}
                  and clarity
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Eagle Pathway helps students plan, prepare, and submit stronger international
                  scholarship applications while improving academic performance through high-quality tutoring.
                </motion.p>
                <motion.div
                  className="cta-group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <a href="#pathway" className="btn btn-primary">{primaryCtaLabel}</a>
                  <a href="#services" className="btn btn-outline">View services</a>
                </motion.div>
              </motion.div>

              <motion.aside
                className="hero-panel"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              >
                <h3>Outcomes</h3>
                <p>Clear results from our advising and tutoring operations.</p>
                <div className="metric-grid">
                  {[
                    { value: '94%', label: 'Admission success' },
                    { value: '500+', label: 'Global placements' },
                    { value: '$12M+', label: 'Scholarship value' },
                  ].map((metric, i) => (
                    <motion.div
                      key={metric.label}
                      className="metric"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <strong>{metric.value}</strong>
                      <span>{metric.label}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mini-note">Primary destinations: Canada, UK, Europe, and US.</div>
              </motion.aside>
            </div>
          </div>
        </motion.section>

        <AnimatedSection id="audience" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Who we help</h2>
              <p>Designed for students and families that want structured outcomes.</p>
            </div>
            <div className="grid-3">
              {whoWeHelp.map((item, i) => (
                <AnimatedCard key={item.title} className="card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="proof" className="section section-soft">
          <div className="container">
            <div className="section-head">
              <h2>Why students choose Eagle Pathway</h2>
              <p>Focused execution standards that improve consistency and trust.</p>
            </div>
            <div className="grid-3">
              {trustPoints.map((item, i) => (
                <AnimatedCard key={item.title} className="card">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="services" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Detailed service tracks</h2>
              <p>Specific deliverables, not vague promises.</p>
            </div>
            <div className="grid-2">
              {serviceTracks.map((track, i) => (
                <AnimatedCard key={track.title} className="card">
                  <h3>{track.title}</h3>
                  <p className="service-subtitle">{track.subtitle}</p>
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

        <AnimatedSection id="pathway" className="section">
          <div className="container">
            <div className="section-head">
              <h2>How engagement works</h2>
              <p>What to expect in your first weeks working with us.</p>
            </div>
            <div className="grid-2 timeline-grid">
              {timeline.map((step, i) => (
                <AnimatedCard key={step.week} className="card timeline-card">
                  <span className="step-num">{step.week}</span>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="pricing" className="section section-soft">
          <div className="container">
            <div className="section-head">
              <h2>Pricing preview</h2>
              <p>Transparent package direction before custom scoping.</p>
            </div>
            <div className="grid-3">
              {pricingPlans.map((plan, i) => (
                <AnimatedCard
                  key={plan.name}
                  className={`card pricing-card${plan.featured ? ' pricing-featured' : ''}`}
                >
                  <h3>{plan.name}</h3>
                  <p className="price-tag">{plan.price}</p>
                  <p>{plan.description}</p>
                  <ul className="check-list">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <a href="#contact" className="btn btn-primary">{primaryCtaLabel}</a>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection id="faq" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Frequently asked questions</h2>
              <p>Practical answers to common concerns before starting.</p>
            </div>
            <div className="faq-wrap">
              {faqs.map((item, i) => (
                <motion.details
                  key={item.question}
                  className="faq-item"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
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
            <div className="cta-band">
              <div>
                <h2>Ready to plan your next scholarship move?</h2>
                <p>Book a consultation and get a structured pathway within the first week.</p>
              </div>
              <div className="cta-group">
                <a href="#pathway" className="btn btn-primary">{primaryCtaLabel}</a>
                <Link href="/login" className="btn btn-outline">Portal login</Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="logo-group footer-brand">
            <div className="logo-icon">🦅</div>
            <span className="logo-text">Eagle Pathway</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Eagle Pathway Ethiopia. Structured guidance for global study pathways.</p>
        </div>
      </footer>

      <div className="mobile-sticky-cta">
        <a href="#pathway" className="btn btn-primary">{primaryCtaLabel}</a>
      </div>
    </div>
  );
}