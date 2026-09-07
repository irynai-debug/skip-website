/**
 * Portable, dependency-free runtime audit for a production design system.
 *
 * ESM usage:
 *   import {
 *     validateDesignSystemContract,
 *     runDesignSystemAudit,
 *     compareDesignSystemAuditReports
 *   } from './design-system-audit.js';
 *
 *   // Import DS_CONTRACT from the project-owned production entrypoint, then
 *   // capture this on /_design-system (or a document marked data-ds-catalogue):
 *   const catalogueReport = await runDesignSystemAudit({
 *     catalogue: true,
 *     contract: DS_CONTRACT
 *   });
 *
 *   // Capture this on a production route at the same viewport:
 *   const productionReport = await runDesignSystemAudit({
 *     tokenNames: catalogueReport.tokens.map(({ name }) => name),
 *     selectors: {
 *       buttonLikeAnchors: ['a.button', 'a.cta', 'a[data-button]']
 *     }
 *   });
 *
 *   const comparison = compareDesignSystemAuditReports({
 *     productionReports: [productionReport],
 *     catalogueReport
 *   });
 *
 * When this file is loaded as a module in a browser, the same functions are
 * also available on `window.SiteDesignSystemAudit`.
 *
 * Put `data-ds-component`, `data-ds-variant`, and `data-ds-size` on the
 * rendered visual root of every design-system-managed instance. Optional
 * `data-ds-theme`, `data-ds-state`, and `data-ds-part` make cross-page and
 * compound-component comparisons explicit. A `[data-ds-token="--token-name"]`
 * specimen records that custom property's resolved document-root value.
 * A deliberate exception must use a non-empty reason, for example:
 * `data-ds-exempt="Third-party payment widget"`.
 * Editorial text uses `[data-type-role="role-name"]`; visible `h1`–`h6`,
 * `p`, `blockquote`, and `figcaption` elements without a role are reported as
 * unmarked typography.
 *
 * Scope: this primitive verifies the mandatory serialized contract, canonical
 * token specimens, runtime markers, and normalized computed-style consistency.
 * It intentionally does not claim to prove a source import graph.
 */

const DEFAULT_SELECTORS = Object.freeze({
  managed: Object.freeze([
    '[data-ds-component]',
    '[data-ds-variant]',
    '[data-ds-size]',
    '[data-ds-part]',
    '[data-ds-managed]',
    '[data-ds-exempt]'
  ]),
  controls: Object.freeze([
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]'
  ]),
  buttonLikeAnchors: Object.freeze([
    'a.button',
    'a.btn',
    'a[class*="button-" i]',
    'a[class*="btn-" i]',
    'a[data-button]',
    'a[data-cta]'
  ]),
  typography: Object.freeze(['[data-type-role]']),
  editorial: Object.freeze([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'blockquote',
    'figcaption'
  ]),
  ignore: Object.freeze([])
});

// Content-dependent width/height and page-placement properties are excluded
// deliberately. Padding, constraints, alignment, borders, and radius catch
// component geometry drift without treating two differently labelled buttons
// or two differently populated cards as different components.
const DEFAULT_FINGERPRINT_PROPERTIES = Object.freeze({
  typography: Object.freeze([
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'font-stretch',
    'font-variant',
    'font-feature-settings',
    'line-height',
    'letter-spacing',
    'text-transform',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-thickness',
    'text-underline-offset',
    'white-space'
  ]),
  geometry: Object.freeze([
    'display',
    'box-sizing',
    'min-height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'row-gap',
    'column-gap',
    'align-items',
    'justify-content',
    'overflow-x',
    'overflow-y'
  ]),
  colors: Object.freeze([
    'color',
    'background-color',
    'opacity',
    'caret-color',
    'accent-color',
    'fill',
    'stroke'
  ]),
  border: Object.freeze([
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
    'outline-width',
    'outline-style',
    'outline-color',
    'outline-offset'
  ]),
  shadow: Object.freeze([
    'box-shadow',
    'text-shadow',
    'filter',
    'backdrop-filter',
    '-webkit-backdrop-filter'
  ])
});

const ISSUE_LEVELS = new Set(['error', 'warning']);

const trim = (value) => String(value ?? '').trim();

const normalizeToken = (value, fallback = '') => {
  const normalized = trim(value).replace(/\s+/g, ' ');
  return normalized || fallback;
};

