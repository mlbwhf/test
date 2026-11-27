# Responsive search ads for the new ad groups (DRAFT for your approval)

18 ads, one per new ad group: 337 strings in total. **Nothing is uploaded.** Phase 1:
you import them. Stages 1-4 are approved (stage 4, APM, Business Owner and Architects, on 25 Nov;
import it with stage 2 on 1 Dec). The 3 **Innovation** ads are drafted but held until those courses
can be booked and paid for on agile-agilist.com, so they have no import file yet.

**Validated:** every string passes `src/asset_generator.py` for **US and Canada** audiences, both
during Black Friday and after it ends (15 Dec). That covers character limits, "SAFe Platinum
Partner" (never Gold), "exam prep and support" (no pass guarantee or money-back), no prices at all
(so no CAD for US), no scarcity claims, and approved stable landing pages only.

**Evergreen on purpose:** no offer wording. (The Black Friday sale ended early on 27 Nov, so no
offer copy may be added.)

**Built on what each course actually teaches** (full English course pages, read 20 Nov), plus
one claim you confirmed in chat: one-day **PI Outcome Planning** in Launching AI-Native ARTs.
**Left out on purpose:** ratings, graduate counts, employer logos, unsourced statistics, the
pages' refund wording, and any detail the site contradicts (delivery format for AI-Native
Foundations and the executive course; prerequisites for RTE and ASM; "SPCT-led" except SPC).
Site fixes for the web team are in `proposals/2026-11_site-fixes.md`.

## Import with the keywords, stage by stage
Import the ad file **first**, then the keyword file for the same stage, in Google Ads Editor
(*Account → Import → From file → review → Post*). An ad group with keywords but no ad doesn't
serve. If an ad group already has an ad you like, delete its row from the CSV before importing.

| Stage | When | Ads | File |
|---|---|---|---|
| 1 | Now (20 Nov, Black Friday) | 4 | `proposals/2026-11_rsa_stage1_google-ads-editor.csv` |
| 2 | 1 Dec (February ramp) | 5 | `proposals/2026-11_rsa_stage2_google-ads-editor.csv` |
| 3 | Not before 4 Dec, after stage 1 has run 14 days | 3 | `proposals/2026-11_rsa_stage3_google-ads-editor.csv` |
| 4 | 1 Dec, with stage 2 (approved 25 Nov) | 3 | `proposals/2026-11_rsa_stage4_google-ads-editor.csv` |

**No pinning.** Google needs freedom to mix headlines for good Ad Strength; the course name already
appears in several headlines. **Google only:** add any Microsoft versions by hand, because an
import from Google can overwrite your tracking suffixes.

**Judged on website Stripe payments only**, like the keywords. Give each ad 14 days, then compare
on the agent's Stripe numbers, not on clicks or "Conversions".

## The ads
### AI-Native Foundations · stage 1
Campaign **AI-Native - Face-to-Face** · Final URL https://agile-agilist.com/training/ai-native/ai-native-foundations/ · Display path `/AI-Native/Foundations`  
*Facts used:* 2 days, prompt engineering, daily workflows, ethics, tool selection, 30-day plan, guardrails, exam, 1:1 career coaching. Delivery format left out: the site says both online-only and in-person.

| # | Headline | Chars |
|---|---|---|
| 1 | AI-Native Foundations | 21 |
| 2 | AI-Native Foundations Cert | 26 |
| 3 | AI Native Certification | 23 |
| 4 | Become AI-Fluent in 2 Days | 26 |
| 5 | Master Prompt Engineering | 25 |
| 6 | Build Daily AI Workflows | 24 |
| 7 | Practical AI Guardrails | 23 |
| 8 | Your 30-Day AI Habit Plan | 25 |
| 9 | 1:1 Career Coaching Included | 28 |
| 10 | Pick the Right AI Tools | 23 |
| 11 | Start Your AI-Native Path | 25 |
| 12 | Upskill in AI for Your Career | 29 |
| 13 | Exam Included | 13 |
| 14 | Exam Prep and Support | 21 |
| 15 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Become AI-fluent in two days: prompt engineering, daily AI workflows, ethics and tools. | 87 |
| 2 | Practical guardrails for confidentiality, bias, hallucination and IP at work. | 77 |
| 3 | Exam included, plus a 1:1 career-coaching session and exam prep and support. | 76 |
| 4 | The first step on the AI-Native path and the prerequisite for Value Architect. | 78 |

