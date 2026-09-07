'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Container,
  Divider,
  IconButton,
  MetricRow,
  PageGrid,
  SiteHeader,
  Type,
} from '../design-system/index.jsx'
import {
  ASSETS,
  DESTINATIONS,
  HERO_COPY,
  HERO_METRICS,
  HERO_OUTCOMES,
  HOW_IT_WORKS_CALLOUTS,
  HOW_IT_WORKS_COPY,
  HOW_IT_WORKS_STEP_DURATION_MS,
  HOW_IT_WORKS_STEPS,
  TECHNOLOGY_FEATURES,
  TESTIMONIALS,
} from '../siteContent.js'
import { CountUpMetric, MotionHeading, useHeaderMotionState, useHowItWorksProgression, usePointerDepth, useTechnologyAnnotationDepth } from '../motion.jsx'
import { HERO_LAYER_INITIAL_STATE, createTestimonialCarouselController, getCompleteHeroImageStatus, getTechnologyFeatureRevealTiming, heroLayerPairIsReady, transitionHeroLayerState } from '../motionModel.js'
import { TechnologyMedia } from '../TechnologyMedia.js'
import { advanceHowImageDelivery } from '../howImageDelivery.js'

const navTargets = {
  PRODUCT: '#product',
  'HOW IT WORKS': '#how-it-works',
  TECHNOLOGY: '#technology',
  FAQ: DESTINATIONS.faq,
}

const navigation = HERO_COPY.navigation.map((label) => ({ label, href: navTargets[label] }))
const HERO_DEPTH_LAYERS = Object.freeze({
  sky: Object.freeze({ x: 16, y: 8 }),
  foreground: Object.freeze({ x: 3, y: 2 }),
})

function LineText({ text }) {
  return <><span className="ds-sr-only">{text.replaceAll('\n', ' ')}</span><span className="line-text" aria-hidden="true">{text.split('\n').map((line) => <span key={line}>{line}</span>)}</span></>
}

export function Header() {
  const { open, setOpen, mode, introComplete } = useHeaderMotionState()
  const headerRef = useRef(null)
  const compact = mode === 'compact'
  const hidden = mode === 'hidden' || mode === 'dormant'

  useEffect(() => {
    if (!open) return undefined
    headerRef.current?.querySelector('#primary-navigation a')?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        window.requestAnimationFrame(() => headerRef.current?.querySelector('.ds-site-header__menu')?.focus())
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, setOpen])

  const moveToReserve = () => {
    setOpen(false)
    window.location.assign(DESTINATIONS.reserve)
  }

  return (
    <div
      ref={headerRef}
      className={`site-header site-header--${mode} ${!introComplete ? 'site-header--intro' : ''}`}
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
    >
      <SiteHeader
        logo={ASSETS.logo}
        basketIcon={ASSETS.basket}
        navigation={navigation}
        state={compact ? 'compact' : 'hero'}
        menuOpen={open}
        onMenuToggle={() => setOpen((current) => !current)}
        onNavigate={() => setOpen(false)}
        onBasketActivate={moveToReserve}
        onPreorderActivate={() => setOpen(false)}
        preorderTrigger="header"
      />
    </div>
  )
}

