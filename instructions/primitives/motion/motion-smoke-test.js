const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const frames = async (count = 3) => {
  for (let index = 0; index < count; index += 1) await frame();
};

const number = (value) => {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const milliseconds = (value) => {
  const parsed = number(value);
  return String(value).includes('ms') ? parsed : parsed * 1000;
};

const round = (value) => Math.round(value * 100) / 100;
const check = (id, passed, details = {}) => ({ id, status: passed ? 'pass' : 'fail', ...details });

const includesDuration = (value, expected) => String(value)
  .split(',')
  .some((item) => Math.abs(milliseconds(item.trim()) - expected) <= 1);

const includesDelay = (value, expected) => String(value)
  .split(',')
  .some((item) => Math.abs(milliseconds(item.trim()) - expected) <= 1);

const normalizeEase = (value) => String(value)
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/(^|[,(])0\./g, '$1.');

async function auditNavigation(doc, manifest, results) {
  const config = manifest.navigation;
  if (!config) return;

  const nav = doc.querySelector(config.selector ?? '.site-header');
  const boundary = doc.querySelector(config.boundary ?? '[data-nav-content-start]');
  results.push(check('navigation-elements', Boolean(nav && boundary), {
    selector: config.selector,
    boundary: config.boundary
  }));
  if (!nav || !boundary) return;

  const originalY = window.scrollY;
  const originalBehavior = doc.documentElement.style.scrollBehavior;
  doc.documentElement.style.scrollBehavior = 'auto';
  const state = (name) => nav.classList.contains(`site-header--${name}`);
  const trace = [];

  window.scrollTo(0, 0);
  await frames();
  trace.push(['top', state('hero') ? 'hero' : 'other']);

  const boundaryY = boundary.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, boundaryY + 300);
  await frames();
  trace.push(['cross-down', state('dormant') ? 'dormant' : state('hidden') ? 'hidden' : 'other']);
  const dormantBox = nav.getBoundingClientRect();

  window.scrollTo(0, boundaryY + 270);
  await frames();
  trace.push(['up-30', state('dormant') || state('hidden') ? 'hidden' : 'other']);

  window.scrollTo(0, boundaryY + 200);
  await frames();
  trace.push(['up-100', state('compact') ? 'compact' : 'other']);
  const compactBox = nav.getBoundingClientRect();
  const compactStyle = getComputedStyle(nav);
  const blur = compactStyle.backdropFilter || compactStyle.webkitBackdropFilter || '';
  const transition = `${compactStyle.transitionProperty} ${compactStyle.transition}`.toLowerCase();

  window.scrollTo(0, boundaryY + 235);
  await frames();
  trace.push(['down-35', state('hidden') ? 'hidden' : 'other']);

  window.scrollTo(0, 0);
  await frames();
  trace.push(['return', state('hero') ? 'hero' : 'other']);

  results.push(check('navigation-state-trace',
    trace[0][1] === 'hero'
      && ['dormant', 'hidden'].includes(trace[1][1])
      && trace[2][1] === 'hidden'
      && trace[3][1] === 'compact'
      && trace[4][1] === 'hidden'
      && trace[5][1] === 'hero',
    { actual: trace }));
  results.push(check('navigation-shared-floating-geometry',
    Math.abs(dormantBox.width - compactBox.width) <= 1
      && Math.abs(dormantBox.height - compactBox.height) <= 1,
    {
      actual: {
        dormant: { width: round(dormantBox.width), height: round(dormantBox.height) },
        compact: { width: round(compactBox.width), height: round(compactBox.height) }
      }
    }));
  results.push(check('navigation-constant-blur', blur.includes(`blur(${config.backdropBlur ?? '40px'})`), {
    expected: `blur(${config.backdropBlur ?? '40px'})`,
    actual: blur
  }));
  results.push(check('navigation-blur-not-animated', !transition.includes('backdrop-filter'), {
    actual: compactStyle.transitionProperty
  }));

  window.scrollTo(0, originalY);
  doc.documentElement.style.scrollBehavior = originalBehavior;
  await frames();
}

