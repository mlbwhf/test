// The help center: every article in one place so search, the index and contextual "?" links
// share it. Inline text supports **bold**, `code` and [label](/path) links.

export type HelpBlock =
  | { h: string }
  | { p: string }
  | { steps: string[] }
  | { list: string[] }
  | { tip: string }
  | { code: string }
  | { table: { head: string[]; rows: string[][] } };

export type HelpSection = "start" | "classes" | "day" | "money" | "team" | "integrations" | "learners" | "trouble";

export type HelpArticle = {
  slug: string;
  section: HelpSection;
  title: string;
  summary: string;
  /** Who it is for, shown as chips. */
  for: Array<"Owners & admins" | "Instructors" | "Finance" | "Learners" | "Developers">;
  body: HelpBlock[];
  related?: string[];
};

export const HELP_SECTIONS: Array<{ key: HelpSection; title: string; blurb: string }> = [
  { key: "start", title: "Getting started", blurb: "Create your account, connect payments and publish your first class." },
  { key: "classes", title: "Classes & registration", blurb: "Create, duplicate, import and share classes; the public page and widget." },
  { key: "day", title: "Class day", blurb: "Check-in, tickets, certificates and digital badges." },
  { key: "money", title: "Money", blurb: "How payments are held and released, refunds, payouts, currencies." },
  { key: "team", title: "Team & roles", blurb: "Invite people, what each role can do, instructor controls." },
  { key: "integrations", title: "Integrations", blurb: "API keys, webhooks, Zapier, Make, n8n and AI assistants (MCP)." },
  { key: "learners", title: "For learners", blurb: "Tickets, calendar, changing dates, cancelling and certificates." },
  { key: "trouble", title: "Troubleshooting", blurb: "Sign-in emails, Stripe status, webhooks and access messages." },
];

