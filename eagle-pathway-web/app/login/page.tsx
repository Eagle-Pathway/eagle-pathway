import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="card login-card">
        <div className="badge">Client Portal</div>
        <h1 style={{ margin: "0.85rem 0 0.55rem" }}>Portal login</h1>
        <p style={{ marginBottom: "1rem" }}>
          Secure login is currently managed in the dedicated portal application.
        </p>
        <div className="cta-group" style={{ marginTop: 0 }}>
          <Link href="/" className="btn btn-primary">
            Return to homepage
          </Link>
          <Link href="/" className="btn btn-outline">
            Explore services
          </Link>
        </div>
        <p className="mini-note">Need access help? Contact Eagle Pathway operations support.</p>
      </section>
    </main>
  );
}