const round = (value, precision = 3) => {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

// Computed values are already resolved by the browser; this final pass removes
// insignificant whitespace and sub-pixel noise so JSON fingerprints are stable.
const normalizeCssValue = (value) => trim(value)
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .replace(/\s*([(),/:])\s*/g, '$1')
  .replace(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi, (match) => {
    const number = Number(match);
    if (!Number.isFinite(number)) return match;
    return String(round(number));
  })
  .replace(/(^|[\s(:,])(?:-?0)(px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg)\b/g, '$10');

const normalizeSelectorList = (value, fallback) => {
  if (value === undefined) return [...fallback];
  if (Array.isArray(value)) return value.map(trim).filter(Boolean);
  return trim(value) ? [trim(value)] : [];
};

const makeIssue = (level, code, message, details = {}) => ({
  level: ISSUE_LEVELS.has(level) ? level : 'error',
  code,
  message,
  ...details
});

// These defaults deliberately live in the executable primitive rather than in
// Markdown or project configuration. A catalogue audit therefore has an
// independent minimum contract to enforce even when a caller forgets to map
// site.config.yaml into test code. Project requirements may add stricter roles
// through validateDesignSystemContract(contract, requirements), but may never
// remove or disable this portable baseline.
const DEFAULT_DESIGN_SYSTEM_CONTRACT_REQUIREMENTS = Object.freeze({
  fontRoles: Object.freeze(['primary', 'secondary']),
  gridModes: Object.freeze(['desktop', 'tablet', 'mobile']),
  typographyRoles: Object.freeze([
    'heading-small',
    'heading-medium',
    'heading-large',
    'body-small',
    'body-medium',
    'body-large',
    'body-small-bold',
    'body-medium-bold',
    'body-large-bold',
    'label',
    'metadata'
  ]),
  buttonSizes: Object.freeze(['small', 'medium', 'large']),
  spacingTokens: Object.freeze([
    '--ds-space-xs',
    '--ds-space-s',
    '--ds-space-m',
    '--ds-space-l',
    '--ds-space-xl',
    '--ds-space-2xl',
    '--ds-space-3xl'
  ]),
  radiusTokens: Object.freeze([
    '--ds-radius-small',
    '--ds-radius-medium',
    '--ds-radius-large'
  ]),
  requireIconFamily: true
});

const normalizeContractKey = (value) => trim(value).toLowerCase();
const isCssCustomPropertyName = (value) => /^--[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trim(value));

const contractRequirementList = (requirements, key) => {
  const configured = requirements?.[key];
  const additional = Array.isArray(configured)
    ? configured.map(normalizeContractKey).filter(Boolean)
    : [];
  return Array.from(new Set([
    ...DEFAULT_DESIGN_SYSTEM_CONTRACT_REQUIREMENTS[key],
    ...additional
  ]));
};

const contractTokenName = (entry) => {
  if (Array.isArray(entry)) return trim(entry[1]);
  if (typeof entry === 'string') return trim(entry);
  if (entry && typeof entry === 'object') return trim(entry.token ?? entry.name);
  return '';
};

const collectContractTokenRecords = (contract) => {
  const groups = contract?.tokens;
  if (!groups || typeof groups !== 'object' || Array.isArray(groups)) return [];

  const records = [];
  for (const [group, entries] of Object.entries(groups)) {
    if (!Array.isArray(entries)) continue;
    entries.forEach((entry, index) => {
      records.push({
        group,
        index,
        name: contractTokenName(entry)
      });
    });
  }
  return records;
};

const skippedContractValidation = () => ({
  schemaVersion: 2,
  required: false,
  supplied: false,
  source: null,
  passed: null,
  errors: [],
  warnings: [],
  grid: null,
  summary: {
    required: false,
    supplied: false,
    errors: 0,
    warnings: 0,
    tokenNames: 0,
    duplicateTokenNames: 0
  }
});

/**
 * Validate the portable, code-owned DS_CONTRACT without DOM or dependencies.
 *
 * Optional additive requirement keys are: fontRoles, gridModes,
 * typographyRoles, buttonSizes, spacingTokens, radiusTokens, and
 * requireIconFamily. Empty arrays and false do not weaken the independent
 * mandatory defaults above.
 */
export function validateDesignSystemContract(contract, requirements = {}) {
  const errors = [];
  const warnings = [];
  const fontRoles = contractRequirementList(requirements, 'fontRoles');
  const gridModes = contractRequirementList(requirements, 'gridModes');
  const typographyRoles = contractRequirementList(requirements, 'typographyRoles');
  const buttonSizes = contractRequirementList(requirements, 'buttonSizes');
  const spacingTokens = contractRequirementList(requirements, 'spacingTokens');
  const radiusTokens = contractRequirementList(requirements, 'radiusTokens');
  const requireIconFamily = DEFAULT_DESIGN_SYSTEM_CONTRACT_REQUIREMENTS.requireIconFamily
    || requirements?.requireIconFamily === true;

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    errors.push(makeIssue(
      'error',
      'missing-design-system-contract',
      'A catalogue audit requires a serialized project-owned DS_CONTRACT.',
      { expected: 'object', actual: contract == null ? null : typeof contract }
    ));
    return {
      schemaVersion: 2,
      supplied: false,
      passed: false,
      errors,
      warnings,
      grid: null,
      summary: {
        supplied: false,
        fontRoles: 0,
        gridModes: 0,
        typographyRoles: 0,
        buttonSizes: 0,
        tokenNames: 0,
        duplicateTokenNames: 0,
        errors: errors.length,
        warnings: warnings.length
      }
    };
  }

  const tokenRecords = collectContractTokenRecords(contract);
  const validTokenRecords = tokenRecords.filter(({ name }) => isCssCustomPropertyName(name));
  const tokenCounts = new Map();
  for (const record of tokenRecords) {
    if (!isCssCustomPropertyName(record.name)) {
      errors.push(makeIssue(
        'error',
        'invalid-contract-token-name',
        'Every DS_CONTRACT token must be one CSS custom property beginning with --.',
        {
          path: `tokens.${record.group}[${record.index}]`,
          actual: record.name || null
        }
      ));
      continue;
    }
    tokenCounts.set(record.name, (tokenCounts.get(record.name) ?? 0) + 1);
  }

  const duplicateTokenNames = Array.from(tokenCounts)
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort();
  duplicateTokenNames.forEach((name) => {
    errors.push(makeIssue(
      'error',
      'duplicate-contract-token-name',
      `DS_CONTRACT token ${name} is declared more than once.`,
      { token: name, actual: tokenCounts.get(name), expected: 1 }
    ));
  });

  const fontFoundations = Array.isArray(contract.foundations?.fonts)
    ? contract.foundations.fonts
    : [];
  const fontTokenNames = new Set(
    validTokenRecords.filter(({ group }) => group === 'font').map(({ name }) => name)
  );
  for (const requiredRole of fontRoles) {
    const matches = fontFoundations.filter((entry) =>
      normalizeContractKey(entry?.role ?? entry?.label) === requiredRole
    );
    if (matches.length !== 1) {
      errors.push(makeIssue(
        'error',
        'invalid-font-foundation-count',
        `Font foundation ${requiredRole} must be declared exactly once.`,
        { role: requiredRole, actual: matches.length, expected: 1 }
      ));
      continue;
    }
    const foundation = matches[0];
    const name = trim(foundation?.name ?? foundation?.family);
    const token = trim(foundation?.token);
    if (!name) {
      errors.push(makeIssue(
        'error',
        'empty-font-family',
        `Font foundation ${requiredRole} requires a non-empty family name.`,
        { role: requiredRole, path: 'foundations.fonts' }
      ));
    }
    if (!token.startsWith('--') || !fontTokenNames.has(token)) {
      errors.push(makeIssue(
        'error',
        'missing-font-foundation-token',
        `Font foundation ${requiredRole} must reference a token declared in tokens.font.`,
        { role: requiredRole, token: token || null }
      ));
    }
  }

  if (requireIconFamily) {
    const iconValue = contract.foundations?.icons;
    const iconFoundations = Array.isArray(iconValue)
      ? iconValue.filter(Boolean)
      : iconValue && typeof iconValue === 'object' ? [iconValue] : [];
    if (iconFoundations.length !== 1) {
      errors.push(makeIssue(
        'error',
        'invalid-icon-family-count',
        'Exactly one icon family/source must be declared in foundations.icons.',
        { actual: iconFoundations.length, expected: 1 }
      ));
    } else {
      const icon = iconFoundations[0];
      const family = trim(icon.name ?? icon.family);
      const source = trim(icon.source ?? icon.package ?? icon.library ?? icon.url);
      if (!family || !source) {
        errors.push(makeIssue(
          'error',
          'empty-icon-family-source',
          'The icon foundation requires a non-empty family and source identity.',
          { family: family || null, source: source || null }
        ));
      }
    }
  }

  const gridFoundation = contract.foundations?.grid;
  const gridFoundations = Array.isArray(gridFoundation?.modes)
    ? gridFoundation.modes
    : [];
  const gridTokenNames = new Set(
    validTokenRecords.filter(({ group }) => group === 'grid').map(({ name }) => name)
  );
  const gridReferences = {
    maxWidthToken: trim(gridFoundation?.maxWidthToken),
    active: {
      columnsToken: trim(gridFoundation?.active?.columnsToken),
      marginToken: trim(gridFoundation?.active?.marginToken),
      gutterToken: trim(gridFoundation?.active?.gutterToken)
    },
    modes: []
  };

  if (
    !isCssCustomPropertyName(gridReferences.maxWidthToken)
      || !gridTokenNames.has(gridReferences.maxWidthToken)
  ) {
    errors.push(makeIssue(
      'error',
      'invalid-grid-max-width-token',
      'Grid foundation maxWidthToken must reference one token declared in tokens.grid.',
      { token: gridReferences.maxWidthToken || null }
    ));
  }

  for (const [role, token] of Object.entries(gridReferences.active)) {
    if (!isCssCustomPropertyName(token)) {
      errors.push(makeIssue(
        'error',
        'invalid-active-grid-token',
        `Grid foundation active.${role} must be a bare CSS custom-property name.`,
        { role, token: token || null }
      ));
    }
  }

  for (const requiredMode of gridModes) {
    const matches = gridFoundations.filter((entry) =>
      normalizeContractKey(entry?.label ?? entry?.mode ?? entry?.name) === requiredMode
    );
    if (matches.length !== 1) {
      errors.push(makeIssue(
        'error',
        'invalid-grid-foundation-count',
        `Grid foundation ${requiredMode} must be declared exactly once.`,
        { mode: requiredMode, actual: matches.length, expected: 1 }
      ));
      continue;
    }
    const grid = matches[0];
    const normalized = {
      mode: requiredMode,
      label: trim(grid.label ?? grid.mode ?? grid.name),
      columnsToken: trim(grid.columnsToken),
      marginToken: trim(grid.marginToken),
      gutterToken: trim(grid.gutterToken)
    };
    gridReferences.modes.push(normalized);
    const roleTokens = [normalized.columnsToken, normalized.marginToken, normalized.gutterToken];

    for (const [role, token] of [
      ['columns', normalized.columnsToken],
      ['margin', normalized.marginToken],
      ['gutter', normalized.gutterToken]
    ]) {
      if (!isCssCustomPropertyName(token)) {
        errors.push(makeIssue(
          'error',
          'invalid-grid-foundation-token',
          `Grid foundation ${requiredMode} ${role} must use a bare CSS custom-property name.`,
          { mode: requiredMode, role, token: token || null }
        ));
      } else if (!gridTokenNames.has(token)) {
        errors.push(makeIssue(
          'error',
          'missing-grid-foundation-token',
          `Grid foundation ${requiredMode} ${role} token must be declared in tokens.grid.`,
          { mode: requiredMode, role, token }
        ));
      }
    }

    if (new Set(roleTokens).size !== roleTokens.length) {
      errors.push(makeIssue(
        'error',
        'ambiguous-grid-foundation-tokens',
        `Grid foundation ${requiredMode} must use distinct columns, margin, and gutter tokens.`,
        { mode: requiredMode, actual: roleTokens }
      ));
    }
  }

  const contractTypography = new Set(
    (Array.isArray(contract.typography) ? contract.typography : [])
      .map(normalizeContractKey)
      .filter(Boolean)
  );
  for (const role of typographyRoles) {
    if (!contractTypography.has(role)) {
      errors.push(makeIssue(
        'error',
        'missing-typography-role',
        `DS_CONTRACT is missing required typography role ${role}.`,
        { role }
      ));
    }
  }

  const contractButtonSizes = new Set(
    (Array.isArray(contract.components?.button?.sizes) ? contract.components.button.sizes : [])
      .map(normalizeContractKey)
      .filter(Boolean)
  );
  for (const size of buttonSizes) {
    if (!contractButtonSizes.has(size)) {
      errors.push(makeIssue(
        'error',
        'missing-button-size',
        `DS_CONTRACT button family is missing required size ${size}.`,
        { size }
      ));
    }
  }

  const tokenNameSet = new Set(validTokenRecords.map(({ name }) => name));
  for (const token of spacingTokens) {
    if (!tokenNameSet.has(token)) {
      errors.push(makeIssue(
        'error',
        'missing-spacing-token',
        `DS_CONTRACT is missing required spacing token ${token}.`,
        { token }
      ));
    }
  }
  for (const token of radiusTokens) {
    if (!tokenNameSet.has(token)) {
      errors.push(makeIssue(
        'error',
        'missing-radius-token',
        `DS_CONTRACT is missing required radius token ${token}.`,
        { token }
      ));
    }
  }

  return {
    schemaVersion: 2,
    supplied: true,
    passed: errors.length === 0,
    errors,
    warnings,
    grid: gridReferences,
    summary: {
      supplied: true,
      fontRoles: fontFoundations.length,
      gridModes: gridFoundations.length,
      typographyRoles: contractTypography.size,
      buttonSizes: contractButtonSizes.size,
      tokenNames: tokenNameSet.size,
      duplicateTokenNames: duplicateTokenNames.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };
}

const rootCustomPropertyValue = (doc, view, token) => {
  if (!isCssCustomPropertyName(token)) return '';
  return trim(view.getComputedStyle(doc.documentElement).getPropertyValue(token));
};

const measureGridLengthToken = (doc, view, token) => {
  const authored = rootCustomPropertyValue(doc, view, token);
  if (!doc.body || !authored) return { authored, computed: '', pixels: null, valid: false };

  const probe = doc.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'box-sizing:border-box',
    'width:1000px',
    'height:1px',
    'visibility:hidden',
    'pointer-events:none',
    `padding-inline-start:var(${token})`
  ].join(';');
  doc.body.appendChild(probe);
  const computed = trim(view.getComputedStyle(probe).paddingInlineStart);
  probe.remove();
  const match = computed.match(/^(-?(?:\d+\.?\d*|\.\d+))px$/i);
  const pixels = match ? Number(match[1]) : null;
  return {
    authored,
    computed,
    pixels,
    valid: Number.isFinite(pixels) && pixels > 0
  };
};

const validateResolvedGridFoundation = (doc, view, grid) => {
  const errors = [];
  const resolved = { maxWidth: null, active: {}, modes: [] };

  const validateColumns = (mode, role, token) => {
    const actual = rootCustomPropertyValue(doc, view, token);
    const valid = /^[1-9]\d*$/.test(actual);
    if (!valid) {
      errors.push(makeIssue(
        'error',
        'invalid-grid-token-resolved-value',
        `Grid ${mode} ${role} token must resolve to a positive unitless integer.`,
        { mode, role, token, actual: actual || null, expected: 'positive unitless integer' }
      ));
    }
    return { token, value: actual, valid };
  };

  const validateLength = (mode, role, token) => {
    const measurement = measureGridLengthToken(doc, view, token);
    if (!measurement.valid) {
      errors.push(makeIssue(
        'error',
        'invalid-grid-token-resolved-value',
        `Grid ${mode} ${role} token must resolve to a positive CSS length or percentage.`,
        {
          mode,
          role,
          token,
          actual: measurement.authored || null,
          computed: measurement.computed || null,
          expected: 'positive CSS length-percentage'
        }
      ));
    }
    return { token, value: measurement.authored, computed: measurement.computed, valid: measurement.valid };
  };

  if (isCssCustomPropertyName(grid?.maxWidthToken)) {
    resolved.maxWidth = validateLength('global', 'max-width', grid.maxWidthToken);
  }

  if (grid?.active) {
    resolved.active = {
      columns: validateColumns('active', 'columns', grid.active.columnsToken),
      margin: validateLength('active', 'margin', grid.active.marginToken),
      gutter: validateLength('active', 'gutter', grid.active.gutterToken)
    };
  }

  for (const mode of Array.isArray(grid?.modes) ? grid.modes : []) {
    resolved.modes.push({
      mode: mode.mode,
      label: mode.label,
      columns: validateColumns(mode.mode, 'columns', mode.columnsToken),
      margin: validateLength(mode.mode, 'margin', mode.marginToken),
      gutter: validateLength(mode.mode, 'gutter', mode.gutterToken)
    });
  }

  return { errors, resolved };
};

const escapeCss = (value, view) => {
  if (view.CSS?.escape) return view.CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
};

const elementSelector = (element, view) => {
  if (element.id) return `#${escapeCss(element.id, view)}`;

  const parts = [];
  let current = element;
  while (current?.nodeType === 1 && parts.length < 6) {
    const tag = current.localName || current.tagName.toLowerCase();
    if (current.id) {
      parts.unshift(`#${escapeCss(current.id, view)}`);
      break;
    }

    const parent = current.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const siblings = Array.from(parent.children).filter((child) => child.localName === current.localName);
    const position = siblings.indexOf(current) + 1;
    parts.unshift(`${tag}:nth-of-type(${position})`);
    current = parent;
  }
  return parts.join(' > ');
};

const hash = (value) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return `ds-${(result >>> 0).toString(16).padStart(8, '0')}`;
};