export const HELP: HelpArticle[] = [
  // ---------------------------------------------------------------- getting started
  {
    slug: "quick-start",
    section: "start",
    title: "Quick start: your first class in 10 minutes",
    summary: "From sign-up to a shareable registration link, step by step.",
    for: ["Owners & admins"],
    body: [
      { p: "EnrollClass takes registrations and payments for training you run. Learners pay when they book; the money is held until the class is delivered, then released to you." },
      { h: "1. Create your account" },
      { steps: ["Go to [app.enrollclass.com/login?mode=signup](/login?mode=signup).", "Sign up with Google, Microsoft, LinkedIn or an email link.", "Choose **Training organization** (a company with several instructors) or **Independent instructor** (just you). Pick your country and currency."] },
      { h: "2. Connect Stripe (paid classes only)" },
      { p: "On **Home**, the attention list shows **Connect Stripe to get paid**. Click **Connect** and complete Stripe's short form. EnrollClass counts Stripe as connected only once Stripe has enabled payments and payouts. See [Connect Stripe](/help/connect-stripe)." },
      { p: "Running only free classes? Skip this step: free classes need no Stripe account and cost nothing. See [Free classes](/help/free-classes)." },
      { h: "3. Create a class" },
      { steps: ["Click **+ Create event** in the sidebar.", "Pick a course or click **+ New course** and name it.", "Set the format, first day, number of days, daily times, time zone, ticket price and seats.", "Review and click **Publish event**."] },
      { h: "4. Share it" },
      { p: "After publishing you get the public course page link and the code to embed registration on your own site. Copy either and share it." },
      { tip: "The setup bar at the top of Home tracks these five steps: account, payments, course, class, first registration." },
    ],
    related: ["connect-stripe", "create-a-class", "share-and-embed"],
  },
  {
    slug: "the-console",
    section: "start",
    title: "Finding your way around",
    summary: "Home, Events, Money and Team, plus the phone layout.",
    for: ["Owners & admins", "Instructors", "Finance"],
    body: [
      { p: "The console has four areas. You only see the ones your role can use." },
      { table: { head: ["Area", "What's there"], rows: [
        ["Home", "Today: totals, the **Needs your attention** list with one-tap actions, the class running today with check-in progress, and classes starting this week."],
        ["Events", "Every class grouped by week with search and filters (All, This week, Next week, Low fill). Courses, Check-in and Import are tabs here."],
        ["Money", "Orders, Payouts, Revenue and Settings (payments, release rules, currencies)."],
        ["Team", "People and roles, instructor pay profiles, and Integrations."],
      ] } },
      { p: "The green **+ Create event** button is always in the sidebar. Your organization, country and currency are at the bottom; click them to switch organization or sign out." },
      { h: "On a phone" },
      { p: "The sidebar becomes a floating bar at the bottom: Home, Events, Check-in, Money and **+**. Team is in the menu under your initials (top right)." },
      { tip: "Items in **Needs your attention** can be dismissed with ×. A dismissed item comes back if the situation changes (for example another seat sells)." },
    ],
    related: ["today-attention", "events-list"],
  },
  {
    slug: "connect-stripe",
    section: "start",
    title: "Connect Stripe to get paid",
    summary: "Set up your Stripe account so learners can pay and you receive payouts.",
    for: ["Owners & admins"],
    body: [
      { steps: ["Open **Home** and click **Connect** on **Connect Stripe to get paid**, or go to **Money → Settings → Payments**.", "Stripe opens in the same tab. Enter your business (or personal, for independent instructors) details and bank account.", "When you finish, Stripe sends you back to Home."] },
      { p: "If Stripe still needs something, Home shows **Finish your Stripe setup** with a **Continue** button that reopens the form exactly where you stopped." },
      { tip: "Stripe sometimes takes a few minutes to approve an account. Reload Home after a short while; it asks Stripe for the current status each time." },
      { p: "Stripe is only needed for paid classes. If all your classes are free, Home shows the reminder in amber instead of red and you can ignore it." },
    ],
    related: ["how-payments-work", "stripe-not-ready", "free-classes"],
  },

  // ---------------------------------------------------------------- classes
  {
    slug: "create-a-class",
    section: "classes",
    title: "Create a class (the 3-step wizard)",
    summary: "Course, dates & tickets, publish — with a live preview as you type.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { p: "Click **+ Create event**. The preview on the right shows what learners will see." },
      { h: "Step 1 — Course" },
      { p: "A course is what you teach (for example *Leading SAFe*). A class (also called a cohort) is one run of it with dates and seats. Pick a course, or **+ New course** to create one with its length in days." },
      { h: "Step 2 — Dates & tickets" },
      { list: [
        "**Format**: live virtual, in person or hybrid.",
        "**First day**, **Days**, daily **Starts** and **Ends** times, and **Time zone**. Sessions are created for each day; **Skip weekends** leaves out Saturday and Sunday. The dates are listed under the fields so you can check them.",
        "**Ticket** name, **Price**, **Currency** and **Seats**. Enter **0** for a free class.",
        "**Minimum to run** (optional): below this, Home warns you as the start date approaches.",
        "Owners and admins choose who teaches under **Taught by**.",
      ] },
      { h: "Step 3 — Publish" },
      { p: "Review and click **Publish event**. Registration opens immediately and you get the share link and embed code." },
      { tip: "Pre-work and survey emails come from the course. Add them on the course page (Events → Courses) so every class of the course sends them." },
    ],
    related: ["duplicate-a-class", "share-and-embed", "course-emails", "free-classes"],
  },
  {
    slug: "free-classes",
    section: "classes",
    title: "Free classes: no fees, no payment",
    summary: "Set the price to 0 and EnrollClass charges nothing, to you or to learners.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { p: "A class whose tickets cost **0** is free for everyone: EnrollClass takes **no fee**, learners enter **no card**, and nothing is held or paid out. You don't need a Stripe account to run free classes." },
      { steps: ["Click **+ Create event** (or edit a class's tickets).", "Enter **0** as the ticket **Price**. The wizard confirms: *Free class*.", "Publish. The public page and the embedded widget show **Free**, and the button says **Register** instead of payment."] },
      { h: "What learners still get" },
      { list: ["A confirmation with a QR ticket and a calendar invitation for every session.", "Reminders, pre-work and joining instructions from the course.", "The link to change or cancel their booking, and waitlist offers when the class is full.", "Attendance or completion certificates and any digital badge you link to the course."] },
      { h: "Mixing free and paid" },
      { p: "Free and paid tickets can sit in the same class, for example a free seat for speakers next to a paid one. Fees apply only to the paid tickets. Paid classes need Stripe connected; free ones never do." },
      { tip: "Free registrations appear under the class in **Events** with their check-in status, exactly like paid ones; they add nothing to fees, held funds or payouts." },
    ],
    related: ["create-a-class", "share-and-embed", "how-payments-work"],
  },
  {
    slug: "duplicate-a-class",
    section: "classes",
    title: "Duplicate a class or create a series",
    summary: "Copy a class to the same dates, a new date, or repeat it weekly or monthly.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { steps: ["Open **Events** and select the class.", "Click **Duplicate**.", "Keep the first day to copy on the **same dates**, or pick a new first day.", "Choose **Repeat**: just once, every week, every 2 weeks or every month, and how many copies (up to 12).", "Check the dates listed and click **Create**."] },
      { p: "Copies keep the course, format, time zone, ticket types and prices (including regional prices), minimum, instructors and instructor pay. Nothing sold is copied." },
      { tip: "Times stay the same in local time, so 9:00 in Toronto stays 9:00 even across a daylight-saving change. An early-bird price whose window has already closed for the new dates is dropped." },
    ],
    related: ["create-a-class", "events-list"],
  },
  {
    slug: "events-list",
    section: "classes",
    title: "The Events screen",
    summary: "Find a class quickly and see its seats, attendees and emails in one place.",
    for: ["Owners & admins", "Instructors", "Finance"],
    body: [
      { p: "The left side lists classes by week; **Past** classes are at the bottom. Search by class or course name and filter with **All**, **This week**, **Next week** or **Low fill** (below its minimum, or under 40% sold when there is no minimum)." },
      { p: "Selecting a class shows, on the right:" },
      { list: [
        "**Edit** (the full class page), **Copy link**, **Duplicate** and **Check-in**.",
        "**Taught by**: owners and admins change instructors with the pencil.",
        "**Seats**: sold, left, and (for money roles) money held and net.",
        "**Attendees** with payment status, check-ins and certificate links.",
        "**Course flow** and whether the pre-work and survey **Emails** are set.",
        "**Certificates**: issue attendance or completion certificates.",
      ] },
      { p: "The selection and filters are in the page address, so you can bookmark or share a view. On a phone the list shows first; tap a class to open it and **← All events** to go back." },
    ],
    related: ["check-in", "certificates"],
  },
  {
    slug: "share-and-embed",
    section: "classes",
    title: "Share your course page or embed registration",
    summary: "The public page learners book from, and the widget for your own website.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { h: "Public course page" },
      { p: "Every course has a public page at `app.enrollclass.com/c/<your organization>/<course>`. It shows the banner, dates to choose from, seats left, how the course runs, the price and a **Register** button. It works well on phones and includes structured data so search engines and AI assistants understand the dates and prices." },
      { p: "Copy it from **Events → Copy link** or from the last step of the wizard." },
      { h: "Embed on your own website" },
      { p: "The wizard's last step shows a short code snippet. Paste it into any page (WordPress, Squarespace, Webflow, plain HTML). It shows your dates and takes the registration and payment right there." },
      { code: '<div data-gate-widget\n     data-gate-api="https://api.enrollclass.com"\n     data-gate-org="org_…"\n     data-gate-course="leading-safe"\n     data-gate-currency="USD"></div>\n<script src="https://api.enrollclass.com/widget/v1/gate-widget.js" async></script>' },
      { tip: "Add `data-gate-event=\"evt_…\"` to show just one date." },
    ],
    related: ["create-a-class", "currencies"],
  },
  {
    slug: "import",
    section: "classes",
    title: "Import classes from Eventbrite or a spreadsheet",
    summary: "Bring existing events in, with a preview before anything is saved.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { steps: ["Go to **Events → Import** (or the **Import** button on Events).", "For Eventbrite, paste a private token from your Eventbrite account settings. It's used for this import only and never stored.", "For a spreadsheet, upload a CSV with one row per class.", "Check the preview: courses, dates, tickets and anything skipped.", "Confirm to create the classes."] },
      { h: "What comes across" },
      { table: { head: ["", "Eventbrite", "CSV (Corsizio, spreadsheets)"], rows: [
        ["Dates, time zone, format", "Yes", "start, end, time zone, format or location columns"],
        ["Tickets and prices (free stays free)", "Yes, with seats and sold counts", "price (0 = free), seats, ticket type"],
        ["Course cover image", "The event image, copied to EnrollClass", "image column"],
        ["Digital badge", "A Credly, Accredible, Badgr or Certopus link in the description", "badge column (link) or badge image column (your own badge)"],
        ["Instructors", "No", "instructors or trainer column; new names are added as instructors"],
        ["Minimum to run, joining link, certification body", "No", "minimum, meeting link, certification body columns"],
        ["Drafts", "Eventbrite drafts arrive as drafts", "status column with draft"],
      ] } },
      { tip: "Download the template on the Import page for every column name. An existing course keeps its own cover and badge; the import only fills them in when missing." },
    ],
    related: ["badges", "free-classes", "create-a-class"],
  },
  {
    slug: "course-emails",
    section: "classes",
    title: "Automatic emails: pre-work, reminders and survey",
    summary: "What learners receive and when, and how to set the content.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { table: { head: ["When", "Email"], rows: [
        ["On registration", "Confirmation with ticket (QR code), calendar invitation and a link to manage the booking"],
        ["14 days before", "Pre-work (if set on the course)"],
        ["7 days and 1 day before", "Reminders"],
        ["2 hours before", "Today's join details"],
        ["2 hours after the end", "Survey (if a survey link is set)"],
        ["When issued", "Certificate link"],
      ] } },
      { steps: ["Open **Events → Courses** and choose the course.", "Under **Delivery settings**, add the pre-work text and the survey link.", "Save. Every class of the course uses them."] },
      { tip: "The Events detail shows **Pre-work** and **Survey** as Set or Not set, and Home reminds you when a class with registrations is close and has no pre-work." },
    ],
  },

  // ---------------------------------------------------------------- class day
  {
    slug: "check-in",
    section: "day",
    title: "Check people in",
    summary: "Full-screen check-in with scanning, codes and one-tap cards.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { p: "Open check-in from **Home → Open check-in** (on the class running today), **Events → Check-in**, or the Check-in tab on a phone. It fills the screen; **× Exit check-in** brings the console back." },
      { list: [
        "**Tap a person's card** to check them in; tap again to undo.",
        "**Scan next ticket** uses the camera (Chrome on Android) and reads the QR code.",
        "On iPhone, scan the ticket QR with the normal Camera app; it opens a page where you confirm the check-in.",
        "Or type the code printed under the QR, like `EC-7K2M-94QX`.",
        "Search finds people by name, email, company or code.",
      ] },
      { p: "The big number and the seat grid show progress. Several people can check in at different doors; everyone's screen updates within 15 seconds." },
      { tip: "A ticket for a different class says so instead of silently checking the person in here." },
    ],
    related: ["tickets", "certificates"],
  },
  {
    slug: "certificates",
    section: "day",
    title: "Attendance and completion certificates",
    summary: "Issue branded certificates learners can download, share on LinkedIn and verify.",
    for: ["Owners & admins", "Instructors"],
    body: [
      { steps: ["Open **Events**, select the class.", "In **Certificates**, choose **Attendance** or **Completion**.", "Leave **Only people checked in** ticked to skip no-shows.", "Click **Issue certificates**."] },
      { p: "Each learner gets an email with their certificate link. Certificates are issued once per person; issuing again only adds people who don't have one yet." },
      { p: "The certificate page shows the learner, course, dates, contact hours, format, instructors and your organization, with **Download PDF** (one A4 landscape page), **Add to LinkedIn**, and **Claim your badge** when the course has one. Anyone with the link can verify it." },
      { tip: "Instructors can issue certificates for the classes they teach." },
    ],
    related: ["badges", "check-in"],
  },
  {
    slug: "badges",
    section: "day",
    title: "Verified digital badges (and Credly, Accredible…)",
    summary: "Design or upload a badge, issue it with every certificate, move badges from other platforms.",
    for: ["Owners & admins", "Instructors", "Learners"],
    body: [
      { p: "An **EnrollClass verified badge** is issued with each certificate of the course. It follows **Open Badges 3.0**, the standard Credly and other platforms use: the badge image carries a signed credential, so learners can add it to LinkedIn, keep it in any Open Badges wallet or backpack, and anyone can check it at [/verify](/verify), even years later and without EnrollClass." },
      { h: "Create the badge" },
      { steps: ["Open **Events → Courses** and choose the course (or **Events → Badges**).", "Under **Digital badge**, open **Design a badge**: pick a shape, colors and an icon, type the badge name and the top and bottom lines. The preview updates as you go.", "Click **Use this badge**. Or upload your own image under **Edit the badge by hand** and pick **EnrollClass verified badge**."] },
      { p: "From then on, every certificate you issue for the course includes the badge. Learners find **Download your verified badge** on their certificate page and in the certificate email." },
      { h: "Move badges from Credly, Accredible or another platform" },
      { steps: ["Open **Events → Badges**. Courses whose badge lives elsewhere are listed at the top.", "Click **Move all** (or **Move to EnrollClass** on one course). We copy each badge's name and image.", "On the course, click **Award badge** to give it to everyone who already has a certificate, with an email (untick **Email them** to award quietly)."] },
      { p: "Badges already issued on the other platform stay valid there; you can stop paying for new ones." },
      { h: "Cost" },
      { p: "$1 per paid seat on courses that issue a verified badge (same in EUR and GBP, local equivalents elsewhere), collected with the seat fee in both payment modes. Free classes stay free." },
      { h: "Linking an outside badge instead" },
      { steps: ["Under **Edit the badge by hand**, pick the platform (Credly, Accredible, Badgr / Canvas Credentials, Certopus or Other).", "Enter the badge name and the link to the badge page there, and optionally its image.", "Click **Update badge**. Learners see **Claim your badge** on their certificate."] },
      { tip: "Issued badges never change: they keep the name, image and issuer they had when issued, even if you edit the course later. To issue badges automatically on another platform, use a [webhook](/help/webhooks) on **certificate.issued** with Zapier or Make." },
    ],
    related: ["certificates", "import", "learner-certificate"],
  },

  // ---------------------------------------------------------------- money
  {
    slug: "how-payments-work",
    section: "money",
    title: "How payments work: held until delivery",
    summary: "Where the money goes, when it's released, and what the Money totals mean.",
    for: ["Owners & admins", "Finance"],
    body: [
      { p: "Free classes skip all of this: no payment, no fee and nothing to release. See [Free classes](/help/free-classes)." },
      { p: "This article describes **Protected** payments, the default. With **Direct** payments learners pay your own Stripe account and nothing is held. See [Protected or Direct payments](/help/payment-modes)." },
      { p: "Learners pay by card when they register. With the default **On delivery** release policy, your share is **held** until the class has been delivered, then released to your Stripe account. This protects learners and is what lets you promise refunds if a class is cancelled." },
      { table: { head: ["Total", "Meaning"], rows: [
        ["Held", "Your net from paid orders whose class hasn't been released yet"],
        ["Released (this month)", "What was released to you this calendar month"],
        ["Platform fees", "Fees on paid orders (free tickets never carry a fee)"],
        ["Refunded", "Money returned to learners"],
      ] } },
      { p: "Release happens automatically after the grace period (24 hours after the last session by default). You can release a delivered class sooner with **Release** on Home or in **Money → Orders**." },
      { tip: "Change the release policy and grace period in **Money → Settings → Release policy → Edit**." },
    ],
    related: ["payment-modes", "refunds", "payouts", "currencies"],
  },
  {
    slug: "payment-modes",
    section: "money",
    title: "Protected or Direct payments",
    summary: "Hold learners' money until delivery, or have it paid straight to your own Stripe account.",
    for: ["Owners & admins", "Finance"],
    body: [
      { table: { head: ["", "Protected", "Direct"], rows: [
        ["Who takes the payment", "EnrollClass, on your behalf", "Your own Stripe account"],
        ["When you get the money", "After the class is delivered (release policy)", "Stripe's payout schedule, before the class"],
        ["EnrollClass fee per paid seat", "4.9% + $0.80, card processing included", "1.5% + $0.50, plus Stripe's card fee billed by Stripe"],
        ["Refunds and disputes", "Handled from held funds; EnrollClass carries disputes", "From your Stripe balance; you handle disputes in Stripe"],
        ["Learner promise", "Refund guaranteed if a class is cancelled", "Your own refund policy"],
      ] } },
      { h: "Switch modes" },
      { steps: ["Open **Money → Settings**.", "Under **How you get paid**, click **Switch to Direct** (or **Switch to Protected**).", "Connect the Stripe account for that mode. Direct uses your own Stripe account with the full Stripe dashboard; Protected uses an Express account that EnrollClass pays out to."] },
      { p: "Switching only affects new payments. Money already held keeps its release date and is paid to the Protected account; Direct payments already taken stay in your Stripe account." },
      { tip: "Free classes cost nothing in either mode. You can also pass the fee on to learners so you keep the full ticket price." },
      { p: "Corporate invoices are collected by EnrollClass in both modes and paid out to you when the invoice is settled." },
    ],
    related: ["how-payments-work", "connect-stripe", "refunds"],
  },
  {
    slug: "fees-and-extras",
    section: "money",
    title: "Fees, booking fee and optional extras",
    summary: "Who pays the fee, get paid now, flexible tickets, Find a class and currency conversion.",
    for: ["Owners & admins", "Finance"],
    body: [
      { p: "Settings for all of these are in **Money → Settings → Fees and extras**." },
      { h: "Booking fee" },
      { p: "New accounts start with **learners paying the EnrollClass fee** as a booking fee at checkout, so you keep the full ticket price. Choose **You** to show one all-in price and take the fee out of your share." },
      { h: "Get paid now (Protected payments)" },
      { p: "Once you've delivered a first class through EnrollClass, a class's held money can be paid out before the class: open the class in **Events** and click **Get paid now**. The fee is 2% (at least $0.50), shown before you confirm. If a class paid out early is cancelled or learners cancel, refunds are taken back from your Stripe balance." },
      { h: "Flexible tickets" },
      { p: "Turn on **Offer flexible tickets** and learners see an option at checkout: 8% more for a full refund if they cancel up to 24 hours before the start, whatever your normal policy says. You keep 75% of the upgrade; the upgrade itself isn't refunded, and the cancelled seat goes back on sale." },
      { h: "Find a class" },
      { p: "Your upcoming classes are listed at enrollclass.com/classes. Bookings that start there carry a 5% referral fee; bookings from your own website, emails and links never do. Untick **List my classes in Find a class** to leave it." },
      { h: "Other currencies" },
      { p: "When a learner pays in a currency you've enabled but not priced, the price is converted at your stored rate and the learner pays a 1.5% conversion fee. Set a price for that currency on the ticket to avoid it." },
    ],
    related: ["how-payments-work", "payment-modes", "currencies"],
  },
  {
    slug: "refunds",
    section: "money",
    title: "Refund an order",
    summary: "Full refunds from Money, and what learners can do themselves.",
    for: ["Owners & admins", "Finance"],
    body: [
      { steps: ["Open **Money → Orders**.", "Click **⋯** on the order.", "Click **Refund in full**."] },
      { p: "Learners can also cancel themselves from the link in their confirmation email, within your policy. The defaults are: full refund until 14 days before the start, 50% until 7 days before, no refund within 7 days." },
      { tip: "Cancelling a whole class (from the class page) refunds or moves everyone at once." },
    ],
    related: ["learner-change-or-cancel"],
  },
  {
    slug: "corporate-invoices",
    section: "money",
    title: "Invoice a company",
    summary: "Book seats for a company on an invoice, send a pay link, reminders and recording bank transfers.",
    for: ["Owners & admins", "Finance"],
    body: [
      { steps: [
        "Open **Money → Invoices** and click **Add a company**: name, billing email, country and payment terms (net 30 by default).",
        "Open the class in **Events** and use **Invoice a company**: pick the company, the ticket and the number of seats. Attendee emails are optional; unnamed seats are held under the billing contact.",
        "EnrollClass emails the invoice to the billing contact with a secure link to pay by card.",
      ] },
      { list: [
        "**Reminders** go out automatically 3 days before the due date, on the day, and 7, 14 and 30 days late, until the invoice is paid or voided.",
        "**Bank transfer, wire, ACH or cheque**: record it under **Record payment** on the invoice. Part payments are fine.",
        "**Copy pay link** gives you the same card payment link to send yourself.",
        "**Void** cancels an unpaid invoice and puts its seats back on sale.",
      ] },
      { p: "Corporate invoices are collected by EnrollClass in both payment modes and paid out to you once the invoice is settled, with the same fees as a card booking." },
    ],
    related: ["how-payments-work", "payouts"],
  },
  {
    slug: "payouts",
    section: "money",
    title: "Payouts, instructor pay and revenue",
    summary: "Record payouts, pay instructors per class, and read the revenue report.",
    for: ["Owners & admins", "Finance"],
    body: [
      { list: [
        "**Money → Payouts** lists what each party is owed and lets you record payouts you made by bank transfer, wire or cheque.",
        "**Instructor pay**: on the full class page (Events → Edit), set a flat fee per instructor. It's paid from your share when the class is delivered and shows in payables.",
        "**Money → Revenue** shows recognized and deferred revenue for a date range, per class, with fees, tax, instructor pay and margin.",
      ] },
    ],
  },
  {
    slug: "currencies",
    section: "money",
    title: "Prices in several currencies",
    summary: "Let learners pay in their own currency, with explicit or converted prices.",
    for: ["Owners & admins"],
    body: [
      { steps: ["Open **Money → Settings → Currencies → Edit**.", "Add the extra currencies learners may pay in (for example CAD, EUR, GBP).", "Turn on **Convert the base price** for currencies without an explicit price, and choose the rounding.", "Click **Fetch today's ECB rates** or type rates yourself."] },
      { p: "A ticket uses its explicit price in a currency when you set one; otherwise the converted price. Learners see which prices are converted and pay in the currency they chose." },
    ],
  },

  // ---------------------------------------------------------------- team
  {
    slug: "roles",
    section: "team",
    title: "Roles: owner, admin, instructor, finance",
    summary: "What each role can see and do.",
    for: ["Owners & admins"],
    body: [
      { table: { head: ["Role", "Can"], rows: [
        ["Owner", "Everything, including other owners"],
        ["Admin", "Team, settings, classes and money"],
        ["Instructor", "Courses, classes, imports, check-in and certificates — no money, team or settings"],
        ["Finance", "Orders, payouts, refunds and reports — no class changes"],
      ] } },
      { h: "Invite someone" },
      { steps: ["Open **Team**.", "Type their email, pick the role chip and click **Invite**.", "They get an email and sign in with Google, Microsoft, LinkedIn or a link to that address. Invitations last 14 days."] },
      { p: "Change a role or remove someone with **⋯** on their row. An organization always keeps at least one owner." },
    ],
    related: ["instructor-access"],
  },
  {
    slug: "instructor-access",
    section: "team",
    title: "Instructor view and control",
    summary: "Limit instructors to their own classes and approve the classes they create.",
    for: ["Owners & admins"],
    body: [
      { p: "In **Team → Instructor access**:" },
      { list: [
        "**Instructors see — Only the classes they teach** (default): their Home, Events, attendees and check-in only show classes they're assigned to. **All classes** lets them cover for each other.",
        "**Classes an instructor creates — Go live right away** (default) or **Wait for approval**: their new classes stay drafts, not on sale, until an owner or admin publishes them.",
      ] },
      { p: "Drafts waiting for approval appear on owners' and admins' Home as **Approve · <class>**. Open it and click **Publish**." },
      { p: "Choose who teaches a class in the wizard (**Taught by**) or later from the pencil next to **Taught by** on the Events screen." },
    ],
    related: ["instructor-guide", "roles"],
  },
  {
    slug: "instructor-guide",
    section: "team",
    title: "Guide for instructors",
    summary: "What you see as an instructor and how to run your classes.",
    for: ["Instructors"],
    body: [
      { list: [
        "**Home** shows your class running today (with **Open check-in**) and your classes this week.",
        "**Events** lists the classes you teach (or all, if your organization allows it).",
        "**+ Create event** creates a class with you as the instructor. If your organization asks for approval, it's saved as a draft and goes live when an owner or admin publishes it.",
        "On class day, use [check-in](/help/check-in), then [issue certificates](/help/certificates).",
      ] },
      { tip: "Instructors don't see money, payouts or team settings. Ask an owner or admin for those." },
    ],
  },

  // ---------------------------------------------------------------- integrations
  {
    slug: "api-keys",
    section: "integrations",
    title: "API keys",
    summary: "Give each tool its own key, full or read-only, and revoke it any time.",
    for: ["Owners & admins", "Developers"],
    body: [
      { steps: ["Open **Team → Integrations**.", "Under **API keys**, name the key after where you'll use it (Zapier, Claude, Reports…) and choose **Full** or **Read only**.", "Click **Create key** and copy it right away. It's shown once and stored only as a fingerprint."] },
      { p: "Send the key as `Authorization: Bearer eck_…` (or `x-api-key`). Keys act as an admin but can't create keys or webhooks. Read-only keys can't change anything. **Revoke** stops a key immediately." },
      { p: "Every endpoint is documented at [api.enrollclass.com/docs](https://api.enrollclass.com/docs)." },
    ],
    related: ["webhooks", "mcp"],
  },
  {
    slug: "webhooks",
    section: "integrations",
    title: "Webhooks",
    summary: "Get a signed message at your URL when things happen.",
    for: ["Owners & admins", "Developers"],
    body: [
      { steps: ["Open **Team → Integrations → Webhooks**.", "Paste the URL from Zapier, Make, n8n or your own server (https).", "Tick the events to send and click **Add webhook**.", "Click **Send test** to check it's reachable."] },
      { h: "Events" },
      { p: "`order.paid`, `order.refunded`, `seat.cancelled`, `seat.transferred`, `seat.substituted`, `checkin.created`, `event.created`, `event.published`, `cohort.at_risk`, `cohort.cancelled`, `certificate.issued`, `waitlist.offered`." },
      { h: "Message and signature" },
      { code: 'POST https://your-url\nEnrollClass-Event: order.paid\nEnrollClass-Signature: t=1792519272,v1=<hex>\n\n{ "id": "whd_…", "type": "order.paid", "createdAt": "…", "organizationId": "org_…", "data": { "order": { … }, "event": { … }, "seats": [ … ] } }' },
      { p: "To verify, compute HMAC-SHA256 of `<t>.<raw body>` with the webhook's signing secret (shown under **Signing secret and recent deliveries**) and compare with `v1`. Reject timestamps older than 5 minutes." },
      { code: 'import crypto from "node:crypto";\nconst [t, v1] = header.split(",").map((p) => p.split("=")[1]);\nconst expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");\nconst ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));' },
      { tip: "Failed deliveries are retried after 10 seconds, 1 minute and 5 minutes. Recent deliveries and errors are listed under each webhook; **Pause** stops sending without deleting it." },
    ],
    related: ["zapier-make-n8n", "webhook-failing"],
  },
  {
    slug: "zapier-make-n8n",
    section: "integrations",
    title: "Zapier, Make and n8n recipes",
    summary: "Automate spreadsheets, CRMs, Slack and badges without code.",
    for: ["Owners & admins"],
    body: [
      { h: "Zapier" },
      { steps: ["Create a Zap with trigger **Webhooks by Zapier → Catch Hook** and copy its URL.", "Add it in **Team → Integrations → Webhooks** with the events you want (for example **Order paid**).", "Click **Send test**, then continue in Zapier (for example add a row to Google Sheets).", "To change things in EnrollClass, use **Webhooks by Zapier → Custom Request** with header `Authorization: Bearer <your key>`."] },
      { h: "Make" },
      { p: "Trigger **Webhooks → Custom webhook**; paste its address as an EnrollClass webhook. Actions: **HTTP → Make a request** with the same Authorization header." },
      { h: "n8n" },
      { p: "Trigger: the **Webhook** node (use its production URL). Actions: **HTTP Request** with Header Auth `Authorization: Bearer <your key>`." },
      { h: "Ideas" },
      { list: ["Order paid → add the learner to your CRM or mailing list.", "Check-in → post in a Slack channel.", "Certificate issued → issue the Credly or Accredible badge.", "Class below minimum → notify the instructor."] },
    ],
    related: ["webhooks", "api-keys"],
  },
  {
    slug: "mcp",
    section: "integrations",
    title: "Connect an AI assistant (MCP)",
    summary: "Let Claude and other assistants answer questions and run tasks in EnrollClass.",
    for: ["Owners & admins", "Developers"],
    body: [
      { p: "EnrollClass runs an MCP server at `https://api.enrollclass.com/mcp`. Connected with an API key, an assistant can read Today, check fill rates, look at a class, duplicate classes, publish drafts, check people in and issue certificates. Money moves (refunds) come back as proposals for you to approve." },
      { steps: ["Create an API key in **Team → Integrations** (read-only if you only want questions answered).", "Add the server to your assistant (below), replacing YOUR_KEY.", "Ask things like *How full are next week's classes?* or *Duplicate the RTE class to every Monday in December*."] },
      { h: "Claude Code" },
      { code: 'claude mcp add --transport http enrollclass https://api.enrollclass.com/mcp --header "Authorization: Bearer YOUR_KEY"' },
      { h: "Claude Desktop, Cursor and others" },
      { code: '{\n  "mcpServers": {\n    "enrollclass": {\n      "command": "npx",\n      "args": ["-y", "mcp-remote", "https://api.enrollclass.com/mcp", "--header", "Authorization: Bearer YOUR_KEY"]\n    }\n  }\n}' },
      { tip: "The assistant has exactly the access of its key; revoke the key to disconnect it." },
    ],
    related: ["api-keys"],
  },

  // ---------------------------------------------------------------- learners
  {
    slug: "tickets",
    section: "learners",
    title: "Your ticket and calendar invitation",
    summary: "Where to find your ticket, QR code and calendar entry.",
    for: ["Learners"],
    body: [
      { p: "After you register you get a confirmation email with your ticket (QR code and a code like `EC-7K2M-94QX`), a calendar invitation for every session, and a link to manage your booking." },
      { list: ["Show the QR code (on your phone or printed) at the door, or tell the organizer your code.", "Use **Change attendee, move date or cancel** in the email to see your booking and change it.", "Online classes: the join link arrives before the session and is in the calendar entry."] },
    ],
    related: ["learner-change-or-cancel"],
  },
  {
    slug: "learner-change-or-cancel",
    section: "learners",
    title: "Change attendee, move to another date or cancel",
    summary: "What you can do yourself from the link in your confirmation email.",
    for: ["Learners"],
    body: [
      { p: "Open **Change attendee, move date or cancel** in your confirmation email. Depending on the organizer's policy you can:" },
      { list: [
        "**Send someone else**: change the attendee's name and email (usually until 24 hours before the start).",
        "**Move to another date** of the same course: free until 7 days before, then a fee may apply.",
        "**Cancel**: a full refund until 14 days before, 50% until 7 days before, no refund within 7 days (unless the organizer set other terms).",
      ] },
      { p: "Your payment is held by EnrollClass until the course is delivered, so if the organizer cancels a class you are refunded or moved to another date." },
    ],
  },
  {
    slug: "learner-certificate",
    section: "learners",
    title: "Your certificate and badge",
    summary: "Download the PDF, add it to LinkedIn and claim your badge.",
    for: ["Learners"],
    body: [
      { p: "When the organizer issues certificates you get an email with your link. On the certificate page:" },
      { list: ["**Download PDF** saves a one-page certificate.", "**Add to LinkedIn** fills in the certification on your profile.", "**Download your verified badge** saves the badge image with its signed credential inside. Upload it to LinkedIn or any Open Badges wallet; anyone can check it at [/verify](/verify).", "**Claim your badge** opens the badge platform (Credly, Accredible…) when the course uses one instead.", "Anyone with the link can verify the certificate."] },
    ],
  },

  // ---------------------------------------------------------------- troubleshooting
  {
    slug: "sign-in-email",
    section: "trouble",
    title: "I didn't get the sign-in email",
    summary: "What to check when the sign-in link doesn't arrive or doesn't work.",
    for: ["Owners & admins", "Instructors", "Finance"],
    body: [
      { list: ["Check spam and promotions folders for a message from EnrollClass.", "Each link works once and for 20 minutes. Request a new one if it expired.", "Make sure you used the same address you were invited with.", "Signing in with Google or Microsoft avoids email entirely when your address is on those accounts."] },
    ],
  },
  {
    slug: "stripe-not-ready",
    section: "trouble",
    title: "Stripe still says setup isn't finished",
    summary: "Why Home keeps showing Finish your Stripe setup.",
    for: ["Owners & admins"],
    body: [
      { list: ["Click **Continue** on Home: Stripe reopens on the missing step (often identity verification or a bank account).", "Approval can take a few minutes after you finish. Reload Home; it checks with Stripe each time.", "If Stripe asks for documents, upload them in Stripe; Home updates once Stripe enables payouts."] },
    ],
  },
  {
    slug: "webhook-failing",
    section: "trouble",
    title: "My webhook deliveries fail",
    summary: "Read the delivery log and fix the usual causes.",
    for: ["Owners & admins", "Developers"],
    body: [
      { list: ["Open **Signing secret and recent deliveries** under the webhook to see the status code or error.", "The URL must be public and use https.", "Your receiver must answer with a 2xx status within 10 seconds; do slow work after answering.", "Zapier and Make URLs stop working if you delete or turn off the Zap or scenario."] },
    ],
  },
  {
    slug: "not-found-or-forbidden",
    section: "trouble",
    title: "\"Not found\" or \"your role does not allow this\"",
    summary: "Messages you see when a page or class is outside your access.",
    for: ["Instructors", "Finance"],
    body: [
      { list: ["Instructors limited to their own classes see **not found** for other classes. Ask an owner or admin to assign you or to allow all classes.", "**Your role does not allow this** means the action needs another role (for example money actions need Finance, Admin or Owner).", "If a class you created doesn't appear on the public page, it may be a draft waiting for approval."] },
    ],
    related: ["roles", "instructor-access"],
  },
];

