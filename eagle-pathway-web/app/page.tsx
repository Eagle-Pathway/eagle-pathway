import Link from "next/link";

export default function Home() {
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
              <li><a href="#services">Services</a></li>
              <li><a href="#pathway">Pathway</a></li>
              <li><a href="#testimonials">Success</a></li>
            </ul>
            <div className="nav-cta">
              <Link href="/login" className="btn btn-outline">Portal Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero section">
          <div className="container">
            <div className="hero-grid">
              <div>
                <span className="badge">Ethiopia's fastest scholarship pathway</span>
                <h1>
                  Launch your
                  {" "}
                  <span className="gradient-text">global education future</span>
                  {" "}
                  with confidence
                </h1>
                <p>
                  Eagle Pathway combines elite tutoring, application strategy, and end-to-end
                  scholarship execution so ambitious students can secure admission and funding.
                </p>
                <div className="cta-group">
                  <a href="#services" className="btn btn-primary">Start your plan</a>
                  <a href="#pathway" className="btn btn-outline">See the process</a>
                </div>
              </div>

              <aside className="hero-panel">
                <h3>Impact Snapshot</h3>
                <p>Performance indicators from our student and admissions pipeline.</p>
                <div className="metric-grid">
                  <div className="metric">
                    <strong>94%</strong>
                    <span>Admission success</span>
                  </div>
                  <div className="metric">
                    <strong>500+</strong>
                    <span>Global placements</span>
                  </div>
                  <div className="metric">
                    <strong>$12M+</strong>
                    <span>Scholarship value</span>
                  </div>
                </div>
                <div className="mini-note">Trusted by students targeting Canada, UK, EU, and the US.</div>
              </aside>
            </div>
          </div>
        </section>

        <section id="services" className="section">
          <div className="container">
            <div className="section-head">
              <h2>End-to-end academic execution</h2>
              <p>A complete ecosystem for scholarship wins and academic excellence.</p>
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="icon-chip">📖</div>
                <h3>Elite Tutoring</h3>
                <p>
                  Personalized KG-12 support with SAT/IELTS preparation from top-performing
                  from Ethiopia's top-performing tutors.
                </p>
                <a href="#testimonials" className="btn btn-primary">Find your tutor</a>
              </div>

              <div className="card">
                <div className="icon-chip">🌍</div>
                <h3>Scholarship Mastery</h3>
                <p>
                  Data-driven university shortlisting, professional SOP drafting, and MoE
                  document authentication support.
                </p>
                <a href="#pathway" className="btn btn-outline">Start application</a>
              </div>
            </div>
          </div>
        </section>

        <section id="pathway" className="section">
          <div className="container">
            <div className="section-head">
              <h2>The Eagle Pathway</h2>
              <p>Our proven 3-step framework for international outcomes.</p>
            </div>

            <div className="grid-3">
              <div className="card pathway-item">
                <div className="step-num">01</div>
                <h4>Assessment</h4>
                <p>Strategic profile analysis to align your strengths with global funding opportunities.</p>
              </div>
              <div className="card pathway-item">
                <div className="step-num">02</div>
                <h4>Preparation</h4>
                <p>Intensive tutoring and test mastery to make your application stand out.</p>
              </div>
              <div className="card pathway-item">
                <div className="step-num">03</div>
                <h4>Placement</h4>
                <p>Expert support for document verification, submission workflows, and visa readiness.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="section">
          <div className="container">
            <div className="section-head">
              <h2>Verified student success</h2>
              <p>Real outcomes from ambitious students across Ethiopia.</p>
            </div>

            <div className="grid-2">
              <div className="card">
                <p className="testimonial-quote">
                  "The application process felt impossible until I joined Eagle Pathway. 
                  Their help with the MoE authentication tracker was a game-changer."
                </p>
                <div className="testimonial-author">Abel Tadesse - McGill University Scholar</div>
              </div>
              <div className="card">
                <p className="testimonial-quote">
                  "Professional tutoring at its best. My SAT score improved by 210 points 
                  after just eight weeks of intensive coaching."
                </p>
                <div className="testimonial-author">Selam G. - University of Manchester</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="logo-group" style={{ justifyContent: "center", marginBottom: "0.8rem" }}>
            <div className="logo-icon">🦅</div>
            <span className="logo-text">Eagle Pathway</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Eagle Pathway Ethiopia. Secure your future abroad.</p>
        </div>
      </footer>
    </div>
  );
}
