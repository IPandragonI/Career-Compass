import type { Question } from "@/types/assessment";
import { CONSTRAINTS } from "@/data/taxonomy";
import { av, e, hobby, i, m, opt, q, sd, ss, tr } from "./helpers";

/**
 * Questions principales. Le moteur adaptatif choisit dans cette banque ET dans les
 * questions de précision (questions-followup.ts) ; personne ne les voit toutes.
 */

/* ───────────── Intérêts : scénarios et comparaisons ───────────── */

const interests: Question[] = [
  q({
    id: "q-free-day",
    kind: "single",
    dimension: "interets",
    topic: "activite-preferee",
    priority: 10,
    shuffle: true,
    prompt: "Vous avez une journée libre pour avancer sur un projet. Quelle activité vous attire le plus ?",
    why: "Pour repérer les activités qui vous attirent naturellement.",
    options: [
      opt("tech", "Résoudre un problème technique complexe", [i("analyse", 3), i("numerique", 1), ss("technique")]),
      opt("design", "Concevoir quelque chose de nouveau", [i("creation", 3), ss("creativite")]),
      opt("help", "Aider quelqu’un à surmonter une difficulté", [i("aide", 3), ss("ecoute")]),
      opt("practical", "Réaliser une activité pratique et observer le résultat", [i("manuel", 3), i("operations", 1.5), m("concret", 1)]),
      opt("data", "Analyser des données pour comprendre une situation", [i("donnees", 3), i("analyse", 1.5), ss("analytique")]),
      opt("team", "Organiser une équipe et coordonner plusieurs tâches", [i("organisation", 3), i("gestion", 1.5), ss("coordination")]),
      opt("nature", "Explorer un environnement naturel et collecter des informations", [
        i("nature", 3),
        i("recherche", 1.5),
        e("fieldwork", 4, 1),
      ]),
      opt("investigate", "Enquêter sur un problème et découvrir ses causes", [i("recherche", 3), i("analyse", 1.5)]),
    ],
  }),
  q({
    id: "q-week-project",
    kind: "multi",
    dimension: "interets",
    topic: "projet-semaine",
    maxSelect: 2,
    shuffle: true,
    prompt: "Quels projets vous donneraient envie de vous investir toute une semaine ? (deux au maximum)",
    options: [
      opt("restore", "Remettre en état une machine ou un équipement", [i("manuel", 2.5), i("machines", 2), i("operations", 1)]),
      opt("study", "Mener une petite étude et en tirer des conclusions", [i("recherche", 2.5), i("donnees", 1.5)]),
      opt("event", "Organiser un événement de A à Z", [i("organisation", 2.5), i("persuasion", 1)]),
      opt("app", "Créer un site ou une application", [i("numerique", 2.5), i("creation", 1.5)]),
      opt("land", "Aménager ou restaurer un espace naturel", [i("nature", 2.5), i("manuel", 1)]),
      opt("write", "Écrire ou produire un contenu pour un public", [i("communication", 2.5), i("creation", 1)]),
      opt("workshop", "Préparer et animer un atelier pour d’autres", [i("aide", 2.5), i("communication", 1)]),
      opt("deal", "Monter une affaire ou convaincre des partenaires", [i("persuasion", 2.5), i("gestion", 1.5)]),
    ],
  }),
  q({
    id: "q-reportage",
    kind: "single",
    dimension: "interets",
    topic: "curiosite",
    shuffle: true,
    prompt: "Dans un magazine, quel reportage lisez-vous en premier ?",
    options: [
      opt("restoration", "La restauration d’un moteur ou d’un monument", [i("manuel", 2), i("machines", 1.5), i("creation", 1)]),
      opt("species", "Le suivi d’une espèce menacée sur le terrain", [i("nature", 2.5), i("recherche", 1.5)]),
      opt("algo", "Comment un algorithme a changé un secteur d’activité", [i("numerique", 2.5), i("analyse", 1)]),
      opt("hospital", "Une équipe soignante face à une situation difficile", [i("aide", 2.5)]),
      opt("startup", "L’histoire d’une entreprise qui a réussi à se développer", [i("persuasion", 2.5), i("gestion", 1.5)]),
      opt("lab", "Une découverte scientifique expliquée pas à pas", [i("recherche", 2), i("donnees", 1.5), i("analyse", 1)]),
      opt("studio", "Les coulisses d’une création : film, mode, architecture", [i("creation", 2.5), i("communication", 1)]),
      opt("logistics", "L’organisation d’un grand chantier ou d’un port", [i("organisation", 2.5), i("machines", 1), i("operations", 1)]),
    ],
  }),
  q({
    id: "q-forced-field-screen",
    kind: "forced",
    dimension: "interets",
    topic: "terrain-ecran",
    prompt: "Quelle activité préférez-vous ?",
    options: [
      opt("field", "Relever des mesures et observer sur le terrain", [
        i("donnees", 1.5),
        i("recherche", 1.5),
        i("nature", 1),
        e("fieldwork", 4, 1.5),
      ]),
      opt("screen", "Traiter et interpréter ces mesures sur ordinateur", [i("donnees", 2), i("numerique", 2), e("deskWork", 4, 1.5)]),
    ],
  }),
  q({
    id: "q-forced-do-coordinate",
    kind: "forced",
    dimension: "interets",
    topic: "faire-coordonner",
    prompt: "Quelle position vous convient le mieux ?",
    options: [
      opt("do", "Réaliser moi-même le travail concret", [i("manuel", 2), i("operations", 1.5), e("teamwork", 1, 0.5)]),
      opt("coordinate", "Coordonner ceux qui réalisent", [
        i("organisation", 2),
        i("gestion", 1.5),
        ss("coordination"),
        e("teamwork", 3, 0.5),
      ]),
    ],
  }),
  q({
    id: "q-forced-people-system",
    kind: "forced",
    dimension: "interets",
    topic: "personnes-systemes",
    prompt: "Quelle journée vous attire le plus ?",
    options: [
      opt("people", "Une journée d’échanges et de rencontres avec des personnes", [
        i("aide", 1.5),
        i("communication", 1.5),
        i("persuasion", 1),
        e("publicInteraction", 4, 1.5),
      ]),
      opt("system", "Une journée à comprendre et faire fonctionner un système ou un objet", [
        i("analyse", 1.5),
        i("machines", 1.5),
        i("manuel", 1),
        e("publicInteraction", 1, 1.5),
      ]),
    ],
  }),
  q({
    id: "q-forced-explore-expert",
    kind: "forced",
    dimension: "interets",
    topic: "variete-expertise",
    prompt: "Quel parcours vous attire le plus ?",
    options: [
      opt("explore", "Découvrir régulièrement de nouveaux sujets", [m("variete", 2), m("apprentissage", 1), e("routine", 0, 1.5)]),
      opt("expert", "Devenir une référence sur un sujet précis", [m("reconnaissance", 1.5), m("defi", 1.5), e("routine", 2, 1)]),
    ],
  }),
  q({
    id: "q-forced-invent-method",
    kind: "forced",
    dimension: "interets",
    topic: "inventer-appliquer",
    prompt: "Dans votre travail, vous préférez plutôt…",
    options: [
      opt("invent", "Inventer votre façon de faire", [i("creation", 2), m("creativite", 2), m("autonomie", 1)]),
      opt("apply", "Appliquer une méthode éprouvée avec précision", [ss("rigueur", 2), m("stabilite", 1), e("routine", 3, 1)]),
    ],
  }),
];

