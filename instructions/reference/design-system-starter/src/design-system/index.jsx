import React, { useEffect, useId, useState } from 'react'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles.css'

const deepFreeze = (value) => {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child)
  })
  return Object.freeze(value)
}

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
export const PRIMARY_BODY_BOLD_ROLES = Object.freeze(
  PRIMARY_SIZE_SCALE.map((size) => `body-${size}-bold`),
)

export const FONT_FAMILY_FOUNDATION = deepFreeze([
  { role: 'Primary', name: 'Inter', token: '--ds-font-primary' },
  { role: 'Secondary', name: 'Instrument Sans', token: '--ds-font-secondary' },
])

export const GRID_FOUNDATION = deepFreeze({
  maxWidthToken: '--ds-grid-max-width',
  active: {
    columnsToken: '--ds-grid-columns',
    marginToken: '--ds-grid-margin',
    gutterToken: '--ds-grid-gutter',
  },
  modes: [
    {
      label: 'Desktop',
      columnsToken: '--ds-grid-desktop-columns',
      marginToken: '--ds-grid-desktop-margin',
      gutterToken: '--ds-grid-desktop-gutter',
    },
    {
      label: 'Tablet',
      columnsToken: '--ds-grid-tablet-columns',
      marginToken: '--ds-grid-tablet-margin',
      gutterToken: '--ds-grid-tablet-gutter',
    },
    {
      label: 'Mobile',
      columnsToken: '--ds-grid-mobile-columns',
      marginToken: '--ds-grid-mobile-margin',
      gutterToken: '--ds-grid-mobile-gutter',
    },
  ],
})

const GRID_TOKEN_FOUNDATION = deepFreeze([
  ['Grid max width', GRID_FOUNDATION.maxWidthToken],
  ...GRID_FOUNDATION.modes.flatMap(({ label, columnsToken, marginToken, gutterToken }) => [
    [`${label} columns`, columnsToken],
    [`${label} margin`, marginToken],
    [`${label} gutter`, gutterToken],
  ]),
])

export const ICON_FAMILY_FOUNDATION = deepFreeze({
  name: 'Font Awesome',
  package: '@fortawesome/fontawesome-free',
})

