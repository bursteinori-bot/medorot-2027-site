# HANDOFF: Medorot 2027 festival site (מְדּוֹרוֹת 2027)

Written 25.11.2026 for a Claude on another computer that has to continue this work. It was compiled from the Claude Code session transcripts (16.11 and 22.11.2026) and from the project files. All times are Israel time (UTC+2), converted from the transcript timestamps.

Live site: **https://medorot-2027.vercel.app**. Admin: `/admin`. Application form: `/apply`. Design concepts archive: `/concepts`.

Related files in this folder: `PROJECT.md` (Hebrew status and decisions; it has a 22.11 status block), `site/SETUP.md` (Hebrew setup, env and deploy notes), `brief/Medorot 2027 - Website Master Brief.pdf` (the 22-page master brief, in English, which is the primary spec). `site/README.md` is only the stock Vite template readme.

---

## 1. What the site is, who is who, standing rules

### What it is
A Hebrew (RTL) website for **מְדּוֹרוֹת 2027**, a contemporary-art festival in Jerusalem on Lag BaOmer 2027. The venue is קהילת כל הנשמה, בקעה. The partners shown are כל הנשמה, JCU and bk.

The site's main job right now is the **open call (קול קורא)**: artists submit project proposals through a 4-step form. The festival team reviews them in a Hebrew admin area, which also has a CMS for all site text, plus anonymous usage statistics.

- **Public site:** tab navigation with 7 sections (ראשי, על הפסטיבל, הקול הקורא, מרחבי הפסטיבל, הגשת הצעה, שותפות ותמיכה, פרטים). Each tab swaps the central panel; it is not one long scroll.
- **Visual direction:** concept 1, **"מעבדת הפסל החי"** (yellow). Its centrepiece is a "sculpture" built from the real poster creature parts (PSD layers), which recombine.
- **Donations:** the section is shown but payment is disabled until a provider is chosen. Never fake a payment.

### Who is who
- **Ori Burstein (אורי):** owns the Claude account and does the work through Claude. All instructions in the transcripts were typed in Ori's sessions, often from his phone via Remote Control. He relays the team's feedback and sends all messages to the team himself. He often types Hebrew with the English keyboard layout (e.g. `bgav xhxn` = `נעשה סיסמה`), so decode it.
- **Nave (נוה):** on the festival team, and Ori's client for this and other work (see `C:\Users\אורי\Documents\נוה עבודות\_sources\people_and_other_work.md`). He owns the branding Drive folder and chose the yellow direction ("נוה אהב את הצהוב").
- **Tahar (טהר):** on the festival team with Nave. Every message with links (16.11 and 22.11) was drafted for "נוה וטהר". **No instruction written by Tahar appears in any transcript.** The venue-photos Drive folder belongs to a different Google account from Nave's; its account name suggests "Tohar", so Tahar probably supplied the venue photos. That is an inference.
- **"The team" / "הצוות":** the festival organisers. The 22.11 feedback list is written in the team's plural voice ("תנסח לנו", "סומכים עליך", "לעמוד שלנו"). Ori pasted it; who actually wrote it is not stated.

