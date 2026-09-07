import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react'
import heroSaxophonist from './assets/images/hero-saxophonist.webp'
import missionConductor from './assets/images/mission-conductor.webp'
import missionPianist from './assets/images/mission-pianist.webp'
import missionViolinist from './assets/images/mission-violinist.webp'
import statsDuo from './assets/images/stats-duo.webp'
import testimonialDirectors from './assets/images/testimonial-directors.webp'
import blueInstruments from './assets/images/cta-blue-instruments.webp'
import coralFlutist from './assets/images/cta-coral-flutist.webp'

type ButtonProps = {
  children: ReactNode
  href?: string
  variant?: 'light' | 'mint' | 'dark' | 'blue'
  size?: 'default' | 'compact'
  icon?: string
  className?: string
}

type MotionHeadingProps = {
  as?: 'h1' | 'h2' | 'h3'
  lines: string[]
  className?: string
  id?: string
}

function useMotionEffects() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMotion = window.matchMedia('(max-width: 640px)')
    const motionSections = Array.from(document.querySelectorAll<HTMLElement>('[data-motion-section]'))
    const parallaxElements = Array.from(document.querySelectorAll<HTMLElement>('[data-motion-parallax]'))
    const heroParallax = document.querySelector<HTMLElement>('[data-motion-hero-parallax]')
    const heroParallaxAnchor = document.querySelector<HTMLElement>('[data-motion-hero-parallax-anchor]')

    motionSections.forEach((section) => section.classList.remove('is-inview'))
    root.classList.remove('motion-animate')
    root.classList.add('motion-ready')

    const initialMotionTargets = motionSections.flatMap((section) => Array.from(section.querySelectorAll<HTMLElement>([
      '[data-motion-heading] .motion-heading__line-inner',
      '[data-motion-slide]',
      '.hero__arc',
      '.hero__dots',
      '.hero__musician-layer',
      '.hero__copy .eyebrow',
      '.hero__round-link',
      '.hero__stat',
    ].join(', '))))

    initialMotionTargets.forEach((target) => {
      const style = window.getComputedStyle(target)
      void style.opacity
      void style.transform
      void style.clipPath
    })

    let observer: IntersectionObserver | undefined
    let revealFrameOne = 0
    let revealFrameTwo = 0
    let startObserverAfterLoad: (() => void) | undefined
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      root.classList.add('motion-animate')
      motionSections.forEach((section) => section.classList.add('is-inview'))
    } else {
      const startObserver = () => {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const section = entry.target as HTMLElement
            section.classList.add('is-inview')
            observer?.unobserve(section)
          })
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.04 })
        motionSections.forEach((section) => observer?.observe(section))
      }

      const scheduleObserver = () => {
        revealFrameOne = window.requestAnimationFrame(() => {
          root.classList.add('motion-animate')
          revealFrameTwo = window.requestAnimationFrame(startObserver)
        })
      }

      if (document.readyState === 'complete') {
        scheduleObserver()
      } else {
        startObserverAfterLoad = scheduleObserver
        window.addEventListener('load', startObserverAfterLoad, { once: true })
      }
    }

    let frame = 0
    const updateParallax = () => {
      frame = 0
      const disabled = reducedMotion.matches || mobileMotion.matches

      if (heroParallax) {
        const speed = Number(heroParallax.dataset.motionHeroParallaxSpeed ?? 0.04)
        const maximumTravel = Number(heroParallax.dataset.motionHeroParallaxDistance ?? 24)
        const anchorY = heroParallaxAnchor
          ? heroParallaxAnchor.getBoundingClientRect().top + window.scrollY
          : 0
        const proposedTravel = disabled ? 0 : Math.max(0, window.scrollY - anchorY) * speed
        const travel = Math.max(0, Math.min(maximumTravel, proposedTravel))
        heroParallax.style.setProperty('--hero-graphics-y', `${travel.toFixed(2)}px`)
      }

      parallaxElements.forEach((element) => {
        const scale = Number(element.dataset.motionScale ?? 1.08)
        element.style.setProperty('--parallax-scale', String(scale))

        if (disabled) {
          element.style.setProperty('--parallax-y', '0px')
          return
        }

        const rect = element.getBoundingClientRect()
        const speed = Number(element.dataset.motionSpeed ?? 0.05)
        const nearViewport = rect.bottom > -window.innerHeight && rect.top < window.innerHeight * 2
        element.classList.toggle('is-parallax-near', nearViewport && !disabled)
        const maximumTravel = element.clientHeight * Math.max(0, scale - 1) * 0.5
        const viewportCenter = window.innerHeight * 0.5
        const elementCenter = rect.top + rect.height * 0.5
        const proposedTravel = (viewportCenter - elementCenter) * speed
        const travel = Math.max(-maximumTravel, Math.min(maximumTravel, proposedTravel))
        element.style.setProperty('--parallax-y', `${travel.toFixed(2)}px`)
      })
    }

    const requestParallaxUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true })
    window.addEventListener('resize', requestParallaxUpdate)
    reducedMotion.addEventListener('change', requestParallaxUpdate)
    mobileMotion.addEventListener('change', requestParallaxUpdate)

    return () => {
      observer?.disconnect()
      if (startObserverAfterLoad) window.removeEventListener('load', startObserverAfterLoad)
      if (revealFrameOne) window.cancelAnimationFrame(revealFrameOne)
      if (revealFrameTwo) window.cancelAnimationFrame(revealFrameTwo)
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestParallaxUpdate)
      window.removeEventListener('resize', requestParallaxUpdate)
      reducedMotion.removeEventListener('change', requestParallaxUpdate)
      mobileMotion.removeEventListener('change', requestParallaxUpdate)
      parallaxElements.forEach((element) => element.classList.remove('is-parallax-near'))
      heroParallax?.style.removeProperty('--hero-graphics-y')
      root.classList.remove('motion-animate')
    }
  }, [])
}

