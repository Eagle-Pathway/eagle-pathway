import Link from 'next/link';

export const metadata = {
  title: 'Our Team | Eagle Pathway',
  description: 'Meet the expert advisors and tutors at Eagle Pathway who help Ethiopian students achieve their dreams of studying abroad.',
};

export default function TeamPage() {
  const team = [
    {
      name: 'Tegegn T.',
      role: 'Founder & Lead Advisor',
      initials: 'AT',
      bio: 'Master in Economic Policy and Data Analytics from University of Verona in Italy. 5+ years in international admissions consulting.',
    },
    {
      name: 'Amanuel A.',
      role: 'Executive Director',
      initials: 'AA',
      bio: 'BA in Economics from Addis Ababa University.',
    },
    {
      name: 'Genene T.',
      role: 'Head of Education Technology',
      initials: 'GT',
      bio: 'Software Engineer with experience in IT. Expert in SAT/IELTS preparation and STEM subjects.',
    },
  ];

  const advisors = [
    {
      name: 'Prof. James W.',
      role: 'Board Advisor',
      university: 'University of Cambridge',
      initials: 'JW',
    },
    {
      name: 'Dr. Olivia S.',
      role: 'Board Advisor',
      university: 'University of Toronto',
      initials: 'OS',
    },
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
            <h1>Meet Our Team</h1>
            <p>Expert advisors and tutors dedicated to helping Ethiopian students achieve their global education dreams.</p>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Core Team</h2>
              <p>The people behind your success.</p>
            </div>
            <div className="team-grid">
              {team.map((member) => (
                <article key={member.name} className="team-card">
                  <div className="team-avatar">{member.initials}</div>
                  <h3>{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                  <p className="team-bio">{member.bio}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft">
          <div className="container">
            <div className="section-head">
              <h2>Board Advisors</h2>
              <p>External experts who provide strategic guidance.</p>
            </div>
            <div className="team-grid" style={{ maxWidth: '700px', margin: '0 auto' }}>
              {advisors.map((advisor) => (
                <article key={advisor.name} className="team-card">
                  <div className="team-avatar">{advisor.initials}</div>
                  <h3>{advisor.name}</h3>
                  <div className="team-role">{advisor.role}</div>
                  <p className="team-bio">{advisor.university}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2>Ready to work with us?</h2>
                <p>Book a free consultation and meet your advisor.</p>
              </div>
              <div className="cta-group">
                <Link href="/contact" className="btn btn-primary">Book Consultation</Link>
                <Link href="/testimonials" className="btn btn-outline">See Testimonials</Link>
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