import Link from "next/link";

export default function Home() {
  return (
    <div className="page-layout">
      {/* ─── NAVIGATION ────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-grid">
            <div className="logo-group">
              <div className="logo-icon">🦅</div>
              <span className="logo-text">Eagle <span className="text-blue">Pathway</span></span>
            </div>
            <ul className="nav-links">
              <li><a href="#services">Services</a></li>
              <li><a href="#pathway">Pathway</a></li>
              <li><a href="#testimonials">Success</a></li>
            </ul>
            <div className="nav-cta">
              <Link href="/login" className="btn btn-outline" style={{ padding: '0.6rem 1.5rem' }}>Portal Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
        <section className="hero-section">
          <div className="container">
            <span className="badge">Ethiopia's Premier Education Bridge</span>
            <h1 className="hero-title">
              Unlock Your <span className="gradient-text">Global Scholar</span> <br />
              Potential Today
            </h1>
            <p className="hero-subtitle">
              Expert guidance for international scholarships and premium tutoring services 
              tailored for the ambitious Ethiopian student. We don't just apply—we succeed.
            </p>
            <div className="cta-group">
              <a href="#" className="btn btn-primary">Begin Your Journey</a>
              <a href="#" className="btn btn-outline">Explore Scholarships</a>
            </div>
            
            <div className="hero-meta container" style={{ marginTop: '4rem', maxWidth: '800px' }}>
              <div className="grid-3" style={{ gap: '1rem' }}>
                <div className="meta-item">
                  <strong>94%</strong>
                  <span>Admission Success</span>
                </div>
                <div className="meta-item">
                  <strong>500+</strong>
                  <span>Global Placements</span>
                </div>
                <div className="meta-item">
                  <strong>$12M+</strong>
                  <span>Scholarship Funding</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SERVICES ───────────────────────────────────────────────────────── */}
        <section id="services" className="services-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">End-to-End Academic Solutions</h2>
              <p className="section-subtitle">A comprehensive ecosystem built to bridge the gap between brilliance and opportunity.</p>
            </div>
            
            <div className="grid-2">
              <div className="card">
                <span style={{ fontSize: '3.5rem', marginBottom: '1.5rem', display: 'block' }}>📖</span>
                <h3>Elite Tutoring</h3>
                <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                  Personalized KG-12 academic support and specialized SAT/IELTS prep 
                  from Ethiopia's top-performing tutors.
                </p>
                <a href="#" className="btn btn-primary">Find Your Tutor</a>
              </div>

              <div className="card">
                <span style={{ fontSize: '3.5rem', marginBottom: '1.5rem', display: 'block' }}>🌍</span>
                <h3>Scholarship Mastery</h3>
                <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                  Data-driven university shortlisting, professional SOP drafting, and MoE 
                  document authentication support.
                </p>
                <a href="#" className="btn btn-outline">Start Application</a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PATHWAY ───────────────────────────────────────────────────────── */}
        <section id="pathway" className="pathway-section" style={{ background: 'var(--gray-50)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">The Eagle Pathway</h2>
              <p className="section-subtitle">O ur proven 3-step framework for international success.</p>
            </div>

            <div className="grid-3">
              <div className="pathway-item">
                <div className="step-num">01</div>
                <h4>Assessment</h4>
                <p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Strategic profile analysis to align your goals with global funding opportunities.</p>
              </div>
              <div className="pathway-item">
                <div className="step-num">02</div>
                <h4>Preparation</h4>
                <p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Intensive tutoring and standardized test mastery to make your application undeniable.</p>
              </div>
              <div className="pathway-item">
                <div className="step-num">03</div>
                <h4>Placement</h4>
                <p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Expert handling of document verification, scholarship submission, and visa processing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <section id="testimonials" className="testi-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Verified Student Success</h2>
              <p className="section-subtitle">Real results from the most ambitious students in the country.</p>
            </div>

            <div className="grid-2">
              <div className="card" style={{ background: 'var(--gray-50)', border: 'none' }}>
                <p className="testi-quote">
                  "The application process felt impossible until I joined Eagle Pathway. 
                  Their help with the MoE authentication tracker was a game-changer."
                </p>
                <div style={{ marginTop: '2rem', fontWeight: '800' }}>Abel Tadesse — McGill University Scholar</div>
              </div>
              <div className="card" style={{ background: 'var(--gray-50)', border: 'none' }}>
                <p className="testi-quote">
                  "Professional tutoring at its best. My SAT score improved by 210 points 
                  after just eight weeks of intensive coaching."
                </p>
                <div style={{ marginTop: '2rem', fontWeight: '800' }}>Selam G. — University of Manchester</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="logo-group" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="logo-icon" style={{ background: 'var(--gray-400)' }}>🦅</div>
            <span className="logo-text" style={{ color: 'var(--gray-600)' }}>Eagle Pathway</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Eagle Pathway Ethiopia. Secure Your Future Abroad.</p>
        </div>
      </footer>
    </div>
  );
}
