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

const styleValue = (element, property, cssProperty = property, styleFor) => {
  if (!element) return '';
  const computed = styleFor
    ? styleFor(element)
    : typeof getComputedStyle === 'function'
      ? getComputedStyle(element)
      : null;
  return computed?.[property]
    || computed?.getPropertyValue?.(cssProperty)
    || element.style?.getPropertyValue?.(cssProperty)
    || element.style?.getPropertyValue?.(property)
    || '';
};

const availableControl = (element) => Boolean(
  element
    && !element.disabled
    && element.getAttribute('aria-disabled') !== 'true'
);

export const fillsDocumentWidth = (box, doc) => Boolean(
  box
    && doc?.documentElement?.clientWidth > 0
    && Math.abs(box.width - doc.documentElement.clientWidth) <= 2
);

export const matchesFullWidthShellConstrainedInner = (shellBox, innerBox, doc) => {
  if (!fillsDocumentWidth(shellBox, doc) || !innerBox) return false;
  const leftInset = innerBox.left - shellBox.left;
  const rightInset = shellBox.right - innerBox.right;
  return innerBox.width <= shellBox.width + 2
    && leftInset >= -2
    && rightInset >= -2
    && Math.abs(leftInset - rightInset) <= 2;
};

export const hasMeaningfulTransformTransition = (style, reducedMotion = false) => {
  const properties = String(style?.transitionProperty ?? '').split(',').map((entry) => entry.trim());
  const durations = String(style?.transitionDuration ?? '').split(',').map((entry) => milliseconds(entry.trim()));
  const thresholdMs = reducedMotion ? 1 : 0;
  return properties.some((property, propertyIndex) =>
    ['all', 'transform'].includes(property)
      && (durations[propertyIndex] ?? durations[0] ?? 0) > thresholdMs);
};

export const phaseDurationMatches = (element, property, cssProperty, expectedDuration, styleFor) => {
  const display = styleValue(element, 'display', 'display', styleFor) || element?.display || '';
  const phaseShell = element?.closest?.('.technology-feature__connector');
  const shellDisplay = styleValue(phaseShell, 'display', 'display', styleFor) || phaseShell?.display || '';
  if (display === 'none' || shellDisplay === 'none') return true;
  const duration = styleValue(element, property, cssProperty, styleFor) || element?.[property] || '';
  return includesDuration(duration, expectedDuration);
};

export const layerTraceMatchesParallax = ({ hidden, start, middle, clamped, reversed }, disabled) => {
  const staysStatic = start === middle && start === clamped && start === reversed;
  if (disabled || hidden) return staysStatic;
  return start !== middle && middle !== clamped && middle === reversed;
};

