'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    gradeLevel: '',
    targetCountry: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          service: '',
          gradeLevel: '',
          targetCountry: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--white)', textAlign: 'center', marginBottom: '0.75rem' }}>Contact Us</h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 500, margin: '0 auto 3rem' }}>Ready to start your scholarship journey? Get in touch for a free consultation.</p>

          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {submitStatus === 'success' && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', color: '#22c55e' }}>
                Thank you for reaching out! We'll be in touch within 24 hours to schedule your free consultation.
              </div>
            )}

            {submitStatus === 'error' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', color: '#ef4444' }}>
                Something went wrong. Please try again or contact us directly.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Service Interested In *</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                >
                  <option value="">Select a service</option>
                  <option value="tutoring">Tutoring (Academic/Exam Prep)</option>
                  <option value="scholarship">Scholarship Advisory</option>
                  <option value="both">Both Tutoring & Scholarship</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Current Grade/Year</label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  >
                    <option value="">Select status</option>
                    <option value="high-school">High School Student</option>
                    <option value="university">University Student</option>
                    <option value="bsc-completed">BSc Completed</option>
                    <option value="msc-completed">MSc Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Target Destination</label>
                  <select
                    name="targetCountry"
                    value={formData.targetCountry}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem' }}
                  >
                    <option value="">Select country</option>
                    <option value="canada">Canada</option>
                    <option value="uk">United Kingdom</option>
                    <option value="usa">United States</option>
                    <option value="europe">Europe</option>
                    <option value="australia">Australia</option>
                    <option value="undecided">Not Sure Yet</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your goals and any questions you have..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--white)', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem' }}
              >
                {isSubmitting ? 'Sending...' : 'Request Free Consultation'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>Or reach us directly:</p>
              <p style={{ lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--gold)' }}>Phone:</strong> +251 32 508 910<br />
                <strong style={{ color: 'var(--gold)' }}>Email:</strong> info@eaglepathway.com<br />
                <strong style={{ color: 'var(--gold)' }}>Location:</strong> Addis Ababa, Ethiopia
              </p>
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