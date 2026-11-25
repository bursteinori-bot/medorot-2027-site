// Seed content for the festival site: the approved copy from the brief, verbatim. In production this is the CMS seed;
// the public site and the admin editor both read from the same store.

export const FESTIVAL = 'מְדּוֹרוֹת'
export const YEAR = '2027'
export const TAGLINE = 'אמנות יהודית מציתה מחשבה'
export const OPEN_CALL_HEADLINE = 'קוֹל קוֹרֵא: פַּנּוּ דֶּרֶךְ...'
export const OPEN_CALL_LEAD = 'קוֹל קוֹרֵא:'
export const OPEN_CALL_PUNCH = 'פַּנּוּ דֶּרֶךְ...'

// Values the team has not fixed yet. `null` hides the line instead of showing an invented value.
export const SETTINGS = {
  festivalDate: 'יפורסם בקרוב',
  deadline: 'יפורסם בקרוב',
  responseDate: 'יפורסם בקרוב',
  venue: 'קהילת כל הנשמה, בקעה, ירושלים',
  instagram: 'medorott',
  instagramUrl: 'https://instagram.com/medorott',
  email: null as string | null,
  whatsapp: null as string | null,
  donationUrl: null as string | null, // hosted checkout, once a provider is chosen
  paymentsEnabled: false,
  privacyPolicyUrl: '#privacy',
}

export type SectionId = 'home' | 'about' | 'open-call' | 'spaces' | 'apply' | 'support' | 'details'

export const NAV: { id: SectionId; label: string }[] = [
  { id: 'home', label: 'ראשי' },
  { id: 'about', label: 'על הפסטיבל' },
  { id: 'open-call', label: 'הקול הקורא' },
  { id: 'spaces', label: 'מרחבי הפסטיבל' },
  { id: 'apply', label: 'הגשת הצעה' },
  { id: 'support', label: 'שותפות ותמיכה' },
  { id: 'details', label: 'פרטים' },
]

export const NAV_HINT = 'לחצו על נושא כדי לעבור בין חלקי האתר'

export const HOME = {
  invite: 'אמנים.ות, יוצרים.ות וקולקטיבים - אנחנו מזמינים אתכם.ן להגיש הצעות לפסטיבל מְדּוֹרוֹת 2027.',
  about: 'פסטיבל לאמנות עכשווית המבקש ליצור מפגש בין אמנות, יהדות ותרבות, בין מסורת לחדשנות ובין דורות של יוצרים.',
  fields: 'מחול, פרפורמנס, תיאטרון, אמנות פלסטית ותחומים נוספים - יצירות קיימות, עבודות בתהליך ורעיונות חדשים.',
  closing: 'הדרך פתוחה. אנחנו מחכים להצעות שלכם.ן.',
  ctaPrimary: 'להגשת הצעה',
  ctaSecondary: 'לגלות את הפסטיבל',
}

export const ABOUT = {
  title: 'מה בוער?',
  paragraphs: [
    'מְדּוֹרוֹת מבקש ליצור מפגש בין אמנות עכשווית לעולם היהודי, על שלל גווניו.',
    'הפסטיבל עוסק באש כסמל לבעירה פנימית בליבו של היוצר.ת, ובהפצתה כפעולה של שימור הגחלת היהודית התרבותית.',
    'דרך מפגש בין אמנים ויוצרים מדורות שונים, הפסטיבל מבקש לפתוח מרחב לדיאלוג, להתנסות וליצירה חדשה.',
  ],
  words: ['אש', 'גחלת', 'מסורת', 'דורות', 'יצירה', 'מפגש'],
  nameNote: 'מְדּוֹרוֹת: מדורות ודורות. האש הפנימית של היוצר.ת, והמפגש בין דורות של אמנים, יוצרים וחברי קהילה.',
}

