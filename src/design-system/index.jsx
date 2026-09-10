import React from 'react'

const deepFreeze = (value) => {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child)
  })
  return Object.freeze(value)
}

const cx = (...values) => values.filter(Boolean).join(' ')

export const PRIMARY_SIZE_SCALE = Object.freeze(['small', 'medium', 'large'])
export const PRIMARY_SPACING_SCALE = Object.freeze(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl'])
export const PRIMARY_TYPOGRAPHY_ROLES = Object.freeze([
  'heading-small',
  'heading-medium',
  'heading-large',
  'body-small',
  'body-medium',
  'body-large',
])
export const PRIMARY_BODY_BOLD_ROLES = Object.freeze([
  'body-small-bold',
  'body-medium-bold',
  'body-large-bold',
])
export const PROJECT_TYPOGRAPHY_ROLES = Object.freeze([
  'display',
  'h1',
  'h2',
  'h3',
  'body-large',
  'body',
  'label',
  'number-small',
  'number-large',
  'button',
])

export const FONT_FAMILY_FOUNDATION = deepFreeze([
  { role: 'Primary', name: 'Neue Haas Grotesk Display Pro', token: '--ds-font-primary' },
  { role: 'Secondary', name: 'Neue Haas Grotesk Display Pro', token: '--ds-font-secondary' },
])

export const GRID_FOUNDATION = deepFreeze({
  maxWidthToken:
    '--ds-grid-max-width',
  active: {
    columnsToken:
      '--ds-grid-columns',
    marginToken:
      '--ds-grid-margin',
    gutterToken:
      '--ds-grid-gutter',
  },
  modes: [
    { label: 'Desktop', columnsToken: '--ds-grid-desktop-columns', marginToken: '--ds-grid-desktop-margin', gutterToken: '--ds-grid-desktop-gutter' },
    { label: 'Tablet', columnsToken: '--ds-grid-tablet-columns', marginToken: '--ds-grid-tablet-margin', gutterToken: '--ds-grid-tablet-gutter' },
    { label: 'Mobile', columnsToken: '--ds-grid-mobile-columns', marginToken: '--ds-grid-mobile-margin', gutterToken: '--ds-grid-mobile-gutter' },
  ],
})

const GRID_FOUNDATION_ITEMS = deepFreeze([
  ['Grid max width', GRID_FOUNDATION.maxWidthToken],
  ...GRID_FOUNDATION.modes.flatMap(({ label, columnsToken, marginToken, gutterToken }) => [
    [`${label} columns`, columnsToken],
    [`${label} margin`, marginToken],
    [`${label} gutter`, gutterToken],
  ]),
])

export const ICON_FAMILY_FOUNDATION = deepFreeze({
  name: 'Skip canonical SVG icons',
  source: 'input/*.svg',
})

export const DS_CONTRACT = deepFreeze({
  version: 1,
  foundations: { fonts: FONT_FAMILY_FOUNDATION, grid: GRID_FOUNDATION, icons: ICON_FAMILY_FOUNDATION },
  tokens:
  {
    font: FONT_FAMILY_FOUNDATION.map(({ role, token }) => [role, token]),
    color: [
      ['Canvas', '--ds-color-canvas'],
      ['Surface', '--ds-color-surface'],
      ['Soft surface', '--ds-color-surface-soft'],
      ['Testimonial surface', '--ds-color-surface-testimonial'],
      ['Ink', '--ds-color-ink'],
      ['Emphasis ink', '--ds-color-ink-emphasis'],
      ['Muted', '--ds-color-muted'],
      ['Border', '--ds-color-border'],
      ['Action', '--ds-color-action'],
      ['Action hover', '--ds-color-action-hover'],
      ['Action active', '--ds-color-action-active'],
      ['On action', '--ds-color-on-action'],
      ['Focus', '--ds-color-focus'],
      ['Error', '--ds-color-error'],
    ],
    spacing: PRIMARY_SPACING_SCALE.map((size) => [size.toUpperCase(), `--ds-space-${size}`]),
    grid: GRID_FOUNDATION_ITEMS,
    geometry: [
      ['Small control', '--ds-control-small'],
      ['Medium control', '--ds-control-medium'],
      ['Large control', '--ds-control-large'],
    ],
    radius: PRIMARY_SIZE_SCALE.map((size) => [`${size} radius`, `--ds-radius-${size}`]),
  },
  themes: {
    default: { coverage: 'all' },
    inverse: {
      coverage: 'allowlist',
      specimens: [
        ['button', 'primary', 'medium', 'default'],
        ['button', 'primary', 'large', 'default'],
        ['button', 'primary-borderless', 'small', 'default'],
        ['button', 'primary-borderless', 'large', 'default'],
        ['button', 'secondary', 'medium', 'default'],
        ['icon-button', 'plain', 'medium', 'default'],
        ['icon-link', 'outline', 'medium', 'default'],
        ['icon-link', 'outline', 'medium', 'disabled'],
        ['icon-link', 'outline-muted', 'medium', 'default'],
        ['icon-link', 'outline-muted', 'medium', 'disabled'],
        ['link', 'nav', 'medium', 'default'],
        ['link', 'footer', 'medium', 'default'],
        ['link', 'footer', 'medium', 'disabled'],
        ['link', 'footer-secondary', 'medium', 'default'],
        ['link', 'footer-secondary', 'medium', 'disabled'],
        ['metric-row', 'default', 'medium', 'default'],
        ['divider', 'default', 'medium', 'default'],
        ['divider', 'vertical', 'medium', 'default'],
        ['divider', 'subtle-vertical', 'medium', 'default'],
        ['divider', 'subtle', 'medium', 'default'],
        ['site-header', 'hero', 'medium', 'default'],
        ['field', 'input', 'medium', 'default'],
        ['field', 'input', 'medium', 'invalid'],
        ['field', 'input', 'medium', 'disabled'],
        ['field', 'select', 'medium', 'default'],
        ['field', 'select', 'medium', 'invalid'],
        ['field', 'select', 'medium', 'disabled'],
      ],
    },
  },
  typography: Array.from(new Set([
    ...PROJECT_TYPOGRAPHY_ROLES,
    ...PRIMARY_TYPOGRAPHY_ROLES,
    ...PRIMARY_BODY_BOLD_ROLES,
    'metadata',
  ])),
  components: {
    button: { variants: ['primary', 'primary-borderless', 'secondary', 'outline'], sizes: [...PRIMARY_SIZE_SCALE], states: ['default', 'disabled'] },
    link: { variants: ['text', 'nav', 'footer', 'footer-secondary'], sizes: ['medium'], states: ['default', 'disabled'] },
    'icon-button': { variants: ['plain', 'outline', 'outline-ink'], sizes: ['small', 'medium'], glyphSizes: ['default', 'large'], states: ['default', 'disabled'] },
    'icon-link': { variants: ['outline', 'outline-muted'], sizes: ['small', 'medium'], states: ['default', 'disabled'] },
    'metric-row': { variants: ['default'], sizes: ['medium'], states: ['default'] },
    divider: { variants: ['default', 'subtle', 'vertical', 'subtle-vertical'], sizes: ['medium'], states: ['default'] },
    'site-header': { variants: ['hero', 'compact'], sizes: ['medium'], states: ['default'] },
    field: { variants: ['input', 'select'], sizes: ['medium'], states: ['default', 'invalid', 'disabled'] },
  },
})

const typographyRoles = DS_CONTRACT.typography
const assertContractOption = (family, key, value) => {
  const allowed = DS_CONTRACT.components[family]?.[key]
  if (!allowed?.includes(value)) throw new Error(`Unknown ${family} ${key}: ${value}`)
}

export function Type({ as = 'p', role = 'body', className = '', children, ...props }) {
  if (!typographyRoles.includes(role)) throw new Error(`Unknown typography role: ${role}`)
  const Tag = as
  return <Tag {...props} className={cx('ds-type', className)} data-type-role={role}>{children}</Tag>
}

export function Container({ as = 'div', className = '', children, ...props }) {
  const Tag = as
  return <Tag {...props} className={cx('ds-grid-container', className)}>{children}</Tag>
}

export function PageGrid({ as = 'div', className = '', children, ...props }) {
  const Tag = as
  return <Tag {...props} className={cx('ds-grid-container', 'ds-page-grid', className)}>{children}</Tag>
}

export function Field({
  id,
  name = id,
  label,
  type = 'text',
  options,
  placeholder = 'Select a country or region',
  error = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  if (!id || !label) throw new Error('Field requires an id and label')
  const variant = options ? 'select' : 'input'
  const state = disabled ? 'disabled' : error ? 'invalid' : 'default'
  const errorId = `${id}-error`
  assertContractOption('field', 'variants', variant)
  assertContractOption('field', 'states', state)

  const controlProps = {
    id,
    name,
    required,
    disabled,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? errorId : undefined,
    'data-ds-part': 'control',
  }

  return (
    <div className={cx('ds-field', className)} data-ds-component="field" data-ds-variant={variant} data-ds-size="medium" data-ds-state={state}>
      <label htmlFor={id}>{label}</label>
      <span className="ds-field__control">
        {variant === 'select'
          ? <select {...props} {...controlProps}><option value="" disabled>{placeholder}</option>{options.map(({ code, value = code, label: optionLabel }) => <option key={value} value={value}>{optionLabel}</option>)}</select>
          : <input {...props} id={id} name={name} type={type} required={required} disabled={disabled} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? errorId : undefined} data-ds-part="control" />}
        {variant === 'select' && <svg className="ds-field__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" /></svg>}
      </span>
      {error && <span className="ds-field__error" id={errorId} role="alert">{error}</span>}
    </div>
  )
}

export function Button({ href, variant = 'primary', size = 'medium', disabled = false, icon, className = '', children, ...props }) {
  assertContractOption('button', 'variants', variant)
  assertContractOption('button', 'sizes', size)
  const Tag = href ? 'a' : 'button'
  const state = disabled ? 'disabled' : 'default'
  const tagProps = href
    ? { href: disabled ? undefined : href, 'aria-disabled': disabled || undefined }
    : { type: props.type ?? 'button', disabled }
  return (
    <Tag {...props} {...tagProps} className={cx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, className)} data-ds-component="button" data-ds-variant={variant} data-ds-size={size} data-ds-state={state}>
      <span className="ds-button__label-swap button__label"><span className="button__label-current">{children}</span><span className="button__label-duplicate" aria-hidden="true">{children}</span></span>
      {icon && <span className="ds-button__icon" aria-hidden="true">{icon}</span>}
    </Tag>
  )
}

