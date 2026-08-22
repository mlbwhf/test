# -*- coding: utf-8 -*-
"""Build snippets/assessments/data/maturity-fr.json from the English file.

The Agile Maturity assessment shipped in EN and ES; this adds FR. The French
copy lives here rather than in a hand-written JSON so the generator can assert
the two files have the same shape — same dimension count, same five levels per
dimension, same ui keys. A missing option would silently shift the scoring.

stageDesc is keyed by the *level name*, so the French file keys it by the
French names, exactly as the Spanish one does.
"""
import json, io, os, sys

EN = "snippets/assessments/data/maturity-en.json"
ES = "snippets/assessments/data/maturity-es.json"
OUT = "snippets/assessments/data/maturity-fr.json"

LEVELS = ["Absent", "Émergent", "Conçu", "En accélération", "En vol"]

SHORT = ["Modèle opérationnel", "Livraison de valeur",
         "Capacités des équipes", "Modes de travail"]

STAGE_DESC = [
    "L'agilité n'est pas encore à l'ordre du jour. L'enjeu est de créer la prise de conscience et d'obtenir le parrainage de la direction avant toute autre chose.",
    "La conversation est lancée. Des sponsors sont nommés et les premières expérimentations existent — il faut maintenant de la structure, des rôles et un outillage cohérent.",
    "Le modèle opérationnel prend forme : règles du jeu, rôles documentés et formations déployées. Le travail consiste désormais à l'ancrer et à le passer à l'échelle.",
    "L'agilité produit des résultats — partenariats entre pairs, rôles portés, équipes autonomes. Concentrez-vous sur la responsabilité partagée et la diffusion de ce qui marche.",
    "L'agilité est un mode de vie : les dirigeants coachent, les équipes se réinventent en continu et les apprentissages se cumulent. Le travail consiste à le maintenir et à accompagner la vague suivante.",
]

DIMS = [
    {
        "n": "Modèle opérationnel et alignement",
        "s": "Vision, parrainage et implication réelle de la direction.",
        "o": [
            ["Aucune conversation", "Absence de vision et de parrainage de la direction"],
            ["Discussions exploratoires", "Parrainage nommé"],
            ["Règles du jeu", "Difficultés identifiées", "Direction qui porte activement la démarche"],
            ["Partenariats entre pairs (direction)", "Premières victoires marquantes", "Responsabilité partagée"],
            ["Planification stratégique", "Dirigeants qui se relaient", "Dirigeants dans un rôle de coach"],
        ],
    },
    {
        "n": "Engagement dans la livraison de valeur",
        "s": "Compréhension de l'agilité et de la livraison de valeur dans les équipes.",
        "o": [
            ["Absence de compréhension", "Aucune avancée", "Communication et collaboration au coup par coup"],
            ["Plans et discussions", "Agilité vécue comme une conformité"],
            ["Compréhension solide de l'agilité et de la livraison de valeur dans toutes les équipes fonctionnelles"],
            ["Activités pilotées par les utilisateurs", "Coaching entre pairs", "État d'esprit d'ambassadeur"],
            ["Un mode de vie", "Coaching expert"],
        ],
    },
    {
        "n": "Capacités des équipes",
        "s": "Formation, outils et connaissances pour celles et ceux qui font le travail.",
        "o": [
            ["Aucun outil", "Formation inexistante", "Travail en silos"],
            ["Formation de base en cours", "Usage irrégulier des outils"],
            ["Ambassadeurs, coachs et formations déployés", "Outils utilisés de façon cohérente"],
            ["Intégration fluide des nouveaux arrivants", "Accès facile à la gestion des connaissances et à l'aide sur les outils"],
            ["Équipes autonomes qui se forment entre elles", "Communautés de pratique en place"],
        ],
    },
    {
        "n": "Modes de travail",
        "s": "Rôles, autonomie, collaboration et façon de s'améliorer.",
        "o": [
            ["En silos, non alignés ou figés dans des méthodes en cascade"],
            ["Limité à un seul périmètre", "Rôles agiles en discussion, usage irrégulier, autonomie limitée", "Accent mis sur la coopération"],
            ["Processus de redéfinition des modes de travail en place", "Rôles agiles documentés, personnes en cours de transition", "Collaboration organisée par construction"],
            ["Périmètres clés couverts", "Rôles agiles portés par l'organisation", "Les équipes collaborent et fonctionnent de façon autonome"],
            ["Réinvention et ajustement permanents", "Les rôles agiles s'entraident", "Apprentissage organisationnel continu"],
        ],
    },
]

