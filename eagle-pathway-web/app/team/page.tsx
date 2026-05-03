'use client';

import Link from 'next/link';

export default function TeamPage() {
  const team = [
    { name: 'Tegegn T.', role: 'Founder & Lead Advisor', initials: 'TT', bio: 'Master in Economic Policy and Data Analytics from University of Verona in Italy. 5+ years in international admissions consulting.' },
    { name: 'Amanuel A.', role: 'Executive Director', initials: 'AA', bio: 'BA in Economics from Addis Ababa University.' },
    { name: 'Genene T.', role: 'Head of Education Technology', initials: 'GT', bio: 'Software Engineer with experience in IT. Expert in SAT/IELTS preparation and STEM subjects.' },
  ];

  const advisors = [
    { name: 'Prof. James W.', role: 'Board Advisor', university: 'University of Cambridge', initials: 'JW' },
    { name: 'Dr. Olivia S.', role: 'Board Advisor', university: 'University of Toronto', initials: 'OS' },
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
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--white)', textAlign: 'center', marginBottom: '0.75rem' }}>Meet Our Team</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 500, margin: '0 auto 3rem' }}>Expert advisors and tutors dedicated to helping Ethiopian students achieve their global education dreams.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
            {team.map((member, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', transition: 'all var(--transition)' }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--black)' }}>{member.initials}</div>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.25rem' }}>{member.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 500, marginBottom: '0.75rem' }}>{member.role}</div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{member.bio}</p>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 700, margin: '0 auto 4rem', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.75rem', color: 'var(--white)', marginBottom: '0.5rem' }}>Board Advisors</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>External experts who provide strategic guidance.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', maxWidth: 600, margin: '0 auto' }}>
              {advisors.map((advisor, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontFamily: 'var(--font-syne)', fontWeight: 800, color: 'var(--black)' }}>{advisor.initials}</div>
                  <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.25rem' }}>{advisor.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>{advisor.role}</div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{advisor.university}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>Ready to work with us?</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Book a free consultation and meet your advisor.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link href="/contact" className="btn btn-primary">Book Consultation</Link>
              <Link href="/testimonials" className="btn btn-outline">Success Stories</Link>
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