export function Link({ href, variant = 'text', className = '', children, ...props }) {
  assertContractOption('link', 'variants', variant)
  assertContractOption('link', 'states', href ? 'default' : 'disabled')
  const Tag = href ? 'a' : 'span'
  const tagProps = href ? { href } : {}
  return <Tag {...props} {...tagProps} className={cx('ds-link', `ds-link--${variant}`, className)} data-ds-component="link" data-ds-variant={variant} data-ds-size="medium" data-ds-state={href ? 'default' : 'disabled'}><span>{children}</span></Tag>
}

export function IconButton({ label, variant = 'plain', size = 'medium', glyphSize = 'default', disabled = false, icon, iconSource, className = '', ...props }) {
  assertContractOption('icon-button', 'variants', variant)
  assertContractOption('icon-button', 'sizes', size)
  assertContractOption('icon-button', 'glyphSizes', glyphSize)
  if (!label || (!icon && !iconSource)) throw new Error('IconButton requires label and an icon or iconSource')
  const iconStyle = iconSource ? { '--ds-icon-source': `url("${iconSource}")` } : undefined
  return <button {...props} type="button" aria-label={label} disabled={disabled} className={cx('ds-icon-button', `ds-icon-button--${variant}`, `ds-icon-button--${size}`, `ds-icon-button--glyph-${glyphSize}`, className)} data-ds-component="icon-button" data-ds-variant={variant} data-ds-size={size} data-ds-glyph-size={glyphSize} data-ds-state={disabled ? 'disabled' : 'default'}><span className={iconSource ? 'ds-icon-button__mask' : undefined} style={iconStyle} aria-hidden="true">{iconSource ? null : icon}</span></button>
}

