// Frequently asked questions, shown on /faq, embedded as schema.org FAQPage for search
// engines, and included in /llms-full.txt for AI assistants. Plain text answers (no markup)
// so the same strings work everywhere; `link` points to the full help article.

export type Faq = { q: string; a: string; link?: string };

export const FAQ_GROUPS: Array<{ title: string; items: Faq[] }> = [
  {
    title: "About EnrollClass",
    items: [
      { q: "What is EnrollClass?", a: "EnrollClass is a registration and payments platform for professional training providers and independent instructors. You publish classes (cohorts) and learners register and pay by card or invoice. Payments are either held until the class is delivered and then released to you (Protected), or paid straight to your own Stripe account (Direct)." },
      { q: "Who is it for?", a: "Training companies with several instructors, and independent instructors who run live virtual, in-person or hybrid courses such as certification classes (SAFe, Scrum, PMP and similar), workshops and bootcamps." },
      { q: "Which countries does it work in?", a: "EnrollClass focuses on North America and Europe to start. Learners can pay in several currencies, and you are paid through Stripe in the countries Stripe supports for your business." },
      { q: "How much does it cost?", a: "Signing up, creating courses and publishing classes cost nothing, and free classes are always free. On paid seats you pay one fee per seat and nothing monthly: 4.9% + $0.80 with Protected payments (card processing included, money held until delivery), or 1.5% + $0.50 plus Stripe's card fee with Direct payments to your own Stripe account. The home page compares this with other platforms.", link: "/#pricing" },
      { q: "Are there any other fees?", a: "Only optional ones: 2% to get held Protected payments before the class (once you've delivered a first class), flexible tickets (learners add 8% for a full refund until 24 hours before; you keep 75%), verified badges at $1 per paid seat, a 5% referral fee on bookings that come through enrollclass.com/classes (never on your own links), and a 1.5% conversion fee paid by learners who pay in a currency you haven't priced. No setup or monthly fees.", link: "/help/fees-and-extras" },
      { q: "What is the difference between Protected and Direct payments?", a: "Protected: EnrollClass takes the learner's payment, holds it until the class is delivered and then pays you; learners get a refund guarantee and EnrollClass handles card fees and disputes. Direct: learners pay your own Stripe account, the money reaches you on Stripe's schedule before the class, you pay Stripe's card fee and handle refunds and disputes, and the EnrollClass fee is lower. Switch any time in Money, Settings; only new payments change.", link: "/help/payment-modes" },
      { q: "Do you charge anything for free classes?", a: "No. When a ticket's price is 0 there is no EnrollClass fee, no card fee and no payment step: learners register and get their ticket, calendar invitation, reminders and certificate as usual. You don't even need to connect Stripe if all your classes are free.", link: "/help/free-classes" },
    ],
  },
  {
    title: "Classes and registration",
    items: [
      { q: "How do I publish my first class?", a: "Sign up, connect Stripe (only needed for paid classes), then click Create event: pick or create a course, set the dates, ticket price and seats, and publish. You get a public course page link and a code to embed registration on your own website.", link: "/help/quick-start" },
      { q: "Can I copy a class to new dates?", a: "Yes. Duplicate copies a class with its tickets, prices, minimum and instructors to the same dates, a new first day, or a weekly, every-two-weeks or monthly series of up to 12 classes.", link: "/help/duplicate-a-class" },
      { q: "Can learners register from my own website?", a: "Yes. Paste the embed code shown after publishing into any web page (WordPress, Squarespace, Webflow or plain HTML). It shows your dates and takes registration and payment on your page.", link: "/help/share-and-embed" },
      { q: "Can I import my events from Eventbrite?", a: "Yes. Paste an Eventbrite private token (used once, never stored) or upload a spreadsheet. You see a preview before anything is created, and Eventbrite images become course covers.", link: "/help/import" },
      { q: "Do learners get tickets and calendar invitations?", a: "Every learner receives a confirmation with a QR ticket, a calendar invitation for every session, reminders, pre-work and joining instructions, and a link to change or cancel their booking.", link: "/help/course-emails" },
      { q: "How does check-in work?", a: "Open check-in from Home or Events. Scan ticket QR codes with a phone, type the code printed on the ticket, or tap a person's card. Several doors can check people in at once.", link: "/help/check-in" },
      { q: "Can I issue certificates and digital badges?", a: "Yes. Issue attendance or completion certificates from the Events screen; learners can download a PDF, add it to LinkedIn and verify it online. Every certificate can come with an EnrollClass verified badge (Open Badges 3.0) that learners download and anyone can verify, with no Credly or other subscription. You can also link a Credly, Accredible, Badgr or Certopus badge.", link: "/help/certificates" },
      { q: "What are EnrollClass verified badges and what do they cost?", a: "A digital badge issued with each certificate, in the Open Badges 3.0 standard used by Credly and others. The badge image carries a signed credential, so learners can share it on LinkedIn, keep it in any badge wallet and anyone can check it at enrollclass.com/verify. Design one in the badge designer or upload your own image. It costs $1 per paid seat on courses that issue it, collected with the seat fee; free classes stay free.", link: "/help/badges" },
      { q: "Can I move my badges from Credly or Accredible?", a: "Yes. Events, Badges shows every course's badge; Move copies each badge's name and image to an EnrollClass verified badge in one click, and Award gives it to learners who already have a certificate, by email. Badges already issued on the other platform stay valid there.", link: "/help/badges" },
    ],
  },
  {
    title: "Payments and refunds",
    items: [
      { q: "When do I get paid?", a: "With Direct payments, on Stripe's normal payout schedule, before the class. With Protected payments and the default On delivery policy, your share is held until the class has been delivered and released 24 hours after the last session (you can change the grace period or release sooner), then paid out by Stripe to your bank account.", link: "/help/how-payments-work" },
      { q: "Why is the money held until delivery?", a: "Holding payments protects learners: if a class is cancelled they are refunded or moved to another date. That guarantee helps learners book with confidence, especially for expensive courses." },
      { q: "Which payment methods can learners use?", a: "Cards through Stripe, and corporate invoices for companies that pay by bank transfer, wire or cheque." },
      { q: "Can learners pay in their own currency?", a: "Yes. Add the currencies you accept; tickets use an explicit price in that currency or a converted price at stored exchange rates, and learners pay in the currency they choose.", link: "/help/currencies" },
      { q: "What is the refund policy?", a: "By default learners get a full refund until 14 days before the start, 50% until 7 days before, and no refund within 7 days. They can move to another date for free until 7 days before. Organizers can refund any order in full from Money.", link: "/help/learner-change-or-cancel" },
    ],
  },
  {
    title: "Teams and instructors",
    items: [
      { q: "Can several instructors and staff work in one account?", a: "Yes. Invite people as Owner, Admin, Instructor or Finance. Instructors manage classes and check-in but never see money; Finance sees orders, payouts and reports but can't change classes.", link: "/help/roles" },
      { q: "Can I limit instructors to their own classes?", a: "Yes, that is the default. You can also require approval: classes an instructor creates stay drafts until an owner or admin publishes them.", link: "/help/instructor-access" },
    ],
  },
  {
    title: "Integrations and AI",
    items: [
      { q: "Does EnrollClass work with Zapier, Make or n8n?", a: "Yes. Signed webhooks notify Zapier, Make, n8n or your own server when orders are paid, people check in, certificates are issued and more, and the REST API lets those tools act in EnrollClass with an API key.", link: "/help/zapier-make-n8n" },
      { q: "Can I use EnrollClass from Claude or another AI assistant?", a: "Yes. EnrollClass runs an MCP server at https://api.enrollclass.com/mcp. Connect it with an API key and ask questions like how full next week's classes are, or ask it to duplicate a class or issue certificates.", link: "/help/mcp" },
      { q: "Can AI assistants and search engines read my class dates and prices?", a: "Yes. Every public course page includes schema.org EducationEvent data with dates, prices, availability and the organizer, and EnrollClass publishes a sitemap and llms.txt so crawlers and assistants can find upcoming classes." },
    ],
  },
  {
    title: "For learners",
    items: [
      { q: "I can't find my ticket. What do I do?", a: "Search your inbox for the confirmation from EnrollClass or your training provider. It contains your QR ticket, calendar invitation and a link to change or cancel. You can also give the code printed under the QR at the door.", link: "/help/tickets" },
      { q: "Can someone else attend in my place?", a: "Usually yes, until 24 hours before the start: use the link in your confirmation email to change the attendee's name and email.", link: "/help/learner-change-or-cancel" },
      { q: "Where is my certificate?", a: "When your training provider issues certificates you receive an email with a link where you can download the PDF, add it to LinkedIn and claim any digital badge.", link: "/help/learner-certificate" },
    ],
  },
];

export const ALL_FAQ: Faq[] = FAQ_GROUPS.flatMap((g) => g.items);
