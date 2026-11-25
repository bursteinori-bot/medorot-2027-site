# Medorot 2027 site: Hebrew and English

Hebrew is the default language. English is opt-in with the small toggle in the header (EN / עב, also in the admin),
or with a link that carries `?lang=en`. The choice is remembered in the browser (localStorage `medorot-lang`) and kept
in the URL as `?lang=en` while English is on. The browser's own language is never used. The design-concept prototypes
(`/concepts`, `/c/...`) stay Hebrew only.

Nothing stored changes with the language: form answers, option values (disciplines, locations, identities, stages),
application statuses and the default CSV export stay in Hebrew exactly as before. Only what is displayed is translated.

## Where the English text lives

| What | File |
| --- | --- |
| Fixed site texts: buttons, labels, form, errors, legal pages | `src/i18n/he.ts` and `src/i18n/en.ts` |
| Admin texts | `src/i18n/admin.he.ts` and `src/i18n/admin.en.ts` |
| English of the CMS content (home, about, open call, spaces, support...) | `src/i18n/content.en.ts`, or the admin's English tab |
| Legal and contact details (operator, amuta no., address, phone, email, accessibility coordinator, "updated" dates) | `legalDetails` in `src/i18n/he.ts` and `en.ts` |
| Payment page URL and its "תשלום עבור" text | `DONATION_URL` in `src/content.ts` |

`en.ts` is typed against `he.ts` (and `admin.en.ts` against `admin.he.ts`), so adding a Hebrew key without its English
twin is a TypeScript error (`npx tsc -b`). Functions build texts that contain values (`(n) => \`${n} photos\``). In legal
texts, `**bold**` marks a bold lead, `{contact}` becomes the email and phone from `legalDetails`, and `{operator}`,
`{amutaNumber}`, `{address}` and `{coordinator}` become the other `legalDetails`.

Everything in `he.ts` / `en.ts` is only the default: the team can replace any of it from the admin (next section).

## How the team edits any text on the site

Admin → **ניהול תוכן האתר** (content editor). Every part of the editor works the same way: change, **שמירת טיוטה**
(save draft), **תצוגה מקדימה** (preview, opens the site with the draft), **פרסום באתר** (publish). Visitors see only
what is published, and every published version stays in the history, so it can be restored.

- **Texts the team writes** (home, about, open call, spaces, support, confirmation, footer, dates, contact details,
  photos, partners): their own parts of the editor, Hebrew tab plus English tab (see "Editing CMS text in English").
- **Room names**: **שמות החדרים (התפריט)**. A room's name is its menu label (desktop and phone), the browser tab title,
  and the big title of the spaces, apply and details rooms. English names go in the English tab of the same part.
- **Every other text on the site**: **כל הטקסטים באתר** (All site texts). This covers headings, buttons, form labels
  and hints, the form's option labels, error messages, the details rows ("מנהלי הפסטיבל"), the support texts, the
  footer, the sculpture's descriptions, page titles and link previews, the built-in privacy policy and accessibility
  statement paragraph by paragraph, and the legal details and venue accessibility list (group **פרטים משפטיים
  ונגישות**). Texts are grouped by where they appear and can be searched (Hebrew or English, with or without niqqud;
  "רק טקסטים ששונו" shows only changed ones). Each row shows the current text as its title and as the grey
  placeholder of a Hebrew field and an English field. Type to replace; leave a field empty to keep the original;
  **חזרה לברירת המחדל** clears both languages of that row.
  - Texts with values in them show the values to keep, e.g. `{n} צילומים`, `{deadline}`, `{mb}`.
  - Texts that are the same in both languages (e-mail, phone, amuta number, dates) need only the Hebrew field: the
    English site uses it too unless an English text is written.
  - Legal dates are written `2026-11-25`.
  - Option labels change only what is shown: answers are stored by their fixed Hebrew value, as before.

How it is stored: the replacements are part of the same CMS content document (`site_content_versions`, JSON) under
`ui: { he: { 'form.name': '...' }, en: { ... } }`, keyed by the dotted path of the text in `he.ts` / `en.ts`
(`form.steps.0`, `form.locations.פטיו`, `legal.accessibility.sections.3.body.1.list.4`). `src/i18n/ui.ts` lists the
editable texts and applies the published replacements inside the public site's `ContentProvider`, so `useT()` and
`useLang().t` return the replaced texts. No database migration: versions without `ui` show the code's texts, and a
replacement for a key that no longer exists is ignored. The server (`api/admin.ts`, shape in
`src/shared/uiOverrides.ts`) accepts only string texts, at most 2,000 per language and 6,000 characters each.

When changing `he.ts` / `en.ts`: keys are positions for lists, so inserting a paragraph or option in the middle of a
list moves later replacements to their neighbour. Add at the end, or check **רק טקסטים ששונו** after the change.

Not editable from the admin: the form's "X words over the limit" message (`issues.words`, its grammar depends on the
numbers), technical values (`toggle.textLang`, `meta.ogLocale`, `legal.dateLocale`, the `brand.fwd` / `brand.back`
arrows, the hidden bot-trap label `form.honeypot`), the admin's own texts, and the design prototypes' texts
(`/concepts`, `/c/...`, including `concepts.*`). A whole legal text (adding or removing paragraphs) is replaced in the
editor's **מדיניות פרטיות** part.

## Editing CMS text in English

Texts the team edits in the admin (ניהול תוכן האתר) are Hebrew first. For each text the English site shows, in order:

1. **English written in the admin.** Every section of the content editor has an "עברית / English" switch. English
   entered there is published together with the Hebrew (it is stored under `en` in the same content document). Leave a
   field empty to use the automatic English; the placeholder shows what the site will show.
2. **An exact translation of the current Hebrew text**, from `src/i18n/content.en.ts`: the built-in English of the seed
   (`EN_SEED`) and `MEMORY`, a list of `'Hebrew text exactly as published': 'English'` pairs (spacing and line breaks
   don't matter). This is why published Hebrew wording that differs from the seed still gets correct English.
3. **The built-in English for that field** (`EN_SEED`), even though the Hebrew has since been edited. In development the
   browser console lists such fields (`[i18n] CMS texts without an exact English translation`).
   Dates, deadline and venue never fall back to older English: without a translation they show the Hebrew value.
   A new photo with no English alt text gets a plain "Space name, photo N".

So **when you change a Hebrew text in the admin, also fill in its English in the English tab** (or add a `MEMORY`
line in `content.en.ts` and deploy). Lists (paragraphs, words, disciplines) are replaced as a whole.

Approved legal texts saved in the CMS (`legal.privacy` / `legal.accessibility`) need their own English under the English
tab; without one, the English page shows the built-in English translation, which always opens with a note that the
Hebrew version prevails.

## Errors from the server

The API keeps its Hebrew `error` texts and adds language-neutral codes: `code` (e.g. `rateLimited`), `fieldCodes`
for form fields (e.g. `required`, `words:text:12:150`) and `detail`. The browser shows the Hebrew text in Hebrew and
maps the codes to `en.ts` (`errors.server`, `issues`, `admin.errors`) in English. A new server error needs a code
and an English line there.

## Local development

`npm run dev` (port 5273). `MOCK_API=1` (PowerShell: `$env:MOCK_API='1'; npm run dev`) adds in-memory stand-ins for the
application endpoints and the admin API (`dev/mockApi.ts`), so the form and the admin screens can be tried without the
real backend. The mock's `/api/content` serves the version published in the mock admin, so a publish there shows on
the local site. Checks: `npx tsc -b`, `npx tsc -p tsconfig.api.json`, `npm run lint`, `npm run build`.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
