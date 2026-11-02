import type { SourceDef } from "@/types/occupation";

/**
 * Sources de référence. IMPORTANT : le jeu de données est une rédaction éditoriale qui
 * s’appuie sur la structure de ces référentiels ; il n’en est PAS un import automatique.
 * Aucune version ni date de téléchargement n’a été vérifiée pour les fiches individuelles :
 * ces champs sont donc explicitement marqués « non vérifié ».
 */
export const SOURCES: SourceDef[] = [
  {
    id: "rome",
    name: "ROME (Répertoire opérationnel des métiers et des emplois) — France Travail",
    url: "https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome",
    version: "ROME 4.0 (version exacte non vérifiée pour ce jeu de données)",
    retrievedAt: null,
    licence: "Données ouvertes France Travail : attribution et mention de la date de mise à jour requises (conditions à vérifier sur data.gouv.fr).",
    derivedFields: ["domaine ROME (lettre A à N, repère éditorial)", "regroupement des métiers en familles"],
    note: "Utilisé comme repère de classification des domaines professionnels. Aucun code de fiche n’est reproduit.",
  },
  {
    id: "onisep",
    name: "Onisep — Idéo / fiches métiers",
    url: "https://www.onisep.fr/",
    version: "Non applicable (site de référence consulté pour orienter la rédaction)",
    retrievedAt: null,
    licence: "Contenus Onisep protégés : seuls des liens sont fournis, aucun texte n’est reproduit.",
    derivedFields: ["voies de formation courantes (à vérifier)"],
    note: "Lien de recherche proposé pour chaque métier ; la page exacte n’est pas garantie.",
  },
  {
    id: "esco",
    name: "ESCO — classification européenne des compétences, certifications et professions",
    url: "https://esco.ec.europa.eu/fr",
    version: "Version exacte non vérifiée",
    retrievedAt: null,
    licence: "Licence ouverte de la Commission européenne (conditions à vérifier sur le portail ESCO).",
    derivedFields: ["vocabulaire de compétences (inspiration)"],
    note: "Sert de référence pour le vocabulaire des compétences ; aucune donnée ESCO n’est importée.",
  },
  {
    id: "rncp",
    name: "France compétences — Répertoire national des certifications professionnelles (RNCP)",
    url: "https://www.francecompetences.fr/recherche/rncp/",
    version: "Répertoire vivant, consultable en ligne",
    retrievedAt: null,
    licence: "Données publiques de France compétences (conditions à vérifier).",
    derivedFields: ["niveaux de qualification indicatifs"],
    note: "Les niveaux d’entrée indiqués sont des ordres de grandeur éditoriaux, pas des extraits du RNCP.",
  },
  {
    id: "editorial",
    name: "Rédaction éditoriale du projet",
    url: "/a-propos/",
    version: "Jeu de données initial",
    retrievedAt: null,
    licence: "Contenu du projet.",
    derivedFields: ["descriptions", "tâches", "conditions de travail estimées", "durées de formation estimées"],
    note: "Descriptions, intensités de conditions de travail et durées de formation sont des estimations éditoriales à vérifier auprès des sources officielles.",
  },
];

export const SOURCE_BY_ID: Record<string, SourceDef> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

/** Date de génération du jeu de données (pas une date de vérification des fiches). */
export const DATASET_VERSION = "2026-11-02";
