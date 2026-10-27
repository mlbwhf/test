import { describe, expect, it } from "vitest";
import { senders } from "./mailer.js";

describe("mail senders", () => {
  it("sends account mail from support and payment mail from billing, each overridable", () => {
    expect(senders({})).toEqual({ support: "Trainyard <support@trainyard.app>", billing: "Trainyard Billing <billing@trainyard.app>" });
    expect(senders({ TRAINYARD_MAIL_FROM: "Help <help@x.io>", TRAINYARD_BILLING_FROM: "Pay <pay@x.io>" })).toEqual({ support: "Help <help@x.io>", billing: "Pay <pay@x.io>" });
  });
});