const fingerprintKey = ({ component, variant, size, theme, state, part }) =>
  JSON.stringify([component, variant, size, theme, state, part]);

const displayKey = ({ component, variant, size, theme, state, part }) =>
  [component, variant, size, theme, state, part].join(' / ');

const collectBySelectors = (root, selectorList, kind, candidateMap, errors, reportInvalid = true) => {
  for (const selector of selectorList) {
    try {
      for (const element of root.querySelectorAll(selector)) {
        if (!candidateMap.has(element)) candidateMap.set(element, new Set());
        candidateMap.get(element).add(kind);
      }
    } catch (error) {
      if (!reportInvalid) continue;
      errors.push(makeIssue('error', 'invalid-selector', `Invalid ${kind} selector: ${selector}`, {
        selector,
        actual: String(error?.message ?? error)
      }));
    }
  }
};

const matchesAny = (element, selectors, errors) => selectors.some((selector) => {
  try {
    return element.matches(selector) || Boolean(element.closest(selector));
  } catch (error) {
    errors.push(makeIssue('error', 'invalid-ignore-selector', `Invalid ignore selector: ${selector}`, {
      selector,
      actual: String(error?.message ?? error)
    }));
    return false;
  }
});

const hiddenReason = (element, view) => {
  if (!element.isConnected) return 'detached';
  if (element.closest('template')) return 'template';
  if (element.matches('input[type="hidden"]')) return 'hidden-input';
  if (element.closest('[hidden]')) return 'hidden-attribute';

  const style = view.getComputedStyle(element);
  if (style.display === 'none') return 'display-none';
  if (['hidden', 'collapse'].includes(style.visibility)) return `visibility-${style.visibility}`;
  if (style.contentVisibility === 'hidden') return 'content-visibility-hidden';
  if (element.getClientRects().length === 0) return 'no-rendered-box';
  return null;
};

const resolveTheme = (element, doc, fallback) => {
  const owner = element.closest('[data-ds-theme]');
  return normalizeToken(
    owner?.getAttribute('data-ds-theme')
      ?? doc.documentElement?.getAttribute('data-ds-theme')
      ?? doc.body?.getAttribute('data-ds-theme')
      ?? fallback,
    'default'
  );
};

const resolveState = (element, fallback, owner = element) => {
  const explicit = element.getAttribute('data-ds-state') ?? owner?.getAttribute('data-ds-state');
  let state = trim(explicit) ? normalizeToken(explicit) : null;
  if (!state && (
    element.matches(':disabled')
      || owner?.matches?.(':disabled')
      || element.getAttribute('aria-disabled') === 'true'
      || owner?.getAttribute?.('aria-disabled') === 'true'
  )) state = 'disabled';
  if (!state && (element.getAttribute('aria-invalid') === 'true' || owner?.getAttribute?.('aria-invalid') === 'true')) state = 'error';
  if (!state && (element.getAttribute('aria-busy') === 'true' || owner?.getAttribute?.('aria-busy') === 'true')) state = 'loading';
  if (!state && (element.getAttribute('aria-pressed') === 'true' || owner?.getAttribute?.('aria-pressed') === 'true')) state = 'pressed';
  if (!state && (element.getAttribute('aria-expanded') === 'true' || owner?.getAttribute?.('aria-expanded') === 'true')) state = 'expanded';
  state ??= normalizeToken(fallback, 'default');

  const selected = element.matches(':checked') || element.getAttribute('aria-checked') === 'true';
  if (!selected || state.startsWith('checked')) return state;
  return state === 'default' ? 'checked' : `checked-${state}`;
};

const resolvePart = (element) => normalizeToken(element.getAttribute('data-ds-part'), 'root');

const resolveFingerprintProperties = (custom = {}) => Object.fromEntries(
  Object.entries(DEFAULT_FINGERPRINT_PROPERTIES).map(([category, defaults]) => [
    category,
    normalizeSelectorList(custom[category], defaults)
  ])
);

const createFingerprint = (element, view, propertyGroups) => {
  const style = view.getComputedStyle(element);
  return Object.fromEntries(Object.entries(propertyGroups).map(([category, properties]) => [
    category,
    Object.fromEntries(properties.map((property) => [
      property,
      normalizeCssValue(style.getPropertyValue(property))
    ]))
  ]));
};

const configuredTokenNames = (value) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : item?.name);
  if (typeof value === 'object') return Object.keys(value);
  return [];
};

