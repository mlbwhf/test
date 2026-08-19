# -*- coding: utf-8 -*-
"""ES/FR translations for the Five Dimensions pages.

One shared table across all five, because the pages share navigation, the
layer rail, and the closing CTA.

Terminology fixed here and inherited by the other four pages:
  operating model    -> modelo operativo        / modèle opérationnel
  value streams      -> value streams           (SAFe term, stays English)
  cadence            -> cadencia                / cadence
  guardrails         -> guardrails              (SAFe term, stays English)
  layer              -> capa                    / couche

The five dimension names are product names and stay English, exactly as
course and assessment names do: Scaling Iterative Model, Innovation Culture,
AI-Native, AI Automation, Mutation / Mutation Readiness.
"""

KEEP = {
    "Scaling Iterative", "Scaling Iterative Model", "Scaling Iterative Model &#10230;",
    "AI Automation", "AI Automation &#10230;", "Mutation", "Mutation Readiness",
    "Mutation Readiness &#10230;", "Innovation Culture", "Innovation Culture &#10230;",
    "AI-Native", "Operating Model", "value streams", "in 3",
}

FIVE = {
 # ---- chrome / hero
 "&larr; Back to Services": ("&larr; Volver a Servicios", "&larr; Retour aux services"),
 "The operating model &middot; Change that compounds, not snaps back": (
  "El modelo operativo &middot; Un cambio que se acumula en lugar de revertirse",
  "Le modèle opérationnel &middot; Un changement qui se cumule au lieu de retomber"),
 "Five dimensions for an": ("Cinco dimensiones para un", "Cinq dimensions pour un"),
 "operating model": ("modelo operativo", "modèle opérationnel"),
 "in the age of AI.": ("en la era de la IA.", "à l'ère de l'IA."),
 "Most transformations stall for the same reason &mdash; teams get certified and ceremonies get renamed, but the operating model never changes, so the gains snap back.": (
  "La mayoría de las transformaciones se estancan por la misma razón: los equipos se certifican y se renombran las ceremonias, pero el modelo operativo nunca cambia, así que las mejoras se revierten.",
  "La plupart des transformations s'enlisent pour la même raison : les équipes se certifient, les cérémonies changent de nom, mais le modèle opérationnel ne bouge pas — et les gains retombent."),
 "We rebuild the model itself across five compounding layers &mdash; so change holds, and keeps paying off.": (
  "Reconstruimos el modelo en sí a lo largo de cinco capas que se acumulan, para que el cambio se sostenga y siga dando resultados.",
  "Nous reconstruisons le modèle lui-même sur cinq couches qui se cumulent, pour que le changement tienne et continue de payer."),
 "The classroom ships the certification; we ship the operating model.": (
  "El aula entrega la certificación; nosotros entregamos el modelo operativo.",
  "La salle de classe livre la certification ; nous livrons le modèle opérationnel."),
 "Explore the 5 dimensions &darr;": (
  "Explora las 5 dimensiones &darr;", "Découvrir les 5 dimensions &darr;"),
 "Talk to our team": ("Habla con nuestro equipo", "Parler à notre équipe"),
 "Building the operating model": (
  "Construyendo el modelo operativo", "Construire le modèle opérationnel"),
 "Scale delivery &middot; any framework": (
  "Escala la entrega &middot; con cualquier marco",
  "Passez la livraison à l'échelle &middot; quel que soit le cadre"),
 "faster time-to-market": (
  "más rápido en salida al mercado", "de mise sur le marché plus rapide"),
 "financial-performance gain": (
  "de mejora en el desempeño financiero", "de gain de performance financière"),
 "5 layers": ("5 capas", "5 couches"),
 "one operating model": ("un solo modelo operativo", "un seul modèle opérationnel"),
 "leaders trained": ("líderes formados", "dirigeants formés"),
 # ---- 01 why a model
 "( 01 ) &mdash; Why a model, not just a framework": (
  "( 01 ) &mdash; Por qué un modelo y no solo un marco",
  "( 01 ) &mdash; Pourquoi un modèle, et pas seulement un cadre"),
 "A certificate changes a r&eacute;sum&eacute;.": (
  "Un certificado cambia un currículum.", "Un certificat change un CV."),
 "An operating model changes the enterprise.": (
  "Un modelo operativo cambia la empresa.",
  "Un modèle opérationnel change l'entreprise."),
 "Most transformations stall because organizations": (
  "La mayoría de las transformaciones se estancan porque las organizaciones",
  "La plupart des transformations s'enlisent parce que les organisations"),
 "train people and rename ceremonies": (
  "forman a las personas y renombran ceremonias",
  "forment les gens et renomment les cérémonies"),
 ", but leave the operating model &mdash; how strategy is funded, how work flows, how decisions are made, how the enterprise learns &mdash; untouched.": (
  ", pero dejan intacto el modelo operativo: cómo se financia la estrategia, cómo fluye el trabajo, cómo se toman las decisiones y cómo aprende la empresa.",
  ", mais laissent intact le modèle opérationnel : comment la stratégie est financée, comment le travail circule, comment les décisions se prennent, comment l'entreprise apprend."),
 "In the age of AI, where the ground shifts every quarter, that gap is the difference between a program that compounds and one that snaps back.": (
  "En la era de la IA, donde el terreno se mueve cada trimestre, esa brecha marca la diferencia entre un programa que se acumula y uno que se revierte.",
  "À l'ère de l'IA, où le terrain bouge chaque trimestre, cet écart fait la différence entre un programme qui se cumule et un programme qui retombe."),
 "What stalls without a model &mdash; framework theatre": (
  "Lo que se estanca sin un modelo: teatro de marcos",
  "Ce qui s'enlise sans modèle — le théâtre des cadres"),
 "Teams get certified; the operating model never changes": (
  "Los equipos se certifican; el modelo operativo nunca cambia",
  "Les équipes se certifient ; le modèle opérationnel ne change jamais"),
 "Finance still funds projects, not value streams": (
  "Finanzas sigue financiando proyectos, no value streams",
  "La finance continue de financer des projets, pas des value streams"),
 "Innovation happens at hackathons, then evaporates": (
  "La innovación ocurre en hackathones y luego se evapora",
  "L'innovation a lieu lors de hackathons, puis s'évapore"),
 "AI is piloted in a corner and never reaches production": (
  "La IA se pilota en un rincón y nunca llega a producción",
  "L'IA est pilotée dans un coin et n'atteint jamais la production"),
 "Coaches leave; six months later, behaviours revert": (
  "Los coaches se van; seis meses después, los comportamientos vuelven atrás",
  "Les coachs partent ; six mois plus tard, les comportements reviennent"),
 "What a five-dimension model builds &mdash; an enterprise that adapts": (
  "Lo que construye un modelo de cinco dimensiones: una empresa que se adapta",
  "Ce que construit un modèle à cinq dimensions — une entreprise qui s'adapte"),
 "A": ("Un", "Un"),
 "scaling model": ("modelo de escalado", "modèle de mise à l'échelle"),
 "that moves value end-to-end, on cadence": (
  "que mueve el valor de extremo a extremo, con cadencia",
  "qui fait circuler la valeur de bout en bout, à cadence fixe"),
 "Funding aligned to": ("Financiación alineada con los", "Financement aligné sur les"),
 ", governed by guardrails": (
  ", gobernada por guardrails", ", encadré par des guardrails"),
 "Innovation on a schedule": ("Innovación con calendario", "L'innovation à date fixe"),
 ", not by accident": (", no por casualidad", ", et non par hasard"),
 "AI rebuilt into the operating model &mdash; and shipped to production": (
  "IA reconstruida dentro del modelo operativo y llevada a producción",
  "L'IA reconstruite dans le modèle opérationnel — et mise en production"),
 "mutation layer": ("capa de mutación", "couche de mutation"),
 "that keeps the change alive": (
  "que mantiene vivo el cambio", "qui maintient le changement en vie"),
 # ---- 02 business case
 "( 02 ) &mdash; The business case": (
  "( 02 ) &mdash; El caso de negocio", "( 02 ) &mdash; L'argumentaire économique"),
 "The cost of a framework without a model is": (
  "El coste de un marco sin modelo es", "Le coût d'un cadre sans modèle est"),
 "measurable.": ("medible.", "mesurable."),
 "You don&rsquo;t redesign an operating model for its own sake &mdash; you do it because the numbers demand it. The research on enterprise transformation is consistent: the barrier is rarely the framework, and almost always the operating model around it.": (
  "No se rediseña un modelo operativo porque sí, sino porque los números lo exigen. La investigación sobre transformación empresarial es consistente: el obstáculo rara vez es el marco y casi siempre es el modelo operativo que lo rodea.",
  "On ne redessine pas un modèle opérationnel pour le plaisir — on le fait parce que les chiffres l'exigent. La recherche sur la transformation d'entreprise est constante : l'obstacle est rarement le cadre, et presque toujours le modèle opérationnel qui l'entoure."),
 "of large-scale change programs fail to reach their goals &mdash; unchanged for decades": (
  "de los programas de cambio a gran escala no alcanzan sus objetivos, una cifra que no ha variado en décadas",
  "des programmes de changement à grande échelle n'atteignent pas leurs objectifs — un chiffre inchangé depuis des décennies"),
 "financial-performance gain for orgs that genuinely change how they operate": (
  "de mejora en el desempeño financiero para las organizaciones que cambian de verdad su forma de operar",
  "de gain de performance financière pour les organisations qui changent réellement leur façon d'opérer"),
 "faster time-to-market once flow &amp; Lean funding replace project stage-gates": (
  "más rápido en salida al mercado cuando el flujo y la financiación Lean sustituyen a las puertas de fase por proyecto",
  "de mise sur le marché plus rapide lorsque le flux et le financement Lean remplacent les jalons de projet"),
 "enterprise AI pilots reach production &mdash; the gap is operational, not technical": (
  "de los pilotos de IA empresarial llega a producción: la brecha es operativa, no técnica",
  "des pilotes d'IA en entreprise atteignent la production — l'écart est opérationnel, pas technique"),
 "Figures reflect widely-reported industry benchmarks (McKinsey change-management and agile research, DORA/DevOps, Scaled Agile, and enterprise-AI adoption studies). Directional ranges, not guarantees &mdash; results depend on starting state, executive alignment, and follow-through.": (
  "Las cifras reflejan referencias del sector ampliamente publicadas (investigación de McKinsey sobre gestión del cambio y agilidad, DORA/DevOps, Scaled Agile y estudios de adopción de IA empresarial). Son rangos orientativos, no garantías: los resultados dependen del punto de partida, la alineación directiva y la constancia.",
  "Les chiffres reflètent des références sectorielles largement publiées (recherches McKinsey sur la conduite du changement et l'agilité, DORA/DevOps, Scaled Agile et études d'adoption de l'IA en entreprise). Ce sont des ordres de grandeur, pas des garanties : les résultats dépendent du point de départ, de l'alignement des dirigeants et de la constance."),
 # ---- 03 the five dimensions
 "( 03 ) &mdash; The five dimensions": (
  "( 03 ) &mdash; Las cinco dimensiones", "( 03 ) &mdash; Les cinq dimensions"),
 "Five layers.": ("Cinco capas.", "Cinq couches."),
 "One operating model.": ("Un solo modelo operativo.", "Un seul modèle opérationnel."),
 "Each dimension stands on its own &mdash; and together they stack into one operating model that compounds instead of snapping back. Select a layer to explore it.": (
  "Cada dimensión se sostiene por sí sola y, juntas, se apilan en un único modelo operativo que se acumula en lugar de revertirse. Selecciona una capa para explorarla.",
  "Chaque dimension tient seule — et ensemble elles s'empilent en un seul modèle opérationnel qui se cumule au lieu de retomber. Sélectionnez une couche pour l'explorer."),
 "Top layer &mdash; where change sticks": (
  "Capa superior: donde el cambio se afianza",
  "Couche supérieure — là où le changement s'ancre"),
 "Repeatable innovation": ("Innovación repetible", "Innovation reproductible"),
 "Operating model rebuilt": ("Modelo operativo reconstruido", "Modèle opérationnel reconstruit"),
 "End-to-end technical": ("Técnico de extremo a extremo", "Technique de bout en bout"),
 "Where change sticks": ("Donde el cambio se afianza", "Là où le changement s'ancre"),
 "Base layer &mdash; delivery at scale": (
  "Capa base: entrega a escala", "Couche de base — livraison à l'échelle"),
 "Layer 01 / 05": ("Capa 01 / 05", "Couche 01 / 05"),
 "Scaling agile beyond a single team &mdash; and a single brand": (
  "Escalar la agilidad más allá de un solo equipo y de una sola marca",
  "Passer l'agilité à l'échelle au-delà d'une seule équipe — et d'une seule marque"),
 "The base layer: a large-scale iterative operating model that moves value across the enterprise &mdash; value streams, cross-functional trains, a fixed cadence, and Lean portfolio governance that funds outcomes instead of projects. SAFe is the implementation we&rsquo;re certified to lead at the highest level, but the discipline is framework-agnostic: LeSS, Scrum@Scale, or a hybrid can all express it. What compounds is iterative, flow-based delivery at scale &mdash; not any single brand.": (
  "La capa base: un modelo operativo iterativo a gran escala que mueve el valor por toda la empresa mediante value streams, trenes multifuncionales, una cadencia fija y una gobernanza Lean de portafolio que financia resultados en lugar de proyectos. SAFe es la implementación que estamos certificados para liderar al máximo nivel, pero la disciplina es independiente del marco: LeSS, Scrum@Scale o un híbrido pueden expresarla igual. Lo que se acumula es la entrega iterativa basada en flujo a escala, no una marca concreta.",
  "La couche de base : un modèle opérationnel itératif à grande échelle qui fait circuler la valeur dans toute l'entreprise — value streams, trains pluridisciplinaires, cadence fixe et gouvernance Lean du portefeuille qui finance des résultats plutôt que des projets. SAFe est l'implémentation que nous sommes certifiés pour piloter au plus haut niveau, mais la discipline est indépendante du cadre : LeSS, Scrum@Scale ou une approche hybride peuvent l'exprimer. Ce qui se cumule, c'est la livraison itérative fondée sur le flux à l'échelle — pas une marque en particulier."),
 "Layer 02 / 05": ("Capa 02 / 05", "Couche 02 / 05"),
 "Innovation on cadence, not by accident": (
  "Innovación con cadencia, no por casualidad",
  "L'innovation à cadence fixe, pas par hasard"),
 "Turn innovation from a hackathon into a habit. A repeatable framework that embeds innovation ceremonies into the cadence you already run &mdash; so new value is discovered, tested, and shipped on a schedule, and survives the quarterly review instead of dying in it.": (
  "Convierte la innovación de hackathon en hábito. Un marco repetible que integra las ceremonias de innovación en la cadencia que ya ejecutas, de modo que el nuevo valor se descubre, se prueba y se entrega con calendario, y sobrevive a la revisión trimestral en lugar de morir en ella.",
  "Faites passer l'innovation du hackathon à l'habitude. Un cadre reproductible qui intègre les cérémonies d'innovation à la cadence que vous tenez déjà — de sorte que la nouvelle valeur est découverte, testée et livrée à date fixe, et survit à la revue trimestrielle au lieu d'y mourir."),
 "Layer 03 / 05": ("Capa 03 / 05", "Couche 03 / 05"),
 "The enterprise redesigned around AI": (
  "La empresa rediseñada en torno a la IA",
  "L'entreprise redessinée autour de l'IA"),
 "Not AI bolted onto old processes &mdash; the operating model rebuilt for the AI era. AI-native teams, roles, and value streams, with AI fluency embedded from executives to engineers, and governance and ethics designed in from day one rather than retrofitted.": (
  "No se trata de añadir IA a procesos antiguos, sino de reconstruir el modelo operativo para la era de la IA. Equipos, roles y value streams nativos de IA, con fluidez en IA desde la dirección hasta ingeniería, y con gobernanza y ética diseñadas desde el primer día en lugar de añadidas después.",
  "Il ne s'agit pas de greffer l'IA sur d'anciens processus, mais de reconstruire le modèle opérationnel pour l'ère de l'IA. Équipes, rôles et value streams nativement IA, avec une maîtrise de l'IA des dirigeants aux ingénieurs, et une gouvernance et une éthique conçues dès le premier jour plutôt qu'ajoutées après coup."),
 "AI-Native training &#10230;": ("Formación AI-Native &#10230;", "Formation AI-Native &#10230;"),
 "Layer 04 / 05": ("Capa 04 / 05", "Couche 04 / 05"),
 "The technical backbone": ("La base técnica", "Le socle technique"),
 "The engineering layer that makes AI-native real: MLOps, AI-assisted development, and end-to-end automation across the delivery pipeline &mdash; from commit to production, with quality and security built in. This is what turns AI pilots into shipped, governed capability.": (
  "La capa de ingeniería que hace real lo AI-native: MLOps, desarrollo asistido por IA y automatización de extremo a extremo en todo el pipeline de entrega, del commit a producción, con calidad y seguridad integradas. Esto es lo que convierte los pilotos de IA en capacidad entregada y gobernada.",
  "La couche d'ingénierie qui rend l'AI-native concret : MLOps, développement assisté par IA et automatisation de bout en bout sur toute la chaîne de livraison — du commit à la production, avec la qualité et la sécurité intégrées. C'est ce qui transforme les pilotes d'IA en capacité livrée et gouvernée."),
 "Layer 05 / 05": ("Capa 05 / 05", "Couche 05 / 05"),
 "Sense &amp; respond at AI-age speed": (
  "Detectar y responder a la velocidad de la era de la IA",
  "Détecter et réagir à la vitesse de l'ère de l'IA"),
 "The layer that makes change permanent. Mutation Readiness is the discipline of sensing and responding at AI-age speed &mdash; so the transformation keeps adapting instead of snapping back to the old ways. It&rsquo;s the difference between a one-time program and an enterprise that never stops evolving.": (
  "La capa que hace permanente el cambio. Mutation Readiness es la disciplina de detectar y responder a la velocidad de la era de la IA, para que la transformación siga adaptándose en lugar de revertir a las viejas costumbres. Es la diferencia entre un programa puntual y una empresa que nunca deja de evolucionar.",
  "La couche qui rend le changement permanent. Mutation Readiness est la discipline consistant à détecter et réagir à la vitesse de l'ère de l'IA — pour que la transformation continue de s'adapter au lieu de revenir aux anciennes habitudes. C'est la différence entre un programme ponctuel et une entreprise qui n'arrête jamais d'évoluer."),
 # ---- closing CTA
 "Ready to ship the": ("¿Listo para entregar el", "Prêt à livrer le"),
 ", not just the certification?": (
  " y no solo la certificación?", ", pas seulement la certification ?"),
 "15 minutes with an SPCT. We&rsquo;ll diagnose which of the five layers your enterprise is missing &mdash; and name the one shift to make next.": (
  "15 minutos con un SPCT. Diagnosticaremos cuál de las cinco capas le falta a tu empresa y señalaremos el único cambio que conviene hacer a continuación.",
  "15 minutes avec un SPCT. Nous diagnostiquerons laquelle des cinq couches manque à votre entreprise — et nommerons le seul changement à opérer ensuite."),
 "Talk to our team &#10230;": (
  "Habla con nuestro equipo &#10230;", "Parler à notre équipe &#10230;"),
 "See all services": ("Ver todos los servicios", "Voir tous les services"),
}
