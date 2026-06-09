// =============================================================================
// app/layout.tsx
// Root layout — wrapper utama seluruh halaman
// Setup fonts (Manrope, Nunito, Source Code Pro) dari Google Fonts
// via next/font/google (recommended way di Next.js)
// =============================================================================

import type { Metadata } from "next";
import { Manrope, Nunito, Source_Code_Pro } from "next/font/google";
import "./globals.css";

// ===========================================================================
// FONT CONFIGURATION
// Load Google Fonts via next/font (optimized, no layout shift, self-hosted)
// Variable CSS custom properties supaya bisa dipakai di Tailwind
// ===========================================================================

// Manrope — untuk headlines, buttons, labels
const manrope = Manrope({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Nunito — untuk body text, paragraphs
const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Source Code Pro — untuk code blocks, ticket IDs
const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// ===========================================================================
// METADATA — Title dan description yang muncul di browser tab & SEO
// ===========================================================================
export const metadata: Metadata = {
  title: "Chatwoot Dashboard",
  description: "Dashboard reporting internal untuk monitoring ticket L1 Support",
};

// ===========================================================================
// ROOT LAYOUT — Wrapper HTML utama
// Font variables di-inject ke <html> supaya bisa diakses di seluruh app
// ===========================================================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${nunito.variable} ${sourceCodePro.variable}`}
    >
      <body className="bg-background text-stone-text font-body min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
