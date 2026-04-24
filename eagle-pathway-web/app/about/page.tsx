import Head from 'next/head';
import Link from 'next/link';

export const metadata = {
  title: 'About Us | Eagle Pathway',
  description: 'Learn about Eagle Pathway\'s mission to help Ethiopian students achieve their dreams of studying abroad.',
};

export default function AboutPage() {
  const values = [
    {
      icon: '🎯',
      title: 'Clarity First',
      description: 'Every student deserves a clear, actionable pathway to their goals—no vague promises.',
    },
    {
      icon: '📊',
      title: 'Data-Driven',
      description: 'We track outcomes and continuously improve our methods based on what works.',
    },
    {
      icon: '🤝',
      title: 'Partnership',
      description: 'We work alongside families as partners, not just consultants.',
    },
    {
      icon: '🌍',
      title: 'Global Vision',
      description: 'Deep knowledge of international admissions combined with local context.',
    },
  ];

  const milestones = [
    { year: '2019', title: 'Foundation', description: 'Started with a handful of students in Addis Ababa' },
    { year: '2020', title: 'Remote Expansion', description: 'Launched virtual tutoring and advisory sessions' },
    { year: '2021', title: 'First $1M in Scholarships', description: 'Helped students secure over $1M in scholarship value' },
    { year: '2022', title: '100+ Placements', description: 'Reached 100+ students placed in universities worldwide' },
    { year: '2023', title: 'Full Service Launch', description: 'Expanded to end-to-end application support' },
    { year: '2024', title: '$12M+ Milestone', description: 'Crossed $12M in total scholarship value secured' },
  ];

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>

      <div className="page-layout">
        <nav className="navbar">
          <div className="container">
            <div className="nav-grid">
              <Link href="/" className="logo-group">
                <div className="logo-icon">🦅</div>
                <span className="logo-text">
                  Eagle <span className="text-brand">Pathway</span>
                </span>
              </Link>
              <ul className="nav-links">
                <li><Link href="/#services">Services</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/team">Team</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
              <div className="nav-cta">
                <Link href="/login" className="btn btn-outline">Client Portal</Link>
              </div>
            </div>
          </div>
        </nav>

        <header className="page-header">
          <div className="container">
            <h1>About Eagle Pathway</h1>
            <p>Empowering Ethiopian students to achieve their global education dreams through expert guidance and structured execution.</p>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <div className="grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
              <div>
                <h2 style={{ marginBottom: '1rem' }}>Our Story</h2>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.7 }}>
                  Eagle Pathway was founded in 2019 by a group of educators and advisors who saw a gap in international scholarship guidance for Ethiopian students. Many bright students had the grades and ambitions but lacked the strategic knowledge to navigate complex application processes.
                </p>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.7 }}>
                  What started as small-group advising sessions in Addis Ababa has grown into a comprehensive service helping hundreds of students secure placements at top universities in Canada, the UK, Europe, and the US.
                </p>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                  Today, we combine local understanding of Ethiopian education with deep expertise in international admissions to deliver results that matter.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '100%',
                  maxWidth: '400px',
                  aspectRatio: '1',
                  background: 'linear-gradient(135deg, var(--surface-soft), var(--line))',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '5rem',
                }}>
                  🦅
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-soft">
          <div className="container">
            <div className="section-head">
              <h2>Our Values</h2>
              <p>The principles that guide everything we do.</p>
            </div>
            <div className="grid-3">
              {values.map((value) => (
                <article key={value.title} className="card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{value.icon}</div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Our Journey</h2>
              <p>Key milestones that shaped who we are today.</p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}>
              {milestones.map((milestone) => (
                <article key={milestone.year} className="card" style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--brand)',
                    marginBottom: '0.5rem',
                  }}>
                    {milestone.year}
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{milestone.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{milestone.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--surface-soft)' }}>
          <div className="container">
            <div className="cta-band">
              <div>
                <h2>Ready to start your journey?</h2>
                <p>Book a free consultation and get a clear pathway forward.</p>
              </div>
              <div className="cta-group">
                <Link href="/#contact" className="btn btn-primary">Book Consultation</Link>
                <Link href="/team" className="btn btn-outline">Meet Our Team</Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <div className="logo-group footer-brand">
              <div className="logo-icon">🦅</div>
              <span className="logo-text">Eagle Pathway</span>
            </div>
            <p>&copy; {new Date().getFullYear()} Eagle Pathway Ethiopia. Structured guidance for global study pathways.</p>
          </div>
        </footer>
      </div>
    </>
  );
}