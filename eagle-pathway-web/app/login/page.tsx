import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="page-layout" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: "560px", textAlign: "center" }}>
        <h1 style={{ marginBottom: "0.75rem" }}>Portal Login</h1>
        <p style={{ color: "var(--gray-600)", marginBottom: "1.5rem" }}>
          Login is handled in the dedicated portal app.
        </p>
        <div className="cta-group" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-outline">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
