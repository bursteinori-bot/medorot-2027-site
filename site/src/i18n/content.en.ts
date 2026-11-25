// English for the CMS-editable content (src/content.ts and what the team publishes from the admin).
//
// How English content is chosen, per text (see src/i18n/localize.ts and site/README.md):
//   1. English written in the CMS for that text (the content document's `en` field, edited in the admin's English tab)
//   2. an exact translation of the current Hebrew text: MEMORY below, plus every seed text paired with EN_SEED
//   3. the built-in English for that key (EN_SEED), even if the Hebrew has since been edited
//   Dates, deadline and venue never fall back to old English: without a translation they show the Hebrew value.
import type { SectionId } from '../content'

type Space = { name: string; desc: string; photos: Record<string, string> } // photos: alt text by file name
export type EnContent = {
  festival: string
  tagline: string
  settings: { festivalDate: string; deadline: string; responseDate: string; venue: string }
  nav: Record<SectionId, string>
  navHint: string
  home: { invite: string; about: string; fields: string; closing: string; ctaPrimary: string; ctaSecondary: string }
  about: { title: string; paragraphs: string[]; words: string[]; nameNote: string }
  openCall: {
    paragraphs: string[]
    spaces: string
    who: string
    stages: Record<'idea' | 'developing' | 'existing' | 'new', { label: string; desc: string }>
    stagesNote: string
    disciplines: string[]
    criteriaIntro: string
    criteria: string[]
  }
  spaces: Record<'galleries' | 'hall' | 'patio', Space>
  support: { title: string; paragraphs: string[]; closing: string; button: string; notLive: string }
  finalCta: { text: string; button: string }
  confirmation: { title: string; lines: string[] }
  partners: Record<string, string> // partner name by logo file name
}

type DeepPartial<T> = T extends string ? T : T extends (infer U)[] ? U[] : { [K in keyof T]?: DeepPartial<T[K]> }
// What the CMS may store under `en` in the content document. Every field is optional; lists replace the whole list.
export type EnOverrides = DeepPartial<Omit<EnContent, 'spaces' | 'partners'>> & {
  spaces?: Record<string, { name?: string; desc?: string; photos?: Record<string, string> }>
  partners?: Record<string, string>
  legal?: { privacy?: string | null; accessibility?: string | null }
}

