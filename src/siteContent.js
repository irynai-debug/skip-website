import { assetPath } from './assetPath.js'
import content from './content.json' with { type: 'json' }

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

const FOOTER_DESTINATION_GROUPS = [
  [undefined, undefined, undefined, undefined, DESTINATIONS.reserve],
  [undefined, DESTINATIONS.about, DESTINATIONS.careers, undefined, DESTINATIONS.contact],
  [undefined, undefined, undefined, DESTINATIONS.faq],
]

export const FOOTER_DESTINATIONS = Object.freeze(Object.fromEntries(
  content.footer.groups.flatMap((group, groupIndex) => group.links.map((label, linkIndex) => (
    [label, FOOTER_DESTINATION_GROUPS[groupIndex][linkIndex]]
  ))),
))

export const SOCIAL_DESTINATIONS = Object.freeze({
  Instagram: 'https://www.instagram.com/elissiyas/',
  YouTube: 'https://www.youtube.com/watch?v=B5lzYG83yVQ&list=RDB5lzYG83yVQ&start_radio=1',
  LinkedIn: 'https://www.linkedin.com/in/elisdechart/',
  X: 'https://x.com/DechartElis',
})

export const HERO_COPY = Object.freeze({
  navigation: Object.values(content.navigation.items),
  heading: content.hero.title,
  lead: content.hero.subtitle,
  body: content.hero.description,
  cta: content.cta.reserveSpot,
})

export const HERO_METRICS = Object.freeze(content.hero.metrics.map(({ label, value }) => (
  Object.freeze([label, value])
)))

export const HERO_OUTCOMES = Object.freeze(content.hero.outcomes.map(Object.freeze))

export const HOW_IT_WORKS_COPY = Object.freeze({
  heading: content.howItWorks.title,
  body: content.howItWorks.description,
  primaryCta: content.cta.reserveSpot,
  secondaryCta: content.cta.seeMogoInAction,
})

export const HOW_IT_WORKS_CALLOUTS = Object.freeze(
  ['top', 'middle', 'bottom'].map((position, index) => Object.freeze({
    label: content.howItWorks.callouts[index],
    position,
  })),
)

export const HOW_IT_WORKS_STEPS = Object.freeze(content.howItWorks.steps.map((step) => Object.freeze({
  number: step.number,
  title: step.title,
  body: step.description,
})))

export const HOW_IT_WORKS_STEP_DURATION_MS = 4200

export const getNextHowItWorksStepIndex = (currentIndex) => (
  (currentIndex + 1) % HOW_IT_WORKS_STEPS.length
)

const TECHNOLOGY_FEATURE_PRESENTATION = [
  { icon: `${ICON_ASSET_ROOT}/senses-movement.svg`, side: 'left' },
  { icon: `${ICON_ASSET_ROOT}/adapts-instantly.svg`, side: 'left' },
  { icon: `${ICON_ASSET_ROOT}/natural-support.svg`, side: 'left' },
  { icon: `${ICON_ASSET_ROOT}/provides-assist.svg`, side: 'right' },
  { icon: `${ICON_ASSET_ROOT}/lightweight-design.svg`, side: 'right' },
  { icon: `${ICON_ASSET_ROOT}/built-to-endure.svg`, side: 'right' },
]

export const TECHNOLOGY_FEATURES = Object.freeze(content.technology.features.map((feature, index) => Object.freeze({
  number: feature.number,
  title: feature.title,
  body: feature.description,
  ...TECHNOLOGY_FEATURE_PRESENTATION[index],
})))

const TESTIMONIAL_IMAGES = [
  ASSETS.testimonials.daniel,
  ASSETS.testimonials.maya,
  ASSETS.testimonials.michael,
]

export const TESTIMONIALS = Object.freeze(content.testimonials.items.map((item, index) => Object.freeze({
  name: item.name,
  role: item.role,
  quote: item.quote,
  body: item.description,
  image: TESTIMONIAL_IMAGES[index],
  alt: item.imageAlt,
})))

export const getAdjacentTestimonialIndex = (currentIndex, delta) => (
  (currentIndex + delta + TESTIMONIALS.length) % TESTIMONIALS.length
)

export const FOOTER_COPY = Object.freeze({
  heading: content.footer.title,
  body: content.footer.description,
  cta: content.cta.reserveSpot,
  copyright: content.footer.copyright,
})

export const FOOTER_GROUPS = Object.freeze(content.footer.groups.map((group) => Object.freeze({
  title: group.title,
  links: Object.freeze([...group.links]),
})))