function MotionHeading({ as: Heading = 'h2', lines, className, id }: MotionHeadingProps) {
  const accessibleLabel = lines.join(' ')

  return (
    <Heading className={className} id={id} data-motion-heading aria-label={accessibleLabel}>
      <span className="motion-heading__visual" aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <span className="motion-heading__line" key={`${line}-${lineIndex}`}>
            <span
              className="motion-heading__line-inner"
              style={{ '--line-index': lineIndex } as CSSProperties}
            >
              {line}
            </span>
          </span>
        ))}
      </span>
    </Heading>
  )
}

function ButtonLabel({ children }: { children: ReactNode }) {
  const duplicate = typeof children === 'string' ? children : undefined
  return (
    <span className="button__label">
      <span className="button__label-current">{children}</span>
      {duplicate && <span className="button__label-duplicate" aria-hidden="true">{duplicate}</span>}
    </span>
  )
}

export function Icon({ name, brand = false }: { name: string; brand?: boolean }) {
  return <i className={`${brand ? 'fa-brands' : 'fa-solid'} fa-${name}`} aria-hidden="true" />
}

export function Button({ children, href = '#contact', variant = 'light', size = 'default', icon = 'arrow-up-right-from-square', className = '' }: ButtonProps) {
  return (
    <a className={`button button--${variant} button--${size} ${className}`} href={href}>
      <ButtonLabel>{children}</ButtonLabel>
      <Icon name={icon} />
    </a>
  )
}

