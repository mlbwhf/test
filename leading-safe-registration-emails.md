# Leading SAFe — Registration Emails (Fluent Forms)
_Two notifications to add in: Fluent Forms → edit form → Settings → **Email Notifications**. Both use Fluent Forms smart-tags `{inputs.FIELD_KEY}` — replace keys with your actual field names (Fluent Forms shows the exact codes via the `{ }` button next to each field)._

> **Trigger:** set the **registrant confirmation** to fire only on **payment success** (Notification → Conditional Logic → `Payment Status` = `paid`). The **admin alert** can fire on submit (so you see started/abandoned too) or also on paid — your call.

---

## 1) ADMIN NOTIFICATION (to you)
- **Name:** Admin – New Leading SAFe registration
- **Send To:** your email (e.g. `john@agile-agilist.com`)
- **Subject:** `🎟️ New Leading SAFe registration — {inputs.cohort}`
- **Email Body (Text or HTML):**
```
New registration received:

Name:        {inputs.names}
Email:       {inputs.email}
Company:     {inputs.company}
Phone:       {inputs.phone}
Cohort:      {inputs.cohort}
Seats:       {inputs.quantity}
Payment:     {payment.status} — {payment.total}
Submitted:   {submission.date}

Entry: {submission.admin_view_url}
Remember to add the attendee to the SAFe Studio roster before class.
```

---

## 2) REGISTRANT CONFIRMATION — branded "ticket" (to the attendee)
- **Name:** Attendee – Confirmation Ticket
- **Send To:** `{inputs.email}`
- **Subject:** `✅ You're confirmed — Leading SAFe® · {inputs.cohort}`
- **Email Body:** switch the body editor to **HTML / source/code view** and paste:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f4;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">

  <!-- Header -->
  <tr><td style="background:#053947;padding:26px 30px" align="left">
    <span style="color:#fbbf24;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">Agile Agilist · SAFe® Gold Partner</span><br>
    <span style="color:#ffffff;font-size:22px;font-weight:bold">Registration Confirmed ✅</span>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:26px 30px 8px">
    <p style="margin:0;color:#0f172a;font-size:16px">Hi {inputs.names},</p>
    <p style="margin:10px 0 0;color:#475569;font-size:14px;line-height:1.6">You're all set. Your seat for the <strong>Leading SAFe® (SAFe Agilist) Certification</strong> is confirmed. Here is your ticket:</p>
  </td></tr>

  <!-- TICKET -->
  <tr><td style="padding:14px 30px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #0170B9;border-radius:12px">
      <tr><td style="padding:20px 22px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Course</td>
            <td align="right" style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Attendee</td>
          </tr>
          <tr>
            <td style="font-size:16px;color:#053947;font-weight:bold;padding-bottom:12px">Leading SAFe® (SA)</td>
            <td align="right" style="font-size:16px;color:#053947;font-weight:bold;padding-bottom:12px">{inputs.names}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Cohort</td>
            <td align="right" style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Format</td>
          </tr>
          <tr>
            <td style="font-size:15px;color:#0f172a;font-weight:bold">{inputs.cohort}</td>
            <td align="right" style="font-size:15px;color:#0f172a;font-weight:bold">Live virtual</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="border-top:1px dashed #cbd5e1;padding:14px 22px;background:#f8fafc;border-radius:0 0 12px 12px">
        <table role="presentation" width="100%"><tr>
          <td style="font-size:13px;color:#475569">Order ref: <strong>{submission.id}</strong></td>
          <td align="right" style="font-size:13px;color:#475569">Paid: <strong>{payment.total}</strong></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- What happens next -->
  <tr><td style="padding:22px 30px 6px">
    <p style="margin:0 0 8px;color:#053947;font-size:15px;font-weight:bold">What happens next</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="color:#475569;font-size:14px;line-height:1.6">
      <tr><td style="padding:3px 0">✔ A calendar invite with the joining link follows shortly.</td></tr>
      <tr><td style="padding:3px 0">✔ ~1–2 weeks before class you'll get <strong>SAFe Studio</strong> access + course materials direct from Scaled Agile.</td></tr>
      <tr><td style="padding:3px 0">✔ Your official exam is <strong>included</strong> — details arrive after the class.</td></tr>
      <tr><td style="padding:3px 0">✔ Questions? Reply to this email or <a href="https://meetings.hubspot.com/john2795" style="color:#0170B9">book a call</a>.</td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:16px 30px 24px" align="center">
    <a href="https://agile-agilist.com/training/safe/sa/" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:bold;font-size:15px;text-decoration:none;padding:13px 30px;border-radius:8px">View course details →</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0f172a;padding:18px 30px" align="center">
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">Agile Agilist · SAFe® Gold Partner · Authorised SAFe Instructor (SPC/ASPC)<br>
    SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc.</p>
  </td></tr>

</table>
</td></tr></table>
```

### Smart-tag mapping (adjust to your field keys)
| Used in template | Map to your field |
|---|---|
| `{inputs.names}` | the Name field key |
| `{inputs.email}` | Email |
| `{inputs.cohort}` | the Cohort dropdown key |
| `{inputs.company}` / `{inputs.phone}` / `{inputs.quantity}` | those fields |
| `{payment.total}` / `{payment.status}` | the Stripe payment field |
| `{submission.id}` | auto (entry ID = order ref) |

### Setup steps
1. Fluent Forms → your form → **Settings → Email Notifications → Add Notification** → create **#1 Admin** (above).
2. Add a second notification → **#2 Attendee** → paste the HTML, set **Send To = `{inputs.email}`**, and under **Conditional Logic** require **Payment Status = paid** so it only sends after payment.
3. Send a **test entry** (Stripe test mode) to confirm both arrive and the ticket renders. Check spam; set a proper **From name/email** (Fluent Forms → Settings, or an SMTP plugin) so it lands reliably.