export const DS_CONTRACT = deepFreeze({
  version: 9,
  foundations: {
    fonts: FONT_FAMILY_FOUNDATION,
    grid: GRID_FOUNDATION,
    icons: ICON_FAMILY_FOUNDATION,
  },
  tokens: {
    font: FONT_FAMILY_FOUNDATION.map(({ role, token }) => [role, token]),
    color: [
      ['Canvas', '--ds-color-canvas'],
      ['Surface', '--ds-color-surface'],
      ['Soft surface', '--ds-color-surface-soft'],
      ['Ink', '--ds-color-ink'],
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
    grid: GRID_TOKEN_FOUNDATION,
    geometry: [
      ['Small control', '--ds-control-small'],
      ['Medium control', '--ds-control-medium'],
      ['Large control', '--ds-control-large'],
    ],
    radius: PRIMARY_SIZE_SCALE.map((size) => [
      `${size[0].toUpperCase()}${size.slice(1)} radius`,
      `--ds-radius-${size}`,
    ]),
  },
  themes: {
    default: { coverage: 'all' },
    inverse: {
      coverage: 'allowlist',
      specimens: [
        ['button', 'primary', 'medium', 'default'],
        ['button', 'secondary', 'medium', 'default'],
        ['icon-button', 'secondary', 'medium', 'default'],
        ['link', 'text', 'medium', 'default'],
        ['field', 'input', 'medium', 'default'],
        ['choice', 'checkbox', 'medium', 'default', 'unchecked'],
      ],
    },
  },
  typography: [...PRIMARY_TYPOGRAPHY_ROLES, ...PRIMARY_BODY_BOLD_ROLES, 'label', 'metadata'],
  components: {
    button: {
      variants: ['primary', 'secondary'],
      sizes: [...PRIMARY_SIZE_SCALE],
      states: ['default', 'disabled'],
    },
    link: {
      variants: ['text', 'nav'],
      sizes: ['medium'],
      states: ['default'],
    },
    'icon-button': {
      variants: ['primary', 'secondary'],
      sizes: ['small', 'medium'],
      states: ['default', 'disabled'],
    },
    field: {
      variants: ['input', 'textarea', 'select'],
      sizes: ['medium'],
      states: ['default', 'error', 'disabled'],
    },
    choice: {
      variants: ['checkbox', 'radio'],
      sizes: ['medium'],
      states: ['default', 'error', 'disabled'],
      selection: ['unchecked', 'checked'],
    },
  },
})

const missingPrimaryTypography = PRIMARY_TYPOGRAPHY_ROLES.filter(
  (role) => !DS_CONTRACT.typography.includes(role),
)
const missingPrimaryBodyBold = PRIMARY_BODY_BOLD_ROLES.filter(
  (role) => !DS_CONTRACT.typography.includes(role),
)
const missingPrimaryButtonSizes = PRIMARY_SIZE_SCALE.filter(
  (size) => !DS_CONTRACT.components.button.sizes.includes(size),
)
const missingPrimarySpacing = ['xs', 's', 'm', 'l', 'xl'].filter(
  (size) => !DS_CONTRACT.tokens.spacing.some(([, token]) => token === `--ds-space-${size}`),
)
const missingPrimaryRadii = PRIMARY_SIZE_SCALE.filter(
  (size) => !DS_CONTRACT.tokens.radius.some(([, token]) => token === `--ds-radius-${size}`),
)
const missingFontFoundations = ['Primary', 'Secondary'].filter(
  (role) => !DS_CONTRACT.foundations.fonts.some((font) => (
    font.role === role
      && typeof font.name === 'string'
      && font.name.trim()
      && typeof font.token === 'string'
      && font.token.startsWith('--')
  )),
)
const isCssTokenName = (value) => /^--[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)
const gridTokenNames = new Set(DS_CONTRACT.tokens.grid.map(([, token]) => token))
const missingGridFoundations = ['Desktop', 'Tablet', 'Mobile'].filter((label) => {
  const mode = DS_CONTRACT.foundations.grid.modes?.find((entry) => entry.label === label)
  return !mode || ['columnsToken', 'marginToken', 'gutterToken'].some((key) => (
    !isCssTokenName(mode[key]) || !gridTokenNames.has(mode[key])
  ))
})
const invalidGridRuntime = !isCssTokenName(DS_CONTRACT.foundations.grid.maxWidthToken)
  || !gridTokenNames.has(DS_CONTRACT.foundations.grid.maxWidthToken)
  || ['columnsToken', 'marginToken', 'gutterToken'].some((key) => (
    !isCssTokenName(DS_CONTRACT.foundations.grid.active?.[key])
  ))
const missingIconFoundation = !(
  typeof DS_CONTRACT.foundations.icons?.name === 'string'
    && DS_CONTRACT.foundations.icons.name.trim()
    && ['package', 'source'].some((key) => (
      typeof DS_CONTRACT.foundations.icons[key] === 'string'
        && DS_CONTRACT.foundations.icons[key].trim()
    ))
)
const tokenNames = Object.values(DS_CONTRACT.tokens)
  .flatMap((entries) => entries.map(([, token]) => token))
const duplicateTokenNames = [...new Set(
  tokenNames.filter((token, index) => tokenNames.indexOf(token) !== index),
)]

if (
  missingPrimaryTypography.length
  || missingPrimaryBodyBold.length
  || missingPrimaryButtonSizes.length
  || missingPrimarySpacing.length
  || missingPrimaryRadii.length
  || missingFontFoundations.length
  || missingGridFoundations.length
  || invalidGridRuntime
  || missingIconFoundation
  || duplicateTokenNames.length
) {
  throw new Error(
    `Incomplete primary design-system scale: ${[
      ...missingPrimaryTypography,
      ...missingPrimaryBodyBold,
      ...missingPrimaryButtonSizes.map((size) => `button-${size}`),
      ...missingPrimarySpacing.map((size) => `spacing-${size}`),
      ...missingPrimaryRadii.map((size) => `radius-${size}`),
      ...missingFontFoundations.map((role) => `font-${role.toLowerCase()}`),
      ...missingGridFoundations.map((label) => `grid-${label.toLowerCase()}`),
      ...(invalidGridRuntime ? ['grid-runtime'] : []),
      ...(missingIconFoundation ? ['icon-family-source'] : []),
      ...duplicateTokenNames.map((token) => `duplicate-token-${token}`),
    ].join(', ')}`,
  )
}

const typographyRoles = DS_CONTRACT.typography

const cx = (...values) => values.filter(Boolean).join(' ')

const assertContractOption = (family, key, value) => {
  const allowed = DS_CONTRACT.components[family]?.[key]
  if (!allowed?.includes(value)) {
    throw new Error(`Unknown ${family} ${key}: "${value}". Allowed: ${allowed?.join(', ')}`)
  }
  return value
}

const stateOf = ({ disabled, error }) => {
  if (disabled) return 'disabled'
  if (error) return 'error'
  return 'default'
}

export function Type({ as = 'p', role = 'body-medium', className = '', children, ...props }) {
  if (!typographyRoles.includes(role)) {
    throw new Error(`Unknown typography role: "${role}"`)
  }
  const Tag = as
  return (
    <Tag {...props} className={cx('ds-type', className)} data-type-role={role}>
      {children}
    </Tag>
  )
}

export function Container({ as = 'div', className = '', children, ...props }) {
  const Tag = as
  return (
    <Tag {...props} className={cx('ds-grid-container', className)}>
      {children}
    </Tag>
  )
}

export function PageGrid({ as = 'div', className = '', children, ...props }) {
  const Tag = as
  return (
    <Tag {...props} className={cx('ds-grid-container', 'ds-page-grid', className)}>
      {children}
    </Tag>
  )
}

const readActiveGridColumns = () => {
  if (typeof window === 'undefined') return 0
  const token = DS_CONTRACT.foundations.grid.active.columnsToken
  const value = Number.parseInt(window.getComputedStyle(document.documentElement).getPropertyValue(token), 10)
  return Number.isInteger(value) && value > 0 ? value : 0
}

export function GridOverlay({ visible = false, className = '', ...props }) {
  const [columns, setColumns] = useState(readActiveGridColumns)

  useEffect(() => {
    const syncColumns = () => setColumns(readActiveGridColumns())
    syncColumns()
    window.addEventListener('resize', syncColumns)
    return () => window.removeEventListener('resize', syncColumns)
  }, [])

  if (!visible) return null

  return (
    <div
      {...props}
      className={cx('ds-grid-overlay', className)}
      data-grid-overlay="true"
      aria-hidden="true"
    >
      <span className="ds-grid-container ds-page-grid ds-grid-overlay__columns">
        {Array.from({ length: columns }, (_, index) => <i key={index} />)}
      </span>
    </div>
  )
}

export function Button({
  href,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  className = '',
  children,
  ...props
}) {
  assertContractOption('button', 'variants', variant)
  assertContractOption('button', 'sizes', size)
  const state = stateOf({ disabled })
  const Tag = href ? 'a' : 'button'
  const tagProps = href
    ? {
        href: disabled ? undefined : href,
        'aria-disabled': disabled || undefined,
        onClick: disabled ? (event) => event.preventDefault() : props.onClick,
      }
    : { type: props.type ?? 'button', disabled }

  return (
    <Tag
      className={cx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, className)}
      {...props}
      {...tagProps}
      data-ds-component="button"
      data-ds-variant={variant}
      data-ds-size={size}
      data-ds-state={state}
    >
      <span className="ds-button__label">{children}</span>
      {icon && <span className="ds-button__icon" aria-hidden="true">{icon}</span>}
    </Tag>
  )
}

