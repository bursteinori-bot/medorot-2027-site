// Every fixed English text of the site. Same shape as he.ts (typed against it): a missing key is a TypeScript error.
// CMS-editable content has its English in content.en.ts.
import { LEGAL_DETAILS as L } from '../content'
import { adminEn } from './admin.en'
import type { Dict, LegalSection } from './he'

export const en: Dict = {
  toggle: { text: 'עב', textLang: 'he', aria: 'Switch to Hebrew (עברית)' },

  meta: {
    site: 'Medorot Festival 2027',
    descriptions: {
      home: 'Medorot 2027, a contemporary art festival in Jerusalem. Open call: Make way… Proposals welcome from artists, makers and collectives.',
      'open-call': 'The Medorot 2027 open call: who can apply, what you can propose, and in which fields.',
      apply: 'Submit a proposal to the Medorot 2027 festival: a four-step form. Ideas at their very beginning are welcome too.',
    },
    ogTitle: 'Medorot Festival 2027',
    ogDescription: 'Jewish art that sparks thought · Open call: Make way…',
    ogLocale: 'en_US',
    ogImageAlt: 'Medorot Festival: the logo and a sculpture creature assembled from sculpture parts, on a yellow background',
  },

  brand: {
    festival: 'Medorot',
    openCallLead: 'Open Call:',
    openCallPunch: 'Make way…',
    logoAlt: 'Medorot Festival',
    logoMarkAlt: 'Medorot Festival emblem',
    fwd: '→',
    back: '←',
  },

  site: {
    skip: 'Skip to content',
    homeLink: 'Medorot, home page',
    mainNav: 'Main navigation',
    room: (n: string) => `Room ${n}`,
    sculpture: 'Shifting sculpture',
    footerNav: 'Footer navigation',
    privacy: 'Privacy policy',
    accessibility: 'Accessibility statement',
    instagram: 'Medorot on Instagram (opens in a new window)',
    festivalDate: 'Festival dates',
    deadline: 'Submission deadline',
    venue: 'Venue',
    keyWords: 'Key words',
    toOpenCall: 'Read the open call',
    disciplines: 'Fields',
    who: 'Who can apply?',
    what: 'What can you propose?',
    spaces: 'The spaces',
    toSpacePhotos: 'See photos of the spaces',
    apply: 'Submit a proposal',
    spacesTitle: 'Festival Spaces',
    enlarge: (alt: string) => `Enlarge: ${alt}`,
    photosHint: (n: number) => `${n} photos · scroll sideways or tap to enlarge`,
    applyTitle: 'Submit a Proposal',
    applyIntro: 'Four short steps, and you can go back at any point without losing what you’ve written.',
    loadingForm: 'Loading the form…',
    detailsTitle: 'Details',
  },

  mobileNav: { open: 'Site menu +', close: 'Close menu ×' },
  lightbox: { close: 'Close ×', prev: 'Previous photo', next: 'Next photo' },
  info: {
    festivalDate: 'Festival dates',
    deadline: 'Submission deadline',
    venue: 'Venue',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    contact: 'Contact',
    partners: 'Partners',
    creators: 'Festival directors',
    creatorsNames: 'Naveh Moshon and Tahar Dahan',
  },

  support: {
    amountLegend: 'Suggested amount',
    amount: (n: number) => `₪${n}`,
    other: 'Other amount',
    otherAria: 'Other amount, in shekels',
    nextPage: 'You’ll enter the amount and payment details on the next page',
    chosen: (n: string) => `You chose ₪${n}: enter it on the next page`,
    opensNewWindow: '(opens in a new window)',
    trust: 'Payment is processed on the secure system of the Kol HaNeshama Congregation (iCredit), which also sends the receipt.',
    instagram: (handle: string) => `Contact us on Instagram @${handle}`,
  },

  sculpture: {
    label: 'A sculpture assembled from original sculpture parts on the festival poster',
    swap: (part: string) => `Swap part: ${part}`,
    parts: {
      yellow_part2: 'The antler crown',
      yellow_part1: 'The bronze body with the eye',
      yellow_part0: 'The silver clover',
      cream_part2: 'The black bird head',
      cream_part0: 'The green body with raised hands',
      cream_part1: 'The silver brooch',
      pink_part1: 'The winged creature',
      pink_part0: 'The silver cross',
    },
    arrangements: {
      yellow: 'The yellow creature, as on the poster',
      cream: 'The ivory creature, as on the poster',
      pink: 'The pink creature, as on the poster',
      'antler-dancer': 'The antler dancer',
      'bird-watcher': 'The watching bird',
      'crowned-wings': 'The crowned winged one',
      'two-heads': 'Two generations',
      reader: 'The reader',
    },
  },

  preview: {
    title: 'Preview',
    note: 'This is how the site will look with the draft. Visitors still see the published version.',
    failed: 'The draft couldn’t be loaded',
  },

  form: {
    steps: ['Personal details', 'The project', 'Materials', 'Final details & submit'],
    stepsAria: 'Form steps',
    stepStatus: (n: number, name: string) => `Step ${n} of 4: ${name}`,
    honeypot: 'Website',
    required: ' (required)',
    optional: ' (optional)',
    words: (n: number, max: number) => `${n} / ${max} words`,
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    age: 'Age',
    city: 'City of residence',
    identity: 'How would you describe yourself?',
    identityOther: 'Please specify',
    bio: 'Tell us about yourself',
    bioHint: 'A few words about your artistic background, the fields you work in and your practice.',
    project: 'Project title',
    disciplines: 'Artistic field',
    disciplinesHint: 'You can choose more than one',
    disciplineOther: 'Which field?',
    description: 'Project description',
    descriptionHint: 'Tell us about the idea, its content and how you imagine the work.',
    location: 'Where would you like to place the project?',
    locationHint: 'Please note: Gallery 2 is not wheelchair accessible.',
    jewish: 'Connection to the Jewish world',
    jewishHint: 'How does your project connect to the Jewish world?',
    stage: 'What stage is the project at?',
    portfolio: 'Portfolio',
    portfolioHint: 'A link to your portfolio or previous work. Portfolio in a PDF? Upload it to Google Drive or Dropbox and share it with anyone who has the link.',
    social: 'Instagram / artist website',
    socialHint: 'A link to your Instagram page or website. Optional.',
    visuals: 'Visual materials for the proposed project',
    visualsHint: 'For an existing work or a project in development, you can attach photos, videos and documentation. For an initial idea, you can attach a mood board, references, sketches, drawings or visualisations.',
    uploadRules: (imgMb: number, mb: number, files: number) =>
      `Images (JPG, PNG, WEBP) up to ${imgMb}MB, resized automatically · PDFs and short videos (MP4, MOV) up to ${mb}MB · up to ${files} files · optional. Long video? Paste a link in the field below.`,
    chooseFiles: '+ Choose files',
    dropHere: 'or drag them here',
    links: 'Links to large files',
    linksHint: 'Long video? Paste a link (Vimeo, YouTube, Drive, etc.). Optional.',
    notes: 'Anything else?',
    notesHint: 'Anything you’d like us to know. Optional.',
    filesToSend: (n: number) => `Files to be sent (${n})`,
    consentBefore: 'I have read the ',
    consentLink: 'privacy policy',
    consentAfter: ' and agree that the materials I have submitted will be used to review my proposal.',
    back: 'Back',
    next: 'Continue',
    sending: 'Sending…',
    retry: 'Try again',
    submit: 'Send proposal',
    errorCount: (n: number) => (n === 1 ? '1 field needs fixing' : `${n} fields need fixing`),
    sendingNote: (withFiles: boolean) => `Sending your proposal${withFiles ? ' and uploading your files' : ''}. Please don’t close this page.`,
    uploaded: (pct: number) => `${pct}% uploaded`,
    ready: (mb: string) => `${mb}MB · ready to upload`,
    remove: 'Remove',
    removeAria: (name: string) => `Remove ${name}`,
    demoStrong: 'This is a prototype for review only.',
    demoText: ' Your proposal was not sent or saved anywhere. On the real site, the confirmation screen appears only after the server confirms that the submission and its files were saved. This is how it will look:',
    backToForm: 'Back to the form',
    closedTitle: 'Online submissions aren’t open yet.',
    closedText: (deadline: string) => `We’ll post an update here and on Instagram as soon as the form opens. Submission deadline: ${deadline}.`,
    identities: { 'סטודנט.ית': 'Student', 'אמן.ית בתחילת הדרך': 'Emerging artist', 'אמן.ית פעיל.ה': 'Practising artist', 'קולקטיב / קבוצה': 'Collective / group', 'אחר': 'Other' },
    disciplineOptions: {
      'מחול': 'Dance',
      'פרפורמנס': 'Performance',
      'אמנות פלסטית': 'Visual art',
      'תיאטרון': 'Theatre',
      'מוזיקה / סאונד': 'Music / Sound',
      'וידאו / קולנוע': 'Video / Film',
      'מיצב / אמנות במרחב': 'Installation / Spatial art',
      'אחר': 'Other',
    },
    locations: { 'חלל בית הכנסת המרכזי': 'Main synagogue hall', 'גלריה 1/2': 'Gallery 1 or 2', 'פטיו': 'Entrance patio', 'פתוח להצעות': 'Open to suggestions' },
  },

  issues: {
    required: 'This field is required',
    tooLong: 'This text is too long',
    email: 'That email address doesn’t look right. Check that it has an @ and a dot, e.g. name@example.com',
    phone: 'That phone number looks too short. Please enter a full number, including the area or country code',
    age: 'Please enter your age in numbers only',
    chooseOne: 'Please choose one option',
    identityOther: 'Tell us in a word or two',
    disciplines: 'Please choose at least one field',
    disciplineOther: 'Which field?',
    stage: 'Please choose the stage that fits best',
    portfolioRequired: 'This field is required. Paste a link to your portfolio',
    portfolioUrl: 'That link doesn’t look right. Paste a full address, e.g. https://...',
    socialUrl: 'That link doesn’t look right',
    privacy: 'To send your proposal, please confirm the privacy policy',
    fileType: 'This file type isn’t supported',
    fileTooBig: (mb: number) => `The file is larger than ${mb}MB`,
    fileTooBigLink: (mb: number) => `The file is larger than ${mb}MB. You can paste a link to it in the links field below`,
    filesBlocked: 'Some files can’t be uploaded. Remove or replace them.',
    words: (what: 'text' | 'description', over: number, max: number) =>
      `Your ${what === 'text' ? 'text' : 'description'} is ${over} ${over === 1 ? 'word' : 'words'} over the limit (up to ${max} words)`,
    check: 'Please check this field',
  },

  errors: {
    generic: 'Something went wrong while sending. Please try again in a moment.',
    genericSaved: 'Something went wrong while sending. Please try again in a moment. Everything you wrote is still in the form.',
    network: 'We can’t reach the server. Check your internet connection and try again. Everything you wrote is still in the form.',
    uploadFailed: (name: string) => `Uploading ${name} failed. Please try again.`,
    uploadNetwork: (name: string) => `Uploading ${name} failed. Check your connection and try again.`,
    server: {
      closed: 'Online submissions aren’t open yet.',
      invalid: 'Some fields need fixing before you can send.',
      rejected: 'We couldn’t accept your submission. Please try again in a moment.',
      rateLimited: 'Too many submissions have been sent from this connection in the past hour. Please try again later.',
      saveFailed: 'We couldn’t save your submission. Please try again in a moment. Everything you wrote is still in the form.',
      badRequest: 'Something was wrong with the request. Please try again.',
      fileNotAnnounced: 'This file wasn’t listed in the submission. Please try sending again.',
      fileTooBig: (detail: string) => `The file is larger than ${detail}MB.`,
      fileTypeMismatch: 'The file type doesn’t match what was declared.',
      fileIncomplete: 'The file didn’t arrive in full. Please try again.',
      notFound: 'We couldn’t find your submission. Please try sending again.',
      filesMissing: (detail: string) => `These files didn’t arrive in full: ${detail}. Please try sending again.`,
    },
  },

  legal: {
    translationNote: 'This English translation is provided for convenience. If it differs from the Hebrew version in any way, the Hebrew version prevails.',
    translationSwitch: 'Read the Hebrew version',
    contactEmail: 'by email at',
    contactPhone: 'or by phone on',
    dateLocale: 'en-GB',
    privacy: {
      title: 'Privacy Policy',
      updated: 'Last updated:',
      sections: [
        {
          title: 'Who we are',
          body: [
            `This website and the open call are run by the team of the Medorot 2027 festival, a contemporary art festival in Jerusalem to be held on Lag BaOmer 2027 (the spring holiday traditionally marked with bonfires) at the Kol HaNeshama Congregation in Baka (the “Festival”, “we” or “us”). The Festival is operated by ${L.operator.en}, amuta (non-profit) no. ${L.amutaNumber}, ${L.address.en}, which owns the database and is responsible for the information collected on the website.`,
            'This policy explains what information is collected on the website and through the application form, why, to whom it may be disclosed, how long it is kept, and what your rights are. It applies to everyone who browses the website and everyone who submits a proposal.',
            'For any privacy matter, including requests to review, correct or delete your information, contact us {contact}.',
          ],
        },
        {
          title: 'What information we collect',
          body: [
            '**When you submit a proposal through the form:**',
            {
              list: [
                'Personal details: full name, email, phone number, age, city of residence, how you describe yourself (for example, as a student or an artist) and a personal statement.',
                'Project details: title, fields, description, preferred location at the venue, connection to the Jewish world and stage of development.',
                'A link to your portfolio, a link to your Instagram or personal website (optional), links to large files, files you upload (images, PDFs and short videos) and notes.',
                'Your consent to this policy, and the time of submission.',
              ],
            },
            '**For security and to prevent flooding:** a one-way encrypted fingerprint (a salted hash) of your IP address, from which the address itself cannot be recovered, and a hidden field that detects automated submission software.',
            '**Anonymous usage statistics:** see “Cookies, browser storage and statistics” below.',
          ],
        },
        {
          title: 'How the information is used',
          body: [
            {
              list: [
                'Review of proposals by the festival team, and selection of works.',
                'Contacting you about your proposal and the results of the selection.',
                'If your proposal is selected: planning, producing and documenting the festival, and publicising your work in coordination with you and with your consent (see “Copyright in the materials you submit”).',
                'Securing the website, preventing misuse, and improving the website on the basis of statistical data only.',
                'Meeting our legal obligations.',
              ],
            },
            'We will not use the information for marketing, will not sell it, and will not pass it on to others for their own purposes. We will not use the information for any purpose other than those set out here without first asking for your consent.',
          ],
        },
        {
          title: 'Consent, and what happens if you don’t provide information',
          body: [
            'Submitting a proposal is voluntary, and providing the information is based on your consent, which you give by ticking the consent box in the form. You are under no legal obligation to provide the information. However, without the fields marked as required we cannot accept and review your proposal.',
            'You may withdraw your consent at any time by contacting us. If you do, we will delete your submission, and your proposal will not be reviewed or will be removed from the selection process.',
          ],
        },
        {
          title: 'Who sees the information',
          body: [
            'Submissions are seen only by authorised members of the festival team, through a password-protected admin system in which permissions are limited by role. The files you upload are not publicly accessible.',
            'The website relies on service providers that process information on our behalf only, according to our instructions and not for their own purposes:',
            {
              list: [
                'Vercel (USA): website hosting and server.',
                'Neon (European Union, Frankfurt): the database, where submissions and files are also stored.',
                'In future we may add a service for sending email messages and notifications. Such a service would also act only as a provider processing information on our behalf, and we will update this policy accordingly.',
              ],
            },
            'If your proposal is selected and details need to be passed to another party for production purposes, we will do so only in coordination with you. We will disclose information to the authorities only if required to do so by law or by court order.',
          ],
        },
        {
          title: 'Supporting the festival and payments',
          body: [
            'Payments to support the festival are made on the secure iCredit payment page operated for the Kol HaNeshama Congregation. Card details are entered only there: our website does not receive or store them. Receipts are issued by Kol HaNeshama. The payment processor’s own privacy policy applies to the information entered on the payment page.',
          ],
        },
        {
          title: 'Transfer of information outside Israel',
          body: [
            'The database and files are stored in the European Union (Frankfurt, Germany), whose data protection laws are recognised as providing adequate protection. The website is hosted by a provider based in the USA, so information passing through the website may also be processed there. Information is transferred in accordance with the Privacy Protection (Transfer of Data to Databases Abroad) Regulations, 5761-2001. By submitting the form, you agree to the transfer of information as described here.',
          ],
        },
        {
          title: 'How long we keep it',
          body: [
            {
              list: [
                'Proposals that are not selected: up to 24 months after the end of the festival, after which they are deleted. This allows us to answer enquiries about the selection process.',
                'Selected proposals: for the duration of the festival and up to 24 months afterwards, and beyond that for as long as needed to document the festival or as required by law.',
                'The encrypted IP fingerprint: no longer than the submission itself is kept.',
                'Usage statistics: up to 13 months.',
              ],
            },
            'You can always ask us to delete your submission sooner. If we would like to keep your details to contact you about future festivals, we will ask for your separate consent.',
          ],
        },
        {
          title: 'Information security',
          body: [
            'We take reasonable, accepted measures to secure the information, in the spirit of the Privacy Protection (Data Security) Regulations, 5777-2017: the connection to the website is encrypted (HTTPS), access to submissions is limited to the team by role and password, files are stored in a closed database rather than at a public address, and every field and file is checked on the server.',
            'No computer system is completely secure, so we cannot guarantee absolute protection against intrusion or unauthorised access. If a security incident affects your information, we will act to limit the damage, inform you, and report it as required by law.',
          ],
        },
        {
          title: 'Your rights',
          body: [
            {
              list: [
                'To review the information held about you (section 13 of the Privacy Protection Law, 5741-1981).',
                'To ask us to correct or delete information that is not accurate, complete, clear or up to date (section 14 of the Law).',
                'To ask us to delete your entire submission or to withdraw your consent, without giving a reason.',
              ],
            },
            'To make a request, contact us {contact}. To protect your information, we may ask you to verify your identity before we respond. We will reply within 30 days. If you are not satisfied with how your request was handled, you can also contact the Privacy Protection Authority.',
          ],
        },
        {
          title: 'Applicants under 18',
          body: [
            'Anyone under 18 may submit a proposal only with the consent of a parent or guardian. By submitting, you confirm that you have received such consent. We may ask the parent or guardian for confirmation, and a parent or guardian may contact us to review the information or ask for it to be deleted.',
          ],
        },
        {
          title: 'Copyright in the materials you submit',
          body: [
            'Copyright and all other intellectual property rights in the works, descriptions and files you submit remain yours. By submitting, you give the Festival a limited, non-exclusive, royalty-free permission to store, copy and show the materials to the festival team, solely for the purpose of reviewing your proposal.',
            'If your proposal is selected, we will use the materials to publicise the festival (for example on the website and on social media) only in coordination with you and with your approval, and with credit to you as the artist. This permission ends when the materials are deleted, except for publications you approved that have already appeared.',
            'By submitting, you confirm that the materials are yours or that you have permission to submit them, and that people who appear in them have agreed to this. You are responsible for the content of the materials and for the rights in them.',
          ],
        },
        {
          title: 'Cookies, browser storage and statistics',
          body: [
            'The website does not use cookies and does not run any third-party tracking or advertising tools.',
            {
              list: [
                '**Form draft:** what you write in the form (text only, no files) is saved only in your own browser (localStorage), so that it isn’t lost if the page is closed. The draft is not sent to us until you submit, and it is deleted after a successful submission. You can delete it at any time by clearing this site’s data in your browser.',
                '**Statistics:** our own statistics system counts page views, device type, city or country (based on the content delivery network), the website you came from, and the step of the form you reached. It uses a random identifier stored only in your browser tab (sessionStorage), which is deleted when you close the tab, and it does not store IP addresses. The data is kept for up to 13 months.',
                'Visitors who have turned on “Do Not Track” or “Global Privacy Control” in their browser are not counted at all.',
              ],
            },
          ],
        },
        {
          title: 'Links to other websites',
          body: [
            'The website contains links to websites and services run by others, such as Instagram, and submissions themselves include links to portfolios and file-hosting services. Those websites operate under their own terms of use and privacy policies; we have no control over them and are not responsible for their content or for how they handle information.',
          ],
        },
        {
          title: 'Changes to this policy',
          body: [
            'We may update this policy from time to time, for example when we add a service provider. The updated version will be published on this page with the date of the update, and any material change will be shown prominently on the website. We will not use information already given to us for a new purpose without your consent.',
          ],
        },
        {
          title: 'Governing law and jurisdiction',
          body: ['This policy and the use of the website are governed solely by the laws of the State of Israel. The competent courts in Jerusalem have exclusive jurisdiction over any matter relating to them.'],
        },
      ] as LegalSection[],
    },
    accessibility: {
      title: 'Accessibility Statement',
      updated: 'Date of this statement:',
      sections: [
        {
          title: 'Our commitment',
          body: [
            'The Medorot festival wants everyone to be able to read about the festival and submit a proposal. We have worked to make the website conform to the Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 5773-2013, including regulation 35, and to Israeli Standard IS 5568, which is based on the WCAG 2.0 guidelines, at level AA.',
          ],
        },
        {
          title: 'What we have done',
          body: [
            {
              list: [
                'Full keyboard navigation, with a clear highlight on the element in focus and a “Skip to content” link.',
                'A proper heading structure and labelled regions, with screen-reader announcements when moving between parts of the site and between the steps of the form.',
                'Alternative text for the venue photos; decorative images are hidden from screen readers.',
                'A label for every form field, error messages in the language of the page that are linked to their field, and automatic focus on the first field that needs correcting.',
                'High colour contrast, and a design that adapts to phones, tablets and computers.',
                'Respect for the operating system’s “reduce motion” setting: animations stop, and all content remains accessible without them.',
                'The sculpture on the home page is a decoration that rearranges itself. It stops when “reduce motion” is on and never hides content. You can click its parts to swap them, but this isn’t needed for anything on the site.',
              ],
            },
          ],
        },
        {
          title: 'Known limitations',
          body: [
            {
              list: [
                'The venue photos have only partial text descriptions. We will gladly describe any space in detail on request.',
                'Content on external websites we link to, such as Instagram, is not under our control.',
              ],
            },
            'We keep testing and improving the website. If any part of it, including the application form, is not accessible to you, contact us and we will help you get the information or submit your proposal another way.',
          ],
        },
        {
          title: 'Physical accessibility at the festival venue',
          body: [
            `The festival will take place at the Kol HaNeshama Congregation, ${L.address.en} (in the Baka neighbourhood).`,
            {
              list: [
                '**Entrance:** step-free accessible entrance.',
                '**Main Synagogue Hall:** wheelchair accessible.',
                '**Gallery 1:** accessible, served by the lift.',
                '**Gallery 2:** not accessible.',
                '**Patio:** accessible, with an accessible route to it.',
                '**Lift:** gives access to Gallery 1 only.',
                '**Toilets:** accessible toilets are available.',
                '**Seating:** spaces for visitors who use wheelchairs.',
                '**Parking:** there is no dedicated disabled parking nearby.',
                '**Hearing:** there is no assistive listening system or induction loop.',
                '**Assistance dogs** are welcome.',
              ],
            },
            '**Known accessibility limitations at the venue:**',
            {
              list: [
                'Gallery 2 is not accessible.',
                'The lift does not reach Gallery 2.',
                'There is no dedicated disabled parking nearby.',
                'There is no induction loop or assistive listening system.',
              ],
            },
            'We’re happy to help you plan your visit: contact the accessibility coordinator.',
          ],
        },
        {
          title: 'Accessibility coordinator and reporting a problem',
          body: [
            `Found a problem, or have a suggestion for improvement? Contact the festival’s accessibility coordinator, ${L.accessibilityCoordinator.en}, {contact}. To help us deal with it quickly, tell us which page it concerns, what the problem is, and which browser or assistive technology you were using.`,
            'We will reply within 5 working days.',
          ],
        },
      ] as LegalSection[],
    },
  },

  admin: adminEn,
}
