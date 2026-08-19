# -*- coding: utf-8 -*-
"""ES/FR translations for the agile-agilist.com homepage (post 961).

Conventions carried over from the already-live course translations:
  · Product and course names stay English (AI-Native, AI-Ready, Foundations,
    Change Agent, Leading the AI-Native Org, SAFe® …)
  · The seven assessments are named products, so their names stay English
    (Cert Recommender, Agile Competency, AI Maturity & Readiness, Product
    Management Maturity, Innovation Framework, Mutation Readiness, Agile
    Maturity) while their taglines and descriptions are translated
  · Credential codes, client names and figures pass through untouched
  · SAFe official terms stay English (ART, SPCT, LACE, Value Streams, DevOps,
    MLOps, ASE, Lean Budgets)

Three headings wrap a phrase in <em> and need the surrounding words
redistributed so the target language reads naturally; those are handled by
translating the trailing fragment to just its punctuation and letting the
generator tidy the resulting space before the full stop.
"""

KEEP = {
    "AI-Native", "AI-Native SAFe®", "$70M", "Top 1%", "3&times;",
    "7 SAFe + 11 ICAgile", "accenture", "U.S. AIR FORCE",
    "SAFe Gold SPCT Partner",
    "AI-Ready, Foundations, Change Agent, Leading the AI-Native Org.",
    # assessment product names
    "Cert Recommender", "Agile Competency", "AI Maturity &amp; Readiness",
    "Product Management Maturity", "Innovation Framework", "Mutation Readiness",
    "Agile Maturity", "Recommender",
    # people
    "Anna M.", "Irene K.", "Steve R.",
}

