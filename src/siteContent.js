import { assetPath } from './assetPath.js'

export const SITE_SECTIONS = Object.freeze([
  { id: 'hero', reference: '1.png' },
  { id: 'how-it-works', reference: '2.png' },
  { id: 'technology', reference: '3.png' },
  { id: 'testimonial', reference: '4.png' },
  { id: 'footer', reference: '5.png' },
])

const OPTIMIZED_ASSET_ROOT = assetPath('/assets/skip/optimized')
const ICON_ASSET_ROOT = assetPath('/assets/skip/icons')

const responsiveAsset = ({ stem, widths, width, height, sizes, densityBase }) => {
  const sources = Object.freeze(widths.map((candidateWidth) => Object.freeze({
    src: `${OPTIMIZED_ASSET_ROOT}/${stem}-${candidateWidth}.webp`,
    width: candidateWidth,
  })))

  return Object.freeze({
    src: sources.at(-1).src,
    sources,
    srcSet: sources.map(({ src, width: candidateWidth }) => `${src} ${candidateWidth}w`).join(', '),
    sizes,
    width,
    height,
    ...(densityBase ? {
      cssImageSet: `image-set(${sources.map(({ src, width: candidateWidth }) => `url("${src}") ${candidateWidth / densityBase}x`).join(', ')})`,
    } : {}),
  })
}

export const ASSETS = Object.freeze({
  logo: `${ICON_ASSET_ROOT}/Logo.svg`,
  basket: `${ICON_ASSET_ROOT}/basket.svg`,
  arrowLeft: `${ICON_ASSET_ROOT}/arrow-left.svg`,
  arrowRight: `${ICON_ASSET_ROOT}/arrow-right.svg`,
  heroBackground: responsiveAsset({
    stem: 'hero',
    widths: [800, 1600, 2400, 3200],
    width: 6668,
    height: 4993,
    sizes: '(max-width: 820px) 100vw, 1600px',
    densityBase: 1600,
  }),
  heroSky: responsiveAsset({
    stem: 'hero-sky',
    widths: [800, 1600, 2400, 3200],
    width: 6668,
    height: 4993,
    sizes: '100vw',
  }),
  heroForeground: responsiveAsset({
    stem: 'hero-foreground',
    widths: [800, 1600, 2400, 3200],
    width: 6668,
    height: 4993,
    sizes: '100vw',
  }),
  howItWorks: Object.freeze([
    responsiveAsset({ stem: 'how-01', widths: [480, 800, 1134], width: 1134, height: 1387, sizes: '(max-width: 820px) 108vw, 54vw' }),
    responsiveAsset({ stem: 'how-02', widths: [480, 800, 1600], width: 4536, height: 5548, sizes: '(max-width: 820px) 108vw, 54vw' }),
    responsiveAsset({ stem: 'how-03', widths: [480, 800, 1600], width: 4492, height: 5548, sizes: '(max-width: 820px) 108vw, 54vw' }),
    responsiveAsset({ stem: 'how-04', widths: [480, 800, 1600], width: 4536, height: 5548, sizes: '(max-width: 820px) 108vw, 54vw' }),
  ]),
  technology: responsiveAsset({ stem: 'technology', widths: [480, 768, 1536], width: 1536, height: 1024, sizes: '(max-width: 480px) 450px, (max-width: 820px) 630px, 981px' }),
  technologyModel: assetPath('/assets/skip/mogo-device.meshopt.glb'),
  footerBackground: Object.freeze({ src: `${OPTIMIZED_ASSET_ROOT}/footer-1721.webp`, width: 1721, height: 914 }),
  preorderModalBackground: responsiveAsset({ stem: 'modal', widths: [800, 1600, 3200], width: 4340, height: 3784, sizes: '(max-width: 480px) 100vw, (max-width: 820px) 90vw, 950px' }),
  testimonials: {
    daniel: responsiveAsset({ stem: 'testimonial-daniel', widths: [192, 384], width: 1254, height: 1254, sizes: '(max-width: 480px) 96px, (max-width: 820px) 128px, 176px' }),
    maya: responsiveAsset({ stem: 'testimonial-maya', widths: [192, 384], width: 1254, height: 1254, sizes: '(max-width: 480px) 96px, (max-width: 820px) 128px, 176px' }),
    michael: responsiveAsset({ stem: 'testimonial-michael', widths: [192, 384], width: 1254, height: 1254, sizes: '(max-width: 480px) 96px, (max-width: 820px) 128px, 176px' }),
  },
  progressActive: `${ICON_ASSET_ROOT}/progress-active.svg`,
  progressInactive: `${ICON_ASSET_ROOT}/progress-inactive.svg`,
  social: {
    instagram: `${ICON_ASSET_ROOT}/instagram.svg`,
    youtube: `${ICON_ASSET_ROOT}/youtube.svg`,
    linkedin: `${ICON_ASSET_ROOT}/linkedin.svg`,
    twitter: `${ICON_ASSET_ROOT}/x-twitter.svg`,
  },
})

