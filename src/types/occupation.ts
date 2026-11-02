import type { ConstraintId, EnvDimId, FamilyId, InterestId, MotivationId, SkillId } from "@/data/taxonomy";

/**
 * Échelle des conditions de travail (0 à 4) :
 *  0 = négligeable ou absent, 1 = marginal, 2 = significatif, 3 = important, 4 = dominant.
 * `null` = information inconnue. Une valeur inconnue n’est JAMAIS traitée comme 0.
 */
export type Scale = 0 | 1 | 2 | 3 | 4;
export type WorkEnvironment = Record<EnvDimId, Scale | null>;

/** Présence d’une condition difficile : oui, parfois, non. Absent du dictionnaire = inconnu. */
export type ConstraintState = "yes" | "sometimes" | "no";
export type ConstraintMap = Partial<Record<ConstraintId, ConstraintState>>;

export type Confidence = "faible" | "moyenne" | "elevee";

export type EntryLevel = "aucun" | "cap-bep" | "bac" | "bac+2" | "bac+3" | "bac+5" | "doctorat";
export const ENTRY_LEVEL_RANK: Record<EntryLevel, number> = {
  aucun: 0,
  "cap-bep": 1,
  bac: 2,
  "bac+2": 3,
  "bac+3": 4,
  "bac+5": 5,
  doctorat: 6,
};
export const ENTRY_LEVEL_LABEL: Record<EntryLevel, string> = {
  aucun: "Aucun diplôme requis",
  "cap-bep": "CAP / BEP ou équivalent",
  bac: "Baccalauréat ou équivalent",
  "bac+2": "Bac +2 (BTS, DUT, BUT 2 ans)",
  "bac+3": "Bac +3 (licence, BUT)",
  "bac+5": "Bac +5 (master, ingénieur)",
  doctorat: "Doctorat",
};

export type Provenance = "classification" | "editorial" | "estimated";

export interface SourceDef {
  id: string;
  name: string;
  url: string;
  version: string;
  retrievedAt: string | null;
  licence: string;
  derivedFields: string[];
  note: string;
}

export interface SourceRef {
  sourceId: string;
  note?: string;
  /** Lien de recherche ou page de référence. Jamais une URL inventée pour une fiche précise. */
  url?: string;
}

export interface TrainingInfo {
  /** Niveau d’entrée le plus courant. */
  typicalLevel: EntryLevel;
  /** Niveau minimal observé selon les voies (peut être plus bas via l’expérience). */
  minLevel: EntryLevel;
  /** Durée de formation typique depuis zéro, en mois. `null` = inconnu. Estimation éditoriale. */
  months: number | null;
  routes: string[];
  prerequisites: string[];
  notes: string[];
  /** Alternance ou apprentissage possible. `null` = inconnu. */
  workStudyPossible: boolean | null;
  /** Des postes d’entrée de niveau débutant existent. */
  entryRoles: boolean | null;
}

export interface Occupation {
  id: string;
  name: string;
  aliases: string[];
  familyId: FamilyId;
  sectorIds: string[];
  subsectorIds: string[];
  /** Domaine ROME (lettre A à N), repère éditorial à vérifier — pas un code de fiche. */
  romeDomain: string | null;
  description: string;
  dailyTasks: string[];
  /** Poids 1 (secondaire) à 3 (central). Les intérêts absents ne sont pas pertinents. */
  interestTags: Partial<Record<InterestId, 1 | 2 | 3>>;
  skillTags: SkillId[];
  workEnvironment: WorkEnvironment;
  motivationTags: MotivationId[];
  constraints: ConstraintMap;
  training: TrainingInfo;
  careerPaths: string[];
  relatedOccupationIds: string[];
  /** Les métiers d’un même groupe sont quasi-doublons : un seul est recommandé. */
  dedupeGroup: string | null;
  /** Indication relative de rémunération (1 modeste, 2 moyenne, 3 élevée). `null` = inconnu. */
  earnings: 1 | 2 | 3 | null;
  /** Stabilité d’emploi typique (1 faible, 2 moyenne, 3 forte). `null` = inconnu. */
  stability: 1 | 2 | 3 | null;
  sourceReferences: SourceRef[];
  provenance: {
    classification: Provenance;
    description: Provenance;
    environment: Provenance;
    training: Provenance;
    constraints: Provenance;
  };
  lastVerifiedAt: string | null;
  confidence: Confidence;
}

export interface Subsector {
  id: string;
  name: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  subsectors: Subsector[];
  activities: string[];
  interests: InterestId[];
  skills: SkillId[];
  environment: string;
  constraints: string[];
  misconceptions: string[];
  sourceReferences: SourceRef[];
}
