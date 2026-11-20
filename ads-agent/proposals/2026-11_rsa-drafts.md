# Responsive search ads for the new ad groups (DRAFT for your approval)

12 ads, one per new ad group: 227 strings in total. **Nothing is uploaded.** Phase 1:
you import them.

**Validated:** every string passes `src/asset_generator.py` for **US and Canada** audiences, both
during Black Friday and after it ends (15 Dec). That covers character limits, "SAFe Platinum
Partner" (never Gold), "exam prep and support" (no pass guarantee or money-back), no prices at all
(so no CAD for US), no scarcity claims, and approved stable landing pages only.

**Evergreen on purpose:** no Black Friday wording, so these don't need editing on 1 Dec. To
promote the offer in a stage 1 ad group until 30 Nov, add the headlines from the Black Friday kit.

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
*Facts used:* Page: 2 days live online, authorized SAFe instructor, SAFe ART Leader exam, 15 PDUs, no required prerequisites, 12 critical success factors, live launch-readiness assessment, launch plan, evolving roles; audience RTEs, PMs, System Architects. Owner-confirmed: PI Outcome Planning.

⚠️ **Owner-confirmed, not on the course page yet:** PI Planning in one day / PI Outcome Planning (Mark, 2026-11-20). Only in the blog today; add it to the course page so the ad matches it.

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
| 10 | Lead an AI-Native ART | 21 |
| 11 | 2 Days Live Online, 15 PDUs | 27 |
| 12 | No Required Prerequisites | 25 |
| 13 | Authorized SAFe Instructor | 26 |
| 14 | Exam Prep and Support | 21 |
| 15 | SAFe Platinum Partner | 21 |

| # | Description | Chars |
|---|---|---|
| 1 | PI Planning becomes one-day PI Outcome Planning. Learn to run it for an AI-Native ART. | 86 |
| 2 | Assess your ART's launch readiness live in class and leave with a plan for Monday. | 82 |
| 3 | Two days live online with an authorized SAFe instructor. ART Leader exam included. | 82 |
| 4 | For RTEs, Product Managers and System Architects whose roles are changing with AI. | 82 |

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
