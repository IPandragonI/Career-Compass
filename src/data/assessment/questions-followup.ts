import type { Question, QuestionContext } from "@/types/assessment";
import type { InterestId } from "@/data/taxonomy";
import { CONSTRAINT_BY_ID, FAMILIES } from "@/data/taxonomy";
import { av, e, fam, followup, hobby, i, m, opt, ss, tr } from "./helpers";
import { HOBBY_OPTIONS } from "./questions-core";

/**
 * Questions de précision : posées seulement quand une réponse antérieure les rend utiles
 * (spécialisation d’un intérêt, contradiction à lever, point de blocage à clarifier).
 */

function topInterests(ctx: QuestionContext, n = 3): InterestId[] {
  return (Object.entries(ctx.profile.interests) as [InterestId, { norm: number }][])
    .filter(([, s]) => s.norm > 0)
    .sort((a, b) => b[1].norm - a[1].norm)
    .slice(0, n)
    .map(([id]) => id);
}
const isTop = (ctx: QuestionContext, id: InterestId, n = 3, min = 0.4) =>
  topInterests(ctx, n).includes(id) && ctx.profile.interests[id].norm >= min;
const hobbyIds = (ctx: QuestionContext): string[] => {
  const a = ctx.answers["q-hobbies"];
  return a && a.kind === "multi" ? a.values.filter((v) => v !== "none") : [];
};

/** Chaque spécialisation d’intérêt reste prudente si la personne veut quitter son secteur. */

const hobbyReasons = () => [
  opt("physical", "Me dépenser physiquement", [i("operations", 0.8), e("physicalActivity", 3, 0.7)]),
  opt("outdoors", "Être dehors, dans un cadre naturel", [i("nature", 1.5), e("fieldwork", 4, 0.7)]),
  opt("understand", "Comprendre comment les choses fonctionnent", [i("analyse", 1.5), ss("technique", 1)]),
  opt("challenge", "Réussir quelque chose de difficile et progresser", [m("defi", 1.5), m("apprentissage", 1)]),
  opt("create", "Créer, imaginer, fabriquer", [i("creation", 1.5), m("creativite", 1)]),
  opt("share", "Partager un moment avec d’autres", [i("aide", 0.8), m("equipe", 1.5)]),
  opt("alone", "Être au calme, seul·e, à mon rythme", [e("teamwork", 0.5, 0.7), m("autonomie", 1.5)]),
  opt("explore", "Explorer, découvrir, voyager", [m("voyage", 1.5), m("variete", 1)]),
  opt("tools", "Maîtriser un équipement ou un outil", [i("machines", 1.2), i("manuel", 0.8)]),
];

function hobbyWhy(index: number): Question {
  return followup({
    id: `q-fu-hobby-${index + 1}`,
    kind: "multi",
    dimension: "loisirs",
    topic: "loisir-pourquoi",
    maxSelect: 2,
    priority: 1,
    informs: [
      "interest:nature",
      "interest:analyse",
      "interest:creation",
      "interest:aide",
      "interest:machines",
      "interest:manuel",
      "env:fieldwork",
      "env:physicalActivity",
      "motivation:defi",
      "motivation:autonomie",
      "motivation:voyage",
      "motivation:equipe",
    ],
    buildPrompt: (ctx) => {
      const id = hobbyIds(ctx)[index];
      const label = HOBBY_OPTIONS.find((h) => h.id === id)?.label ?? "ce loisir";
      return `Dans « ${label} », qu’est-ce qui vous plaît vraiment ? (deux choix au maximum)`;
    },
    prompt: "Dans ce loisir, qu’est-ce qui vous plaît vraiment ?",
    help: "Ce que vous aimez dans une activité n’est pas forcément le métier qui lui correspond : c’est une piste à tester.",
    when: (ctx) => hobbyIds(ctx).length > index,
    buildOptions: (ctx) => hobbyReasons().map((o) => ({ ...o, effects: [...o.effects, hobby(`${hobbyIds(ctx)[index]}:${o.id}`)] })),
  });
}