async function auditParallax(doc, manifest, results, disabled) {
  const originalY = window.scrollY;
  const originalBehavior = doc.documentElement.style.scrollBehavior;
  doc.documentElement.style.scrollBehavior = 'auto';

  for (const [index, item] of (manifest.parallax ?? []).entries()) {
    if (item.enabled === false) continue;
    const container = doc.querySelector(item.selector);
    const image = container?.querySelector('.motion-parallax__image');
    results.push(check(`parallax-${index}-markup`, Boolean(
      container?.matches('[data-motion-parallax].motion-parallax') && image
    ), { selector: item.selector }));
    if (!container || !image) continue;

    if (disabled) {
      results.push(check(`parallax-${index}-mobile-reduced-static`,
        getComputedStyle(image).transform === 'none',
        { actual: getComputedStyle(image).transform }));
      continue;
    }

    const absoluteTop = container.getBoundingClientRect().top + window.scrollY;
    const documentTop = absoluteTop;
    window.scrollTo(0, Math.max(0, absoluteTop - window.innerHeight * 0.75));
    await frames();
    const first = number(getComputedStyle(container).getPropertyValue('--parallax-y'));
    window.scrollTo(0, Math.max(0, absoluteTop - window.innerHeight * 0.25));
    await frames();
    const second = number(getComputedStyle(container).getPropertyValue('--parallax-y'));
    const documentTopAfter = container.getBoundingClientRect().top + window.scrollY;
    const imageStyle = getComputedStyle(image);
    const properties = imageStyle.transitionProperty.split(',').map((entry) => entry.trim());
    const durations = imageStyle.transitionDuration.split(',').map((entry) => milliseconds(entry.trim()));
    const activeTransition = properties.some((property, propertyIndex) =>
      ['all', 'transform'].includes(property) && (durations[propertyIndex] ?? durations[0] ?? 0) > 0);

    results.push(check(`parallax-${index}-moves`,
      Number.isFinite(first) && Number.isFinite(second) && Math.abs(first - second) >= 1,
      { actual: { first, second } }));
    results.push(check(`parallax-${index}-container-stable`, Math.abs(documentTop - documentTopAfter) <= 1, {
      actual: { before: round(documentTop), after: round(documentTopAfter) }
    }));
    results.push(check(`parallax-${index}-no-transform-transition`, !activeTransition, {
      actual: { property: imageStyle.transitionProperty, duration: imageStyle.transitionDuration }
    }));
  }

  window.scrollTo(0, originalY);
  doc.documentElement.style.scrollBehavior = originalBehavior;
  await frames();
}