export const OPEN_CALL = {
  paragraphs: [
    'אמנים.ות, יוצרים.ות, סטודנטים.ות וקולקטיבים - פסטיבל מדורות מזמין אתכם.ן להגיש הצעות לפרויקטים וליצירות לקראת הפסטיבל!',
    'אנחנו מחפשים הצעות בתחומי האמנות והיצירה: מחול, פרפורמנס, תיאטרון, אמנות פלסטית, מוזיקה, סאונד, וידאו, מיצבים, אמנות במרחב הציבורי ותחומים נוספים. אנחנו פתוחים לעבודות בפורמטים שונים, ליצירות קיימות, לפרויקטים הנמצאים בתהליך פיתוח וגם לרעיונות חדשים.',
    'מדורות מבקש ליצור מפגש בין אמנות עכשווית לעולם היהודי, על שלל גווניו. אנחנו מתעניינים בחיבורים למסורת, למקורות, לטקסטים, לתפילות, לטקסים, להיסטוריה, לזהות ולתרבות היהודית. נשמח להצעות שמציעות קריאה חדשה, פרשנות אישית, חיבור בלתי צפוי או נקודת מבט אחרת על המפגש הזה.',
  ],
  spaces: 'בית הכנסת עומד במרכז המחשבה האמנותית של הפסטיבל, לצד מרחבים נוספים בירושלים. אנחנו מזמינים הצעות שמתייחסות למקום עצמו, לאופיו ולמשמעותו, וכן עבודות שמבקשות לצאת אל החצר, הרחוב, המרחב הציבורי או חללים אלטרנטיביים.',
  who: 'הקול הקורא פתוח לסטודנטים.ות, אמנים.ות בתחילת דרכם.ן, אמנים.ות פעילים.ות, יוצרים.ות עצמאיים.ות, קבוצות וקולקטיבים.',
  stages: [
    { id: 'idea', label: 'רעיון ראשוני', desc: 'פרויקט שעוד לא התחיל את תהליך הפיתוח שלו.' },
    { id: 'developing', label: 'בתהליך פיתוח', desc: 'עבודה שכבר נמצאת בתהליך יצירה.' },
    { id: 'existing', label: 'עבודה קיימת', desc: 'פרויקט שכבר נוצר ומוכן להצגה.' },
    { id: 'new', label: 'יצירה חדשה לפסטיבל', desc: 'רעיון ליצירה שתפותח במיוחד עבור מדורות.' },
  ],
  stagesNote: 'אין צורך להגיע עם יצירה גמורה. גם רעיון שנמצא בראשית דרכו מוזמן להגיש.',
  disciplines: ['מחול', 'פרפורמנס', 'אמנות פלסטית', 'תיאטרון', 'מוזיקה / סאונד', 'וידאו / קולנוע', 'מיצב / אמנות במרחב', 'אמנות במרחב הציבורי', 'אחר'],
  criteriaIntro: 'ההצעות ייבחנו בהתאם לקריטריונים הבאים:',
  criteria: [
    'מקוריות ואיכות אמנותית.',
    'חיבור לתחומי העניין ולקו האמנותי של הפסטיבל.',
    'זיקה לעולם היהודי, על היבטיו התרבותיים, ההיסטוריים והאישיים.',
    'התאמה למרחבי הפסטיבל ולאפשרויות ההצגה בהם.',
    'פוטנציאל לפיתוח, ליצירה ולמפגש עם קהל.',
  ],
}

// public assets resolve against the app's base, so the build also works from a sub-path or a static host
// (import.meta.env exists only in the Vite build; the server functions import this file too, for the CMS seed)
export const asset = (path: string) => `${import.meta.env?.BASE_URL ?? '/'}assets/${path}`

export type Photo = { src: string; alt: string }
const photo = (name: string, alt: string): Photo => ({ src: asset(`venue/${name}`), alt })
// built-in venue photos come in two widths; photos uploaded through the CMS are served as they are
export const img = (p: Photo, w: 960 | 2000 = 960) => (p.src.startsWith('/api/media') ? p.src : `${p.src}_${w}.webp`)

