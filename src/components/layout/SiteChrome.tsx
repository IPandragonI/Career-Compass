import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { NavMenu } from "./NavMenu";

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold text-brand-dark">
          <Compass aria-hidden className="h-6 w-6 text-accent" />
          Career Compass
        </Link>
        <NavMenu />
      </Container>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-line bg-card">
      <Container className="grid gap-6 py-10 text-sm text-muted sm:grid-cols-2">
        <div>
          <p className="font-serif text-lg font-bold text-ink">Career Compass</p>
          <p className="mt-2 max-w-md">
            Outil d’orientation exploratoire. Il ne remplace ni un test psychométrique validé, ni l’accompagnement d’un·e conseiller·ère en
            orientation.
          </p>
        </div>
        <div className="sm:text-right">
          <p>Vos réponses restent dans votre navigateur : aucun compte, aucun serveur.</p>
          <p className="mt-2">
            <Link href="/a-propos/" className="font-medium text-brand underline underline-offset-4">
              Méthode, sources et limites
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
