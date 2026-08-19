# -*- coding: utf-8 -*-
"""ES/FR translations for the JSON-LD carried by the aa-sx pages.

The structured data sits inside a <script> block, so the page-copy pipeline
skips it. Left alone it would ship Spanish and French pages describing
themselves to search engines in English, on English URLs.

Book and organisation names stay as they are; they are proper nouns.
"""

SCHEMA = {
 "Live, instructor-led SAFe certification, AI-Native, and corporate agile training from a Scaled Agile Gold Partner. Trusted by 2,500+ professionals across 9 languages and 4 continents, with 500+ live cohorts delivered.": (
  "Formación en vivo con instructor en certificación SAFe, AI-Native y agilidad corporativa, impartida por un Scaled Agile Gold Partner. Con la confianza de más de 2500 profesionales en 9 idiomas y 4 continentes, y más de 500 convocatorias en vivo impartidas.",
  "Formations certifiantes SAFe, AI-Native et agilité d'entreprise, en direct avec instructeur, dispensées par un Scaled Agile Gold Partner. La confiance de plus de 2 500 professionnels en 9 langues et sur 4 continents, avec plus de 500 sessions en direct animées."),
 "Live, instructor-led SAFe certification, AI-Native, and corporate agile training from a Scaled Agile Gold Partner. Trusted by 2,500+ professionals across 9 languages and 12 countries.": (
  "Formación en vivo con instructor en certificación SAFe, AI-Native y agilidad corporativa, impartida por un Scaled Agile Gold Partner. Con la confianza de más de 2500 profesionales en 9 idiomas y 12 países.",
  "Formations certifiantes SAFe, AI-Native et agilité d'entreprise, en direct avec instructeur, dispensées par un Scaled Agile Gold Partner. La confiance de plus de 2 500 professionnels en 9 langues et 12 pays."),
 "Live, instructor-led SAFe certification, AI-Native, and corporate agile training from a Scaled Agile Gold Partner.": (
  "Formación en vivo con instructor en certificación SAFe, AI-Native y agilidad corporativa, impartida por un Scaled Agile Gold Partner.",
  "Formations certifiantes SAFe, AI-Native et agilité d'entreprise, en direct avec instructeur, dispensées par un Scaled Agile Gold Partner."),
 "SAFe Practice Consultant Trainer (SPCT), one of 125+ globally (90+ in North America). Author of Mutation Readiness: An Operating Manual for Innovation in the Age of AI.": (
  "SAFe Practice Consultant Trainer (SPCT), uno de los más de 125 que existen en el mundo (90+ en Norteamérica). Autor de Mutation Readiness: An Operating Manual for Innovation in the Age of AI.",
  "SAFe Practice Consultant Trainer (SPCT), l'un des 125+ dans le monde (90+ en Amérique du Nord). Auteur de Mutation Readiness: An Operating Manual for Innovation in the Age of AI."),
 "SAFe Practice Consultant Trainer (SPCT), one of 125+ globally (90+ in North America). Founder of Agile Agilist.": (
  "SAFe Practice Consultant Trainer (SPCT), uno de los más de 125 que existen en el mundo (90+ en Norteamérica). Fundador de Agile Agilist.",
  "SAFe Practice Consultant Trainer (SPCT), l'un des 125+ dans le monde (90+ en Amérique du Nord). Fondateur d'Agile Agilist."),
 "The Operating Model — Five Dimensions": (
  "El modelo operativo — Cinco dimensiones", "Le modèle opérationnel — Cinq dimensions"),
 "A five-layer operating model — large-scale iterative delivery, a repeatable innovation framework, an AI-native operating model, AI automation, and mutation — that stacks into one enterprise operating model instead of snapping back.": (
  "Un modelo operativo de cinco capas —entrega iterativa a gran escala, un marco de innovación repetible, un modelo operativo AI-native, automatización con IA y mutación— que se apila en un único modelo operativo empresarial en lugar de revertirse.",
  "Un modèle opérationnel en cinq couches — livraison itérative à grande échelle, cadre d'innovation reproductible, modèle opérationnel AI-native, automatisation par l'IA et mutation — qui s'empile en un seul modèle opérationnel d'entreprise au lieu de retomber."),
 "Framework-agnostic, SPCT-led implementation of a large-scale iterative operating model — value streams, fixed cadence, and Lean portfolio governance. We implement the scaling framework that fits: SAFe, Scrum@Scale, LeSS, Disciplined Agile, and more.": (
  "Implementación dirigida por SPCT e independiente del marco de un modelo operativo iterativo a gran escala: value streams, cadencia fija y gobernanza Lean de portafolio. Implementamos el marco de escalado que encaja: SAFe, Scrum@Scale, LeSS, Disciplined Agile y más.",
  "Implémentation dirigée par un SPCT et indépendante du cadre d'un modèle opérationnel itératif à grande échelle : value streams, cadence fixe et gouvernance Lean du portefeuille. Nous implémentons le cadre de mise à l'échelle qui convient : SAFe, Scrum@Scale, LeSS, Disciplined Agile et d'autres."),
 "SPCT-led adoption of an AI-Native operating model — AI woven into every role, ceremony, and workflow, with guardrails, human-in-the-loop governance, and the metrics to prove the productivity lift.": (
  "Adopción dirigida por SPCT de un modelo operativo AI-Native: IA integrada en cada rol, ceremonia y flujo de trabajo, con guardrails, gobernanza con intervención humana y las métricas que demuestran la mejora de productividad.",
  "Adoption dirigée par un SPCT d'un modèle opérationnel AI-Native : l'IA intégrée à chaque rôle, cérémonie et flux de travail, avec des guardrails, une gouvernance avec intervention humaine et les métriques qui prouvent le gain de productivité."),
 "SPCT-led design of end-to-end AI automation — agentic workflows, straight-through processing, and MLOps pipelines from commit to production, governed with human oversight. The technical backbone that turns AI pilots into shipped capability.": (
  "Diseño dirigido por SPCT de automatización con IA de extremo a extremo: flujos de trabajo agénticos, procesamiento directo y pipelines de MLOps del commit a producción, gobernados con supervisión humana. La base técnica que convierte los pilotos de IA en capacidad entregada.",
  "Conception dirigée par un SPCT d'une automatisation IA de bout en bout : workflows agentiques, traitement de bout en bout et pipelines MLOps du commit à la production, encadrés par une supervision humaine. Le socle technique qui transforme les pilotes d'IA en capacité livrée."),
 "SPCT-led build of an enterprise's mutation capability — the operating rhythm to sense, reconfigure, re-fund, and re-skill continuously, so the operating model keeps pace with markets and AI.": (
  "Construcción dirigida por SPCT de la capacidad de mutación de una empresa: el ritmo operativo para detectar, reconfigurar, refinanciar y recualificar de forma continua, de modo que el modelo operativo siga el ritmo de los mercados y de la IA.",
  "Construction dirigée par un SPCT de la capacité de mutation d'une entreprise : le rythme opérationnel pour détecter, reconfigurer, refinancer et requalifier en continu, afin que le modèle opérationnel suive le rythme des marchés et de l'IA."),
 "Scaling agile beyond a single team — and a single brand": (
  "Escalar la agilidad más allá de un solo equipo y de una sola marca",
  "Passer l'agilité à l'échelle au-delà d'une seule équipe — et d'une seule marque"),
 # credential name: a title, not copy
 "SAFe SPCT (SAFe Practice Consultant Trainer)": (
  "SAFe SPCT (SAFe Practice Consultant Trainer)",
  "SAFe SPCT (SAFe Practice Consultant Trainer)"),
 # short node names
 "Scaling Iterative Model": ("Scaling Iterative Model", "Scaling Iterative Model"),
 "AI-Native Operating Model": ("AI-Native Operating Model", "AI-Native Operating Model"),
 "AI Automation": ("AI Automation", "AI Automation"),
 "Mutation": ("Mutation", "Mutation"),
 "Agile Agilist": ("Agile Agilist", "Agile Agilist"),
 "Mark Saymen": ("Mark Saymen", "Mark Saymen"),
}
