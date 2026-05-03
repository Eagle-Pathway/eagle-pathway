'use client';

import Link from 'next/link';

export default function TestimonialsPage() {
  const testimonials = [
    { name: 'Samson T.', destination: 'University of British Columbia, Canada', text: 'The weekly tracking kept me accountable. I submitted my UK applications early and received my offer before the deadline rush.', initials: 'ST' },
    { name: 'Meron Y.', destination: 'University of Edinburgh, UK', text: 'Coming from a remote town in Ethiopia, I didn\'t think I had a chance at top European universities. Eagle Pathway\'s structured approach proved otherwise.', initials: 'MY' },
    { name: 'Dani L.', destination: 'University of Michigan, USA', text: 'The mock interviews were incredibly helpful. I felt confident walking into my actual interview and got accepted with a partial scholarship.', initials: 'DL' },
    { name: 'abel K.', destination: 'McGill University, Canada', text: 'From SAT prep to final submission, the team was with me every step. I got into my dream school!', initials: 'AK' },
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
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--white)', textAlign: 'center', marginBottom: '0.75rem' }}>Success Stories</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 500, margin: '0 auto 3rem' }}>Real stories from Ethiopian students who achieved their global education dreams.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '2rem', transition: 'all var(--transition)' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--black)' }}>{t.initials}</div>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1.25rem', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: 'var(--white)', fontWeight: 600 }}>{t.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{t.destination}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>Be Our Next Success Story</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Start your journey today and let us help you achieve your dreams.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link href="/contact" className="btn btn-primary">Get Started</Link>
              <Link href="/#pricing" className="btn btn-outline">View Plans</Link>
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