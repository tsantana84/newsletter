import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inference — AI-powered Software Engineering & Management",
  description:
    "A twice-weekly newsletter for engineers and tech leads on leveraging AI to ship better software, faster.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Inference",
    description:
      "How engineers and engineering leaders leverage AI to ship better software, faster.",
    type: "website",
    images: [
      {
        url: "/api/og?title=Inference&category=AI&readingTime=Twice%20weekly",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inference",
    description:
      "How engineers and engineering leaders leverage AI to ship better software, faster.",
    images: [
      "/api/og?title=Inference&category=AI&readingTime=Twice%20weekly",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
