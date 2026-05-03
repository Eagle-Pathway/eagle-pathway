import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eagle Pathway | Ethiopia's Premier Education & Scholarship Consultancy",
  description: "From Classroom to International Scholarship. We provide expert tutoring and scholarship guidance to help Ethiopian students secure their future abroad.",
  keywords: ["Scholarship Ethiopia", "Tutoring Addis Ababa", "International Education", "Eagle Pathway", "Study Abroad"],
  openGraph: {
    title: "Eagle Pathway - Secure Your Future Abroad",
    description: "Expert guidance for international scholarships and premium tutoring services.",
    type: "website",
    locale: "en_US",
    url: "https://eagle-pathway.com",
    siteName: "Eagle Pathway",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}