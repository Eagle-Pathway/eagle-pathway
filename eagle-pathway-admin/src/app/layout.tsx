import type { Metadata } from "next";
import "./globals.css";
import AiAssistantWidget from "@/components/chat/AiAssistantWidget";
import ErrorLoggerInit from "@/components/ErrorLoggerInit";

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.eaglespathway.com'),
  title: "Eagle Pathway Admin",
  description: "Admin portal for Eagle Pathway",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    apple: "/apple-icon.png?v=2",
    shortcut: "/favicon.ico?v=2",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Eagle Pathway Admin",
    description: "Admin portal for Eagle Pathway",
    url: "https://admin.eaglespathway.com",
    siteName: "Eagle Pathway",
    images: [
      {
        url: "/og.png?v=2",
        width: 1200,
        height: 630,
        alt: "Eagle Pathway",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eagle Pathway Admin",
    description: "Admin portal for Eagle Pathway",
    images: ["/og.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col">
        <ErrorLoggerInit />
        {children}
        <AiAssistantWidget />
      </body>
    </html>
  );
}
