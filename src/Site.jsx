import React from 'react'
import content from './content.json' with { type: 'json' }
import { Header, Hero, HowItWorks, Technology, Testimonial } from './site/InteractiveSections.jsx'
import { Footer } from './site/Footer.jsx'
import { SiteRuntime } from './site/SiteRuntime.jsx'

export { Header, Hero, HeroOutcomeMetrics, HowItWorks, Technology, Testimonial } from './site/InteractiveSections.jsx'
export { Footer } from './site/Footer.jsx'

export function Site() {
  return (
    <div className="site-shell" id="top">
      <a href="#main-content" className="skip-link">{content.site.skipLink}</a>
      <Header />
      <main className="site-main" id="main-content">
        <Hero />
        <HowItWorks />
        <Technology />
        <Testimonial />
      </main>
      <Footer />
      <SiteRuntime />
    </div>
  )
}
