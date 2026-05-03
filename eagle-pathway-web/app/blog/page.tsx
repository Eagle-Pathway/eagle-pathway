'use client';

import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    { id: 1, title: 'Complete Guide to Canadian Scholarships for Ethiopian Students 2024', excerpt: 'A comprehensive breakdown of scholarships available to Ethiopian students seeking to study in Canada.', date: 'December 15, 2024', category: 'Scholarship Guide', icon: '🍁' },
    { id: 2, title: 'SAT vs IELTS: Which Test Do You Need?', excerpt: 'Understanding the differences between SAT and IELTS requirements for international university applications.', date: 'December 10, 2024', category: 'Test Prep', icon: '📝' },
    { id: 3, title: 'How to Write a Compelling Statement of Purpose', excerpt: 'Your SOP can make or break your application. Learn the structure and strategies that admissions committees look for.', date: 'December 5, 2024', category: 'Application Tips', icon: '✍️' },
    { id: 4, title: 'UK vs US Universities: Key Differences', excerpt: 'Comparing academic structure, costs, and application processes for UK and US universities.', date: 'November 28, 2024', category: 'Guides', icon: '🌍' },
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
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--white)', textAlign: 'center', marginBottom: '0.75rem' }}>Blog & Resources</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 500, margin: '0 auto 3rem' }}>Insights, guides, and tips for your international education journey.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
            {posts.map((post) => (
              <article key={post.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', transition: 'all var(--transition)' }}>
                <span style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}>{post.icon}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold)', background: 'rgba(201,168,76,0.15)', padding: '0.25rem 0.5rem', borderRadius: 4 }}>{post.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{post.date}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{post.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '1rem' }}>{post.excerpt}</p>
                <Link href="#" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}>Read More →</Link>
              </article>
            ))}
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: 'var(--white)', marginBottom: '0.5rem' }}>Need Personalized Guidance?</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Our team can help you navigate the entire process.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link href="/contact" className="btn btn-primary">Talk to an Advisor</Link>
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