# Job Hunter

Finds new jobs in agile, transformation and AI-transformation roles across Canada, the UAE, Saudi Arabia,
Qatar, Kuwait and Oman, builds a tailored resume and cover letter for each one, and gives you a review page
where applying is one click per job.

It is plain Python (standard library only) running on a free GitHub Actions schedule. It makes no AI calls,
so it uses no tokens.

## What a run does

1. **Fetch** postings from public job APIs and company career boards (`config.json` > `sources`).
2. **Rank** them by rules: the job title must match one of your tracks, the location must be one of your
   countries (or worldwide remote), and the description adds points for your keywords.
3. **Tailor** your resume per job: picks the headline and summary for that track, moves the skills the
   posting asks for to the front, and leads each role with the bullets that match best. It only selects and
   reorders what you wrote in `resume.json`; it never invents experience.
4. **Package** each job as PDF + Word + web resume and a cover letter, and write `index.html`.

On the review page each job has **Open application** (the employer's form), the resume files to attach,
**Copy cover letter**, and, when the posting gives an address, **Email application** with the letter already
filled in. It also lists keywords the posting uses that your resume does not, so you can decide whether to
add real experience to `resume.json`. Mark jobs applied or skipped as you go.

Applications are not submitted automatically. Job boards forbid automated submissions and ban accounts for
it, and a wrong answer on a screening question is worse than a missed job.

## Setup (about 15 minutes)

This repository is public, so your resume never goes into git. It is stored as an encrypted GitHub secret,
and results are uploaded as a password-protected archive.

1. Copy `resume.example.json` to `resume.json` and replace the contents with your details.
2. In GitHub: **Settings > Secrets and variables > Actions > New repository secret**, add:

   | Secret | Value |
   |---|---|
   | `RESUME_JSON` | the full contents of your `resume.json` |
   | `PACKET_PASSWORD` | a password you choose; it opens the results archive |
   | `JOOBLE_API_KEY` | free key from https://jooble.org/api/about (main source for the Gulf) |
   | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | free keys from https://developer.adzuna.com (Canada) |

3. Optional, to get results by email instead of downloading them: `SMTP_HOST` (for Gmail `smtp.gmail.com`),
   `SMTP_USER` (your address), `SMTP_PASSWORD` (a Gmail *app password*, not your login password),
   and `NOTIFY_TO` if it should go to a different address.
4. The schedule only runs from the default branch, so merge this into `main`. To run it right away:
   **Actions > job-hunter > Run workflow**.

## Two resume versions and how each resume is matched to the posting

`resume.json` holds one base resume plus a `versions` section. By default (`config.json` >
`resume_versions`) jobs in Canada and the US get the `north_america` version, and jobs in the Middle East
and everywhere else, including worldwide remote, get the `international` version. A version only lists what differs
from the base resume, so the international one can carry a different phone number, a personal
details line (nationality, visa status), more bullets per role, or a different summary.

On top of the version, every resume is adjusted to its posting by rules:

- headline, profile and cover letter paragraph are the ones you wrote for that track;
- skills the posting asks for move to the front, shown in the posting's own wording when it uses one of
  your aliases (the posting says "Scaled Agile", your resume shows "Scaled Agile (SAFe)");
- skills marked `only_if_asked` appear only when the posting asks for them;
- the profile ends with the strengths that posting asks for;
- each role leads with the bullets that match the posting best, and a bullet can have your own alternative
  wording per track (`by_track`).

The review page lists these adjustments for each job, and the keywords the posting uses that your resume
does not. The more aliases, optional skills and bullet wordings you put in `resume.json`, the closer the
match; nothing is ever added that you did not write.

On GitHub the `RESUME_JSON` secret holds this one file, both versions included.

## Getting the results

- **Email** (if set up): a message listing the new jobs, with `job-packets.zip` attached. Unzip and open
  `index.html`.
- **Download**: open the run under **Actions > job-hunter**, download the `job-packets` artifact, and open it
  with 7-Zip using your `PACKET_PASSWORD`. Open `index.html`.

The run summary on that page shows how many postings each source returned and any source that failed.

## Tuning

Everything is in `config.json`:

- `tracks`: title phrases that qualify a job and the keywords that raise its score.
- `exclude_title`: titles to drop (developer, intern and so on).
- `locations`: countries and the city names that count for each.
- `min_score`, `retention_days`, `max_posting_age_days`.
- `sources`: switch sources on or off; add company career boards (Greenhouse, Lever, Ashby,
  SmartRecruiters, Workday) and any RSS or Atom feed.

## LinkedIn, Indeed, Bayt, GulfTalent and Naukrigulf (your computer only)

These sites have no public API, so they are read through your own signed-in browser. This part runs only
on your computer, never on GitHub, and your login never leaves your machine.

```bash
pip install playwright
```

```bash
python -m jobhunter login
```

A Chrome window opens with a separate profile (`.job-hunter/browser-profile` in your home folder, so sign-ins survive app updates). Sign in to each site once, then
press Enter in the terminal. After that, every `python -m jobhunter run` on your computer also reads your
searches on those sites, in a visible window, a few seconds apart, and reads the full posting only for jobs
whose title already fits. It never clicks Apply.

Know the trade-off: all five sites prohibit automated access in their terms, and LinkedIn in particular can
restrict an account. The defaults keep volume low (8 searches per country per site, once a day). To reduce
risk further, set `"enabled": false` on a site under `sources.browser.sites` in `config.json`, shorten
`queries`, or raise `delay_seconds`. If a site shows a sign-in or verification page, the run reports
"no job links found" for it; run `login` again and clear the check by hand.

Each site's search address and job-link pattern are in `config.json`, so they can be corrected there if a
site changes its addresses.

To run it daily, schedule `python -m jobhunter run` with Windows Task Scheduler or cron while you are
logged in to your computer.

## Web app on your own server

The same app with a web interface: review jobs, mark them applied or skipped, edit your resume and
settings, start a search, and see each run's results. It runs the search itself every day, so GitHub
Actions is not needed in this setup. It is single-user and password protected.

What you need: a VPS with Docker and Traefik (the Hostinger "Docker and Traefik" template used elsewhere
in this repository), and a DNS A record such as `jobs.yourdomain.com` pointing at it.

On the server:

```bash
git clone --branch claude/modest-babbage-2du7r2 https://github.com/mlbwhf/test.git /opt/jobhunter
```

```bash
cd /opt/jobhunter/job-hunter/deploy && cp .env.example .env && nano .env
```

Fill in `JOBHUNTER_HOST`, a long `JOBHUNTER_PASSWORD`, a long random `JOBHUNTER_TOKEN`, and the API keys.
If your Traefik network, entrypoint or certificate resolver have other names, run
`bash /opt/jobhunter/gate-platform/infra/scripts/detect-traefik.sh` and copy its three lines into `.env`.

```bash
docker compose up -d --build
```

Open `https://jobs.yourdomain.com`, sign in, paste your resume under **Resume**, and press
**Find new jobs**. Your resume, settings and results live in a Docker volume on the server, not in git.

To update later: `cd /opt/jobhunter && git pull && cd job-hunter/deploy && docker compose up -d --build`.

**LinkedIn, Indeed, Bayt, GulfTalent, Naukrigulf with the web app.** These must still be read on your
own computer, where you are signed in; a server login from a data-centre address is the fastest way to
get an account restricted. Your computer sends what it finds to the server:

```bash
python -m jobhunter push --url https://jobs.yourdomain.com --token YOUR_TOKEN
```

**Automation tools.** Anything that can send a web request (n8n, cron, Zapier) can start a search:
`POST https://jobs.yourdomain.com/api/run` with the header `Authorization: Bearer YOUR_TOKEN`.

To try the web app on your own computer instead:

```bash
JOBHUNTER_PASSWORD=choose-one python -m jobhunter serve
```

## Run it on your own computer

```bash
python -m jobhunter run
```

Put your resume in `resume.json` first. Results are written to `output/`; open `output/index.html`. Set the API keys as environment variables first. PDFs need Chrome or
Chromium installed; otherwise you get Word and web versions.

```bash
python -m unittest discover -s tests
```