const collectTokenSpecimens = (
  doc,
  view,
  errors,
  configuredNames = [],
  requireExactlyOneSpecimen = false
) => {
  const rootStyle = view.getComputedStyle(doc.documentElement);
  const tokenMap = new Map();

  const register = (nameValue, selector = null, nonRenderedReason = null) => {
    const name = trim(nameValue);
    if (!name.startsWith('--') || name.length < 3) {
      errors.push(makeIssue(
        'error',
        'invalid-design-token-name',
        'A design-token name must be one CSS custom property beginning with --.',
        { ...(selector ? { selector } : {}), actual: name || null }
      ));
      return;
    }
    if (!tokenMap.has(name)) {
      tokenMap.set(name, {
        name,
        specimenSelectors: [],
        nonRenderedSpecimens: []
      });
    }
    if (selector && nonRenderedReason) {
      tokenMap.get(name).nonRenderedSpecimens.push({ selector, reason: nonRenderedReason });
    } else if (selector) {
      tokenMap.get(name).specimenSelectors.push(selector);
    }
  };

  configuredNames.forEach((name) => register(name));

  const seenSpecimens = new Set();
  const visitSpecimen = (specimen, forcedNonRenderedReason = null) => {
    if (!specimen || seenSpecimens.has(specimen)) return;
    seenSpecimens.add(specimen);
    const selector = elementSelector(specimen, view);
    const templateOwner = specimen.closest('template');
    const nonRenderedReason = forcedNonRenderedReason
      ?? (templateOwner ? 'template' : hiddenReason(specimen, view));
    if (nonRenderedReason) {
      register(specimen.getAttribute('data-ds-token'), selector, nonRenderedReason);
      return;
    }
    const scopedThemeOwner = specimen.closest('[data-ds-theme]');
    if (
      scopedThemeOwner
        && scopedThemeOwner !== doc.documentElement
        && scopedThemeOwner !== doc.body
    ) {
      errors.push(makeIssue(
        'error',
        'scoped-token-specimen-not-supported',
        'data-ds-token documents root semantic tokens only; themed values are verified through component fingerprints.',
        {
          selector,
          themeOwner: elementSelector(scopedThemeOwner, view)
        }
      ));
    }
    register(specimen.getAttribute('data-ds-token'), selector);
  };

  for (const specimen of doc.querySelectorAll('[data-ds-token]')) visitSpecimen(specimen);
  // querySelectorAll on Document does not descend into template.content. Record
  // those declarations explicitly so stale template-only documentation cannot
  // satisfy the live catalogue specimen requirement or disappear from reports.
  for (const template of doc.querySelectorAll('template')) {
    for (const specimen of template.content?.querySelectorAll?.('[data-ds-token]') ?? []) {
      visitSpecimen(specimen, 'template');
    }
  }

  return Array.from(tokenMap.values()).map((token) => {
    const value = trim(rootStyle.getPropertyValue(token.name));
    const normalizedValue = normalizeCssValue(value);
    const placeholder = normalizedValue.includes('__set_from_references__');
    const unresolved = !value;
    const status = unresolved ? 'unresolved' : placeholder ? 'placeholder' : 'resolved';
    const specimenCount = token.specimenSelectors.length;
    const nonRenderedSpecimenCount = token.nonRenderedSpecimens.length;

    // Production pages normally receive configured token names and have zero
    // specimens. A live catalogue is different: exactly one visible canonical
    // specimen per token prevents a missing row or duplicated documentation from
    // being hidden by the Map used to normalize token reports.
    if (requireExactlyOneSpecimen && specimenCount !== 1) {
      errors.push(makeIssue(
        'error',
        'invalid-design-token-specimen-count',
        `Catalogue token ${token.name} requires exactly one data-ds-token specimen.`,
        {
          token: token.name,
          actual: specimenCount,
          expected: 1,
          specimenSelectors: token.specimenSelectors,
          nonRenderedSpecimens: token.nonRenderedSpecimens
        }
      ));
    }
    if (requireExactlyOneSpecimen && nonRenderedSpecimenCount > 0) {
      errors.push(makeIssue(
        'error',
        'non-rendered-design-token-specimen',
        `Catalogue token ${token.name} has hidden, detached, or template-only specimens.`,
        {
          token: token.name,
          actual: nonRenderedSpecimenCount,
          nonRenderedSpecimens: token.nonRenderedSpecimens
        }
      ));
    }

    if (unresolved || placeholder) {
      errors.push(makeIssue(
        'error',
        unresolved ? 'unresolved-design-token' : 'placeholder-design-token',
        unresolved
          ? `Design token ${token.name} has no resolved document-root value.`
          : `Design token ${token.name} still contains __SET_FROM_REFERENCES__.`,
        { token: token.name, actual: value || null, specimenSelectors: token.specimenSelectors }
      ));
    }

    return {
      name: token.name,
      value,
      normalizedValue,
      status,
      specimenCount,
      specimenSelectors: token.specimenSelectors,
      nonRenderedSpecimenCount,
      nonRenderedSpecimens: token.nonRenderedSpecimens
    };
  }).sort((left, right) => left.name.localeCompare(right.name));
};

const sortElementsInDocumentOrder = (elements, view) => elements.sort((left, right) => {
  if (left === right) return 0;
  const relation = left.compareDocumentPosition(right);
  if (relation & view.Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (relation & view.Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
});

const printAuditTable = (report, consoleObject) => {
  if (!consoleObject?.table) return;
  const rows = report.signatures.map((signature) => ({
    status: signature.drift ? 'DRIFT' : 'ok',
    component: signature.component,
    variant: signature.variant,
    size: signature.size,
    theme: signature.theme,
    state: signature.state,
    part: signature.part,
    instances: signature.count,
    fingerprints: signature.fingerprints.length
  }));
  rows.push(...report.tokens.map((token) => ({
    status: token.status === 'resolved' ? 'ok' : token.status.toUpperCase(),
    component: `token ${token.name}`,
    instances: token.specimenCount,
    fingerprints: token.normalizedValue
  })));
  if (report.summary.unmarked > 0) {
    rows.push({ status: 'UNMARKED', component: 'runtime candidates', instances: report.summary.unmarked });
  }
  consoleObject.table(rows);
  consoleObject.info?.('[design-system-audit]', {
    passed: report.passed,
    catalogue: report.summary.catalogue,
    audited: report.summary.audited,
    errors: report.errors.length,
    warnings: report.warnings.length
  });
};

const boundedWait = (promise, view, timeoutMs) => new Promise((resolve) => {
  let finished = false;
  const timer = view.setTimeout(() => {
    if (finished) return;
    finished = true;
    resolve({ ok: false, timeout: true });
  }, timeoutMs);

  Promise.resolve(promise).then(
    (value) => {
      if (finished) return;
      finished = true;
      view.clearTimeout(timer);
      resolve({ ok: true, value });
    },
    (error) => {
      if (finished) return;
      finished = true;
      view.clearTimeout(timer);
      resolve({ ok: false, timeout: false, error });
    }
  );
});

const waitForImage = (image) => {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve()
      : Promise.reject(new Error(`Image failed to load: ${image.currentSrc || image.src || '(empty src)'}`));
  }
  if (typeof image.decode === 'function') return image.decode();
  return new Promise((resolve, reject) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', () => reject(new Error(
      `Image failed to load: ${image.currentSrc || image.src || '(empty src)'}`
    )), { once: true });
  });
};

const settleDocument = async (doc, view, options, errors, warnings) => {
  if (options.awaitSettle === false) {
    warnings.push(makeIssue(
      'warning',
      'document-settle-disabled',
      'Document readiness, images, finite animations, and stable frames were not awaited.'
    ));
    return;
  }

  const timeoutMs = Number.isFinite(options.settleTimeoutMs)
    ? Math.max(250, options.settleTimeoutMs)
    : 5000;

  if (doc.readyState === 'loading') {
    const ready = await boundedWait(new Promise((resolve) => {
      doc.addEventListener('DOMContentLoaded', resolve, { once: true });
    }), view, timeoutMs);
    if (!ready.ok) {
      errors.push(makeIssue(
        'error',
        ready.timeout ? 'document-ready-timeout' : 'document-ready-failed',
        'The audited document did not reach DOMContentLoaded within the settle window.',
        { timeoutMs, ...(ready.error ? { actual: String(ready.error?.message ?? ready.error) } : {}) }
      ));
    }
  }

  if (options.awaitImages !== false) {
    const images = Array.from(doc.images ?? []);
    const imageResult = await boundedWait(Promise.allSettled(images.map(waitForImage)), view, timeoutMs);
    if (!imageResult.ok) {
      errors.push(makeIssue(
        'error',
        imageResult.timeout ? 'image-settle-timeout' : 'image-settle-failed',
        'Images did not settle within the design-system audit window.',
        { timeoutMs, imageCount: images.length }
      ));
    } else {
      const failures = imageResult.value.filter((entry) => entry.status === 'rejected');
      if (failures.length > 0) {
        errors.push(makeIssue(
          'error',
          'image-decode-failed',
          'One or more images failed before the design-system audit snapshot.',
          {
            failed: failures.length,
            reasons: failures.map((entry) => String(entry.reason?.message ?? entry.reason))
          }
        ));
      }
    }
  }

  if (options.awaitAnimations !== false && typeof doc.getAnimations === 'function') {
    const finiteAnimations = doc.getAnimations().filter((animation) => {
      const timelineName = animation.timeline?.constructor?.name ?? '';
      if (/scroll|view/i.test(timelineName)) return false;
      if (!['running', 'pending'].includes(animation.playState)) return false;
      const endTime = animation.effect?.getComputedTiming?.().endTime;
      return Number.isFinite(endTime);
    });
    const animationResult = await boundedWait(
      Promise.allSettled(finiteAnimations.map((animation) => animation.finished)),
      view,
      timeoutMs
    );
    if (!animationResult.ok) {
      errors.push(makeIssue(
        'error',
        'animation-settle-timeout',
        'Finite entrance or transition animations did not settle before the audit snapshot.',
        { timeoutMs, animationCount: finiteAnimations.length }
      ));
    }
  }

  const frameCount = Number.isFinite(options.settleFrames)
    ? Math.max(0, Math.floor(options.settleFrames))
    : 2;
  if (frameCount > 0) {
    const frameResult = await boundedWait((async () => {
      for (let index = 0; index < frameCount; index += 1) {
        await new Promise((resolve) => view.requestAnimationFrame(resolve));
      }
    })(), view, timeoutMs);
    if (!frameResult.ok) {
      errors.push(makeIssue(
        'error',
        'stable-frame-timeout',
        'The audited document did not produce the required stable animation frames.',
        { timeoutMs, frameCount }
      ));
    }
  }
};