/* ───────────── Cadre de travail ───────────── */

const environment: Question[] = [
  q({
    id: "q-env-place",
    kind: "scale",
    dimension: "environnement",
    topic: "lieu",
    prompt: "Où imaginez-vous votre journée de travail type ?",
    help: "Il n’y a pas de bonne réponse : une fourchette est tout à fait possible.",
    options: [
      opt("desk", "Presque toujours en intérieur, au bureau", [e("deskWork", 4, 2), e("fieldwork", 0, 2)]),
      opt("desk-trips", "Surtout au bureau, avec des déplacements ponctuels", [e("deskWork", 3, 2), e("fieldwork", 1, 2)]),
      opt("mixed", "Moitié bureau, moitié terrain", [e("deskWork", 2, 2), e("fieldwork", 2, 2)]),
      opt("field-office", "Surtout sur le terrain, avec un peu de bureau", [e("deskWork", 1, 2), e("fieldwork", 3, 2)]),
      opt("outdoor", "Presque toujours dehors ou en intervention", [e("deskWork", 0, 2), e("fieldwork", 4, 2)]),
    ],
  }),
  q({
    id: "q-env-physical",
    kind: "scale",
    dimension: "environnement",
    topic: "physique",
    prompt: "Quelle place voulez-vous donner à l’effort physique dans votre travail ?",
    options: [
      opt("none", "Aucune : je préfère un travail plutôt sédentaire", [e("physicalActivity", 0, 2)]),
      opt("little", "Peu : de la marche et quelques manipulations", [e("physicalActivity", 1, 2)]),
      opt("some", "Régulière, mais sans excès", [e("physicalActivity", 2, 2)]),
      opt("lot", "Importante : j’aime me dépenser", [e("physicalActivity", 3, 2)]),
      opt("main", "C’est le cœur du métier, même si c’est exigeant", [e("physicalActivity", 4, 2)]),
    ],
  }),
  q({
    id: "q-env-team",
    kind: "scale",
    dimension: "environnement",
    topic: "equipe",
    prompt: "Votre façon idéale de travailler avec les autres ?",
    options: [
      opt("alone", "Seul·e la plupart du temps, avec des points d’étape", [e("teamwork", 0, 2), m("autonomie", 1)]),
      opt("mostly-alone", "En autonomie sur mes tâches, avec des échanges réguliers", [e("teamwork", 1.5, 2), m("autonomie", 1)]),
      opt("pair", "En petite équipe, chacun avec son rôle", [e("teamwork", 2.5, 2)]),
      opt("team", "En équipe soudée, tout au long de la journée", [e("teamwork", 4, 2), m("equipe", 1.5)]),
    ],
  }),
  q({
    id: "q-env-public",
    kind: "scale",
    dimension: "environnement",
    topic: "public",
    prompt: "Quelle part de contact avec le public ou des clients souhaitez-vous ?",
    options: [
      opt("none", "Aucune ou presque : je préfère travailler avec des collègues ou des objets", [e("publicInteraction", 0, 2)]),
      opt("rare", "Ponctuelle, pour des échanges précis", [e("publicInteraction", 1, 2)]),
      opt("regular", "Régulière, avec des interlocuteurs variés", [e("publicInteraction", 2.5, 2)]),
      opt("constant", "Permanente : c’est ce qui me plaît", [e("publicInteraction", 4, 2), i("aide", 0.5)]),
    ],
  }),
  q({
    id: "q-env-routine",
    kind: "scale",
    dimension: "environnement",
    topic: "routine",
    prompt: "Préférez-vous des journées prévisibles ou des journées différentes les unes des autres ?",
    options: [
      opt("routine", "Très régulières : je sais à l’avance ce que je fais", [e("routine", 4, 2), m("stabilite", 1)]),
      opt("mostly-routine", "Plutôt régulières, avec quelques surprises", [e("routine", 3, 2)]),
      opt("mixed", "Un équilibre entre cadre fixe et imprévus", [e("routine", 2, 2)]),
      opt("varied", "Plutôt variées : je m’ennuie vite sinon", [e("routine", 1, 2), m("variete", 1.5)]),
      opt("very-varied", "Toujours différentes, chaque jour est une nouvelle mission", [e("routine", 0, 2), m("variete", 2)]),
    ],
  }),
  q({
    id: "q-env-travel",
    kind: "scale",
    dimension: "environnement",
    topic: "deplacements",
    prompt: "Et les déplacements professionnels ?",
    options: [
      opt("never", "Je préfère un lieu de travail fixe", [e("travel", 0, 2)]),
      opt("occasional", "Quelques déplacements dans l’année, pas plus", [e("travel", 1, 2)]),
      opt("regular", "Des déplacements réguliers dans ma région", [e("travel", 2.5, 2)]),
      opt("frequent", "Souvent en déplacement, y compris loin", [e("travel", 4, 2), m("voyage", 1.5)]),
    ],
  }),
  q({
    id: "q-env-technical",
    kind: "scale",
    dimension: "environnement",
    topic: "technique",
    prompt: "Quelle place souhaitez-vous donner aux outils techniques (machines, instruments, équipements, systèmes) ?",
    options: [
      opt("none", "Très peu : je préfère un travail sans dimension technique", [e("technicalWork", 0, 2)]),
      opt("some", "Quelques outils, mais ce n’est pas l’essentiel", [e("technicalWork", 1.5, 2)]),
      opt("lot", "Beaucoup : j’aime utiliser et comprendre des outils", [e("technicalWork", 3, 2), i("operations", 0.5)]),
      opt("core", "C’est le cœur de mon métier idéal", [e("technicalWork", 4, 2), i("machines", 1)]),
    ],
  }),
  q({
    id: "q-env-analytic",
    kind: "scale",
    dimension: "environnement",
    topic: "analyse",
    prompt: "Quelle place voulez-vous donner à la réflexion et à l’analyse (comparer, modéliser, diagnostiquer) ?",
    options: [
      opt("none", "Peu : je préfère agir que réfléchir longuement", [e("analyticalWork", 0, 2)]),
      opt("some", "Un peu, quand c’est utile", [e("analyticalWork", 1.5, 2)]),
      opt("lot", "Une part importante de mon temps", [e("analyticalWork", 3, 2), i("analyse", 0.5)]),
      opt("core", "L’essentiel de mon activité", [e("analyticalWork", 4, 2), m("defi", 1)]),
    ],
  }),
  q({
    id: "q-env-places-multi",
    kind: "multi",
    dimension: "environnement",
    topic: "lieux-attirants",
    shuffle: true,
    maxSelect: 3,
    prompt: "Dans quels lieux de travail vous verriez-vous bien ? (trois au maximum)",
    options: [
      opt("workshop", "Un atelier ou un garage", [i("manuel", 1.5), e("technicalWork", 3, 1), e("physicalActivity", 2.5, 0.5)]),
      opt("lab", "Un laboratoire", [i("recherche", 1.5), i("donnees", 1.5), e("analyticalWork", 3, 1)]),
      opt("site", "Un chantier ou un site industriel", [i("operations", 1.5), e("fieldwork", 3.5, 1), e("physicalActivity", 3, 1)]),
      opt("office", "Un bureau ou un espace de co-working", [e("deskWork", 3.5, 1.5), i("numerique", 0.5)]),
      opt("outdoor", "Un milieu naturel : forêt, rivière, champs, littoral", [i("nature", 2), e("fieldwork", 4, 1.5)]),
      opt("care", "Un lieu d’accueil ou de soin : hôpital, école, centre social", [i("aide", 2), e("publicInteraction", 3.5, 1)]),
      opt("road", "La route, les rails, les airs ou la mer", [i("machines", 1.5), e("travel", 3.5, 1), e("fieldwork", 3, 0.5)]),
      opt("studio", "Un studio, une agence ou un lieu de création", [i("creation", 2), i("communication", 1)]),
    ],
  }),
];