### AI-Native SAFe Fundamentals · stage 1
Campaign **AI-Native - Virtual** · Final URL https://agile-agilist.com/training/ai-native/ai-native-ready-certification/ · Display path `/AI-Native/Fundamentals`  
*Facts used:* One day, no prerequisites, core concepts + shared language + operating model, AI Innovation Pipeline (experiment to value), exam, for leaders who need a common language for AI.

| # | Headline | Chars |
|---|---|---|
| 1 | AI-Native SAFe Fundamentals | 27 |
| 2 | SAFe AI-Native Course | 21 |
| 3 | AI-Native SAFe in One Day | 25 |
| 4 | One-Day AI-Native Course | 24 |
| 5 | No Prerequisites | 16 |
| 6 | AI Innovation Pipeline | 22 |
| 7 | Shared Language for AI + SAFe | 29 |
| 8 | From AI Experiment to Value | 27 |
| 9 | A Common AI Language | 20 |
| 10 | Start With AI-Native SAFe | 25 |
| 11 | Exam Included | 13 |
| 12 | Exam Prep and Support | 21 |
| 13 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | One day: AI-Native SAFe core concepts, shared language and the operating model. | 79 |
| 2 | Learn the AI Innovation Pipeline: how AI ideas move from experiment to value. | 77 |
| 3 | No prerequisites. Exam included, with exam prep and support. | 60 |
| 4 | For leaders who need a common language for AI. See upcoming dates and register. | 79 |

### AI-Native Value Architect · stage 1
Campaign **AI-Native - Virtual** · Final URL https://agile-agilist.com/training/ai-native/ai-native-change-agent/ · Display path `/AI-Native/Value-Architect`  
*Facts used:* Lead enterprise AI adoption: diagnose readiness, roadmap, habits, govern risk, measure change. 2 days live online, exam. AI-Native Foundations is a hard prerequisite.

| # | Headline | Chars |
|---|---|---|
| 1 | AI-Native Value Architect | 25 |
| 2 | Value Architect Certification | 29 |
| 3 | AI Change Agent Certification | 29 |
| 4 | Lead Enterprise AI Adoption | 27 |
| 5 | Build Your AI Roadmap | 21 |
| 6 | Diagnose AI Readiness | 21 |
| 7 | Govern AI Risk, Measure Change | 30 |
| 8 | Beyond Copilots: Scale AI | 25 |
| 9 | After AI-Native Foundations | 27 |
| 10 | 2 Days Live Online | 18 |
| 11 | Lead AI Change at Work | 22 |
| 12 | Exam Included | 13 |
| 13 | Exam Prep and Support | 21 |
| 14 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Lead enterprise AI adoption: diagnose readiness, build the roadmap and govern risk. | 83 |
| 2 | Go beyond personal AI fluency to drive AI habits and measure sustained change. | 78 |
| 3 | Two days live online, exam included. AI-Native Foundations is required first. | 77 |
| 4 | Become the person who leads AI change at work. See upcoming dates and register. | 79 |

### Launching AI-Native ARTs · stage 1
Campaign **AI-Native - Virtual** · Final URL https://agile-agilist.com/training/ai-native/launching-ai-native-arts/ · Display path `/AI-Native/ART-Leader`  
*Facts used:* Page: 2 days live online, authorized SAFe instructor, SAFe ART Leader exam, 15 PDUs, no required prerequisites, 12 critical success factors, live launch-readiness assessment, launch plan, evolving roles; audience RTEs, PMs, System Architects. Owner-confirmed: PI Outcome Planning; classes every Monday and Thursday plus weekends twice a month.

⚠️ **Owner-confirmed, not on the course page yet:** PI Planning in one day / PI Outcome Planning (Mark, 2026-11-20). Only in the blog today; add it to the course page so the ad matches it. Schedule (Mark, 2026-11-24): classes start every Monday and Thursday, plus weekend classes twice a month. Keep the course calendar showing that, or remove the schedule lines from the ad.

