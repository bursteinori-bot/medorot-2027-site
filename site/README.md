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
| Legal and contact details (operator, amuta no., address, phone, email, accessibility coordinator, "updated" dates) | `LEGAL_DETAILS` in `src/content.ts` |
| Payment page URL and its "תשלום עבור" text | `DONATION_URL` in `src/content.ts` |

`en.ts` is typed against `he.ts` (and `admin.en.ts` against `admin.he.ts`), so adding a Hebrew key without its English
twin is a TypeScript error (`npx tsc -b`). Functions build texts that contain values (`(n) => \`${n} photos\``). In legal
texts, `**bold**` marks a bold lead and `{contact}` becomes the email and phone from `LEGAL_DETAILS`.

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
real backend. Checks: `npx tsc -b`, `npx tsc -p tsconfig.api.json`, `npm run lint`, `npm run build`.

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
