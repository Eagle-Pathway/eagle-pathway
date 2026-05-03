import Link from "next/link";

export default function LoginPage() {
  return (
    <main
      className="login-card"
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <div className="badge">Client Portal</div>

      <h1 style={{ marginTop: "10px" }}>
        Yayy 😊! <br />
        Cool Portal Coming Soon
      </h1>

      <div
        className="cta-group"
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" className="btn btn-primary">
          Return to homepage
        </Link>

        <Link href="/" className="btn btn-outline">
          Explore services
        </Link>
      </div>
    </main>
  );
}