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

# ---------------------------------------------------------------- Layer 02
# Scaling Iterative Model. Framework names (SAFe, Scrum@Scale, LeSS,
# Disciplined Agile, Spotify Model, Nexus), client names and "Business Agility"
# (our practice name) stay English.
KEEP |= {
    "SAFe", "Scrum@Scale", "LeSS", "Disciplined Agile (DA)", "Spotify Model",
    "Nexus", "Business Agility", "Business Agility (our SAFe practice) &rarr;",
    "Deloitte", "McKinsey", "KPMG", "BCG", "PwC", "IBM",
    "VALUE STREAMS", "LEAN PORTFOLIO",
}

FIVE.update({
 "Scaling &middot; framework-agnostic": (
  "Escalado &middot; independiente del marco",
  "Mise à l'échelle &middot; indépendante du cadre"),
 "Scale delivery with the": (
  "Escala la entrega con el", "Faites passer la livraison à l'échelle avec le"),
 "model that fits": ("modelo que encaja", "modèle qui convient"),
 "Scaling agile past a handful of teams is where most transformations break &mdash; dependencies multiply, alignment erodes, and delivery slows just when it should speed up. A large-scale iterative operating model fixes that: value streams, a fixed cadence, and Lean portfolio governance that funds outcomes, not projects. The framework is a means, not the goal &mdash; we implement the one that fits.": (
  "Escalar la agilidad más allá de un puñado de equipos es donde se rompen la mayoría de las transformaciones: las dependencias se multiplican, la alineación se erosiona y la entrega se ralentiza justo cuando debería acelerar. Un modelo operativo iterativo a gran escala lo corrige: value streams, una cadencia fija y gobernanza Lean de portafolio que financia resultados, no proyectos. El marco es un medio, no el objetivo: implementamos el que encaja.",
  "Passer l'agilité à l'échelle au-delà d'une poignée d'équipes, c'est là que la plupart des transformations cassent : les dépendances se multiplient, l'alignement s'érode et la livraison ralentit au moment même où elle devrait accélérer. Un modèle opérationnel itératif à grande échelle corrige cela : value streams, cadence fixe et gouvernance Lean du portefeuille qui finance des résultats, pas des projets. Le cadre est un moyen, pas le but — nous implémentons celui qui convient."),
 "FIXED CADENCE": ("CADENCIA FIJA", "CADENCE FIXE"),
 "FRAMEWORK-AGNOSTIC": ("INDEPENDIENTE DEL MARCO", "INDÉPENDANT DU CADRE"),
 "At a glance &mdash; what we deliver": (
  "De un vistazo: lo que entregamos", "En bref — ce que nous livrons"),
 "Value-stream identification across the enterprise": (
  "Identificación de value streams en toda la empresa",
  "Identification des value streams dans toute l'entreprise"),
 "A fixed delivery cadence &amp; synchronized planning": (
  "Una cadencia de entrega fija y planificación sincronizada",
  "Une cadence de livraison fixe et une planification synchronisée"),
 "Lean portfolio governance &mdash; fund outcomes, not projects": (
  "Gobernanza Lean de portafolio: financiar resultados, no proyectos",
  "Gouvernance Lean du portefeuille — financer des résultats, pas des projets"),
 "The right framework selected &amp; implemented for your context": (
  "El marco adecuado, seleccionado e implementado para tu contexto",
  "Le bon cadre, sélectionné et implémenté pour votre contexte"),
 "Trains launched, LACE coached through year one": (
  "Trenes lanzados y LACE acompañado durante el primer año",
  "Trains lancés et LACE accompagné durant la première année"),
 "Get in touch &#10230;": ("Ponte en contacto &#10230;", "Nous contacter &#10230;"),
 "productivity gains": ("de mejora en productividad", "de gains de productivité"),
 "higher engagement": ("más compromiso", "d'engagement en plus"),
 "quality improvement": ("de mejora en calidad", "d'amélioration de la qualité"),
 # 01
 "( 01 ) &mdash; Why scale iteratively: the business need": (
  "( 01 ) &mdash; Por qué escalar de forma iterativa: la necesidad de negocio",
  "( 01 ) &mdash; Pourquoi passer à l'échelle de façon itérative : le besoin métier"),
 "Agile that stalls at scale is": (
  "La agilidad que se estanca al escalar es", "L'agilité qui s'enlise à l'échelle est"),
 "a business problem.": ("un problema de negocio.", "un problème métier."),
 "A few strong teams don&rsquo;t make an agile enterprise. When delivery spans dozens of teams, coordination cost, dependency hell, and misalignment quietly erase the speed you set out to gain. A scaling operating model is how flow survives the jump.": (
  "Unos pocos equipos fuertes no hacen una empresa ágil. Cuando la entrega abarca decenas de equipos, el coste de coordinación, el infierno de dependencias y la falta de alineación borran en silencio la velocidad que buscabas ganar. Un modelo operativo de escalado es lo que permite que el flujo sobreviva al salto.",
  "Quelques équipes performantes ne font pas une entreprise agile. Quand la livraison s'étend à des dizaines d'équipes, le coût de coordination, l'enfer des dépendances et le désalignement effacent silencieusement la vitesse que vous cherchiez à gagner. Un modèle opérationnel de mise à l'échelle, c'est ce qui permet au flux de survivre au saut."),
 "Scaling without an operating model": (
  "Escalar sin un modelo operativo", "Passer à l'échelle sans modèle opérationnel"),
 "Coordination cost grows faster than team count": (
  "El coste de coordinación crece más rápido que el número de equipos",
  "Le coût de coordination croît plus vite que le nombre d'équipes"),
 "Dependency hell &mdash; teams block each other, work stalls": (
  "Infierno de dependencias: los equipos se bloquean entre sí y el trabajo se detiene",
  "Enfer des dépendances — les équipes se bloquent, le travail s'arrête"),
 "Misalignment &mdash; teams optimize locally, not for the goal": (
  "Falta de alineación: los equipos optimizan localmente, no para el objetivo",
  "Désalignement — les équipes optimisent localement, pas pour l'objectif"),
 "Slow delivery &mdash; speed erodes exactly when it should rise": (
  "Entrega lenta: la velocidad se erosiona justo cuando debería subir",
  "Livraison lente — la vitesse s'érode précisément quand elle devrait monter"),
 "Pilots that never scale &mdash; success stays trapped in one team": (
  "Pilotos que nunca escalan: el éxito queda atrapado en un solo equipo",
  "Des pilotes qui ne passent jamais à l'échelle — le succès reste prisonnier d'une équipe"),
 "What a scaling operating model delivers": (
  "Lo que aporta un modelo operativo de escalado",
  "Ce qu'apporte un modèle opérationnel de mise à l'échelle"),
 "Flow at scale": ("Flujo a escala", "Le flux à l'échelle"),
 "&mdash; value moves across teams, not around them": (
  "&mdash; el valor se mueve a través de los equipos, no rodeándolos",
  "&mdash; la valeur circule à travers les équipes, pas autour d'elles"),
 "Aligned funding": ("Financiación alineada", "Financement aligné"),
 "&mdash; Lean budgets fund outcomes, not projects": (
  "&mdash; los Lean budgets financian resultados, no proyectos",
  "&mdash; les Lean budgets financent des résultats, pas des projets"),
 "Predictable cadence": ("Cadencia predecible", "Cadence prévisible"),
 "&mdash; synchronized planning, a reliable heartbeat": (
  "&mdash; planificación sincronizada, un pulso fiable",
  "&mdash; planification synchronisée, un rythme fiable"),
 "Dependencies managed": ("Dependencias gestionadas", "Dépendances maîtrisées"),
 "&mdash; surfaced and resolved in the open": (
  "&mdash; visibles y resueltas a la vista de todos",
  "&mdash; rendues visibles et résolues au grand jour"),
 "Transformation that sticks": (
  "Una transformación que se sostiene", "Une transformation qui tient"),
 "&mdash; a model, not a one-off launch": (
  "&mdash; un modelo, no un lanzamiento puntual",
  "&mdash; un modèle, pas un lancement ponctuel"),
 # 02
 "( 02 ) &mdash; The scaling landscape": (
  "( 02 ) &mdash; El panorama del escalado",
  "( 02 ) &mdash; Le paysage de la mise à l'échelle"),
 "Many frameworks.": ("Muchos marcos.", "Beaucoup de cadres."),
 "One that fits you.": ("Uno que encaja contigo.", "Un seul qui vous convient."),
 "The market has converged on a handful of proven models for scaling iterative delivery. Each solves the same problem from a different starting point.": (
  "El mercado ha convergido en un puñado de modelos probados para escalar la entrega iterativa. Cada uno resuelve el mismo problema desde un punto de partida distinto.",
  "Le marché a convergé vers une poignée de modèles éprouvés pour passer la livraison itérative à l'échelle. Chacun résout le même problème depuis un point de départ différent."),
 "SPOTLIGHT": ("DESTACADO", "EN VEDETTE"),
 "The most widely adopted scaling framework in the State of Agile report &mdash; portfolio-to-team, ARTs, and PI planning.": (
  "El marco de escalado más adoptado según el informe State of Agile: del portafolio al equipo, ARTs y PI planning.",
  "Le cadre de mise à l'échelle le plus adopté selon le rapport State of Agile — du portefeuille à l'équipe, ARTs et PI planning."),
 "A scale-free network of teams-of-teams extending Scrum.": (
  "Una red sin escala de equipos de equipos que extiende Scrum.",
  "Un réseau sans échelle d'équipes d'équipes qui étend Scrum."),
 "Large-Scale Scrum &mdash; minimalist scaling with one product backlog across teams.": (
  "Large-Scale Scrum: escalado minimalista con un único product backlog para todos los equipos.",
  "Large-Scale Scrum — mise à l'échelle minimaliste avec un seul product backlog pour toutes les équipes."),
 "A context-driven toolkit of practices, now under PMI.": (
  "Un kit de prácticas guiado por el contexto, ahora bajo PMI.",
  "Une boîte à outils de pratiques guidée par le contexte, désormais sous l'égide du PMI."),
 "Squads, tribes, chapters, and guilds &mdash; a structure and culture pattern.": (
  "Squads, tribes, chapters y guilds: un patrón de estructura y cultura.",
  "Squads, tribes, chapters et guilds — un modèle de structure et de culture."),
 "A lightweight framework from Scrum.org for 3&ndash;9 Scrum teams.": (
  "Un marco ligero de Scrum.org para entre 3 y 9 equipos Scrum.",
  "Un cadre léger de Scrum.org pour 3 à 9 équipes Scrum."),
 "Source: adoption patterns from the annual State of Agile report &mdash; SAFe is consistently the most-used scaling method. We are framework-agnostic: we implement the model that fits your context, risk tolerance, and starting point.": (
  "Fuente: patrones de adopción del informe anual State of Agile; SAFe es de forma consistente el método de escalado más utilizado. Somos independientes del marco: implementamos el modelo que encaja con tu contexto, tu tolerancia al riesgo y tu punto de partida.",
  "Source : tendances d'adoption du rapport annuel State of Agile — SAFe est constamment la méthode de mise à l'échelle la plus utilisée. Nous sommes indépendants du cadre : nous implémentons le modèle qui correspond à votre contexte, à votre tolérance au risque et à votre point de départ."),
 # 03
 "( 03 ) &mdash; How we implement": (
  "( 03 ) &mdash; Cómo lo implementamos", "( 03 ) &mdash; Comment nous implémentons"),
 "Three moves from": ("Tres movimientos del", "Trois mouvements du"),
 "pilot to portfolio.": ("piloto al portafolio.", "pilote au portefeuille."),
 "DIAGNOSE": ("DIAGNOSTICAR", "DIAGNOSTIQUER"),
 "Diagnose the state": ("Diagnosticar el estado", "Diagnostiquer l'état"),
 "Map your current scaling state &mdash; team topology, dependencies, funding model, and where flow breaks today.": (
  "Mapea tu estado actual de escalado: topología de equipos, dependencias, modelo de financiación y dónde se rompe el flujo hoy.",
  "Cartographiez votre état actuel de mise à l'échelle — topologie des équipes, dépendances, modèle de financement et points de rupture du flux aujourd'hui."),
 "DESIGN": ("DISEÑAR", "CONCEVOIR"),
 "Design the model": ("Diseñar el modelo", "Concevoir le modèle"),
 "Design the value-stream, cadence, and Lean-portfolio model &mdash; and select the framework that fits your context.": (
  "Diseña el modelo de value streams, cadencia y portafolio Lean, y selecciona el marco que encaja con tu contexto.",
  "Concevez le modèle de value streams, de cadence et de portefeuille Lean — et sélectionnez le cadre qui correspond à votre contexte."),
 "LAUNCH": ("LANZAR", "LANCER"),
 "Launch &amp; coach": ("Lanzar y acompañar", "Lancer et accompagner"),
 "Launch the trains, run the first planning increments, and coach the LACE to own and sustain the model.": (
  "Lanza los trenes, ejecuta los primeros incrementos de planificación y acompaña al LACE para que asuma y sostenga el modelo.",
  "Lancez les trains, menez les premiers incréments de planification et accompagnez le LACE pour qu'il porte et pérennise le modèle."),
 # 04
 "( 04 ) &mdash; Our flagship implementation: SAFe": (
  "( 04 ) &mdash; Nuestra implementación insignia: SAFe",
  "( 04 ) &mdash; Notre implémentation phare : SAFe"),
 "is our SAFe-based implementation of this model.": (
  "es nuestra implementación de este modelo basada en SAFe.",
  "est notre implémentation de ce modèle fondée sur SAFe."),
 "When SAFe is the right fit &mdash; and for most large enterprises it is &mdash; our Business Agility practice is how we deliver it end to end. An SPCT leads the rollout: value streams and ARTs, PI planning, and Lean Portfolio Management woven into a 4-layer, AI-Native methodology. You get the scaling model of this page, implemented by the framework the market trusts most. Role-based certification is available through our": (
  "Cuando SAFe es lo que encaja —y para la mayoría de las grandes empresas lo es—, nuestra práctica de Business Agility es la forma en que lo entregamos de extremo a extremo. Un SPCT lidera el despliegue: value streams y ARTs, PI planning y Lean Portfolio Management integrados en una metodología AI-Native de 4 capas. Obtienes el modelo de escalado de esta página, implementado con el marco en el que más confía el mercado. La certificación por rol está disponible a través de nuestra práctica de",
  "Quand SAFe est le bon choix — et pour la plupart des grandes entreprises il l'est —, notre pratique Business Agility est la façon dont nous le livrons de bout en bout. Un SPCT pilote le déploiement : value streams et ARTs, PI planning et Lean Portfolio Management intégrés dans une méthodologie AI-Native en 4 couches. Vous obtenez le modèle de mise à l'échelle de cette page, implémenté par le cadre auquel le marché fait le plus confiance. La certification par rôle est disponible via notre pratique de"),
 "training": ("formación", "formation"),
 "practice.": (".", "."),
 "Explore SAFe training &#10230;": (
  "Explora la formación SAFe &#10230;", "Découvrir la formation SAFe &#10230;"),
 # 05
 "( 05 ) &mdash; Outcomes": ("( 05 ) &mdash; Resultados", "( 05 ) &mdash; Résultats"),
 "What scaling done right": (
  "Lo que un escalado bien hecho", "Ce qu'une mise à l'échelle bien menée"),
 "delivers.": ("aporta.", "apporte."),
 "FASTER TIME-TO-MARKET": (
  "SALIDA AL MERCADO MÁS RÁPIDA", "MISE SUR LE MARCHÉ PLUS RAPIDE"),
 "QUALITY IMPROVEMENT": ("MEJORA DE LA CALIDAD", "AMÉLIORATION DE LA QUALITÉ"),
 "PRODUCTIVITY GAIN": ("GANANCIA DE PRODUCTIVIDAD", "GAIN DE PRODUCTIVITÉ"),
 "ENGAGEMENT / eNPS": ("COMPROMISO / eNPS", "ENGAGEMENT / eNPS"),
 "Source: typical business results reported by enterprises adopting scaled agile &mdash; Scaled Agile, Inc. and industry benchmarks. Actual outcomes depend on starting state, executive alignment, and follow-through.": (
  "Fuente: resultados de negocio habituales reportados por empresas que adoptan agilidad escalada; Scaled Agile, Inc. y referencias del sector. Los resultados reales dependen del punto de partida, la alineación directiva y la constancia.",
  "Source : résultats métier typiques rapportés par les entreprises adoptant l'agilité à l'échelle — Scaled Agile, Inc. et références sectorielles. Les résultats réels dépendent du point de départ, de l'alignement des dirigeants et de la constance."),
 # 06
 "( 06 ) &mdash; Industries we serve": (
  "( 06 ) &mdash; Sectores a los que servimos",
  "( 06 ) &mdash; Les secteurs que nous servons"),
 "Built for the global &mdash;": ("Diseñado para lo global,", "Conçu pour le global —"),
 "optimized for the local.": ("optimizado para lo local.", "optimisé pour le local."),
 "We deliver into the sectors where transformation is hardest &mdash; banking, energy, defense, insurance, and professional services &mdash; and where the credential behind the trainer matters most.": (
  "Entregamos en los sectores donde la transformación es más difícil —banca, energía, defensa, seguros y servicios profesionales— y donde más importa la credencial que respalda al formador.",
  "Nous intervenons dans les secteurs où la transformation est la plus difficile — banque, énergie, défense, assurance et services professionnels — et où la certification du formateur compte le plus."),
 "Financial Services": ("Servicios financieros", "Services financiers"),
 "Public Sector &amp; Government": ("Sector público y gobierno", "Secteur public et administrations"),
 "Non-Profit &amp; Social Impact": (
  "Organizaciones sin ánimo de lucro e impacto social",
  "Associations et impact social"),
 "Telecommunications": ("Telecomunicaciones", "Télécommunications"),
 "Education &amp; Healthcare": ("Educación y sanidad", "Éducation et santé"),
 "Defense &amp; Aerospace": ("Defensa y aeroespacial", "Défense et aérospatiale"),
 "Professional Services &amp; Tech": (
  "Servicios profesionales y tecnología", "Services professionnels et technologie"),
 "Goods-Producing &amp; Supply Chain": (
  "Producción de bienes y cadena de suministro",
  "Production de biens et chaîne d'approvisionnement"),
 "Trusted by teams at": ("Con la confianza de equipos en", "La confiance des équipes de"),
 "Federal": ("Gobierno federal", "Gouvernement fédéral"),
 "Provincial": ("Gobierno provincial", "Gouvernement provincial"),
 "TRANSFORMATION ROADMAP": ("HOJA DE RUTA DE TRANSFORMACIÓN", "FEUILLE DE ROUTE DE TRANSFORMATION"),
 "&ldquo;They aligned leadership, improved delivery flow, and established governance &mdash; then handed us a practical roadmap that actually fit our organization. Executive coaching and hands-on implementation made a measurable difference.&rdquo;": (
  "«Alinearon a la dirección, mejoraron el flujo de entrega y establecieron la gobernanza; después nos entregaron una hoja de ruta práctica que de verdad encajaba con nuestra organización. El coaching a directivos y la implementación sobre el terreno marcaron una diferencia medible.»",
  "« Ils ont aligné la direction, amélioré le flux de livraison et établi la gouvernance — puis nous ont remis une feuille de route concrète, réellement adaptée à notre organisation. Le coaching des dirigeants et la mise en œuvre sur le terrain ont fait une différence mesurable. »"),
 "Enterprise transformation lead": (
  "Responsable de transformación empresarial",
  "Responsable de la transformation d'entreprise"),
 "&mdash; enterprise transformation": (
  "&mdash; transformación empresarial", "&mdash; transformation d'entreprise"),
 "ART EXECUTION": ("EJECUCIÓN DEL ART", "EXÉCUTION DE L'ART"),
 "&ldquo;Their coaching helped us establish clearer roles, sharpen PI Planning, and strengthen dependency management across teams. They focused on practical outcomes rather than simply following a framework.&rdquo;": (
  "«Su acompañamiento nos ayudó a definir roles más claros, afinar el PI Planning y reforzar la gestión de dependencias entre equipos. Se centraron en resultados prácticos en lugar de limitarse a seguir un marco.»",
  "« Leur accompagnement nous a aidés à clarifier les rôles, à affiner le PI Planning et à renforcer la gestion des dépendances entre équipes. Ils se sont concentrés sur des résultats concrets plutôt que sur l'application d'un cadre. »"),
 "Delivery predictability lead": (
  "Responsable de previsibilidad de entrega",
  "Responsable de la prévisibilité de livraison"),
 "&mdash; ART execution": ("&mdash; ejecución del ART", "&mdash; exécution de l'ART"),
 "WAYS OF WORKING": ("FORMAS DE TRABAJO", "MODES DE TRAVAIL"),
 "&ldquo;They worked closely with our leaders, RTEs, Product Management, and Scrum Masters to build sustainable ways of working instead of temporary fixes &mdash; creating lasting improvements across multiple teams.&rdquo;": (
  "«Trabajaron codo con codo con nuestros líderes, RTEs, Product Management y Scrum Masters para construir formas de trabajo sostenibles en lugar de parches temporales, generando mejoras duraderas en varios equipos.»",
  "« Ils ont travaillé étroitement avec nos dirigeants, RTEs, Product Management et Scrum Masters pour bâtir des modes de travail durables plutôt que des correctifs temporaires — créant des améliorations pérennes sur plusieurs équipes. »"),
 "Ways-of-working lead": (
  "Responsable de formas de trabajo", "Responsable des modes de travail"),
 "&mdash; sustainable delivery": (
  "&mdash; entrega sostenible", "&mdash; livraison durable"),
 "See the full customer results &#10230;": (
  "Ver todos los resultados de clientes &#10230;",
  "Voir tous les résultats clients &#10230;"),
 "Ready to scale iteratively?": (
  "¿Listo para escalar de forma iterativa?",
  "Prêt à passer à l'échelle de façon itérative ?"),
 "15 minutes with an SPCT. No deck, no pitch &mdash; a real conversation about your scaling state and which operating model fits your context.": (
  "15 minutos con un SPCT. Sin presentación ni discurso comercial: una conversación real sobre tu estado de escalado y qué modelo operativo encaja con tu contexto.",
  "15 minutes avec un SPCT. Sans support ni argumentaire — une vraie conversation sur votre état de mise à l'échelle et le modèle opérationnel qui convient à votre contexte."),
 "Back to the operating model": (
  "Volver al modelo operativo", "Retour au modèle opérationnel"),
})