export function HeroOutcomeMetrics({ outcomes = HERO_OUTCOMES }) {
  const [countersActive, setCountersActive] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const settledQa = new URLSearchParams(window.location.search).get('qa') === 'settled'
    if (reducedMotion || settledQa) setCountersActive(true)
  }, [])

  const activateCounters = useCallback((event) => {
    if (event.target === event.currentTarget && event.propertyName === 'opacity') {
      setCountersActive(true)
    }
  }, [])

  return (
    <div
      className="hero__outcomes"
      data-motion-group="outcomes"
      data-count-group="hero-outcomes"
      data-count-ready={countersActive}
      onTransitionEnd={activateCounters}
    >
      {outcomes.map((outcome, index) => (
        <React.Fragment key={outcome.value}>
          {index > 0 && <Divider variant="subtle-vertical" />}
          <div className="hero-outcome">
            <Type role="label"><LineText text={outcome.label} /></Type>
            <Type role="number-large"><CountUpMetric value={outcome.value} active={countersActive} /></Type>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export function Hero() {
  const heroRef = useRef(null)
  const heroLayerImages = useRef({ sky: null, foreground: null })
  const [heroLayerStatus, setHeroLayerStatus] = useState(HERO_LAYER_INITIAL_STATE)
  const heroLayersReady = heroLayerPairIsReady(heroLayerStatus)
  usePointerDepth(heroRef, HERO_DEPTH_LAYERS)

  const recordHeroLayerResult = useCallback((layer, status, image) => {
    if (image && heroLayerImages.current[layer] !== image) return
    setHeroLayerStatus((current) => transitionHeroLayerState(current, layer, status))
  }, [])

  const setSkyImageRef = useCallback((image) => { heroLayerImages.current.sky = image }, [])
  const setForegroundImageRef = useCallback((image) => { heroLayerImages.current.foreground = image }, [])

  useEffect(() => {
    Object.entries(heroLayerImages.current).forEach(([layer, image]) => {
      const status = getCompleteHeroImageStatus(image)
      if (status) recordHeroLayerResult(layer, status, image)
    })
  }, [recordHeroLayerResult])

  return (
    <>
      <span className="hero-parallax-anchor" data-motion-hero-parallax-anchor aria-hidden="true" />
      <section
        ref={heroRef}
        className="hero"
        id="product"
        data-ds-theme="inverse"
        data-motion-section
        data-motion-hero
        data-motion-hero-parallax
        data-motion-hero-parallax-speed="0.04"
        data-motion-hero-parallax-distance="24"
        style={{ '--hero-background': ASSETS.heroBackground.cssImageSet }}
      >
        <div className="hero__scene" aria-hidden="true">
          <span className="hero__background hero__background--fallback" data-motion-hero-graphic hidden={heroLayersReady}>
            <img
              src={ASSETS.heroBackground.src}
              srcSet={ASSETS.heroBackground.srcSet}
              sizes={ASSETS.heroBackground.sizes}
              width={ASSETS.heroBackground.width}
              height={ASSETS.heroBackground.height}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </span>
          <span className="hero__depth-layer hero__depth-layer--sky" data-depth-layer="sky" hidden={!heroLayersReady}>
            <img
              ref={setSkyImageRef}
              src={ASSETS.heroSky.src}
              srcSet={ASSETS.heroSky.srcSet}
              sizes={ASSETS.heroSky.sizes}
              width={ASSETS.heroSky.width}
              height={ASSETS.heroSky.height}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={(event) => recordHeroLayerResult('sky', 'loaded', event.currentTarget)}
              onError={(event) => recordHeroLayerResult('sky', 'error', event.currentTarget)}
            />
          </span>
          <span className="hero__depth-layer hero__depth-layer--foreground" data-depth-layer="foreground" hidden={!heroLayersReady}>
            <img
              ref={setForegroundImageRef}
              src={ASSETS.heroForeground.src}
              srcSet={ASSETS.heroForeground.srcSet}
              sizes={ASSETS.heroForeground.sizes}
              width={ASSETS.heroForeground.width}
              height={ASSETS.heroForeground.height}
              alt=""
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={(event) => recordHeroLayerResult('foreground', 'loaded', event.currentTarget)}
              onError={(event) => recordHeroLayerResult('foreground', 'error', event.currentTarget)}
            />
          </span>
          <span className="hero__scene-glow" data-motion-hero-graphic />
          <span className="hero__scene-vignette" data-motion-hero-graphic />
        </div>
        <PageGrid className="hero__grid">
          <div className="hero__title-block hero__copy">
            <div className="hero__heading-motion" data-motion-group="heading"><MotionHeading as="h1" role="display" lines={HERO_COPY.heading.split('\n')} motionMode="coherent" /></div>
            <div className="hero__lead-motion" data-motion-group="support"><Type role="body-large" className="hero__lead"><LineText text={HERO_COPY.lead} /></Type></div>
          </div>
          <div className="hero__product-metrics" data-motion-group="specs">
            {HERO_METRICS.map(([label, value]) => <MetricRow label={label} value={value} key={label} />)}
          </div>
          <div className="hero__lower-copy" data-motion-group="lower-left">
            <Type role="body"><LineText text={HERO_COPY.body} /></Type>
            <div className="hero__action"><Button data-preorder-trigger="hero" size="large">{HERO_COPY.cta}</Button></div>
          </div>
          <HeroOutcomeMetrics />
        </PageGrid>
      </section>
    </>
  )
}

function HowStepProgress({ active, onComplete }) {
  return (
    <span className="how-step__progress" aria-hidden="true">
      <svg className="how-step__progress-ring" viewBox="0 0 64 64" focusable="false">
        <circle className="how-step__progress-base" cx="32" cy="32" r="18" />
        {active && (
          <circle
            className="how-step__progress-value"
            cx="32"
            cy="32"
            r="18"
            pathLength="1"
            onAnimationEnd={onComplete}
          />
        )}
      </svg>
    </span>
  )
}

function useHowImageDelivery(activeStepIndex, stepCount) {
  const [deliveredIndexes, setDeliveredIndexes] = useState(() => (
    advanceHowImageDelivery(undefined, activeStepIndex, stepCount)
  ))

  useEffect(() => {
    setDeliveredIndexes((current) => advanceHowImageDelivery(current, activeStepIndex, stepCount))
  }, [activeStepIndex, stepCount])

  return deliveredIndexes
}

export function HowItWorks() {
  const {
    sectionRef,
    activeStepIndex,
    isCycleRunning,
    advanceStep,
    stepStates,
  } = useHowItWorksProgression(HOW_IT_WORKS_STEPS.length)
  const deliveredImageIndexes = useHowImageDelivery(activeStepIndex, HOW_IT_WORKS_STEPS.length)

  return (
    <section
      ref={sectionRef}
      className="how"
      id="how-it-works"
      data-nav-content-start
      data-motion-section
      data-how-cycle={isCycleRunning ? 'running' : 'paused'}
      style={{ '--how-step-duration': `${HOW_IT_WORKS_STEP_DURATION_MS}ms` }}
    >
      <div className="how__media motion-parallax" data-how-entrance="media" data-motion-parallax data-motion-speed="0.05" data-motion-scale="1.08">
        <div className="how__image-stack motion-parallax__image">
          {ASSETS.howItWorks.map((asset, index) => {
            const imageState = stepStates[index].imageState
            const shouldDeliverImage = deliveredImageIndexes.has(index)
            return (
              <img
                className="how__image"
                data-step-state={imageState}
                data-image-delivery={shouldDeliverImage ? 'loaded' : 'deferred'}
                src={shouldDeliverImage ? asset.src : undefined}
                srcSet={shouldDeliverImage ? asset.srcSet : undefined}
                sizes={shouldDeliverImage ? asset.sizes : undefined}
                width={asset.width}
                height={asset.height}
                alt={imageState === 'active' ? `MO/GO How It Works step ${HOW_IT_WORKS_STEPS[index].number}` : ''}
                aria-hidden={imageState === 'active' ? undefined : true}
                loading="lazy"
                decoding="async"
                key={asset.src}
              />
            )
          })}
        </div>
        <div className={`how__callouts${stepStates[0].calloutsActive ? ' how__callouts--active' : ''}`} aria-hidden="true">{HOW_IT_WORKS_CALLOUTS.map(({ label, position }) => <Type as="span" role="body" className={`how-callout how-callout--${position}`} key={position}><LineText text={label} /></Type>)}</div>
      </div>
      <div className="how__content" id="reserve">
        <div className="how__intro">
          <MotionHeading as="h2" role="h1" lines={HOW_IT_WORKS_COPY.heading.split('\n')} motionMode="coherent" data-how-entrance="heading" />
          <div className="how__support" data-how-entrance="support" data-ds-exempt="Reference-specific supporting copy color"><Type role="body-large"><LineText text={HOW_IT_WORKS_COPY.body} /></Type></div>
        </div>
        <ol className="how__steps">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const state = stepStates[index]
            return <li className={`how-step${state.stepState === 'active' ? ' how-step--active' : ''}`} data-how-entrance="step" style={{ '--how-step-index': index }} data-step-state={state.stepState} aria-current={state.stepState === 'active' ? 'step' : undefined} key={step.number}><HowStepProgress active={state.ringActive} onComplete={advanceStep} /><div><Type as="h3" role="h3" data-ds-exempt="Reference-specific active and inactive step color">{step.title}</Type><Type role="body" data-ds-exempt="Reference-specific active and inactive step color">{step.body}</Type></div><Type as="span" role="number-small" data-ds-exempt="Reference-specific active and inactive step state">{step.number}</Type></li>
          })}
        </ol>
        <div className="how__actions">
          <Button data-preorder-trigger="how-it-works" size="large">{HOW_IT_WORKS_COPY.primaryCta}</Button>
          <Button href="#technology" variant="secondary" size="large">{HOW_IT_WORKS_COPY.secondaryCta}</Button>
        </div>
      </div>
    </section>
  )
}

function TechnologyFeature({ feature, index }) {
  const connectors = {
    '01': { path: 'M0 28 H118 L190 86 H220', dot: [220, 86] },
    '02': { path: 'M0 52 H220', dot: [220, 52] },
    '03': { path: 'M0 44 H124 L188 18 H220', dot: [220, 18] },
    '04': { path: 'M220 28 H102 L30 86 H0', dot: [0, 86] },
    '05': { path: 'M220 42 H112 L34 66 H0', dot: [0, 66] },
    '06': { path: 'M220 38 H116 L38 -25 H0', dot: [0, -25] },
  }
  const connector = connectors[feature.number]
  const timing = getTechnologyFeatureRevealTiming(index)
  return (
    <li
      className={`technology-feature technology-feature--${feature.side}`}
      data-technology-feature-index={feature.number}
      style={{
        '--technology-connector-delay': `${timing.connectorDelayMs}ms`,
        '--technology-icon-delay': `${timing.iconDelayMs}ms`,
        '--technology-number-delay': `${timing.numberDelayMs}ms`,
        '--technology-title-delay': `${timing.titleDelayMs}ms`,
        '--technology-body-delay': `${timing.bodyDelayMs}ms`,
      }}
    >
      <img className="technology-feature__icon" src={feature.icon} alt="" aria-hidden="true" />
      <div className="technology-feature__content">
        <Type as="span" role="number-small" className="technology-feature__number" data-ds-exempt="Reference-specific annotation accent">{feature.number}</Type>
        <Type as="h3" role="label">{feature.title}</Type>
        <Type role="body" data-ds-exempt="Reference-specific annotation hierarchy"><LineText text={feature.body} /></Type>
      </div>
      <svg className="technology-feature__connector" viewBox="0 0 220 104" preserveAspectRatio="none" aria-hidden="true"><path d={connector.path} vectorEffect="non-scaling-stroke" pathLength="1" /><circle cx={connector.dot[0]} cy={connector.dot[1]} r="4.5" /></svg>
    </li>
  )
}

export function Technology() {
  const sectionRef = useTechnologyAnnotationDepth()
  const indexedFeatures = TECHNOLOGY_FEATURES.map((feature, index) => ({ feature, index }))
  const left = indexedFeatures.filter(({ feature }) => feature.side === 'left')
  const right = indexedFeatures.filter(({ feature }) => feature.side === 'right')

  return (
    <section ref={sectionRef} className="technology" id="technology" data-ds-theme="inverse" data-motion-section data-technology-depth="static" data-model-interacting="false" aria-labelledby="technology-title">
      <h2 className="ds-sr-only" id="technology-title" data-motion-static>MO/GO technology</h2>
      <Container className="technology__stage">
        <ul className="technology__features technology__features--left">{left.map(({ feature, index }) => <TechnologyFeature feature={feature} index={index} key={feature.number} />)}</ul>
        <TechnologyMedia modelSrc={ASSETS.technologyModel} poster={ASSETS.technology} />
        <ul className="technology__features technology__features--right">{right.map(({ feature, index }) => <TechnologyFeature feature={feature} index={index} key={feature.number} />)}</ul>
      </Container>
    </section>
  )
}

export function Testimonial() {
  const [carouselState, setCarouselState] = useState({
    activeIndex: 0,
    previousIndex: null,
    direction: 'next',
    hasTransition: false,
  })
  const reducedMotion = useRef(false)
  const carouselController = useRef(null)
  const { activeIndex, previousIndex, direction, hasTransition } = carouselState
  const testimonial = TESTIMONIALS[activeIndex]

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const controller = createTestimonialCarouselController({
      length: TESTIMONIALS.length,
      reducedMotion: () => reducedMotion.current,
      setTimer: (callback, delay) => window.setTimeout(callback, delay),
      clearTimer: (timer) => window.clearTimeout(timer),
      onStateChange: setCarouselState,
    })
    carouselController.current = controller
    const updateMotionPreference = () => { reducedMotion.current = mediaQuery.matches }
    updateMotionPreference()
    mediaQuery.addEventListener?.('change', updateMotionPreference)
    return () => {
      controller.cleanup()
      carouselController.current = null
      mediaQuery.removeEventListener?.('change', updateMotionPreference)
    }
  }, [])

  const changeTestimonial = (delta) => carouselController.current?.move(delta)

  const stateFor = (index) => index === activeIndex ? 'active' : index === previousIndex ? 'leaving' : 'inactive'

  return (
    <section
      className="testimonial"
      id="testimonial"
      data-motion-section
      data-carousel-active-index={activeIndex}
      data-carousel-previous-index={previousIndex ?? ''}
      data-carousel-direction={direction}
      data-carousel-transition={hasTransition}
      aria-labelledby="testimonial-title"
      aria-roledescription="carousel"
    >
      <Type as="h2" role="label" id="testimonial-title" className="ds-sr-only" data-motion-static>Testimonials</Type>
      <PageGrid className="testimonial__grid">
        <div className="testimonial__identity">
          {TESTIMONIALS.map((item, index) => {
            const state = stateFor(index)
            return <figure className="testimonial__identity-state testimonial__state" data-carousel-state={state} data-carousel-direction={direction} data-carousel-transition={hasTransition} aria-hidden={state !== 'active'} key={item.name}>
              <img data-testimonial-entrance="portrait" src={item.image.src} srcSet={item.image.srcSet} sizes={item.image.sizes} width={item.image.width} height={item.image.height} alt={item.alt} loading="lazy" decoding="async" />
              <figcaption className="testimonial__caption" data-ds-exempt="Structural caption wrapper; child text owns DS roles">
                <Type role="label" data-testimonial-entrance="name" data-motion-static data-ds-exempt="Reference-specific testimonial color">{item.name}</Type>
                <Type role="label" data-testimonial-entrance="role" data-ds-exempt="Reference-specific testimonial secondary color">{item.role}</Type>
              </figcaption>
            </figure>
          })}
        </div>
        <div className="testimonial__quote">
          <div className="testimonial__copy-slot" id="testimonial-slides" aria-live="polite" aria-atomic="true">
            {TESTIMONIALS.map((item, index) => {
              const state = stateFor(index)
              return <div className="testimonial__copy-state testimonial__state" data-carousel-state={state} data-carousel-direction={direction} data-carousel-transition={hasTransition} aria-hidden={state !== 'active'} key={item.name}>
                <MotionHeading as="blockquote" role="h2" lines={item.quote.split('\n')} motionMode="coherent" data-testimonial-entrance="quote" data-ds-exempt="Reference-specific testimonial color" />
                <div className="testimonial__support" data-testimonial-entrance="support"><Type role="body-large" data-ds-exempt="Reference-specific testimonial secondary color"><LineText text={item.body} /></Type></div>
              </div>
            })}
            <Type as="span" role="label" className="ds-sr-only">Testimonial {activeIndex + 1} of {TESTIMONIALS.length}: {testimonial.name}</Type>
          </div>
          <div className="testimonial__arrows" data-testimonial-entrance="navigation">
            <IconButton label="Previous testimonial" variant="outline-ink" glyphSize="large" iconSource={ASSETS.arrowLeft} aria-controls="testimonial-slides" onClick={() => changeTestimonial(-1)} />
            <IconButton label="Next testimonial" variant="outline-ink" glyphSize="large" iconSource={ASSETS.arrowRight} aria-controls="testimonial-slides" onClick={() => changeTestimonial(1)} />
          </div>
        </div>
      </PageGrid>
    </section>
  )
}