/* ───────────── Motivations et valeurs ───────────── */

const motivations: Question[] = [
  q({
    id: "q-motiv-top",
    kind: "multi",
    dimension: "motivations",
    topic: "motivations-principales",
    priority: 5,
    shuffle: true,
    maxSelect: 4,
    prompt: "Qu’est-ce qui compterait le plus pour que vous vous sentiez bien dans votre métier ? (quatre au maximum)",
    help: "À l’étape suivante, vous pourrez préciser ce qui est indispensable ou simplement souhaitable.",
    options: [
      opt("utilite", "Être utile aux autres", [m("utilite", 2.5)]),
      opt("environnement", "Agir pour l’environnement", [m("environnement", 2.5)]),
      opt("concret", "Voir des résultats concrets de mon travail", [m("concret", 2.5)]),
      opt("defi", "Relever des défis intellectuels", [m("defi", 2.5)]),
      opt("creativite", "Pouvoir créer", [m("creativite", 2.5)]),
      opt("autonomie", "Être autonome", [m("autonomie", 2.5)]),
      opt("stabilite", "Avoir de la stabilité", [m("stabilite", 2.5)]),
      opt("salaire", "Gagner correctement ma vie", [m("salaire", 2.5)]),
      opt("reconnaissance", "Être reconnu·e", [m("reconnaissance", 2.5)]),
      opt("apprentissage", "Apprendre en continu", [m("apprentissage", 2.5)]),
      opt("variete", "Ne pas m’ennuyer : de la variété", [m("variete", 2.5)]),
      opt("responsabilite", "Avoir des responsabilités", [m("responsabilite", 2.5)]),
      opt("equipe", "Faire partie d’une équipe", [m("equipe", 2.5)]),
      opt("liberte", "Disposer de liberté et de flexibilité", [m("liberte", 2.5)]),
      opt("voyage", "Voyager et découvrir", [m("voyage", 2.5)]),
      opt("cause", "Servir une cause ou un secteur qui me tient à cœur", [m("cause", 2.5)]),
    ],
  }),
  q({
    id: "q-motiv-essential",
    kind: "multi",
    dimension: "motivations",
    topic: "motivations-indispensables",
    priority: 4,
    prompt: "Parmi vos choix, lesquels seraient indispensables ? (les autres resteront « souhaitables »)",
    help: "Indispensable : vous refuseriez un poste qui ne l’offre pas.",
    informs: MOTIVATION_KEYS(),
    buildOptions: (ctx) => {
      const a = ctx.answers["q-motiv-top"];
      if (!a || a.kind !== "multi") return [];
      return a.values.map((v) => {
        const label =
          {
            utilite: "Être utile aux autres",
            environnement: "Agir pour l’environnement",
            concret: "Voir des résultats concrets",
            defi: "Relever des défis intellectuels",
            creativite: "Pouvoir créer",
            autonomie: "Être autonome",
            stabilite: "Avoir de la stabilité",
            salaire: "Gagner correctement ma vie",
            reconnaissance: "Être reconnu·e",
            apprentissage: "Apprendre en continu",
            variete: "La variété",
            responsabilite: "Avoir des responsabilités",
            equipe: "Faire partie d’une équipe",
            liberte: "Liberté et flexibilité",
            voyage: "Voyager et découvrir",
            cause: "Servir une cause qui me tient à cœur",
          }[v as string] ?? v;
        return opt(v, label, [{ k: "motivation", id: v as never, w: 1, essential: true }]);
      });
    },
    when: (ctx) => {
      const a = ctx.answers["q-motiv-top"];
      return !!a && a.kind === "multi" && a.values.length >= 2;
    },
  }),
  q({
    id: "q-forced-stab-var",
    kind: "forced",
    dimension: "motivations",
    topic: "stabilite-variete",
    resolves: ["c-stab-var"],
    prompt: "Si vous deviez choisir…",
    options: [
      opt("stability", "Un emploi stable avec des tâches assez prévisibles", [
        m("stabilite", 2.5),
        tr("stabilityNeed", 0.9),
        e("routine", 3, 1),
      ]),
      opt("variety", "Des missions variées avec moins de sécurité", [
        m("variete", 2.5),
        m("liberte", 1),
        tr("stabilityNeed", 0.2),
        tr("seasonalOk", 0.7),
      ]),
    ],
  }),
  q({
    id: "q-forced-pay-meaning",
    kind: "forced",
    dimension: "motivations",
    topic: "salaire-sens",
    prompt: "Si vous deviez choisir…",
    options: [
      opt("pay", "Une rémunération élevée dans un métier qui m’intéresse moyennement", [m("salaire", 2.5), tr("lowerPay", 0.1)]),
      opt("meaning", "Un salaire correct dans un métier qui a du sens pour moi", [m("utilite", 1.5), m("cause", 1.5), tr("lowerPay", 0.8)]),
    ],
  }),
  q({
    id: "q-forced-resp-calm",
    kind: "forced",
    dimension: "motivations",
    topic: "responsabilite",
    prompt: "Si vous deviez choisir…",
    options: [
      opt("resp", "Des responsabilités importantes, avec la pression qui va avec", [
        m("responsabilite", 2.5),
        m("reconnaissance", 1),
        tr("responsibilityOk", 0.9),
      ]),
      opt("calm", "Un poste sans grande pression, avec un bon équilibre de vie", [
        m("liberte", 1.5),
        tr("responsibilityOk", 0.2),
        av("manages-people", 2),
      ]),
    ],
  }),
  q({
    id: "q-motiv-impact",
    kind: "single",
    dimension: "motivations",
    topic: "impact",
    shuffle: true,
    prompt: "Quel type d’impact serait le plus gratifiant pour vous ?",
    options: [
      opt("person", "Aider une personne à aller mieux, concrètement", [m("utilite", 3), i("aide", 1)]),
      opt("nature", "Protéger ou restaurer un milieu naturel", [m("environnement", 3), i("nature", 1)]),
      opt("service", "Faire fonctionner un service dont tout le monde dépend", [
        m("utilite", 1.5),
        m("responsabilite", 1.5),
        m("concret", 1),
      ]),
      opt("beauty", "Créer quelque chose de beau ou d’inédit", [m("creativite", 3)]),
      opt("knowledge", "Faire progresser la connaissance", [m("defi", 2), m("apprentissage", 1.5), i("recherche", 1)]),
      opt("durable", "Construire quelque chose de durable", [m("concret", 2.5), m("cause", 1)]),
      opt("business", "Faire réussir un projet économique", [m("reconnaissance", 1.5), m("salaire", 1.5), i("persuasion", 1)]),
    ],
  }),
  q({
    id: "q-motiv-satisfaction",
    kind: "single",
    dimension: "motivations",
    topic: "satisfaction",
    shuffle: true,
    prompt: "Quand un travail est terminé, qu’est-ce qui vous satisfait le plus ?",
    options: [
      opt("object", "Voir l’objet, l’installation ou le résultat réalisé", [m("concret", 3)]),
      opt("thanks", "Recevoir le remerciement sincère d’une personne", [m("utilite", 3)]),
      opt("understand", "Avoir compris pourquoi quelque chose se passait", [m("defi", 3), m("apprentissage", 1)]),
      opt("peers", "Être reconnu·e par des personnes que j’estime", [m("reconnaissance", 3)]),
      opt("freedom", "Avoir pu faire à ma manière", [m("autonomie", 3), m("liberte", 1)]),
      opt("team", "Avoir réussi ensemble", [m("equipe", 3)]),
    ],
  }),
];

