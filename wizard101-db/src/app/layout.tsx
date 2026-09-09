import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Spiral Codex - Base de donnees Wizard101",
  description:
    "Base de donnees et comparateur d'items non-officiel inspire de Wizard101. Recherche, fiches d'items, comparateur de statistiques et createur de build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-arcane-800/60 py-8 text-center text-sm text-arcane-400">
          Spiral Codex - projet fan-made non affilie a KingsIsle Entertainment. Prototype local.
        </footer>
      </body>
    </html>
  );
}
