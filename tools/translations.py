# -*- coding: utf-8 -*-
"""Fresh ES/FR translations for the segments the translation memory can't supply.

Everything else on these pages comes from tm.py, which harvests the wording
already live on the LPM / APM / SDP Spanish and French pages, so terminology
stays consistent with what's published.

Conventions taken from those live pages:
  · Product and credential names stay English  (SAFe® for Teams, SAFe DevOps)
  · Job-role card titles stay English          (System Architect, Team Lead)
  · Testimonial attributions stay English      (Mei L. · Team Lead, TD Bank)
  · Shortcodes and bare figures pass through untouched
  · SAFe jargon that the live pages keep in English stays English
    (Continuous Delivery Pipeline, release on demand, PI Planning, ART,
     Solution Intent, architecture runway, Built-In Quality, Test-First)
"""
import re

# Segments that must never be translated: shortcodes, bare numbers/figures,
# and the product / role / person names the live pages leave in English.
PASSTHROUGH_RE = re.compile(
    r'^\s*(?:'
    r'\[[a-z_]+[^\]]*\]'                       # [wp_events ...], [fluentform id="19"]
    r'|[\d.,]+\s*[KMx]?\s*[%+]?'               # 77%  2.2x  45,000+  850K+  28
    r'|\$[\d.,]+K?\+?'                         # $105K  $2,200
    r'|[A-Z]{2,6}'                             # SP  ARCH  ASE  CERT
    r')\s*$'
)

# English-by-convention on every language version of these pages.
KEEP_ENGLISH = {
    # product / credential names
    "SAFe® for Teams (SP)", "SAFe® for Teams", "SAFe® for Architects", "SAFe® ASE",
    "SAFe® for Teams · SAFe Practitioner (SP)", "SAFe® for Architects (ARCH)",
    "SAFe® Agile Software Engineering (ASE)", "for Architects",
    "SAFe Scrum Master", "Leading SAFe (SA)", "Advanced Scrum Master", "SAFe DevOps",
    "SAFe for Hardware Agilist", "SAFe Architect", "SAFe Agile Software Engineer",
    # role-card titles
    "Team Member", "Developer / Tester / Designer", "Team Lead", "Agile Practitioner",
    "System Architect", "Solution Architect", "Enterprise Architect", "Technical Lead",
    "Software Engineer", "Senior Engineer", "Tech Lead", "Staff / Principal Engineer",
    # testimonial attributions
    "Mei L. · Team Lead, TD Bank", "Greg A. · Sr. Developer, IBM",
    "Daniel R. · System Architect, Deloitte", "Priya N. · Enterprise Architect, IBM",
    "Marcus L. · Tech Lead, Accenture", "Sara K. · Staff Engineer, TD Bank",
}

# The ES/FR pages fold "training" into the preceding "…nuestra formación" /
# "…notre formation", so the standalone run becomes empty.
DROP = {"training"}

# Shared across all three courses.
COMMON = {
    "2,500+ CERTIFIED WITH US": (
        "2500+ CERTIFICADOS CON NOSOTROS",
        "2 500+ CERTIFIÉS AVEC NOUS"),
    "&larr; Back to SAFe by Industry": (
        "&larr; Volver a SAFe por industria",
        "&larr; Retour à SAFe par secteur"),
}

T = {}

