import { describe, expect, it } from "vitest";
import { boardAccess, linkRooms, roomAccess, type Room } from "./rooms.js";

const room = (over: Partial<Room> = {}): Room => ({ id: "r1", name: "ART Credit", kind: "art", visibility: "open", defaultAccess: "edit", members: [], links: [], pins: [], createdAt: "", createdBy: "u-a", ...over });
const planner = { userId: "u-p", role: "planner" as const };
const viewer = { userId: "u-v", role: "viewer" as const };
const admin = { userId: "u-a", role: "admin" as const };

describe("rooms", () => {
  it("lets every member into an open room at its default access, capped by their role", () => {
    expect(roomAccess(room(), planner)).toBe("edit");
    expect(roomAccess(room(), viewer)).toBe("view");
    expect(roomAccess(room({ defaultAccess: "view" }), planner)).toBe("view");
    expect(roomAccess(room(), admin)).toBe("manage");
  });
  it("keeps a private room to its members and admins", () => {
    const r = room({ visibility: "private", members: [{ userId: "u-p", access: "manage" }, { userId: "u-v", access: "edit" }] });
    expect(roomAccess(r, planner)).toBe("manage");
    expect(roomAccess(r, viewer)).toBe("view"); // a viewer never edits, whatever the room says
    expect(roomAccess(r, { userId: "u-x", role: "planner" })).toBe("none");
    expect(roomAccess(r, admin)).toBe("manage");
    expect(roomAccess(r, { userId: "anon", role: "viewer", unrestricted: true })).toBe("manage");
  });
  it("gives boards their room's access, and the workspace role outside any room", () => {
    const rooms = [room({ visibility: "private" })];
    expect(boardAccess({ roomId: "r1" }, rooms, planner)).toBe("none");
    expect(boardAccess({}, rooms, planner)).toBe("edit");
    expect(boardAccess({}, rooms, viewer)).toBe("view");
    expect(boardAccess({ roomId: "gone" }, rooms, planner)).toBe("edit");
  });
  it("connects rooms both ways", () => {
    const rooms = [room(), room({ id: "r2" })];
    linkRooms(rooms, "r1", "r2", true);
    expect(rooms.map((r) => r.links)).toEqual([["r2"], ["r1"]]);
    linkRooms(rooms, "r2", "r1", false);
    expect(rooms.map((r) => r.links)).toEqual([[], []]);
  });
});