async function auditHeroGraphicsParallax(doc, manifest, results, disabled) {
  const config = manifest.hero?.graphicsParallax;
  if (!config || config.enabled === false) return;

  const hero = doc.querySelector(config.rootSelector ?? '[data-motion-hero-parallax]');
  const anchor = doc.querySelector(config.anchorSelector ?? '[data-motion-hero-parallax-anchor]');
  const layers = hero ? Array.from(hero.querySelectorAll(config.layerSelector ?? '[data-motion-hero-graphic]')) : [];
  const expectedLayerCount = config.layerCount ?? 3;
  const speed = Number(config.speed ?? 0.04);
  const maximumTravel = Number(config.maximumTravelPx ?? 24);
  const expectedLayers = (config.layers ?? []).map((selector) => doc.querySelector(selector));
  const exactLayerSet = expectedLayers.length === expectedLayerCount
    && expectedLayers.every(Boolean)
    && expectedLayers.every((layer) => layers.includes(layer));
  const exactRootTokens = Number(hero?.getAttribute('data-motion-hero-parallax-speed')) === speed
    && Number(hero?.getAttribute('data-motion-hero-parallax-distance')) === maximumTravel;
  results.push(check('hero-graphics-parallax-markup', Boolean(
    hero?.matches('[data-motion-hero][data-motion-hero-parallax]')
      && anchor
      && layers.length === expectedLayerCount
      && exactLayerSet
      && exactRootTokens
  ), {
    selector: config.rootSelector,
    anchorSelector: config.anchorSelector,
    actual: { layers: layers.length, exactLayerSet, exactRootTokens, anchor: Boolean(anchor) },
    expected: { layers: expectedLayerCount, selectors: config.layers, speed, maximumTravel }
  }));
  if (!hero || !anchor || layers.length !== expectedLayerCount || !exactLayerSet) return;

  const originalY = window.scrollY;
  const originalBehavior = doc.documentElement.style.scrollBehavior;
  doc.documentElement.style.scrollBehavior = 'auto';

  const startY = anchor.getBoundingClientRect().top + window.scrollY;
  const clampY = startY + (maximumTravel / speed) + 16;
  const middleY = startY + (maximumTravel / speed) * 0.5;
  const layerTransforms = () => layers.map((layer) => getComputedStyle(layer).transform);
  const staticSelectors = config.staticSelectors ?? ['.hero', '.hero__scene', '.hero__content'];
  const staticShell = staticSelectors.map((selector) => ({ selector, element: doc.querySelector(selector) }));
  const staticTransforms = () => staticShell.map(({ element }) => element ? getComputedStyle(element).transform : 'missing');

  window.scrollTo(0, startY);
  await new Promise((resolve) => setTimeout(resolve, 1550));
  await frames();
  const start = number(getComputedStyle(hero).getPropertyValue('--hero-graphics-y'));
  const startLayerTransforms = layerTransforms();
  const startStaticTransforms = staticTransforms();

  window.scrollTo(0, middleY);
  await frames();
  const forward = number(getComputedStyle(hero).getPropertyValue('--hero-graphics-y'));
  const forwardLayerTransforms = layerTransforms();
  const forwardStaticTransforms = staticTransforms();

  window.scrollTo(0, clampY);
  await frames();
  const clamped = number(getComputedStyle(hero).getPropertyValue('--hero-graphics-y'));
  const clampedLayerTransforms = layerTransforms();
  const clampedStaticTransforms = staticTransforms();

  window.scrollTo(0, middleY);
  await frames();
  const reversed = number(getComputedStyle(hero).getPropertyValue('--hero-graphics-y'));
  const reversedLayerTransforms = layerTransforms();
  const reversedStaticTransforms = staticTransforms();

  const expectedMiddle = disabled ? 0 : maximumTravel * 0.5;
  const expectedClamped = disabled ? 0 : maximumTravel;
  results.push(check('hero-graphics-parallax-behavior',
    Math.abs(start) <= 0.1
      && Math.abs(forward - expectedMiddle) <= 0.1
      && Math.abs(clamped - expectedClamped) <= 0.1
      && Math.abs(reversed - expectedMiddle) <= 0.1,
    {
      disabled,
      expected: { start: 0, middle: expectedMiddle, clamped: expectedClamped, reversed: expectedMiddle },
      actual: { start, middle: forward, clamped, reversed }
    }));

  const layersBehave = disabled
    ? layers.every((_, index) =>
      startLayerTransforms[index] === forwardLayerTransforms[index]
        && startLayerTransforms[index] === clampedLayerTransforms[index]
        && startLayerTransforms[index] === reversedLayerTransforms[index])
    : layers.every((_, index) =>
      startLayerTransforms[index] !== forwardLayerTransforms[index]
        && forwardLayerTransforms[index] !== clampedLayerTransforms[index]
        && forwardLayerTransforms[index] === reversedLayerTransforms[index]);
  results.push(check('hero-graphics-parallax-layers', layersBehave, {
    disabled,
    actual: {
      start: startLayerTransforms,
      middle: forwardLayerTransforms,
      clamped: clampedLayerTransforms,
      reversed: reversedLayerTransforms
    }
  }));

  const movingTransformTransition = layers.some((layer) => {
    const style = getComputedStyle(layer);
    const properties = style.transitionProperty.split(',').map((entry) => entry.trim());
    const durations = style.transitionDuration.split(',').map((entry) => milliseconds(entry.trim()));
    return properties.some((property, propertyIndex) =>
      ['all', 'transform'].includes(property) && (durations[propertyIndex] ?? durations[0] ?? 0) > 0);
  });
  results.push(check('hero-graphics-parallax-no-transform-transition', !movingTransformTransition));

  const staticShellBehaves = staticShell.every(({ element }, index) =>
    element
      && !element.hasAttribute('data-motion-hero-graphic')
      && startStaticTransforms[index] === forwardStaticTransforms[index]
      && startStaticTransforms[index] === clampedStaticTransforms[index]
      && startStaticTransforms[index] === reversedStaticTransforms[index]);
  results.push(check('hero-graphics-parallax-static-shell', staticShellBehaves, {
    actual: staticShell.map(({ selector, element }) => ({
      selector,
      markedAsGraphic: Boolean(element?.hasAttribute('data-motion-hero-graphic')),
      transforms: element ? {
        start: startStaticTransforms[staticSelectors.indexOf(selector)],
        middle: forwardStaticTransforms[staticSelectors.indexOf(selector)],
        clamped: clampedStaticTransforms[staticSelectors.indexOf(selector)],
        reversed: reversedStaticTransforms[staticSelectors.indexOf(selector)]
      } : 'missing'
    }))
  }));

  window.scrollTo(0, originalY);
  doc.documentElement.style.scrollBehavior = originalBehavior;
  await frames();
}