function MOTIVATION_KEYS(): string[] {
  return [
    "utilite",
    "environnement",
    "concret",
    "defi",
    "creativite",
    "autonomie",
    "stabilite",
    "salaire",
    "reconnaissance",
    "apprentissage",
    "variete",
    "responsabilite",
    "equipe",
    "liberte",
    "voyage",
    "cause",
  ].map((k) => `motivation:${k}`);
}

/* ───────────── Journée de travail et tâches à éviter ───────────── */

const daily: Question[] = [
  q({
    id: "q-day-ideal",
    kind: "single",
    dimension: "quotidien",
    topic: "journee-ideale",
    priority: 6,
    shuffle: true,
    prompt: "Quelle journée de travail vous ressemble le plus ?",
    options: [
      opt("computer", "Une journée dominée par le travail sur ordinateur", [e("deskWork", 4, 2), i("numerique", 2)]),
      opt("technical-mix", "Un mélange de travail technique et d’interventions pratiques", [
        e("technicalWork", 3.5, 2),
        i("operations", 2),
        i("manuel", 1),
        e("fieldwork", 2.5, 1),
      ]),
      opt("sites", "Une journée à visiter des sites ou à travailler dehors", [e("fieldwork", 4, 2), e("travel", 3, 1), i("nature", 1)]),
      opt("people", "Une journée faite de personnes, de discussions et de coordination", [
        e("publicInteraction", 3.5, 1.5),
        e("teamwork", 3.5, 1.5),
        i("organisation", 1.5),
        i("aide", 1),
      ]),
      opt("research", "Une journée de recherche, d’enquête et d’analyse", [
        i("recherche", 2.5),
        e("analyticalWork", 3.5, 2),
        i("analyse", 1),
      ]),
      opt("production", "Une journée de production, de maintenance ou d’exploitation", [
        i("machines", 2),
        i("operations", 2),
        e("routine", 2.5, 1),
      ]),
    ],
  }),
  q({
    id: "q-day-tasks-like",
    kind: "multi",
    dimension: "quotidien",
    topic: "taches-aimees",
    maxSelect: 4,
    shuffle: true,
    prompt: "Quelles tâches aimeriez-vous retrouver chaque semaine ? (quatre au maximum)",
    options: [
      opt("measure", "Relever des mesures, inventorier, contrôler", [i("donnees", 2), i("recherche", 1)]),
      opt("repair", "Dépanner, régler, réparer", [i("manuel", 2), i("operations", 1.5), ss("depannage")]),
      opt("report", "Rédiger des rapports et des comptes rendus", [i("communication", 2), ss("ecriture")]),
      opt("welcome", "Accueillir, écouter, conseiller des personnes", [i("aide", 2), ss("ecoute")]),
      opt("plan", "Planifier, suivre des plannings et des budgets", [i("organisation", 2), i("gestion", 1.5)]),
      opt("teach", "Expliquer, former, transmettre", [i("aide", 1.5), i("communication", 1.5)]),
      opt("tables", "Analyser des tableaux de chiffres", [i("donnees", 2), i("analyse", 1.5)]),
      opt("prototype", "Imaginer, esquisser, tester des idées", [i("creation", 2.5)]),
      opt("drive", "Conduire, piloter un engin ou un véhicule", [i("machines", 2.5), e("travel", 3, 0.5)]),
      opt("negotiate", "Négocier, convaincre, prospecter", [i("persuasion", 2.5)]),
      opt("quality", "Vérifier la qualité, la conformité, la sécurité", [i("operations", 1), ss("rigueur", 2), i("analyse", 1)]),
      opt("care", "Prendre soin du vivant : personnes, animaux, plantes", [i("aide", 1.5), i("nature", 1.5)]),
    ],
  }),
  q({
    id: "q-day-tasks-avoid",
    kind: "multi",
    dimension: "quotidien",
    topic: "taches-evitees",
    priority: 7,
    shuffle: true,
    maxSelect: 4,
    prompt: "Quelles tâches voulez-vous éviter autant que possible ? (quatre au maximum)",
    help: "Savoir ce que vous ne voulez pas faire est aussi précieux que savoir ce que vous aimez.",
    options: [
      opt("sales", "Vendre ou prospecter", [i("persuasion", -2.5), av("sales-targets", 2)]),
      opt("admin", "Remplir des dossiers et des formulaires", [i("gestion", -1.5), av("admin-heavy", 2)]),
      opt("repeat", "Répéter les mêmes gestes", [av("repetitive", 2), e("routine", 1, 1)]),
      opt("screen", "Rester devant un écran", [i("numerique", -2), av("desk-all-day", 2), e("deskWork", 1, 1)]),
      opt("manual", "Travailler physiquement, manipuler du matériel", [i("manuel", -2), i("operations", -1.5), av("heavy-physical", 2)]),
      opt("talk", "Parler à beaucoup de monde dans la journée", [av("customer-contact", 2), e("publicInteraction", 1, 1)]),
      opt("manage", "Encadrer ou arbitrer des conflits", [av("manages-people", 2), i("gestion", -1)]),
      opt("write", "Écrire de longs documents", [i("communication", -1.5)]),
      opt("numbers", "Manipuler des chiffres ou des statistiques", [i("donnees", -2), i("analyse", -1)]),
      opt("travel", "Me déplacer souvent", [av("frequent-travel", 2), e("travel", 1, 1)]),
      opt("none", "Rien de particulier", [], { exclusive: true }),
    ],
  }),
  q({
    id: "q-day-schedule",
    kind: "scale",
    dimension: "quotidien",
    topic: "horaires",
    prompt: "Votre rapport aux horaires de travail ?",
    options: [
      opt("regular", "Horaires réguliers, en journée, idéalement le week-end libre", [av("night-shifts", 3), e("routine", 3, 0.5)]),
      opt("slightly", "Quelques soirées ou week-ends de temps en temps, sans plus", [av("night-shifts", 2)]),
      opt("shifts", "Des horaires variables ne me gênent pas si le métier me plaît", [av("night-shifts", 1)]),
      opt("any", "Nuits, week-ends, astreintes : aucun problème", [av("night-shifts", 0), tr("seasonalOk", 0.8)]),
    ],
  }),
];

