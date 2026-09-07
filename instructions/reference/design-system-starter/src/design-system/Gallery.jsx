import React, { useEffect, useState } from 'react'
import {
  Button,
  Choice,
  DS_CONTRACT,
  Field,
  IconButton,
  Link,
  Type,
} from './index.jsx'
import './gallery.css'

// The catalogue exposes its project-owned contract to the dependency-free
// runtime audit. Production routes do not import Gallery and therefore do not
// receive this review-only global.
if (typeof window !== 'undefined') window.SiteDesignSystemContract = DS_CONTRACT

function DemoArrow({ direction = 'right' }) {
  return (
    <i
      className={direction === 'up-right'
        ? 'fa-solid fa-arrow-up-right-from-square'
        : 'fa-solid fa-arrow-right'}
      aria-hidden="true"
    />
  )
}

function DemoPlus() {
  return <i className="fa-solid fa-plus" aria-hidden="true" />
}

const fieldOptions = [
  { value: 'website', label: 'Website' },
  { value: 'product', label: 'Product interface' },
  { value: 'campaign', label: 'Campaign' },
]

const fieldProps = (kind, state) => ({
  kind,
  label: `${kind[0].toUpperCase()}${kind.slice(1)} · ${state}`,
  placeholder: kind === 'textarea' ? 'Add context for the team' : 'Enter a value',
  type: kind === 'input' ? 'email' : undefined,
  options: kind === 'select' ? fieldOptions : undefined,
  defaultValue: kind === 'select' ? 'website' : undefined,
  helper: state === 'default' ? 'Calibrated from the same production source.' : undefined,
  error: state === 'error' ? 'Review this value and try again.' : undefined,
  disabled: state === 'disabled',
})

const renderInverseSpecimen = ([component, variant, size, state, selection = 'unchecked']) => {
  const contract = DS_CONTRACT.components[component]
  if (!contract?.variants.includes(variant) || !contract.sizes.includes(size) || !contract.states.includes(state)) {
    throw new Error(`Invalid inverse specimen: ${[component, variant, size, state].join('/')}`)
  }
  if (component === 'choice' && !contract.selection.includes(selection)) {
    throw new Error(`Invalid inverse choice selection: ${selection}`)
  }
  const key = [component, variant, size, state, selection].join('-')
  const disabled = state === 'disabled'
  const error = state === 'error' ? 'Review this value.' : undefined
  if (component === 'button') {
    return <Button key={key} variant={variant} size={size} disabled={disabled}>{variant} action</Button>
  }
  if (component === 'icon-button') {
    return <IconButton key={key} label={`${variant} action`} variant={variant} size={size} icon={<DemoArrow />} disabled={disabled} />
  }
  if (component === 'link') {
    return <Link key={key} href="#top" variant={variant} icon={<DemoArrow direction="up-right" />}>Back to top</Link>
  }
  if (component === 'field') {
    return <Field key={key} {...fieldProps(variant, state)} label="Inverse field" placeholder="Type on a dark surface" />
  }
  if (component === 'choice') {
    return <Choice key={key} kind={variant} label="Inverse choice" description="Allowed by the inverse contract." error={error} disabled={disabled} defaultChecked={selection === 'checked'} name={`inverse-${key}`} />
  }
  throw new Error(`Unknown inverse specimen: ${component}`)
}

const sizeLabels = {
  small: 'S',
  medium: 'M',
  large: 'L',
}

const typographySamples = {
  heading: {
    small: 'Compact content heading',
    medium: 'A consistent section heading',
    large: 'A clear opening statement',
  },
  body: {
    small: 'Small supporting copy for dense content and helpers.',
    medium: 'Body copy stays calm, readable and reusable across the project.',
    large: 'Lead copy introduces a section with a little more presence.',
  },
  auxiliary: {
    label: 'Section label',
    metadata: 'Updated 12 minutes ago',
  },
}

const galleryNavigation = [
  {
    label: 'Foundations',
    links: [
      ['Basic', '#basic'],
      ['Colors', '#colors'],
      ['Spacing and Sizes', '#spacing'],
      ['Typography', '#typography'],
    ],
  },
  {
    label: 'Components',
    links: [
      ['Button', '#actions'],
      ['Forms', '#forms'],
    ],
  },
  {
    label: 'Context',
    links: [['Inverse theme', '#themes']],
  },
]