| # | Headline | Chars |
|---|---|---|
| 1 | Launching AI-Native ARTs | 24 |
| 2 | SAFe ART Leader Certification | 29 |
| 3 | PI Planning in One Day | 22 |
| 4 | Learn PI Outcome Planning | 25 |
| 5 | From PI Objectives to Outcomes | 30 |
| 6 | 12 AI-Native Success Factors | 28 |
| 7 | ART Launch Readiness Check | 26 |
| 8 | Leave With an ART Launch Plan | 29 |
| 9 | For RTEs, PMs & Architects | 26 |
| 10 | Starts Every Monday & Thursday | 30 |
| 11 | Weekend Classes Twice a Month | 29 |
| 12 | 2 Days Live Online, 15 PDUs | 27 |
| 13 | Exam Prep and Support | 21 |
| 14 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | PI Planning becomes one-day PI Outcome Planning. Learn to run it for an AI-Native ART. | 86 |
| 2 | Assess your ART's launch readiness live in class and leave with a plan for Monday. | 82 |
| 3 | Two days live online, exam included. New classes start every Monday and Thursday. | 81 |
| 4 | For RTEs, PMs and System Architects. Weekend classes twice a month, no prerequisites. | 85 |

### Leading the AI-Native Organization · stage 3
Campaign **AI-Native - Virtual** · Final URL https://agile-agilist.com/training/ai-native/ai-native-ready-certification-2/ · Display path `/AI-Native/Leaders`  
*Facts used:* 2-day executive cohort capped at 12 (CEOs, COOs, CTOs, CAIOs), 6 months follow-up coaching, capital allocation, board oversight, talent, vision; 16 PDUs, no prerequisites, capstone. Format left out: the site says both online and in-person.

| # | Headline | Chars |
|---|---|---|
| 1 | Leading the AI-Native Org | 25 |
| 2 | AI Leadership for Executives | 28 |
| 3 | AI Strategy for Leaders | 23 |
| 4 | Executive AI Workshop | 21 |
| 5 | For CEOs, COOs, CTOs & CAIOs | 28 |
| 6 | Capped at 12 Senior Leaders | 27 |
| 7 | 6 Months of Follow-Up Coaching | 30 |
| 8 | Board Oversight of AI | 21 |
| 9 | Capital Allocation for AI | 25 |
| 10 | 2-Day Executive Cohort | 22 |
| 11 | Lead Your AI Transformation | 27 |
| 12 | Taught by an SPCT | 17 |
| 13 | 16 PDUs, No Prerequisites | 25 |
| 14 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | A 2-day executive cohort capped at 12 senior leaders, with 6 months of coaching. | 80 |
| 2 | Capital allocation for AI, board oversight, talent and communicating the vision. | 80 |
| 3 | For CEOs, COOs, CTOs and CAIOs setting AI direction. No prerequisites, 16 PDUs. | 79 |
| 4 | Training a leadership team? Ask about private classes on your dates. | 68 |

### RTE Training · stage 2
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/adv-safe/rte/ · Display path `/SAFe/RTE`  
*Facts used:* 3 days live virtual, 16 PDUs, exam; PI Planning, Inspect & Adapt, ROAM, Scrum of Scrums; SPC/ASPC instructor. Prerequisites and 'SPCT-led' left out: the page contradicts itself.

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe RTE Certification | 22 |
| 2 | Release Train Engineer Cert | 27 |
| 3 | SAFe Release Train Engineer | 27 |
| 4 | RTE Training, Live Virtual | 26 |
| 5 | 3-Day SAFe RTE Course | 21 |
| 6 | Facilitate PI Planning | 22 |
| 7 | Master Inspect & Adapt | 22 |
| 8 | Lead Your Agile Release Train | 29 |
| 9 | Advance Your Agile Career | 25 |
| 10 | 16 PDUs, Exam Included | 22 |
| 11 | Authorized SAFe Instructor | 26 |
| 12 | Exam Prep and Support | 21 |
| 13 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Coach the Agile Release Train: PI Planning, Inspect & Adapt, ROAM and Scrum of Scrums. | 86 |
| 2 | Three days, live virtual, with an authorized SAFe instructor. 16 PDUs, exam included. | 85 |
| 3 | Taught at a SAFe Platinum Partner, with exam prep and support for every learner. | 80 |
| 4 | Move into a Release Train Engineer role. See upcoming class dates and register. | 79 |