/* ───────────── Compétences et points forts ───────────── */

const skills: Question[] = [
  q({
    id: "q-skill-experiences",
    kind: "multi",
    dimension: "competences",
    topic: "experiences-vecues",
    priority: 6,
    shuffle: true,
    maxSelect: 6,
    prompt: "Parmi ces situations, lesquelles avez-vous réellement vécues (travail, études, bénévolat, vie personnelle) ?",
    help: "Ces réponses serviront de preuves d’expérience, séparées de ce que vous pensez savoir faire.",
    options: [
      opt("repair", "Dépanner ou réparer un équipement", [sd("depannage"), sd("technique", 1)]),
      opt("code", "Écrire un programme, un script ou une formule complexe", [sd("logique"), sd("outils", 1.5)]),
      opt("lead", "Encadrer, former ou guider d’autres personnes", [sd("communication", 1.5), sd("decision", 1.5)]),
      opt("budget", "Gérer un budget, un stock ou un planning", [sd("organisation"), sd("rigueur", 1)]),
      opt("study", "Mener une enquête, une étude ou un rapport", [sd("analytique"), sd("ecriture", 1.5)]),
      opt("event", "Organiser un événement ou un projet collectif", [sd("coordination"), sd("organisation", 1)]),
      opt("sell", "Vendre, négocier ou conseiller un client", [sd("communication"), sd("ecoute", 1)]),
      opt("care", "Accompagner ou soutenir des personnes en difficulté", [sd("ecoute", 2), sd("adaptabilite", 1)]),
      opt("outdoor", "Travailler régulièrement en extérieur ou sur le terrain", [sd("adaptabilite", 1.5)]),
      opt("data", "Analyser des données ou construire des tableaux de bord", [sd("analytique"), sd("rigueur", 1)]),
      opt("create", "Concevoir et réaliser une création publiée ou montrée", [sd("creativite", 2)]),
      opt("map", "Lire des plans, des cartes ou des schémas techniques", [sd("spatial", 2)]),
    ],
  }),
  q({
    id: "q-skill-asked",
    kind: "multi",
    dimension: "competences",
    topic: "points-forts-percus",
    maxSelect: 3,
    shuffle: true,
    prompt: "Pour quoi vos proches ou collègues vous sollicitent-ils le plus souvent ? (trois au maximum)",
    help: "Il s’agit ici de ce que les autres reconnaissent chez vous, donc d’un point de vue extérieur.",
    options: [
      opt("fix", "Pour dépanner ou comprendre comment ça marche", [ss("technique", 2), ss("depannage", 1.5)]),
      opt("organize", "Pour organiser ou mettre de l’ordre", [ss("organisation", 2), ss("coordination", 1)]),
      opt("listen", "Pour un conseil ou une oreille attentive", [ss("ecoute", 2), ss("communication", 1)]),
      opt("explain", "Pour expliquer ou rédiger quelque chose", [ss("ecriture", 2), ss("communication", 1)]),
      opt("ideas", "Pour avoir des idées", [ss("creativite", 2)]),
      opt("check", "Pour relire, vérifier, repérer les erreurs", [ss("rigueur", 2)]),
      opt("figures", "Pour les chiffres, la logique, les calculs", [ss("logique", 2), ss("analytique", 1.5)]),
      opt("decide", "Pour trancher quand on hésite", [ss("decision", 2)]),
      opt("tools", "Pour prendre en main un nouvel outil ou un logiciel", [ss("outils", 2)]),
    ],
  }),
  q({
    id: "q-skill-delay",
    kind: "single",
    dimension: "competences",
    topic: "scenario-blocage",
    shuffle: true,
    prompt: "Un projet prend du retard à cause d’un blocage technique. Quel est votre premier réflexe ?",
    options: [
      opt("diagnose", "Isoler le problème et tester des hypothèses une à une", [ss("logique", 2), ss("technique", 1.5)]),
      opt("ask", "Chercher qui a déjà rencontré ce problème et demander conseil", [ss("communication", 2), ss("adaptabilite", 1)]),
      opt("replan", "Revoir le planning et réaffecter les priorités", [ss("coordination", 2), ss("organisation", 1.5)]),
      opt("workaround", "Imaginer une autre manière d’atteindre le même objectif", [ss("creativite", 2), ss("adaptabilite", 1.5)]),
      opt("document", "Vérifier méthodiquement ce qui a été fait avant", [ss("rigueur", 2), ss("analytique", 1)]),
    ],
  }),
  q({
    id: "q-skill-explain",
    kind: "single",
    dimension: "competences",
    topic: "scenario-explication",
    shuffle: true,
    prompt: "Vous devez expliquer un sujet complexe à des personnes qui ne le connaissent pas. Vous…",
    options: [
      opt("diagram", "Dessinez un schéma ou une maquette", [ss("creativite", 1.5), ss("spatial", 1.5)]),
      opt("story", "Racontez une histoire ou donnez des exemples concrets", [ss("communication", 2), ss("ecoute", 1)]),
      opt("write", "Préparez un document clair, structuré et illustré", [ss("ecriture", 2), ss("organisation", 1)]),
      opt("demo", "Faites une démonstration pratique", [ss("technique", 1.5), ss("communication", 1.5)]),
      opt("avoid", "Préférez laisser quelqu’un d’autre s’en charger", [ss("communication", -1)]),
    ],
  }),
  q({
    id: "q-forced-detail-view",
    kind: "forced",
    dimension: "competences",
    topic: "detail-vision",
    prompt: "Quelle phrase vous ressemble le plus ?",
    options: [
      opt("detail", "Je repère vite l’erreur de détail que les autres ne voient pas", [ss("rigueur", 2.5), ss("analytique", 1)]),
      opt("global", "Je vois vite l’ensemble avant d’entrer dans les détails", [
        ss("coordination", 1.5),
        ss("decision", 1.5),
        ss("creativite", 0.5),
      ]),
    ],
  }),
  q({
    id: "q-selfrate-spatial",
    kind: "scale",
    dimension: "competences",
    topic: "spatial",
    prompt: "Lire un plan, une carte ou un schéma de montage pour vous représenter l’espace, c’est pour vous…",
    options: [
      opt("easy", "Très facile, j’aime ça", [ss("spatial", 3)]),
      opt("fairly", "Plutôt facile", [ss("spatial", 1.5)]),
      opt("medium", "Moyennement à l’aise", [ss("spatial", 0.5)]),
      opt("hard", "Plutôt difficile", [ss("spatial", -1)]),
      opt("unknown", "Je ne sais pas, je n’en ai jamais fait", []),
    ],
  }),
  q({
    id: "q-selfrate-numbers",
    kind: "scale",
    dimension: "competences",
    topic: "chiffres",
    prompt: "Manipuler des chiffres, des pourcentages ou des statistiques, c’est pour vous…",
    options: [
      opt("easy", "Très naturel", [ss("logique", 2), ss("analytique", 2)]),
      opt("fairly", "Plutôt à l’aise", [ss("logique", 1), ss("analytique", 1)]),
      opt("medium", "Moyennement à l’aise, avec un outil", [ss("analytique", 0.3)]),
      opt("hard", "Plutôt difficile", [ss("analytique", -1)]),
      opt("unknown", "Je ne sais pas", []),
    ],
  }),
  q({
    id: "q-skill-uncertain",
    kind: "single",
    dimension: "competences",
    topic: "decision-incertitude",
    shuffle: true,
    prompt: "Vous devez décider rapidement avec des informations incomplètes. Que faites-vous ?",
    options: [
      opt("decide", "Je tranche et j’ajuste ensuite si nécessaire", [ss("decision", 2.5), tr("uncertaintyOk", 0.9)]),
      opt("collect", "Je cherche à obtenir l’information manquante, même si cela prend du temps", [
        ss("rigueur", 1.5),
        ss("analytique", 1),
        tr("uncertaintyOk", 0.4),
      ]),
      opt("consult", "Je consulte l’équipe avant de décider", [ss("communication", 1.5), ss("coordination", 1), tr("uncertaintyOk", 0.5)]),
      opt("avoid", "Je préfère que quelqu’un d’autre décide", [tr("uncertaintyOk", 0.1), tr("responsibilityOk", 0.2)]),
    ],
  }),
  q({
    id: "q-skill-learning",
    kind: "single",
    dimension: "competences",
    topic: "apprentissage",
    prompt: "Pour apprendre un nouvel outil ou une nouvelle méthode, vous préférez…",
    options: [
      opt("try", "Essayer par moi-même et apprendre en faisant", [ss("outils", 2), ss("adaptabilite", 1)]),
      opt("shown", "Qu’on me montre d’abord, puis je reproduis", [ss("outils", 1), ss("ecoute", 0.5)]),
      opt("read", "Lire la documentation et comprendre le principe avant", [ss("outils", 1.5), ss("analytique", 1)]),
      opt("course", "Suivre une formation structurée", [ss("outils", 0.5), tr("retrain", 0.7)]),
    ],
  }),
];