export async function runMotionSmokeTest(manifest, { doc = document } = {}) {
  if (!manifest || typeof manifest !== 'object') throw new TypeError('motion manifest is required');
  const results = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disabledParallax = reduced || window.matchMedia('(max-width: 640px)').matches;

  results.push(check('accepted-runtime-ready', doc.documentElement.classList.contains('motion-ready')));
  results.push(check('accepted-runtime-armed', doc.documentElement.classList.contains('motion-animate')));

  const rootStyle = getComputedStyle(doc.documentElement);
  const expectedEase = manifest.tokens?.headingEasing ?? 'cubic-bezier(.215, .61, .355, 1)';
  results.push(check('accepted-easing-token',
    normalizeEase(rootStyle.getPropertyValue('--motion-reveal-ease')) === normalizeEase(expectedEase),
    {
      expected: expectedEase,
      actual: rootStyle.getPropertyValue('--motion-reveal-ease').trim()
    }));

  for (const [sectionIndex, sectionConfig] of (manifest.sections ?? []).entries()) {
    const section = doc.querySelector(sectionConfig.selector);
    results.push(check(`section-${sectionIndex}-root`, Boolean(section?.hasAttribute('data-motion-section')), {
      selector: sectionConfig.selector
    }));
    if (!section) continue;

    if (sectionConfig.heading !== false) {
      const heading = section.querySelector('[data-motion-heading]');
      const lines = heading ? Array.from(heading.querySelectorAll('.motion-heading__line > .motion-heading__line-inner')) : [];
      const indexed = lines.every((line, lineIndex) => number(line.style.getPropertyValue('--line-index')) === lineIndex);
      results.push(check(`section-${sectionIndex}-heading-contract`, Boolean(heading && lines.length && indexed), {
        actual: { lines: lines.length, indexed }
      }));
      if (lines[0] && !reduced) {
        const style = getComputedStyle(lines[0]);
        results.push(check(`section-${sectionIndex}-heading-timing`,
          includesDuration(style.transitionDuration, manifest.tokens?.headingDurationMs ?? 900)
            && normalizeEase(style.transitionTimingFunction).includes(normalizeEase(expectedEase)),
          { actual: { duration: style.transitionDuration, easing: style.transitionTimingFunction } }));
      }
    }

    for (const [slideIndex, slideConfig] of (sectionConfig.slides ?? []).entries()) {
      const slide = section.querySelector(slideConfig.selector);
      const expectedType = slideConfig.type ?? 'copy';
      results.push(check(`section-${sectionIndex}-slide-${slideIndex}`, Boolean(
        slide && slide.getAttribute('data-motion-slide') === expectedType
      ), { selector: slideConfig.selector, expectedType }));
      if (slide && !reduced) {
        const expectedDelay = expectedType === 'block' ? 160 : 100;
        const style = getComputedStyle(slide);
        results.push(check(`section-${sectionIndex}-slide-${slideIndex}-timing`,
          includesDuration(style.transitionDuration, 900) && includesDelay(style.transitionDelay, expectedDelay),
          { actual: { duration: style.transitionDuration, delay: style.transitionDelay } }));
      }
    }
  }

  const unaccountedHeadings = Array.from(doc.querySelectorAll('main h1, main h2'))
    .filter((heading) => !heading.hasAttribute('data-motion-heading'))
    .filter((heading) => !heading.closest('[data-motion-static]'));
  results.push(check('all-major-headings-use-accepted-contract', unaccountedHeadings.length === 0, {
    actual: unaccountedHeadings.map((heading) => heading.textContent?.trim().slice(0, 60))
  }));

  if (manifest.hero?.opening) {
    const hero = doc.querySelector(manifest.hero.selector);
    results.push(check('accepted-hero-contract', Boolean(
      hero?.matches('[data-motion-section][data-motion-hero]')
        && hero.querySelector('.hero__scene')
        && hero.querySelector('.hero__copy [data-motion-heading]')
    ), { selector: manifest.hero.selector }));
  }

  await auditHeroGraphicsParallax(doc, manifest, results, disabledParallax);
  await auditNavigation(doc, manifest, results);
  await auditParallax(doc, manifest, results, disabledParallax);

  for (const [index, item] of (manifest.microinteractions ?? []).entries()) {
    const element = doc.querySelector(item.selector);
    const acceptedLabelSwap = item.type !== 'label-swap' || Boolean(
      element?.querySelector('.button__label-current')
        && element.querySelector('.button__label-duplicate[aria-hidden="true"]')
    );
    results.push(check(`microinteraction-${index}`, Boolean(element && acceptedLabelSwap), {
      selector: item.selector,
      type: item.type
    }));
  }

  const failures = results.filter((result) => result.status === 'fail');
  return {
    schemaVersion: 2,
    source: manifest.source,
    generatedAt: new Date().toISOString(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    reducedMotion: reduced,
    passed: failures.length === 0,
    summary: { checks: results.length, failed: failures.length },
    checks: results
  };
}

if (typeof window !== 'undefined') window.SiteMotionSmokeTest = { runMotionSmokeTest };