function Brand({ inverse = false, size = 'default' }: { inverse?: boolean; size?: 'default' | 'compact' }) {
  return (
    <a className={`brand brand--${size} ${inverse ? 'brand--inverse' : ''}`} href="#top" aria-label="WorldProjects home">
      <span className="brand__mark" aria-hidden="true"><i /><i /><i /></span>
      <span>WorldProjects</span>
    </a>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'hero' | 'dormant' | 'hidden' | 'compact'>('hero')
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroComplete(true), 1450)
    return () => window.clearTimeout(introTimer)
  }, [])

  useLayoutEffect(() => {
    let frame = 0
    let lastScrollY = Math.max(0, window.scrollY)
    let direction: 'up' | 'down' | null = null
    let directionDistance = 0
    let pastHero = false

    const resetTravel = (scrollY: number) => {
      lastScrollY = scrollY
      direction = null
      directionDistance = 0
    }

    const update = (resetDirection = false) => {
      frame = 0
      const scrollY = Math.max(0, window.scrollY)
      const contentStart = document.querySelector<HTMLElement>('#festivals')
      const contentTop = contentStart?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY

      if (!pastHero && contentTop <= 0) {
        pastHero = true
        resetTravel(scrollY)
        setOpen(false)
        setMode('dormant')
        return
      }

      if (pastHero && contentTop >= 96) {
        pastHero = false
        resetTravel(scrollY)
        setOpen(false)
        setMode('hero')
        return
      }

      if (!pastHero) {
        resetTravel(scrollY)
        setMode('hero')
        return
      }

      if (resetDirection) {
        resetTravel(scrollY)
        setMode((current) => current === 'hero' ? 'dormant' : current)
        return
      }

      const delta = scrollY - lastScrollY
      lastScrollY = scrollY

      if (Math.abs(delta) < .5) return

      const nextDirection = delta > 0 ? 'down' : 'up'
      if (direction !== nextDirection) {
        direction = nextDirection
        directionDistance = 0
      }

      directionDistance += Math.abs(delta)

      if (direction === 'up' && directionDistance >= 56) {
        directionDistance = 0
        setMode('compact')
      } else if (direction === 'down' && directionDistance >= 24) {
        directionDistance = 0
        setOpen(false)
        setMode((current) => current === 'compact' ? 'hidden' : current)
      }
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => update())
    }

    const requestResizeUpdate = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => update(true))
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestResizeUpdate)
    update(true)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestResizeUpdate)
    }
  }, [])

  const floating = mode !== 'hero'

  return (
    <header
      className={`site-header site-header--${mode} ${floating ? 'site-header--floating' : ''} ${!introComplete ? 'site-header--intro' : ''} ${open ? 'is-open' : ''}`}
      aria-hidden={mode === 'hidden' || mode === 'dormant' ? true : undefined}
      inert={mode === 'hidden' || mode === 'dormant'}
    >
      <Brand inverse={!floating} size={floating ? 'compact' : 'default'} />
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#festivals" onClick={() => setOpen(false)}><span>Festivals</span></a>
        <a href="#tours" onClick={() => setOpen(false)}><span>Tours</span></a>
        <a href="#about" onClick={() => setOpen(false)}><span>About us</span></a>
        <a href="#contact" onClick={() => setOpen(false)}><span>Contact</span></a>
      </nav>
      <Button className="site-header__cta" href="#contact" variant={floating ? 'dark' : 'light'} size={floating ? 'compact' : 'default'}>Plan Your Tour</Button>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
        <Icon name={open ? 'xmark' : 'bars'} />
      </button>
    </header>
  )
}

function Hero() {
  return (
    <section
      className="hero"
      id="top"
      data-motion-section
      data-motion-hero
      data-motion-hero-parallax
      data-motion-hero-parallax-speed="0.04"
      data-motion-hero-parallax-distance="24"
    >
      <div className="hero__scene" aria-hidden="true">
        <div className="hero__arc" data-motion-hero-graphic />
        <div className="hero__dots" data-motion-hero-graphic>
          <span className="hero-dot hero-dot--one" />
          <span className="hero-dot hero-dot--two" />
          <span className="hero-dot hero-dot--three" />
          <span className="hero-dot hero-dot--four" />
        </div>
      </div>
      <div className="hero__content page-grid">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light">Chosen by musicians</p>
          <MotionHeading as="h1" lines={['Music', 'Without', 'Borders']} />
        </div>
        <div className="hero__musician-layer" data-motion-hero-graphic>
          <img className="hero__musician" src={heroSaxophonist} alt="Jazz saxophonist performing" width="1024" height="1536" />
        </div>
        <a className="hero__round-link" href="#tours">
          <Icon name="arrow-up-right" />
          <span>Explore<br />Tours</span>
        </a>
        <div className="hero__stat">
          <strong>40+</strong>
          <span>Years of global<br />music experiences</span>
          <i aria-hidden="true" />
          <a href="#tours"><span>See Our Tours</span> <Icon name="arrow-up-right" /></a>
        </div>
      </div>
    </section>
  )
}

const fanPhotos = [missionConductor, missionPianist, missionConductor, missionViolinist, missionPianist]