### SPC Certification · stage 2
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/adv-safe/spc/ · Display path `/SAFe/SPC`  
*Facts used:* Implementing SAFe; 4 days live virtual, led by SPCTs, 16 PDUs, exam; licensed to teach SAFe courses; included SAFe Studio year renews your SAFe certifications.

| # | Headline | Chars |
|---|---|---|
| 1 | SPC Certification | 17 |
| 2 | SAFe Practice Consultant | 24 |
| 3 | Implementing SAFe (SPC) | 23 |
| 4 | Become a Certified SPC | 22 |
| 5 | 4-Day Live Virtual SPC Class | 28 |
| 6 | Lead a SAFe Transformation | 26 |
| 7 | Teach & Coach SAFe | 18 |
| 8 | Renews Your SAFe Certs | 22 |
| 9 | Advance Your Agile Career | 25 |
| 10 | 16 PDUs, Exam Included | 22 |
| 11 | SPCT-Led Training | 17 |
| 12 | Exam Prep and Support | 21 |
| 13 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Implementing SAFe with SPC certification: lead a Lean-Agile transformation at scale. | 84 |
| 2 | Four days, live virtual, led by SPCTs. 16 PDUs, exam included. | 62 |
| 3 | Get licensed to teach SAFe courses. Your SAFe Studio year renews your SAFe certs. | 81 |
| 4 | Learn from a SAFe Platinum Partner, with exam prep and support. See class dates. | 80 |

### POPM · stage 2
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/safe/popm/ · Display path `/SAFe/POPM`  
*Facts used:* 2 days live virtual, 16 PDUs, exam; own the backlog, lead PI Planning, Lean UX, Design Thinking.

| # | Headline | Chars |
|---|---|---|
| 1 | POPM Certification | 18 |
| 2 | SAFe Product Owner/Manager | 26 |
| 3 | SAFe POPM Training | 18 |
| 4 | Product Owner Certification | 27 |
| 5 | Product Manager Certification | 29 |
| 6 | 2-Day Live Virtual POPM | 23 |
| 7 | Lead PI Planning as a PO/PM | 27 |
| 8 | Lean UX & Design Thinking | 25 |
| 9 | 16 PDUs, Exam Included | 22 |
| 10 | Advance Your Agile Career | 25 |
| 11 | Exam Prep and Support | 21 |
| 12 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Own the backlog, lead PI Planning and apply Lean UX and Design Thinking. | 72 |
| 2 | SAFe Product Owner / Product Manager certification. Two days, live virtual, 16 PDUs. | 84 |
| 3 | Exam included, with exam prep and support. Taught at a SAFe Platinum Partner. | 77 |
| 4 | Step up into a product role. See upcoming POPM class dates and register online. | 79 |

### Lean Portfolio Management · stage 3
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/adv-safe/lpm/ · Display path `/SAFe/LPM`  
*Facts used:* 2 days + optional workshop day, live virtual, 16 PDUs, exam; fund value streams not projects, Lean Budget Guardrails, Portfolio Kanban with WSJF, Value Management Office.

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe LPM Certification | 22 |
| 2 | Lean Portfolio Management | 25 |
| 3 | LPM Training, Live Virtual | 26 |
| 4 | Fund Value Streams | 18 |
| 5 | Lean Budget Guardrails | 22 |
| 6 | Portfolio Kanban With WSJF | 26 |
| 7 | Set Up a Value Mgmt Office | 26 |
| 8 | For Portfolio Leaders | 21 |
| 9 | 16 PDUs, Exam Included | 22 |
| 10 | Exam Prep and Support | 21 |
| 11 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Fund value streams instead of projects, with Lean Budget Guardrails and Portfolio Kanban. | 89 |
| 2 | Two days live virtual, plus an optional workshop day. 16 PDUs, exam included. | 77 |
| 3 | Taught at a SAFe Platinum Partner, with exam prep and support for every learner. | 80 |
| 4 | For portfolio, PMO and finance leaders. See upcoming class dates and register. | 78 |