# ---------------------------------------------------------------- Layer 03
# AI-Native Operating Model. "AI-Native", "human-in-the-loop" and the ladder
# rung name "Agentic" stay English, as they do on the live English pages.
KEEP |= {"AI-Native Operating Model", "AI-Native training &rarr;", "Agentic"}

FIVE.update({
 "AI-Native &middot; the age-of-AI operating model": (
  "AI-Native &middot; el modelo operativo de la era de la IA",
  "AI-Native &middot; le modèle opérationnel de l'ère de l'IA"),
 "Make AI native to": ("Haz que la IA sea nativa en", "Rendez l'IA native à"),
 "how you work": ("tu forma de trabajar", "votre façon de travailler"),
 "AI is rewriting how work gets done &mdash; but bolting a few copilots onto old ways of working barely moves the needle. The gains leak away in unchanged processes, roles, and governance. Becoming AI-Native means AI is woven into every role, ceremony, and workflow: it drafts, analyzes, tests, and decides alongside your people, inside clear guardrails. It is not a tool you buy &mdash; it is an operating model you adopt.": (
  "La IA está reescribiendo cómo se hace el trabajo, pero añadir un par de copilotos a formas de trabajo antiguas apenas mueve la aguja. Las ganancias se pierden en procesos, roles y gobernanza que no han cambiado. Ser AI-Native significa que la IA está integrada en cada rol, ceremonia y flujo de trabajo: redacta, analiza, prueba y decide junto a tus personas, dentro de guardrails claros. No es una herramienta que compras: es un modelo operativo que adoptas.",
  "L'IA réécrit la façon dont le travail se fait — mais greffer quelques copilotes sur d'anciennes méthodes ne change presque rien. Les gains se dissipent dans des processus, des rôles et une gouvernance inchangés. Devenir AI-Native signifie que l'IA est intégrée à chaque rôle, cérémonie et flux de travail : elle rédige, analyse, teste et décide aux côtés de vos équipes, dans des guardrails clairs. Ce n'est pas un outil que l'on achète — c'est un modèle opérationnel que l'on adopte."),
 "EVERY ROLE": ("CADA ROL", "CHAQUE RÔLE"),
 "EVERY CEREMONY": ("CADA CEREMONIA", "CHAQUE CÉRÉMONIE"),
 "EVERY WORKFLOW": ("CADA FLUJO DE TRABAJO", "CHAQUE FLUX DE TRAVAIL"),
 "HUMAN-IN-THE-LOOP": ("CON INTERVENCIÓN HUMANA", "AVEC INTERVENTION HUMAINE"),
 "AI woven into planning, delivery &amp; governance ceremonies": (
  "IA integrada en las ceremonias de planificación, entrega y gobernanza",
  "IA intégrée aux cérémonies de planification, de livraison et de gouvernance"),
 "Role-by-role AI augmentation playbooks": (
  "Manuales de aumento con IA rol por rol",
  "Playbooks d'augmentation par l'IA, rôle par rôle"),
 "Guardrails, governance &amp; human-in-the-loop controls": (
  "Guardrails, gobernanza y controles con intervención humana",
  "Guardrails, gouvernance et contrôles avec intervention humaine"),
 "AI-Native metrics that prove the productivity lift": (
  "Métricas AI-Native que demuestran la mejora de productividad",
  "Métriques AI-Native qui prouvent le gain de productivité"),
 "Teams upskilled &amp; certified to work AI-Native": (
  "Equipos formados y certificados para trabajar AI-Native",
  "Équipes formées et certifiées pour travailler en AI-Native"),
 "faster task completion": (
  "más rápido en completar tareas", "d'exécution des tâches plus rapide"),
 "less time on routine work": (
  "menos tiempo en trabajo rutinario", "de temps en moins sur le travail routinier"),
 "more throughput per team": (
  "más rendimiento por equipo", "de débit en plus par équipe"),
 "faster onboarding": ("más rápido en incorporación", "d'intégration plus rapide"),
 # 01
 "( 01 ) &mdash; Why AI-Native: the business need": (
  "( 01 ) &mdash; Por qué AI-Native: la necesidad de negocio",
  "( 01 ) &mdash; Pourquoi AI-Native : le besoin métier"),
 "Bolt-on AI is": ("La IA añadida por encima es", "L'IA greffée par-dessus est"),
 "a business dead end.": (
  "un callejón sin salida para el negocio.", "une impasse pour le métier."),
 "Buying licenses is not a strategy. When AI is a side tool a few people open now and then, the productivity shows up in isolated tasks and evaporates before it reaches the P&amp;L. The value is unlocked only when AI is designed into the operating model &mdash; the roles, the cadence, the decisions, and the guardrails around them.": (
  "Comprar licencias no es una estrategia. Cuando la IA es una herramienta secundaria que unos pocos abren de vez en cuando, la productividad aparece en tareas aisladas y se evapora antes de llegar a la cuenta de resultados. El valor solo se libera cuando la IA se diseña dentro del modelo operativo: los roles, la cadencia, las decisiones y los guardrails que las rodean.",
  "Acheter des licences n'est pas une stratégie. Quand l'IA est un outil d'appoint que quelques personnes ouvrent de temps en temps, la productivité apparaît sur des tâches isolées et s'évapore avant d'atteindre le compte de résultat. La valeur ne se libère que lorsque l'IA est conçue dans le modèle opérationnel — les rôles, la cadence, les décisions et les guardrails qui les encadrent."),
 "AI bolted onto old ways of working": (
  "IA añadida a formas de trabajo antiguas",
  "L'IA greffée sur d'anciennes méthodes de travail"),
 "Gains trapped in individual tasks, never in outcomes": (
  "Ganancias atrapadas en tareas individuales, nunca en resultados",
  "Des gains prisonniers de tâches individuelles, jamais des résultats"),
 "Shadow AI &mdash; ungoverned use, real compliance risk": (
  "IA en la sombra: uso sin gobernanza y riesgo real de cumplimiento",
  "Shadow AI — usage non gouverné, risque de conformité réel"),
 "No metrics &mdash; nobody can prove the ROI": (
  "Sin métricas: nadie puede demostrar el retorno",
  "Pas de métriques — personne ne peut prouver le retour"),
 "Skill gaps &mdash; teams unsure how to work with AI": (
  "Brechas de competencia: los equipos no saben cómo trabajar con IA",
  "Lacunes de compétences — les équipes ne savent pas comment travailler avec l'IA"),
 "Pilots that stall &mdash; enthusiasm without an operating model": (
  "Pilotos que se estancan: entusiasmo sin modelo operativo",
  "Des pilotes qui s'enlisent — de l'enthousiasme sans modèle opérationnel"),
 "An AI-Native operating model": (
  "Un modelo operativo AI-Native", "Un modèle opérationnel AI-Native"),
 "AI in every ceremony": ("IA en cada ceremonia", "L'IA dans chaque cérémonie"),
 "&mdash; planning, delivery, review, retro": (
  "&mdash; planificación, entrega, revisión y retrospectiva",
  "&mdash; planification, livraison, revue, rétrospective"),
 "Governed by design": ("Gobernada por diseño", "Gouvernée par conception"),
 "&mdash; guardrails and human-in-the-loop": (
  "&mdash; guardrails e intervención humana",
  "&mdash; guardrails et intervention humaine"),
 "Measured": ("Medida", "Mesurée"),
 "&mdash; AI-Native metrics tied to business outcomes": (
  "&mdash; métricas AI-Native ligadas a resultados de negocio",
  "&mdash; métriques AI-Native reliées aux résultats métier"),
 "Skilled teams": ("Equipos competentes", "Équipes compétentes"),
 "&mdash; people who know how to direct AI": (
  "&mdash; personas que saben dirigir la IA",
  "&mdash; des personnes qui savent diriger l'IA"),
 "Compounding gains": ("Ganancias que se acumulan", "Des gains qui se cumulent"),
 "&mdash; productivity that reaches the P&amp;L": (
  "&mdash; productividad que llega a la cuenta de resultados",
  "&mdash; une productivité qui atteint le compte de résultat"),
 # 02 ladder
 "( 02 ) &mdash; The AI-Native ladder": (
  "( 02 ) &mdash; La escalera AI-Native", "( 02 ) &mdash; L'échelle AI-Native"),
 "From assisted": ("De asistido", "De l'assisté"),
 "to AI-Native.": ("a AI-Native.", "à l'AI-Native."),
 "Most enterprises sit on the bottom rung &mdash; a few copilots, ungoverned. The value lives higher up, where AI is embedded in how the whole organization operates.": (
  "La mayoría de las empresas está en el peldaño más bajo: unos pocos copilotos, sin gobernanza. El valor vive más arriba, donde la IA está integrada en cómo opera toda la organización.",
  "La plupart des entreprises se situent sur le premier barreau — quelques copilotes, sans gouvernance. La valeur se trouve plus haut, là où l'IA est intégrée au fonctionnement de toute l'organisation."),
 "RUNG 01": ("PELDAÑO 01", "BARREAU 01"),
 "RUNG 02": ("PELDAÑO 02", "BARREAU 02"),
 "RUNG 03": ("PELDAÑO 03", "BARREAU 03"),
 "RUNG 04": ("PELDAÑO 04", "BARREAU 04"),
 "Assisted": ("Asistido", "Assisté"),
 "Individuals use copilots ad hoc. Gains are personal and invisible to the business.": (
  "Las personas usan copilotos de forma puntual. Las ganancias son personales e invisibles para el negocio.",
  "Les individus utilisent des copilotes de façon ponctuelle. Les gains sont personnels et invisibles pour l'entreprise."),
 "Augmented": ("Aumentado", "Augmenté"),
 "Teams standardize AI into shared workflows &mdash; consistent, but still bounded by old process.": (
  "Los equipos estandarizan la IA en flujos de trabajo compartidos: consistente, pero todavía limitado por el proceso antiguo.",
  "Les équipes standardisent l'IA dans des flux de travail partagés — cohérent, mais encore borné par l'ancien processus."),
 "TARGET": ("OBJETIVO", "CIBLE"),
 "AI is designed into every role, ceremony, and decision &mdash; governed, measured, compounding.": (
  "La IA está diseñada en cada rol, ceremonia y decisión: gobernada, medida y acumulativa.",
  "L'IA est conçue dans chaque rôle, cérémonie et décision — gouvernée, mesurée, cumulative."),
 "AI agents run whole workflows end-to-end under human oversight &mdash; the frontier we build toward.": (
  "Los agentes de IA ejecutan flujos de trabajo completos de extremo a extremo bajo supervisión humana: la frontera hacia la que construimos.",
  "Des agents IA exécutent des flux de travail complets de bout en bout sous supervision humaine — la frontière vers laquelle nous construisons."),
 "The jump that matters is from rung 2 to rung 3 &mdash; where AI stops being a personal tool and becomes native to the operating model. That is the work.": (
  "El salto que importa es del peldaño 2 al 3, donde la IA deja de ser una herramienta personal y pasa a ser nativa del modelo operativo. Ese es el trabajo.",
  "Le saut qui compte est celui du barreau 2 au barreau 3 — là où l'IA cesse d'être un outil personnel pour devenir native au modèle opérationnel. C'est là qu'est le travail."),
 # 03
 "Three moves to": ("Tres movimientos hacia", "Trois mouvements vers"),
 "AI-Native.": ("AI-Native.", "l'AI-Native."),
 "Diagnose AI readiness": (
  "Diagnosticar la preparación para la IA", "Diagnostiquer la maturité IA"),
 "Map where AI already touches the work, where it should, and the governance and skill gaps in the way.": (
  "Mapea dónde la IA ya toca el trabajo, dónde debería hacerlo y qué brechas de gobernanza y competencia lo impiden.",
  "Cartographiez où l'IA touche déjà le travail, où elle devrait le faire, et les lacunes de gouvernance et de compétences qui font obstacle."),
 "REDESIGN": ("REDISEÑAR", "RECONCEVOIR"),
 "Redesign the work": ("Rediseñar el trabajo", "Reconcevoir le travail"),
 "Rebuild roles, ceremonies, and workflows around AI &mdash; with guardrails and human-in-the-loop controls baked in.": (
  "Reconstruye roles, ceremonias y flujos de trabajo en torno a la IA, con guardrails y controles de intervención humana integrados.",
  "Reconstruisez les rôles, les cérémonies et les flux de travail autour de l'IA — avec des guardrails et des contrôles d'intervention humaine intégrés."),
 "EMBED": ("INTEGRAR", "INTÉGRER"),
 "Embed &amp; upskill": ("Integrar y formar", "Intégrer et monter en compétences"),
 "Certify the teams, stand up the metrics, and coach the model until working AI-Native is simply how work is done.": (
  "Certifica a los equipos, pon en marcha las métricas y acompaña el modelo hasta que trabajar AI-Native sea sencillamente la forma de trabajar.",
  "Certifiez les équipes, mettez en place les métriques et accompagnez le modèle jusqu'à ce que travailler en AI-Native devienne simplement la façon de travailler."),
 # 04
 "( 04 ) &mdash; How your people learn it: AI-Native training": (
  "( 04 ) &mdash; Cómo lo aprenden tus equipos: formación AI-Native",
  "( 04 ) &mdash; Comment vos équipes l'apprennent : la formation AI-Native"),
 "Our": ("Nuestra", "Notre"),
 "AI-Native training": ("formación AI-Native", "formation AI-Native"),
 "is how teams learn to work this way.": (
  "es como los equipos aprenden a trabajar así.",
  "est la façon dont les équipes apprennent à travailler ainsi."),
 "An operating model only sticks when people can run it. Our AI-Native program &mdash; delivered live by the only face-to-face AI-Native instructor in Canada &mdash; teaches practitioners to direct AI across planning, delivery, and governance, safely and with judgment. It is the fastest path from &ldquo;we bought licenses&rdquo; to &ldquo;this is how we work.&rdquo; Explore the curriculum in our": (
  "Un modelo operativo solo se sostiene cuando las personas saben ejecutarlo. Nuestro programa AI-Native, impartido en vivo por el único instructor AI-Native presencial en Canadá, enseña a los profesionales a dirigir la IA en planificación, entrega y gobernanza, con seguridad y criterio. Es el camino más rápido de «compramos licencias» a «así es como trabajamos». Explora el programa en nuestra",
  "Un modèle opérationnel ne tient que si les personnes savent le faire vivre. Notre programme AI-Native, animé en direct par le seul instructeur AI-Native en présentiel au Canada, apprend aux praticiens à diriger l'IA en planification, en livraison et en gouvernance, en sécurité et avec discernement. C'est le chemin le plus court entre « nous avons acheté des licences » et « c'est ainsi que nous travaillons ». Découvrez le programme dans notre"),
 "Face-to-face in Canada &#10230;": (
  "Presencial en Canadá &#10230;", "En présentiel au Canada &#10230;"),
 # 05
 "What working AI-Native": ("Lo que aporta trabajar", "Ce qu'apporte le travail"),
 "FASTER TASK COMPLETION": (
  "TAREAS COMPLETADAS MÁS RÁPIDO", "TÂCHES ACHEVÉES PLUS VITE"),
 "LESS TIME ON ROUTINE WORK": (
  "MENOS TIEMPO EN TRABAJO RUTINARIO", "MOINS DE TEMPS SUR LE TRAVAIL ROUTINIER"),
 "MORE THROUGHPUT PER TEAM": (
  "MÁS RENDIMIENTO POR EQUIPO", "PLUS DE DÉBIT PAR ÉQUIPE"),
 "FASTER ONBOARDING / RAMP": (
  "INCORPORACIÓN MÁS RÁPIDA", "INTÉGRATION PLUS RAPIDE"),
 "Source: industry studies on AI-augmented work (GitHub developer-productivity research, McKinsey generative-AI reports, and enterprise benchmarks). Actual results depend on adoption depth, governance, and follow-through.": (
  "Fuente: estudios del sector sobre trabajo aumentado con IA (investigación de GitHub sobre productividad de desarrolladores, informes de McKinsey sobre IA generativa y referencias empresariales). Los resultados reales dependen de la profundidad de adopción, la gobernanza y la constancia.",
  "Source : études sectorielles sur le travail augmenté par l'IA (recherches GitHub sur la productivité des développeurs, rapports McKinsey sur l'IA générative et références d'entreprise). Les résultats réels dépendent de la profondeur d'adoption, de la gouvernance et de la constance."),
 # 06
 "We bring AI-Native ways of working into the sectors where governance, trust, and regulation make it hardest &mdash; banking, energy, defense, insurance, and the public sector.": (
  "Llevamos las formas de trabajo AI-Native a los sectores donde la gobernanza, la confianza y la regulación lo hacen más difícil: banca, energía, defensa, seguros y sector público.",
  "Nous apportons les modes de travail AI-Native aux secteurs où la gouvernance, la confiance et la réglementation rendent la tâche la plus difficile — banque, énergie, défense, assurance et secteur public."),
 "AI-NATIVE WORKFLOWS": ("FLUJOS DE TRABAJO AI-NATIVE", "FLUX DE TRAVAIL AI-NATIVE"),
 "&ldquo;They helped us embed AI into our daily sprints and reshape our value streams into a leaner, highly adaptive org &mdash; experts at balancing classic agile governance with modern, high-speed technical realities.&rdquo;": (
  "«Nos ayudaron a integrar la IA en nuestros sprints diarios y a reconfigurar nuestros value streams hacia una organización más ligera y muy adaptativa: expertos en equilibrar la gobernanza ágil clásica con las realidades técnicas modernas de alta velocidad.»",
  "« Ils nous ont aidés à intégrer l'IA dans nos sprints quotidiens et à refondre nos value streams en une organisation plus légère et très adaptative — experts pour concilier la gouvernance agile classique et les réalités techniques modernes à grande vitesse. »"),
 "Startup COO": ("COO de startup", "COO de start-up"),
 "&mdash; AI integration": ("&mdash; integración de IA", "&mdash; intégration de l'IA"),
 "TRUSTED PARTNER": ("SOCIO DE CONFIANZA", "PARTENAIRE DE CONFIANCE"),
 "&ldquo;They became a trusted partner throughout our transformation &mdash; deep knowledge of Lean, Agile, and organizational change, always responsive and focused on sustainable outcomes.&rdquo;": (
  "«Se convirtieron en un socio de confianza durante toda nuestra transformación: profundo conocimiento de Lean, Agile y cambio organizativo, siempre receptivos y centrados en resultados sostenibles.»",
  "« Ils sont devenus un partenaire de confiance tout au long de notre transformation — une connaissance approfondie du Lean, de l'Agile et du changement organisationnel, toujours réactifs et axés sur des résultats durables. »"),
 "Transformation lead": ("Responsable de transformación", "Responsable de la transformation"),
 "&mdash; Long-term partnership": (
  "&mdash; colaboración a largo plazo", "&mdash; partenariat de long terme"),
 "MULTI-UNIT SCALE": ("ESCALA MULTIUNIDAD", "ÉCHELLE MULTI-ENTITÉS"),
 "&ldquo;They carried us through a complex transformation across multiple business units, working with executives while coaching delivery teams &mdash; practical, realistic, and easy to implement.&rdquo;": (
  "«Nos acompañaron en una transformación compleja en varias unidades de negocio, trabajando con la dirección mientras acompañaban a los equipos de entrega: práctico, realista y fácil de implementar.»",
  "« Ils nous ont accompagnés dans une transformation complexe sur plusieurs unités opérationnelles, en travaillant avec les dirigeants tout en accompagnant les équipes de livraison — pratique, réaliste et facile à mettre en œuvre. »"),
 "Transformation sponsor": (
  "Patrocinador de la transformación", "Sponsor de la transformation"),
 "&mdash; Multiple business units": (
  "&mdash; varias unidades de negocio", "&mdash; plusieurs unités opérationnelles"),
 "Ready to make AI native?": (
  "¿Listo para hacer la IA nativa?", "Prêt à rendre l'IA native ?"),
 "15 minutes with an SPCT. No deck, no pitch &mdash; a real conversation about where AI already touches your work and how to make it native, safely.": (
  "15 minutos con un SPCT. Sin presentación ni discurso comercial: una conversación real sobre dónde toca ya la IA tu trabajo y cómo hacerla nativa, con seguridad.",
  "15 minutes avec un SPCT. Sans support ni argumentaire — une vraie conversation sur les endroits où l'IA touche déjà votre travail et sur la façon de la rendre native, en toute sécurité."),
})

