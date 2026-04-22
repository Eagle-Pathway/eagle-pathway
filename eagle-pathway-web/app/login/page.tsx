import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="card login-card">
        <div className="badge">Portal Access</div>
        <h1 style={{ margin: "0.9rem 0 0.6rem" }}>Login to Eagle Pathway Portal</h1>
        <p style={{ marginBottom: "1.2rem" }}>
          Login is handled in the dedicated portal app.
        </p>
        <div className="cta-group" style={{ justifyContent: "center", marginTop: 0 }}>
          <Link href="/" className="btn btn-primary">
            Go to Home
          </Link>
          <Link href="/" className="btn btn-outline">
            Learn More
          </Link>
        </div>
        <p className="mini-note">Need account support? Contact Eagle Pathway operations team.</p>
      </section>
    </main>
  );
}