/**
 * Scan one rendered document and return a serializable runtime audit report.
 * The function waits for `document.fonts.ready` by default.
 */
export async function runDesignSystemAudit(options = {}) {
  const doc = options.doc ?? globalThis.document;
  if (!doc?.querySelectorAll) throw new TypeError('runDesignSystemAudit requires a browser Document.');

  const view = doc.defaultView ?? globalThis.window;
  if (!view?.getComputedStyle) throw new TypeError('The audited Document must have a browsing context.');

  const errors = [];
  const warnings = [];
  let fontsReady = !doc.fonts;
  const settleTimeoutMs = Number.isFinite(options.settleTimeoutMs)
    ? Math.max(250, options.settleTimeoutMs)
    : 5000;

  if (doc.fonts && options.awaitFonts !== false) {
    const fontResult = await boundedWait(doc.fonts.ready, view, settleTimeoutMs);
    if (fontResult.ok) {
      fontsReady = doc.fonts.status === 'loaded';
      if (!fontsReady) {
        errors.push(makeIssue('error', 'fonts-not-loaded', 'document.fonts.ready resolved before the font set reported loaded.', {
          actual: doc.fonts.status
        }));
      }
    } else {
      errors.push(makeIssue(
        'error',
        fontResult.timeout ? 'fonts-ready-timeout' : 'fonts-ready-rejected',
        fontResult.timeout
          ? 'document.fonts.ready did not settle within the audit window.'
          : 'Could not await document.fonts.ready.',
        {
          timeoutMs: settleTimeoutMs,
          ...(fontResult.error ? { actual: String(fontResult.error?.message ?? fontResult.error) } : {})
        }
      ));
    }
  } else if (doc.fonts) {
    fontsReady = doc.fonts.status === 'loaded';
  }
  if (doc.fonts && !fontsReady && !errors.some((issue) => issue.code.startsWith('fonts-'))) {
    errors.push(makeIssue(
      'error',
      'fonts-not-settled',
      'The design-system audit requires document.fonts.status to be loaded.',
      { actual: doc.fonts.status }
    ));
  }

  await settleDocument(doc, view, options, errors, warnings);

  const selectorOptions = options.selectors ?? {};
  const selectors = {
    managed: normalizeSelectorList(selectorOptions.managed, DEFAULT_SELECTORS.managed),
    controls: normalizeSelectorList(selectorOptions.controls, DEFAULT_SELECTORS.controls),
    buttonLikeAnchors: normalizeSelectorList(
      selectorOptions.buttonLikeAnchors,
      DEFAULT_SELECTORS.buttonLikeAnchors
    ),
    typography: normalizeSelectorList(selectorOptions.typography, DEFAULT_SELECTORS.typography),
    editorial: normalizeSelectorList(selectorOptions.editorial, DEFAULT_SELECTORS.editorial),
    ignore: normalizeSelectorList(selectorOptions.ignore, DEFAULT_SELECTORS.ignore)
  };
  const propertyGroups = resolveFingerprintProperties(options.fingerprintProperties);
  const candidateMap = new Map();

  collectBySelectors(doc, selectors.managed, 'managed', candidateMap, errors);
  collectBySelectors(doc, selectors.controls, 'control', candidateMap, errors);
  collectBySelectors(doc, selectors.buttonLikeAnchors, 'button-like-anchor', candidateMap, errors);
  collectBySelectors(doc, selectors.typography, 'typography-role', candidateMap, errors);
  collectBySelectors(doc, selectors.editorial, 'editorial-text', candidateMap, errors);

  // Template contents are intentionally not audited: they have no reliable
  // computed style until instantiated. Count them so omission stays explicit.
  let skippedTemplate = 0;
  for (const template of doc.querySelectorAll('template')) {
    const templateCandidates = new Map();
    collectBySelectors(template.content, selectors.managed, 'managed', templateCandidates, errors, false);
    collectBySelectors(template.content, selectors.controls, 'control', templateCandidates, errors, false);
    collectBySelectors(
      template.content,
      selectors.buttonLikeAnchors,
      'button-like-anchor',
      templateCandidates,
      errors,
      false
    );
    collectBySelectors(template.content, selectors.typography, 'typography-role', templateCandidates, errors, false);
    collectBySelectors(template.content, selectors.editorial, 'editorial-text', templateCandidates, errors, false);
    for (const tokenSpecimen of template.content.querySelectorAll('[data-ds-token]')) {
      if (!templateCandidates.has(tokenSpecimen)) templateCandidates.set(tokenSpecimen, new Set(['token-specimen']));
    }
    skippedTemplate += templateCandidates.size;
  }

  const explicitCatalogue = typeof options.catalogue === 'boolean' ? options.catalogue : null;
  const catalogue = explicitCatalogue ?? Boolean(
    doc.documentElement?.hasAttribute('data-ds-catalogue')
      || doc.body?.hasAttribute('data-ds-catalogue')
      || doc.querySelector('[data-ds-catalogue]')
  );

  // A catalogue is the executable description of the project-owned contract,
  // so it may not pass on specimens alone. Prefer an explicit serializable
  // contract supplied by the audit harness; a project may alternatively expose
  // the same object as window.SiteDesignSystemContract for browser evaluation.
  const explicitContract = options.contract !== undefined;
  const contract = explicitContract ? options.contract : view.SiteDesignSystemContract;
  const contractSource = explicitContract
    ? 'options.contract'
    : contract !== undefined ? 'window.SiteDesignSystemContract' : null;
  let contractValidation;
  if (contract === undefined || contract === null) {
    contractValidation = catalogue
      ? validateDesignSystemContract(contract, options.contractRequirements)
      : skippedContractValidation();
  } else {
    contractValidation = validateDesignSystemContract(contract, options.contractRequirements);
  }
  contractValidation = {
    ...contractValidation,
    required: catalogue,
    source: contractSource,
    summary: {
      ...contractValidation.summary,
      required: catalogue,
      source: contractSource
    }
  };
  if (contractValidation.supplied && contractValidation.grid) {
    const gridRuntime = validateResolvedGridFoundation(doc, view, contractValidation.grid);
    contractValidation = {
      ...contractValidation,
      passed: contractValidation.passed === true && gridRuntime.errors.length === 0,
      errors: [...contractValidation.errors, ...gridRuntime.errors],
      grid: {
        ...contractValidation.grid,
        resolved: gridRuntime.resolved
      },
      summary: {
        ...contractValidation.summary,
        errors: contractValidation.errors.length + gridRuntime.errors.length,
        gridRuntimeErrors: gridRuntime.errors.length
      }
    };
  }
  if (contractValidation.passed === false) errors.push(...contractValidation.errors);

  // Seeding from DS_CONTRACT makes a missing catalogue row observable as a
  // zero-specimen error; without it, only tokens already present in the DOM
  // could be checked. Production audits continue to accept catalogue tokenNames.
  const contractTokenNames = collectContractTokenRecords(contract)
    .map(({ name }) => name)
    .filter((name) => isCssCustomPropertyName(name));
  const requiredTokenNames = Array.from(new Set([
    ...configuredTokenNames(options.tokenNames ?? options.tokens),
    ...contractTokenNames
  ]));

  const instances = [];
  const tokens = collectTokenSpecimens(
    doc,
    view,
    errors,
    requiredTokenNames,
    catalogue
  );
  let skippedHidden = 0;
  let skippedIgnored = 0;
  let exempt = 0;
  let unmarked = 0;
  let audited = 0;
  const reviewedExemptionOwners = new Set();

  const elements = sortElementsInDocumentOrder(Array.from(candidateMap.keys()), view);
  for (const [candidateIndex, element] of elements.entries()) {
    if (matchesAny(element, selectors.ignore, errors)) {
      skippedIgnored += 1;
      continue;
    }

    if (options.includeHidden !== true) {
      const reason = hiddenReason(element, view);
      if (reason) {
        skippedHidden += 1;
        continue;
      }
    }

    const id = `instance-${candidateIndex + 1}`;
    const selector = elementSelector(element, view);
    const kinds = Array.from(candidateMap.get(element)).sort();
    const exemptionOwner = element.closest('[data-ds-exempt]');
    const exemptionReason = trim(exemptionOwner?.getAttribute('data-ds-exempt'));

    if (exemptionOwner && exemptionReason) {
      exempt += 1;
      if (!reviewedExemptionOwners.has(exemptionOwner)) {
        reviewedExemptionOwners.add(exemptionOwner);
        warnings.push(makeIssue(
          'warning',
          'documented-design-system-exemption',
          'A visible element is excluded from design-system coverage and requires review.',
          {
            selector: elementSelector(exemptionOwner, view),
            reason: exemptionReason
          }
        ));
      }
      instances.push({
        id,
        selector,
        tag: element.localName,
        kinds,
        status: 'exempt',
        exemptReason: exemptionReason
      });
      continue;
    }

    if (exemptionOwner && !exemptionReason) {
      errors.push(makeIssue('error', 'empty-exemption-reason', 'data-ds-exempt requires a non-empty reason.', {
        instanceId: id,
        selector: elementSelector(exemptionOwner, view)
      }));
    }

    const hasTypeRole = element.hasAttribute('data-type-role');
    const typeRole = normalizeToken(element.getAttribute('data-type-role'));
    if ((kinds.includes('editorial-text') && !typeRole) || (hasTypeRole && !typeRole)) {
      unmarked += 1;
      errors.push(makeIssue(
        'error',
        'unmarked-typography-role',
        'Visible editorial text requires a non-empty data-type-role.',
        { instanceId: id, selector, tag: element.localName }
      ));
      instances.push({
        id,
        selector,
        tag: element.localName,
        kinds,
        status: 'unmarked',
        missing: ['data-type-role']
      });
      continue;
    }

    // A typography role must never let an interactive element or a marked
    // component bypass component coverage. Editorial-only elements use the
    // synthetic typography identity; controls and managed roots still require
    // the full data-ds component contract.
    const auditsAsTypography = Boolean(
      typeRole
        && !kinds.some((kind) => ['managed', 'control', 'button-like-anchor'].includes(kind))
    );

    // Compound parts inherit identity from their nearest marked component root;
    // the part itself only needs `data-ds-part`. Ordinary controls do not inherit
    // implicitly, so an accidental unmarked native control is still detected.
    const identityOwner = element.hasAttribute('data-ds-part')
      ? (element.closest('[data-ds-component]') ?? element)
      : element;
    let component = 'typography';
    let variant = typeRole;
    let size = 'default';
    let theme = resolveTheme(element, doc, options.theme);
    let state = 'default';
    let part = 'root';
    let missing = [];

    if (!auditsAsTypography) {
      component = normalizeToken(identityOwner.getAttribute('data-ds-component'));
      variant = normalizeToken(identityOwner.getAttribute('data-ds-variant'));
      size = normalizeToken(identityOwner.getAttribute('data-ds-size'));
      state = resolveState(element, options.state, identityOwner);
      part = resolvePart(element);
      missing = [
        !component && 'data-ds-component',
        !variant && 'data-ds-variant',
        !size && 'data-ds-size'
      ].filter(Boolean);
    }

    if (missing.length > 0) {
      unmarked += 1;
      errors.push(makeIssue(
        'error',
        missing.length === 3 ? 'unmarked-design-system-candidate' : 'incomplete-design-system-metadata',
        `Visible design-system candidate is missing ${missing.join(', ')}.`,
        { instanceId: id, selector, tag: element.localName, kinds, missing }
      ));
      instances.push({
        id,
        selector,
        tag: element.localName,
        kinds,
        status: 'unmarked',
        missing
      });
      continue;
    }

    const fingerprint = createFingerprint(
      element,
      view,
      auditsAsTypography
        ? { typography: propertyGroups.typography, colors: propertyGroups.colors }
        : propertyGroups
    );
    const serializedFingerprint = JSON.stringify(fingerprint);
    const signatureId = hash(serializedFingerprint);
    const rect = element.getBoundingClientRect();
    const keyParts = { component, variant, size, theme, state, part };
    audited += 1;
    instances.push({
      id,
      selector,
      tag: element.localName,
      kinds,
      status: 'audited',
      ...(auditsAsTypography ? { typeRole } : {}),
      catalogue: catalogue || Boolean(element.closest('[data-ds-catalogue]')),
      ...keyParts,
      key: fingerprintKey(keyParts),
      displayKey: displayKey(keyParts),
      signatureId,
      bounds: { width: round(rect.width), height: round(rect.height) },
      fingerprint
    });

    // A component root/part may also consume an editorial type role. Keep the
    // component coverage above and emit a second role signature so typography
    // consistency cannot be bypassed by combining both contracts on one node.
    if (typeRole && !auditsAsTypography) {
      const typographyKeyParts = {
        component: 'typography',
        variant: typeRole,
        size: 'default',
        theme,
        state,
        part: 'root'
      };
      const typographyFingerprint = createFingerprint(element, view, {
        typography: propertyGroups.typography,
        colors: propertyGroups.colors
      });
      const serializedTypographyFingerprint = JSON.stringify(typographyFingerprint);
      audited += 1;
      instances.push({
        id: `${id}-type-role`,
        selector,
        tag: element.localName,
        kinds: [...kinds, 'typography-role'].sort(),
        status: 'audited',
        typeRole,
        catalogue: catalogue || Boolean(element.closest('[data-ds-catalogue]')),
        ...typographyKeyParts,
        key: fingerprintKey(typographyKeyParts),
        displayKey: displayKey(typographyKeyParts),
        signatureId: hash(serializedTypographyFingerprint),
        bounds: { width: round(rect.width), height: round(rect.height) },
        fingerprint: typographyFingerprint
      });
    }
  }

  const groupMap = new Map();
  for (const instance of instances.filter((entry) => entry.status === 'audited')) {
    if (!groupMap.has(instance.key)) {
      groupMap.set(instance.key, {
        key: instance.key,
        displayKey: instance.displayKey,
        component: instance.component,
        variant: instance.variant,
        size: instance.size,
        theme: instance.theme,
        state: instance.state,
        part: instance.part,
        instanceIds: [],
        fingerprintMap: new Map()
      });
    }
    const group = groupMap.get(instance.key);
    group.instanceIds.push(instance.id);
    if (!group.fingerprintMap.has(instance.signatureId)) {
      group.fingerprintMap.set(instance.signatureId, {
        id: instance.signatureId,
        count: 0,
        instanceIds: [],
        fingerprint: instance.fingerprint
      });
    }
    const signature = group.fingerprintMap.get(instance.signatureId);
    signature.count += 1;
    signature.instanceIds.push(instance.id);
  }

  const signatures = Array.from(groupMap.values()).map((group) => {
    const fingerprints = Array.from(group.fingerprintMap.values())
      .sort((left, right) => left.id.localeCompare(right.id));
    const drift = fingerprints.length > 1;
    if (drift) {
      const target = options.driftSeverity === 'warning' ? warnings : errors;
      target.push(makeIssue(
        options.driftSeverity === 'warning' ? 'warning' : 'error',
        'computed-style-drift',
        `Runtime instances of ${group.displayKey} do not share one computed-style fingerprint.`,
        {
          key: group.key,
          displayKey: group.displayKey,
          instanceIds: group.instanceIds,
          signatureIds: fingerprints.map((entry) => entry.id)
        }
      ));
    }
    return {
      key: group.key,
      displayKey: group.displayKey,
      component: group.component,
      variant: group.variant,
      size: group.size,
      theme: group.theme,
      state: group.state,
      part: group.part,
      count: group.instanceIds.length,
      instanceIds: group.instanceIds,
      drift,
      fingerprints
    };
  }).sort((left, right) => left.displayKey.localeCompare(right.displayKey));

  if (audited === 0) {
    warnings.push(makeIssue('warning', 'no-audited-instances', 'No visible, non-exempt design-system instances were audited.'));
  }

  const viewport = {
    width: view.innerWidth,
    height: view.innerHeight,
    devicePixelRatio: Number(view.devicePixelRatio ?? 1)
  };
  const report = {
    // Schema 2 makes successful mandatory contract validation part of every
    // catalogue report consumed by the comparator. Production reports use the
    // same schema but may carry a skipped (passed: null) contractValidation.
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    passed: errors.length === 0,
    errors,
    warnings,
    instances,
    signatures,
    tokens,
    contractValidation,
    summary: {
      catalogue,
      viewport,
      fontsReady,
      candidates: candidateMap.size,
      audited,
      exempt,
      unmarked,
      groups: signatures.length,
      typographyRoles: signatures.filter((entry) => entry.component === 'typography').length,
      tokens: tokens.length,
      driftGroups: signatures.filter((entry) => entry.drift).length,
      skippedHidden,
      skippedTemplate,
      skippedIgnored,
      contractValidation: {
        required: contractValidation.required,
        supplied: contractValidation.supplied,
        source: contractValidation.source,
        passed: contractValidation.passed,
        errors: contractValidation.errors.length,
        warnings: contractValidation.warnings.length
      },
      errors: errors.length,
      warnings: warnings.length,
      verifies: [
        ...(catalogue ? ['mandatory-contract-completeness', 'canonical-token-specimens'] : []),
        'runtime-markers',
        'current-computed-style-consistency'
      ],
      doesNotVerify: [
        'source-import-graph',
        'reference-fidelity',
        'section-composition',
        'unique-local-visuals'
      ]
    }
  };

  if (options.printTable !== false) printAuditTable(report, view.console ?? globalThis.console);
  return report;
}