export const SPACES: { id: string; name: string; desc: string; photos: Photo[] }[] = [
  {
    id: 'galleries',
    name: 'גלריות בית הכנסת',
    desc: 'שתי גלריות להצגת עבודות אמנות פלסטית, ציור, הדפס, פיסול, צילום ווידאו.',
    photos: [
      photo('gallery2_2', 'גלריה 2: מסדרון שטיח ארוך לאורך קיר זכוכית הפונה אל חלל בית הכנסת'),
      photo('gallery2_1', 'גלריה 2: מבט לאורך הגלריה, קיר עץ וחלונות מצד אחד וזכוכית מהצד השני'),
      photo('gallery2_3', 'גלריה 2: הגלריה ומבט דרך הזכוכית אל החלל המרכזי'),
      photo('gallery2_4', 'גלריה 2: קצה הגלריה, קיר עץ וחלון גבוה'),
      photo('hall_gallery1_below', 'גלריה 1 במבט מלמטה, מתוך חלל בית הכנסת'),
      photo('hall_gallery2_below_3', 'גלריה 2 במבט מלמטה, חלונות הגלריה מעל החלל'),
    ],
  },
  {
    id: 'hall',
    name: 'חלל בית הכנסת המרכזי',
    desc: 'חלל למופעי פרפורמנס, מחול ותיאטרון.',
    photos: [
      photo('hall_1', 'חלל בית הכנסת המרכזי: רצפת אבן בדוגמת רשת וחלון גג משולש'),
      photo('hall_2', 'חלל בית הכנסת: ארון הקודש והבימה'),
      photo('hall_4', 'חלל בית הכנסת: מבט רחב אל הבימה ואור יום מחלון הגג'),
      photo('hall_5', 'חלל בית הכנסת: מבט מקצה החלל'),
      photo('hall_gallery2_below_1', 'חלל בית הכנסת והגלריה שמעליו'),
      photo('hall_gallery2_below_6', 'חלל בית הכנסת: הבימה, העמודים והגלריה'),
      photo('hall_gallery2_below_2', 'חלל בית הכנסת: מבט אל הכניסה והגלריה'),
    ],
  },
  {
    id: 'patio',
    name: 'פטיו הכניסה והטריבונות',
    desc: 'מרחב מפגש פתוח למיצגים, דיג׳ייז ומפגש בין אמנים, חברי הקהילה והקהל.',
    photos: [
      photo('patio_2', 'פטיו הכניסה: רחבת אבן ירושלמית, עצים וחזית בית הכנסת'),
      photo('patio_1', 'פטיו הכניסה: רחבת האבן מול חזית הזכוכית של בית הכנסת'),
    ],
  },
]

export const SUPPORT = {
  title: 'מדליקים את האש ביחד',
  paragraphs: [
    'מְדּוֹרוֹת נוצר מתוך רצון לפתוח מרחב ליצירה, למפגש ולמחשבה חדשה.',
    'אנחנו מאמינים שאמנות צריכה מרחב לבעור בו, ושיצירה עצמאית זקוקה לאנשים שמאמינים בה.',
    'אנחנו מזמינים אתכם.ן להיות חלק מהפסטיבל ולתמוך ביצירה אמנותית עצמאית בירושלים.',
    'כל תרומה עוזרת לנו לאפשר לאמנים ויוצרים להציג עבודות חדשות, לפתח רעיונות, ליצור מפגשים ולהדליק עוד ניצוצות של יצירה.',
  ],
  closing: 'הצטרפו אלינו והיו שותפים ליצירה.',
  amounts: [36, 72, 180, 360],
  button: 'לתרומה',
  notLive: 'התרומות המקוונות עדיין לא פעילות. נעדכן כאן ברגע שיהיו. בינתיים אפשר לפנות אלינו באינסטגרם.',
}

export const FINAL_CTA = {
  text: 'יש לכם רעיון? פַּנּוּ דֶּרֶךְ והגישו אותו.',
  button: 'להגשת הצעה',
}

export const CONFIRMATION = {
  title: 'ההצעה שלכם בדרך אלינו!',
  lines: [
    'תודה שהקדשתם זמן וחשבתם איתנו על מְדּוֹרוֹת 2027.',
    'קיבלנו את ההגשה שלכם.ן ונחזור אליכם.ן בהתאם ללוח הזמנים שיפורסם.',
    'בהצלחה, ואולי נתראה סביב המדורה.',
  ],
}

export const PRIVACY_DRAFT = true // privacy policy + accessibility statement are drafts until the team approves them

export const PARTNERS = [
  { name: 'קהילת כל הנשמה', src: asset('partners/kol-haneshama.png') },
  { name: 'JCU', src: asset('partners/jcu.png') },
  { name: 'שותף (סמל הנמלה)', src: asset('partners/bk.png') },
]

// Everything the CMS can edit, as one document. The seed is what the site shows until a published version exists.
export const SEED = {
  festival: FESTIVAL,
  year: YEAR,
  tagline: TAGLINE,
  settings: SETTINGS,
  nav: NAV,
  navHint: NAV_HINT,
  home: HOME,
  about: ABOUT,
  openCall: OPEN_CALL,
  spaces: SPACES,
  support: SUPPORT,
  finalCta: FINAL_CTA,
  confirmation: CONFIRMATION,
  partners: PARTNERS,
  // approved legal texts from the CMS; while null the site shows the built-in drafts (src/site/Legal.tsx)
  legal: { privacy: null as string | null, accessibility: null as string | null },
}
export type SiteContent = typeof SEED