UI = {
    "intro": "Pour chaque dimension, choisissez la description qui correspond le mieux à votre organisation <em>aujourd&rsquo;hui</em>. Soyez honnête &mdash; le profil n&rsquo;a d&rsquo;intérêt que s&rsquo;il est réel.",
    "submit": "Voir mon profil de maturité",
    "hint": "Sélectionnez un niveau pour les quatre dimensions afin de continuer.",
    "ready": "Prêt — voir votre profil.",
    "resultLab": "Votre maturité globale",
    "scorePre": "Score",
    "stageWord": "stade",
    "of": "sur",
    "outOf": "sur 5,0",
    "radarCap": "Radar de maturité",
    "glanceCap": "En un coup d'œil",
    "kOverall": "Stade global",
    "kScore": "Score de maturité",
    "kStrong": "Point fort",
    "kFocus": "Axe de progrès",
    "stageOfPre": "Stade",
    "profileH": "Votre profil, dimension par dimension",
    "nextPre": "Suivant (",
    "nextSuf": "):",
    "top": "<b>Sommet du modèle.</b> Maintenez-le et accompagnez les autres vers ce niveau.",
    "focusEb": "Où concentrer vos efforts",
    "focusStart": "Commencez par",
    "focusIs": "est",
    "focusAre": "sont",
    "focusAt": "à",
    "focusTail": "La maturité progresse quand la dimension la plus faible avance &mdash; c&rsquo;est là que l&rsquo;investissement a le plus d&rsquo;effet de levier.",
    "print": "Enregistrer / imprimer",
    "retake": "Refaire",
    "focusMid": "Votre dimension la moins bien notée",
}

CTA = {
    "text": "Vous souhaitez une évaluation de maturité animée et une feuille de route vers le stade suivant ? Nos SPCT le font chaque semaine avec des équipes d'entreprise.",
    "primary": {"label": "Réserver un échange sur la maturité"},
    "secondary": {"label": "Voir comment nous transformons"},
}

HERO = {
    "eyebrow": "Auto-évaluation gratuite",
    "title": "Évaluation de <em>maturité agile</em>",
    "sub": "Où en est votre organisation sur le chemin qui va d&rsquo;<em>Absent</em> à <em>En vol</em> ? Évaluez quatre dimensions et obtenez un profil de maturité instantané &mdash; avec la prochaine capacité à construire.",
    "note": "2 minutes &middot; Sans inscription &middot; Résultats immédiats",
}


def shape(node):
    """Structure only — used to prove FR matches EN option for option."""
    if isinstance(node, dict):
        return {k: shape(v) for k, v in sorted(node.items())}
    if isinstance(node, list):
        return [shape(v) for v in node]
    return type(node).__name__


def build(en):
    fr = json.loads(json.dumps(en))          # deep copy, keeps key order
    fr["levels"] = LEVELS
    fr["short"] = SHORT
    fr["stageDesc"] = dict(zip(LEVELS, STAGE_DESC))
    for i, d in enumerate(fr["dims"]):
        d["n"], d["s"], d["o"] = DIMS[i]["n"], DIMS[i]["s"], DIMS[i]["o"]
    fr["ui"] = {k: UI[k] for k in en["ui"]}
    fr["cta"]["text"] = CTA["text"]
    fr["cta"]["primary"]["label"] = CTA["primary"]["label"]
    fr["cta"]["secondary"]["label"] = CTA["secondary"]["label"]
    # The booking link is language-neutral; the site page is not. Every other
    # published FR page prefixes site paths, so this one does too.
    fr["cta"]["secondary"]["href"] = "/fr" + en["cta"]["secondary"]["href"]
    fr["hero"] = {k: HERO[k] for k in en["hero"]}
    return fr


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    en = json.load(io.open(os.path.join(root, EN), encoding='utf-8'))
    es = json.load(io.open(os.path.join(root, ES), encoding='utf-8'))
    fr = build(en)

    problems = []
    # stageDesc is keyed by the translated level names, so it is checked on its
    # own below rather than by key-for-key comparison.
    if shape({k: v for k, v in en.items() if k != "stageDesc"}) != \
       shape({k: v for k, v in fr.items() if k != "stageDesc"}):
        problems.append("FR structure does not match EN")
    if len(set(LEVELS)) != 5:
        problems.append("level names must be distinct — stageDesc is keyed by them")
    for name, doc in (("es", es), ("fr", fr)):
        for i, d in enumerate(doc["dims"]):
            if len(d["o"]) != len(en["dims"][i]["o"]):
                problems.append("%s dim %d has %d options, EN has %d"
                                % (name, i, len(d["o"]), len(en["dims"][i]["o"])))
            for j, opt in enumerate(d["o"]):
                if len(opt) != len(en["dims"][i]["o"][j]):
                    problems.append("%s dim %d level %d: %d bullets, EN has %d"
                                    % (name, i, j, len(opt), len(en["dims"][i]["o"][j])))
    if set(fr["stageDesc"]) != set(fr["levels"]):
        problems.append("stageDesc keys do not match the level names")

    if problems:
        for p in problems:
            print("  FAIL " + p)
        sys.exit(1)

    path = os.path.join(root, OUT)
    io.open(path, 'w', encoding='utf-8').write(
        json.dumps(fr, ensure_ascii=False, indent=1) + "\n")
    print("  wrote %s (%d bytes)" % (OUT, os.path.getsize(path)))
    print("  structure matches EN; %d dimensions, %d levels each"
          % (len(fr["dims"]), len(fr["levels"])))


if __name__ == "__main__":
    main()
