// What the Rooms pages share: the room as the API returns it, and how kinds and access read.

import type { RoomKind } from "@trainyard/core";

export interface RoomView {
  id: string;
  name: string;
  kind: RoomKind;
  description?: string;
  visibility: "open" | "private";
  defaultAccess: "view" | "edit";
  access: "none" | "view" | "edit" | "manage";
  boards: { id: string; name: string; system: string; nodes: number }[];
  members: { userId: string; access: "view" | "edit" | "manage"; name: string }[];
  links: { id: string; name: string; kind: RoomKind; visible: boolean }[];
  pins: { href: string; label: string }[];
}

export const KIND_COLOR: Record<RoomKind, string> = { art: "#ffe27a", okr: "#ff9fc6", portfolio: "#b9c6ff", class: "#5ff0e0", team: "#ffd58a", general: "#e6e1d6" };
export const ACCESS_LABEL = { none: "No access", view: "Can look", edit: "Can edit", manage: "Manages" } as const;