function GallerySidebar() {
  return (
    <aside className="ds-preview-sidebar">
      <a className="ds-preview-sidebar__brand" href="#basic" aria-label="Design system start">
        <span>DS</span>
        <span>Starter</span>
      </a>
      <nav className="ds-preview-nav" aria-label="Design system sections">
        {galleryNavigation.map((group) => (
          <div className="ds-preview-nav__group" key={group.label}>
            <Type role="label">{group.label}</Type>
            <ul className="ds-preview-nav__list">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function PreviewSection({ id, title, children, className = '', titleAs = 'h2' }) {
  const titleId = `${id}-title`
  return (
    <section className={`ds-preview-section ${className}`} id={id} aria-labelledby={titleId}>
      <header className="ds-preview-section__header">
        <Type as={titleAs} role="heading-medium" id={titleId}>{title}</Type>
      </header>
      {children}
    </section>
  )
}

function SpecimenGroup({ title, description, children, className = '', titleAs = 'h3' }) {
  return (
    <div className={`ds-preview-specimen-group ${className}`}>
      <header className="ds-preview-specimen-group__header">
        <Type as={titleAs} role="heading-small">{title}</Type>
        {description && <Type role="body-small">{description}</Type>}
      </header>
      <ul className="ds-preview-specimen-list">{children}</ul>
    </div>
  )
}

function ChoiceSpecimenGroup({ title, description, children }) {
  return (
    <fieldset className="ds-preview-specimen-group ds-preview-choice-group">
      <legend className="ds-preview-specimen-group__header">
        <Type as="span" role="heading-small">{title}</Type>
        <Type as="span" role="body-small">{description}</Type>
      </legend>
      <ul className="ds-preview-specimen-list">{children}</ul>
    </fieldset>
  )
}

function SpecimenRow({ marker, name, names, children, token, tokens = [], className = '' }) {
  const canonicalNames = names || [name]
  const tokenNames = new Set(tokens)
  return (
    <li
      className={`ds-preview-specimen-row ${className}`}
      {...(token ? { 'data-ds-token': token } : {})}
    >
      <div className="ds-preview-specimen-meta">
        <span>{marker}</span>
        <span aria-hidden="true">·</span>
        <span className="ds-preview-specimen-names">
          {canonicalNames.map((canonicalName) => (
            <code
              key={canonicalName}
              {...(tokenNames.has(canonicalName) ? { 'data-ds-token': canonicalName } : {})}
            >
              {canonicalName}
            </code>
          ))}
        </span>
      </div>
      <div className="ds-preview-specimen-live">{children}</div>
    </li>
  )
}

function PairedTypeSpecimenRow({ marker, pairs }) {
  return (
    <li className="ds-preview-specimen-row ds-preview-specimen-row--paired">
      {pairs.map(({ name, sample }, index) => (
        <div className="ds-preview-specimen-pair-line" key={name}>
          <div className={`ds-preview-specimen-meta${index ? ' ds-preview-specimen-meta--continuation' : ''}`}>
            <span>{marker}</span>
            <span aria-hidden="true">·</span>
            <code>{name}</code>
          </div>
          <div className="ds-preview-specimen-live">{sample}</div>
        </div>
      ))}
    </li>
  )
}

function useResolvedToken(token) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const rootStyles = window.getComputedStyle(document.documentElement)
    setValue(rootStyles.getPropertyValue(token).trim())
  }, [token])

  return value
}

function GridModeSpecimen({ columnsToken, marginToken, gutterToken }) {
  const columnsValue = useResolvedToken(columnsToken)
  const marginValue = useResolvedToken(marginToken)
  const gutterValue = useResolvedToken(gutterToken)
  const parsedColumns = Number.parseInt(columnsValue, 10)
  const columns = Number.isInteger(parsedColumns) && parsedColumns > 0 ? parsedColumns : 1

  return (
    <span className="ds-preview-grid-specimen">
      <span
        className="ds-preview-grid-sample"
        style={{
          '--preview-grid-columns': `var(${columnsToken})`,
          '--preview-grid-margin': `var(${marginToken})`,
          '--preview-grid-gutter': `var(${gutterToken})`,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: columns }, (_, index) => <i key={index} />)}
      </span>
      <Type as="span" role="metadata">
        {columnsValue || '—'} columns · {marginValue || '—'} margin · {gutterValue || '—'} gutter
      </Type>
    </span>
  )
}

function GridMaxWidthSpecimen({ token }) {
  const value = useResolvedToken(token)
  return (
    <span className="ds-preview-grid-specimen">
      <span
        className="ds-preview-grid-max-sample"
        style={{ '--preview-grid-max-width': `var(${token})` }}
        aria-hidden="true"
      />
      <Type as="span" role="metadata">{value || '—'}</Type>
    </span>
  )
}

function SpacingSpecimens() {
  return (
    <SpecimenGroup title="Spacing" description="Primary scale · XS / S / M / L / XL / 2XL / 3XL">
      {DS_CONTRACT.tokens.spacing.map(([label, token]) => (
        <SpecimenRow marker={label} name={token} token={token} key={token}>
          <span
            className="ds-preview-rhythm-sample"
            style={{ '--preview-space': `var(${token})` }}
            aria-hidden="true"
          />
        </SpecimenRow>
      ))}
    </SpecimenGroup>
  )
}

function GridSpecimens() {
  const grid = DS_CONTRACT.foundations.grid
  return (
    <SpecimenGroup title="Grid" description="Desktop / Tablet / Mobile">
      <SpecimenRow marker="Max" name={grid.maxWidthToken} token={grid.maxWidthToken}>
        <GridMaxWidthSpecimen token={grid.maxWidthToken} />
      </SpecimenRow>
      {grid.modes.map(({ label, columnsToken, marginToken, gutterToken }) => (
        <SpecimenRow
          marker={label}
          names={[columnsToken, marginToken, gutterToken]}
          tokens={[columnsToken, marginToken, gutterToken]}
          key={label}
        >
          <GridModeSpecimen
            columnsToken={columnsToken}
            marginToken={marginToken}
            gutterToken={gutterToken}
          />
        </SpecimenRow>
      ))}
    </SpecimenGroup>
  )
}

function RadiusSpecimens() {
  return (
    <SpecimenGroup title="Radiuses" description="Primary scale · S / M / L">
      {DS_CONTRACT.tokens.radius.map(([label, token]) => {
        const size = label.split(' ')[0].toLowerCase()
        return (
          <SpecimenRow marker={sizeLabels[size]} name={token} token={token} key={token}>
            <span
              className="ds-preview-radius-shape"
              style={{ '--preview-radius': `var(${token})` }}
              aria-hidden="true"
            />
          </SpecimenRow>
        )
      })}
    </SpecimenGroup>
  )
}

export function Gallery() {
  return (
    <div className="ds-preview" data-ds-catalogue id="top">
      <GallerySidebar />
      <main className="ds-preview-main">
      <PreviewSection
        id="basic"
        titleAs="h1"
        title="Basic"
      >
        <SpecimenGroup title="Font families" description="Primary / Secondary">
          {DS_CONTRACT.foundations.fonts.map(({ role, name, token }) => (
            <SpecimenRow marker={role} name={name} token={token} key={token}>
              <span className="ds-preview-font-sample" style={{ fontFamily: `var(${token})` }}>
                Aa — {name}
              </span>
            </SpecimenRow>
          ))}
        </SpecimenGroup>
        <SpecimenGroup title="Icon family">
          <SpecimenRow marker="Primary" name={DS_CONTRACT.foundations.icons.name}>
            <span className="ds-preview-icon-family" aria-label="Font Awesome icon samples">
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              <i className="fa-solid fa-music" aria-hidden="true" />
              <i className="fa-solid fa-globe" aria-hidden="true" />
            </span>
          </SpecimenRow>
        </SpecimenGroup>
      </PreviewSection>

      <PreviewSection
        id="colors"
        title="Colors"
      >
        <SpecimenGroup title="Semantic colors" description="Content, surface and interaction roles" titleAs="h2">
          {DS_CONTRACT.tokens.color.map(([label, token]) => (
            <SpecimenRow marker={label} name={token} token={token} key={token}>
              <span
                className="ds-preview-swatch"
                style={{ background: `var(${token})` }}
                aria-hidden="true"
              />
            </SpecimenRow>
          ))}
        </SpecimenGroup>
      </PreviewSection>

      <PreviewSection
        id="spacing"
        title="Spacing and Sizes"
      >
        <GridSpecimens />
        <SpacingSpecimens />
        <SpecimenGroup title="Control heights" description="Primary scale · S / M / L">
          {DS_CONTRACT.tokens.geometry.map(([label, token]) => {
            const size = label.split(' ')[0].toLowerCase()
            return (
              <SpecimenRow marker={sizeLabels[size]} name={token} token={token} key={token}>
                <span
                  className="ds-preview-height-sample"
                  style={{ '--preview-size': `var(${token})` }}
                  aria-hidden="true"
                />
              </SpecimenRow>
            )
          })}
        </SpecimenGroup>
        <RadiusSpecimens />
      </PreviewSection>

      <PreviewSection
        id="typography"
        title="Typography"
      >
        <SpecimenGroup title="Headings" description="Primary scale · S / M / L">
          {DS_CONTRACT.typography
            .filter((role) => role.startsWith('heading-'))
            .map((role) => {
              const size = role.slice('heading-'.length)
              return (
                <SpecimenRow marker={sizeLabels[size]} name={role} key={role}>
                  <Type as="p" role={role} className="ds-preview-type-sample">
                    {typographySamples.heading[size]}
                  </Type>
                </SpecimenRow>
              )
            })}
        </SpecimenGroup>
        <SpecimenGroup title="Body" description="Primary scale · S / M / L · Regular / Bold">
          {['small', 'medium', 'large'].map((size) => {
            const regularRole = `body-${size}`
            const boldRole = `${regularRole}-bold`
            return (
              <PairedTypeSpecimenRow
                marker={sizeLabels[size]}
                key={size}
                pairs={[
                  {
                    name: regularRole,
                    sample: (
                      <Type as="p" role={regularRole} className="ds-preview-type-sample">
                        {typographySamples.body[size]}
                      </Type>
                    ),
                  },
                  {
                    name: boldRole,
                    sample: (
                      <Type as="p" role={boldRole} className="ds-preview-type-sample">
                        {typographySamples.body[size]}
                      </Type>
                    ),
                  },
                ]}
              />
            )
          })}
        </SpecimenGroup>
        <SpecimenGroup title="Auxiliary" description="Supporting roles · label / metadata">
          {DS_CONTRACT.typography
            .filter((role) => ['label', 'metadata'].includes(role))
            .map((role) => (
              <SpecimenRow marker="Aux" name={role} key={role}>
                <Type role={role} className="ds-preview-type-sample">
                  {typographySamples.auxiliary[role]}
                </Type>
              </SpecimenRow>
            ))}
        </SpecimenGroup>
      </PreviewSection>

      <PreviewSection
        id="actions"
        title="Button"
      >
        {DS_CONTRACT.components.button.variants.map((variant) => (
          <SpecimenGroup
            title={`${variant[0].toUpperCase()}${variant.slice(1)} buttons`}
            description="Primary scale · S / M / L · default / disabled"
            key={variant}
          >
            {DS_CONTRACT.components.button.sizes.map((size) => (
              <SpecimenRow marker={sizeLabels[size]} name={`button-${variant}-${size}`} key={size}>
                <div className="ds-preview-control-row">
                  {DS_CONTRACT.components.button.states.map((state) => (
                    <Button
                      key={`${size}-${state}`}
                      size={size}
                      variant={variant}
                      disabled={state === 'disabled'}
                      icon={size === 'large' ? <DemoArrow direction="up-right" /> : undefined}
                    >
                      {state === 'disabled' ? 'Unavailable' : 'Plan project'}
                    </Button>
                  ))}
                </div>
              </SpecimenRow>
            ))}
          </SpecimenGroup>
        ))}
        {DS_CONTRACT.components['icon-button'].variants.map((variant) => (
          <SpecimenGroup
            title={`${variant[0].toUpperCase()}${variant.slice(1)} icon buttons`}
            description="Primary scale · S / M · default / disabled"
            key={variant}
          >
            {DS_CONTRACT.components['icon-button'].sizes.map((size) => (
              <SpecimenRow marker={sizeLabels[size]} name={`icon-button-${variant}-${size}`} key={size}>
                <div className="ds-preview-control-row">
                  {DS_CONTRACT.components['icon-button'].states.map((state) => (
                    <IconButton
                      label={`${variant} ${size} ${state}`}
                      variant={variant}
                      size={size}
                      icon={size === 'small' ? <DemoPlus /> : <DemoArrow />}
                      disabled={state === 'disabled'}
                      key={`${size}-${state}`}
                    />
                  ))}
                </div>
              </SpecimenRow>
            ))}
          </SpecimenGroup>
        ))}
        <SpecimenGroup title="Links" description="Variants · text / nav">
          {DS_CONTRACT.components.link.variants.map((variant) => (
            <SpecimenRow marker="M" name={`link-${variant}`} key={variant}>
              <div className="ds-preview-control-row">
                <Link
                  href="#forms"
                  variant={variant}
                  icon={variant === 'text' ? <DemoArrow direction="up-right" /> : undefined}
                >
                  {variant} link
                </Link>
              </div>
            </SpecimenRow>
          ))}
        </SpecimenGroup>
      </PreviewSection>

      <PreviewSection
        id="forms"
        title="Forms"
      >
        {DS_CONTRACT.components.field.variants.map((kind) => (
          <SpecimenGroup
            title={`${kind[0].toUpperCase()}${kind.slice(1)}`}
            description="Size · M · states · default / error / disabled"
            key={kind}
          >
            {DS_CONTRACT.components.field.states.map((state) => (
              <SpecimenRow marker="M" name={`${kind}-${state}`} key={state}>
                <Field {...fieldProps(kind, state)} />
              </SpecimenRow>
            ))}
          </SpecimenGroup>
        ))}
        {DS_CONTRACT.components.choice.variants.map((kind) => (
          <ChoiceSpecimenGroup
            title={`${kind[0].toUpperCase()}${kind.slice(1)}`}
            description="Size · M · states · default / error / disabled · unchecked / checked"
            key={kind}
          >
            {DS_CONTRACT.components.choice.states.flatMap((state) =>
              DS_CONTRACT.components.choice.selection.map((selection) => (
                <SpecimenRow marker="M" name={`${kind}-${state}-${selection}`} key={`${state}-${selection}`}>
                  <Choice
                    kind={kind}
                    label={`${kind} · ${state} · ${selection}`}
                    description={state === 'default' ? 'One stable production pattern.' : undefined}
                    error={state === 'error' ? 'Review this choice.' : undefined}
                    disabled={state === 'disabled'}
                    name={kind === 'radio' ? `catalogue-radio-${state}` : undefined}
                    defaultChecked={selection === 'checked'}
                  />
                </SpecimenRow>
              )),
            )}
          </ChoiceSpecimenGroup>
        ))}
      </PreviewSection>

      <section className="ds-preview-inverse" data-ds-theme="inverse" id="themes" aria-labelledby="themes-title">
        <header className="ds-preview-section__header">
          <Type as="h2" role="heading-medium" id="themes-title">Inverse theme</Type>
        </header>
        <SpecimenGroup title="Supported controls" description="The same row pattern inside the inverse theme">
          {DS_CONTRACT.themes.inverse.specimens.map((specimen) => {
            const [component, variant, size, state, selection] = specimen
            const name = [component, variant, state, selection].filter(Boolean).join('-')
            return (
              <SpecimenRow marker={sizeLabels[size] ?? 'M'} name={name} key={specimen.join('-')}>
                {renderInverseSpecimen(specimen)}
              </SpecimenRow>
            )
          })}
        </SpecimenGroup>
      </section>

      </main>
    </div>
  )
}