export function IconLink({ href, label, variant = 'outline', size = 'medium', icon, iconSource, className = '', ...props }) {
  assertContractOption('icon-link', 'variants', variant)
  assertContractOption('icon-link', 'sizes', size)
  if (!label || (!icon && !iconSource)) throw new Error('IconLink requires label and an icon or iconSource')
  assertContractOption('icon-link', 'states', href ? 'default' : 'disabled')
  const Tag = href ? 'a' : 'span'
  const tagProps = href ? { href, 'aria-label': label } : { 'aria-hidden': true }
  const iconStyle = iconSource ? { '--ds-icon-source': `url("${iconSource}")` } : undefined
  return <Tag {...props} {...tagProps} className={cx('ds-icon-link', `ds-icon-link--${variant}`, `ds-icon-link--${size}`, className)} data-ds-component="icon-link" data-ds-variant={variant} data-ds-size={size} data-ds-state={href ? 'default' : 'disabled'}><span className={iconSource ? 'ds-icon-link__mask' : undefined} style={iconStyle} aria-hidden="true">{iconSource ? null : icon}</span></Tag>
}

export function Divider({ variant = 'default', className = '', ...props }) {
  assertContractOption('divider', 'variants', variant)
  return <hr {...props} className={cx('ds-divider', `ds-divider--${variant}`, className)} data-ds-component="divider" data-ds-variant={variant} data-ds-size="medium" data-ds-state="default" />
}

