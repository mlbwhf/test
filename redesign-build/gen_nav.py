#!/usr/bin/env python3
"""Generate the block markup for the global Navigation menu (Twenty Twenty-Five,
nav id 4): top-level items with a grouped Training dropdown that nests the 14
course pages under their /training/<section>/ sub-menus. Writes nav_menu.html."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DOMAIN = "https://darkgoldenrod-peafowl-837528.hostingersite.com"

def link(label, path):
    return ('<!-- wp:navigation-link {"label":"%s","url":"%s%s","kind":"custom"} /-->'
            % (label, DOMAIN, path))

def submenu_open(label, path):
    return ('<!-- wp:navigation-submenu {"label":"%s","url":"%s%s","kind":"custom"} -->'
            % (label, DOMAIN, path))

SECTIONS = [
    ("SAFe", "/training/safe/", [
        ("Leading SAFe (SA)", "/training/safe/sa/"),
        ("SAFe Scrum Master (SSM)", "/training/safe/scrum-master/"),
        ("SAFe Advanced Scrum Master (SASM)", "/training/safe/asm/"),
        ("SAFe Product Owner / Product Manager (POPM)", "/training/safe/popm/"),
        ("SAFe DevOps (SDP)", "/training/safe/devops/"),
    ]),
    ("SAFe for Industry", "/training/safe-industry/", [
        ("SAFe for Teams (SP)", "/training/safe-industry/team-practitioner/"),
        ("SAFe Architect (ARCH)", "/training/safe-industry/arch/"),
        ("SAFe Agile Software Engineering (ASE)", "/training/safe-industry/ase/"),
    ]),
    ("Advanced SAFe", "/training/adv-safe/", [
        ("SAFe Release Train Engineer (RTE)", "/training/adv-safe/rte/"),
        ("SAFe Agile Product Management (APM)", "/training/adv-safe/apm/"),
        ("SAFe Lean Portfolio Management (LPM)", "/training/adv-safe/lpm/"),
        ("Implementing SAFe (SPC)", "/training/adv-safe/spc/"),
        ("Advanced SAFe Practice Consultant (ASPC)", "/training/adv-safe/aspc/"),
    ]),
    ("AI-Native", "/training/ai-native/", [
        ("AI-Native Foundations", "/training/ai-native/ai-native-foundations/"),
    ]),
]

def build():
    out = []
    out.append(link("Home", "/home-redesign/"))
    out.append(submenu_open("Training", "/training/"))
    for sec_label, sec_path, courses in SECTIONS:
        out.append(submenu_open(sec_label, sec_path))
        for label, path in courses:
            out.append(link(label, path))
        out.append("<!-- /wp:navigation-submenu -->")
    out.append("<!-- /wp:navigation-submenu -->")
    out.append(link("Assessments", "/assessments-redesign/"))
    out.append(link("Services", "/services-redesign/"))
    out.append(link("Digital Transformation", "/service-digital-transformation/"))
    return "\n".join(out)

if __name__ == "__main__":
    markup = build()
    open(os.path.join(HERE, "nav_menu.html"), "w").write(markup)
    print("wrote nav_menu.html (%d bytes)" % len(markup))
    print("links:", markup.count("navigation-link"), "submenus:", markup.count("navigation-submenu {"))
