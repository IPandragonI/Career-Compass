/**
 * Catalogue de messages (français) utilisé par le moteur : explications, avertissements, notes.
 * Ajouter une langue = fournir un objet de même forme (type `Messages`) et le sélectionner dans `getMessages`.
 * Les libellés des taxonomies (intérêts, compétences…) et le contenu des questions vivent dans `src/data/`.
 * Les textes des composants d’interface ne sont pas encore extraits (voir README).
 */

const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

export const fr = {
  join,
  reasons: {
    interest: (labels: string[], task: string) =>
      `Vous avez mis en avant « ${join(labels)} », ce que ce métier mobilise${task ? ` (par exemple : ${task})` : ""}.`,
    environment: (phrases: string[]) => `Le cadre de travail correspond à ce que vous recherchez : ${join(phrases)}.`,
    motivation: (labels: string[], essential: boolean) =>
      `Il peut répondre à votre recherche de ${join(labels)}${essential ? ", dont certains points sont pour vous indispensables" : ""}.`,
    skills: (labels: string[], demonstrated: boolean) =>
      `${demonstrated ? "Vous avez déjà mobilisé" : "Vous pensez disposer de"} des compétences utiles ici : ${join(labels)}.${demonstrated ? "" : " Ce point reste à confirmer en situation."}`,
    training: (level: string, months: number) =>
      `Formation : ${level} en général ; environ ${months} mois pour vous (estimation éditoriale, à vérifier).`,
  },
  warnings: {
    envGap: (label: string, wanted: string) => `${label} : vous souhaitez ${wanted}, le métier est plutôt à l’opposé.`,
    missingEssential: (label: string) =>
      `« ${label} » est indispensable pour vous, mais n’apparaît pas parmi les caractéristiques principales de ce métier.`,
    trainingTooLong: (eff: number, max: number) => `Formation estimée à ${eff} mois, alors que vous envisagez ${max} mois au maximum.`,
    lowConfidence: "Les données sur ce métier ont un niveau de confiance faible : à recouper avec les sources officielles.",
    entryLevelRefused: "Ce métier s’aborde souvent par un poste de débutant dans le secteur, ce que vous préférez éviter.",
    urgent: (eff: number) => `Vous cherchez un emploi rapidement, mais la formation est estimée à ${eff} mois.`,
    dealSometimesStrong: (label: string) => `Ce métier implique parfois ${label}, que vous jugez fortement indésirable.`,
    dealYesMedium: (label: string) => `Ce métier implique ${label}, que vous jugez plutôt indésirable.`,
    dealSometimesMedium: (label: string) => `Il peut arriver d’avoir à subir ${label}.`,
    dealYesLow: (label: string) => `Ce métier implique ${label}, que vous jugez acceptable avec modération.`,
    excluded: (label: string) => `Incompatible avec un point que vous jugez fortement indésirable : ${label}.`,
    unknownStrong: (label: string) => `À vérifier : ${label} (point que vous voulez éviter) — non précisé dans nos données.`,
    unknownMedium: (label: string) => `À vérifier : ${label}.`,
    salaryUnknown: "Niveau de rémunération typique non renseigné dans nos données.",
    salaryLow: "Rémunération généralement modeste, en deçà de ce que vous attendez.",
    salaryLowish: "Rémunération souvent modeste, en début de carrière notamment.",
    stabilityUnknown: "Stabilité de l’emploi non renseignée dans nos données.",
    stabilityLow: "Emploi souvent peu stable (contrats courts, saisonnalité ou indépendance).",
    licence: "Un permis de conduire est mentionné comme prérequis.",
  },
  toInvestigate: {
    officialSheet: "Lire une fiche métier officielle et comparer avec cette présentation.",
    realOffers: "Consulter quelques offres d’emploi réelles pour voir les exigences concrètes.",
    talk: "Échanger avec une personne qui exerce ce métier (journée type, difficultés, évolution).",
    workStudy: "Vérifier si une formation en alternance est possible.",
    compareTraining: "Comparer plusieurs voies de formation (durée, coût, financement).",
  },
  category: {
    longTraining: (eff: number) => `Elle demande environ ${eff} mois de formation, au-delà de ce que vous envisagez.`,
    levelGap: "Elle demande un niveau de qualification nettement supérieur au vôtre.",
    noBackground: "Vous n’avez pas encore de parcours précis : toutes les pistes sont de nouvelles directions.",
    near: "Elle reste dans un secteur que vous connaissez et réutilise une grande partie de vos compétences.",
    adjacentSector: "Elle reste dans votre univers mais change l’activité ou les responsabilités.",
    adjacentSkills: "Elle réutilise une partie de vos compétences dans un autre univers.",
    new: "Elle s’écarte de votre parcours mais correspond à vos intérêts et motivations.",
  },
  notes: {
    exploratory:
      "Ces résultats sont exploratoires : ils sont calculés localement à partir de vos réponses et d’un jeu de données éditorial, sans validation scientifique.",
    fewAnswers: "Vous avez répondu à peu de questions : les pistes sont larges et peu fiables. Compléter le bilan les améliorera.",
    excluded: (n: number) => `${n} métier(s) ont été écartés car incompatibles avec ce que vous avez indiqué fortement vouloir éviter.`,
  },
  selection: {
    informs: (labels: string[]) => `Cette question précise : ${labels.join(", ")}.`,
    generic: "Cette question complète votre profil.",
    ceiling: "Plafond de questions atteint.",
    timeBudget: "Budget de temps atteint.",
    none: "Plus aucune question pertinente.",
    covered: "Les dimensions essentielles sont suffisamment documentées.",
    lowGain: "Les questions restantes apporteraient peu d’information nouvelle.",
  },
  absence: {
    excluded: (reason: string) => `Ce métier a été écarté : ${reason}`,
    notExcluded: "Ce métier n’a pas été écarté, mais il n’a pas été retenu parmi les meilleures pistes.",
    rank: (rank: number, total: number) => `Il arrive en position ${rank} sur ${total} métiers non écartés.`,
    strongest: (label: string, level: string) => `Point le plus favorable : ${label} (adéquation ${level}).`,
    weakest: (label: string, level: string) => `Point le moins favorable : ${label} (adéquation ${level}).`,
    selected: "Ce métier fait partie de vos pistes recommandées.",
  },
};

export type Messages = typeof fr;
export const getMessages = (_locale: "fr" = "fr"): Messages => fr;
export const t = fr;
