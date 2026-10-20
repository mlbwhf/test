import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, createInMemoryRepos } from "@gate/core";
import { buildApp } from "./app.js";
import { TicketSigner, normalizeCode } from "./tickets.js";

describe("ticket signer", () => {
  const signer = new TicketSigner("0123456789abcdef-test-secret");
  it("verifies its own tokens and rejects tampered or foreign ones", () => {
    const t = signer.token("seat_abc");
    expect(signer.verify(t)).toBe("seat_abc");
    expect(signer.verify(t.replace("seat_abc", "seat_abd"))).toBeUndefined();
    expect(signer.verify(`${t}x`)).toBeUndefined();
    expect(signer.verify("seat_abc")).toBeUndefined();
    expect(new TicketSigner("another-secret-0123456789").verify(t)).toBeUndefined();
  });
  it("derives a stable, readable door code", () => {
    const c = signer.code("seat_abc");
    expect(c).toMatch(/^EC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(signer.code("seat_abc")).toBe(c);
    expect(signer.code("seat_abd")).not.toBe(c);
    expect(normalizeCode(c.toLowerCase().replace(/-/g, " "))).toBe(c);
    expect(normalizeCode(c.replace(/^EC-/, ""))).toBe(c);
  });
  it("refuses short secrets", () => {
    expect(() => new TicketSigner("short")).toThrow();
  });
});

async function paidSeat() {
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
  const app = await buildApp({ core, adminKey: "admin", env: "test", publicUrl: "https://api.test", webUrl: "https://app.test", ticketSecret: "0123456789abcdef-test-secret" });
  const mk = async (name: string) => (await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name, country: "US", currency: "USD" } })).json();
  const a = await mk("AA");
  const b = await mk("BB");
  const h = { "x-api-key": a.apiKey as string, "content-type": "application/json" };
  await app.inject({ method: "POST", url: "/v1/organizations/me/payments/connect", headers: h, payload: {} });
  const event = (await app.inject({ method: "POST", url: "/v1/events", headers: h, payload: { name: "RTE Oct", startsAt: "2099-10-21T13:00:00Z", timezone: "America/Toronto" } })).json();
  const tt = (await app.inject({ method: "POST", url: `/v1/events/${event.id}/ticket-types`, headers: h, payload: { name: "Standard", priceMinor: 90000, quantity: 20 } })).json();
  const order = (await app.inject({ method: "POST", url: `/public/v1/organizations/${a.organization.id}/orders`, headers: { "content-type": "application/json" }, payload: { eventId: event.id, ticketTypeId: tt.id, quantity: 1, buyerEmail: "jane@example.com", attendees: [{ email: "jane@example.com", name: "Jane Doe" }] } })).json().order;
  await app.inject({ method: "POST", url: `/public/v1/dev/payments/${order.paymentRef}/succeed` });
  const seats = (await app.inject({ url: `/v1/seats?eventId=${event.id}`, headers: h })).json().items;
  return { app, h, hb: { "x-api-key": b.apiKey as string, "content-type": "application/json" }, event, seat: seats[0] };
}

describe("tickets and check-in", () => {
  it("lists seats with door code and links, serves the ticket and its QR images", async () => {
    const { app, seat } = await paidSeat();
    expect(seat.ticketCode).toMatch(/^EC-/);
    expect(seat.ticketUrl).toMatch(/^https:\/\/app\.test\/my\/ticket\/seat_[^.]+\.[A-Za-z0-9_-]{22}$/);
    expect(seat.checkInUrl).toMatch(/^https:\/\/app\.test\/checkin\//);
    const token = decodeURIComponent(seat.ticketUrl.split("/my/ticket/")[1]);

    const view = await app.inject(`/public/v1/tickets/${encodeURIComponent(token)}`);
    expect(view.statusCode).toBe(200);
    expect(view.json().ticket).toMatchObject({ code: seat.ticketCode, status: "valid", checkedInAt: null, attendee: { name: "Jane Doe" }, ticketTypeName: "Standard" });
    expect(view.json().event.name).toBe("RTE Oct");
    expect(view.json().links.checkIn).toBe(seat.checkInUrl);

    const forged = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    expect((await app.inject(`/public/v1/tickets/${encodeURIComponent(forged)}`)).statusCode).toBe(404);
    expect((await app.inject(`/public/v1/tickets/${encodeURIComponent(forged)}/qr.svg`)).statusCode).toBe(404);

    const svg = await app.inject(`/public/v1/tickets/${encodeURIComponent(token)}/qr.svg`);
    expect(svg.headers["content-type"]).toContain("image/svg+xml");
    expect(svg.body).toContain("<svg");
    const png = await app.inject(`/public/v1/tickets/${encodeURIComponent(token)}/qr.png`);
    expect(png.headers["content-type"]).toBe("image/png");
    expect(png.rawPayload.subarray(1, 4).toString("ascii")).toBe("PNG");
  });

  it("checks in by scanned link or typed code, idempotently, only for the owning organizer", async () => {
    const { app, h, hb, event, seat } = await paidSeat();
    const token = decodeURIComponent(seat.ticketUrl.split("/my/ticket/")[1]);
    const stranger = await app.inject({ method: "POST", url: "/v1/checkins", headers: hb, payload: { token } });
    expect(stranger.statusCode).toBe(404);

    const scan = await app.inject({ method: "POST", url: "/v1/checkins", headers: h, payload: { token } });
    expect(scan.statusCode).toBe(200);
    expect(scan.json()).toMatchObject({ alreadyCheckedIn: false, code: seat.ticketCode, event: { name: "RTE Oct" } });
    expect(scan.json().seat.checkedInAt).not.toBeNull();

    const typed = await app.inject({ method: "POST", url: "/v1/checkins", headers: h, payload: { code: seat.ticketCode.toLowerCase().replace(/-/g, " "), eventId: event.id } });
    expect(typed.json().alreadyCheckedIn).toBe(true);
    const wrong = await app.inject({ method: "POST", url: "/v1/checkins", headers: h, payload: { code: "EC-0000-0000", eventId: event.id } });
    expect(wrong.statusCode).toBe(404);
    const missing = await app.inject({ method: "POST", url: "/v1/checkins", headers: h, payload: { code: "EC-0000-0000" } });
    expect(missing.statusCode).toBe(400);

    expect((await app.inject(`/public/v1/tickets/${encodeURIComponent(token)}`)).json().ticket.status).toBe("checked_in");
    const undo = await app.inject({ method: "POST", url: "/v1/checkins", headers: h, payload: { token, undo: true } });
    expect(undo.json().seat.checkedInAt).toBeNull();
  });

  it("refuses to start in production without a ticket secret", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    await expect(buildApp({ core, env: "production" })).rejects.toThrow(/ticketSecret/);
  });
});
