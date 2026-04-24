import Link from 'next/link';
import Head from 'next/head';

export const metadata = {
  title: 'Blog | Eagle Pathway',
  description: 'Resources and guides for Ethiopian students seeking international scholarships and education.',
};

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: 'Complete Guide to Canadian Scholarships for Ethiopian Students 2024',
      excerpt: 'A comprehensive breakdown of scholarships available to Ethiopian students seeking to study in Canada, including deadlines, requirements, and application tips.',
      date: 'December 15, 2024',
      category: 'Scholarship Guide',
      icon: '🍁',
    },
    {
      id: 2,
      title: 'SAT vs IELTS: Which Test Do You Need?',
      excerpt: 'Understanding the differences between SAT and IELTS requirements for international university applications and how to choose the right path.',
      date: 'December 10, 2024',
      category: 'Test Prep',
      icon: '📝',
    },
    {
      id: 3,
      title: 'How to Write a Compelling Statement of Purpose',
      excerpt: 'Your SOP can make or break your application. Learn the structure and strategies that admissions committees look for.',
      date: 'December 5, 2024',
      category: 'Application Tips',
      icon: '✍️',
    },
    {
      id: 4,
      title: 'UK vs US Universities: Key Differences',
      excerpt: 'Comparing academic structure, costs, and application processes for UK and US universities.',
      date: 'November 28, 2024',
      category: 'Guides',
      icon: '🏛️',
    },
    {
      id: 5,
      title: 'Financial Aid for International Students',
      excerpt: 'Understanding scholarship types, need-based aid, and how to maximize your financial support package.',
      date: 'November 20, 2024',
      category: 'Finance',
      icon: '💰',
    },
    {
      id: 6,
      title: 'Timeline for Scholarship Applications',
      excerpt: 'A month-by-month guide to staying on track with your scholarship and university applications.',
      date: 'November 15, 2024',
      category: 'Planning',
      icon: '📅',
    },
  ];

  const categories = [
    { name: 'All', count: posts.length },
    { name: 'Scholarship Guide', count: posts.filter(p => p.category === 'Scholarship Guide').length },
    { name: 'Test Prep', count: posts.filter(p => p.category === 'Test Prep').length },
    { name: 'Application Tips', count: posts.filter(p => p.category === 'Application Tips').length },
    { name: 'Guides', count: posts.filter(p => p.category === 'Guides').length },
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
            <h1>Blog & Resources</h1>
            <p>Guides, tips, and insights to help you navigate your international education journey.</p>
          </div>
        </header>

        <section className="section">
          <div className="container">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className={`btn ${cat.name === 'All' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            <div className="blog-grid">
              {posts.map((post) => (
                <article key={post.id} className="blog-card">
                  <div className="blog-image">{post.icon}</div>
                  <div className="blog-content">
                    <div className="blog-date">{post.date} • {post.category}</div>
                    <h3 className="blog-title">{post.title}</h3>
                    <p className="blog-excerpt">{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2>Need Personalized Guidance?</h2>
                <p>Book a free consultation for tailored advice on your scholarship journey.</p>
              </div>
              <div className="cta-group">
                <Link href="/contact" className="btn btn-primary">Book Consultation</Link>
                <Link href="/testimonials" className="btn btn-outline">Success Stories</Link>
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