/* ───────────── Évolution, risque et transition ───────────── */

const transition: Question[] = [
  q({
    id: "q-trait-retrain",
    kind: "scale",
    dimension: "transition",
    topic: "reconversion",
    prompt: "Un métier vous passionne mais exige de repartir presque de zéro en formation. Vous…",
    options: [
      opt("no", "Passez votre chemin : je veux utiliser ce que je sais déjà", [tr("retrain", 0.05), av("long-training", 3)]),
      opt("maybe", "Étudiez la question si la formation est courte", [tr("retrain", 0.35), av("long-training", 2)]),
      opt("yes", "Vous vous renseignez sérieusement sur les formations possibles", [tr("retrain", 0.7), av("long-training", 1)]),
      opt("all-in", "Vous êtes prêt·e à vous former longuement pour ce métier", [tr("retrain", 1), av("long-training", 0)]),
    ],
  }),
  q({
    id: "q-trait-pay",
    kind: "scale",
    dimension: "transition",
    topic: "baisse-revenu",
    prompt: "Pour changer de voie, accepteriez-vous une baisse de revenu au début ?",
    options: [
      opt("no", "Non, mon niveau de vie actuel doit être préservé", [tr("lowerPay", 0.05), m("salaire", 1)]),
      opt("slight", "Une légère baisse, pour une durée limitée", [tr("lowerPay", 0.4)]),
      opt("yes", "Oui, si cela mène à un métier qui me convient", [tr("lowerPay", 0.8)]),
      opt("na", "Je débute : la question ne se pose pas vraiment", []),
    ],
  }),
  q({
    id: "q-trait-contract",
    kind: "multi",
    dimension: "transition",
    topic: "cadre-emploi",
    shuffle: true,
    prompt: "Quels cadres d’emploi pourraient vous convenir ?",
    options: [
      opt("permanent", "Un poste durable et sécurisé (CDI, fonction publique)", [tr("stabilityNeed", 0.9), m("stabilite", 1.5)]),
      opt("missions", "Des missions ou des contrats courts", [tr("seasonalOk", 0.7), tr("stabilityNeed", 0.3)]),
      opt("seasonal", "Du travail saisonnier", [tr("seasonalOk", 1), av("unstable-employment", 0)]),
      opt("freelance", "Travailler en indépendant·e", [tr("selfEmployed", 0.9), m("liberte", 1.5), m("autonomie", 1)]),
      opt("entrepreneur", "Créer ou reprendre une activité", [tr("selfEmployed", 1), m("responsabilite", 1), tr("uncertaintyOk", 0.8)]),
    ],
  }),
  q({
    id: "q-trait-responsibility",
    kind: "scale",
    dimension: "transition",
    topic: "responsabilite-incertitude",
    prompt: "Votre rapport à la responsabilité et à l’imprévu ?",
    options: [
      opt("low", "Je préfère un cadre clair, sans grandes décisions à prendre", [tr("responsibilityOk", 0.1), tr("uncertaintyOk", 0.2)]),
      opt("medium", "Des responsabilités sur mon périmètre, un cadre assez défini", [
        tr("responsibilityOk", 0.5),
        tr("uncertaintyOk", 0.4),
      ]),
      opt("high", "J’aime décider et gérer l’imprévu", [tr("responsibilityOk", 0.9), tr("uncertaintyOk", 0.9), m("responsabilite", 1.5)]),
    ],
  }),
  q({
    id: "q-trait-mobility",
    kind: "single",
    dimension: "transition",
    topic: "mobilite",
    prompt: "Seriez-vous prêt·e à changer de ville ou de région pour un métier qui vous correspond vraiment ?",
    when: (ctx) => !ctx.onboarding.relocation || ctx.onboarding.relocation === "nsp",
    options: [
      opt("yes", "Oui, sans difficulté particulière", [tr("relocation", 1)]),
      opt("maybe", "Oui, mais dans une région précise ou pour un temps limité", [tr("relocation", 0.5)]),
      opt("no", "Non, je veux rester où je vis", [tr("relocation", 0.05)]),
    ],
  }),
];