HOME = {
 "$70M+ saved · 80+ ARTs launched · 2,500+ trained — SPCT-led, live globally": (
  "$70M+ ahorrados · 80+ ARTs lanzados · 2500+ formados — dirigido por SPCT, en vivo en todo el mundo",
  "70 M$+ économisés · 80+ ARTs lancés · 2 500+ formés — dirigé par un SPCT, en direct dans le monde entier"),
 "Land the role.": ("Consigue el puesto.", "Décrochez le poste."),
 "Lead the team.": ("Lidera el equipo.", "Dirigez l'équipe."),
 "Transform the enterprise.": ("Transforma la empresa.", "Transformez l'entreprise."),
 "Live, instructor-led SAFe® certification and AI-Native training that gets professionals hired and promoted — and SPCT-led consulting that transforms Fortune 500s, governments, and global enterprises. We don’t just train teams; we deliver measurable business results.": (
  "Formación en vivo con instructor para certificaciones SAFe® y AI-Native que consigue que los profesionales sean contratados y promocionados, y consultoría dirigida por SPCT que transforma empresas Fortune 500, gobiernos y grandes corporaciones. No solo formamos equipos: entregamos resultados de negocio medibles.",
  "Formations certifiantes SAFe® et AI-Native en direct avec instructeur, qui permettent aux professionnels d'être recrutés et promus, et conseil dirigé par un SPCT qui transforme des entreprises du Fortune 500, des administrations et de grands groupes. Nous ne formons pas seulement des équipes : nous livrons des résultats mesurables."),
 "Value delivered ·": ("Valor entregado ·", "Valeur livrée ·"),
 "see the case studies &rarr;": ("ver los casos de éxito &rarr;", "voir les études de cas &rarr;"),
 "client cost saved": ("ahorrados a clientes", "économisés pour nos clients"),
 "ARTs launched": ("ARTs lanzados", "ARTs lancés"),
 "faster delivery": ("más rápido en la entrega", "de livraison plus rapide"),
 "professionals trained": ("profesionales formados", "professionnels formés"),
 "SAFe certifications": ("certificaciones SAFe", "certifications SAFe"),
 "Corporate transformation": ("Transformación corporativa", "Transformation d'entreprise"),
 "Career coaching": ("Coaching de carrera", "Coaching de carrière"),
 "View upcoming cohorts &rarr;": ("Ver próximas convocatorias &rarr;", "Voir les prochaines sessions &rarr;"),
 "See client results": ("Ver resultados de clientes", "Voir les résultats clients"),
 "Book a 15-min consult": ("Reserva una consulta de 15 min", "Réserver une consultation de 15 min"),
 "Free · 3 min": ("Gratis · 3 min", "Gratuit · 3 min"),
 "Not sure which certification is right?": (
  "¿No sabes qué certificación te conviene?", "Vous ne savez pas quelle certification choisir ?"),
 "Answer 7 quick questions about your role, experience, and goals. Get a personalized career path with the exact certifications to take in order — and the salary upside for each.": (
  "Responde 7 preguntas rápidas sobre tu rol, tu experiencia y tus objetivos. Obtén una ruta profesional personalizada con las certificaciones exactas que debes hacer y en qué orden, además del incremento salarial de cada una.",
  "Répondez à 7 questions rapides sur votre rôle, votre expérience et vos objectifs. Obtenez un parcours professionnel personnalisé avec les certifications à passer, dans l'ordre, et le gain salarial associé à chacune."),
 "Personalized 12-month cert roadmap": (
  "Ruta de certificación personalizada a 12 meses",
  "Feuille de route de certification personnalisée sur 12 mois"),
 "Salary benchmark for your target role": (
  "Referencia salarial para el puesto que buscas", "Référence salariale pour le poste visé"),
 "Recommended cohort + start date": (
  "Convocatoria recomendada y fecha de inicio", "Session recommandée et date de début"),
 "No login or credit card needed": (
  "Sin registro ni tarjeta de crédito", "Sans compte ni carte bancaire"),
 "Find my cert path &rarr;": (
  "Descubre mi ruta de certificación &rarr;", "Trouver mon parcours de certification &rarr;"),
 "( 01 ) &mdash; Free assessments": (
  "( 01 ) &mdash; Evaluaciones gratuitas", "( 01 ) &mdash; Évaluations gratuites"),
 "7 free assessments.": ("7 evaluaciones gratuitas.", "7 évaluations gratuites."),
 "Find your next move in 3 minutes.": (
  "Descubre tu siguiente paso en 3 minutos.", "Trouvez votre prochaine étape en 3 minutes."),
 "Used by 800+ professionals to map their cert path, benchmark their skills, and spot the role they’re ready for next. No login. No credit card.": (
  "Utilizadas por más de 800 profesionales para trazar su ruta de certificación, comparar sus competencias y detectar el puesto para el que ya están preparados. Sin registro. Sin tarjeta de crédito.",
  "Utilisées par plus de 800 professionnels pour tracer leur parcours de certification, évaluer leurs compétences et repérer le poste pour lequel ils sont prêts. Sans compte. Sans carte bancaire."),
 "Which certification is right for me?": (
  "¿Qué certificación es la adecuada para mí?", "Quelle certification me convient ?"),
 "7 quick questions on your role, experience, and goals. Personalized career path with cert sequence + salary upside.": (
  "7 preguntas rápidas sobre tu rol, tu experiencia y tus objetivos. Ruta profesional personalizada con la secuencia de certificaciones y el incremento salarial.",
  "7 questions rapides sur votre rôle, votre expérience et vos objectifs. Parcours professionnel personnalisé avec l'ordre des certifications et le gain salarial."),
 "Start here &rarr;": ("Empieza aquí &rarr;", "Commencer ici &rarr;"),
 "Free · 14 min": ("Gratis · 14 min", "Gratuit · 14 min"),
 "Actually agile, or just running ceremonies?": (
  "¿Realmente ágiles o solo haciendo ceremonias?", "Vraiment agiles, ou juste des cérémonies ?"),
 "18 questions across 6 capability dimensions. Framework-agnostic — measures muscles, not rituals.": (
  "18 preguntas en 6 dimensiones de capacidad. Independiente del marco: mide músculo, no rituales.",
  "18 questions sur 6 dimensions de capacité. Indépendant du cadre — mesure les muscles, pas les rituels."),
 "6 dimensions": ("6 dimensiones", "6 dimensions"),
 "Take it &rarr;": ("Hazla &rarr;", "La passer &rarr;"),
 "Free · 18 min": ("Gratis · 18 min", "Gratuit · 18 min"),
 "Where does your org stand on AI?": (
  "¿En qué punto está tu organización con la IA?", "Où en est votre organisation avec l'IA ?"),
 "Board-level 24-question diagnostic grounded in OECD, NIST AI RMF, Gartner.": (
  "Diagnóstico de 24 preguntas para el comité de dirección, basado en OECD, NIST AI RMF y Gartner.",
  "Diagnostic de 24 questions pour le comité de direction, fondé sur l'OCDE, le NIST AI RMF et Gartner."),
 "8 dimensions": ("8 dimensiones", "8 dimensions"),
 "Real PM — or feature factory?": (
  "¿Gestión de producto real o fábrica de funcionalidades?",
  "Vraie gestion de produit, ou usine à fonctionnalités ?"),
 "Diagnoses where teams ship features that don’t move the metric. Cagan/SVPG-aligned.": (
  "Detecta dónde los equipos entregan funcionalidades que no mueven la métrica. Alineado con Cagan/SVPG.",
  "Repère où les équipes livrent des fonctionnalités qui ne font pas bouger la métrique. Aligné sur Cagan/SVPG."),
 "Free · 12 min": ("Gratis · 12 min", "Gratuit · 12 min"),
 "Actually innovative or just talking it?": (
  "¿Realmente innovadores o solo se habla de ello?", "Vraiment innovants, ou juste des discours ?"),
 "15 questions across 5 principles. The cultural foundation underneath every innovation initiative.": (
  "15 preguntas en 5 principios. La base cultural que sostiene toda iniciativa de innovación.",
  "15 questions sur 5 principes. Le socle culturel de toute initiative d'innovation."),
 "5 dimensions": ("5 dimensiones", "5 dimensions"),
 "Free · 15 min": ("Gratis · 15 min", "Gratuit · 15 min"),
 "Sense &amp; respond at AI-age speed?": (
  "¿Detectar y responder a la velocidad de la era de la IA?",
  "Détecter et réagir à la vitesse de l'ère de l'IA ?"),
 "18 questions across 6 dimensions. The AI-age extension of the Innovation Framework.": (
  "18 preguntas en 6 dimensiones. La extensión del Innovation Framework para la era de la IA.",
  "18 questions sur 6 dimensions. L'extension du Innovation Framework pour l'ère de l'IA."),
 "Free · 2 min": ("Gratis · 2 min", "Gratuit · 2 min"),
 "Absent &mdash; or flying?": ("¿Ausente o volando?", "Absente &mdash; ou au sommet ?"),
 "Rate 4 dimensions of enterprise agile maturity and get an instant profile with what to build next.": (
  "Valora 4 dimensiones de madurez ágil empresarial y obtén un perfil instantáneo con lo que construir a continuación.",
  "Évaluez 4 dimensions de maturité agile d'entreprise et obtenez un profil instantané avec les prochaines priorités."),
 "4 dimensions": ("4 dimensiones", "4 dimensions"),
 "( 02 ) &mdash; All training": ("( 02 ) &mdash; Toda la formación", "( 02 ) &mdash; Toutes les formations"),
 "19 SAFe® certifications. 5 career tracks.": (
  "19 certificaciones SAFe®. 5 itinerarios profesionales.",
  "19 certifications SAFe®. 5 parcours professionnels."),
 "One SPCT-led team.": ("Un solo equipo dirigido por SPCT.", "Une seule équipe dirigée par un SPCT."),
 "Live virtual classrooms. Exam included. Recordings forever. Pass guarantee — or your next cohort is on us.": (
  "Aulas virtuales en vivo. Examen incluido. Grabaciones para siempre. Garantía de aprobación: si no, tu siguiente convocatoria corre por nuestra cuenta.",
  "Salles de classe virtuelles en direct. Examen inclus. Enregistrements à vie. Garantie de réussite — sinon, votre prochaine session est offerte."),
 "Micro-Credentials": ("Microcredenciales", "Micro-certifications"),
 "Stackable badges from SAFe + ICAgile. Half-day to 1-day. Specialize fast.": (
  "Insignias acumulables de SAFe e ICAgile. De media jornada a 1 día. Especialízate rápido.",
  "Badges cumulables SAFe et ICAgile. D'une demi-journée à 1 jour. Spécialisez-vous vite."),
 "SAFe by Role": ("SAFe por rol", "SAFe par rôle"),
 "SSM, POPM, SASM, DevOps, BO — role-specific certifications.": (
  "SSM, POPM, SASM, DevOps, BO: certificaciones específicas por rol.",
  "SSM, POPM, SASM, DevOps, BO — certifications par rôle."),
 "6 certifications": ("6 certificaciones", "6 certifications"),
 "Advanced Training": ("Formación avanzada", "Formation avancée"),
 "RTE, LPM, APM, SPC, ASPC — enterprise transformation leadership.": (
  "RTE, LPM, APM, SPC, ASPC: liderazgo de transformación empresarial.",
  "RTE, LPM, APM, SPC, ASPC — leadership de transformation d'entreprise."),
 "5 advanced certs": ("5 certificaciones avanzadas", "5 certifications avancées"),
 "SAFe by Industry": ("SAFe por industria", "SAFe par secteur"),
 "Architects, hardware, government, engineering. Sector-specific.": (
  "Arquitectos, hardware, sector público, ingeniería. Específico por sector.",
  "Architectes, hardware, secteur public, ingénierie. Spécifique au secteur."),
 "6 industry tracks": ("6 itinerarios por industria", "6 parcours sectoriels"),
 "4 AI tracks": ("4 itinerarios de IA", "4 parcours IA"),
 "( 03 ) &mdash; Why Agile Agilist": (
  "( 03 ) &mdash; Por qué Agile Agilist", "( 03 ) &mdash; Pourquoi Agile Agilist"),
 "Why Fortune 500s, governments, and 2,500+ professionals": (
  "Por qué las Fortune 500, los gobiernos y más de 2500 profesionales",
  "Pourquoi les entreprises du Fortune 500, les administrations et plus de 2 500 professionnels"),
 "choose us.": ("nos eligen.", "nous choisissent."),
 "Trusted to train and certify teams at IBM, TD Bank, Accenture, Deloitte, McKinsey, KPMG, the U.S. Air Force, and Canadian federal and provincial governments — 500+ live cohorts delivered across 9 languages and 4 continents.": (
  "Con la confianza de IBM, TD Bank, Accenture, Deloitte, McKinsey, KPMG, la Fuerza Aérea de EE. UU. y administraciones federales y provinciales de Canadá para formar y certificar a sus equipos: más de 500 convocatorias en vivo impartidas en 9 idiomas y 4 continentes.",
  "La confiance d'IBM, TD Bank, Accenture, Deloitte, McKinsey, KPMG, de l'US Air Force et d'administrations fédérales et provinciales canadiennes pour former et certifier leurs équipes — plus de 500 sessions en direct animées en 9 langues et sur 4 continents."),
 "First-attempt pass rate": (
  "Tasa de aprobación al primer intento", "Taux de réussite au premier essai"),
 "Above the industry average. Backed by our Fast-Pass study guide, mock exams, and 1:1 post-class coaching.": (
  "Por encima de la media del sector. Respaldada por nuestra guía de estudio Fast-Pass, exámenes de práctica y coaching 1:1 tras la clase.",
  "Au-dessus de la moyenne du secteur. Appuyé par notre guide d'étude Fast-Pass, des examens blancs et un coaching individuel après le cours."),
 "Scaled Agile credential": ("Credencial de Scaled Agile", "Certification Scaled Agile"),
 "Every cohort led by an SPCT — 125+ globally, 90+ in North America. The same credential Scaled Agile uses to train its own instructors.": (
  "Cada convocatoria la dirige un SPCT: 125+ en el mundo, 90+ en Norteamérica. La misma credencial que Scaled Agile usa para formar a sus propios instructores.",
  "Chaque session est animée par un SPCT — 125+ dans le monde, 90+ en Amérique du Nord. La même certification que Scaled Agile utilise pour former ses propres instructeurs."),
 "Faster career progression": (
  "Progresión profesional más rápida", "Progression de carrière plus rapide"),
 "Career coaching is built into every cert. Roadmap, interview prep, salary negotiation — we help you turn the badge into the next role.": (
  "El coaching de carrera está incluido en cada certificación. Hoja de ruta, preparación de entrevistas y negociación salarial: te ayudamos a convertir la insignia en el siguiente puesto.",
  "Le coaching de carrière est inclus dans chaque certification. Feuille de route, préparation aux entretiens, négociation salariale — nous vous aidons à transformer le badge en promotion."),
 "Our flagship methodology": ("Nuestra metodología insignia", "Notre méthodologie phare"),
 # <h2>The first <em>AI-Native SAFe®</em> Implementation Roadmap.</h2>
 "The first": ("La primera hoja de ruta de implementación",
               "La première feuille de route d'implémentation"),
 "Implementation Roadmap.": (".", "."),
 "Standard SAFe gets you scaled. Our 4-layer methodology gets you": (
  "SAFe estándar te lleva a escalar. Nuestra metodología de 4 capas te lleva a ser",
  "SAFe standard vous fait passer à l'échelle. Notre méthodologie en 4 couches vous rend"),
 "AI-Native, scaled": ("AI-Native y escalado", "AI-Native et à l'échelle"),
 "— with Innovation Culture baked into every cohort. The only SPCT-led roadmap that integrates AI Enablement, Technical Backbone, and Innovation as a single playbook.": (
  "— con cultura de innovación integrada en cada convocatoria. La única hoja de ruta dirigida por SPCT que integra habilitación de IA, base técnica e innovación en un único manual.",
  "— avec une culture d'innovation intégrée à chaque session. La seule feuille de route dirigée par un SPCT qui réunit activation de l'IA, socle technique et innovation dans un seul playbook."),
 "Explore the methodology &rarr;": (
  "Explora la metodología &rarr;", "Découvrir la méthodologie &rarr;"),
 "Time-to-Market": ("Tiempo de salida al mercado", "Délai de mise sur le marché"),
 "Quality": ("Calidad", "Qualité"),
 "Productivity": ("Productividad", "Productivité"),
 "AI Enablement Layer": ("Capa de habilitación de IA", "Couche d'activation de l'IA"),
 "AI Exec workshops · AI-Native ways of working · AI Strategy": (
  "Talleres de IA para directivos · Formas de trabajo AI-Native · Estrategia de IA",
  "Ateliers IA pour dirigeants · Modes de travail AI-Native · Stratégie IA"),
 "SAFe Core Transformation Layer": (
  "Capa de transformación SAFe central", "Couche de transformation SAFe centrale"),
 "SPC → SA → LPM → ARTs → Value Streams (standard SAFe)": (
  "SPC → SA → LPM → ARTs → Value Streams (SAFe estándar)",
  "SPC → SA → LPM → ARTs → Value Streams (SAFe standard)"),
 "Technical Backbone Layer": ("Capa de base técnica", "Couche de socle technique"),
 "ASE+AI · DevOps · MLOps · AI Platform Engineering": (
  "ASE+IA · DevOps · MLOps · Ingeniería de plataformas de IA",
  "ASE+IA · DevOps · MLOps · Ingénierie de plateformes IA"),
 "Lean-Agile + AI + Innovation CoE": (
  "CoE Lean-Agile + IA + Innovación", "CoE Lean-Agile + IA + Innovation"),
 "LACE wrapper — the capability that owns the transformation": (
  "Envoltura LACE: la capacidad que se responsabiliza de la transformación",
  "Enveloppe LACE — la capacité qui porte la transformation"),
 "( 04 ) &mdash; What graduates say": (
  "( 04 ) &mdash; Lo que dicen los egresados", "( 04 ) &mdash; Ce que disent les diplômés"),
 "2,500+ graduates. 4.9/5 average.": (
  "Más de 2500 egresados. 4,9/5 de media.", "Plus de 2 500 diplômés. 4,9/5 en moyenne."),
 "Real outcomes.": ("Resultados reales.", "Des résultats concrets."),
 "“Went from CSM to SAFe Practice Consultant in 18 months. Tripled my consulting rate. The career coach made the difference — not just the certification.”": (
  "«Pasé de CSM a SAFe Practice Consultant en 18 meses. Tripliqué mi tarifa de consultoría. La diferencia la marcó el coach de carrera, no solo la certificación.»",
  "« Je suis passé de CSM à SAFe Practice Consultant en 18 mois. J'ai triplé mon tarif de consultant. C'est le coach de carrière qui a fait la différence — pas seulement la certification. »"),
 "Senior Agile Coach": ("Senior Agile Coach", "Senior Agile Coach"),
 "“Restructured our $80M annual portfolio from project funding to Lean Budgets within 6 months. The Guaranteed-Pass framework was a huge differentiator.”": (
  "«Reestructuramos nuestro portafolio anual de $80M, de financiación por proyectos a Lean Budgets, en 6 meses. El marco de aprobación garantizada fue un gran diferenciador.»",
  "« Nous avons restructuré notre portefeuille annuel de 80 M$, du financement par projet aux Lean Budgets, en 6 mois. Le dispositif de réussite garantie a fait toute la différence. »"),
 "Portfolio Director": ("Portfolio Director", "Portfolio Director"),
 "“Used SAFe to launch our first DevSecOps Agile Release Train. Cut delivery time by 40% while meeting all compliance requirements.”": (
  "«Usamos SAFe para lanzar nuestro primer Agile Release Train de DevSecOps. Redujimos el tiempo de entrega un 40% cumpliendo todos los requisitos normativos.»",
  "« Nous avons utilisé SAFe pour lancer notre premier Agile Release Train DevSecOps. Délai de livraison réduit de 40 % tout en respectant toutes les exigences de conformité. »"),
 "Program Manager": ("Program Manager", "Program Manager"),
 "Your next 12 months": ("Tus próximos 12 meses", "Vos 12 prochains mois"),
 # <h2>Your next promotion is <em>4 days of training</em> away.</h2>
 "Your next promotion is": ("Tu próximo ascenso está a", "Votre prochaine promotion est à"),
 "4 days of training": ("4 días de formación", "4 jours de formation"),
 "away.": (".", "."),
 "Four simple steps. No guesswork. Most graduates complete step 4 within 90 days of starting step 1.": (
  "Cuatro pasos sencillos. Sin conjeturas. La mayoría de los egresados completan el paso 4 en los 90 días siguientes a iniciar el paso 1.",
  "Quatre étapes simples. Sans tâtonnement. La plupart des diplômés atteignent l'étape 4 dans les 90 jours suivant l'étape 1."),
 "Take 3-min assessment": ("Haz la evaluación de 3 min", "Passez l'évaluation de 3 min"),
 "Get a personalized cert path based on your role + goals.": (
  "Obtén una ruta de certificación personalizada según tu rol y tus objetivos.",
  "Obtenez un parcours de certification personnalisé selon votre rôle et vos objectifs."),
 "Pick your path": ("Elige tu ruta", "Choisissez votre parcours"),
 "Choose the cert that fits your career and your calendar.": (
  "Elige la certificación que encaja con tu carrera y tu calendario.",
  "Choisissez la certification qui correspond à votre carrière et à votre agenda."),
 "Get certified": ("Certifícate", "Certifiez-vous"),
 "Live virtual cohort with an SPCT. Pass first time.": (
  "Convocatoria virtual en vivo con un SPCT. Aprueba a la primera.",
  "Session virtuelle en direct avec un SPCT. Réussissez du premier coup."),
 "Land the role": ("Consigue el puesto", "Décrochez le poste"),
 "Use career coaching to convert the badge into the promotion.": (
  "Usa el coaching de carrera para convertir la insignia en el ascenso.",
  "Utilisez le coaching de carrière pour transformer le badge en promotion."),
 "Start step 1 &rarr;": ("Empieza el paso 1 &rarr;", "Commencer l'étape 1 &rarr;"),
 "Or talk to an advisor": ("O habla con un asesor", "Ou parlez à un conseiller"),
 "4.9/5 from 2,500+ graduates": (
  "4,9/5 de más de 2500 egresados", "4,9/5 par plus de 2 500 diplômés"),
 "Delivered in 9 languages": ("Impartido en 9 idiomas", "Dispensé en 9 langues"),
 "( 05 ) &mdash; Career coaching": (
  "( 05 ) &mdash; Coaching de carrera", "( 05 ) &mdash; Coaching de carrière"),
 "Certified isn’t hired.": ("Certificado no es contratado.", "Certifié n'est pas recruté."),
 "We coach you to both.": ("Te acompañamos hasta ambos.", "Nous vous accompagnons vers les deux."),
 "1:1 coaching with an SPCT who has hired, trained, and promoted SAFe practitioners across 4 continents. Roadmap, interview prep, or a 3-month career sprint.": (
  "Coaching 1:1 con un SPCT que ha contratado, formado y promocionado a profesionales SAFe en 4 continentes. Hoja de ruta, preparación de entrevistas o un sprint de carrera de 3 meses.",
  "Coaching individuel avec un SPCT qui a recruté, formé et promu des praticiens SAFe sur 4 continents. Feuille de route, préparation aux entretiens ou sprint de carrière de 3 mois."),
 "60 min": ("60 min", "60 min"),
 "Career Roadmap": ("Hoja de ruta profesional", "Feuille de route de carrière"),
 "Map your 12-month cert + role plan. Salary benchmarks. Gap analysis. Action plan delivered in your inbox after the call.": (
  "Traza tu plan de certificaciones y roles a 12 meses. Referencias salariales. Análisis de brechas. Plan de acción en tu correo después de la llamada.",
  "Tracez votre plan certifications et postes sur 12 mois. Références salariales. Analyse des écarts. Plan d'action envoyé par e-mail après l'appel."),
 "Book your roadmap &rarr;": (
  "Reserva tu hoja de ruta &rarr;", "Réserver votre feuille de route &rarr;"),
 "45 min": ("45 min", "45 min"),
 "Interview Prep": ("Preparación de entrevistas", "Préparation aux entretiens"),
 "SPCT-led mock interview for RTE, SPC, LPM, or Product roles. Real questions, real feedback, real positioning advice.": (
  "Entrevista simulada dirigida por un SPCT para roles de RTE, SPC, LPM o producto. Preguntas reales, feedback real y consejos reales de posicionamiento.",
  "Entretien blanc animé par un SPCT pour des postes RTE, SPC, LPM ou produit. Vraies questions, vrais retours, vrais conseils de positionnement."),
 "Book a mock interview &rarr;": (
  "Reserva una entrevista simulada &rarr;", "Réserver un entretien blanc &rarr;"),
 "3 months": ("3 meses", "3 mois"),
 "Quarterly Career Sprint": ("Sprint de carrera trimestral", "Sprint de carrière trimestriel"),
 "3 months of bi-weekly coaching. Stay on plan, navigate office politics, prep for promotions, get unstuck fast.": (
  "3 meses de coaching quincenal. Mantén el plan, navega la política interna, prepárate para los ascensos y desbloquéate rápido.",
  "3 mois de coaching bimensuel. Tenez le cap, naviguez la politique interne, préparez vos promotions et débloquez-vous vite."),
 "Apply for a sprint &rarr;": ("Solicita un sprint &rarr;", "Postuler pour un sprint &rarr;"),
}