const reportEntries = (reports) => {
  if (Array.isArray(reports)) {
    return reports.map((report, index) => ({ label: `production-${index + 1}`, report }));
  }
  if (reports && typeof reports === 'object' && !Array.isArray(reports.signatures)) {
    return Object.entries(reports).map(([label, report]) => ({ label, report }));
  }
  return reports ? [{ label: 'production-1', report: reports }] : [];
};

const viewportKey = (report) => {
  const viewport = report?.summary?.viewport;
  if (!viewport) return 'unknown';
  return `${viewport.width}x${viewport.height}@${viewport.devicePixelRatio ?? 1}`;
};

const hasValidViewport = (report) => {
  const viewport = report?.summary?.viewport;
  return Boolean(
    viewport
      && Number.isFinite(viewport.width)
      && viewport.width > 0
      && Number.isFinite(viewport.height)
      && viewport.height > 0
      && Number.isFinite(viewport.devicePixelRatio ?? 1)
      && (viewport.devicePixelRatio ?? 1) > 0
  );
};

const signatureFingerprintSet = (signature) => new Map(
  (signature?.fingerprints ?? []).map((entry) => [JSON.stringify(entry.fingerprint), entry])
);

const mapsHaveSameKeys = (left, right) =>
  left.size === right.size && Array.from(left.keys()).every((key) => right.has(key));