/* ───────────── Ce que l’on veut éviter (obligatoire) ───────────── */

const aversions: Question[] = [
  q({
    id: "q-aversions",
    kind: "matrix",
    dimension: "aversions",
    topic: "points-de-blocage",
    mandatory: true,
    priority: 3,
    prompt: "Pour chacune de ces situations, indiquez ce que vous ressentez.",
    help: "Ces réponses pèsent beaucoup sur les recommandations : prenez le temps d’être franc·he. « Fortement indésirable » écartera ou signalera clairement les métiers concernés.",
    items: CONSTRAINTS.map((c) => ({ id: c.id, label: c.label })),
    informs: CONSTRAINTS.map((c) => `aversion:${c.id}`),
    seconds: 80,
  }),
];

/* ───────────── Loisirs et texte libre ───────────── */

export const HOBBY_OPTIONS = [
  { id: "randonnee", label: "Randonnée, nature, plein air" },
  { id: "bricolage", label: "Bricolage, mécanique, réparation" },
  { id: "informatique", label: "Informatique personnelle, jeux vidéo, code" },
  { id: "lecture-ecriture", label: "Lecture, écriture" },
  { id: "sport", label: "Sport" },
  { id: "arts", label: "Musique, dessin, arts" },
  { id: "cuisine", label: "Cuisine" },
  { id: "jardinage", label: "Jardinage, plantes, animaux" },
  { id: "benevolat", label: "Bénévolat, vie associative" },
  { id: "culture", label: "Musées, histoire, patrimoine" },
  { id: "voyages", label: "Voyages" },
  { id: "strategie", label: "Jeux de stratégie, énigmes" },
  { id: "motorsport", label: "Sport automobile, moto, mécanique sportive" },
  { id: "photo-video", label: "Photo, vidéo" },
] as const;

