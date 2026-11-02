import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SOURCES, DATASET_VERSION } from "@/data/sources";
import { OCCUPATIONS } from "@/data/occupations";
import { SECTORS } from "@/data/sectors/sectors";
import { DEFAULT_WEIGHTS, DIMENSION_LABELS } from "@/lib/assessment/scoring";
import { Card, Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Méthode, sources et limites" };

export default function AProposPage() {
  return (
    <Container narrow className="space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Méthode, sources et limites</h1>
        <p className="mt-3 text-muted">Career Compass est un outil d’exploration. Cette page explique comment il fonctionne et ce qu’il ne sait pas faire.</p>
      </div>

      <Card as="section"><h2 className="text-xl font-bold">Ce que l’outil n’est pas</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li>Ce n’est pas un test psychométrique validé : aucune validation scientifique n’a été réalisée.</li>
          <li>Il n’attribue pas de « type de personnalité » et ne prédit pas votre satisfaction ou votre réussite.</li>
          <li>Il ne remplace pas l’échange avec un·e conseiller·ère en orientation.</li>
          <li>Les niveaux d’adéquation affichés sont des estimations internes, calculées localement ; ils servent à classer des pistes, pas à mesurer une probabilité.</li>
        </ul>
      </Card>

      <Card as="section"><h2 className="text-xl font-bold">Comment les pistes sont calculées</h2>
        <p className="mt-2 text-sm text-muted">Chaque métier reçoit six scores séparés, combinés avec des pondérations configurables. Ces poids initiaux sont des choix d’ingénierie, non validés :</p>
        <ul className="mt-3 space-y-1 text-sm">{(Object.keys(DEFAULT_WEIGHTS) as (keyof typeof DEFAULT_WEIGHTS)[]).map((k) => <li key={k} className="flex justify-between border-b border-line py-1"><span>{DIMENSION_LABELS[k]}</span><span className="font-semibold">{Math.round(DEFAULT_WEIGHTS[k] * 100)} %</span></li>)}</ul>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">
          <li>Un manque d’information ramène le score vers la neutralité plutôt que de l’inventer.</li>
          <li>L’aptitude (compétences démontrées ou déclarées) est séparée de l’intérêt, et l’accessibilité ne peut pas, à elle seule, faire monter un métier.</li>
          <li>Les points de blocage forts écartent les métiers dont la contrainte est connue ; si elle est inconnue, une mention « à vérifier » est affichée.</li>
          <li>La sélection finale est diversifiée : plusieurs familles de métiers, suppression des quasi-doublons, et classement selon la proximité avec votre parcours sans jamais favoriser automatiquement le proche.</li>
          <li>Le questionnaire est adaptatif et déterministe : chaque question est choisie selon ce qu’elle apprendrait sur les dimensions encore peu documentées.</li>
        </ul>
      </Card>

      <Card as="section"><h2 className="text-xl font-bold">Les données</h2>
        <p className="mt-2 text-sm">Version du jeu de données : <strong>{DATASET_VERSION}</strong> · {OCCUPATIONS.length} métiers · {SECTORS.length} secteurs.</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li><strong>Classification vérifiée</strong> : seul le rattachement à un domaine ROME (lettre) est un repère issu d’un référentiel public ; il reste à confirmer métier par métier.</li>
          <li><strong>Descriptions éditoriales</strong> : écrites pour ce projet, non copiées d’un site.</li>
          <li><strong>Conditions de travail et durées de formation</strong> : estimations à vérifier. Une valeur inconnue n’est jamais assimilée à zéro.</li>
          <li>Aucune statistique d’emploi en temps réel, aucun salaire chiffré, aucune offre d’emploi ne sont fabriqués.</li>
          <li>Le jeu n’est ni exhaustif ni mis à jour en continu ; aucune date de vérification fiche par fiche n’est encore renseignée.</li>
        </ul>
      </Card>

      <Card as="section"><h2 className="text-xl font-bold">Sources de référence</h2>
        <ul className="mt-3 space-y-4 text-sm">{SOURCES.map((s) => (
          <li key={s.id}>
            <p className="font-semibold">{s.name}</p>
            <p className="text-muted">Version : {s.version} · Récupération : {s.retrievedAt ?? "non effectuée (aucun import automatique)"}</p>
            <p className="text-muted">Licence : {s.licence}</p>
            <p className="text-muted">Champs concernés : {s.derivedFields.join(", ")}.</p>
            <p>{s.note}</p>
            {s.url.startsWith("http") && <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand underline underline-offset-4">Consulter la source<ArrowUpRight aria-hidden className="h-3.5 w-3.5" /></a>}
          </li>))}</ul>
      </Card>

      <Card as="section"><h2 className="text-xl font-bold">Vie privée</h2>
        <p className="mt-2 text-sm">Vos réponses, résultats et favoris sont enregistrés uniquement dans le stockage local de votre navigateur. Aucun compte, aucun nom, aucune adresse e-mail, aucun serveur. Vous pouvez tout effacer depuis la page « Mon bilan » ou « Mes résultats ».</p>
      </Card>
    </Container>
  );
}
