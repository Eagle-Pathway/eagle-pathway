import Link from 'next/link';

export const metadata = {
  title: 'Testimonials | Eagle Pathway',
  description: 'Read success stories from Ethiopian students who secured scholarships with Eagle Pathway.',
};

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: 'Samuel T.',
      destination: 'University of British Columbia, Canada',
      text: 'Eagle Pathway helped me identify scholarships I never knew existed. Their guidance on my SOP was invaluable—I went from rejection to a full scholarship offer within 3 months.',
      year: 'Computer Science, 2024',
    },
    {
      name: 'Mekdes A.',
      destination: 'University of Edinburgh, UK',
      text: 'The weekly tracking kept me accountable. I submitted my UK applications early and received my offer before the deadline rush. The SOP review turned my story into something compelling.',
      year: 'Medicine, 2024',
    },
    {
      name: 'Dagmawi B.',
      destination: 'TU Delft, Netherlands',
      text: 'Coming from a remote town in Ethiopia, I didn\'t think I had a chance at top European universities. Eagle Pathway\'s structured approach proved otherwise.',
      year: 'Engineering, 2023',
    },
    {
      name: 'Hirut K.',
      destination: 'University of Michigan, USA',
      text: 'The test prep support was game-changing. My SAT improved by 200 points, and the application strategy opened doors I didn\'t think were possible.',
      year: 'Business, 2024',
    },
    {
      name: 'Bereket S.',
      destination: 'ETH Zurich, Switzerland',
      text: 'The document coordination was incredible. They caught errors I would have missed and ensured everything was perfectly aligned with each university\'s requirements.',
      year: 'Physics, 2023',
    },
    {
      name: 'Selam M.',
      destination: 'McGill University, Canada',
      text: 'As a first-generation applicant, the process was overwhelming. Eagle Pathway made it manageable and even enjoyable. Now I\'m helping others in my village.',
      year: 'Nursing, 2024',
    },
    {
      name: 'Tadesse F.',
      destination: 'University of Oxford, UK',
      text: 'The interview preparation was exceptional. Mock interviews with advisors who understood what UK universities look for made all the difference.',
      year: 'Philosophy & Economics, 2023',
    },
    {
      name: 'Frehiwot Y.',
      destination: 'University of Amsterdam, Netherlands',
      text: 'From profile assessment to enrollment, every step was clearly explained. The transparent pricing and milestone-based approach gave me confidence.',
      year: 'Data Science, 2024',
    },
  ];

  const stats = [
    { value: '94%', label: 'Admission Success Rate' },
    { value: '500+', label: 'Students Placed' },
    { value: '$12M+', label: 'Scholarship Value' },
    { value: '15+', label: 'Countries Reached' },
  ];

  return (
    <>
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
            <h1>Success Stories</h1>
            <p>Real results from Ethiopian students who achieved their global education dreams with Eagle Pathway.</p>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <div className="grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '0.25rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft">
          <div className="container">
            <div className="section-head">
              <h2>Student Voices</h2>
              <p>What our students say about working with us.</p>
            </div>
            <div className="testimonial-list">
              {testimonials.map((testimonial) => (
                <article key={testimonial.name} className="testimonial-card">
                  <p className="testimonial-text">{testimonial.text}</p>
                  <div className="testimonial-author-info">
                    <div className="testimonial-avatar">{testimonial.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div className="testimonial-name">{testimonial.name}</div>
                      <div className="testimonial-dest">{testimonial.destination} • {testimonial.year}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2>Be Our Next Success Story</h2>
                <p>Book a free consultation and start your journey today.</p>
              </div>
              <div className="cta-group">
                <Link href="/contact" className="btn btn-primary">Book Consultation</Link>
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