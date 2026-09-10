import React from 'react'
import content from '../content.json' with { type: 'json' }
import { Button, Container, Divider, IconLink, Link, Type } from '../design-system/index.jsx'
import { MotionHeading } from '../motion.jsx'
import {
  ASSETS,
  FOOTER_COPY,
  FOOTER_DESTINATIONS,
  FOOTER_GROUPS,
  SOCIAL_DESTINATIONS,
} from '../siteContent.js'

function LineText({ text }) {
  return <><span className="ds-sr-only">{text.replaceAll('\n', ' ')}</span><span className="line-text" aria-hidden="true">{text.split('\n').map((line) => <span key={line}>{line}</span>)}</span></>
}

export function Footer() {
  const socialLinks = [
    [content.footer.socialLinks.instagram, ASSETS.social.instagram, SOCIAL_DESTINATIONS.Instagram],
    [content.footer.socialLinks.youtube, ASSETS.social.youtube, SOCIAL_DESTINATIONS.YouTube],
    [content.footer.socialLinks.linkedin, ASSETS.social.linkedin, SOCIAL_DESTINATIONS.LinkedIn],
    [content.footer.socialLinks.x, ASSETS.social.twitter, SOCIAL_DESTINATIONS.X],
  ]

  return (
    <footer
      className="footer"
      id="footer"
      data-ds-theme="inverse"
      data-motion-section
      data-footer-depth="static"
    >
      <div className="footer__media" aria-hidden="true">
        <img className="footer__background" src={ASSETS.footerBackground.src} width={ASSETS.footerBackground.width} height={ASSETS.footerBackground.height} alt="" loading="lazy" decoding="async" />
      </div>
      <Container className="footer__inner">
        <div className="footer__top">
          <div className="footer__cta">
            <MotionHeading as="h2" role="h2" lines={FOOTER_COPY.heading.split('\n')} motionMode="coherent" data-footer-entrance="heading" />
            <div className="footer__support" data-footer-entrance="support"><Type role="body-large"><LineText text={FOOTER_COPY.body} /></Type></div>
            <div className="footer__action" data-footer-entrance="cta"><Button data-preorder-trigger="footer" variant="primary-borderless" size="large">{FOOTER_COPY.cta}</Button></div>
          </div>
          <nav className="footer__navigation" aria-label={content.footer.navigationLabel} data-footer-entrance="navigation">
            {FOOTER_GROUPS.map((group) => (
              <div className="footer__group" key={group.title}>
                <Divider variant="subtle-vertical" aria-hidden="true" />
                <div>
                  <Type as="h3" role="label">{group.title}</Type>
                  <ul>{group.links.map((label) => <li key={label}><Link href={FOOTER_DESTINATIONS[label]} variant="footer-secondary">{label}</Link></li>)}</ul>
                </div>
              </div>
            ))}
          </nav>
        </div>
        <Divider variant="subtle" className="footer__bottom-divider" />
        <div className="footer__bottom">
          <div className="footer__legal">
            <a href="#top" className="footer__brand" aria-label={content.site.brandHomeLabel}><img src={ASSETS.logo} alt={content.site.brandName} /></a>
            <Divider variant="subtle-vertical" aria-hidden="true" />
            <Type role="body" data-ds-exempt="Reference-specific footer secondary state">{FOOTER_COPY.copyright}</Type>
          </div>
          <div className="footer__socials" aria-label={content.footer.socialMediaLabel}>
            {socialLinks.map(([label, icon, href]) => <IconLink key={label} href={href} label={label} target="_blank" rel="noopener noreferrer" variant="outline-muted" iconSource={icon} />)}
          </div>
        </div>
      </Container>
    </footer>
  )
}
