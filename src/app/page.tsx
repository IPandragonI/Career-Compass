import { Clock, Compass, Lightbulb, ListChecks, Lock, Shuffle, Telescope } from "lucide-react";
import { Badge, Card, Container, Eyebrow } from "@/components/ui/primitives";
import { StartButtons } from "@/components/assessment/ResumeCta";
import { OCCUPATIONS } from "@/data/occupations";
import { SECTORS } from "@/data/sectors/sectors";

const BENEFITS = [
  {
    icon: Lightbulb,
    title: "Mieux comprendre ce qui vous motive",
    text: "Intérêts, cadre de travail, valeurs : distinguer ce que vous savez faire de ce que vous aimez faire.",
  },
  {
    icon: Telescope,
    title: "Découvrir des secteurs et des métiers adaptés à votre profil",
    text: "Y compris des métiers auxquels vous n’auriez pas pensé, loin de votre parcours actuel si vous le souhaitez.",
  },
  {
    icon: ListChecks,
    title: "Identifier des pistes concrètes pour votre avenir professionnel",
    text: "Formations, voies d’accès, points de vigilance et questions à se poser avant de s’engager.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-brand-soft/60 to-paper">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Eyebrow>Orientation professionnelle adaptative</Eyebrow>
            <h1 className="text-4xl font-bold text-brand-dark sm:text-5xl">Découvrez des métiers qui vous correspondent vraiment.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Un parcours personnalisé de moins de 30 minutes pour explorer vos intérêts, vos compétences et de nouvelles possibilités
              professionnelles.
            </p>
            <div className="mt-8">
              <StartButtons />
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Clock aria-hidden className="h-4 w-4 text-accent" />
                15 à 25 minutes pour la plupart des personnes
              </li>
              <li className="flex items-center gap-2">
                <Lock aria-hidden className="h-4 w-4 text-accent" />
                Sans inscription, données conservées sur votre appareil
              </li>
            </ul>
          </div>
          <Card className="bg-card/90">
            <p className="font-serif text-lg font-bold text-ink">Un outil d’exploration, pas un verdict</p>
            <p className="mt-2 text-sm text-muted">
              Career Compass n’est pas un test psychométrique validé et ne prédit pas votre satisfaction professionnelle. Il vous aide à
              formuler des hypothèses et à les vérifier, en vous disant toujours <em>pourquoi</em> une piste apparaît et ce qui reste
              incertain.
            </p>
            <p className="mt-4 text-sm text-muted">Il ne remplace pas un entretien avec un·e conseiller·ère en orientation.</p>
          </Card>
        </Container>
      </section>

      <Container className="py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">Ce que vous obtiendrez</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b) => (
            <li key={b.title}>
              <Card className="h-full">
                <b.icon aria-hidden className="h-6 w-6 text-accent" />
                <h3 className="mt-3 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted">{b.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="grid gap-6 pb-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Shuffle aria-hidden className="h-5 w-5 text-accent" />
            Comment fonctionne la personnalisation ?
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted marker:font-bold marker:text-brand">
            <li>Vous précisez votre point de départ : études, expérience, contraintes. Chaque réponse est facultative.</li>
            <li>
              Le questionnaire s’adapte : il choisit chaque question pour éclairer ce qui est encore flou, creuse vos préférences, levant
              les contradictions et s’arrête quand l’essentiel est couvert.
            </li>
            <li>
              Un calcul local compare votre profil à {OCCUPATIONS.length} fiches métiers, en tenant compte de ce que vous voulez éviter.
            </li>
            <li>Les résultats sont groupés en directions variées, avec les raisons, les réserves et les inconnues.</li>
          </ol>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Compass aria-hidden className="h-5 w-5 text-accent" />
            Aperçu de vos résultats
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-line bg-paper p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Piste à explorer</Badge>
                <Badge tone="accent">Nouvelle direction</Badge>
              </div>
              <p className="mt-2 font-semibold">Exemple de fiche métier</p>
              <p className="text-muted">
                Pourquoi cette piste : vos réponses sur le travail de terrain et les résultats concrets. À vérifier : horaires,
                déplacements, formation.
              </p>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>Votre profil : intérêts, cadre de travail, motivations, points de blocage</li>
              <li>3 à 5 directions professionnelles différentes</li>
              <li>8 à 12 métiers expliqués, et des « découvertes » inattendues</li>
              <li>Une vérification de la réalité et des prochaines étapes</li>
            </ul>
          </div>
        </Card>
      </Container>

      <Container className="py-8">
        <p className="text-sm text-muted">
          Jeu de données initial : {OCCUPATIONS.length} métiers dans {SECTORS.length} secteurs, rédigés à partir des repères des
          référentiels publics (ROME, Onisep, ESCO). Il n’est ni exhaustif ni mis à jour en continu — voir la page « Méthode et sources ».
        </p>
      </Container>
    </>
  );
}