function PhotoFan({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`photo-fan ${compact ? 'photo-fan--compact' : 'photo-fan--row'}`} aria-label="Musicians performing on international stages">
      {fanPhotos.map((src, index) => (
        <div
          className="photo-fan__card motion-parallax"
          data-motion-parallax
          data-motion-speed={index === 2 ? '0.035' : index === 1 || index === 3 ? '0.03' : '0.025'}
          data-motion-scale="1.1"
          key={`${src}-${index}`}
        >
          <img className="motion-parallax__image" src={src} alt="" width="1122" height="1402" />
        </div>
      ))}
    </div>
  )
}

function Mission() {
  return (
    <section className="mission section" id="festivals" data-motion-section>
      <div className="mission__intro page-grid">
        <div className="mission__heading">
          <p className="eyebrow">Our mission</p>
          <MotionHeading lines={['Our mission:', 'music that moves', 'the world']} />
        </div>
        <div className="mission__body" data-motion-slide="copy">
          <p>We believe performing abroad transforms musicians — building confidence, connection, and cultural understanding.</p>
          <p>We handle every detail, so ensembles can focus on the music, the moment, and the journey.</p>
        </div>
      </div>
      <div className="mission__stage" aria-hidden="true">
        <div className="mission__ring mission__ring--one" />
        <div className="mission__ring mission__ring--two" />
      </div>
      <PhotoFan />
    </section>
  )
}

const features = [
  { icon: 'globe', title: '40+ years of global trust', text: 'Decades of delivering seamless tours and unforgettable festivals.' },
  { icon: 'people-group', title: 'New ownership, same promise', text: 'A shared commitment to excellence and long-term partnerships.' },
  { icon: 'music', title: 'Crafted for your ensemble', text: 'Custom tours and festivals designed around your goals.' },
]

function About() {
  return (
    <section className="about section" id="about" data-motion-section>
      <div className="marquee" aria-hidden="true">
        <span>Memories ✦ Community ✦ Change ✦ Live Music ✦</span>
      </div>
      <div className="about__orb about__orb--one" aria-hidden="true" />
      <div className="about__orb about__orb--two" aria-hidden="true" />
      <div className="about__content container">
        <p className="eyebrow">About WorldProjects</p>
        <MotionHeading lines={['Built on 40+ years.', 'Powered by new energy.']} />
        <div className="about__support" data-motion-slide="block">
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature" key={feature.title}>
                <Icon name={feature.icon} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
          <Button href="#contact">Plan Your Tour</Button>
        </div>
      </div>
      <PhotoFan compact />
    </section>
  )
}

const stats = [
  ['40+', 'Years of Experience', 'Four decades of trusted leadership in music travel and event production.'],
  ['1,500+', 'Ensembles Served', 'Schools, colleges, and community groups around the globe.'],
  ['35+', 'Countries Visited', 'Bringing performers to iconic stages and cultural destinations worldwide.'],
  ['98%', 'Client Satisfaction', 'Partners return year after year because our impact lasts.'],
]