### SAFe DevOps · stage 3
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/safe/devops/ · Display path `/SAFe/DevOps`  
*Facts used:* SAFe DevOps Practitioner; 3 days live virtual, 16 PDUs, exam; map the CDP with value stream mapping; separate deploy from release.

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe DevOps Certification | 25 |
| 2 | SAFe DevOps Practitioner | 24 |
| 3 | SAFe DevOps Training | 20 |
| 4 | 3-Day Live Virtual DevOps | 25 |
| 5 | Map Your Delivery Pipeline | 26 |
| 6 | Separate Deploy From Release | 28 |
| 7 | Value Stream Mapping for CDP | 28 |
| 8 | 16 PDUs, Exam Included | 22 |
| 9 | Advance Your Agile Career | 25 |
| 10 | Exam Prep and Support | 21 |
| 11 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Map your Continuous Delivery Pipeline from idea to production with value stream mapping. | 88 |
| 2 | Separate deploy from release. Three days, live virtual, 16 PDUs, exam included. | 79 |
| 3 | Taught at a SAFe Platinum Partner, with exam prep and support. | 62 |
| 4 | For engineers, operations and release roles. See class dates and register online. | 81 |

### ASPC (new course) · stage 2
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/adv-safe/aspc/ · Display path `/SAFe/ASPC`  
*Facts used:* 4 days live virtual, 16 PDUs, exam, requires a current SPC; teach the advanced courses; the only path to SPCT.

| # | Headline | Chars |
|---|---|---|
| 1 | ASPC Certification | 18 |
| 2 | Advanced SAFe (ASPC) | 20 |
| 3 | Adv. SAFe Practice Consultant | 29 |
| 4 | For Certified SPCs | 18 |
| 5 | 4-Day Live Virtual ASPC | 23 |
| 6 | The Next Step After SPC | 23 |
| 7 | The Only Path to SPCT | 21 |
| 8 | Teach Advanced SAFe Courses | 27 |
| 9 | Sustain SAFe Transformations | 28 |
| 10 | 16 PDUs, Exam Included | 22 |
| 11 | Exam Prep and Support | 21 |
| 12 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Advanced SAFe Practice Consultant: the next step for SPCs leading change at scale. | 82 |
| 2 | Four days, live virtual, 16 PDUs, exam included. Requires a current SPC. | 72 |
| 3 | Teach the advanced SAFe courses and take the only path toward SPCT. | 67 |
| 4 | Taught at a SAFe Platinum Partner, with exam prep and support. See class dates. | 79 |

### Advanced Scrum Master · stage 2
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/safe/asm/ · Display path `/SAFe/ASM`  
*Facts used:* 2 days live virtual, 16 PDUs, exam; cross-team facilitation, flow across the ART; SSM = one team, SASM = multiple teams. Prerequisites left out: the page contradicts itself.

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe Advanced Scrum Master | 26 |
| 2 | ASM Certification | 17 |
| 3 | SASM Certification | 18 |
| 4 | Advanced Scrum Master Course | 28 |
| 5 | 2-Day Live Virtual ASM | 22 |
| 6 | Coach Across Multiple Teams | 27 |
| 7 | Accelerate Flow Across the ART | 30 |
| 8 | Beyond a Single Scrum Team | 26 |
| 9 | 16 PDUs, Exam Included | 22 |
| 10 | Advance Your Agile Career | 25 |
| 11 | Exam Prep and Support | 21 |
| 12 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Facilitate cross-team work and accelerate flow across the Agile Release Train. | 78 |
| 2 | Grow from leading one Scrum team to coaching across multiple teams in SAFe. | 75 |
| 3 | SAFe Advanced Scrum Master certification. Two days, live virtual, 16 PDUs. | 74 |
| 4 | Exam included, with exam prep and support. Taught at a SAFe Platinum Partner. | 77 |

### Agile Product Management · stage 4 (approved 25 Nov)
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/adv-safe/apm/ · Display path `/SAFe/APM`  
*Facts used:* 3 days, no prerequisites, exam included; Design Thinking, continuous exploration, Lean Startup, MVPs, hypothesis-driven epics, vision/roadmap/OKRs, WSJF. Format and PDUs left out: the page contradicts itself on delivery, and its 16 PDUs look templated.

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe APM Certification | 22 |
| 2 | Agile Product Management | 24 |
| 3 | SAFe Agile Product Manager | 26 |
| 4 | Product Manager Certification | 29 |
| 5 | Design Products Customers Love | 30 |
| 6 | Design Thinking at Scale | 24 |
| 7 | Lean Startup & MVPs | 19 |
| 8 | Vision, Roadmaps & OKRs | 23 |
| 9 | Hypothesis-Driven Epics | 23 |
| 10 | 3-Day APM Course | 16 |
| 11 | No Prerequisites | 16 |
| 12 | For Product Managers & Leads | 28 |
| 13 | Exam Included | 13 |
| 14 | Exam Prep and Support | 21 |
| 15 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Design and deliver products customers love with Design Thinking and Lean Startup. | 81 |
| 2 | Vision, roadmaps, OKRs and WSJF that connect product decisions to portfolio outcomes. | 85 |
| 3 | Three days, no prerequisites. Exam included, with exam prep and support. | 72 |
| 4 | For Product Managers and Directors of Product. Taught at a SAFe Platinum Partner. | 81 |

