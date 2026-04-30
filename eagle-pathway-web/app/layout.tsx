import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import AiAssistantWidget from "./components/AiAssistantWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

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
      <body className={`${inter.variable} ${outfit.variable}`}>
        {children}
        <AiAssistantWidget />
      </body>
    </html>
  );
}