function Statistics() {
  return (
    <section className="statistics section" id="tours" data-motion-section>
      <div className="statistics__top container">
        <div className="statistics__copy">
          <p className="eyebrow">Statistics</p>
          <MotionHeading lines={['Four decades', 'of music travel', 'that moves']} />
          <p data-motion-slide="copy">World Projects brings ensembles to the world—and the world to them. Our festival productions and custom tours inspire growth, connection, and lifelong impact.</p>
        </div>
        <div className="statistics__media motion-parallax" data-motion-parallax data-motion-speed="0.05" data-motion-scale="1.08">
          <img className="motion-parallax__image" src={statsDuo} alt="Classical violinist and trumpeter performing" width="1536" height="1024" />
        </div>
      </div>
      <div className="stats-grid container" data-motion-slide="block">
        {stats.map(([value, label, description]) => (
          <article className="stat-card" key={label}>
            <strong>{value}</strong>
            <h3>{label}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function BlueCta() {
  return (
    <section className="blue-cta section" data-motion-section>
      <div className="blue-cta__media motion-parallax" data-motion-parallax data-motion-speed="0.04" data-motion-scale="1.1" aria-hidden="true">
        <img className="motion-parallax__image" src={blueInstruments} alt="" width="1536" height="1024" />
      </div>
      <div className="blue-cta__orb blue-cta__orb--one" aria-hidden="true" />
      <div className="blue-cta__orb blue-cta__orb--two" aria-hidden="true" />
      <div className="blue-cta__content container">
        <p className="eyebrow eyebrow--light">Ready to create unforgettable performances?</p>
        <MotionHeading lines={["Let's craft your next", 'music journey—together.']} />
        <div className="blue-cta__support" data-motion-slide="copy">
          <p>From festival stages to customized tours,<br />40+ years of experience.</p>
          <Button href="#contact">Plan Your Tour</Button>
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    role: 'Band Director',
    quote: 'WorldProjects planned every detail of our festival tour with precision. Our students performed on world-class stages and returned inspired. The experience was seamless from start to finish.',
    name: 'Amanda Reynolds',
    title: 'Director of Bands, Northview High School',
    image: testimonialDirectors,
  },
  {
    role: 'Choir Director',
    quote: 'The program gave our singers the confidence to connect with audiences far from home. Every transition felt considered, calm, and deeply personal.',
    name: 'David Morgan',
    title: 'Choir Director, Westbridge College',
    image: missionConductor,
  },
  {
    role: 'Orchestra Leader',
    quote: 'Our musicians came home more connected—to the music, to one another, and to the world. It was the kind of experience that changes an ensemble.',
    name: 'Sofia Chen',
    title: 'Youth Orchestra Conductor',
    image: missionViolinist,
  },
]

function Testimonials() {
  const [current, setCurrent] = useState(0)
  const item = testimonials[current]
  const move = (delta: number) => setCurrent((current + delta + testimonials.length) % testimonials.length)
  return (
    <section className="testimonials section" data-motion-section aria-labelledby="testimonials-title">
      <div className="container">
        <MotionHeading id="testimonials-title" lines={['Trusted by ensemble leaders', 'who tour with confidence']} />
        <article className="testimonial-panel" aria-live="polite">
          <div className="testimonial-card page-grid" data-motion-slide="block">
            <div className="testimonial-card__media motion-parallax" data-motion-parallax data-motion-speed="0.05" data-motion-scale="1.1">
              <img className="motion-parallax__image" src={item.image} alt={`${item.role} reviewing a performance score`} width="1448" height="1086" />
            </div>
            <div className="testimonial-card__content">
              <p className="testimonial-card__role"><span><Icon name="music" /></span>{item.role}</p>
              <blockquote>“{item.quote}”</blockquote>
              <i className="testimonial-card__rule" aria-hidden="true" />
              <p className="testimonial-card__name"><strong>{item.name}</strong><span>{item.title}</span></p>
            </div>
          </div>
        </article>
        <div className="carousel-controls" aria-label="Testimonial controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial"><Icon name="arrow-left" /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next testimonial"><Icon name="arrow-right" /></button>
        </div>
      </div>
    </section>
  )
}

function CoralCta() {
  return (
    <section className="coral-wrap section" id="contact" data-motion-section>
      <div className="coral-cta">
        <div className="coral-cta__media motion-parallax" data-motion-parallax data-motion-speed="0.04" data-motion-scale="1.1" aria-hidden="true">
          <img className="motion-parallax__image" src={coralFlutist} alt="" width="1960" height="802" />
        </div>
        <div className="coral-cta__content">
          <MotionHeading lines={['40+ Years of Music', 'Journeys, Reimagined.']} />
          <div className="coral-cta__support" data-motion-slide="copy">
            <p>WorldProjects partners with ensembles worldwide<br />to create unforgettable festival and performance<br />tours—now under new ownership.</p>
            <Button href="mailto:hello@worldprojects.com">Learn more</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

const footerGroups = [
  ['Product', 'Festival Experiences', 'Tour Programs', 'Custom Productions', 'Destinations', 'Tour Planner'],
  ['Company', 'About WorldProjects', 'Our Story', 'New Ownership', 'Careers', 'News & Updates'],
  ['Resources', 'Program Guide', 'Planning Resources', 'Travel Information', 'FAQs', 'Media Kit'],
  ['Support', 'Contact Us', 'Request a Quote', 'Traveler Support', 'Log In'],
  ['Legal', 'Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'],
]

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__orb footer__orb--one" aria-hidden="true" />
      <div className="footer__orb footer__orb--two" aria-hidden="true" />
      <div className="footer__top container">
        <div className="footer__intro">
          <Brand />
          <p>40+ years creating unforgettable music festivals and performance tours for school, college, and community ensembles around the world.</p>
          <Button variant="mint" href="#festivals">Explore Festivals</Button>
        </div>
        <div className="footer__links">
          {footerGroups.map(([heading, ...links]) => (
            <div key={heading}>
              <h3>{heading}</h3>
              {links.map((link) => <a href="#top" key={link}><span>{link}</span></a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="footer__bottom container">
        <div className="footer__address">
          <span className="footer__seal">W<span>•</span></span>
          <p>World Projects Corporation<br />123 Harmony Way, Suite 200<br />Nashville, TN 37203, USA</p>
        </div>
        <div className="socials" aria-label="Social links">
          <a href="#top" aria-label="Facebook"><Icon name="facebook-f" brand /></a>
          <a href="#top" aria-label="Instagram"><Icon name="instagram" brand /></a>
          <a href="#top" aria-label="YouTube"><Icon name="youtube" brand /></a>
          <a href="#top" aria-label="LinkedIn"><Icon name="linkedin-in" brand /></a>
        </div>
        <p className="footer__copyright">© 2026 World Projects Corporation.<br />All rights reserved.</p>
        <Icon name="globe" />
      </div>
    </footer>
  )
}

function GridOverlay({ active }: { active: boolean }) {
  if (!active) return null
  return <div className="grid-overlay" aria-hidden="true"><i /></div>
}

function DesignSystem() {
  const [grid, setGrid] = useState(false)
  return (
    <main className="design-system">
      <GridOverlay active={grid} />
      <header className="design-system__header container">
        <div><p className="eyebrow eyebrow--blue">WorldProjects</p><h1>Design system</h1></div>
        <div className="design-system__actions">
          <button type="button" className="button button--dark" onClick={() => setGrid(!grid)}><ButtonLabel>{grid ? 'Hide grid' : 'Show grid'}</ButtonLabel><Icon name="border-all" /></button>
          <a className="button button--light" href="/"><ButtonLabel>View page</ButtonLabel><Icon name="arrow-right" /></a>
        </div>
      </header>
      <section className="ds-section container">
        <p className="eyebrow">Foundations / color</p>
        <h2>Section backgrounds</h2>
        <div className="swatches">
          {['blue', 'mint', 'coral', 'paper', 'ink'].map((name) => <div className={`swatch swatch--${name}`} key={name}><span>{name}</span></div>)}
        </div>
      </section>
      <section className="ds-section container">
        <p className="eyebrow">Foundations / type</p>
        <div className="type-specimens">
          <h1>Display — Music without borders</h1>
          <h2>Heading — Built on 40+ years.</h2>
          <h3>Card title — Years of Experience</h3>
          <p>Body — We believe performing abroad transforms musicians, building confidence and connection.</p>
          <small>Label — CHOSEN BY MUSICIANS</small>
        </div>
      </section>
      <section className="ds-section container">
        <p className="eyebrow">Components / actions</p>
        <div className="component-row component-row--dark"><Button>Plan Your Tour</Button><Button variant="mint">Explore Festivals</Button><Button variant="blue">Next story</Button><Button variant="dark">Learn more</Button></div>
        <div className="component-row component-row--compact"><Brand size="compact" /><Button size="compact" variant="dark">Compact action</Button></div>
      </section>
      <section className="ds-section container">
        <p className="eyebrow">Components / icons</p>
        <div className="icon-grid">{['arrow-up-right','globe','people-group','music','arrow-left','arrow-right','instagram','youtube'].map((name) => <span key={name}><Icon name={name} brand={name === 'instagram' || name === 'youtube'} /><small>{name}</small></span>)}</div>
      </section>
      <section className="ds-section container">
        <p className="eyebrow">Components / statistics</p>
        <div className="stats-grid">{stats.slice(0, 3).map(([value,label,description]) => <article className="stat-card" key={label}><strong>{value}</strong><h3>{label}</h3><p>{description}</p></article>)}</div>
      </section>
    </main>
  )
}

function HomePage() {
  return <main className="site-main"><Header /><span data-motion-hero-parallax-anchor aria-hidden="true" /><Hero /><Mission /><Statistics /></main>
}

export function App() {
  useMotionEffects()
  const route = window.location.pathname.replace(/\/+$/, '')
  return route === '/_design-system' ? <DesignSystem /> : <HomePage />
}