# ---------------------------------------------------------------- SP
T["SP"] = {
    "SAFe Practitioner Cert.": (
        "Certificación SAFe Practitioner", "Certification SAFe Practitioner"),
    "Industry · SP": ("Industria · SP", "Secteur · SP"),
    "2 days · Live-virtual · 16 PDUs · No prerequisites": (
        "2 días · En vivo-virtual · 16 PDUs · Sin requisitos previos",
        "2 jours · En direct-virtuel · 16 PDUs · Sans prérequis"),
    "Become a high-performing member of an Agile team in a SAFe enterprise — plan and execute work in iterations, deliver value in a Program Increment, and improve continuously, with an authorised SAFe instructor (SPC/ASPC).": (
        "Conviértete en un miembro de alto rendimiento de un equipo Agile en una empresa SAFe: planifica y ejecuta el trabajo en iteraciones, entrega valor en un Program Increment y mejora de forma continua, junto a un instructor SAFe autorizado (SPC/ASPC).",
        "Devenez un membre performant d'une équipe Agile dans une entreprise SAFe : planifiez et exécutez le travail en itérations, livrez de la valeur dans un Program Increment et améliorez-vous en continu, avec un instructeur SAFe autorisé (SPC/ASPC)."),
    "SAFe SP · verifiable digital badge": (
        "SAFe SP · insignia digital verificable", "SAFe SP · badge numérique vérifiable"),
    "Two full days in a live virtual classroom with an authorised SAFe instructor (SPC/ASPC) — not a recording.": (
        "Dos días completos en un aula virtual en vivo con un instructor SAFe autorizado (SPC/ASPC), no una grabación.",
        "Deux jours complets dans une salle de classe virtuelle en direct avec un instructeur SAFe autorisé (SPC/ASPC) — pas un enregistrement."),
    # curriculum
    "Introducing the SAFe Practitioner": (
        "Presentación del SAFe Practitioner", "Présentation du SAFe Practitioner"),
    "Your role on an Agile team within an Agile Release Train.": (
        "Tu rol en un equipo Agile dentro de un Agile Release Train.",
        "Votre rôle au sein d'une équipe Agile dans un Agile Release Train."),
    "Building an Agile team": ("Construir un equipo Agile", "Constituer une équipe Agile"),
    "Form a cross-functional team and establish ways of working.": (
        "Forma un equipo multifuncional y establece las formas de trabajo.",
        "Formez une équipe pluridisciplinaire et définissez les modes de travail."),
    "Planning the Iteration": ("Planificar la iteración", "Planifier l'itération"),
    "Refine stories, set iteration goals, and plan with the team.": (
        "Refina historias, define los objetivos de la iteración y planifica con el equipo.",
        "Affinez les stories, fixez les objectifs d'itération et planifiez avec l'équipe."),
    "Executing the Iteration": ("Ejecutar la iteración", "Exécuter l'itération"),
    "Run iteration events, swarm on impediments, and ship value.": (
        "Facilita los eventos de la iteración, resuelve impedimentos en equipo y entrega valor.",
        "Animez les événements d'itération, traitez les obstacles en groupe et livrez de la valeur."),
    "Planning the Program Increment": (
        "Planificar el Program Increment", "Planifier le Program Increment"),
    "Participate effectively in PI Planning.": (
        "Participa de forma eficaz en el PI Planning.",
        "Participez efficacement au PI Planning."),
    "Delivering value continuously": (
        "Entregar valor de forma continua", "Livrer de la valeur en continu"),
    "Build quality in and contribute to the Continuous Delivery Pipeline.": (
        "Integra la calidad desde el origen y contribuye al Continuous Delivery Pipeline.",
        "Intégrez la qualité dès la conception et contribuez au Continuous Delivery Pipeline."),
    # demand band
    "SAFe Practitioners are in": (
        "Los SAFe Practitioners tienen", "Les SAFe Practitioners sont"),
    "of SAFe ARTs require SP for team members": (
        "de los ARTs SAFe exigen SP a los miembros del equipo",
        "des ARTs SAFe exigent la certification SP pour les membres d'équipe"),
    "Median salary · $85K–$130K US": (
        "Salario medio · $85K–$130K EE. UU.", "Salaire médian du poste · $85K–$130K É.-U."),
    "Active SP-certified professionals": (
        "Profesionales con certificación SP activa",
        "Professionnels certifiés SP en activité"),
    "Premium over non-Agile team members": (
        "Diferencial frente a miembros de equipo no Agile",
        "Écart de rémunération par rapport aux équipiers non Agile"),
    "Open SAFe team roles · US & Canada": (
        "Ofertas de equipo SAFe activas · EE. UU. y Canadá",
        "Postes d'équipe SAFe ouverts · É.-U. et Canada"),
    # role cards
    "Works on an Agile team in an ART.": (
        "Trabaja en un equipo Agile dentro de un ART.",
        "Travaille au sein d'une équipe Agile dans un ART."),
    "Builds quality in across the iteration.": (
        "Integra la calidad a lo largo de la iteración.",
        "Intègre la qualité tout au long de l'itération."),
    "Coaches the team and removes impediments.": (
        "Acompaña al equipo y elimina impedimentos.",
        "Accompagne l'équipe et lève les obstacles."),
    "Applies SAFe in day-to-day team work.": (
        "Aplica SAFe en el trabajo diario del equipo.",
        "Applique SAFe dans le travail quotidien de l'équipe."),
    # cross-sell + CTA
    "Other foundational SAFe certifications": (
        "Otras certificaciones SAFe fundamentales",
        "Autres certifications SAFe fondamentales"),
    "Advance to your next role": (
        "Avanza hacia tu siguiente rol", "Évoluez vers votre prochain rôle"),
    "Live 2-day course": ("Curso en vivo de 2 días", "Cours en direct de 2 jours"),
    # testimonials
    "Easily the most practical SP training I’ve taken. The instructor brought real enterprise experience and the toolkits were immediately useful back at work. Passed the exam first attempt.": (
        "Sin duda la formación SP más práctica que he hecho. El instructor aportó experiencia real de empresa y las herramientas fueron útiles de inmediato al volver al trabajo. Aprobé el examen a la primera.",
        "De loin la formation SP la plus pratique que j'ai suivie. L'instructeur apportait une vraie expérience en entreprise et les outils ont été immédiatement utiles de retour au travail. Examen réussi du premier coup."),
    "Clear, hands-on, and well paced. I left with a credential and a concrete plan to apply SP in my organisation. Highly recommended.": (
        "Clara, práctica y bien ritmada. Salí con una credencial y un plan concreto para aplicar SP en mi organización. Muy recomendable.",
        "Claire, pratique et bien rythmée. Je suis reparti avec une certification et un plan concret pour appliquer SP dans mon organisation. Vivement recommandé."),
    # FAQ
    "No hard prerequisites. Once you register you gain access to online prep material (about 90 minutes) to review before class, so you arrive ready for SAFe® for Teams · SAFe Practitioner (SP).": (
        "No hay requisitos previos obligatorios. Al inscribirte obtienes acceso al material de preparación en línea (unos 90 minutos) para repasar antes de la clase, de modo que llegues preparado a SAFe® for Teams · SAFe Practitioner (SP).",
        "Aucun prérequis strict. Dès votre inscription, vous obtenez l'accès au matériel de préparation en ligne (environ 90 minutes) à parcourir avant le cours, afin d'arriver prêt pour SAFe® for Teams · SAFe Practitioner (SP)."),
    "45 multiple-choice, 90 minutes, passing score 77%. Your first attempt is included. Taken online with a 60-day access window. See the official": (
        "45 preguntas de opción múltiple, 90 minutos, nota de aprobado 77%. El primer intento está incluido. Se realiza en línea con una ventana de acceso de 60 días. Consulta la",
        "45 questions à choix multiple, 90 minutes, note de réussite 77%. La première tentative est incluse. Passé en ligne avec une fenêtre d'accès de 60 jours. Consultez le"),
    "SP exam study guide": (
        "guía de estudio oficial del examen SP", "guide d'étude officiel de l'examen SP"),
    "What will I be able to do after SP?": (
        "¿Qué podré hacer después de SP?", "Que pourrai-je faire après SP ?"),
    "You’ll be equipped to apply SAFe® for Teams · SAFe Practitioner (SP) in a real SAFe environment — working effectively on an Agile team inside an Agile Release Train.": (
        "Estarás preparado para aplicar SAFe® for Teams · SAFe Practitioner (SP) en un entorno SAFe real, trabajando de forma eficaz en un equipo Agile dentro de un Agile Release Train.",
        "Vous serez en mesure d'appliquer SAFe® for Teams · SAFe Practitioner (SP) dans un environnement SAFe réel, en travaillant efficacement au sein d'une équipe Agile dans un Agile Release Train."),
    "Where can SP take my career?": (
        "¿Hasta dónde puede llevar SP mi carrera?",
        "Jusqu'où SP peut-il mener ma carrière ?"),
    "It supports roles such as Team Member, Developer / Tester / Designer, Team Lead, Agile Practitioner, and is a stepping stone to advanced and consultant SAFe credentials.": (
        "Da soporte a roles como Team Member, Developer / Tester / Designer, Team Lead y Agile Practitioner, y es un paso previo hacia las credenciales SAFe avanzadas y de consultor.",
        "Elle soutient des rôles tels que Team Member, Developer / Tester / Designer, Team Lead et Agile Practitioner, et constitue un tremplin vers les certifications SAFe avancées et de consultant."),
}