const leisure: Question[] = [
  q({
    id: "q-hobbies",
    kind: "multi",
    dimension: "loisirs",
    topic: "loisirs",
    maxSelect: 3,
    shuffle: true,
    prompt: "Quelles activités occupent votre temps libre ? (trois au maximum, ou aucune)",
    help: "Nous ne déduirons pas un métier de vos loisirs : nous chercherons ce que vous y appréciez vraiment.",
    options: [
      ...HOBBY_OPTIONS.map((h) => opt(h.id, h.label, [hobby(h.id)])),
      opt("none", "Aucune en particulier", [], { exclusive: true }),
    ],
  }),
  q({
    id: "q-text-dream",
    kind: "text",
    dimension: "loisirs",
    topic: "texte-libre",
    placeholder: "Un métier, un domaine, une activité… même si cela vous semble irréaliste.",
    prompt: "Y a-t-il un métier, un domaine ou une activité qui vous attire, même si cela vous paraît irréaliste ? (facultatif)",
    help: "Ce texte reste sur votre appareil. Il sert à repérer ce que vous avez déjà en tête, pas à classer vos résultats.",
    informs: ["hobby"],
    priority: 1,
  }),
];

export const QUESTIONS_CORE: Question[] = [
  ...interests,
  ...environment,
  ...motivations,
  ...daily,
  ...skills,
  ...transition,
  ...aversions,
  ...leisure,
];