export const DESTINATIONS = Object.freeze({
  home: 'https://www.skipwithjoy.com/',
  reserve: 'https://www.skipwithjoy.com/reserve/p/style-01-ej5na-hbs9d',
  learn: 'https://www.skipwithjoy.com/learn',
  faq: 'https://www.skipwithjoy.com/faq',
  about: 'https://www.skipwithjoy.com/aboutus',
  careers: 'https://www.skipwithjoy.com/careers',
  contact: 'mailto:hello@skipwithjoy.com',
  linkedin: 'https://www.linkedin.com/company/skipwithjoy',
})

export const FOOTER_DESTINATIONS = Object.freeze({
  'MO/GO Overview': undefined,
  'Key Features': undefined,
  'Product Design': undefined,
  'Tech Specifications': undefined,
  'Pre-Order': DESTINATIONS.reserve,
  'Our Mission': undefined,
  'About Skip': DESTINATIONS.about,
  Careers: DESTINATIONS.careers,
  'News & Press': undefined,
  'Contact Us': DESTINATIONS.contact,
  'How It Works': undefined,
  Technology: undefined,
  'User Stories': undefined,
  FAQs: DESTINATIONS.faq,
})

export const SOCIAL_DESTINATIONS = Object.freeze({
  Instagram: 'https://www.instagram.com/elissiyas/',
  YouTube: 'https://www.youtube.com/watch?v=B5lzYG83yVQ&list=RDB5lzYG83yVQ&start_radio=1',
  LinkedIn: 'https://www.linkedin.com/in/elisdechart/',
  X: 'https://x.com/DechartElis',
})

export const HERO_COPY = Object.freeze({
  navigation: ['PRODUCT', 'HOW IT WORKS', 'TECHNOLOGY', 'FAQ'],
  heading: 'MEET\nNEW\nMO/GO',
  lead: 'Wearable tech for more freedom\nin every step you make.',
  body: 'MO/GO helps you go further, climb higher\nand stay active—so you can keep exploring\nwhat moves you.',
  cta: 'RESERVE YOUR SPOT',
})

export const HERO_METRICS = Object.freeze([
  ['Uphill Support', '+40%'],
  ['Impact Reduction', '-30%'],
  ['Battery Life', '8+ hrs'],
  ['Weight', '1.8 kg'],
])

export const HERO_OUTCOMES = Object.freeze([
  { label: 'REDUCTION IN\nLEG STRAIN', value: '30%' },
  { label: 'MORE ENDURANCE\nON EVERY HIKE', value: '2.5x' },
])

export const HOW_IT_WORKS_COPY = Object.freeze({
  heading: 'HOW IT\nWORKS',
  body: 'Getting started with MO/GO is simple.\nFour steps to more freedom in every step.',
  primaryCta: 'RESERVE YOUR SPOT',
  secondaryCta: 'SEE MO/GO IN ACTION',
})

export const HOW_IT_WORKS_CALLOUTS = Object.freeze([
  { label: 'Power in motion', position: 'top' },
  { label: 'Adaptive\nsupport', position: 'middle' },
  { label: 'Built to\nmove', position: 'bottom' },
])