# ---------------------------------------------------------------- ARCH
T["ARCH"] = {
    "SAFe Architect Cert.": (
        "Certificación SAFe Architect", "Certification SAFe Architect"),
    "Industry · ARCH": ("Industria · ARCH", "Secteur · ARCH"),
    "Lead the technical strategy of a Lean-Agile enterprise — align architecture with business value, drive Continuous Delivery, and grow a community of architects, with an authorised SAFe instructor (SPC/ASPC).": (
        "Lidera la estrategia técnica de una empresa Lean-Agile: alinea la arquitectura con el valor de negocio, impulsa la Continuous Delivery y haz crecer una comunidad de arquitectos, junto a un instructor SAFe autorizado (SPC/ASPC).",
        "Pilotez la stratégie technique d'une entreprise Lean-Agile : alignez l'architecture sur la valeur métier, favorisez la Continuous Delivery et développez une communauté d'architectes, avec un instructeur SAFe autorisé (SPC/ASPC)."),
    "SAFe ARCH · verifiable digital badge": (
        "SAFe ARCH · insignia digital verificable", "SAFe ARCH · badge numérique vérifiable"),
    # curriculum
    "Exemplifying Lean-Agile Architecture": (
        "Ejemplificar la arquitectura Lean-Agile", "Incarner l'architecture Lean-Agile"),
    "How architecture supports business agility and Lean-Agile principles.": (
        "Cómo la arquitectura sustenta la agilidad de negocio y los principios Lean-Agile.",
        "Comment l'architecture soutient l'agilité métier et les principes Lean-Agile."),
    "Architecting for DevOps & Release on Demand": (
        "Arquitectura para DevOps y Release on Demand",
        "Concevoir l'architecture pour DevOps et le Release on Demand"),
    "Enable Continuous Delivery and Release on Demand through architectural choices.": (
        "Habilita la Continuous Delivery y el release on demand mediante decisiones de arquitectura.",
        "Rendez possibles la Continuous Delivery et le release on demand par vos choix d'architecture."),
    "Aligning Architecture with Business Value": (
        "Alinear la arquitectura con el valor de negocio",
        "Aligner l'architecture sur la valeur métier"),
    "Connect enabler work to value streams, themes, and OKRs.": (
        "Conecta el trabajo enabler con los value streams, los temas y los OKR.",
        "Reliez le travail enabler aux value streams, aux thèmes et aux OKR."),
    "Developing Solution Vision, Intent and Roadmaps": (
        "Desarrollar Solution Vision, Solution Intent y roadmaps",
        "Élaborer la Solution Vision, le Solution Intent et les roadmaps"),
    "Lead with Solution Intent, Solution Vision, and roadmaps that scale.": (
        "Lidera con Solution Intent, Solution Vision y roadmaps que escalan.",
        "Pilotez avec le Solution Intent, la Solution Vision et des roadmaps qui passent à l'échelle."),
    "Preparing Architecture for PI Planning": (
        "Preparar la arquitectura para el PI Planning",
        "Préparer l'architecture pour le PI Planning"),
    "Prepare enabler features and architecture runway for PI Planning.": (
        "Prepara las enabler features y la architecture runway para el PI Planning.",
        "Préparez les enabler features et l'architecture runway pour le PI Planning."),
    "Coordinating Architecture across the ART": (
        "Coordinar la arquitectura en todo el ART",
        "Coordonner l'architecture à l'échelle de l'ART"),
    "Lead the architecture community, system teams, and shared services.": (
        "Lidera la comunidad de arquitectura, los system teams y los shared services.",
        "Animez la communauté d'architecture, les system teams et les shared services."),
    # demand band
    "SAFe Architects are in": (
        "Los SAFe Architects tienen", "Les SAFe Architects sont"),
    "of SAFe enterprises have a dedicated System Architect": (
        "de las empresas SAFe cuentan con un System Architect dedicado",
        "des entreprises SAFe disposent d'un System Architect dédié"),
    "Median salary · $150K–$215K US": (
        "Salario medio · $150K–$215K EE. UU.", "Salaire médian du poste · $150K–$215K É.-U."),
    "Architects working in SAFe environments": (
        "Arquitectos trabajando en entornos SAFe",
        "Architectes travaillant dans des environnements SAFe"),
    "Premium over non-SAFe architects": (
        "Diferencial frente a arquitectos sin SAFe",
        "Écart de rémunération par rapport aux architectes non SAFe"),
    "Open architect roles · US & Canada": (
        "Ofertas de arquitecto activas · EE. UU. y Canadá",
        "Postes d'architecte ouverts · É.-U. et Canada"),
    # role cards
    "Owns architecture across an ART.": (
        "Es responsable de la arquitectura de un ART.",
        "Porte l'architecture à l'échelle d'un ART."),
    "Leads architecture across multiple ARTs.": (
        "Lidera la arquitectura en varios ARTs.",
        "Pilote l'architecture sur plusieurs ARTs."),
    "Aligns architecture to enterprise strategy.": (
        "Alinea la arquitectura con la estrategia de la empresa.",
        "Aligne l'architecture sur la stratégie de l'entreprise."),
    "Coaches technical practices on a team.": (
        "Acompaña las prácticas técnicas de un equipo.",
        "Accompagne les pratiques techniques d'une équipe."),
    "Advance your architect path": (
        "Avanza en tu ruta de arquitectura",
        "Faites progresser votre parcours d'architecte"),
    # testimonials
    "Easily the most practical ARCH training I’ve taken. The instructor brought real enterprise experience and the toolkits were immediately useful back at work. Passed the exam first attempt.": (
        "Sin duda la formación ARCH más práctica que he hecho. El instructor aportó experiencia real de empresa y las herramientas fueron útiles de inmediato al volver al trabajo. Aprobé el examen a la primera.",
        "De loin la formation ARCH la plus pratique que j'ai suivie. L'instructeur apportait une vraie expérience en entreprise et les outils ont été immédiatement utiles de retour au travail. Examen réussi du premier coup."),
    "Clear, hands-on, and well paced. I left with a credential and a concrete plan to apply ARCH in my organisation. Highly recommended.": (
        "Clara, práctica y bien ritmada. Salí con una credencial y un plan concreto para aplicar ARCH en mi organización. Muy recomendable.",
        "Claire, pratique et bien rythmée. Je suis reparti avec une certification et un plan concret pour appliquer ARCH dans mon organisation. Vivement recommandé."),
    # FAQ
    "No hard prerequisites. Once you register you gain access to online prep material (about 90 minutes) to review before class, so you arrive ready for SAFe® for Architects (ARCH).": (
        "No hay requisitos previos obligatorios. Al inscribirte obtienes acceso al material de preparación en línea (unos 90 minutos) para repasar antes de la clase, de modo que llegues preparado a SAFe® for Architects (ARCH).",
        "Aucun prérequis strict. Dès votre inscription, vous obtenez l'accès au matériel de préparation en ligne (environ 90 minutes) à parcourir avant le cours, afin d'arriver prêt pour SAFe® for Architects (ARCH)."),
    "45 multiple-choice, 90 minutes, passing score 80%. Your first attempt is included. Taken online with a 60-day access window. See the official": (
        "45 preguntas de opción múltiple, 90 minutos, nota de aprobado 80%. El primer intento está incluido. Se realiza en línea con una ventana de acceso de 60 días. Consulta la",
        "45 questions à choix multiple, 90 minutes, note de réussite 80%. La première tentative est incluse. Passé en ligne avec une fenêtre d'accès de 60 jours. Consultez le"),
    "ARCH exam study guide": (
        "guía de estudio oficial del examen ARCH", "guide d'étude officiel de l'examen ARCH"),
    "What will I be able to do after ARCH?": (
        "¿Qué podré hacer después de ARCH?", "Que pourrai-je faire après ARCH ?"),
    "You’ll be equipped to apply SAFe® for Architects (ARCH) in a real SAFe environment — aligning architecture with business value and leading enabler work in an ART.": (
        "Estarás preparado para aplicar SAFe® for Architects (ARCH) en un entorno SAFe real, alineando la arquitectura con el valor de negocio y liderando el trabajo enabler en un ART.",
        "Vous serez en mesure d'appliquer SAFe® for Architects (ARCH) dans un environnement SAFe réel, en alignant l'architecture sur la valeur métier et en pilotant le travail enabler au sein d'un ART."),
    "Where can ARCH take my career?": (
        "¿Hasta dónde puede llevar ARCH mi carrera?",
        "Jusqu'où ARCH peut-il mener ma carrière ?"),
    "It supports roles such as System Architect, Solution Architect, Enterprise Architect, Technical Lead, and is a stepping stone to advanced and consultant SAFe credentials.": (
        "Da soporte a roles como System Architect, Solution Architect, Enterprise Architect y Technical Lead, y es un paso previo hacia las credenciales SAFe avanzadas y de consultor.",
        "Elle soutient des rôles tels que System Architect, Solution Architect, Enterprise Architect et Technical Lead, et constitue un tremplin vers les certifications SAFe avancées et de consultant."),
}