### Business Owner · stage 4 (approved 25 Nov)
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/safe/bo/ · Display path `/SAFe/Business-Owner`  
*Facts used:* 2 days, no prerequisites, exam included; connect strategy to execution, business value for PI Objectives, PI Planning, Inspect & Adapt, System Demos. Format and PDUs left out (as APM).

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe Business Owner | 19 |
| 2 | Business Owner Certification | 28 |
| 3 | SAFe Business Owner Workshop | 28 |
| 4 | Connect Strategy to Execution | 29 |
| 5 | Set Business Value for PIs | 26 |
| 6 | Your Role in PI Planning | 24 |
| 7 | Lead Inspect & Adapt | 20 |
| 8 | For Executives & Sponsors | 25 |
| 9 | 2-Day Business Owner Course | 27 |
| 10 | No Prerequisites | 16 |
| 11 | Exam Included | 13 |
| 12 | Exam Prep and Support | 21 |
| 13 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Connect strategy to execution and assign business value to PI Objectives every PI. | 82 |
| 2 | Take part in PI Planning, lead Inspect & Adapt and stay engaged through System Demos. | 85 |
| 3 | Two days, no prerequisites. Exam included, with exam prep and support. | 70 |
| 4 | For business owners, VPs of strategy and executive sponsors. See class dates. | 77 |

### SAFe for Architects · stage 4 (approved 25 Nov)
Campaign **Certifications - English** · Final URL https://agile-agilist.com/training/safe/arch/ · Display path `/SAFe/Architects`  
*Facts used:* 3 days, no prerequisites, exam included; Lean-Agile technical strategy, architecture aligned to value, DevOps and Release on Demand, solution vision and roadmaps, architecture for PI Planning. Format and PDUs left out (as APM).

| # | Headline | Chars |
|---|---|---|
| 1 | SAFe for Architects | 19 |
| 2 | SAFe Architect Certification | 28 |
| 3 | SAFe ARCH Certification | 23 |
| 4 | Lead Lean-Agile Tech Strategy | 29 |
| 5 | Architect for DevOps | 20 |
| 6 | Release on Demand | 17 |
| 7 | Solution Vision & Roadmaps | 26 |
| 8 | Architecture for PI Planning | 28 |
| 9 | For Enterprise Architects | 25 |
| 10 | 3-Day SAFe Architect Course | 27 |
| 11 | No Prerequisites | 16 |
| 12 | Exam Included | 13 |
| 13 | Exam Prep and Support | 21 |
| 14 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | Lead the technical strategy of a Lean-Agile enterprise and align architecture to value. | 87 |
| 2 | Architect for DevOps and Release on Demand, and prepare architecture for PI Planning. | 85 |
| 3 | Three days, no prerequisites. Exam included, with exam prep and support. | 72 |
| 4 | For system, solution and enterprise architects. Taught at a SAFe Platinum Partner. | 82 |

### Innovation Creator · held: not bookable yet
Campaign **Innovation - English** · Final URL https://agile-agilist.com/training/innovation-framework/innovation-creator/ · Display path `/Innovation/Creator`  
*Facts used:* Level 1, 2 days, no prerequisite, live and instructor-led; run the Innovation Framework with your team, facilitate the Innovation Matrix, leave with 3 artifacts. Works alongside SAFe.

⏸️ **Held:** Not bookable yet: no dates or prices, and the button goes to a launch list on twochasms.com, so no website Stripe payment is possible. Release when dates and checkout are live on agile-agilist.com.