export const HOW_IT_WORKS_STEPS = Object.freeze([
  { number: '01', title: 'Take the first step', body: 'Tell us about your goals and how you move.' },
  { number: '02', title: 'Find your fit', body: 'We recommend the right MO/GO system for you.' },
  { number: '03', title: 'Get set up', body: 'Receive your system and set it up with guidance.' },
  { number: '04', title: 'Move with confidence', body: 'Wear, adapt, and go further with every step.' },
])

export const HOW_IT_WORKS_STEP_DURATION_MS = 4200

export const getNextHowItWorksStepIndex = (currentIndex) => (
  (currentIndex + 1) % HOW_IT_WORKS_STEPS.length
)

export const TECHNOLOGY_FEATURES = Object.freeze([
  { number: '01', title: 'SENSES MOVEMENT', body: 'Advanced sensors detect\nyour movement and terrain\nin real time.', icon: `${ICON_ASSET_ROOT}/senses-movement.svg`, side: 'left' },
  { number: '02', title: 'ADAPTS INSTANTLY', body: 'Smart algorithms adjust\nsupport to your pace,\nstride, and activity.', icon: `${ICON_ASSET_ROOT}/adapts-instantly.svg`, side: 'left' },
  { number: '03', title: 'NATURAL SUPPORT', body: 'Works with your body\n— not against it.', icon: `${ICON_ASSET_ROOT}/natural-support.svg`, side: 'left' },
  { number: '04', title: 'PROVIDES ASSIST', body: 'Targeted power delivers\nextra boost when you need\nit most.', icon: `${ICON_ASSET_ROOT}/provides-assist.svg`, side: 'right' },
  { number: '05', title: 'LIGHTWEIGHT DESIGN', body: 'Built with premium materials\nto keep you moving freely\nwithout extra weight.', icon: `${ICON_ASSET_ROOT}/lightweight-design.svg`, side: 'right' },
  { number: '06', title: 'BUILT TO ENDURE', body: 'Long-lasting performance\nso you can go further\nwith less fatigue.', icon: `${ICON_ASSET_ROOT}/built-to-endure.svg`, side: 'right' },
])

export const TESTIMONIALS = Object.freeze([
  Object.freeze({
    name: 'DANIEL R.',
    role: 'HIKER & TRAVELER',
    quote: 'I can hike longer,\nclimb higher and explore\nmore with less strain.',
    body: 'MO/GO gives me the support I need to stay\nactive and keep doing what I love.',
    image: ASSETS.testimonials.daniel,
    alt: 'Daniel, a hiker and traveler, in the mountains',
  }),
  Object.freeze({
    name: 'MAYA L.',
    role: 'TRAIL RUNNER & EXPLORER',
    quote: 'I move with more confidence,\ncover more ground and still have\nenergy left.',
    body: 'MO/GO adapts naturally to my movement, so every\ntrail feels easier and more enjoyable.',
    image: ASSETS.testimonials.maya,
    alt: 'Maya, a trail runner and explorer, on a green hillside',
  }),
  Object.freeze({
    name: 'MICHAEL T.',
    role: 'HIKER & PHOTOGRAPHER',
    quote: 'Steep climbs feel smoother,\nlonger walks feel lighter and I\ncan keep going.',
    body: 'MO/GO helps reduce the effort of each step without\nchanging how I naturally move.',
    image: ASSETS.testimonials.michael,
    alt: 'Michael, a hiker and photographer, on a rocky trail',
  }),
])

export const getAdjacentTestimonialIndex = (currentIndex, delta) => (
  (currentIndex + delta + TESTIMONIALS.length) % TESTIMONIALS.length
)

export const FOOTER_COPY = Object.freeze({
  heading: 'READY TO MOVE\nFURTHER?',
  body: 'Reserve your MO/GO and\ndiscover what’s possible.',
  cta: 'RESERVE YOUR SPOT',
  copyright: '© 2025 Skip. All rights reserved.',
})

export const FOOTER_GROUPS = Object.freeze([
  { title: 'PRODUCT', links: ['MO/GO Overview', 'Key Features', 'Product Design', 'Tech Specifications', 'Pre-Order'] },
  { title: 'COMPANY', links: ['Our Mission', 'About Skip', 'Careers', 'News & Press', 'Contact Us'] },
  { title: 'RESOURCES', links: ['How It Works', 'Technology', 'User Stories', 'FAQs'] },
])