export function Link({
  href = '#',
  variant = 'text',
  icon,
  className = '',
  children,
  ...props
}) {
  assertContractOption('link', 'variants', variant)
  return (
    <a
      {...props}
      className={cx('ds-link', `ds-link--${variant}`, className)}
      data-ds-component="link"
      data-ds-variant={variant}
      data-ds-size="medium"
      data-ds-state="default"
      href={href}
    >
      <span>{children}</span>
      {icon && <span className="ds-link__icon" aria-hidden="true">{icon}</span>}
    </a>
  )
}

export function IconButton({
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  className = '',
  ...props
}) {
  assertContractOption('icon-button', 'variants', variant)
  assertContractOption('icon-button', 'sizes', size)
  if (!label) throw new Error('IconButton requires an accessible label')
  if (!icon) throw new Error('IconButton requires an icon from the project icon source')
  return (
    <button
      {...props}
      className={cx(
        'ds-icon-button',
        `ds-icon-button--${variant}`,
        `ds-icon-button--${size}`,
        className,
      )}
      data-ds-component="icon-button"
      data-ds-variant={variant}
      data-ds-size={size}
      data-ds-state={stateOf({ disabled })}
      type="button"
      aria-label={label}
      disabled={disabled}
    >
      <span className="ds-icon-button__icon" aria-hidden="true">{icon}</span>
    </button>
  )
}