| # | Headline | Chars |
|---|---|---|
| 1 | Innovation Creator Cert | 23 |
| 2 | Innovation Certification | 24 |
| 3 | Run Innovation With Your Team | 29 |
| 4 | Learn the Innovation Matrix | 27 |
| 5 | Leave With 3 Team Artifacts | 27 |
| 6 | Built on Two Chasms Framework | 29 |
| 7 | 2 Days, No Prerequisite | 23 |
| 8 | For Scrum Masters & POs | 23 |
| 9 | Live, Instructor-Led | 20 |
| 10 | Innovation on Cadence | 21 |
| 11 | Join the Launch List | 20 |

| # | Description | Chars |
|---|---|---|
| 1 | Run the Innovation Framework with your own team and facilitate the Innovation Matrix. | 85 |
| 2 | Leave with three artifacts your team keeps: a charter, a Candor Contract and a matrix. | 86 |
| 3 | Two days, live and instructor-led, no prerequisite. Works alongside SAFe. | 73 |
| 4 | Certifications are launching soon. Join the launch list for first dates and prices. | 83 |

### Innovation Facilitator · held: not bookable yet
Campaign **Innovation - English** · Final URL https://agile-agilist.com/training/innovation-framework/innovation-facilitator/ · Display path `/Innovation/Facilitator`  
*Facts used:* Level 2, 3 days, Creator recommended; capstone simulation; licence to facilitate the workshops in your organization; 30-60-90 day plan; for agile coaches, RTEs, SPCs, innovation leads.

⏸️ **Held:** Not bookable yet: no dates or prices, and the button goes to a launch list on twochasms.com, so no website Stripe payment is possible. Release when dates and checkout are live on agile-agilist.com.

| # | Headline | Chars |
|---|---|---|
| 1 | Innovation Facilitator Cert | 27 |
| 2 | Innovation Facilitator Course | 29 |
| 3 | Licensed to Run the Workshops | 29 |
| 4 | Facilitate Innovation In-House | 30 |
| 5 | Capstone-Based Certification | 28 |
| 6 | Build a 30-60-90 Day Plan | 25 |
| 7 | For Agile Coaches, RTEs, SPCs | 29 |
| 8 | 3 Days, Live & Instructor-Led | 29 |
| 9 | Innovation on Cadence | 21 |
| 10 | Built on Two Chasms Framework | 29 |
| 11 | Join the Launch List | 20 |

| # | Description | Chars |
|---|---|---|
| 1 | Get licensed to facilitate the Innovation Framework workshops inside your organization. | 87 |
| 2 | Pass a capstone simulation and turn the results into a 30-60-90 day plan. | 73 |
| 3 | For agile coaches, RTEs, SPCs and innovation leads. Innovation Creator recommended. | 83 |
| 4 | Certifications are launching soon. Join the launch list for first dates and prices. | 83 |

### Innovation Leader · held: not bookable yet
Campaign **Innovation - English** · Final URL https://agile-agilist.com/training/innovation-framework/innovation-leader/ · Display path `/Innovation/Leader`  
*Facts used:* Executive level, 1 day, no prerequisite; protect the explore budget with governance, the two-out-of-sixteen choice, the Rebrand Test.

⏸️ **Held:** Not bookable yet: no dates or prices, and the button goes to a launch list on twochasms.com, so no website Stripe payment is possible. Release when dates and checkout are live on agile-agilist.com.

| # | Headline | Chars |
|---|---|---|
| 1 | Innovation Leader Cert | 22 |
| 2 | Innovation for Executives | 25 |
| 3 | Innovation Leadership Day | 25 |
| 4 | Protect the Explore Budget | 26 |
| 5 | Governance, Not Goodwill | 24 |
| 6 | Run the Rebrand Test | 20 |
| 7 | 1-Day Executive Session | 23 |
| 8 | No Prerequisite | 15 |
| 9 | Innovation on Cadence | 21 |
| 10 | Built on Two Chasms Framework | 29 |
| 11 | Join the Launch List | 20 |

| # | Description | Chars |
|---|---|---|
| 1 | Protect the explore budget with governance instead of goodwill. One executive day. | 82 |
| 2 | Make the two-out-of-sixteen choice and run the Rebrand Test on your transformation. | 83 |
| 3 | No prerequisite. Live and instructor-led, built on the Two Chasms Framework. | 76 |
| 4 | Certifications are launching soon. Join the launch list for first dates and prices. | 83 |
