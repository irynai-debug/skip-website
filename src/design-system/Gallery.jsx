import React from 'react'
import {
  Button,
  Divider,
  DS_CONTRACT,
  Field,
  IconButton,
  IconLink,
  Link,
  MetricRow,
  SiteHeader,
  Type,
} from './index.jsx'
import { assetPath } from '../assetPath.js'

const logo = assetPath('/assets/skip/icons/Logo.svg')
const basket = assetPath('/assets/skip/icons/basket.svg')
const arrow = assetPath('/assets/skip/icons/arrow-right.svg')
const nav = [
  { label: 'PRODUCT', href: '#components' },
  { label: 'HOW IT WORKS', href: '#typography' },
  { label: 'TECHNOLOGY', href: '#colors' },
  { label: 'FAQ', href: '#spacing' },
]

const projectRoles = ['display', 'h1', 'h2', 'h3', 'body-large', 'body', 'label', 'number-small', 'number-large', 'button']

function Section({ id, title, children, inverse = false }) {
  return <section id={id} className="ds-gallery__section" data-ds-theme={inverse ? 'inverse' : undefined} aria-labelledby={`${id}-title`}><Type as="h2" role="h3" id={`${id}-title`}>{title}</Type>{children}</section>
}

function TokenRows({ entries }) {
  return <div className="ds-gallery__rows">{entries.map(([label, token]) => <div className="ds-gallery__row" data-ds-token={token} key={token}><code>{token}</code><span>{label}</span><i style={{ background: token.includes('color') ? `var(${token})` : undefined }} /></div>)}</div>
}