### Standing rules
1. **Never send anything to Nave, Tahar or anyone else.** Claude prepares link plus message drafts in Hebrew ("הודעה מקלוד", signed as Claude on Ori's behalf), and Ori sends them. This was stated for all of Nave's work on 22.11: "ואל תשלח לו כלום בעצמך".
2. **Production deploys need an explicit yes from Ori.** On 22.11 the production deploy was blocked until he wrote "כן מאשר". An ambiguous reply ("של מדורות") was not treated as approval; only a preview was deployed.
3. **Secrets never go through the chat:** DB URLs, keys, the team password, recovery codes. Keys live only in Vercel env and in local `.env*.local` files. Never repeat the team admin password, even though Ori once told it to Claude. On 16.11 Ori also pasted what looked like account recovery codes. Claude did not use them and advised him to regenerate them. Never use or repeat them.
4. **From the brief (PROJECT.md "זהות"):**
   - Use the original logo; never redraw it.
   - Approved texts are not rewritten. Copy them from the PDF's rendered page, since extracted text garbles Hebrew order.
   - The heading "קוֹל קוֹרֵא: פַּנּוּ דֶּרֶךְ..." always appears in full with nikud; never shorten it to "פנו דרך".
   - Write "מְדּוֹרוֹת" with exact nikud.
   - Colours: yellow `#FEE801`, ivory `#FEFAEE`, magenta `#E13D96`, ink `#0A0A0A`.
   - Font: Frank Ruhl Libre.
5. **Accessibility:** WCAG 2.1 AA plus the Israeli accessibility regulations. Respect `prefers-reduced-motion` in every animation.
6. **Dates:** none yet. Show "יפורסם בקרוב" (editable in the CMS). Instagram is `medorott`. WhatsApp and e-mail come later; until then their fields stay hidden, with no visible "[לעדכון]".
7. **Don't sign up for anything for the team** (payment providers, Resend etc.) without approval. Ori wants to do as little as possible himself ("משהו שאני לא אצטרך לעשות כלום"), so prefer solutions that need no action from him, and ask only for the unavoidable clicks.
8. **The site stays `noindex`** (header in `site/vercel.json`) until launch day.

---

## 2. Current state (as of 25.11.2026)

**Live and working** at https://medorot-2027.vercel.app:
- The full public site in the yellow direction.
- Real submissions, stored in Neon Postgres. Files are stored in the DB (4 MB per file; photos up to 30 MB are shrunk in the browser).
- The admin area with the CMS, the team-password login and the usage statistics.

**Deployed on 22.11.2026 (production, after "כן מאשר").** This round came from the team's feedback list in section 5:
- **Criteria:** the "criteria" (קריטריונים) section was removed completely from the site, and from the admin content editor.
- **Location question:** "היכן הייתם.ן רוצים.ות למקם את הפרויקט?" now has exactly four options: חלל בית הכנסת המרכזי / גלריה 1/2 / פטיו / פתוח להצעות. The "מקום אחר" free-text field is gone. A restored draft with an old, invalid location is reset.
- **Jewish-world question:** the hint sentence "אפשר להתייחס למקורות, טקסטים, מסורת, טקסים, זהות, היסטוריה, זיכרון, תרבות או לכל חיבור אישי ואמנותי אחר." was removed.
- **Portfolio:** the portfolio link is now **required**, with URL validation. After it comes a new optional field, **"אינסטגרם / אתר האמן.ית"** (`social`). It shows in the admin application view and in the CSV export.
- **Legal texts:** the privacy policy and accessibility statement were **rewritten as final texts**, after research into similar Israeli sites (Israel Festival, Jerusalem Cinematheque, Bezalel, HaMiffal, Jerusalem Music Centre). The "טיוטה" banner and all bracketed placeholders were removed. The privacy policy covers:
  - what is collected and why, processors, and transfer abroad (Vercel in the USA, Neon in Frankfurt)
  - retention of 24 months after the festival
  - rights, minors, and the applicant's copyright with a limited licence
  - cookies and storage, analytics, and Jerusalem jurisdiction

  The accessibility statement follows reg. 35 and promises a reply within 5 business days. Both are dated 22.11.2026.
- **Footer:** a **white Instagram logo**, in the same row as the partner logos, replaces the `@medorott` username text. It links to the Instagram page.
- **Sculpture:**
  - The "ערבבו את הפסל" and "איפוס" buttons were removed.
  - The sculpture now **auto-shuffles about every 4.2 s** (`SCULPTURE_BEAT_MS = 4200`). It moves only between curated arrangements, never the same one twice in a row: random single-part swaps left floating heads.
  - It pauses when off screen, when the tab is hidden, for about 12 s after the user touches it, and under reduced motion.
  - The box background colour still changes on every tab or room change.
  - On mobile the box is smaller, about 470 → 272 px tall.
- **Phone layout trial removed:** the `?layout=a…d` trial (4 phone layouts offered on 16.11, never chosen) was deleted, since this change replaces it.
- **Verified after deploy:** `node dev/e2e-submit.mjs` passed against the live site:
  - invalid e-mail rejected; start, uploads and complete all returned 200; idempotent retry; stored as `new`; files stored
  - the test application was deleted afterwards
  - result: "notification: email not configured"
- `PROJECT.md` got a 22.11 status block.

**History:**
- **16.11:** brand audit, then 5 clickable concepts (gallery first shared as a claude.ai artifact, then on Vercel). Nave chose concept 1. Then the full site, the backend (Supabase was abandoned: the account was at its free-project limit and Ori didn't want to pause a project; Vercel Blob was suspended over quota; Neon was chosen), the admin and CMS, the team password and the analytics.
- **16.11 evening:** sculpture buttons on one row, box colour cycling, colour change on tab change, smoother section transitions, and the 4 phone layouts.
- **22.11:** the round above.
- **Nothing was changed after 22.11.**

---

## 3. Architecture

All code is in `site/`. The folder is **not a git repository** (on 25.11 Ori approved moving Nave's work to a private GitHub repo; the `.gitignore` already excludes `.env*`, `*.local`, `.vercel`, `dist`, `node_modules`).

- **Front end:** Vite 6, React 19, TypeScript ~5.8, Tailwind v4 (`@tailwindcss/vite`), `motion` 12 (motion/react) and react-router-dom 7.
  - It is an SPA: `vercel.json` rewrites everything except `/api/` and `/assets/` to `index.html`.
  - Routes are in `src/App.tsx`: `/admin/*` (lazy AdminApp), `/concepts`, `/c/:concept/:section?`, `/privacy`, `/accessibility` and `/:section?`.
  - The production site is `src/site/Site.tsx`. The sculpture engine is `src/sculpture/` (`parts.ts`, `arrangements.ts`, `SculptureMixer.tsx`). The 5 concepts are `src/concepts/c1…c5` plus `Gallery.tsx`.
- **Shared validation:** zod 3 schemas in **`src/shared/application.ts`**, used by both the browser and the server functions, so both enforce the same Hebrew error messages.
  - `LOCATIONS`, `STEP_SCHEMAS`, `startSchema`, `fileMetaSchema`, `fieldErrors`.
  - `UPLOAD` policy: 8 files, 4 MB each; image sources up to 30 MB, shrunk client-side.
  - The form is `src/shared/ApplicationForm.tsx`. It has a `demo` mode (concept prototypes, saves nothing) and a `live` mode, and keeps a localStorage draft. Submission logic is `src/shared/submit.ts`.
- **Server:** Vercel serverless functions in **`site/api/`** (Web-standard GET/POST exports, ESM: relative imports need `.js` extensions).
  - `api/applications/{status,start,file,complete}.ts`: start, then a PUT per file with the `x-application-key` header, then complete, which verifies byte sizes and sets status `new`. Retries are idempotent (the key is the application id). Spam protection is a honeypot, a minimum fill time and a per-IP-hash rate limit.
  - `api/content.ts` (published CMS content), `api/media.ts` (CMS images), `api/track.ts` (analytics beacon).
  - **`api/admin.ts`:** one router with `?route=`, to stay under the Hobby function limit. Every write needs the `x-medorot: 1` header.
  - Helpers: `api/_lib/server.ts` (sql, ipHash, applicationsOpen, notifyTeam) and `api/_lib/auth.ts` (scrypt, sessions).
- **Database:** **Neon Postgres, free plan, eu-central-1 (Frankfurt)**, connected through the Vercel Marketplace, which created the env vars automatically. The driver is `@neondatabase/serverless`.
  - Migrations: `db/migrations/001_init.sql` (11 tables: admin_users, admin_sessions, applications, application_files, notes, corrections, status_history, submission_attempts, site_content_versions, media_assets, schema_migrations) and `002_analytics.sql` (analytics_events). Both have been applied.
  - New migrations go in `003_….sql`, run with `node dev/migrate.mjs`.
  - Uploaded files are `bytea` in `application_files`, private, with no public URL.
- **CMS:** all public content is one JSON document whose default is **`SEED` in `src/content.ts`**.
  - `src/cms/content.tsx` (`ContentProvider`) fetches `/api/content`. If a published version exists, it **overrides the seed**, merged one level deep by `withSeed`, so fields added to SEED later still appear.
  - `?preview=<id>` shows a draft to a signed-in team member.
  - The editor is `src/admin/ContentEditor.tsx`: 10 sections, draft → preview → publish, with version history and restore.
  - **Gotcha:** if the team has published a CMS version, editing a text in `content.ts` will **not** change the live site for keys that the published document already contains. Change it in the admin CMS, or publish a new version. Check `/api/content` first.
- **Legal texts:** in **`src/site/Legal.tsx`** (exports `Privacy` and `Accessibility`). Fallback order:
  1. If the CMS holds approved text in `legal.privacy` / `legal.accessibility`, it is rendered by the `Approved` component (blank line = paragraph, `## ` = heading). Both are `null` in SEED today.
  2. Otherwise the built-in final texts written on 22.11 are shown.
  3. Contact is handled by `useContact()`: if `settings.email` is set in the CMS, it shows a mailto link; otherwise it falls back to "בהודעה פרטית באינסטגרם @medorott".
  4. The operator is named generically as "צוות פסטיבל מְדּוֹרוֹת", because the legal entity is unknown.
- **Admin area** (`/admin`, `src/admin/`):
  - **Login:** one **team password**, set on the first visit (scrypt; session cookie `medorot_admin`, HttpOnly, 14 days; 8 login attempts per 15 min). Optional personal users can be invited at `/admin/users`, with roles admin / editor / reviewer and no self-signup. The password can be changed on the "סיסמה" page.
  - **Screens:** dashboard; applications list (search, 8 filters, sort, Hebrew CSV export); application detail (answers, file preview and download, 6 internal statuses, internal notes, corrections stored beside the original answers, history); content editor; users; password.
  - **Usage stats ("שימושיות", `/admin/analytics`):** live visitors, visits by day and page, sources, devices, cities, the form funnel, events (sculpture shuffles, photo opens, Instagram clicks, donation amounts) and a recent feed. They are anonymous: no cookies, no IP, a daily rotating visitor hash, DNT and GPC respected, bots filtered, 13-month retention.
- **Other folders:**
  - `tools/`: Python asset pipeline. `fetch_assets.py` gets the Drive files; `audit.py` and `extract.py` take apart the PSD and AI; `export_parts.py` cuts the creature parts into `web_assets/creatures`; `photos.py` converts HEIC to WebP; `publish_assets.py`, `og_image.py` and `artifact_page.py` do the rest. The venv is `tools/venv` (psd-tools, pillow-heif, pymupdf, scipy).
  - `audit/`: brand-audit renders and layer dumps.
  - `assets_src/`, `web_assets/`: source and processed assets.
  - `brief/`: the PDF.
  - `deploy/medorot-2027/`: the **old static-only** build from the concept-gallery stage (index.html, assets, vercel.json, .vercel). **Do not deploy from it**: it has no `api/` and would take the backend offline. `PROJECT.md` line "עדכון: בונים מחדש, מעתיקים את site/dist אל deploy/medorot-2027…" is **outdated**; ignore it.

---

## 4. Run, deploy, test

### Local development
```
cd site
npm install
npm run dev          # http://localhost:5273  (port set in vite.config.ts)
```
- **The API is not available locally.** Plain `npm run dev` has no server functions, so the live form shows "ההגשה עוד לא נפתחה" and the admin can't log in.
- **To try the form locally, use demo mode at `http://localhost:5273/c/1/apply`** (concept 1's prototype form, which saves nothing). This is how the 22.11 changes were tested.
- **Optional:** `site/dev/mockApi.ts` is an in-memory mock of the submission API (`MOCK_API=1`; in PowerShell: `$env:MOCK_API=1; npm run dev`). It has not been re-checked since the 22.11 field changes.
- **Preview config:** a Claude Code launch config exists at `.claude/launch.json` (name "medorot", `npm run dev --prefix <site path>`, port 5273). The path in it is for this computer.
- **Before deploying:** `npm run build` runs `tsc -b && vite build`. Run it, plus a type check.

### Env variables (names only; never copy values into chat or files)
- **Created automatically by the Neon integration on Vercel:**
  - `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_PROJECT_ID`
  - `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
  - `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`, `POSTGRES_PRISMA_URL`, `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`
- **Optional (see `site/.env.example`):**
  - `APPLICATIONS_OPEN`: `false` closes the form without a deploy.
  - `IP_HASH_SALT`
- **Team e-mail notifications (not configured yet):** `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFY_EMAIL`, `SITE_URL`.
- **Local files:**
  - `site/.env.local` holds only `VERCEL_OIDC_TOKEN`.
  - `site/.env.production.local` is pulled from Vercel. It holds the Neon vars above plus `VERCEL_*` / `TURBO_*` system vars. The e2e scripts and `migrate.mjs` read it.
  - Both are local only. `.vercelignore` keeps them out of deploys.
- **On a new computer:** log in to the Vercel account that owns project `medorot-2027`. Ori has to approve the device login himself; Claude never types passwords. Then run `npx vercel link` in `site/` (the folder already has `.vercel/project.json` on this PC) and `npx vercel env pull .env.production.local --environment=production`.

### Deploy (only after Ori explicitly approves)
```
cd site
npx vercel deploy --prod --yes
```
- Always deploy from `site/`, **never** from `deploy/medorot-2027`.
- Previews (`npx vercel deploy` without `--prod`) are behind Vercel deployment protection, so Ori and the team can't open them without logging in. Use phone screenshots of the local build instead.
- After every production deploy, run the live submission test below.

### Live tests (run from `site/`; each deletes what it creates)
```
node dev/e2e-submit.mjs            # optional arg: base URL; default https://medorot-2027.vercel.app
node dev/e2e-admin.mjs             # 28 admin checks
node dev/e2e-analytics.mjs         # 11 analytics checks
```
- **What `e2e-submit.mjs` does:**
  1. Reads `DATABASE_URL` from `.env.production.local`.
  2. Posts an invalid e-mail and expects a 400 with a field error.
  3. Starts a real application with location `פטיו`, a portfolio and a social URL, and 2 files.
  4. Checks that complete is refused before the files arrive and that a wrong upload key is refused.
  5. Uploads the files, completes, and checks that a retry doesn't duplicate.
  6. Verifies the DB row, file sizes and status history.
  7. Deletes the test row in `finally`.
- **Expected:** all ✓ and "notification: email not configured" (until Resend is set up).
- **If the form fields change:** update the `answers` object in the script.
- **Other helpers in `site/dev/`:** `migrate.mjs`, `db-counts.mjs`, `invite-admin.mjs`, `ui-session.mjs`, `sample-traffic.mjs`.

---

## 5. All instructions and feedback, in chronological order (verbatim)

Unless noted, everything was typed by **Ori** in his Claude session "סשן חדש (Remote Control)" (16.11) or "נוה עבודות" (22.11 and 25.11). Lines marked (mid-turn) were sent while Claude was working. Decodings of wrong-keyboard text are Claude's.

### 16.11.2026: kickoff, concepts, full build
- **18:52.** The brief PDF plus two Drive links (the branding folder and the venue-photos folder): "תעבור על הכל אל תיישם עוד רק תראה הבנה ותפתח פרוקיט חדש"
- **18:56:** "תאריך - כרגע אין יהיה תאריך בקרוב שיהיה רשום תאריך בקרוב, יש אינסטגרם ווצאפ ומייל - medorott זה האינסטגרם ווצאפ ומייל אשלח יורת מאוחר תשעה כמובן נגישות וכו כל מה שצריך מדינויות פרטיות ספק תשלום וסוכמוי תרומה סופיין גם תעשה מה שמקובל או תשמצא דרך וכו. אם אפשר בלהבלו"
  - Interpreted as: no date yet, so show "soon"; Instagram is medorott; WhatsApp and e-mail will come later; do what is customary for accessibility, privacy policy, payment provider and donation amounts (36/72/180/360 ₪ plus a free amount).
  - "בלהבלו" was read as "Lovable". The stack was kept Lovable-compatible, but nothing was connected and this was never confirmed.
- **18:57 (mid-turn):** "אתה יכול לממש. תשקיע בטירוף."
- **18:57 (mid-turn):** "יכול לפתוח סשן חדש על אותו מחשב ווינדוס ריק לפרוקיט שנראה ״מה גוגל יודע עלי״". This is a separate project of Ori's, not Medorot. It could not be opened from Remote Control.
- **19:00 (mid-turn):** "יש לך גם מספיק כלים בשביל לבצע מעברים ואנימציות מרשימות מרתקות ומקצועיות"
- **19:31.** After the 5 concepts were built: "תכול ליצור קישור לשיליחה לנוה וטהר עם הכיוונים?"
- **19:39:** "יכול לעלות את זה לvercek?" Deployed to Vercel as medorot-2027 after Ori approved the device login.
- **20:07:** "נוה אהב את הצהוב" (Nave's choice, relayed: concept 1)
- **20:12.** Asked whether this was final or they would also wait for Tahar's opinion: "אפשר להמשיך איתו"
- **20:29:** "Yes, set it up" (Claude to set up Supabase)
- **20:30:** "Accepted". **20:32:** "Retried, accepted" (Supabase terms in Vercel)
- **20:32 (mid-turn).** A list of what looked like account recovery codes. Redacted; never use them.
- **20:32:** "נראלי שני הדרכים אפשראיות מה שתרצה"
- **20:33:** "תנסה דרך ורסל"
- **20:34:** "I'll pause one". **20:35:** "לא באלי" (declined pausing a Supabase project)
- **20:36:** "משהו שאני לא אצטרך לעדות כלום"
- **20:40:** "Neon, one click"
- **20:45:** "Yes, build it" (admin and CMS)
- **20:56 (mid-turn):** "גם לוגים של שימושיות וכו במידה ואין זה נורא חשוב"
- **20:58:** "אני רוצה שיהייה גם אזור שימושיות באתר מי צפה איפה וכו"
- **20:59 (mid-turn):** "bgav xhxn ecugv kt,r ckh nhhk uxhxnt", decoded as "נעשה סיסמה קבועה לאתר בלי מייל וסיסמא". This led to the single team password.
- **21:07:** "Set it". **21:08:** "Trying again now" (Ori setting the team password)
- **21:09 (mid-turn):** "מעולה זה בסדר שתדע אותה הסיסמה זה [REDACTED] - תכין הודעה קצרקצרה עם הקישורים לנוה וטהר"
  - Claude drafted the message (site, /apply, /admin; "את הסיסמה אשלח לכם בנפרד").
  - Claude advised changing the weak password on the "סיסמה" page.
- **22:18:** "אפשר לבקש שערבבו את הפסל , איפוס יהיו באותה שורה ומתחת יהיה כתוב רק שורה אחת תמיד של ״לחצו על חלק כדי להחליף אותו. ושכל פעם כשלוחצים ערבבו את הפסל ברקע של הקופסה שבה נמצא הפסל מתחלף לורוד/צהוב/קרם."
  - Done: one button row, one help line, box colour cycling yellow → pink → cream.
- **22:35:** "t,v hfuk kvrtu, 3-4 dhau, atpar krtu ,t, vxnk khs vfh,uc fh cfbhxv kykpui kt rutho t, zv yuc/// וגם אם אפשר, אה, שכל פעם כשעוברים לשונית והוא מערבב את הפסל אוטומטית, אז שהוא גם יחליף את הצבע של הרקע אוטומטית, ולא רק שלוחצים על הכפתור של ערבבו את הפסל. תודה."
  - The first part decodes as "אתה יכול להראות 3-4 גישות שאפשר לראות את הסמל ליד הכיתוב כי בכניסה לטלפון לא רואים את זה טוב///".
- **22:35 (mid-turn):** "vfuubv cykpui" = "הכוונה בטלפון"
- **22:38 (mid-turn):** "avngcr chi tjs kabhfkunr chi xeai tjs kabh ahvhv thyh hu,r tu thfu,h hur, fh zv brtv frdg fnu dkh." = roughly "שהמעבר בין אחד לשני, כלומר בין סקשן אחד לשני, שיהיה איטי יותר או איכותי יותר, כי זה נראה כרגע כמו גליץ'."
- **22:41 (mid-turn):** "v,fuub,h kxnk gmnu t,v nchi? fthku vxnk an,jk; cu vscrho/// tukh cfbhxv kt,r vut ,upx neuo nrfzh nsh c,vjkv umrhl kvrtu, yexy" = "התכוונתי לסמל עצמו אתה מבין? כאילו הסמל שמתחלף בו הדברים/// אולי בכניסה לאתר הוא תופס מקום מרכזי מדי בתחילה וצריך להראות טקסט"
  - Result:
    - Box colour now also changes on tab change, and section transitions are smoother.
    - The mistaken logo variants were removed.
    - 4 phone layouts were deployed behind `?layout=a…d` with the question "which one is the default?"
  - No answer came. On 22.11 the auto-shuffling, smaller sculpture replaced the trial.

### 22.11.2026: correction round (session "נוה עבודות")
- **21:22.** A feedback list pasted by Ori. The wording is the team's ("לנו", "סומכים עליך", "לעמוד שלנו"); the last line is Ori's:
  > -צריך בהגשת הצעה- להרויד את החלק של הקריטריונים לחלוטין
  > -לתקן: היכן הייתם.ן רוצים.ות למקם את הפרויקט? *
  >
  > חלל בית הכנסת המרכזי
  > גלריה 1/2
  > פטיו
  > פתוח להצעות
  > -להוריד את המשפט: אפשר להתייחס למקורות, טקסטים, מסורת, טקסים, זהות, היסטוריה, זיכרון, תרבות או לכל חיבור אישי ואמנותי אחר.
  >
  > -לשים תיק עבודות כשאלת חובה ואחריו לשים אפשרות לשים תיבה עם קישור לאינסטגרם/אתר אומן
  > -לגבי מדיניות פרטיות, תסתכל איך אתרים אחרים דומים מנסחים ותנסח לנו ככה שתהיה לנו הגנה משפטית טובה ושהכל שם יהיה מלא בצורה נכונה עלהפסטיבל ויחסה את מה שאנחנו צריכים סומכים עליך. כנל על ההצהרת נגישות.
  > -בלוגואים למטה תוכל לשים לוגו לבן של אינסטגרם שילחצו עליו והוא יוביל לעמוד שלנו במקום את היוזר ניים שלנו?
  > -לגבי הפסל- אפשר להוריד את הכפתור של ערבבו את הפסל, ואיפוס. שכל הזמן החלקים של הפסל יתערבבו באופן אוטומטי וחכם ולא מהיר מידי אבל כן ששמים לב. בנוסף שגם הצבע של הרקע שם ימשיך להתחלף כל פעם כשעוברים עמוד. וככה אפשר לצמצם את האורך שהפסל תופס בגרסאת המובייל של האתר. --- זה של האתר אתה זוכר?
- **21:33:** "של מדורות". This was ambiguous, so it was not treated as deploy approval; only a login-protected preview was deployed, and phone screenshots were sent.
- **22:44:** "הודעה קצרצרה" (a very short message to Nave covering KALAz v7, wedding v4.1 and this site)
- **22:45:** "מה עם האתר?"
- **22:45:** "כן מאשר" (explicit approval: production deploy, followed by the e2e test)
- **22:46:** "ותוסיף את זה להודעה". The final draft line for Nave, which Ori sends himself:
  > 🔥 אתר מדורות עודכן (בלי הקריטריונים, מיקומים חדשים, תיק עבודות כחובה, פסל שמתערבב לבד, מדיניות פרטיות ונגישות): https://medorot-2027.vercel.app
  > כדי להשלים את המדיניות צריך: השם המשפטי של הגוף, מייל ליצירת קשר, מי רכז.ת הנגישות ופרטי נגישות של המקום.

### 25.11.2026: handoff
- **19:11:** "צשיהיה גישה מרחוק" (turn on Remote Control). **19:13:** "יש 3 עבודות נכון?"
- **19:14:** "תוכל לעלות את מה שצריך לדרייב עם קבצי ריידמי כדי שמחשב וקלוד אחר יוכל לעזור להמשיך מאותה נקודה ולהכיל את ההוראות של נוה וטהר וכו - אל תמשמ עוד רק תבצעי פתרון אויל פתרון אחר עדיף שהוא לא דרייב"
- **19:15:** "גיטאב זה מעולךה אולי רק גיטאב". **19:16:** "Yes, go ahead". The plan: a private GitHub repo with the code and READMEs, no secrets, and media kept local. This file is part of that.

---

## 6. Open issues and next steps

**The team still has to supply (needed to complete the legal texts):**
1. **The legal entity name** that runs the festival (association or company, with its number). The texts currently say "צוות פסטיבל מְדּוֹרוֹת".
2. **A contact e-mail.** Set it in the CMS (`settings.email`); the privacy policy, accessibility statement and footer pick it up automatically. Until then, contact goes by Instagram DM.
3. **The accessibility coordinator** (רכז.ת נגישות): name or role and how to reach them.
4. **Venue physical-accessibility details** for קהילת כל הנשמה (access, parking, toilets etc.). The text currently says they will be published before the festival. Never invent them.

**Advisable or not configured:**
- **Lawyer review:** a lawyer should review the privacy policy and accessibility statement before launch. They were written from research, not legal advice; the code comment in Legal.tsx says so.
- **Team e-mail notification on new applications is not configured.** It needs a Resend account, a verified sender domain and the env vars `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFY_EMAIL` and `SITE_URL`. Submissions are saved regardless, and the failed notification is recorded on each application.
- **Remaining phases from the brief:**
  - Donations: choose a provider (candidates: נדרים פלוס, JGive, Cardcom, Grow/משולם, PayPal). Also check whether receipts go through an association (section 46).
  - Final QA.
- **Smaller items:**
  - Adobe Fonts web project ID (Frank Ruhl Libre is loaded from Google Fonts meanwhile).
  - WhatsApp and e-mail values, and festival dates, entered in the CMS.
  - Removing `noindex` (in `site/vercel.json`) on launch day.
- **Assets:**
  - The pink creature's PSD layer is named `shutterstock_2331814989`, so its licence for web use is unverified.
  - Venue photos are missing for gallery 1's interior and for the tribunes.
- **Security advice given and not confirmed:**
  - Change the weak team admin password on the "סיסמה" page and send the new one to Nave and Tahar separately.
  - Regenerate the Vercel account recovery codes that were pasted in chat on 16.11.
  - Enable 2FA on the Vercel account.
- **Unconfirmed decisions:**
  - Whether "בלהבלו" meant moving to Lovable (never confirmed).
  - Whether the team has published any CMS version. Check `/api/content` before relying on the `content.ts` seed.
- **Housekeeping:**
  - `PROJECT.md`'s deploy line still points to `deploy/medorot-2027`; it is wrong.
  - The project is not in git yet (GitHub setup in progress as of 25.11).
  - Nobody on the team has confirmed seeing the 22.11 version. The message draft is with Ori.