// The built-in English of the seed (src/content.ts), key by key.
export const EN_SEED: EnContent = {
  festival: 'Medorot',
  tagline: 'Jewish art that sparks thought',
  settings: {
    festivalDate: 'To be announced',
    deadline: 'To be announced',
    responseDate: 'To be announced',
    venue: 'Kol HaNeshama Congregation, Baka, Jerusalem',
  },
  nav: {
    home: 'Home',
    about: 'About',
    'open-call': 'Open Call',
    spaces: 'Festival Spaces',
    apply: 'Apply',
    support: 'Support the Festival',
    details: 'Details',
  },
  navHint: 'Tap a topic to move around the site',
  home: {
    invite: 'Artists, makers and collectives: we invite you to submit proposals for Medorot 2027.',
    about: 'Medorot (Hebrew for “bonfires”) is a contemporary art festival that brings together art, Judaism and culture, tradition and innovation, and generations of artists.',
    fields: 'Dance, performance, theatre, visual art and more: existing works, works in progress and brand-new ideas.',
    closing: 'The way is open. We can’t wait to see your proposals.',
    ctaPrimary: 'Submit a proposal',
    ctaSecondary: 'Discover the festival',
  },
  about: {
    title: 'What’s burning?',
    paragraphs: [
      'Medorot sets out to create an encounter between contemporary art and the Jewish world, in all its many shades.',
      'The festival takes fire as a symbol of the inner flame that burns in every artist’s heart, and spreads it as a way of keeping the embers of Jewish culture alive.',
      'By bringing together artists and makers from different generations, the festival hopes to open a space for dialogue, experiment and new work.',
    ],
    words: ['Fire', 'Embers', 'Tradition', 'Generations', 'Creation', 'Encounter'],
    nameNote: 'Medorot: medurot, “bonfires”, and dorot, “generations”. The artist’s inner fire, and the meeting of generations of artists, makers and community members.',
  },
  openCall: {
    paragraphs: [
      'Artists, makers, students and collectives: Medorot invites you to submit proposals for projects and works for the festival!',
      'We are looking for proposals across the arts: dance, performance, theatre, visual art, music, sound, video, installation, art in public space and more. We welcome work in every format: existing pieces, projects in development and new ideas alike.',
      'Medorot sets out to create an encounter between contemporary art and the Jewish world, in all its many shades. We are interested in connections to tradition and sources, texts and prayers, rituals, history, Jewish identity and culture. We’d love proposals that offer a fresh reading, a personal interpretation, an unexpected connection or a different way of looking at this encounter.',
    ],
    spaces: 'The synagogue stands at the heart of the festival’s artistic thinking, alongside other spaces in Jerusalem. We invite proposals that respond to the place itself, its character and its meaning, as well as works that want to step out into the courtyard, the street, public space or alternative venues.',
    who: 'The open call is open to students, emerging artists, practising artists, independent makers, groups and collectives.',
    stages: {
      idea: { label: 'Initial idea', desc: 'A project that hasn’t yet begun its development.' },
      developing: { label: 'In development', desc: 'A work that is already being made.' },
      existing: { label: 'Existing work', desc: 'A project that is complete and ready to be shown.' },
      new: { label: 'New work for the festival', desc: 'An idea for a piece to be developed especially for Medorot.' },
    },
    stagesNote: 'You don’t need a finished piece. Ideas at their very beginning are welcome too.',
    disciplines: ['Dance', 'Performance', 'Visual art', 'Theatre', 'Music / Sound', 'Video / Film', 'Installation / Spatial art', 'Art in public space', 'Other'],
    criteriaIntro: 'Proposals will be considered against the following criteria:',
    criteria: [
      'Originality and artistic quality.',
      'Connection to the festival’s interests and artistic direction.',
      'A link to the Jewish world, in its cultural, historical and personal aspects.',
      'Suitability for the festival’s spaces and the ways work can be shown in them.',
      'Potential for development, creation and meeting an audience.',
    ],
  },
  spaces: {
    galleries: {
      name: 'The Synagogue Galleries',
      desc: 'Two galleries for visual art: painting, printmaking, sculpture, photography and video.',
      photos: {
        gallery2_2: 'Gallery 2: a long carpeted corridor beside a glass wall that looks onto the synagogue hall',
        gallery2_1: 'Gallery 2: looking along the gallery, with a wooden wall and windows on one side and glass on the other',
        gallery2_3: 'Gallery 2: the gallery, with a view through the glass into the main hall',
        gallery2_4: 'Gallery 2: the end of the gallery, a wooden wall and a tall window',
        hall_gallery1_below: 'Gallery 1 seen from below, from the synagogue hall',
        hall_gallery2_below_3: 'Gallery 2 seen from below, its windows above the hall',
      },
    },
    hall: {
      name: 'The Main Synagogue Hall',
      desc: 'A space for performance, dance and theatre.',
      photos: {
        hall_1: 'The main synagogue hall: a grid-patterned stone floor and a triangular skylight',
        hall_2: 'The synagogue hall: the Torah ark and the bimah (the raised reading platform)',
        hall_4: 'The synagogue hall: a wide view of the bimah, with daylight from the skylight',
        hall_5: 'The synagogue hall: a view from the far end',
        hall_gallery2_below_1: 'The synagogue hall and the gallery above it',
        hall_gallery2_below_6: 'The synagogue hall: the bimah, the columns and the gallery',
        hall_gallery2_below_2: 'The synagogue hall: looking towards the entrance and the gallery',
      },
    },
    patio: {
      name: 'The Entrance Patio and Bleachers',
      desc: 'An open gathering space for performances, DJs and encounters between artists, community members and audiences.',
      photos: {
        patio_2: 'The entrance patio: a Jerusalem-stone courtyard, trees and the front of the synagogue',
        patio_1: 'The entrance patio: the stone courtyard facing the synagogue’s glass front',
      },
    },
  },
  support: {
    title: 'Lighting the fire together',
    paragraphs: [
      'Medorot was born of a wish to open a space for creation, encounter and new thinking.',
      'We believe art needs room to burn, and that independent work needs people who believe in it.',
      'We invite you to be part of the festival and to support independent art in Jerusalem.',
      'Every bit of support helps us give artists and makers the chance to show new work, develop ideas, create encounters and light more sparks of creativity.',
    ],
    closing: 'Join us and become a partner in creation.',
    button: 'Support the festival',
    notLive: 'Online support isn’t open yet. We’ll update this page as soon as it is. In the meantime, you can reach us on Instagram.',
  },
  finalCta: {
    text: 'Got an idea? Make way for it, and send it in.',
    button: 'Submit a proposal',
  },
  confirmation: {
    title: 'Your proposal is on its way to us!',
    lines: [
      'Thank you for taking the time to think with us about Medorot 2027.',
      'We’ve received your submission, and we’ll be in touch.',
      'Good luck, and perhaps we’ll see you around the bonfire.',
    ],
  },
  partners: {
    'kol-haneshama.png': 'Kol HaNeshama Congregation',
    'jcu.png': 'JCU',
    'bk.png': 'Partner (ant logo)',
  },
}