export const QUESTIONS_FOLLOWUP: Question[] = [
  /* ── Spécialisations d’intérêts ── */
  followup({
    id: "q-fu-technical-practical",
    kind: "multi",
    dimension: "interets",
    topic: "fu-technique-pratique",
    maxSelect: 2,
    prompt: "Dans le travail technique et pratique, qu’est-ce qui vous attire le plus ? (deux choix au maximum)",
    why: "Vous avez montré un goût pour le travail pratique : précisons de quel type.",
    when: (ctx) => isTop(ctx, "manuel") || isTop(ctx, "machines") || isTop(ctx, "operations"),
    options: [
      opt("mecanique", "Systèmes mécaniques : moteurs, transmissions, machines", [
        fam("maintenance", 2),
        fam("industrie", 1),
        fam("transport", 1),
        i("machines", 1),
      ]),
      opt("electronique", "Électronique et instrumentation", [
        fam("recherche", 1),
        fam("maintenance", 1.5),
        fam("ingenierie", 1.5),
        i("donnees", 1),
      ]),
      opt("construction", "Construction et installation", [fam("construction", 2.5), fam("energie", 1), i("manuel", 1)]),
      opt("labo", "Laboratoire et mesure", [fam("recherche", 2.5), i("donnees", 1.5), i("recherche", 1)]),
      opt("industriel", "Maintenance et exploitation industrielle", [fam("maintenance", 2), fam("industrie", 2), i("operations", 1)]),
      opt("terrain", "Équipements de terrain et interventions techniques", [
        fam("maintenance", 1.5),
        fam("energie", 1.5),
        fam("environnement", 1),
        e("fieldwork", 3.5, 1),
      ]),
    ],
  }),
  followup({
    id: "q-fu-digital",
    kind: "multi",
    dimension: "interets",
    topic: "fu-numerique",
    maxSelect: 2,
    prompt: "Dans le numérique, qu’est-ce qui vous attire le plus ? (deux choix au maximum)",
    when: (ctx) =>
      isTop(ctx, "numerique") && !(ctx.profile.transition.wantsToLeaveField && ctx.profile.background.sectorIds.includes("numerique")),
    options: [
      opt("dev", "Développer des logiciels ou des applications", [fam("numerique-dev", 2.5), i("creation", 1)]),
      opt("data", "Exploiter des données pour éclairer des décisions", [fam("data-geo", 2.5), fam("recherche", 1), i("donnees", 1)]),
      opt("infra", "Faire fonctionner et sécuriser des systèmes et des réseaux", [
        fam("numerique-dev", 2),
        fam("maintenance", 1.5),
        i("machines", 1),
      ]),
      opt("design", "Concevoir des interfaces et des expériences", [fam("creation", 2), fam("communication", 1)]),
      opt("support", "Dépanner et accompagner des utilisateurs", [fam("maintenance", 1.5), fam("social", 1), i("aide", 1)]),
      opt("project", "Piloter des projets numériques", [fam("gestion", 2.5), i("organisation", 1)]),
    ],
  }),
  followup({
    id: "q-fu-nature",
    kind: "multi",
    dimension: "interets",
    topic: "fu-nature",
    maxSelect: 2,
    prompt: "Avec la nature et le vivant, que préféreriez-vous faire ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "nature"),
    options: [
      opt("inventory", "Observer et inventorier espèces et milieux", [fam("environnement", 2.5), fam("recherche", 1), i("recherche", 1)]),
      opt("manage", "Entretenir et aménager des espaces", [fam("agriculture", 2.5), fam("environnement", 1)]),
      opt("cultivate", "Cultiver ou élever", [fam("agriculture", 3)]),
      opt("guide", "Guider et sensibiliser le public", [fam("tourisme", 2), fam("education", 1.5), fam("environnement", 1)]),
      opt("measure", "Mesurer et analyser l’eau, le sol, l’air", [fam("environnement", 2), fam("recherche", 2), i("donnees", 1)]),
      opt("regulate", "Protéger et faire respecter la réglementation", [fam("public", 2), fam("securite", 1.5), fam("environnement", 1)]),
    ],
  }),
  followup({
    id: "q-fu-people",
    kind: "multi",
    dimension: "interets",
    topic: "fu-aide",
    maxSelect: 2,
    prompt: "Dans la relation d’aide, quel rôle vous correspond le mieux ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "aide"),
    options: [
      opt("care", "Prendre soin de la santé physique", [fam("sante", 3)]),
      opt("social", "Accompagner des personnes dans leur vie quotidienne et leur insertion", [fam("social", 3)]),
      opt("teach", "Enseigner ou former", [fam("education", 3)]),
      opt("advise", "Conseiller et orienter", [fam("social", 1), fam("education", 1), fam("public", 1.5), i("communication", 1)]),
      opt("sport", "Entraîner et animer par la pratique physique", [fam("sport", 2.5), e("physicalActivity", 3.5, 1)]),
      opt("emergency", "Intervenir en situation d’urgence", [fam("securite", 2.5), fam("sante", 1)]),
    ],
  }),
  followup({
    id: "q-fu-creation",
    kind: "multi",
    dimension: "interets",
    topic: "fu-creation",
    maxSelect: 2,
    prompt: "Quelle forme de création vous attire le plus ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "creation"),
    options: [
      opt("objects", "Concevoir des objets ou des produits", [fam("ingenierie", 1.5), fam("creation", 2), fam("artisanat", 1)]),
      opt("visual", "Images, graphisme, illustration", [fam("creation", 2.5)]),
      opt("content", "Textes, contenus, récits", [fam("communication", 2.5)]),
      opt("space", "Espaces, architecture, aménagement", [fam("construction", 1.5), fam("creation", 1.5), fam("public", 1)]),
      opt("matter", "Travailler une matière de mes mains", [fam("artisanat", 3), i("manuel", 1)]),
      opt("media", "Son, vidéo, spectacle", [fam("communication", 1.5), fam("culture", 1.5), fam("creation", 1)]),
    ],
  }),
  followup({
    id: "q-fu-organize",
    kind: "multi",
    dimension: "interets",
    topic: "fu-organisation",
    maxSelect: 2,
    prompt: "Quand vous organisez et coordonnez, de quoi vous occupez-vous de préférence ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "organisation") || isTop(ctx, "gestion"),
    options: [
      opt("sites", "Des chantiers ou des projets techniques", [fam("construction", 1.5), fam("ingenierie", 1.5), fam("gestion", 1.5)]),
      opt("flows", "Des flux de marchandises, de personnes ou de véhicules", [fam("transport", 3)]),
      opt("admin", "Des dossiers, des budgets, de l’administratif", [fam("gestion", 2), fam("finance", 1.5), fam("public", 1)]),
      opt("hr", "Des équipes et leurs compétences", [fam("gestion", 2.5)]),
      opt("event", "Des événements, de l’accueil et de la logistique", [fam("tourisme", 2), fam("culture", 1), fam("gestion", 1)]),
      opt("territory", "Des politiques et projets pour un territoire", [fam("public", 3)]),
    ],
  }),
  followup({
    id: "q-fu-persuade",
    kind: "multi",
    dimension: "interets",
    topic: "fu-persuasion",
    maxSelect: 2,
    prompt: "Dans le développement et la négociation, qu’est-ce qui vous intéresse ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "persuasion"),
    options: [
      opt("tech-sales", "Vendre des solutions techniques à des professionnels", [fam("commerce", 2.5), i("analyse", 0.5)]),
      opt("advice", "Conseiller sur la durée plutôt que vendre une fois", [fam("commerce", 1.5), fam("finance", 1.5), i("aide", 1)]),
      opt("market", "Comprendre un marché et positionner une offre", [fam("commerce", 2.5), i("donnees", 1)]),
      opt("business", "Créer ou développer une activité", [fam("gestion", 1.5), fam("commerce", 1.5), m("responsabilite", 1)]),
      opt("lobby", "Défendre des intérêts, des idées, une cause", [fam("public", 1.5), fam("communication", 1.5), m("cause", 1.5)]),
    ],
  }),
  followup({
    id: "q-fu-research",
    kind: "multi",
    dimension: "interets",
    topic: "fu-recherche",
    maxSelect: 2,
    prompt: "Quelle forme d’investigation vous attire le plus ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "recherche") || isTop(ctx, "donnees") || isTop(ctx, "analyse"),
    options: [
      opt("lab", "Expériences et analyses en laboratoire", [fam("recherche", 3)]),
      opt("field", "Enquête et mesures sur le terrain", [
        fam("environnement", 1.5),
        fam("recherche", 1.5),
        fam("data-geo", 1.5),
        e("fieldwork", 3.5, 1),
      ]),
      opt("data", "Modélisation et analyse de données", [fam("data-geo", 2.5), fam("finance", 1), fam("numerique-dev", 1)]),
      opt("quality", "Contrôle, qualité et conformité", [fam("industrie", 2), fam("securite", 1.5)]),
      opt("diagnose", "Diagnostic de pannes et d’anomalies", [fam("maintenance", 3)]),
      opt("map", "Cartographie et analyse de l’espace", [fam("data-geo", 3), i("donnees", 1)]),
    ],
  }),
  followup({
    id: "q-fu-comm",
    kind: "multi",
    dimension: "interets",
    topic: "fu-communication",
    maxSelect: 2,
    prompt: "Dans la communication, quel type de production vous attire ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "communication"),
    options: [
      opt("journalism", "Informer : enquêter et écrire", [fam("communication", 2.5), i("recherche", 1)]),
      opt("brand", "Promouvoir : stratégie, marque, réseaux", [fam("commerce", 1.5), fam("communication", 2)]),
      opt("teach", "Expliquer : vulgarisation, médiation, formation", [fam("education", 1.5), fam("culture", 2)]),
      opt("public", "Relation avec les institutions et le public", [fam("public", 2)]),
      opt("visual", "Créer des visuels et des vidéos", [fam("creation", 2.5)]),
    ],
  }),
  followup({
    id: "q-fu-machines",
    kind: "multi",
    dimension: "interets",
    topic: "fu-machines",
    maxSelect: 2,
    prompt: "Avec les machines et les véhicules, que voulez-vous faire ? (deux choix au maximum)",
    when: (ctx) => isTop(ctx, "machines"),
    options: [
      opt("drive", "Les conduire ou les piloter", [fam("transport", 3), e("travel", 3.5, 1)]),
      opt("repair", "Les réparer et les entretenir", [fam("maintenance", 3)]),
      opt("operate", "Conduire des lignes de production", [fam("industrie", 3)]),
      opt("design", "Les concevoir", [fam("ingenierie", 3)]),
      opt("install", "Les installer sur des sites", [fam("energie", 1.5), fam("construction", 1.5), fam("maintenance", 1)]),
    ],
  }),
  followup({
    id: "q-fu-explore-universes",
    kind: "multi",
    dimension: "interets",
    topic: "fu-exploration-large",
    maxSelect: 3,
    shuffle: true,
    prompt: "Parmi ces univers professionnels, lesquels aimeriez-vous découvrir ? (trois au maximum)",
    why: "Vos réponses sont encore larges : élargissons l’exploration avant de resserrer.",
    when: (ctx) => {
      const top = topInterests(ctx, 3).map((id) => ctx.profile.interests[id].norm);
      const flat = top.length < 2 || (top[0] ?? 0) - (top[2] ?? 0) < 0.25;
      return (ctx.profile.transition.exploreBroadly || flat) && ctx.asked.length >= 8;
    },
    options: FAMILIES.filter((f) =>
      [
        "environnement",
        "ingenierie",
        "data-geo",
        "sante",
        "education",
        "maintenance",
        "energie",
        "transport",
        "communication",
        "creation",
        "securite",
        "tourisme",
        "public",
        "agriculture",
        "recherche",
      ].includes(f.id),
    ).map((f) => opt(f.id, f.label, [fam(f.id, 2)], { hint: f.blurb })),
  }),
  followup({
    id: "q-fu-same-field-role",
    kind: "single",
    dimension: "interets",
    topic: "fu-meme-domaine",
    prompt: "Dans votre domaine actuel, quel changement vous attirerait le plus ?",
    why: "Vous souhaitez rester dans votre domaine : précisons comment le faire évoluer.",
    when: (ctx) => ctx.profile.transition.wantsToStay && ctx.profile.background.hasBackground,
    options: [
      opt("more-field", "Moins de bureau, plus de terrain", [e("fieldwork", 3.5, 1.5), e("deskWork", 1, 1.5)]),
      opt("more-people", "Plus de relation, de conseil ou de formation", [i("aide", 1.5), e("publicInteraction", 3, 1)]),
      opt("specialize", "Me spécialiser techniquement", [i("analyse", 1.5), m("defi", 1.5), e("technicalWork", 3.5, 1)]),
      opt("manage", "Encadrer ou piloter des projets", [i("organisation", 1.5), i("gestion", 1.5), m("responsabilite", 1.5)]),
      opt("independent", "Gagner en autonomie ou travailler à mon compte", [m("autonomie", 2), tr("selfEmployed", 0.8)]),
    ],
  }),

  /* ── Résolution de contradictions ── */
  followup({
    id: "q-fu-desk-field-balance",
    kind: "single",
    dimension: "environnement",
    topic: "fu-bureau-terrain",
    resolves: ["c-desk-field"],
    prompt: "Vous aimez les activités d’analyse ou de numérique, mais vous voulez éviter le bureau. Quel équilibre vous conviendrait ?",
    why: "Deux de vos réponses semblent aller dans des directions différentes : vérifions l’équilibre qui vous convient.",
    when: (ctx) => ctx.profile.contradictions.some((c) => c.id === "c-desk-field"),
    options: [
      opt("field-first", "Surtout du terrain, avec une journée de bureau par semaine", [e("fieldwork", 3.5, 3), e("deskWork", 1, 3)]),
      opt("half", "Moitié terrain, moitié bureau, en alternance", [e("fieldwork", 2, 3), e("deskWork", 2, 3)]),
      opt("office-first", "Surtout du bureau, avec des sorties régulières", [e("fieldwork", 1, 3), e("deskWork", 3, 3)]),
      opt("remote", "Du bureau, mais avec liberté de lieu et d’horaires", [e("deskWork", 3, 2), m("liberte", 2)]),
    ],
  }),
  followup({
    id: "q-fu-outdoor-physical",
    kind: "single",
    dimension: "environnement",
    topic: "fu-exterieur-physique",
    resolves: ["c-outdoor-physical"],
    prompt: "Vous souhaitez travailler dehors tout en évitant l’effort physique intense. Quel type d’activité extérieure vous irait ?",
    when: (ctx) => ctx.profile.contradictions.some((c) => c.id === "c-outdoor-physical"),
    options: [
      opt("observe", "Observer, mesurer, inspecter sans porter de charges", [
        e("fieldwork", 3.5, 2.5),
        e("physicalActivity", 1.5, 2.5),
        i("recherche", 1),
      ]),
      opt("drive", "Piloter un véhicule ou un engin", [e("fieldwork", 3, 2), e("physicalActivity", 1.5, 2), i("machines", 1)]),
      opt("guide", "Accompagner et animer des groupes", [e("fieldwork", 3.5, 2), e("publicInteraction", 3.5, 1), i("aide", 1)]),
      opt("inside", "Finalement, plutôt en intérieur", [e("fieldwork", 1, 2.5)]),
    ],
  }),
  followup({
    id: "q-fu-stability-variety",
    kind: "single",
    dimension: "motivations",
    topic: "fu-stabilite-variete",
    resolves: ["c-stab-var"],
    prompt: "Vous tenez à la stabilité tout en aimant la variété. Quelle combinaison vous correspond le mieux ?",
    when: (ctx) => ctx.profile.contradictions.some((c) => c.id === "c-stab-var"),
    options: [
      opt("stable-contract-varied-tasks", "Un contrat stable avec des missions variées au sein d’une organisation", [
        m("stabilite", 2),
        m("variete", 2),
        tr("stabilityNeed", 0.8),
      ]),
      opt("stable-core", "Un cadre stable ; la variété peut venir de mes loisirs", [m("stabilite", 3), tr("stabilityNeed", 0.95)]),
      opt("varied-core", "La variété d’abord, même avec moins de garanties", [m("variete", 3), tr("stabilityNeed", 0.2)]),
    ],
  }),
  followup({
    id: "q-fu-training-length",
    kind: "single",
    dimension: "transition",
    topic: "fu-formation",
    resolves: ["c-training"],
    prompt: "Vous préférez éviter les formations longues, mais certains métiers qui vous attirent en demandent. Que choisiriez-vous ?",
    when: (ctx) => ctx.profile.contradictions.some((c) => c.id === "c-training"),
    options: [
      opt("short-only", "Une formation courte, quitte à avoir moins de choix de métiers", [av("long-training", 3)]),
      opt("alternance", "Une formation longue si elle est en alternance et rémunérée", [av("long-training", 1), tr("retrain", 0.6)]),
      opt("passion", "Une formation longue si le métier me passionne vraiment", [av("long-training", 0), tr("retrain", 0.9)]),
    ],
  }),
  followup({
    id: "q-fu-client-relation",
    kind: "single",
    dimension: "environnement",
    topic: "fu-relation",
    resolves: ["c-client"],
    prompt: "Vous aimez aider, mais le contact permanent avec le public vous pèse. Quelle forme de relation vous convient ?",
    when: (ctx) => ctx.profile.contradictions.some((c) => c.id === "c-client"),
    options: [
      opt("few-long", "Accompagner peu de personnes, dans la durée", [e("publicInteraction", 2, 3), i("aide", 1)]),
      opt("experts", "Aider, mais surtout via des collègues ou des experts", [e("publicInteraction", 1, 3), e("teamwork", 3, 1)]),
      opt("indirect", "Contribuer indirectement : concevoir, organiser, produire", [e("publicInteraction", 0.5, 3), i("organisation", 1)]),
    ],
  }),
  followup({
    id: "q-fu-aversion-clarify",
    kind: "single",
    dimension: "aversions",
    topic: "fu-blocage-principal",
    prompt: "Parmi vos points « fortement indésirables », lequel est vraiment non négociable ?",
    why: "Vous avez signalé plusieurs points de blocage forts : lequel ne souffre aucune exception ?",
    informs: [],
    when: (ctx) => Object.values(ctx.profile.aversions).filter((a) => a.level === 3).length >= 3,
    buildOptions: (ctx) => {
      const strong = (Object.entries(ctx.profile.aversions) as [keyof typeof CONSTRAINT_BY_ID, { level?: number }][])
        .filter(([, a]) => a.level === 3)
        .map(([id]) => id);
      return [
        ...strong.map((id) => opt(id, CONSTRAINT_BY_ID[id].label, [av(id, 3), ...strong.filter((s) => s !== id).map((s) => av(s, 2))])),
        opt(
          "none",
          "Aucun n’est absolu : je pondère selon le métier",
          strong.map((s) => av(s, 2)),
        ),
      ];
    },
  }),
  followup({
    id: "q-fu-desk-share",
    kind: "single",
    dimension: "quotidien",
    topic: "fu-part-bureau",
    prompt: "Vous voulez éviter le bureau toute la journée. Quelle part de bureau reste acceptable ?",
    when: (ctx) => (ctx.profile.aversions["desk-all-day"].level ?? 0) >= 2 && ctx.profile.env.deskWork.n <= 2,
    options: [
      opt("none", "Presque aucune", [e("deskWork", 0, 2.5)]),
      opt("fifth", "Une demi-journée par semaine", [e("deskWork", 1, 2.5)]),
      opt("half", "Environ la moitié du temps", [e("deskWork", 2, 2.5)]),
    ],
  }),

  hobbyWhy(0),
  hobbyWhy(1),
];