export const helpBySlug = (slug: string) => HELP.find((a) => a.slug === slug);

/** Plain text of an article, for search. */
export function helpText(a: HelpArticle): string {
  const parts: string[] = [a.title, a.summary];
  for (const b of a.body) {
    if ("h" in b) parts.push(b.h);
    else if ("p" in b) parts.push(b.p);
    else if ("tip" in b) parts.push(b.tip);
    else if ("steps" in b) parts.push(...b.steps);
    else if ("list" in b) parts.push(...b.list);
    else if ("table" in b) parts.push(...b.table.rows.flat());
  }
  return parts.join(" ").replace(/\*\*|`|\[|\]\([^)]*\)/g, "");
}

/** An article as Markdown, for /llms-full.txt and AI assistants. Relative links become absolute. */
export function helpMarkdown(a: HelpArticle, origin: string): string {
  const abs = (t: string) => t.replace(/\]\((\/[^)]*)\)/g, (_m, p: string) => `](${origin}${p})`);
  const out: string[] = [`## ${a.title}`, "", `${a.summary} (For: ${a.for.join(", ")}.) Source: ${origin}/help/${a.slug}`, ""];
  for (const b of a.body) {
    if ("h" in b) out.push(`### ${b.h}`, "");
    else if ("p" in b) out.push(abs(b.p), "");
    else if ("tip" in b) out.push(`Tip: ${abs(b.tip)}`, "");
    else if ("steps" in b) out.push(...b.steps.map((x, i) => `${i + 1}. ${abs(x)}`), "");
    else if ("list" in b) out.push(...b.list.map((x) => `- ${abs(x)}`), "");
    else if ("code" in b) out.push("```", b.code, "```", "");
    else if ("table" in b) out.push(`| ${b.table.head.join(" | ")} |`, `| ${b.table.head.map(() => "---").join(" | ")} |`, ...b.table.rows.map((r) => `| ${r.map(abs).join(" | ")} |`), "");
  }
  return out.join("\n");
}
