import type { Persona } from "@/lib/assessment/simulate";

export const FIELD_TECH: Persona = {
  name: "Passionné·e de terrain technique, quitte un poste de bureau",
  onboarding: { educationLevel: "bac+2", studyField: "informatique", status: "reconversion", fieldRelation: ["changer-tout"], training: "6-12", experienceSectorIds: ["numerique"], needIncomeDuringTraining: "oui" },
  likes: { "interest:operations": 3, "interest:machines": 2, "interest:donnees": 2, "interest:nature": 2, "interest:manuel": 1, "interest:numerique": -2, "motivation:concret": 3, "motivation:autonomie": 2, "motivation:environnement": 2, "motivation:variete": 2, "skill:technique": 2, "skill:depannage": 2, "family:maintenance": 2, "family:environnement": 2, "family:energie": 1, "trait:retrain": 1 },
  envTarget: { fieldwork: 4, deskWork: 1, physicalActivity: 3, teamwork: 2, publicInteraction: 1, travel: 3, routine: 1, technicalWork: 4, analyticalWork: 2 },
  aversions: { "desk-all-day": 3, repetitive: 2, "sales-targets": 3, "admin-heavy": 2 },
};

export const STUDENT_PEOPLE: Persona = {
  name: "Étudiant·e qui choisit un premier métier, tourné·e vers les autres",
  onboarding: { educationLevel: "secondaire", status: "etudes", fieldRelation: ["explorer"], training: "longue" },
  likes: { "interest:aide": 3, "interest:communication": 2, "interest:organisation": 1, "motivation:utilite": 3, "motivation:equipe": 2, "skill:ecoute": 2, "family:sante": 2, "family:education": 2, "family:social": 2, "trait:retrain": 1 },
  envTarget: { publicInteraction: 4, teamwork: 3, fieldwork: 1, deskWork: 1, physicalActivity: 2 },
  aversions: { "sales-targets": 2 },
};

export const ANALYST_OFFICE: Persona = {
  name: "Professionnel·le expérimenté·e qui reste dans le numérique et les données",
  onboarding: { educationLevel: "master", studyField: "informatique", status: "emploi", fieldRelation: ["meme-domaine-autre-travail"], training: "mois", experienceSectorIds: ["numerique"], acquiredSkills: ["logique", "outils", "analytique"] },
  likes: { "interest:numerique": 3, "interest:analyse": 3, "interest:donnees": 3, "motivation:defi": 3, "motivation:salaire": 2, "skill:logique": 3, "skill:analytique": 2, "family:data-geo": 2, "family:numerique-dev": 2 },
  envTarget: { deskWork: 4, fieldwork: 0, analyticalWork: 4, technicalWork: 3, teamwork: 3 },
  aversions: { "heavy-physical": 2 },
};

export const STABILITY_SEEKER: Persona = {
  name: "Personne qui priorise un emploi stable",
  onboarding: { educationLevel: "professionnel", status: "emploi", fieldRelation: ["metier-voisin"], training: "mois", stableRequired: "oui", seasonalOk: "non", needIncomeDuringTraining: "oui", experienceSectorIds: ["industrie"] },
  likes: { "interest:operations": 2, "interest:organisation": 2, "motivation:stabilite": 3, "skill:rigueur": 2, "trait:stabilityNeed": 1 },
  envTarget: { routine: 3, teamwork: 3, fieldwork: 1 },
  aversions: { "unstable-employment": 3, "night-shifts": 3, "long-training": 2 },
};

export const BIG_RETRAIN: Persona = {
  name: "Personne prête à une longue reconversion, attirée par la science et la nature",
  onboarding: { educationLevel: "licence", studyField: "commerce-marketing", status: "reconversion", fieldRelation: ["changer-tout"], training: "longue", experienceSectorIds: ["commerce-vente"] },
  likes: { "interest:recherche": 3, "interest:nature": 3, "interest:donnees": 2, "interest:analyse": 2, "interest:persuasion": -2, "motivation:environnement": 3, "motivation:defi": 2, "family:recherche": 2, "family:environnement": 2, "trait:retrain": 1, "trait:lowerPay": 1 },
  envTarget: { fieldwork: 3, analyticalWork: 4, technicalWork: 3, publicInteraction: 1 },
  aversions: { "sales-targets": 3, "customer-contact": 2 },
};

export const UNCLEAR: Persona = {
  name: "Personne sans préférences marquées, qui saute beaucoup de questions",
  onboarding: { status: "chomage", fieldRelation: ["explorer"], training: "nsp" },
  likes: {},
  skipRate: 0.4,
};

export const STRONG_DEALBREAKERS: Persona = {
  name: "Personne avec de forts points de blocage",
  onboarding: { educationLevel: "bac+2", status: "emploi", fieldRelation: ["changer-tout"], training: "jours" },
  likes: { "interest:nature": 2, "interest:manuel": 2, "interest:aide": 1, "motivation:autonomie": 2 },
  envTarget: { fieldwork: 3, physicalActivity: 2 },
  aversions: { "night-shifts": 3, "heavy-physical": 3, "customer-contact": 3, "long-training": 3, "sales-targets": 3, "desk-all-day": 3, "frequent-travel": 3 },
};

export const OFFICE_LEAVER: Persona = {
  name: "Quitte un métier de bureau pour l’extérieur",
  onboarding: { educationLevel: "licence", studyField: "eco-gestion", status: "reconversion", fieldRelation: ["changer-tout"], training: "1-2ans", experienceSectorIds: ["gestion-admin"] },
  likes: { "interest:nature": 3, "interest:manuel": 2, "interest:operations": 2, "motivation:environnement": 3, "motivation:concret": 2, "family:agriculture": 2, "family:environnement": 2, "family:construction": 1 },
  envTarget: { fieldwork: 4, deskWork: 0, physicalActivity: 3, routine: 1 },
  aversions: { "desk-all-day": 3, "admin-heavy": 3, repetitive: 2 },
};

export const ALL_PERSONAS = [FIELD_TECH, STUDENT_PEOPLE, ANALYST_OFFICE, STABILITY_SEEKER, BIG_RETRAIN, UNCLEAR, STRONG_DEALBREAKERS, OFFICE_LEAVER];
