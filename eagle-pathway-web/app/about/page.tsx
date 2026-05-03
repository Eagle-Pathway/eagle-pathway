'use client';

import Link from 'next/link';

export default function AboutPage() {
  const values = [
    { icon: '📈', title: 'Data-Driven', description: 'We track outcomes and continuously improve our methods based on what works.' },
    { icon: '🤝', title: 'Partnership', description: 'We work alongside families as partners, not just consultants.' },
    { icon: '🌍', title: 'Global Vision', description: 'Deep knowledge of international admissions combined with local context.' },
  ];

  const milestones = [
    { year: '2023', title: 'Foundation', description: 'Started with a handful of students in Addis Ababa' },
    { year: '2024', title: 'Remote Expansion', description: 'Launched virtual tutoring and advisory sessions' },
    { year: '2025', title: 'Full Service Launch', description: 'Expanded to end-to-end application support' },
    { year: '2026', title: 'Scholarship Milestone', description: 'Crossed $100K in total scholarship value secured' },
  ];

  return (
    <div className="page-layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-grid">
            <Link href="/" className="logo-group">
              <div className="logo-icon">🦅</div>
              <span className="logo-text">Eagle Pathway</span>
            </Link>
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
            <div className="nav-cta">
              <Link href="/login" className="btn btn-outline">Client Portal</Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ padding: 'calc(var(--nav-height) + 3rem) 0 4rem', minHeight: '100vh' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--white)', textAlign: 'center', marginBottom: '0.75rem' }}>About Eagle Pathway</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 500, margin: '0 auto 3rem' }}>Helping Ethiopian students achieve their global education dreams since 2023.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
            {values.map((v, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', transition: 'all var(--transition)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{v.icon}</span>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.5rem' }}>{v.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>{v.description}</p>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.75rem', color: 'var(--white)', textAlign: 'center', marginBottom: '2rem' }}>Our Journey</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', padding: '1.25rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)', minWidth: 60 }}>{m.year}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.25rem' }}>{m.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <Link href="/" className="logo-group" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div className="logo-icon">🦅</div>
            <span className="logo-text">Eagle Pathway</span>
          </Link>
          <p>© {new Date().getFullYear()} Eagle Pathway Ethiopia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}