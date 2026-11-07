// Name and short name of every built-in class: a leaf module for the pages that only label a class
// (icons, badges, lists), so they do not carry the classes' content. classes.test.ts keeps it in
// step with CLASSES.

export const CLASS_META: { id: string; name: string; short: string }[] = [
  { id: "leading-safe", name: "Leading SAFe", short: "LS" },
  { id: "spc", name: "SAFe Practice Consultant (SPC)", short: "SPC" },
  { id: "aspc", name: "Advanced SPC", short: "ASPC" },
  { id: "popm", name: "Product Owner / Product Manager (POPM)", short: "POPM" },
  { id: "aart", name: "Launching AI-Native ARTs", short: "ART Leader" },
  { id: "aiva", name: "The AI-Native Value Architect", short: "Value Architect" },
  { id: "lpm", name: "Lean Portfolio Management (LPM)", short: "LPM" },
  { id: "lpm-ws", name: "Getting Started with LPM workshop", short: "LPM workshop" },
  { id: "rte", name: "Release Train Engineer (RTE)", short: "RTE" },
];