export function auditApprovedMotionContract(doc, manifest, { reducedMotion = false, styleFor } = {}) {
  const results = [];

  const heroConfig = manifest.hero;
  const hero = doc.querySelector(heroConfig?.selector ?? '.hero');
  const expectedHeroGroups = heroConfig?.entrance?.groups ?? [];
  const heroGroups = hero ? Array.from(hero.querySelectorAll('[data-motion-group]')) : [];
  const actualHeroGroups = heroGroups.map((group) => group.getAttribute('data-motion-group'));
  results.push(check('hero-entrance-groups', Boolean(
    hero
      && expectedHeroGroups.length > 0
      && actualHeroGroups.length === expectedHeroGroups.length
      && actualHeroGroups.every((group, index) => group === expectedHeroGroups[index])
  ), { expected: expectedHeroGroups, actual: actualHeroGroups }));

  const heroDuration = heroConfig?.entrance?.durationMs ?? 600;
  const heroDelays = heroConfig?.entrance?.delayMs ?? [];
  const heroGroupTiming = reducedMotion || expectedHeroGroups.every((groupName, index) => {
    if (groupName === 'specs') return true;
    const group = hero?.querySelector(`[data-motion-group="${groupName}"]`);
    return includesDuration(styleValue(group, 'transitionDuration', 'transition-duration', styleFor), heroDuration)
      && includesDelay(styleValue(group, 'transitionDelay', 'transition-delay', styleFor), heroDelays[index]);
  });
  const specsIndex = expectedHeroGroups.indexOf('specs');
  const specificationRows = hero?.querySelector('[data-motion-group="specs"]')
    ? Array.from(hero.querySelector('[data-motion-group="specs"]').querySelectorAll('.ds-metric-row'))
    : [];
  const expectedRowCount = heroConfig?.entrance?.specificationRowCount ?? 4;
  const rowStagger = heroConfig?.entrance?.specificationRowStaggerMs ?? 90;
  const rowTiming = reducedMotion || (
    specificationRows.length === expectedRowCount
      && specificationRows.every((row, index) =>
        includesDuration(styleValue(row, 'transitionDuration', 'transition-duration', styleFor), heroDuration)
          && includesDelay(
            styleValue(row, 'transitionDelay', 'transition-delay', styleFor),
            (heroDelays[specsIndex] ?? 0) + index * rowStagger
          ))
  );
  results.push(check('hero-entrance-timing', heroGroupTiming && rowTiming, {
    reducedMotion,
    expected: { durationMs: heroDuration, delaysMs: heroDelays, specificationRows: expectedRowCount, rowStaggerMs: rowStagger }
  }));

  const howConfig = manifest.howItWorks;
  const how = doc.querySelector(howConfig?.selector ?? '.how');
  const howSteps = how ? Array.from(how.querySelectorAll(howConfig?.stepSelector ?? '.how-step')) : [];
  const howImages = how ? Array.from(how.querySelectorAll(howConfig?.imageSelector ?? '.how__image')) : [];
  const activeSteps = howSteps.flatMap((step, index) => step.getAttribute('data-step-state') === 'active' ? [index] : []);
  const activeImages = howImages.flatMap((image, index) => image.getAttribute('data-step-state') === 'active' ? [index] : []);
  const cycleState = how?.getAttribute('data-how-cycle');
  const howDuration = milliseconds(styleValue(how, '', '--how-step-duration', styleFor));
  const howImageTiming = reducedMotion || howImages.every((image) => includesDuration(
    styleValue(image, 'transitionDuration', 'transition-duration', styleFor),
    howConfig?.imageTransitionMs
  ));
  results.push(check('how-progression-contract', Boolean(
    how
      && howSteps.length === howConfig?.sequence?.length
      && howImages.length === howConfig?.sequence?.length
      && activeSteps.length === 1
      && activeImages.length === 1
      && activeSteps[0] === activeImages[0]
      && how?.querySelector(howConfig?.progressSelector ?? '.how-step__progress-value')
      && Math.abs(howDuration - Number(howConfig?.durationMs)) <= 1
      && howImageTiming
      && ['running', 'paused'].includes(cycleState)
      && (!reducedMotion || (cycleState === 'paused' && activeSteps[0] === 0))
  ), {
    reducedMotion,
    actual: { steps: howSteps.length, images: howImages.length, activeSteps, activeImages, cycleState, durationMs: howDuration }
  }));

  const howEntrance = howConfig?.entrance;
  const howMediaEntrance = how?.querySelector(howEntrance?.media?.selector ?? '.how__media[data-how-entrance="media"]');
  const howHeadingEntrance = how?.querySelector(howEntrance?.heading?.selector ?? '.how [data-how-entrance="heading"]');
  const howSupportEntrance = how?.querySelector(howEntrance?.support?.selector ?? '.how [data-how-entrance="support"]');
  const howStepEntrances = how
    ? Array.from(how.querySelectorAll(howEntrance?.steps?.selector ?? '.how-step[data-how-entrance="step"]'))
    : [];
  const howMediaTiming = reducedMotion || Boolean(
    howMediaEntrance
      && includesDuration(
        styleValue(howMediaEntrance, 'transitionDuration', 'transition-duration', styleFor),
        howEntrance?.media?.durationMs
      )
      && includesDelay(
        styleValue(howMediaEntrance, 'transitionDelay', 'transition-delay', styleFor),
        howEntrance?.media?.delayMs
      )
  );
  const howStepTiming = reducedMotion || howStepEntrances.every((step, index) =>
    includesDuration(
      styleValue(step, 'transitionDuration', 'transition-duration', styleFor),
      howEntrance?.steps?.durationMs
    ) && includesDelay(
      styleValue(step, 'transitionDelay', 'transition-delay', styleFor),
      howEntrance?.steps?.initialDelayMs + index * howEntrance?.steps?.staggerMs
    ));
  const howIntroTiming = reducedMotion || Boolean(
    howHeadingEntrance
      && howSupportEntrance
      && howHeadingEntrance.getAttribute('data-motion-heading-mode') === 'coherent'
      && includesDuration(
        styleValue(howHeadingEntrance, 'transitionDuration', 'transition-duration', styleFor),
        howEntrance?.heading?.durationMs
      )
      && includesDelay(
        styleValue(howHeadingEntrance, 'transitionDelay', 'transition-delay', styleFor),
        howEntrance?.heading?.delayMs
      )
      && includesDuration(
        styleValue(howSupportEntrance, 'transitionDuration', 'transition-duration', styleFor),
        howEntrance?.support?.durationMs
      )
      && includesDelay(
        styleValue(howSupportEntrance, 'transitionDelay', 'transition-delay', styleFor),
        howEntrance?.support?.delayMs
      )
  );
  results.push(check('how-entrance-contract', Boolean(
    howEntrance
      && howMediaEntrance
      && howEntrance.media.direction === 'down'
      && howEntrance.steps.layoutStatic === true
      && howEntrance.heading.coherent === true
      && howStepEntrances.length === howEntrance.steps.count
      && howMediaTiming
      && howIntroTiming
      && howStepTiming
  ), {
    reducedMotion,
    expected: howEntrance,
    actual: { media: Boolean(howMediaEntrance), heading: Boolean(howHeadingEntrance), support: Boolean(howSupportEntrance), steps: howStepEntrances.length }
  }));

  const technologyConfig = manifest.technology;
  const technology = doc.querySelector(technologyConfig?.selector ?? '.technology');
  const features = technology ? Array.from(technology.querySelectorAll('[data-technology-feature-index]')) : [];
  const sequence = technologyConfig?.annotationEntrance?.sequence ?? [];
  const phaseDelay = technologyConfig?.annotationEntrance?.phaseDelayMs ?? {};
  const unitStagger = technologyConfig?.annotationEntrance?.unitStaggerMs ?? 0;
  const phaseProperties = {
    connector: '--technology-connector-delay',
    icon: '--technology-icon-delay',
    number: '--technology-number-delay',
    title: '--technology-title-delay',
    body: '--technology-body-delay',
  };
  const featureParts = {
    connector: ['.technology-feature__connector path', 'animationDuration', 'animation-duration'],
    icon: ['.technology-feature__icon', 'transitionDuration', 'transition-duration'],
    number: ['.technology-feature__number', 'transitionDuration', 'transition-duration'],
    title: ['.technology-feature__content > h3', 'transitionDuration', 'transition-duration'],
    body: [".technology-feature__content > [data-type-role='body']", 'transitionDuration', 'transition-duration'],
  };
  const phaseDuration = technologyConfig?.annotationEntrance?.phaseDurationMs ?? 0;
  const technologyPhasesValid = Boolean(
    technology
      && sequence.length > 0
      && features.length === sequence.length
      && features.every((feature, index) =>
        feature.getAttribute('data-technology-feature-index') === sequence[index]
          && Object.values(featureParts).every(([selector]) => feature.querySelector(selector))
          && (reducedMotion || Object.values(featureParts).every(([selector, property, cssProperty]) =>
            phaseDurationMatches(feature.querySelector(selector), property, cssProperty, phaseDuration, styleFor)))
          && Object.entries(phaseProperties).every(([phase, property]) =>
            Math.abs(milliseconds(styleValue(feature, '', property, styleFor)) - (index * unitStagger + phaseDelay[phase])) <= 1))
  );
  results.push(check('technology-feature-phases', technologyPhasesValid, {
    expected: { sequence, unitStaggerMs: unitStagger, phaseDelayMs: phaseDelay, phaseDurationMs: phaseDuration },
    actual: features.map((feature) => feature.getAttribute('data-technology-feature-index'))
  }));

  const viewerConfig = technologyConfig?.viewer;
  const media = technology?.querySelector(viewerConfig?.selector ?? '.technology__media')
    ?? doc.querySelector(viewerConfig?.selector ?? '.technology__media');
  const modelState = media?.getAttribute(viewerConfig?.stateAttribute ?? 'data-model-state');
  const poster = media?.querySelector(viewerConfig?.posterSelector ?? '.technology__poster');
  const canvas = media?.querySelector(viewerConfig?.canvasSelector ?? '.technology__canvas');
  const readyViewer = modelState === 'ready'
    && canvas?.getAttribute('role') === 'group'
    && canvas.tabIndex === 0
    && Boolean(canvas.getAttribute('aria-label'));
  const fallbackViewer = ['poster', 'fallback'].includes(modelState)
    && Boolean(poster?.getAttribute('alt'))
    && number(poster?.getAttribute('width')) > 0
    && number(poster?.getAttribute('height')) > 0;
  results.push(check('technology-viewer-fallback', Boolean(media && poster && (readyViewer || fallbackViewer)), {
    expectedInteraction: viewerConfig?.interaction,
    actual: { modelState, poster: Boolean(poster), canvas: Boolean(canvas) }
  }));

  const testimonialConfig = manifest.testimonials;
  const testimonial = doc.querySelector(testimonialConfig?.selector ?? '.testimonial');
  const identities = testimonial ? Array.from(testimonial.querySelectorAll('.testimonial__identity-state')) : [];
  const copies = testimonial ? Array.from(testimonial.querySelectorAll('.testimonial__copy-state')) : [];
  const activeIdentity = identities.flatMap((state, index) => state.getAttribute('data-carousel-state') === 'active' ? [index] : []);
  const activeCopy = copies.flatMap((state, index) => state.getAttribute('data-carousel-state') === 'active' ? [index] : []);
  const activeIndex = number(testimonial?.getAttribute('data-carousel-active-index'));
  const direction = testimonial?.getAttribute('data-carousel-direction');
  const transition = testimonial?.getAttribute('data-carousel-transition');
  const itemCount = testimonialConfig?.carousel?.itemCount ?? 3;
  results.push(check('testimonial-carousel-contract', Boolean(
    testimonial
      && identities.length === itemCount
      && copies.length === itemCount
      && activeIdentity.length === 1
      && activeCopy.length === 1
      && activeIdentity[0] === activeIndex
      && activeCopy[0] === activeIndex
      && ['next', 'previous'].includes(direction)
      && ['true', 'false'].includes(transition)
      && testimonial.querySelector('.testimonial__copy-slot[aria-live="polite"]')
  ), { actual: { itemCount, identities: identities.length, copies: copies.length, activeIndex, activeIdentity, activeCopy, direction, transition } }));
  const testimonialEntrance = testimonialConfig?.entrance;
  const testimonialEntranceParts = testimonialEntrance?.parts ?? [];
  const testimonialEntranceNodes = testimonialEntranceParts.map((part) => testimonial?.querySelector(`[data-testimonial-entrance="${part}"]`));
  const testimonialEntranceTiming = reducedMotion || testimonialEntranceNodes.every((element, index) =>
    includesDuration(styleValue(element, 'transitionDuration', 'transition-duration', styleFor), testimonialEntrance?.durationMs)
      && includesDelay(styleValue(element, 'transitionDelay', 'transition-delay', styleFor), testimonialEntrance?.delayMs?.[index]));
  const testimonialQuote = testimonial?.querySelector('[data-testimonial-entrance="quote"]');
  results.push(check('testimonial-entrance-contract', Boolean(
    testimonial
      && testimonialEntrance?.once === true
      && testimonialEntrance?.coherentText === true
      && testimonialEntranceNodes.length === testimonialEntranceParts.length
      && testimonialEntranceNodes.every(Boolean)
      && testimonialQuote?.getAttribute('data-motion-heading-mode') === 'coherent'
      && testimonialEntranceTiming
  ), {
    reducedMotion,
    expected: testimonialEntrance,
    actual: testimonialEntranceParts.map((part, index) => ({ part, found: Boolean(testimonialEntranceNodes[index]) }))
  }));
  const previousTestimonial = testimonial?.querySelector('[aria-label="Previous testimonial"]');
  const nextTestimonial = testimonial?.querySelector('[aria-label="Next testimonial"]');
  results.push(check('testimonial-controls', Boolean(
    availableControl(previousTestimonial)
      && availableControl(nextTestimonial)
      && previousTestimonial.getAttribute('aria-controls') === 'testimonial-slides'
      && nextTestimonial.getAttribute('aria-controls') === 'testimonial-slides'
  )));

  const footerConfig = manifest.footer;
  const footer = doc.querySelector(footerConfig?.selector ?? '.footer');
  const footerEntrances = footer ? Array.from(footer.querySelectorAll('[data-footer-entrance]')) : [];
  const expectedFooterParts = footerConfig?.entrance?.parts ?? [];
  const actualFooterParts = footerEntrances.map((element) => element.getAttribute('data-footer-entrance'));
  const footerTiming = reducedMotion || footerEntrances.every((element, index) =>
    includesDuration(
      styleValue(element, 'transitionDuration', 'transition-duration', styleFor),
      footerConfig?.entrance?.durationMs ?? 600
    ) && includesDelay(
      styleValue(element, 'transitionDelay', 'transition-delay', styleFor),
      footerConfig?.entrance?.delayMs?.[index]
    ));
  results.push(check('footer-entrance-contract', Boolean(
    footer
      && expectedFooterParts.length > 0
      && actualFooterParts.length === expectedFooterParts.length
      && actualFooterParts.every((part, index) => part === expectedFooterParts[index])
      && footerConfig?.entrance?.headingMode === 'coherent'
      && footerEntrances[0]?.getAttribute('data-motion-heading-mode') === 'coherent'
      && footerTiming
  ), { expected: expectedFooterParts, actual: actualFooterParts, reducedMotion }));
  const footerDepthState = footer?.getAttribute('data-footer-depth');
  results.push(check('footer-depth-contract', Boolean(
    footer?.querySelector(footerConfig?.depth?.selector ?? '.footer__background')
      && footer.querySelector('.footer__inner')
      && ['active', 'static'].includes(footerDepthState)
      && (!reducedMotion || footerDepthState === 'static')
      && footerConfig?.depth?.contentStatic === true
  ), { actual: { depthState: footerDepthState } }));

  const buttonConfig = manifest.sharedButton;
  const buttonLabels = Array.from(doc.querySelectorAll(buttonConfig?.selector ?? '.ds-button .button__label-current'));
  results.push(check('shared-button-contract', Boolean(
    buttonConfig?.type === 'label-blur-pulse'
      && buttonLabels.length >= (buttonConfig?.minimumCount ?? 1)
      && buttonConfig?.durationMs >= 250
      && buttonConfig?.durationMs <= 350
      && buttonConfig?.maximumBlurPx >= 3
      && buttonConfig?.maximumBlurPx <= 5
  ), { actual: { labels: buttonLabels.length }, expectedMinimum: buttonConfig?.minimumCount }));

  const controls = manifest.functionalControls;
  const menuConfig = controls?.headerMenu;
  const menu = doc.querySelector(menuConfig?.selector ?? '.site-header .ds-site-header__menu');
  results.push(check('functional-header-menu', Boolean(
    availableControl(menu)
      && menu.getAttribute('aria-controls') === menuConfig?.controls
      && doc.querySelector(`#${menuConfig?.controls}`)
  )));

  const preorderConfig = controls?.preorderModal;
  const preorderTriggers = Array.from(doc.querySelectorAll(preorderConfig?.triggerSelector ?? '[data-preorder-trigger]'));
  const actualPreorderTriggers = preorderTriggers.map((element) => element.getAttribute('data-preorder-trigger'));
  results.push(check('functional-preorder-triggers', Boolean(
    actualPreorderTriggers.length === preorderConfig?.exactTriggers?.length
      && actualPreorderTriggers.every((trigger, index) => trigger === preorderConfig.exactTriggers[index])
      && preorderTriggers.every(availableControl)
  ), { expected: preorderConfig?.exactTriggers, actual: actualPreorderTriggers }));

  const cookieConfig = controls?.cookieConsent;
  const cookie = doc.querySelector(cookieConfig?.selector ?? '.cookie-consent');
  const preferenceSelector = cookieConfig?.preferenceSelector ?? '[data-cookie-preference]';
  const preferenceSelectorRoot = preferenceSelector.endsWith(']')
    ? preferenceSelector.slice(0, -1)
    : preferenceSelector;
  const cookieButtons = (cookieConfig?.values ?? []).map((value) =>
    cookie?.querySelector(`${preferenceSelectorRoot}="${value}"]`));
  results.push(check('functional-cookie-controls', Boolean(
    (!cookie && cookieConfig?.optionalAfterChoice)
      || (cookie && cookieButtons.length > 0 && cookieButtons.every(availableControl))
  ), { actual: { visible: Boolean(cookie), preferences: cookieConfig?.values } }));

  return results;
}

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
  const dormantMode = state('dormant');
  const dormantStyle = getComputedStyle(nav);
  const dormantSnapshot = {
    opacity: dormantStyle.opacity,
    pointerEvents: dormantStyle.pointerEvents,
    visibility: dormantStyle.visibility,
  };

  window.scrollTo(0, boundaryY + 270);
  await frames();
  trace.push(['up-30', state('dormant') || state('hidden') ? 'hidden' : 'other']);

  window.scrollTo(0, boundaryY + 200);
  await frames();
  trace.push(['up-100', state('compact') ? 'compact' : 'other']);
  const compactSurface = nav.querySelector(config.compactSurfaceSelector ?? "[data-header-state='compact']");
  const navBox = nav.getBoundingClientRect();
  const compactBox = compactSurface?.getBoundingClientRect();
  const compactStyle = compactSurface ? getComputedStyle(compactSurface) : null;
  const blur = compactStyle?.backdropFilter || compactStyle?.webkitBackdropFilter || '';
  const transition = `${compactStyle?.transitionProperty ?? ''} ${compactStyle?.transition ?? ''}`.toLowerCase();
  const compactSnapshot = {
    backgroundColor: compactStyle?.backgroundColor,
    transitionProperty: compactStyle?.transitionProperty,
  };

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
  results.push(check('navigation-dormant-state',
    number(dormantSnapshot.opacity) === 0
      && dormantSnapshot.pointerEvents === 'none'
      && (!dormantMode || dormantSnapshot.visibility === config.dormantVisibility),
    { actual: dormantSnapshot }));
  results.push(check('navigation-compact-surface', Boolean(
    compactSurface
      && compactBox
      && matchesFullWidthShellConstrainedInner(navBox, compactBox, doc)
      && ['none', ''].includes(blur)
      && compactSnapshot.backgroundColor !== 'transparent'
      && compactSnapshot.backgroundColor !== 'rgba(0, 0, 0, 0)'
  ), {
    expected: { geometry: config.compactGeometry, backdropFilter: config.compactBackdropFilter },
    actual: { width: compactBox ? round(compactBox.width) : null, backdropFilter: blur, backgroundColor: compactSnapshot.backgroundColor }
  }));
  results.push(check('navigation-blur-not-animated', !transition.includes('backdrop-filter'), {
    actual: compactSnapshot.transitionProperty
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

  const layersBehave = layers.every((layer, index) => layerTraceMatchesParallax({
    hidden: layer.hidden || layer.hasAttribute('hidden'),
    start: startLayerTransforms[index],
    middle: forwardLayerTransforms[index],
    clamped: clampedLayerTransforms[index],
    reversed: reversedLayerTransforms[index],
  }, disabled));
  results.push(check('hero-graphics-parallax-layers', layersBehave, {
    disabled,
    actual: {
      start: startLayerTransforms,
      middle: forwardLayerTransforms,
      clamped: clampedLayerTransforms,
      reversed: reversedLayerTransforms
    }
  }));

  const movingTransformTransition = layers.some((layer) =>
    hasMeaningfulTransformTransition(getComputedStyle(layer), disabled));
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
  const expectedEase = manifest.tokens?.headingEasing ?? 'cubic-bezier(0.22, 1, 0.36, 1)';
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
  results.push(...auditApprovedMotionContract(doc, manifest, { reducedMotion: reduced }));

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
    schemaVersion: 3,
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