# ---------------------------------------------------------------- ASE
T["ASE"] = {
    "Agile Software Engineering Cert.": (
        "Certificación Agile Software Engineering",
        "Certification Agile Software Engineering"),
    "Industry · ASE": ("Industria · ASE", "Secteur · ASE"),
    "4 days · Live-virtual · 16 PDUs / SEUs · No prerequisites": (
        "4 días · En vivo-virtual · 16 PDUs / SEUs · Sin requisitos previos",
        "4 jours · En direct-virtuel · 16 PDUs / SEUs · Sans prérequis"),
    "Build quality in — apply Behavior-Driven Development, Test-First, Continuous Integration, and Continuous Delivery to ship faster with confidence, with an authorised SAFe instructor (SPC/ASPC).": (
        "Integra la calidad desde el origen: aplica Behavior-Driven Development, Test-First, Continuous Integration y Continuous Delivery para entregar más rápido y con confianza, junto a un instructor SAFe autorizado (SPC/ASPC).",
        "Intégrez la qualité dès la conception : appliquez le Behavior-Driven Development, le Test-First, l'intégration continue et la Continuous Delivery pour livrer plus vite et en confiance, avec un instructeur SAFe autorisé (SPC/ASPC)."),
    "SAFe ASE · verifiable digital badge": (
        "SAFe ASE · insignia digital verificable", "SAFe ASE · badge numérique vérifiable"),
    "Four full days in a live virtual classroom with an authorised SAFe instructor (SPC/ASPC) — not a recording.": (
        "Cuatro días completos en un aula virtual en vivo con un instructor SAFe autorizado (SPC/ASPC), no una grabación.",
        "Quatre jours complets dans une salle de classe virtuelle en direct avec un instructeur SAFe autorisé (SPC/ASPC) — pas un enregistrement."),
    "( 02 ) — Curriculum · 4 days": (
        "( 02 ) — Programa · 4 días", "( 02 ) — Programme · 4 jours"),
    # curriculum
    "Introducing Agile Software Engineering": (
        "Presentación de Agile Software Engineering",
        "Présentation de l'Agile Software Engineering"),
    "Why engineering quality is the foundation of business agility.": (
        "Por qué la calidad de ingeniería es la base de la agilidad de negocio.",
        "Pourquoi la qualité d'ingénierie est le socle de l'agilité métier."),
    "Connecting principles & practices to Built-In Quality": (
        "Conectar principios y prácticas con la Built-In Quality",
        "Relier principes et pratiques à la Built-In Quality"),
    "How Lean-Agile principles drive built-in quality at every level.": (
        "Cómo los principios Lean-Agile impulsan la calidad integrada en todos los niveles.",
        "Comment les principes Lean-Agile favorisent la qualité intégrée à tous les niveaux."),
    "Accelerating flow with eXtreme Programming": (
        "Acelerar el flujo con eXtreme Programming",
        "Accélérer le flux avec l'eXtreme Programming"),
    "Pair work, refactoring, and continuous improvement on a team.": (
        "Trabajo en pareja, refactorización y mejora continua en el equipo.",
        "Travail en binôme, refactoring et amélioration continue au sein de l'équipe."),
    "Applying intentional design": (
        "Aplicar el diseño intencional", "Appliquer la conception intentionnelle"),
    "Emergent design, architecture runway, and design patterns.": (
        "Diseño emergente, architecture runway y patrones de diseño.",
        "Conception émergente, architecture runway et patrons de conception."),
    "Implementing Test-First": (
        "Implementar Test-First", "Mettre en œuvre le Test-First"),
    "BDD and TDD — write tests before code, ship with confidence.": (
        "BDD y TDD: escribe las pruebas antes que el código y entrega con confianza.",
        "BDD et TDD : écrivez les tests avant le code et livrez en confiance."),
    "Building the Continuous Delivery Pipeline": (
        "Construir el Continuous Delivery Pipeline",
        "Construire le Continuous Delivery Pipeline"),
    "Develop, integrate, deploy, and release with DevOps practices.": (
        "Desarrolla, integra, despliega y libera con prácticas DevOps.",
        "Développez, intégrez, déployez et livrez avec les pratiques DevOps."),
    # demand band
    "Agile Software Engineers are in": (
        "Los Agile Software Engineers tienen", "Les Agile Software Engineers sont"),
    "of SAFe ARTs adopt Built-In Quality practices": (
        "de los ARTs SAFe adoptan prácticas de Built-In Quality",
        "des ARTs SAFe adoptent les pratiques de Built-In Quality"),
    "Median engineer salary · $120K–$185K US": (
        "Salario medio de ingeniería · $120K–$185K EE. UU.",
        "Salaire médian en ingénierie · $120K–$185K É.-U."),
    "Throughput vs non-Agile engineers": (
        "Rendimiento frente a ingenieros no Agile",
        "Débit par rapport aux ingénieurs non Agile"),
    "Lower defect rates with Test-First": (
        "Menos defectos con Test-First", "Moins de défauts grâce au Test-First"),
    "Open ASE roles · US & Canada": (
        "Ofertas de ASE activas · EE. UU. y Canadá",
        "Postes ASE ouverts · É.-U. et Canada"),
    # role cards
    "Builds quality into every iteration.": (
        "Integra la calidad en cada iteración.",
        "Intègre la qualité à chaque itération."),
    "Drives engineering excellence on the team.": (
        "Impulsa la excelencia de ingeniería en el equipo.",
        "Porte l'excellence technique au sein de l'équipe."),
    "Coaches engineering practice across teams.": (
        "Acompaña la práctica de ingeniería en varios equipos.",
        "Accompagne la pratique d'ingénierie sur plusieurs équipes."),
    "Sets engineering direction for the ART.": (
        "Define la dirección de ingeniería del ART.",
        "Définit l'orientation technique de l'ART."),
    "Adjacent engineering certifications": (
        "Certificaciones de ingeniería adyacentes",
        "Certifications techniques adjacentes"),
    "Advance your engineering path": (
        "Avanza en tu ruta de ingeniería",
        "Faites progresser votre parcours d'ingénierie"),
    "Live 4-day course": ("Curso en vivo de 4 días", "Cours en direct de 4 jours"),
    # testimonials
    "Easily the most practical ASE training I’ve taken. The instructor brought real enterprise experience and the toolkits were immediately useful back at work. Passed the exam first attempt.": (
        "Sin duda la formación ASE más práctica que he hecho. El instructor aportó experiencia real de empresa y las herramientas fueron útiles de inmediato al volver al trabajo. Aprobé el examen a la primera.",
        "De loin la formation ASE la plus pratique que j'ai suivie. L'instructeur apportait une vraie expérience en entreprise et les outils ont été immédiatement utiles de retour au travail. Examen réussi du premier coup."),
    "Clear, hands-on, and well paced. I left with a credential and a concrete plan to apply ASE in my organisation. Highly recommended.": (
        "Clara, práctica y bien ritmada. Salí con una credencial y un plan concreto para aplicar ASE en mi organización. Muy recomendable.",
        "Claire, pratique et bien rythmée. Je suis reparti avec une certification et un plan concret pour appliquer ASE dans mon organisation. Vivement recommandé."),
    # FAQ
    "No hard prerequisites. Once you register you gain access to online prep material (about 90 minutes) to review before class, so you arrive ready for SAFe® Agile Software Engineering (ASE).": (
        "No hay requisitos previos obligatorios. Al inscribirte obtienes acceso al material de preparación en línea (unos 90 minutos) para repasar antes de la clase, de modo que llegues preparado a SAFe® Agile Software Engineering (ASE).",
        "Aucun prérequis strict. Dès votre inscription, vous obtenez l'accès au matériel de préparation en ligne (environ 90 minutes) à parcourir avant le cours, afin d'arriver prêt pour SAFe® Agile Software Engineering (ASE)."),
    "45 multiple-choice, 90 minutes, passing score 73%. Your first attempt is included. Taken online with a 60 days after class window.": (
        "45 preguntas de opción múltiple, 90 minutos, nota de aprobado 73%. El primer intento está incluido. Se realiza en línea con una ventana de 60 días tras la clase.",
        "45 questions à choix multiple, 90 minutes, note de réussite 73%. La première tentative est incluse. Passé en ligne avec une fenêtre de 60 jours après le cours."),
    "What will I be able to do after ASE?": (
        "¿Qué podré hacer después de ASE?", "Que pourrai-je faire après ASE ?"),
    "You’ll be equipped to apply SAFe® Agile Software Engineering (ASE) in a real SAFe environment — writing better tests, shipping faster, and growing the continuous delivery pipeline.": (
        "Estarás preparado para aplicar SAFe® Agile Software Engineering (ASE) en un entorno SAFe real: escribir mejores pruebas, entregar más rápido y hacer crecer el continuous delivery pipeline.",
        "Vous serez en mesure d'appliquer SAFe® Agile Software Engineering (ASE) dans un environnement SAFe réel : écrire de meilleurs tests, livrer plus vite et développer le continuous delivery pipeline."),
    "Where can ASE take my career?": (
        "¿Hasta dónde puede llevar ASE mi carrera?",
        "Jusqu'où ASE peut-il mener ma carrière ?"),
    "It supports roles such as Software Engineer, Senior Engineer, Tech Lead, Staff / Principal Engineer, and is a stepping stone to advanced and consultant SAFe credentials.": (
        "Da soporte a roles como Software Engineer, Senior Engineer, Tech Lead y Staff / Principal Engineer, y es un paso previo hacia las credenciales SAFe avanzadas y de consultor.",
        "Elle soutient des rôles tels que Software Engineer, Senior Engineer, Tech Lead et Staff / Principal Engineer, et constitue un tremplin vers les certifications SAFe avancées et de consultant."),
}

