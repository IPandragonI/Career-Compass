import { ButtonLink, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container narrow className="py-20 text-center">
      <h1 className="text-3xl font-bold">Page introuvable</h1>
      <p className="mt-3 text-muted">Cette page n’existe pas ou a été déplacée.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/">Retour à l’accueil</ButtonLink><ButtonLink href="/metiers/" variant="secondary">Explorer les métiers</ButtonLink></div>
    </Container>
  );
}