export function MetricRow({ label, value, className = '', valueRole = 'number-small' }) {
  return <div className={cx('ds-metric-row', className)} data-ds-component="metric-row" data-ds-variant="default" data-ds-size="medium" data-ds-state="default"><Type as="span" role="body">{label}</Type><Type as="span" role={valueRole}>{value}</Type></div>
}

export function SiteHeader({ logo, navigation, basketIcon, brandLabel = 'Skip home', brandAlt = 'Skip', navigationLabel = 'Primary navigation', basketLabel = 'Pre-order MO/GO', preorderLabel = 'PRE-ORDER', menuOpenLabel = 'MENU', menuCloseLabel = 'CLOSE', state = 'hero', navigationId = 'primary-navigation', menuOpen = false, onMenuToggle, onNavigate, onBasketActivate, onPreorderActivate, preorderHref = '#reserve', preorderTrigger, className = '', ...props }) {
  const variant = state === 'hero' ? 'hero' : 'compact'
  return (
    <header {...props} className={cx('ds-site-header', `ds-site-header--${variant}`, className)} data-ds-component="site-header" data-ds-variant={variant} data-ds-size="medium" data-ds-state="default" data-ds-theme="inverse" data-header-state={state}>
      <a href="#top" className="ds-site-header__brand" aria-label={brandLabel}><img src={logo} alt={brandAlt} /></a>
      <nav id={navigationId} aria-label={navigationLabel} data-menu-open={menuOpen}><ul>{navigation.map(({ label, href }) => <li key={label}><Link variant="nav" href={href} onClick={onNavigate}>{label}</Link></li>)}</ul></nav>
      <div className="ds-site-header__actions">
        <IconButton label={basketLabel} variant="plain" size="small" onClick={onBasketActivate} icon={<img src={basketIcon} alt="" />} />
        <Button href={onPreorderActivate ? undefined : preorderHref} onClick={onPreorderActivate} data-preorder-trigger={preorderTrigger} variant="outline" size="small">{preorderLabel}</Button>
        <Button variant="outline" size="small" className="ds-site-header__menu" onClick={onMenuToggle} aria-expanded={menuOpen} aria-controls={navigationId}>{menuOpen ? menuCloseLabel : menuOpenLabel}</Button>
      </div>
    </header>
  )
}