export function Gallery() {
  return (
    <main className="ds-gallery" data-ds-catalogue>
      <header className="ds-gallery__intro" data-ds-theme="inverse">
        <Type as="p" role="label">SKIP / PRODUCTION SYSTEM</Type>
        <Type as="h1" role="h2">MOVE FURTHER,<br />SYSTEMATICALLY.</Type>
        <Type role="body-large">Every specimen below is rendered from the same production exports and tokens used by the site.</Type>
      </header>

      <Section id="colors" title="FOUNDATIONS">
        <Type role="body">Font family: Neue Haas Grotesk Display Pro. Icon family: supplied Skip SVG assets.</Type>
        <TokenRows entries={Object.values(DS_CONTRACT.tokens).flat()} />
      </Section>

      <Section id="typography" title="TYPOGRAPHY">
        <div className="ds-gallery__type-list">{projectRoles.map((role) => <div className="ds-gallery__type-row" key={role}><code>{role}</code><Type role={role}>{role === 'body' ? 'Wearable tech for more freedom in every step.' : role.toUpperCase()}</Type></div>)}</div>
        <div hidden aria-hidden="true">
          {['heading-small','heading-medium','heading-large','body-small','body-medium','body-small-bold','body-medium-bold','body-large-bold','metadata'].map((role) => <Type role={role} key={role}>{role}</Type>)}
        </div>
      </Section>

      <Section id="components" title="COMPONENTS">
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">BUTTONS</Type>
          <div className="ds-gallery__controls">{DS_CONTRACT.components.button.variants.flatMap((variant) => DS_CONTRACT.components.button.sizes.flatMap((size) => DS_CONTRACT.components.button.states.map((state) => <Button key={`${variant}-${size}-${state}`} variant={variant} size={size} disabled={state === 'disabled'} icon={size === 'large' ? <img src={arrow} alt="" /> : undefined}>RESERVE YOUR SPOT</Button>)))}</div>
        </div>
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">LINKS</Type>
          <div className="ds-gallery__controls">{DS_CONTRACT.components.link.variants.flatMap((variant) => DS_CONTRACT.components.link.states.map((state) => <span key={`${variant}-${state}`}><Link variant={variant} href={state === 'default' ? '#colors' : undefined}>{variant} {state} link</Link></span>))}</div>
        </div>
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">ICON CONTROLS</Type>
          <div className="ds-gallery__controls">{DS_CONTRACT.components['icon-button'].variants.flatMap((variant) => DS_CONTRACT.components['icon-button'].sizes.flatMap((size) => DS_CONTRACT.components['icon-button'].glyphSizes.flatMap((glyphSize) => DS_CONTRACT.components['icon-button'].states.map((state) => <IconButton key={`${variant}-${size}-${glyphSize}-${state}`} label={`${variant} ${size} ${glyphSize} ${state}`} variant={variant} size={size} glyphSize={glyphSize} disabled={state === 'disabled'} icon={variant === 'outline-ink' ? undefined : <img src={arrow} alt="" />} iconSource={variant === 'outline-ink' ? arrow : undefined} />))))}</div>
          <div className="ds-gallery__controls">{DS_CONTRACT.components['icon-link'].variants.flatMap((variant) => DS_CONTRACT.components['icon-link'].sizes.flatMap((size) => DS_CONTRACT.components['icon-link'].states.map((state) => <IconLink key={`${variant}-${size}-${state}`} href={state === 'default' ? '#colors' : undefined} label={`${variant} ${size} ${state} link`} variant={variant} size={size} icon={variant === 'outline-muted' ? undefined : <img src={arrow} alt="" />} iconSource={variant === 'outline-muted' ? arrow : undefined} />)))}</div>
        </div>
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">METRICS & DIVIDERS</Type>
          <MetricRow label="Uphill Support" value="+40%" />
          <Divider />
          <Divider variant="subtle" />
          <Divider variant="vertical" />
          <Divider variant="subtle-vertical" />
        </div>
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">FIELDS</Type>
          <Field id="gallery-input" label="EMAIL ADDRESS" type="email" />
          <Field id="gallery-input-invalid" label="EMAIL ADDRESS" type="email" error="Enter a valid email address." />
          <Field id="gallery-input-disabled" label="EMAIL ADDRESS" type="email" disabled />
          <Field id="gallery-select" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} />
          <Field id="gallery-select-invalid" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} error="Select a country or region." />
          <Field id="gallery-select-disabled" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} disabled />
        </div>
        <div className="ds-gallery__component-group ds-gallery__header-sample">
          <div className="ds-gallery__header-surface ds-gallery__header-surface--hero" data-ds-theme="inverse"><SiteHeader logo={logo} basketIcon={basket} navigation={nav} navigationId="gallery-hero-navigation" state="hero" /></div>
          <div className="ds-gallery__header-surface ds-gallery__header-surface--compact"><SiteHeader logo={logo} basketIcon={basket} navigation={nav} navigationId="gallery-compact-navigation" state="compact" /></div>
        </div>
      </Section>

      <Section id="inverse" title="INVERSE THEME" inverse>
        <div className="ds-gallery__type-list">{projectRoles.map((role) => <div className="ds-gallery__type-row" key={`inverse-${role}`}><code>{role}</code><Type role={role}>{role === 'body' ? 'Wearable tech for more freedom in every step.' : role.toUpperCase()}</Type></div>)}</div>
        <div className="ds-gallery__controls">
          <Button variant="primary">RESERVE YOUR SPOT</Button>
          <span><Button variant="primary" size="large">RESERVE YOUR SPOT</Button></span>
          <Button variant="primary-borderless" size="small">ACCEPT</Button>
          <span><Button variant="primary-borderless" size="large">RESERVE YOUR SPOT</Button></span>
          <Button variant="secondary">SEE MO/GO IN ACTION</Button>
          <IconButton label="Next" icon={<img src={arrow} alt="" />} />
          <IconLink href="#colors" label="Next section" icon={<img src={arrow} alt="" />} />
          <IconLink label="Unavailable social" icon={<img src={arrow} alt="" />} />
          <IconLink href="#colors" label="Muted social" variant="outline-muted" iconSource={arrow} />
          <IconLink label="Unavailable muted social" variant="outline-muted" iconSource={arrow} />
          <span><Link variant="nav" href="#colors">TECHNOLOGY</Link></span>
          <span><Link variant="footer" href="#colors">How It Works</Link></span>
          <span><Link variant="footer">Unavailable destination</Link></span>
          <span><Link variant="footer-secondary" href="#colors">Footer secondary</Link></span>
          <span><Link variant="footer-secondary">Unavailable footer secondary</Link></span>
        </div>
        <div className="ds-gallery__component-group">
          <Type as="h3" role="h3">FIELDS</Type>
          <Field id="gallery-inverse-input" label="EMAIL ADDRESS" type="email" />
          <Field id="gallery-inverse-input-invalid" label="EMAIL ADDRESS" type="email" error="Enter a valid email address." />
          <Field id="gallery-inverse-input-disabled" label="EMAIL ADDRESS" type="email" disabled />
          <Field id="gallery-inverse-select" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} />
          <Field id="gallery-inverse-select-invalid" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} error="Select a country or region." />
          <Field id="gallery-inverse-select-disabled" label="COUNTRY / REGION" options={[{ code: 'US', label: 'United States' }]} disabled />
        </div>
        <MetricRow label="Battery Life" value="8+ hrs" />
        <Divider />
        <Divider variant="subtle" />
        <Divider variant="vertical" />
        <Divider variant="subtle-vertical" />
      </Section>
    </main>
  )
}