# ---------------------------------------------------------------- Layer 04
# AI Automation. MLOps, "straight-through" as a label, and the Digital
# Transformation practice name stay English.
KEEP |= {"MLOps / PIPELINES", "Digital Transformation", "Digital Transformation &#10230;",
         "See AI-Native (layer 03) &rarr;"}

FIVE.update({
 "AI Automation &middot; the technical backbone": (
  "AI Automation &middot; la base técnica",
  "AI Automation &middot; le socle technique"),
 "Automate the work,": ("Automatiza el trabajo,", "Automatisez le travail,"),
 "end to end": ("de extremo a extremo", "de bout en bout"),
 "AI-Native gets your people working": (
  "AI-Native consigue que tus equipos trabajen",
  "AI-Native amène vos équipes à travailler"),
 "with": ("con", "avec"),
 "AI. AI Automation is the next rung: handing entire workflows to AI to run on their own &mdash; agents that execute end to end, straight-through processing, and pipelines that carry work from request to result with humans": (
  "la IA. AI Automation es el siguiente peldaño: entregar flujos de trabajo completos a la IA para que se ejecuten solos, con agentes que actúan de extremo a extremo, procesamiento directo y pipelines que llevan el trabajo de la petición al resultado, con personas",
  "l'IA. AI Automation est le barreau suivant : confier des flux de travail entiers à l'IA pour qu'ils s'exécutent seuls — des agents qui opèrent de bout en bout, un traitement direct et des pipelines qui portent le travail de la demande au résultat, les humains"),
 "supervising, not operating": ("que supervisan, no operan", "supervisant plutôt qu'opérant"),
 ". This is the engineering backbone that turns AI pilots into shipped, governed capability.": (
  ". Esta es la base de ingeniería que convierte los pilotos de IA en capacidad entregada y gobernada.",
  ". C'est le socle d'ingénierie qui transforme les pilotes d'IA en capacité livrée et gouvernée."),
 "AGENTIC WORKFLOWS": ("FLUJOS DE TRABAJO AGÉNTICOS", "FLUX DE TRAVAIL AGENTIQUES"),
 "STRAIGHT-THROUGH": ("PROCESAMIENTO DIRECTO", "TRAITEMENT DIRECT"),
 "HUMAN OVERSIGHT": ("SUPERVISIÓN HUMANA", "SUPERVISION HUMAINE"),
 "End-to-end workflows automated &mdash; request to result": (
  "Flujos de trabajo automatizados de extremo a extremo: de la petición al resultado",
  "Flux de travail automatisés de bout en bout — de la demande au résultat"),
 "Agentic &amp; straight-through processing where it fits": (
  "Procesamiento agéntico y directo donde encaja",
  "Traitement agentique et direct là où c'est pertinent"),
 "MLOps &amp; delivery pipelines, commit to production": (
  "MLOps y pipelines de entrega, del commit a producción",
  "MLOps et pipelines de livraison, du commit à la production"),
 "Human-in-the-loop checkpoints &amp; audit trails": (
  "Puntos de control con intervención humana y pistas de auditoría",
  "Points de contrôle avec intervention humaine et pistes d'audit"),
 "Guardrails, security &amp; governance built in": (
  "Guardrails, seguridad y gobernanza integrados",
  "Guardrails, sécurité et gouvernance intégrés"),
 "up to 80%": ("hasta el 80%", "jusqu'à 80%"),
 "straight-through processing": ("de procesamiento directo", "de traitement direct"),
 "faster cycle time": ("más rápido en tiempo de ciclo", "de temps de cycle en moins"),
 "fewer manual handoffs": ("menos traspasos manuales", "de transferts manuels en moins"),
 "throughput": ("de rendimiento", "de débit"),
 # 01
 "( 01 ) &mdash; Why AI automation: the business need": (
  "( 01 ) &mdash; Por qué la automatización con IA: la necesidad de negocio",
  "( 01 ) &mdash; Pourquoi l'automatisation par l'IA : le besoin métier"),
 "Copilots speed up tasks.": (
  "Los copilotos aceleran tareas.", "Les copilotes accélèrent les tâches."),
 "Automation removes the work.": (
  "La automatización elimina el trabajo.", "L'automatisation supprime le travail."),
 "A person plus a copilot is faster at each step &mdash; but the workflow, the handoffs, and the waiting are all still there. The step-change comes when the whole workflow runs itself: an agent picks up the request, does the work across systems, and only surfaces the exceptions for a human to judge. That is where cost, cycle time, and error rates fall together.": (
  "Una persona con un copiloto es más rápida en cada paso, pero el flujo de trabajo, los traspasos y las esperas siguen ahí. El salto llega cuando el flujo completo se ejecuta solo: un agente recoge la petición, hace el trabajo entre sistemas y solo eleva las excepciones para que las juzgue una persona. Ahí es donde el coste, el tiempo de ciclo y la tasa de error bajan a la vez.",
  "Une personne équipée d'un copilote va plus vite à chaque étape — mais le flux, les transferts et les attentes restent. Le saut arrive quand le flux entier s'exécute seul : un agent reçoit la demande, effectue le travail à travers les systèmes et ne remonte que les exceptions au jugement d'un humain. C'est là que le coût, le temps de cycle et le taux d'erreur baissent ensemble."),
 "Task-level AI (people still operate)": (
  "IA a nivel de tarea (las personas siguen operando)",
  "IA au niveau de la tâche (les humains opèrent encore)"),
 "Faster steps, but the same number of handoffs": (
  "Pasos más rápidos, pero el mismo número de traspasos",
  "Des étapes plus rapides, mais autant de transferts"),
 "Work waits in queues between people and systems": (
  "El trabajo espera en colas entre personas y sistemas",
  "Le travail attend en file entre les personnes et les systèmes"),
 "Throughput capped by headcount &amp; working hours": (
  "Rendimiento limitado por la plantilla y el horario laboral",
  "Débit plafonné par les effectifs et les heures de travail"),
 "Ungoverned scripts &amp; bots &mdash; brittle, unauditable": (
  "Scripts y bots sin gobernanza: frágiles y no auditables",
  "Scripts et bots non gouvernés — fragiles, non auditables"),
 "Pilots that never reach production": (
  "Pilotos que nunca llegan a producción",
  "Des pilotes qui n'atteignent jamais la production"),
 "Workflow-level automation (AI operates, people supervise)": (
  "Automatización a nivel de flujo (la IA opera, las personas supervisan)",
  "Automatisation au niveau du flux (l'IA opère, les humains supervisent)"),
 "End-to-end": ("De extremo a extremo", "De bout en bout"),
 "&mdash; request to result, across systems": (
  "&mdash; de la petición al resultado, entre sistemas",
  "&mdash; de la demande au résultat, à travers les systèmes"),
 "Straight-through": ("Procesamiento directo", "Traitement direct"),
 "&mdash; the routine cases just complete": (
  "&mdash; los casos rutinarios simplemente se completan",
  "&mdash; les cas de routine se bouclent tout seuls"),
 "Exceptions to humans": ("Excepciones a las personas", "Les exceptions aux humains"),
 "&mdash; judgment where it matters": (
  "&mdash; criterio donde importa", "&mdash; le jugement là où il compte"),
 "Governed": ("Gobernada", "Gouvernée"),
 "&mdash; guardrails, audit trails, security by design": (
  "&mdash; guardrails, pistas de auditoría y seguridad por diseño",
  "&mdash; guardrails, pistes d'audit, sécurité par conception"),
 "Shipped": ("Entregada", "Livrée"),
 "&mdash; in production, not stuck in a pilot": (
  "&mdash; en producción, no atrapada en un piloto",
  "&mdash; en production, pas bloquée en pilote"),
 # 02
 "( 02 ) &mdash; The automation ladder": (
  "( 02 ) &mdash; La escalera de automatización",
  "( 02 ) &mdash; L'échelle de l'automatisation"),
 "From manual": ("De manual", "Du manuel"),
 "to agentic.": ("a agéntico.", "à l'agentique."),
 "Not every workflow should be fully autonomous. We place each one at the right rung &mdash; and move it up only as trust, data, and guardrails allow.": (
  "No todos los flujos de trabajo deben ser plenamente autónomos. Situamos cada uno en el peldaño adecuado y lo subimos solo cuando la confianza, los datos y los guardrails lo permiten.",
  "Tous les flux de travail ne doivent pas être pleinement autonomes. Nous plaçons chacun au bon barreau — et ne le faisons monter que si la confiance, les données et les guardrails le permettent."),
 "Manual": ("Manual", "Manuel"),
 "People do the work step by step, moving it between systems by hand.": (
  "Las personas hacen el trabajo paso a paso, moviéndolo entre sistemas a mano.",
  "Les personnes réalisent le travail étape par étape, en le déplaçant entre systèmes à la main."),
 "Copilots and scripts speed up individual steps &mdash; the workflow is unchanged.": (
  "Los copilotos y los scripts aceleran pasos individuales: el flujo de trabajo no cambia.",
  "Les copilotes et les scripts accélèrent des étapes isolées — le flux reste inchangé."),
 "Orchestrated": ("Orquestado", "Orchestré"),
 "Steps are chained into a flow; the routine path runs straight through, humans handle exceptions.": (
  "Los pasos se encadenan en un flujo; la vía rutinaria se procesa de forma directa y las personas gestionan las excepciones.",
  "Les étapes sont enchaînées en un flux ; le chemin de routine se traite directement, les humains gèrent les exceptions."),
 "FRONTIER": ("FRONTERA", "FRONTIÈRE"),
 "AI agents plan and run whole workflows end to end under human oversight, adapting as they go.": (
  "Los agentes de IA planifican y ejecutan flujos completos de extremo a extremo bajo supervisión humana, adaptándose sobre la marcha.",
  "Des agents IA planifient et exécutent des flux entiers de bout en bout sous supervision humaine, en s'adaptant en chemin."),
 "The goal isn&rsquo;t &ldquo;maximum autonomy&rdquo; &mdash; it&rsquo;s the right rung per workflow, with a human-in-the-loop where the stakes demand one.": (
  "El objetivo no es la «máxima autonomía», sino el peldaño adecuado para cada flujo, con intervención humana donde lo exija lo que está en juego.",
  "L'objectif n'est pas « l'autonomie maximale » — c'est le bon barreau pour chaque flux, avec une intervention humaine là où les enjeux l'exigent."),
 # 03
 "automate safely.": ("automatizar con seguridad.", "automatiser en sécurité."),
 "MAP": ("MAPEAR", "CARTOGRAPHIER"),
 "Map the workflows": ("Mapear los flujos de trabajo", "Cartographier les flux de travail"),
 "Find the high-volume, rule-heavy workflows where automation pays &mdash; and the risk points that need a human in the loop.": (
  "Encuentra los flujos de alto volumen y muy reglados donde la automatización compensa, y los puntos de riesgo que necesitan intervención humana.",
  "Repérez les flux à fort volume et très normés où l'automatisation est rentable — et les points de risque qui exigent une intervention humaine."),
 "AUTOMATE": ("AUTOMATIZAR", "AUTOMATISER"),
 "Automate &amp; orchestrate": ("Automatizar y orquestar", "Automatiser et orchestrer"),
 "Build the agents and pipelines, wire them across systems, and set the straight-through path with exception routing.": (
  "Construye los agentes y pipelines, conéctalos entre sistemas y define la vía de procesamiento directo con enrutamiento de excepciones.",
  "Construisez les agents et les pipelines, reliez-les entre systèmes et définissez le chemin de traitement direct avec routage des exceptions."),
 "GOVERN": ("GOBERNAR", "GOUVERNER"),
 "Govern &amp; scale": ("Gobernar y escalar", "Gouverner et passer à l'échelle"),
 "Stand up guardrails, monitoring, and audit trails, prove it in production, then scale to the next workflow.": (
  "Pon en marcha guardrails, monitorización y pistas de auditoría, demuéstralo en producción y después escala al siguiente flujo.",
  "Mettez en place guardrails, supervision et pistes d'audit, prouvez-le en production, puis passez au flux suivant."),
 # 04
 "( 04 ) &mdash; How it gets built &amp; run": (
  "( 04 ) &mdash; Cómo se construye y se opera",
  "( 04 ) &mdash; Comment on la construit et l'exploite"),
 "The": ("La", "Le"),
 "technical backbone": ("base técnica", "socle technique"),
 "under an AI-Native operating model.": (
  "bajo un modelo operativo AI-Native.", "sous un modèle opérationnel AI-Native."),
 "AI Automation is where AI-Native ways of working meet real engineering. It rides on the delivery pipeline and MLOps discipline of our": (
  "AI Automation es donde las formas de trabajo AI-Native se encuentran con la ingeniería real. Se apoya en el pipeline de entrega y la disciplina de MLOps de nuestra práctica de",
  "AI Automation, c'est là où les modes de travail AI-Native rencontrent l'ingénierie réelle. Elle s'appuie sur le pipeline de livraison et la discipline MLOps de notre pratique"),
 "practice, and your teams learn to build and supervise it through": (
  ", y tus equipos aprenden a construirla y supervisarla mediante",
  ", et vos équipes apprennent à la construire et à la superviser via"),
 ". Automation without that backbone is a demo; with it, it ships and holds.": (
  ". La automatización sin esa base es una demo; con ella, se entrega y se sostiene.",
  ". L'automatisation sans ce socle est une démo ; avec lui, elle est livrée et tient dans la durée."),
 # 05
 "What end-to-end automation": (
  "Lo que aporta la automatización de extremo a extremo",
  "Ce qu'apporte l'automatisation de bout en bout"),
 "STRAIGHT-THROUGH PROCESSING": ("PROCESAMIENTO DIRECTO", "TRAITEMENT DIRECT"),
 "FASTER CYCLE TIME": ("TIEMPO DE CICLO MÁS CORTO", "TEMPS DE CYCLE RÉDUIT"),
 "FEWER MANUAL HANDOFFS": ("MENOS TRASPASOS MANUALES", "MOINS DE TRANSFERTS MANUELS"),
 "AUTONOMOUS THROUGHPUT": ("RENDIMIENTO AUTÓNOMO", "DÉBIT AUTONOME"),
 "Source: intelligent-automation, RPA, and agentic-workflow benchmarks (industry studies on straight-through processing and DevOps/MLOps). Directional ranges; actual results depend on workflow fit, data quality, and governance.": (
  "Fuente: referencias de automatización inteligente, RPA y flujos agénticos (estudios del sector sobre procesamiento directo y DevOps/MLOps). Rangos orientativos; los resultados reales dependen del encaje del flujo, la calidad de los datos y la gobernanza.",
  "Source : références en automatisation intelligente, RPA et flux agentiques (études sectorielles sur le traitement direct et DevOps/MLOps). Ordres de grandeur ; les résultats réels dépendent de l'adéquation du flux, de la qualité des données et de la gouvernance."),
 # 06
 "We automate the workflows where volume, compliance, and cost pressure collide &mdash; banking, insurance, telecom, energy, and the public sector.": (
  "Automatizamos los flujos donde chocan el volumen, el cumplimiento y la presión de costes: banca, seguros, telecomunicaciones, energía y sector público.",
  "Nous automatisons les flux où volume, conformité et pression sur les coûts se rencontrent — banque, assurance, télécoms, énergie et secteur public."),
 "Insurance": ("Seguros", "Assurance"),
 "Energy &amp; Utilities": ("Energía y utilities", "Énergie et services publics"),
 "GOVERNED PIPELINES": ("PIPELINES GOBERNADOS", "PIPELINES GOUVERNÉS"),
 "&ldquo;They showed us exactly how to bake governance into our automated delivery pipelines &mdash; compliance and speed finally co-existed.&rdquo;": (
  "«Nos mostraron exactamente cómo integrar la gobernanza en nuestros pipelines de entrega automatizados: por fin convivieron el cumplimiento y la velocidad.»",
  "« Ils nous ont montré exactement comment intégrer la gouvernance dans nos pipelines de livraison automatisés — conformité et vitesse ont enfin coexisté. »"),
 "Digital Transformation Lead": (
  "Responsable de transformación digital", "Responsable de la transformation numérique"),
 "&mdash; FinTech": ("&mdash; FinTech", "&mdash; FinTech"),
 "END-TO-END FLOW": ("FLUJO DE EXTREMO A EXTREMO", "FLUX DE BOUT EN BOUT"),
 "&ldquo;They helped us embed AI into daily workflows and reshape our value streams into a leaner, highly adaptive operation.&rdquo;": (
  "«Nos ayudaron a integrar la IA en los flujos de trabajo diarios y a reconfigurar nuestros value streams hacia una operación más ligera y muy adaptativa.»",
  "« Ils nous ont aidés à intégrer l'IA dans les flux de travail quotidiens et à refondre nos value streams en une opération plus légère et très adaptative. »"),
 "SIMPLER DELIVERY": ("ENTREGA MÁS SIMPLE", "LIVRAISON PLUS SIMPLE"),
 "&ldquo;From assessment through implementation they simplified complex delivery and tightened the loop between business and technical teams.&rdquo;": (
  "«Desde el diagnóstico hasta la implementación simplificaron una entrega compleja y estrecharon el circuito entre los equipos de negocio y los técnicos.»",
  "« Du diagnostic à la mise en œuvre, ils ont simplifié une livraison complexe et resserré la boucle entre les équipes métier et techniques. »"),
 "Programme Director": ("Director de programa", "Directeur de programme"),
 "&mdash; Enterprise delivery": (
  "&mdash; entrega empresarial", "&mdash; livraison en entreprise"),
 "Ready to automate a workflow end to end?": (
  "¿Listo para automatizar un flujo de extremo a extremo?",
  "Prêt à automatiser un flux de bout en bout ?"),
 "Tell us the workflow that&rsquo;s eating your team&rsquo;s time &mdash; we&rsquo;ll show you where automation is safe, where a human stays in the loop, and what it&rsquo;s worth.": (
  "Cuéntanos qué flujo se está comiendo el tiempo de tu equipo y te mostraremos dónde la automatización es segura, dónde debe permanecer una persona en el circuito y cuánto vale.",
  "Dites-nous quel flux dévore le temps de votre équipe — nous vous montrerons où l'automatisation est sûre, où un humain doit rester dans la boucle, et ce que cela vaut."),
})