const printComparisonTable = (comparison, consoleObject) => {
  if (!consoleObject?.table) return;
  const rows = comparison.comparisons.map((entry) => ({
    status: entry.status,
    component: entry.component,
    variant: entry.variant,
    size: entry.size,
    theme: entry.theme,
    state: entry.state,
    part: entry.part,
    production: entry.productionFingerprints,
    catalogue: entry.catalogueFingerprints
  }));
  rows.push(...comparison.tokenComparisons.map((entry) => ({
    status: entry.status,
    component: `token ${entry.token}`,
    production: entry.productionValues.join(' | '),
    catalogue: entry.catalogueValue
  })));
  consoleObject.table(rows);
  consoleObject.info?.('[design-system-audit:comparison]', comparison.summary);
};

/**
 * Compare one or more production audit reports with a catalogue audit report.
 *
 * Every production component/variant/size/theme/state/part key and collected
 * token must exist in the catalogue. At the same viewport, equal keys and
 * tokens must have equal normalized values. Catalogue-only entries are
 * reported as warnings, not failures.
 */
export function compareDesignSystemAuditReports({
  productionReports,
  catalogueReport,
  printTable = true
} = {}) {
  const errors = [];
  const warnings = [];
  const comparisons = [];
  const tokenComparisons = [];
  const productions = reportEntries(productionReports);
  const catalogueSourceErrors = Array.isArray(catalogueReport?.errors) ? catalogueReport.errors : [];
  const catalogueSourceWarnings = Array.isArray(catalogueReport?.warnings) ? catalogueReport.warnings : [];

  if (productions.length === 0) {
    errors.push(makeIssue('error', 'missing-production-reports', 'At least one production audit report is required.'));
  }
  if (!catalogueReport?.signatures) {
    errors.push(makeIssue('error', 'missing-catalogue-report', 'A catalogue audit report is required.'));
  }

  if (catalogueReport && catalogueReport.schemaVersion !== 2) {
    errors.push(makeIssue(
      'error',
      'unsupported-catalogue-report-schema',
      'The catalogue report has a missing or unsupported schemaVersion.',
      { actual: catalogueReport.schemaVersion ?? null, expected: 2 }
    ));
  }
  if (catalogueReport && (!Array.isArray(catalogueReport.errors) || !Array.isArray(catalogueReport.warnings))) {
    errors.push(makeIssue(
      'error',
      'malformed-catalogue-issues',
      'The catalogue report must contain errors and warnings arrays.'
    ));
  }

  if (catalogueReport?.summary?.catalogue !== true) {
    errors.push(makeIssue(
      'error',
      'catalogue-report-not-marked',
      'The catalogue report was not detected or declared as a catalogue. Add data-ds-catalogue or pass catalogue: true.'
    ));
  }

  const catalogueContractValidation = catalogueReport?.contractValidation;
  if (!catalogueContractValidation || typeof catalogueContractValidation !== 'object') {
    errors.push(makeIssue(
      'error',
      'missing-catalogue-contract-validation',
      'Catalogue report schema 2 requires a serialized mandatory contractValidation result.'
    ));
  } else if (
    catalogueContractValidation.schemaVersion !== 2
      || catalogueContractValidation.required !== true
      || catalogueContractValidation.supplied !== true
      || catalogueContractValidation.passed !== true
      || !Array.isArray(catalogueContractValidation.errors)
      || catalogueContractValidation.errors.length > 0
  ) {
    errors.push(makeIssue(
      'error',
      'catalogue-contract-validation-failed',
      'Catalogue report does not contain a successful mandatory design-system contract validation.',
      {
        actual: {
          schemaVersion: catalogueContractValidation.schemaVersion ?? null,
          required: catalogueContractValidation.required ?? null,
          supplied: catalogueContractValidation.supplied ?? null,
          passed: catalogueContractValidation.passed ?? null,
          errors: Array.isArray(catalogueContractValidation.errors)
            ? catalogueContractValidation.errors.length
            : null
        }
      }
    ));
  }

  if (
    catalogueReport
      && (catalogueReport.passed !== true || catalogueSourceErrors.length > 0)
  ) {
    errors.push(makeIssue(
      'error',
      'catalogue-source-audit-failed',
      'The catalogue document failed its own runtime audit before comparison.',
      {
        sourceErrorCount: catalogueSourceErrors.length,
        sourceErrorCodes: catalogueSourceErrors.map((issue) => issue.code)
      }
    ));
  }
  if (catalogueReport && !hasValidViewport(catalogueReport)) {
    errors.push(makeIssue(
      'error',
      'invalid-catalogue-viewport',
      'The catalogue report must contain finite positive viewport dimensions.',
      { actual: catalogueReport.summary?.viewport ?? null }
    ));
  }
  if (catalogueSourceWarnings.length > 0) {
    warnings.push(makeIssue(
      'warning',
      'catalogue-source-audit-warnings',
      'The catalogue document produced review warnings before comparison.',
      {
        sourceWarningCount: catalogueSourceWarnings.length,
        sourceWarningCodes: catalogueSourceWarnings.map((issue) => issue.code)
      }
    ));
  }

  const catalogueViewport = viewportKey(catalogueReport);
  const eligibleProductions = [];
  for (const production of productions) {
    if (!production.report?.signatures) {
      errors.push(makeIssue('error', 'invalid-production-report', `Production report "${production.label}" has no signatures.`, {
        report: production.label
      }));
      continue;
    }
    const productionSourceErrors = Array.isArray(production.report.errors) ? production.report.errors : [];
    const productionSourceWarnings = Array.isArray(production.report.warnings) ? production.report.warnings : [];
    if (production.report.schemaVersion !== 2) {
      errors.push(makeIssue(
        'error',
        'unsupported-production-report-schema',
        `Production report "${production.label}" has a missing or unsupported schemaVersion.`,
        { report: production.label, actual: production.report.schemaVersion ?? null, expected: 2 }
      ));
    }
    if (!Array.isArray(production.report.errors) || !Array.isArray(production.report.warnings)) {
      errors.push(makeIssue(
        'error',
        'malformed-production-issues',
        `Production report "${production.label}" must contain errors and warnings arrays.`,
        { report: production.label }
      ));
    }
    if (production.report.passed !== true || productionSourceErrors.length > 0) {
      errors.push(makeIssue(
        'error',
        'production-source-audit-failed',
        `Production report "${production.label}" failed its own runtime audit before comparison.`,
        {
          report: production.label,
          sourceErrorCount: productionSourceErrors.length,
          sourceErrorCodes: productionSourceErrors.map((issue) => issue.code)
        }
      ));
    }
    if (productionSourceWarnings.length > 0) {
      warnings.push(makeIssue(
        'warning',
        'production-source-audit-warnings',
        `Production report "${production.label}" produced review warnings before comparison.`,
        {
          report: production.label,
          sourceWarningCount: productionSourceWarnings.length,
          sourceWarningCodes: productionSourceWarnings.map((issue) => issue.code)
        }
      ));
    }
    if (!hasValidViewport(production.report)) {
      errors.push(makeIssue(
        'error',
        'invalid-production-viewport',
        `Production report "${production.label}" must contain finite positive viewport dimensions.`,
        { report: production.label, actual: production.report.summary?.viewport ?? null }
      ));
      continue;
    }
    const productionViewport = viewportKey(production.report);
    if (productionViewport !== catalogueViewport) {
      errors.push(makeIssue(
        'error',
        'viewport-mismatch',
        `Production report "${production.label}" and catalogue report were not captured at the same viewport.`,
        { report: production.label, productionViewport, catalogueViewport }
      ));
      continue;
    }
    eligibleProductions.push(production);
  }

  const catalogueMap = new Map((catalogueReport?.signatures ?? []).map((signature) => [signature.key, signature]));
  const productionMap = new Map();

  for (const { label, report } of eligibleProductions) {
    for (const signature of report.signatures) {
      if (!productionMap.has(signature.key)) productionMap.set(signature.key, []);
      productionMap.get(signature.key).push({ label, signature });
    }
  }

  for (const [key, entries] of productionMap) {
    const first = entries[0].signature;
    const catalogueSignature = catalogueMap.get(key);
    const productionSets = entries.map(({ signature }) => signatureFingerprintSet(signature));
    const mergedProductionSet = new Map();
    productionSets.forEach((set) => set.forEach((value, fingerprint) => mergedProductionSet.set(fingerprint, value)));

    if (mergedProductionSet.size > 1 || entries.some(({ signature }) => signature.drift)) {
      errors.push(makeIssue(
        'error',
        'production-fingerprint-drift',
        `Production reports contain fingerprint drift for ${first.displayKey}.`,
        { key, reports: entries.map((entry) => entry.label) }
      ));
    }

    if (!catalogueSignature) {
      errors.push(makeIssue(
        'error',
        'catalogue-missing-key',
        `Catalogue is missing production key ${first.displayKey}.`,
        { key, reports: entries.map((entry) => entry.label) }
      ));
      comparisons.push({
        status: 'MISSING',
        key,
        component: first.component,
        variant: first.variant,
        size: first.size,
        theme: first.theme,
        state: first.state,
        part: first.part,
        productionFingerprints: mergedProductionSet.size,
        catalogueFingerprints: 0
      });
      continue;
    }

    const catalogueSet = signatureFingerprintSet(catalogueSignature);
    if (catalogueSignature.drift || catalogueSet.size > 1) {
      errors.push(makeIssue(
        'error',
        'catalogue-fingerprint-drift',
        `Catalogue contains fingerprint drift for ${catalogueSignature.displayKey}.`,
        { key }
      ));
    }

    const matches = mapsHaveSameKeys(mergedProductionSet, catalogueSet);
    if (!matches) {
      errors.push(makeIssue(
        'error',
        'production-catalogue-fingerprint-drift',
        `Production and catalogue computed styles differ for ${first.displayKey}.`,
        {
          key,
          productionSignatureIds: Array.from(mergedProductionSet.values()).map((entry) => entry.id),
          catalogueSignatureIds: Array.from(catalogueSet.values()).map((entry) => entry.id)
        }
      ));
    }

    comparisons.push({
      status: matches ? 'ok' : 'DRIFT',
      key,
      component: first.component,
      variant: first.variant,
      size: first.size,
      theme: first.theme,
      state: first.state,
      part: first.part,
      productionFingerprints: mergedProductionSet.size,
      catalogueFingerprints: catalogueSet.size
    });
  }

  for (const [key, signature] of catalogueMap) {
    if (productionMap.has(key)) continue;
    warnings.push(makeIssue(
      'warning',
      'catalogue-only-key',
      `Catalogue key ${signature.displayKey} was not found in the supplied production reports.`,
      { key }
    ));
    comparisons.push({
      status: 'CATALOGUE ONLY',
      key,
      component: signature.component,
      variant: signature.variant,
      size: signature.size,
      theme: signature.theme,
      state: signature.state,
      part: signature.part,
      productionFingerprints: 0,
      catalogueFingerprints: signatureFingerprintSet(signature).size
    });
  }

  const catalogueTokenMap = new Map((catalogueReport?.tokens ?? []).map((token) => [token.name, token]));
  const productionTokenMap = new Map();
  for (const { label, report } of eligibleProductions) {
    for (const token of (report.tokens ?? [])) {
      if (!productionTokenMap.has(token.name)) productionTokenMap.set(token.name, []);
      productionTokenMap.get(token.name).push({ label, token });
    }
  }

  for (const [name, entries] of productionTokenMap) {
    const productionValues = new Set(entries.map(({ token }) => token.normalizedValue));
    const catalogueToken = catalogueTokenMap.get(name);
    if (productionValues.size > 1) {
      errors.push(makeIssue(
        'error',
        'production-token-drift',
        `Production reports resolve ${name} to different values.`,
        { token: name, values: Array.from(productionValues), reports: entries.map((entry) => entry.label) }
      ));
    }

    if (!catalogueToken) {
      errors.push(makeIssue('error', 'catalogue-missing-token', `Catalogue is missing production token ${name}.`, {
        token: name,
        reports: entries.map((entry) => entry.label)
      }));
      tokenComparisons.push({
        status: 'MISSING',
        token: name,
        productionValues: Array.from(productionValues),
        catalogueValue: null
      });
      continue;
    }

    const matches = productionValues.size === 1 && productionValues.has(catalogueToken.normalizedValue);
    if (!matches) {
      errors.push(makeIssue(
        'error',
        'production-catalogue-token-drift',
        `Production and catalogue resolve ${name} to different values.`,
        {
          token: name,
          productionValues: Array.from(productionValues),
          catalogueValue: catalogueToken.normalizedValue
        }
      ));
    }
    tokenComparisons.push({
      status: matches ? 'ok' : 'DRIFT',
      token: name,
      productionValues: Array.from(productionValues),
      catalogueValue: catalogueToken.normalizedValue
    });
  }

  for (const [name, token] of catalogueTokenMap) {
    if (productionTokenMap.has(name)) continue;
    warnings.push(makeIssue(
      'warning',
      'catalogue-only-token',
      `Catalogue token ${name} was not found in the supplied production reports.`,
      { token: name }
    ));
    tokenComparisons.push({
      status: 'CATALOGUE ONLY',
      token: name,
      productionValues: [],
      catalogueValue: token.normalizedValue
    });
  }

  comparisons.sort((left, right) => String(left.key).localeCompare(String(right.key)));
  tokenComparisons.sort((left, right) => left.token.localeCompare(right.token));
  const result = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    passed: errors.length === 0,
    errors,
    warnings,
    comparisons,
    tokenComparisons,
    summary: {
      viewport: catalogueViewport,
      productionReports: productions.length,
      comparedProductionReports: eligibleProductions.length,
      productionKeys: productionMap.size,
      catalogueKeys: catalogueMap.size,
      matchedKeys: comparisons.filter((entry) => entry.status === 'ok').length,
      missingCatalogueKeys: comparisons.filter((entry) => entry.status === 'MISSING').length,
      driftedKeys: comparisons.filter((entry) => entry.status === 'DRIFT').length,
      catalogueOnlyKeys: comparisons.filter((entry) => entry.status === 'CATALOGUE ONLY').length,
      productionTokens: productionTokenMap.size,
      catalogueTokens: catalogueTokenMap.size,
      matchedTokens: tokenComparisons.filter((entry) => entry.status === 'ok').length,
      missingCatalogueTokens: tokenComparisons.filter((entry) => entry.status === 'MISSING').length,
      driftedTokens: tokenComparisons.filter((entry) => entry.status === 'DRIFT').length,
      catalogueOnlyTokens: tokenComparisons.filter((entry) => entry.status === 'CATALOGUE ONLY').length,
      errors: errors.length,
      warnings: warnings.length,
      verifies: ['runtime-key-coverage', 'same-viewport-computed-style-consistency'],
      doesNotVerify: [
        'source-import-graph',
        'reference-fidelity',
        'section-composition',
        'unique-local-visuals'
      ]
    }
  };

  if (printTable) {
    const consoleObject = globalThis.console;
    printComparisonTable(result, consoleObject);
  }
  return result;
}

if (typeof window !== 'undefined') {
  window.SiteDesignSystemAudit = {
    validateDesignSystemContract,
    runDesignSystemAudit,
    compareDesignSystemAuditReports
  };
}