// Exact translations of Hebrew texts that differ from the seed: versions the team has published from the admin, and
// earlier wordings. Key = the Hebrew text exactly as published (spacing and line breaks don't matter).
// When the team edits a Hebrew text in the CMS, either add its English in the admin's English tab, or add a line here.
export const MEMORY: Record<string, string> = {
  // published 24.11.2026
  'על הפסטיבל': 'About the festival',
  'מְדּוֹרוֹת': 'Medorot',
  'פרשנות': 'Interpretation',
  'שבטיות': 'Tribe',
  'הד': 'Echo',
  'הצתה': 'Ignition',
  'פמיניזם': 'Feminism',
  'הרבה פעמים, נראה לנו שיצירה אמנותית ועולם היהדות רחוקים או אפילו מתנגשים אחד בשנייה. \nלשם כך אנחנו, טהר דהאן ונוה מושון, אמנים ירושלמים, יצרנו את- פסטיבל מְדּוֹרוֹת שנועד לפרוץ את הסטיגמה הזו ולפתוח את עולם היהדות לאלפי פנים וצורות, מתוך ההבנה שליהדות אין צורה אחת נכונה.':
    'Art-making and the Jewish world can often seem far apart, or even at odds with each other. That is why we, Tahar Dahan and Naveh Moshon, two Jerusalem artists, created Medorot: a festival that sets out to break this stigma and open the Jewish world to a thousand faces and forms, knowing that Judaism has no single right shape.',
  'הפסטיבל, שיתקיים בחודש מאי בבית הכנסת הרפורמי-שוויוני ׳כל הנשמה׳, מבקש ליצור מפגש בין אמנות מציתה מחשבה לעולם היהודי, על שלל גווניו. ':
    'The festival, taking place in May at Kol HaNeshama, an egalitarian Reform synagogue in Jerusalem, sets out to create an encounter between art that sparks thought and the Jewish world, in all its many shades.',
  'הפסטיבל שיתקיים לרגל ל״ג בעומר, יעסוק באש כסמל לבעירה פנימית בליבו של היוצר.ת ויבקש להתבונן בחג מחדש, ולהציע פרשנות נוספת לחגיגתו.':
    'Held around Lag BaOmer, the spring holiday traditionally marked with bonfires, the festival explores fire as a symbol of the inner flame in the artist’s heart, and invites a fresh look at the holiday and a new way of celebrating it.',
  'גלריה 1: קצה הגלריה': 'Gallery 1: the end of the gallery',
  'מרחב מפגש פתוח למיצגים ומפגש בין אמנים, חברי הקהילה והקהל.': 'An open gathering space for performances and encounters between artists, community members and audiences.',
  'מציתות ביחד אש': 'Kindling the fire together',
  'מְדּוֹרוֹת נוצר מתוך רצון לפתוח מרחב ליצירה, למפגש ולמחשבה חדשה.\nהפסטיבל נתמך ע״י ארגון JCU ועמותת בר-קיימא.':
    'Medorot was born of a wish to open a space for creation, encounter and new thinking. The festival is supported by JCU and the Bar-Kayma association.',
  'אנחנו מאמינות שאמנות צריכה מרחב לבעור בו, ושיצירה עצמאית זקוקה לא.נשים שמאמינים בה.': 'We believe art needs room to burn, and that independent work needs people who believe in it.',
  'אנחנו מזמינות אתכם.ן להיות חלק מהפסטיבל ולתמוך ביצירה אמנותית עצמאית בירושלים.': 'We invite you to be part of the festival and to support independent art in Jerusalem.',
  'אמנים.ות, יוצרים.ות, סטודנטים.ות וקולקטיבים - פסטיבל מְדּוֹרוֹת מזמין אתכם.ן להגיש הצעות לפרויקטים וליצירות לקראת הפסטיבל':
    'Artists, makers, students and collectives: the Medorot festival invites you to submit proposals for projects and works for the festival.',
  'מדורות מבקש ליצור מפגש בין אמנות מציתה מחשבה לעולם היהודי, על שלל גווניו. אנחנו מתעניינים בחיבורים למסורת, למקורות, לטקסטים, לתפילות, לטקסים, להיסטוריה, לזהות ולתרבות היהודית. נשמח להצעות שמציעות קריאה חדשה, פרשנות אישית, חיבור בלתי צפוי או נקודת מבט אחרת על המפגש הזה.':
    'Medorot sets out to create an encounter between art that sparks thought and the Jewish world, in all its many shades. We are interested in connections to tradition and sources, texts and prayers, rituals, history, Jewish identity and culture. We’d love proposals that offer a fresh reading, a personal interpretation, an unexpected connection or a different way of looking at this encounter.',
  'בית הכנסת עומד במרכז המחשבה האמנותית של הפסטיבל. אנחנו מזמינים הצעות שמתייחסות למקום עצמו, לאופיו ולמשמעותו, וכן עבודות שמבקשות להשתמש במרחבי בית הכנסת באופן המגיב להם.':
    'The synagogue stands at the heart of the festival’s artistic thinking. We invite proposals that respond to the place itself, its character and its meaning, as well as works that set out to use the synagogue’s spaces in a way that responds to them.',
  'מאי 2027': 'May 2027',
  // the success line before the reply timeline was dropped (still in the published version until it is republished)
  'קיבלנו את ההגשה שלכם.ן ונחזור אליכם.ן בהתאם ללוח הזמנים שיפורסם.': 'We’ve received your submission and will get back to you according to the timeline we’ll publish.',
  // the wording before "תרומה" became "תמיכה בפסטיבל" (still in the published version until it is republished)
  'לתרומה': 'Support the festival',
  'התרומות המקוונות עדיין לא פעילות. נעדכן כאן ברגע שיהיו. בינתיים אפשר לפנות אלינו באינסטגרם.': 'Online support isn’t open yet. We’ll update this page as soon as it is. In the meantime, you can reach us on Instagram.',
  'כל תרומה עוזרת לנו לאפשר לאמנים ויוצרים להציג עבודות חדשות, לפתח רעיונות, ליצור מפגשים ולהדליק עוד ניצוצות של יצירה.':
    'Every bit of support helps us give artists and makers the chance to show new work, develop ideas, create encounters and light more sparks of creativity.',
}
