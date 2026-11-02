import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: { default: "Career Compass — Découvrez des métiers qui vous correspondent", template: "%s · Career Compass" },
  description: "Un parcours personnalisé de moins de 30 minutes pour explorer vos intérêts, vos compétences et de nouvelles possibilités professionnelles.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="skip-link">Aller au contenu</a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
