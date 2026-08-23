# -*- coding: utf-8 -*-
"""ES/FR copy for the v3 home page (the redesign).

Keys are entity-normalised: gen_home3 unescapes the source segment before it
looks it up, so "&mdash;" and "—" reach this table as the same key and one
entry serves both the text node and the JSON payload that carries the same
sentence.

translations_home.HOME is consulted first, so anything the previous homepage
already said keeps saying it. Only genuinely new copy lives here.

KEEP is everything that must survive untranslated: certification names, the
five dimension layer names, and the assessment product names. That matches the
ES/FR pages already published — "SAFe Release Train Engineer" and "Mutation"
are the names of things, not phrases.
"""

KEEP = {
    "$70M+", "MLOps", "NIST AI RMF", "SAFe / LeSS", "Lean startup",
    # Five Dimensions layer names — untranslated on the ES/FR layer pages too
    "Mutation", "AI Automation", "AI-Native", "Innovation Culture",
    "Scaling Iterative Model",
    # assessment product names
    "AI Maturity & Readiness",
}

# Figures the noise filter skips (they are all digits and punctuation) but that
# still need localising: ES and FR do not group thousands with a comma.
NUM = {
    "2,500+": ("2500+", "2 500+"),
}

V3 = {
 # ---- section 01 hero ----
 "$70M+ saved · 80+ ARTs launched · 2,500+ trained": (
   "$70M+ ahorrados · 80+ ARTs lanzados · 2500+ formados",
   "70 M$+ économisés · 80+ ARTs lancés · 2 500+ formés"),
 "Live, instructor-led SAFe® certification and AI-Native training that gets professionals hired and promoted — and SPCT-led consulting that transforms Fortune 500s, governments, and global enterprises.": (
   "Formación en vivo con instructor para certificaciones SAFe® y AI-Native que consigue que los profesionales sean contratados y promocionados, y consultoría dirigida por SPCT que transforma empresas Fortune 500, gobiernos y grandes corporaciones.",
   "Formations certifiantes SAFe® et AI-Native en direct avec instructeur, qui permettent aux professionnels d'être recrutés et promus, et conseil dirigé par un SPCT qui transforme des entreprises du Fortune 500, des administrations et de grands groupes."),
 "Browse SAFe certifications ⟶": (
   "Ver certificaciones SAFe &#10230;", "Découvrir les certifications SAFe &#10230;"),
 "2,500+ certified": ("2500+ certificados", "2 500+ certifiés"),
 "19 SAFe certs": ("19 certificaciones SAFe", "19 certifications SAFe"),
 "Free assessment ⟶": ("Evaluación gratuita &#10230;", "Évaluation gratuite &#10230;"),
 "Upcoming cohorts": ("Próximas convocatorias", "Prochaines sessions"),
 "All dates ⟶": ("Todas las fechas &#10230;", "Toutes les dates &#10230;"),

 # ---- section 02 all training ----
 "View track ⟶": ("Ver itinerario &#10230;", "Voir le parcours &#10230;"),
 "RTE, LPM, APM, SPC, ASPC — enterprise transformation leadership.": (
   "RTE, LPM, APM, SPC, ASPC: liderazgo de transformación corporativa.",
   "RTE, LPM, APM, SPC, ASPC — le leadership de la transformation d'entreprise."),
 "Every track maps to a role, a salary band, and a cohort date —": (
   "Cada itinerario se corresponde con un rol, una banda salarial y una fecha de convocatoria:",
   "Chaque parcours correspond à un rôle, une fourchette salariale et une date de session —"),
 "see all 19 certifications ⟶": (
   "ver las 19 certificaciones &#10230;", "voir les 19 certifications &#10230;"),

 # ---- section 03 assessments ----
 "( 03 ) — Assessments": ("( 03 ) &mdash; Evaluaciones", "( 03 ) &mdash; Évaluations"),
 "Measure first.": ("Primero mide.", "Mesurez d'abord."),
 "Then move.": ("Después actúa.", "Puis avancez."),

 "Seven questions on your role, experience, and goals. Get a personalized 12-month cert roadmap with the salary upside for each step.": (
   "Siete preguntas sobre tu rol, tu experiencia y tus objetivos. Obtén una hoja de ruta de certificaciones a 12 meses con el incremento salarial de cada paso.",
   "Sept questions sur votre rôle, votre expérience et vos objectifs. Obtenez une feuille de route de certifications sur 12 mois, avec le gain salarial de chaque étape."),
 "Role fit": ("Ajuste al rol", "Adéquation au rôle"),
 "Cert readiness": ("Preparación para certificar", "Préparation à la certification"),
 "Salary upside": ("Incremento salarial", "Gain salarial"),

 "Eighteen questions across six capability dimensions — framework-agnostic. Measures muscles, not rituals.": (
   "Dieciocho preguntas en seis dimensiones de capacidad, sin depender de ningún marco. Mide músculo real, no rituales.",
   "Dix-huit questions sur six dimensions de capacité, indépendamment du framework. Mesure les muscles, pas les rituels."),
 "Delivery": ("Entrega", "Livraison"),
 "Collaboration": ("Colaboración", "Collaboration"),
 "Adaptability": ("Adaptabilidad", "Adaptabilité"),

 "A board-level, 24-question diagnostic grounded in OECD, NIST AI RMF, and Gartner — baseline your teams, roles, and governance.": (
   "Un diagnóstico de 24 preguntas para el comité de dirección, basado en la OCDE, el NIST AI RMF y Gartner: establece la línea base de tus equipos, roles y gobernanza.",
   "Un diagnostic de 24 questions au niveau du comité de direction, fondé sur l'OCDE, le NIST AI RMF et Gartner — établissez la ligne de base de vos équipes, rôles et gouvernance."),
 "Governance": ("Gobernanza", "Gouvernance"),
 "Adoption": ("Adopción", "Adoption"),
 "Data readiness": ("Preparación de datos", "Maturité des données"),

 "Benchmark discovery, delivery, and strategy against modern product operating models.": (
   "Compara descubrimiento, entrega y estrategia con los modelos operativos de producto actuales.",
   "Comparez découverte, livraison et stratégie aux modèles opérationnels produit actuels."),
 "Discovery": ("Descubrimiento", "Découverte"),
 "Strategy": ("Estrategia", "Stratégie"),

 "Score how reliably your organization turns ideas into shipped value — on cadence, not by accident.": (
   "Mide con qué fiabilidad tu organización convierte ideas en valor entregado: con cadencia, no por casualidad.",
   "Mesurez la fiabilité avec laquelle votre organisation transforme les idées en valeur livrée — à cadence, et non par hasard."),
 "Idea flow": ("Flujo de ideas", "Flux d'idées"),
 "Cadence": ("Cadencia", "Cadence"),
 "Funding": ("Financiación", "Financement"),

 "How ready is your operating model to redesign itself? Baseline your continuous-change muscle.": (
   "¿Hasta qué punto tu modelo operativo está preparado para rediseñarse a sí mismo? Establece la línea base de tu músculo de cambio continuo.",
   "Votre modèle opérationnel est-il prêt à se redessiner lui-même ? Établissez la ligne de base de votre muscle de changement continu."),
 "Sensing": ("Detección", "Détection"),
 "Redesign speed": ("Velocidad de rediseño", "Vitesse de refonte"),
 "Learning loops": ("Bucles de aprendizaje", "Boucles d'apprentissage"),

 "Rate four dimensions of enterprise agile maturity and get an instant profile with what to build next.": (
   "Puntúa cuatro dimensiones de madurez ágil corporativa y obtén al instante un perfil con lo que construir a continuación.",
   "Évaluez quatre dimensions de maturité agile d'entreprise et obtenez aussitôt un profil avec la prochaine capacité à construire."),
 "Team": ("Equipo", "Équipe"),
 "Program": ("Programa", "Programme"),
 "Portfolio": ("Portafolio", "Portefeuille"),

 "Your report preview ·": ("Vista previa de tu informe ·", "Aperçu de votre rapport ·"),
 "Take the assessment ⟶": ("Haz la evaluación &#10230;", "Passer l'évaluation &#10230;"),
 "Your score maps to a certification track and a consulting layer —": (
   "Tu puntuación se corresponde con un itinerario de certificación y una capa de consultoría:",
   "Votre score correspond à un parcours de certification et à une couche de conseil —"),
 "see all seven assessments ⟶": (
   "ver las siete evaluaciones &#10230;", "voir les sept évaluations &#10230;"),

 # ---- section 04 why agile agilist ----
 "( 04 ) — Why Agile Agilist": (
   "( 04 ) &mdash; Por qué Agile Agilist", "( 04 ) &mdash; Pourquoi Agile Agilist"),

 # ---- section 05 the methodology ----
 "( 05 ) — Our flagship methodology": (
   "( 05 ) &mdash; Nuestra metodología insignia",
   "( 05 ) &mdash; Notre méthodologie phare"),
 "Standard SAFe gets you scaled. Our four-layer methodology gets you AI-Native and scaled — with Innovation Culture baked into every cohort. The only SPCT-led roadmap that integrates AI Enablement, Technical Backbone, and Innovation as a single playbook.": (
   "SAFe estándar te lleva a escalar. Nuestra metodología de cuatro capas te lleva a ser AI-Native y a escalar, con cultura de innovación integrada en cada convocatoria. La única hoja de ruta dirigida por SPCT que integra habilitación de IA, base técnica e innovación en un único manual.",
   "SAFe standard vous fait passer à l'échelle. Notre méthodologie en quatre couches vous rend AI-Native et à l'échelle — avec une culture d'innovation intégrée à chaque session. La seule feuille de route dirigée par un SPCT qui réunit activation de l'IA, socle technique et innovation dans un seul playbook."),
 "Explore the methodology ⟶": (
   "Explora la metodología &#10230;", "Explorer la méthodologie &#10230;"),
 "Time-to-market": ("Time-to-market", "Time-to-market"),
 "AI exec workshops · AI-Native ways of working · AI strategy": (
   "Talleres de IA para dirección · formas de trabajo AI-Native · estrategia de IA",
   "Ateliers IA pour dirigeants · modes de travail AI-Native · stratégie IA"),
 "ASE+AI · DevOps · MLOps · AI platform engineering": (
   "ASE+IA · DevOps · MLOps · ingeniería de plataformas de IA",
   "ASE+IA · DevOps · MLOps · ingénierie de plateformes IA"),

 # ---- section 06 five dimensions ----
 "( 06 ) — Consulting · The five dimensions": (
   "( 06 ) &mdash; Consultoría · Las cinco dimensiones",
   "( 06 ) &mdash; Conseil · Les cinq dimensions"),
 "One operating model,": ("Un modelo operativo,", "Un modèle opérationnel,"),
 "five layers deep.": ("cinco capas de profundidad.", "en cinq couches."),

 "Continuous self-redesign — the operating model that rewrites itself. Sensing mechanisms, redesign cadence, and learning loops that keep the org ahead of the market.": (
   "Rediseño continuo de uno mismo: el modelo operativo que se reescribe solo. Mecanismos de detección, cadencia de rediseño y bucles de aprendizaje que mantienen a la organización por delante del mercado.",
   "Refonte continue de soi — le modèle opérationnel qui se réécrit lui-même. Mécanismes de détection, cadence de refonte et boucles d'apprentissage qui maintiennent l'organisation en avance sur le marché."),
 "Redesign cadence": ("Cadencia de rediseño", "Cadence de refonte"),

 "The engineering layer that makes AI-native real: MLOps, AI-assisted development, and end-to-end automation across the delivery pipeline — from commit to production, with quality and security built in. This is what turns AI pilots into shipped, governed capability.": (
   "La capa de ingeniería que hace real lo AI-Native: MLOps, desarrollo asistido por IA y automatización de extremo a extremo en toda la cadena de entrega, del commit a producción, con calidad y seguridad integradas. Es lo que convierte los pilotos de IA en capacidad entregada y gobernada.",
   "La couche d'ingénierie qui rend l'AI-Native réel : MLOps, développement assisté par IA et automatisation de bout en bout sur toute la chaîne de livraison — du commit à la production, avec qualité et sécurité intégrées. C'est ce qui transforme les pilotes IA en capacité livrée et gouvernée."),
 "Agentic workflows": ("Flujos de trabajo con agentes", "Workflows agentiques"),
 "Human oversight": ("Supervisión humana", "Supervision humaine"),

 "The enterprise redesigned around AI — roles, decision rights, and workflows rebuilt so AI is the operating fabric, not a bolt-on tool. Grounded in OECD and NIST AI RMF.": (
   "La empresa rediseñada en torno a la IA: roles, derechos de decisión y flujos de trabajo reconstruidos para que la IA sea el tejido operativo y no una herramienta añadida. Basado en la OCDE y el NIST AI RMF.",
   "L'entreprise repensée autour de l'IA — rôles, droits de décision et workflows reconstruits pour que l'IA soit le tissu opérationnel, et non un outil rapporté. Fondé sur l'OCDE et le NIST AI RMF."),
 "AI operating model": ("Modelo operativo de IA", "Modèle opérationnel IA"),
 "Role redesign": ("Rediseño de roles", "Refonte des rôles"),

 "Innovation on cadence, not by accident. A repeatable pipeline from idea to funded experiment to shipped value — with governance that accelerates instead of blocks.": (
   "Innovación con cadencia, no por casualidad. Un flujo repetible que va de la idea al experimento financiado y al valor entregado, con una gobernanza que acelera en lugar de bloquear.",
   "L'innovation à cadence, pas par hasard. Un pipeline reproductible de l'idée à l'expérimentation financée puis à la valeur livrée — avec une gouvernance qui accélère au lieu de bloquer."),
 "Idea pipeline": ("Cartera de ideas", "Pipeline d'idées"),
 "Funding gates": ("Puertas de financiación", "Jalons de financement"),

 "Scale delivery across teams and trains — SAFe, LeSS, or hybrid. ARTs launched, PI cadence installed, flow measured end to end. The foundation every other layer builds on.": (
   "Escala la entrega entre equipos y trenes: SAFe, LeSS o híbrido. ARTs lanzados, cadencia de PI instalada, flujo medido de extremo a extremo. La base sobre la que se apoyan todas las demás capas.",
   "Passez la livraison à l'échelle, entre équipes et trains — SAFe, LeSS ou hybride. ARTs lancés, cadence PI installée, flux mesuré de bout en bout. Le socle sur lequel repose chacune des autres couches."),
 "ART launch": ("Lanzamiento de ARTs", "Lancement d'ARTs"),
 "Flow metrics": ("Métricas de flujo", "Métriques de flux"),

 "Explore this layer ⟶": ("Explora esta capa &#10230;", "Explorer cette couche &#10230;"),
 "Training moves people; the operating model moves the enterprise — 30–75% faster time-to-market ·": (
   "La formación mueve a las personas; el modelo operativo mueve a la empresa: un time-to-market entre un 30 % y un 75 % más rápido ·",
   "La formation fait bouger les personnes ; le modèle opérationnel fait bouger l'entreprise — un time-to-market 30 à 75 % plus rapide ·"),
 "explore the model ⟶": ("explora el modelo &#10230;", "explorer le modèle &#10230;"),

 # ---- section 07 customer results ----
 "( 07 ) — Customer results": (
   "( 07 ) &mdash; Resultados de clientes", "( 07 ) &mdash; Résultats clients"),
 "The numbers behind": ("Las cifras detrás de", "Les chiffres derrière"),
 "the training.": ("la formación.", "la formation."),
 "Real enterprise outcomes from SPCT-led transformation — across defense, telecom, banking, aerospace, and energy in 12 countries.": (
   "Resultados reales de transformaciones dirigidas por SPCT en defensa, telecomunicaciones, banca, aeroespacial y energía, en 12 países.",
   "Des résultats réels de transformations dirigées par un SPCT — défense, télécoms, banque, aérospatiale et énergie, dans 12 pays."),
 "Professionals trained": ("Profesionales formados", "Professionnels formés"),
 "Operating cost taken out": ("Coste operativo eliminado", "Coûts opérationnels supprimés"),
 "RTEs developed": ("RTEs formados", "RTEs formés"),
 "Countries served": ("Países atendidos", "Pays couverts"),
 "Organizations whose professionals have trained or transformed with Agile Agilist": (
   "Organizaciones cuyos profesionales se han formado o han transformado con Agile Agilist",
   "Des organisations dont les professionnels se sont formés ou ont transformé avec Agile Agilist"),

 # Job titles are rendered gender-neutral: these are real named customers and
 # the source gives no basis for a gendered form in ES/FR.
 "· Senior Agile Coach": ("· Agile Coach sénior", "· Agile Coach senior"),
 "“Restructured our $80M annual portfolio from project funding to Lean Budgets within 6 months. The Guaranteed-Pass framework was a huge differentiator.”": (
   "«Reestructuramos nuestro portafolio anual de 80 M$ pasando de financiación por proyecto a Lean Budgets en 6 meses. El marco de aprobación garantizada marcó una gran diferencia.»",
   "« Nous avons restructuré notre portefeuille annuel de 80 M$ en passant du financement par projet aux Lean Budgets en 6 mois. Le dispositif de réussite garantie a fait une énorme différence. »"),
 "· Portfolio Director": ("· Dirección de portafolio", "· Direction de portefeuille"),
 "“Used SAFe to launch our first DevSecOps Agile Release Train. Cut delivery time by 40% while meeting all compliance requirements.”": (
   "«Usamos SAFe para lanzar nuestro primer Agile Release Train de DevSecOps. Redujimos el tiempo de entrega un 40 % cumpliendo todos los requisitos de conformidad.»",
   "« Nous avons utilisé SAFe pour lancer notre premier Agile Release Train DevSecOps. Nous avons réduit le délai de livraison de 40 % tout en respectant toutes les exigences de conformité. »"),
 "· Program Manager": ("· Dirección de programa", "· Direction de programme"),
 "Read the enterprise case studies ⟶": (
   "Lee los casos de éxito corporativos &#10230;", "Lire les études de cas entreprise &#10230;"),

 # ---- section 08 your next 12 months ----
 "( 08 ) — Your next 12 months": (
   "( 08 ) &mdash; Tus próximos 12 meses", "( 08 ) &mdash; Vos 12 prochains mois"),
 "Take the 3-min assessment": (
   "Haz la evaluación de 3 min", "Passez l'évaluation de 3 min"),
 "Get a personalized cert path based on your role and your goals.": (
   "Obtén una ruta de certificación personalizada según tu rol y tus objetivos.",
   "Obtenez un parcours de certification personnalisé selon votre rôle et vos objectifs."),
 "Start step 1 ⟶": ("Empieza por el paso 1 &#10230;", "Commencer par l'étape 1 &#10230;"),
 "SAFe Gold SPCT Partner · 2,500+ graduates certified · delivered in 9 languages": (
   "SAFe Gold SPCT Partner · más de 2500 egresados certificados · impartido en 9 idiomas",
   "SAFe Gold SPCT Partner · plus de 2 500 diplômés certifiés · dispensé en 9 langues"),

 # ---- section 09 career coaching ----
 "( 09 ) — Career coaching": (
   "( 09 ) &mdash; Coaching de carrera", "( 09 ) &mdash; Coaching de carrière"),
 "Map your 12-month cert and role plan. Salary benchmarks. Gap analysis. Action plan delivered to your inbox after the call.": (
   "Traza tu plan de certificaciones y de rol a 12 meses. Referencias salariales. Análisis de brechas. Plan de acción en tu correo después de la sesión.",
   "Tracez votre plan de certifications et de poste sur 12 mois. Repères salariaux. Analyse des écarts. Plan d'action envoyé par e-mail après l'échange."),
 "Book your roadmap ⟶": ("Reserva tu hoja de ruta &#10230;", "Réserver votre feuille de route &#10230;"),
 "SPCT-led mock interview for RTE, SPC, LPM, or product roles. Real questions, real feedback, real positioning advice.": (
   "Simulacro de entrevista dirigido por un SPCT para roles de RTE, SPC, LPM o producto. Preguntas reales, feedback real, consejos de posicionamiento reales.",
   "Entretien blanc animé par un SPCT pour les rôles RTE, SPC, LPM ou produit. Vraies questions, vrai retour, vrais conseils de positionnement."),
 "Book a mock interview ⟶": (
   "Reserva un simulacro de entrevista &#10230;", "Réserver un entretien blanc &#10230;"),
 "Three months of bi-weekly coaching. Stay on plan, navigate office politics, prep for promotions, get unstuck fast.": (
   "Tres meses de coaching quincenal. Mantén el plan, maneja la política interna, prepárate para los ascensos y desbloquéate rápido.",
   "Trois mois de coaching bimensuel. Tenez le cap, naviguez la politique interne, préparez vos promotions, débloquez-vous vite."),
 "Apply for a sprint ⟶": ("Solicita un sprint &#10230;", "Candidater à un sprint &#10230;"),
}