export function Field({
  kind = 'input',
  type = 'text',
  label,
  helper,
  error,
  disabled = false,
  options = [],
  id: providedId,
  className = '',
  ...props
}) {
  assertContractOption('field', 'variants', kind)
  if (!String(label ?? '').trim()) throw new Error('Field requires a visible label')
  const generatedId = useId()
  const id = providedId ?? generatedId
  const message = error || helper
  const state = stateOf({ disabled, error })
  const controlProps = {
    id,
    disabled,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': message ? `${id}-message` : undefined,
    'data-ds-part': 'control',
  }

  let control
  if (kind === 'textarea') {
    control = <textarea {...props} rows="4" {...controlProps} />
  } else if (kind === 'select') {
    control = (
      <select {...props} {...controlProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else {
    control = <input {...props} type={type} {...controlProps} />
  }

  return (
    <div
      className={cx('ds-field', className)}
      data-ds-component="field"
      data-ds-variant={kind}
      data-ds-size="medium"
      data-ds-state={state}
    >
      <label className="ds-field__label" data-ds-part="label" htmlFor={id}>
        {label}
      </label>
      {control}
      {message && (
        <span
          className={cx('ds-field__message', error && 'ds-field__message--error')}
          data-ds-part="helper"
          id={`${id}-message`}
          aria-live={error ? 'polite' : undefined}
        >
          {message}
        </span>
      )}
    </div>
  )
}

export function Choice({
  kind = 'checkbox',
  label,
  description,
  error,
  disabled = false,
  className = '',
  id: providedId,
  checked,
  defaultChecked = false,
  onChange,
  ...props
}) {
  assertContractOption('choice', 'variants', kind)
  if (!String(label ?? '').trim()) throw new Error('Choice requires a visible label')
  const generatedId = useId()
  const id = providedId ?? generatedId
  const state = stateOf({ disabled, error })
  assertContractOption('choice', 'states', state)
  const labelId = `${id}-label`
  const descriptionId = description || error ? `${id}-description` : undefined
  return (
    <label
      className={cx('ds-choice', className)}
      data-ds-component="choice"
      data-ds-variant={kind}
      data-ds-size="medium"
      data-ds-state={state}
      htmlFor={id}
    >
      <input
        {...props}
        id={id}
        className="ds-choice__control"
        data-ds-part="control"
        type={kind}
        checked={checked}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onChange={onChange}
      />
      <span className="ds-choice__content">
        <span className="ds-choice__label" data-ds-part="label" id={labelId}>
          {label}
        </span>
        {(description || error) && (
          <span
            className={cx('ds-choice__description', error && 'ds-choice__description--error')}
            data-ds-part="helper"
            id={descriptionId}
            aria-live={error ? 'polite' : undefined}
          >
            {error || description}
          </span>
        )}
      </span>
    </label>
  )
}
