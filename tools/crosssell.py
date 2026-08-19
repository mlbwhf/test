# -*- coding: utf-8 -*-
"""Per-course positioning sentence for the "Your SAFe career path" block.

Every English course page shipped the same sentence — "SPC is the change-agent
credential…" — regardless of which course the page describes. Spanish adapted
it per course; French adapted it on some pages and not others. This module is
the single source of truth for all three languages.

Discovered by held-out validation of the course translation memory: the TM
proposed LPM's sentence for SDP, which was only possible because the English
side was identical across pages while the translations were not.
"""

EN = ("{code} is the {pos} credential. Pair it with {with_}, or advance into "
      "{next_} credentials. These are pulled from our live course catalogue.")
ES = ("{code} es la credencial {pos}. Combínala con {with_}, o avanza hacia "
      "credenciales {next_}. Se toman de nuestro catálogo de cursos en vivo.")
FR = ("{code} est la certification {pos}. Associez-la aux {with_}, ou progressez "
      "vers des certifications {next_}. Elles proviennent de notre catalogue de "
      "cours en direct.")

# code -> (positioning, what to pair it with, what to advance into) per language
COURSES = {
 "SPC": {
   "en": ("change-agent", "the core SAFe roles you will enable",
          "portfolio and consulting"),
   "es": ("de agente de cambio", "los roles SAFe fundamentales que habilitarás",
          "de portafolio y consultoría"),
   "fr": ("d'agent du changement", "rôles SAFe fondamentaux que vous activerez",
          "de portefeuille et de conseil"),
 },
 "LPM": {
   "en": ("portfolio", "the core SAFe roles you work with day to day",
          "consulting and change-agent"),
   "es": ("de portafolio", "los roles SAFe con los que trabajarás a diario",
          "de consultoría y agente de cambio"),
   "fr": ("de portefeuille", "rôles SAFe avec lesquels vous travaillez au quotidien",
          "de conseil et d'agent du changement"),
 },
 "APM": {
   "en": ("product-leadership", "the core SAFe roles you work with day to day",
          "portfolio and consulting"),
   "es": ("de liderazgo de producto", "los roles SAFe con los que trabajarás a diario",
          "de portafolio y consultoría"),
   "fr": ("de leadership produit", "rôles SAFe avec lesquels vous travaillez au quotidien",
          "de portefeuille et de conseil"),
 },
 "SDP": {
   "en": ("continuous-delivery", "the adjacent technical roles that ship alongside you",
          "program, portfolio, and consulting"),
   "es": ("técnica del flujo de entrega", "los roles SAFe con los que trabajarás a diario",
          "de programa, portafolio y consultoría"),
   "fr": ("de livraison continue", "rôles techniques adjacents qui livrent à vos côtés",
          "de niveau programme, de portefeuille et de conseil"),
 },
 "SASM": {
   "en": ("team- and ART-level coaching",
          "the core SAFe roles you work with day to day",
          "program, portfolio, and consulting"),
   "es": ("de coaching a nivel de equipo y de ART",
          "los roles SAFe con los que trabajarás a diario",
          "de programa, portafolio y consultoría"),
   "fr": ("de coaching d'équipe avancé",
          "rôles d'équipe et techniques adjacents que vous accompagnez",
          "de niveau programme et de conseil"),
 },
 "RTE": {
   "en": ("program-level", "the team roles that run inside your train",
          "portfolio and consulting"),
   "es": ("de nivel de programa", "los roles de equipo que operan dentro de tu tren",
          "de portafolio y consultoría"),
   "fr": ("de niveau programme", "rôles d'équipe qui opèrent au sein de votre train",
          "de portefeuille et de conseil"),
 },
 "SSM": {
   "en": ("team-facilitation", "the team roles you serve every day",
          "advanced and program-level"),
   "es": ("de facilitación de equipo", "los roles de equipo a los que sirves cada día",
          "avanzadas y de nivel de programa"),
   "fr": ("de facilitation d'équipe", "rôles d'équipe que vous servez au quotidien",
          "avancées et de niveau programme"),
 },
 "POPM": {
   "en": ("product-ownership", "the team and program roles you deliver with",
          "product-leadership and portfolio"),
   "es": ("de propiedad de producto", "los roles de equipo y programa con los que entregas",
          "de liderazgo de producto y portafolio"),
   "fr": ("de product ownership", "rôles d'équipe et programme avec lesquels vous livrez",
          "de leadership produit et de portefeuille"),
 },
 "SP": {
   "en": ("team-level", "the roles that lead and coach your train",
          "advanced and consultant"),
   "es": ("de nivel de equipo", "los roles que lideran y acompañan a tu tren",
          "avanzadas y de consultoría"),
   "fr": ("de niveau équipe", "rôles qui pilotent et accompagnent votre train",
          "avancées et de consultant"),
 },
 "ARCH": {
   "en": ("architecture", "the technical and program roles you design for",
          "advanced and consultant"),
   "es": ("de arquitectura", "los roles técnicos y de programa para los que diseñas",
          "avanzadas y de consultoría"),
   "fr": ("d'architecture", "rôles techniques et programme pour lesquels vous concevez",
          "avancées et de consultant"),
 },
 "ASE": {
   "en": ("engineering", "the adjacent technical roles that ship alongside you",
          "advanced and consultant"),
   "es": ("de ingeniería", "los roles técnicos adyacentes que entregan a tu lado",
          "avanzadas y de consultoría"),
   "fr": ("d'ingénierie", "rôles techniques adjacents qui livrent à vos côtés",
          "avancées et de consultant"),
 },
}

TEMPLATE = {"en": EN, "es": ES, "fr": FR}


def sentence(code, lang):
    pos, with_, next_ = COURSES[code][lang]
    return TEMPLATE[lang].format(code=code, pos=pos, with_=with_, next_=next_)


if __name__ == "__main__":
    for c in COURSES:
        for l in ("en", "es", "fr"):
            print(f"[{c}-{l}] {sentence(c, l)}")
        print()