# ---------------------------------------------------------------- Layer 05
# Mutation. "Mutation Readiness" stays English throughout: it is the name of
# both the assessment and the book (Mutation Readiness: An Operating Manual
# for Innovation in the Age of AI).
# the CTA is a sentence around the product name, so it translates; only the
# assessment's name stays English
FIVE_CTA_NOTE = True

FIVE.update({
 "Mutation &middot; the capstone capability": (
  "Mutation &middot; la capacidad que corona el modelo",
  "Mutation &middot; la capacité qui couronne le modèle"),
 "Take the Mutation Readiness assessment &rarr;": (
  "Haz la evaluación Mutation Readiness &rarr;",
  "Passer l'évaluation Mutation Readiness &rarr;"),
 "Mutate faster than": ("Muta más rápido de lo que", "Mutez plus vite que"),
 "the market moves": ("se mueve el mercado", "ne bouge le marché"),
 "Agility lets you adapt": ("La agilidad te permite adaptarte", "L'agilité permet de s'adapter"),
 "within": ("dentro de", "à l'intérieur d'"),
 "a model. Mutation lets you change the model itself. In the age of AI the half-life of any operating model is collapsing &mdash; what won last year quietly stops working. The enterprises that endure are not the most agile; they are the ones that can continuously mutate: re-sense the market, reconfigure structure, re-fund the portfolio, and re-skill people &mdash; before the market forces it. Mutation is the capstone of the operating model: the capacity to keep becoming.": (
  "un modelo. La mutación te permite cambiar el modelo en sí. En la era de la IA, la vida útil de cualquier modelo operativo se está acortando: lo que funcionó el año pasado deja de funcionar en silencio. Las empresas que perduran no son las más ágiles, sino las que pueden mutar de forma continua: volver a leer el mercado, reconfigurar la estructura, refinanciar el portafolio y recualificar a las personas antes de que el mercado las obligue. La mutación corona el modelo operativo: la capacidad de seguir transformándose.",
  "un modèle. La mutation permet de changer le modèle lui-même. À l'ère de l'IA, la demi-vie de tout modèle opérationnel s'effondre : ce qui gagnait l'an dernier cesse discrètement de fonctionner. Les entreprises qui durent ne sont pas les plus agiles ; ce sont celles qui savent muter en continu : relire le marché, reconfigurer la structure, refinancer le portefeuille et requalifier les personnes — avant que le marché ne l'impose. La mutation couronne le modèle opérationnel : la capacité de continuer à devenir."),
 "SENSE": ("DETECTAR", "DÉTECTER"),
 "RECONFIGURE": ("RECONFIGURAR", "RECONFIGURER"),
 "RE-FUND": ("REFINANCIAR", "REFINANCER"),
 "RE-SKILL": ("RECUALIFICAR", "REQUALIFIER"),
 "A mutation operating rhythm &mdash; sense, reconfigure, re-fund, re-skill": (
  "Un ritmo operativo de mutación: detectar, reconfigurar, refinanciar y recualificar",
  "Un rythme opérationnel de mutation — détecter, reconfigurer, refinancer, requalifier"),
 "Leading indicators that signal when to change": (
  "Indicadores adelantados que señalan cuándo cambiar",
  "Des indicateurs avancés qui signalent quand changer"),
 "Dynamic funding &amp; structure that flex without reorg trauma": (
  "Financiación y estructura dinámicas que se flexibilizan sin el trauma de una reorganización",
  "Un financement et une structure dynamiques qui s'adaptent sans le traumatisme d'une réorganisation"),
 "A learning system that turns change into capability": (
  "Un sistema de aprendizaje que convierte el cambio en capacidad",
  "Un système d'apprentissage qui transforme le changement en capacité"),
 "Leaders coached to lead continuous mutation": (
  "Líderes acompañados para dirigir la mutación continua",
  "Des dirigeants accompagnés pour piloter la mutation continue"),
 "faster response to change": (
  "más rápido en responder al cambio", "de réaction au changement plus rapide"),
 "the cost of big-bang reorgs": (
  "del coste de las reorganizaciones de golpe",
  "du coût des réorganisations en big bang"),
 # 01
 "( 01 ) &mdash; Why mutation: the business need": (
  "( 01 ) &mdash; Por qué la mutación: la necesidad de negocio",
  "( 01 ) &mdash; Pourquoi la mutation : le besoin métier"),
 "A static operating model": (
  "Un modelo operativo estático", "Un modèle opérationnel statique"),
 "quietly decays.": ("se degrada en silencio.", "se dégrade en silence."),
 "Markets, technology &mdash; AI above all &mdash; and business models now shift faster than annual planning cycles can absorb. An operating model that was right at launch drifts out of fit a little more every quarter, until a painful, expensive reorg is the only reset available. Mutation replaces the big-bang reorg with continuous, low-drama adaptation.": (
  "Los mercados, la tecnología —la IA por encima de todo— y los modelos de negocio cambian ahora más rápido de lo que los ciclos anuales de planificación pueden absorber. Un modelo operativo que era el adecuado al lanzarlo se desajusta un poco más cada trimestre, hasta que una reorganización dolorosa y cara es el único reinicio disponible. La mutación sustituye la reorganización de golpe por una adaptación continua y sin dramas.",
  "Les marchés, la technologie — l'IA avant tout — et les modèles économiques évoluent désormais plus vite que les cycles de planification annuels ne peuvent l'absorber. Un modèle opérationnel juste au lancement se désajuste un peu plus chaque trimestre, jusqu'à ce qu'une réorganisation douloureuse et coûteuse soit la seule remise à zéro possible. La mutation remplace la réorganisation en big bang par une adaptation continue et sans drame."),
 "Organizations that can&rsquo;t mutate": (
  "Organizaciones que no pueden mutar", "Les organisations incapables de muter"),
 "Model drifts out of fit &mdash; noticed only in a crisis": (
  "El modelo se desajusta y solo se nota en una crisis",
  "Le modèle se désajuste — on ne s'en aperçoit qu'en crise"),
 "Change arrives as disruptive, morale-crushing reorgs": (
  "El cambio llega como reorganizaciones disruptivas que hunden la moral",
  "Le changement arrive sous forme de réorganisations brutales qui minent le moral"),
 "Funding locked to last year&rsquo;s bets, not this year&rsquo;s reality": (
  "Financiación atada a las apuestas del año pasado, no a la realidad de este",
  "Un financement figé sur les paris de l'an dernier, pas sur la réalité de cette année"),
 "Skills lag the tools &mdash; especially AI": (
  "Las competencias van por detrás de las herramientas, sobre todo en IA",
  "Les compétences retardent sur les outils — surtout pour l'IA"),
 "Out-adapted by faster, younger competitors": (
  "Superadas en adaptación por competidores más jóvenes y rápidos",
  "Dépassées en adaptation par des concurrents plus jeunes et plus rapides"),
 "Organizations built to mutate": (
  "Organizaciones construidas para mutar", "Les organisations bâties pour muter"),
 "Sense early": ("Detectar pronto", "Détecter tôt"),
 "&mdash; leading indicators, not lagging surprises": (
  "&mdash; indicadores adelantados, no sorpresas tardías",
  "&mdash; des indicateurs avancés, pas des surprises tardives"),
 "Reconfigure calmly": ("Reconfigurar con calma", "Reconfigurer calmement"),
 "&mdash; continuous change, no big-bang trauma": (
  "&mdash; cambio continuo, sin el trauma del golpe",
  "&mdash; un changement continu, sans traumatisme de big bang"),
 "Re-fund fast": ("Refinanciar rápido", "Refinancer vite"),
 "&mdash; money follows the newest, best bet": (
  "&mdash; el dinero sigue a la apuesta más nueva y mejor",
  "&mdash; l'argent suit le pari le plus récent et le meilleur"),
 "Re-skill continuously": ("Recualificar de forma continua", "Requalifier en continu"),
 "&mdash; people grow into the next model": (
  "&mdash; las personas crecen hacia el siguiente modelo",
  "&mdash; les personnes grandissent vers le modèle suivant"),
 "Endure": ("Perdurar", "Durer"),
 "&mdash; change becomes a capability, not a crisis": (
  "&mdash; el cambio se convierte en capacidad, no en crisis",
  "&mdash; le changement devient une capacité, pas une crise"),
 # 02
 "( 02 ) &mdash; The mutation loop": (
  "( 02 ) &mdash; El bucle de mutación", "( 02 ) &mdash; La boucle de mutation"),
 "Four moves,": ("Cuatro movimientos,", "Quatre mouvements,"),
 "on repeat.": ("en bucle.", "en boucle."),
 "Mutation is not an event &mdash; it is a rhythm. These four moves run continuously, turning constant change from a threat into an operating advantage.": (
  "La mutación no es un evento: es un ritmo. Estos cuatro movimientos se ejecutan de forma continua y convierten el cambio constante de amenaza en ventaja operativa.",
  "La mutation n'est pas un événement — c'est un rythme. Ces quatre mouvements s'exécutent en continu et transforment le changement permanent d'une menace en avantage opérationnel."),
 "MOVE 01": ("MOVIMIENTO 01", "MOUVEMENT 01"),
 "MOVE 02": ("MOVIMIENTO 02", "MOUVEMENT 02"),
 "MOVE 03": ("MOVIMIENTO 03", "MOUVEMENT 03"),
 "MOVE 04": ("MOVIMIENTO 04", "MOUVEMENT 04"),
 "Sense": ("Detectar", "Détecter"),
 "Read the market, technology, and internal signals early &mdash; leading indicators that a change is coming.": (
  "Lee pronto el mercado, la tecnología y las señales internas: indicadores adelantados de que viene un cambio.",
  "Lisez tôt le marché, la technologie et les signaux internes — les indicateurs avancés qu'un changement arrive."),
 "Reconfigure": ("Reconfigurar", "Reconfigurer"),
 "Reshape teams, value streams, and structure to fit the new reality &mdash; continuously, not in a shock.": (
  "Reconfigura equipos, value streams y estructura para encajar con la nueva realidad, de forma continua y sin sobresaltos.",
  "Remodelez les équipes, les value streams et la structure pour épouser la nouvelle réalité — en continu, pas par choc."),
 "Re-fund": ("Refinanciar", "Refinancer"),
 "Move money to the newest, highest-value bet on a Lean cadence &mdash; funding follows evidence.": (
  "Mueve el dinero hacia la apuesta más nueva y de mayor valor con cadencia Lean: la financiación sigue a la evidencia.",
  "Déplacez l'argent vers le pari le plus récent et le plus prometteur à cadence Lean — le financement suit les preuves."),
 "Re-skill": ("Recualificar", "Requalifier"),
 "Grow people into the next operating model &mdash; so the organization mutates without leaving its talent behind.": (
  "Haz crecer a las personas hacia el siguiente modelo operativo, para que la organización mute sin dejar atrás su talento.",
  "Faites grandir les personnes vers le modèle opérationnel suivant — pour que l'organisation mute sans laisser son talent derrière elle."),
 "Run the loop faster than your environment changes and disruption stops being a threat &mdash; it becomes the terrain you are built for.": (
  "Ejecuta el bucle más rápido de lo que cambia tu entorno y la disrupción deja de ser una amenaza: se convierte en el terreno para el que estás construido.",
  "Faites tourner la boucle plus vite que votre environnement ne change et la disruption cesse d'être une menace — elle devient le terrain pour lequel vous êtes bâti."),
 # 03
 "Three moves to build": ("Tres movimientos para construir", "Trois mouvements pour bâtir"),
 "the capability.": ("la capacidad.", "la capacité."),
 "Assess mutation readiness": (
  "Evaluar la preparación para mutar", "Évaluer la maturité de mutation"),
 "Measure how quickly you sense, reconfigure, re-fund, and re-skill today &mdash; and where the loop stalls.": (
  "Mide con qué rapidez detectas, reconfiguras, refinancias y recualificas hoy, y dónde se atasca el bucle.",
  "Mesurez à quelle vitesse vous détectez, reconfigurez, refinancez et requalifiez aujourd'hui — et où la boucle se bloque."),
 "INSTALL": ("INSTALAR", "INSTALLER"),
 "Install the loop": ("Instalar el bucle", "Installer la boucle"),
 "Stand up the indicators, the dynamic funding cadence, and the reconfiguration and re-skilling rhythms.": (
  "Pon en marcha los indicadores, la cadencia de financiación dinámica y los ritmos de reconfiguración y recualificación.",
  "Mettez en place les indicateurs, la cadence de financement dynamique et les rythmes de reconfiguration et de requalification."),
 "COACH": ("ACOMPAÑAR", "ACCOMPAGNER"),
 "Coach the leadership": ("Acompañar a la dirección", "Accompagner la direction"),
 "Coach executives to lead continuous mutation &mdash; until adapting the model is simply how the enterprise runs.": (
  "Acompaña a la dirección para liderar la mutación continua, hasta que adaptar el modelo sea sencillamente la forma en que opera la empresa.",
  "Accompagnez les dirigeants pour piloter la mutation continue — jusqu'à ce qu'adapter le modèle devienne simplement la façon dont l'entreprise fonctionne."),
 # 04
 "( 04 ) &mdash; Start here: Mutation Readiness": (
  "( 04 ) &mdash; Empieza aquí: Mutation Readiness",
  "( 04 ) &mdash; Commencez ici : Mutation Readiness"),
 "Measure your": ("Mide tu", "Mesurez votre"),
 "&mdash; then read the playbook.": (
  "&mdash; y después lee el manual.", "&mdash; puis lisez le manuel."),
 "You cannot build a capability you have not measured. The Mutation Readiness assessment scores how fast your organization senses, reconfigures, re-funds, and re-skills &mdash; and shows exactly where the loop breaks. The companion book lays out the full method for making mutation a permanent capability. Start with the assessment, then go deep with the book.": (
  "No se puede construir una capacidad que no se ha medido. La evaluación Mutation Readiness puntúa con qué rapidez tu organización detecta, reconfigura, refinancia y recualifica, y muestra exactamente dónde se rompe el bucle. El libro que la acompaña expone el método completo para convertir la mutación en una capacidad permanente. Empieza por la evaluación y después profundiza con el libro.",
  "On ne construit pas une capacité que l'on n'a pas mesurée. L'évaluation Mutation Readiness note la vitesse à laquelle votre organisation détecte, reconfigure, refinance et requalifie — et montre exactement où la boucle casse. Le livre qui l'accompagne expose la méthode complète pour faire de la mutation une capacité permanente. Commencez par l'évaluation, puis approfondissez avec le livre."),
 "Read the book &middot; coming soon": (
  "Lee el libro &middot; próximamente", "Lire le livre &middot; bientôt disponible"),
 # 05
 # "What the ability to mutate <i>protects.</i>" - the emphasis has to land on a
 # word, so the split moves: the verb leads in ES/FR and "mutate" is emphasised.
 "What the ability to mutate": (
  "Lo que protege la capacidad de", "Ce que protège la capacité de"),
 "protects.": ("mutar.", "muter."),
 "FASTER RESPONSE TO CHANGE": (
  "RESPUESTA MÁS RÁPIDA AL CAMBIO", "RÉACTION PLUS RAPIDE AU CHANGEMENT"),
 "HIGHER ENGAGEMENT": ("MAYOR COMPROMISO", "ENGAGEMENT PLUS FORT"),
 "THE COST OF BIG-BANG REORGS": (
  "EL COSTE DE LAS REORGANIZACIONES DE GOLPE",
  "LE COÛT DES RÉORGANISATIONS EN BIG BANG"),
 "Directional benchmarks from enterprises that adopt continuous, Lean-portfolio adaptation versus periodic reorganization. Actual outcomes depend on starting state, executive commitment, and follow-through.": (
  "Referencias orientativas de empresas que adoptan una adaptación continua con portafolio Lean frente a la reorganización periódica. Los resultados reales dependen del punto de partida, el compromiso de la dirección y la constancia.",
  "Ordres de grandeur issus d'entreprises adoptant une adaptation continue en portefeuille Lean plutôt qu'une réorganisation périodique. Les résultats réels dépendent du point de départ, de l'engagement des dirigeants et de la constance."),
 # 06
 "We build the mutation capability into the sectors where the cost of standing still is highest &mdash; banking, energy, defense, insurance, and the public sector.": (
  "Construimos la capacidad de mutación en los sectores donde quedarse quieto sale más caro: banca, energía, defensa, seguros y sector público.",
  "Nous bâtissons la capacité de mutation dans les secteurs où l'immobilisme coûte le plus cher — banque, énergie, défense, assurance et secteur public."),
 "TAILORED, NOT GENERIC": ("A MEDIDA, NO GENÉRICO", "SUR MESURE, PAS GÉNÉRIQUE"),
 "&ldquo;Rather than forcing a generic framework, they adapted agile practices to fit our business environment &mdash; helping us avoid common pitfalls and deliver meaningful improvements.&rdquo;": (
  "«En lugar de imponer un marco genérico, adaptaron las prácticas ágiles a nuestro entorno de negocio, ayudándonos a evitar errores habituales y a lograr mejoras reales.»",
  "« Plutôt que d'imposer un cadre générique, ils ont adapté les pratiques agiles à notre environnement métier — nous aidant à éviter les pièges habituels et à obtenir de vraies améliorations. »"),
 "Transformation Lead": ("Responsable de transformación", "Responsable de la transformation"),
 "&mdash; enterprise-scale change": (
  "&mdash; cambio a escala empresarial", "&mdash; changement à l'échelle de l'entreprise"),
 "EXECUTIVE COACHING": ("COACHING DIRECTIVO", "COACHING DE DIRIGEANTS"),
 "&ldquo;They gave our leadership team practical executive coaching rather than theoretical advice &mdash; connecting business strategy with agile execution and sharpening decisions across teams.&rdquo;": (
  "«Dieron a nuestro equipo directivo un coaching práctico en lugar de consejos teóricos, conectando la estrategia de negocio con la ejecución ágil y afinando las decisiones en todos los equipos.»",
  "« Ils ont offert à notre équipe dirigeante un coaching concret plutôt que des conseils théoriques — reliant la stratégie métier à l'exécution agile et affûtant les décisions dans toutes les équipes. »"),
 "Leadership Team": ("Equipo directivo", "Équipe de direction"),
 "&mdash; executive coaching": ("&mdash; coaching directivo", "&mdash; coaching de dirigeants"),
 "ORGANIZATIONAL RESILIENCE": ("RESILIENCIA ORGANIZATIVA", "RÉSILIENCE ORGANISATIONNELLE"),
 "&ldquo;World-class advisory through a major restructuring &mdash; their work on organizational design and change kept our teams focused and productive. They don&rsquo;t just consult on agility; they help you build an inherently resilient business.&rdquo;": (
  "«Asesoramiento de primer nivel durante una reestructuración importante: su trabajo en diseño organizativo y gestión del cambio mantuvo a nuestros equipos centrados y productivos. No solo asesoran sobre agilidad; ayudan a construir un negocio intrínsecamente resiliente.»",
  "« Un conseil de premier plan durant une restructuration majeure — leur travail sur le design organisationnel et le changement a gardé nos équipes concentrées et productives. Ils ne conseillent pas seulement sur l'agilité ; ils aident à bâtir une entreprise intrinsèquement résiliente. »"),
 "CEO": ("CEO", "CEO"),
 "&mdash; organizational resilience": (
  "&mdash; resiliencia organizativa", "&mdash; résilience organisationnelle"),
 "Ready to build the capability to mutate?": (
  "¿Listo para construir la capacidad de mutar?",
  "Prêt à bâtir la capacité de muter ?"),
 "15 minutes with an SPCT. No deck, no pitch &mdash; a real conversation about how fast your operating model can change, and how to make that a permanent strength.": (
  "15 minutos con un SPCT. Sin presentación ni discurso comercial: una conversación real sobre con qué rapidez puede cambiar tu modelo operativo y cómo convertir eso en una fortaleza permanente.",
  "15 minutes avec un SPCT. Sans support ni argumentaire — une vraie conversation sur la vitesse à laquelle votre modèle opérationnel peut changer, et sur la façon d'en faire une force durable."),
})
