/**
 * English UI strings for the visitor site — keys must mirror vi.js.
 * Any missing key falls back to the Vietnamese text automatically.
 */
export default {
  meta: {
    title: 'Ho Chi Minh City Museum | Audio Guide & Digital Map',
  },

  common: {
    loading: 'Loading...',
    networkError: 'Unable to connect to the server.',
    networkRetry: 'Unable to connect to the server. Please try again.',
    serverDown: 'The server is unreachable, please try again later.',
    backToLookup: '← Back to Artifact Lookup',
    artifactCount: '{count} artifacts',
  },

  header: {
    museumName: 'HO CHI MINH CITY MUSEUM',
    switchLang: 'Change language',
    openMenu: 'Open menu',
    language: 'Language',
  },

  nav: {
    home: 'Home',
    lookup: 'Artifact Lookup',
    map: 'Museum Map',
    tours: 'Collections & Tours',
  },

  footer: {
    museumName: 'Ho Chi Minh City Museum',
    about:
      'The historic Gia Long Palace carries the architectural and historical heritage of Saigon — Ho Chi Minh City, over 300 years in the making.',
    explore: 'Explore',
    featuredArtifacts: 'Featured artifacts',
    featuredCollections: 'Featured collections',
    map2d: '2D map',
    support: 'Support',
    lookup: 'Artifact lookup',
    faq: 'FAQ',
    help: 'Help',
    contact: 'Contact',
    address: '65 Ly Tu Trong St., Ben Nghe Ward, District 1, Ho Chi Minh City',
    copyright: '© {year} Ho Chi Minh City Museum. Designed with senior visitors in mind.',
    terms: 'Terms of use',
    privacy: 'Privacy policy',
  },

  home: {
    eyebrow: 'Bilingual automatic audio guide',
    heroTitle: 'Listen to the stories of old Saigon',
    heroDesc:
      'Welcome to the Ho Chi Minh City Museum. The Audio Guide lets you explore our heritage collection freely on your own phone, in Vietnamese or English.',
    ctaLookup: 'Look up an artifact',
    ctaCollections: 'View collections',
    heroImageAlt: 'Ho Chi Minh City Museum, Gia Long Palace building',
    stepsTitle: 'Get started in 3 simple steps',
    stepsSubtitle: 'No app to install — everything works in your web browser',
    steps: [
      {
        title: 'Scan the artifact QR code',
        desc: 'Look for the QR tags placed next to the display cases. Scan them with your phone camera, or look up the code on this website.',
      },
      {
        title: 'Choose a language & listen',
        desc: 'The narration starts automatically. You can switch between Vietnamese and English (VI/EN) at any time.',
      },
      {
        title: 'Follow a tour route',
        desc: 'Based on where you are, the system suggests suitable routes so you can experience the whole museum.',
      },
    ],
    featuredEyebrow: 'Treasures & Highlights',
    featuredTitle: 'Artifacts not to be missed',
    seeAllCollections: 'See all collections',
    loadingArtifacts: 'Loading artifacts...',
    noArtifacts: 'No artifact data yet. Run DB.sql and then seed_data.sql to create sample data.',
    infoTitle: 'Visitor information',
    infoDesc:
      'Ask our museum staff for assistance and combine it with our smart audio guide for the most complete visit.',
    openingHours: 'Opening hours: 08:00 – 17:00 (daily, including public holidays)',
    address: 'Address: 65 Ly Tu Trong St., District 1, Ho Chi Minh City',
    ticketLocal: 'Vietnamese visitors',
    ticketLocalNote: '50% off for students. Free for seniors and children.',
    ticketForeign: 'International visitors',
    ticketForeignNote: 'Includes free access to the Audio Guide.',
  },

  lookup: {
    eyebrow: 'Artifact Lookup',
    title: 'Find the artifact you are interested in',
    desc: 'Enter an artifact code or name to see its details and listen to the narration — handy for planning your visit or revisiting at home.',
    placeholder: 'Enter an artifact code or name (e.g. SG-1822)...',
    submit: 'Search',
    scanQr: 'Scan QR code',
    notFound: 'No artifact found with code "{code}". You can pick one from the list below.',
    atMuseumTitle: 'Visiting the museum now?',
    atMuseumBefore: 'Every point of interest has a QR code next to it. Scan it with your',
    atMuseumCamera: 'phone camera',
    atMuseumMiddle: 'to open its narration directly, or tap',
    atMuseumAfter: 'to use this device’s camera.',
    resultsFor: 'Results for "{query}"',
    mostViewed: 'Most viewed artifacts',
    loadingList: 'Loading data from the server...',
    noResults: 'No matching artifacts. Try a different code or keyword.',
  },

  artifact: {
    loading: 'Loading artifact information...',
    notFoundTitle: 'Artifact not found',
    notFoundDesc: 'This artifact code does not exist or has been removed.',
    networkTitle: 'Unable to connect to the server',
    narration: 'Narration',
    sourceTts: '(AI-generated voice)',
    sourceRecorded: '(recorded voice)',
    rewind: 'Back 10 seconds',
    forward: 'Forward 10 seconds',
    pause: 'Pause',
    play: 'Play',
    favorite: 'Add to favorites',
    share: 'Share',
    location: 'Location',
    versionVi: 'Bản tiếng Việt',
    versionEn: 'English Version',
    // Shown only while EN is selected and the artifact has no EN translation (backend falls back)
    missingTranslation: 'This artifact has no English version yet — showing the Vietnamese version.',
    transcript: 'Full narration (Transcript)',
  },

  poi: {
    loading: 'Loading point of interest...',
    notFound: 'Point of interest not found',
    artifactsHere: 'Artifacts at this point ({count})',
  },

  qr: {
    opening: 'Opening point of interest {code}...',
    invalid: 'This QR code does not belong to the museum.',
    notFound: 'No point of interest found with code "{code}". It may have been removed or misprinted.',
    lookupByCode: 'Look up an artifact by code',
  },

  scanner: {
    dialogLabel: 'Scan QR code',
    title: 'Scan an artifact QR code',
    close: 'Close',
    errInsecure: 'Browsers only allow camera access on https or localhost pages.',
    errDenied:
      'Camera access has not been allowed. Click the camera icon in the address bar to allow it, then reopen.',
    errNoCamera: 'No camera was found on this device.',
    errBusy: 'The camera is being used by another app (Zoom, Teams...). Close that app and try again.',
    errGeneric: 'Unable to open the camera.',
    starting: 'Opening camera...',
    done: 'Code read, opening point of interest...',
    hint: 'Place the QR code in the middle of the frame and hold still for 1–2 seconds.',
    chooseCamera: 'Choose camera',
    chooseCameraPlaceholder: 'Choose camera...',
    camera: 'Camera {n}',
    fromImage: 'Choose a QR code image',
    noQrInImage: 'No QR code found in the image. Choose a sharp photo taken straight on.',
    fallback: 'Can’t scan? Close this window and type the code printed under the QR (e.g. SG-1822) into the search box.',
  },

  tours: {
    title: 'Collections & Guided Tours',
    desc: 'Explore the museum’s ready-made tour routes — tap a tour to see its stops in order.',
    searchPlaceholder: 'Search tours by name...',
    featured: 'Featured tour routes',
    loading: 'Loading tours...',
    duration: '{minutes} minutes',
    stops: '{count} stops',
    loadingStops: 'Loading stops...',
    noStops: 'This tour has no stops yet.',
    noResults: 'No matching tours. Try a different keyword.',
  },

  map: {
    ariaLabel: 'Map of points of interest',
    resetButton: 'Back to museum',
    resetTitle: 'Return to the museum area',
    noImage: 'No image',
    artifactsHere: 'Artifacts at this point ({count})',
    poiCode: 'Point code (QR)',
    noCode: 'No code',
    room: 'Room',
    noRoom: 'No room information',
    noDescription: 'No description.',
    viewDetails: 'View details',
    viewPoi: 'View point of interest',
    loading: 'Loading points of interest…',
    loadFailed: 'Unable to load the map. Please try again.',
    retry: 'Retry',
    empty: 'There are no points of interest with a location inside the museum area yet.',
    defaultPoiTitle: 'Point of interest',
    defaultArtifactTitle: 'Artifact',
  },
}
