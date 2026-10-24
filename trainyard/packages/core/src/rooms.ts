// Rooms: how a workspace organises its boards and who may open them. A room holds boards
// (whiteboards, class boards, imported boards) and pins to the app's own views, for one
// purpose: an ART's planning room, the OKR room, the portfolio room, a class cohort. Rooms
// can be connected, so the portfolio room links to every ART room and back, or stand alone.
//
// Access is decided per room, never per card: the workspace role is the ceiling (a viewer
// never edits), an open room lets every member in at its default access, and a private room
// lets in only its members and the workspace's admins. Boards inherit their room's access;
// a board outside any room is open to the whole workspace, as before rooms existed.

export const ROOM_KINDS = ["art", "okr", "portfolio", "class", "team", "general"] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  art: "ART room",
  okr: "OKR room",
  portfolio: "Portfolio room",
  class: "Class room",
  team: "Team room",
  general: "Room",
};

/** What someone can do in a room, in increasing order. */
export const ROOM_ACCESS = ["none", "view", "edit", "manage"] as const;
export type RoomAccess = (typeof ROOM_ACCESS)[number];

export interface RoomMember {
  userId: string;
  access: Exclude<RoomAccess, "none">;
}

export interface RoomPin {
  /** A path inside the app: /board, /okrs, /portfolio… */
  href: string;
  label: string;
}

export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
  description?: string;
  /** Open: every workspace member enters at defaultAccess. Private: members and admins only. */
  visibility: "open" | "private";
  defaultAccess: "view" | "edit";
  members: RoomMember[];
  /** Rooms this one is connected to; the link shows on both sides. */
  links: string[];
  pins: RoomPin[];
  /** The ART (top-level group) an ART room plans for, when there is one. */
  groupId?: string;
  createdAt: string;
  createdBy: string;
}

/** The person asking: their workspace role decides the ceiling. */
export interface RoomViewer {
  userId: string;
  role: "admin" | "planner" | "architect" | "viewer";
  /** Open mode or support: everything is allowed. */
  unrestricted?: boolean;
}

const rank = (a: RoomAccess) => ROOM_ACCESS.indexOf(a);
const min = (a: RoomAccess, b: RoomAccess): RoomAccess => (rank(a) <= rank(b) ? a : b);
/** The most a workspace role allows anywhere. */
const ceiling = (v: RoomViewer): RoomAccess => (v.unrestricted || v.role === "admin" ? "manage" : v.role === "viewer" ? "view" : "edit");

export function roomAccess(room: Room, v: RoomViewer): RoomAccess {
  const top = ceiling(v);
  if (top === "manage") return "manage";
  const member = room.members.find((m) => m.userId === v.userId);
  // A planner made a room's manager runs that room (members, links); a viewer only looks.
  if (member) return min(member.access, v.role === "viewer" ? "view" : "manage");
  if (room.visibility === "private") return "none";
  return min(room.defaultAccess, top);
}

/** Access to a board: its room's, or the workspace role's for a board outside any room. */
export function boardAccess(board: { roomId?: string }, rooms: Room[], v: RoomViewer): RoomAccess {
  const room = board.roomId ? rooms.find((r) => r.id === board.roomId) : undefined;
  if (!room) return ceiling(v);
  return roomAccess(room, v);
}

export const canView = (a: RoomAccess) => rank(a) >= rank("view");
export const canEdit = (a: RoomAccess) => rank(a) >= rank("edit");

/** Pins a new room of this kind starts with: the app views that kind of room is for. */
export function defaultPins(kind: RoomKind): RoomPin[] {
  switch (kind) {
    case "art":
      return [
        { href: "/board", label: "PI planning board" },
        { href: "/readiness", label: "Readiness, WSJF & risks" },
        { href: "/outcome-planning", label: "PI Outcome Planning" },
        { href: "/dashboards", label: "Delivery dashboards" },
      ];
    case "okr":
      return [
        { href: "/okrs", label: "OKR dashboard" },
        { href: "/okrs/alignment", label: "Alignment" },
        { href: "/okrs/check-in", label: "Check-in" },
      ];
    case "portfolio":
      return [
        { href: "/portfolio", label: "Portfolio" },
        { href: "/value-streams", label: "Value streams" },
      ];
    case "class":
      return [
        { href: "/classroom", label: "Class boards" },
        { href: "/classroom/breakouts", label: "Breakouts" },
        { href: "/classroom/agenda", label: "Agenda" },
      ];
    default:
      return [];
  }
}

/** Connects two rooms both ways, or disconnects them. */
export function linkRooms(rooms: Room[], a: string, b: string, on: boolean): void {
  if (a === b) return;
  for (const [x, y] of [[a, b], [b, a]] as const) {
    const r = rooms.find((room) => room.id === x);
    if (!r) continue;
    r.links = on ? [...new Set([...r.links, y])] : r.links.filter((id) => id !== y);
  }
}