for _c in T:
    T[_c].update(COMMON)

# The "Your SAFe career path" sentence is identical on every EN course page and
# names SPC regardless of the course. Translate it to each course's own
# positioning rather than carrying the defect across, and never let the
# translation memory answer it — TM learned LPM's wording as if it were
# boilerplate, which is exactly how this spread.
import crosssell as _cs
_EN_DEFECT = _cs.sentence("SPC", "en")
for _c in T:
    T[_c][_EN_DEFECT] = (_cs.sentence(_c, "es"), _cs.sentence(_c, "fr"))

# JSON-LD: Course name / description / url / instructor, per course and language.
SCHEMA = {
    "SP": {
        "slug": "team-practitioner",
        "es": ("Certificación SAFe® for Teams · SAFe Practitioner (SP)",
               "Conviértete en un miembro de equipo SAFe de alto rendimiento: planifica, ejecuta y mejora el trabajo en iteraciones y PIs. En vivo-virtual, examen incluido."),
        "fr": ("Certification SAFe® for Teams · SAFe Practitioner (SP)",
               "Devenez un membre d'équipe SAFe performant — planifiez, exécutez et améliorez le travail en itérations et en PI. En direct-virtuel, examen inclus."),
    },
    "ARCH": {
        "slug": "arch",
        "es": ("Certificación SAFe® for Architects (ARCH)",
               "Lidera la arquitectura empresarial en SAFe: alinea la arquitectura con el valor y impulsa la entrega continua. En vivo-virtual, examen incluido."),
        "fr": ("Certification SAFe® for Architects (ARCH)",
               "Pilotez l'architecture d'entreprise dans SAFe : alignez l'architecture sur la valeur et favorisez la livraison continue. En direct-virtuel, examen inclus."),
    },
    "ASE": {
        "slug": "ase",
        "es": ("Certificación SAFe® Agile Software Engineering (ASE)",
               "Integra la calidad desde el origen con BDD, Test-First, CI/CD y entrega continua en un entorno SAFe. En vivo-virtual, examen incluido."),
        "fr": ("Certification SAFe® Agile Software Engineering (ASE)",
               "Intégrez la qualité dès la conception avec le BDD, le Test-First, la CI/CD et la livraison continue dans un environnement SAFe. En direct-virtuel, examen inclus."),
    },
}
INSTRUCTOR = {"es": "Instructor SAFe autorizado (SPC/ASPC)",
              "fr": "Instructeur SAFe autorisé (SPC/ASPC)"}


def lookup(course, seg, lang):
    """Return the translated text, or None if the caller should keep the source."""
    if seg in DROP:
        return ""
    if seg in KEEP_ENGLISH or PASSTHROUGH_RE.match(seg):
        return seg
    pair = T.get(course, {}).get(seg)
    if pair:
        return pair[0] if lang == "es" else pair[1]
    return None
