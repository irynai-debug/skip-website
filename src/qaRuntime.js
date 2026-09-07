import { DS_CONTRACT } from './design-system/index.jsx'
import { assetPath } from './assetPath.js'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

const importProjectQaModule = (path) => import(/* webpackIgnore: true */ assetPath(path))

function publish(result) {
  window.__siteQa = result
  let output = document.getElementById('site-qa-result')
  if (!output) {
    output = document.createElement('script')
    output.id = 'site-qa-result'
    output.type = 'application/json'
    document.head.append(output)
  }
  output.textContent = JSON.stringify(result)
}

async function settle() {
  await document.fonts?.ready
  await nextFrame()
  await nextFrame()
}

export async function runQaRuntime() {
  const searchParams = new URLSearchParams(window.location.search)
  const mode = searchParams.get('qaAudit')
  if (!mode) return

  publish({ status: 'running', mode })

  try {
    if (mode === 'design-system-production') {
      document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
        image.loading = 'eager'
      })
      document.querySelectorAll('img[data-image-delivery="deferred"]:not([src])').forEach((image) => {
        image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
      })
    }
    await settle()

    if (mode === 'design-system-catalogue' || mode === 'design-system-production') {
      const { runDesignSystemAudit } = await importProjectQaModule('/.site-builder/qa-tools/design-system-audit.js')
      const catalogue = mode === 'design-system-catalogue'
      const tokenNames = catalogue
        ? undefined
        : (searchParams.get('tokens') || '').split(',').filter(Boolean)
      const report = await runDesignSystemAudit(catalogue
        ? { catalogue: true, contract: DS_CONTRACT, selectors: { ignore: ['.ds-sr-only'] } }
        : { tokenNames, selectors: { ignore: ['.ds-sr-only'] } })

      window.sessionStorage.setItem(`skip:${mode}`, JSON.stringify(report))
      publish({ status: 'complete', mode, report })
      return
    }

    if (mode === 'design-system-comparison') {
      const { compareDesignSystemAuditReports } = await importProjectQaModule('/.site-builder/qa-tools/design-system-audit.js')
      const catalogue = JSON.parse(window.sessionStorage.getItem('skip:design-system-catalogue') || 'null')
      const production = JSON.parse(window.sessionStorage.getItem('skip:design-system-production') || 'null')
      const report = compareDesignSystemAuditReports({
        catalogueReport: catalogue,
        productionReports: { '/': production },
        printTable: false,
      })
      publish({ status: 'complete', mode, report })
      return
    }

    if (mode === 'motion') {
      const [{ runMotionSmokeTest }, manifestResponse] = await Promise.all([
        importProjectQaModule('/.site-builder/qa-tools/motion-smoke-test.js'),
        fetch(assetPath('/.site-builder/motion.json')),
      ])
      document.documentElement.classList.add('motion-animate')
      document.querySelectorAll('[data-motion-section]').forEach((section) => {
        section.classList.add('is-inview')
      })
      await new Promise((resolve) => window.setTimeout(resolve, 1800))
      const report = await runMotionSmokeTest(await manifestResponse.json())
      publish({ status: 'complete', mode, report })
      return
    }

    if (mode === 'typography') {
      const { runTypographyAudit } = await importProjectQaModule('/.site-builder/qa-tools/typography-audit.js')
      publish({ status: 'complete', mode, report: runTypographyAudit() })
      return
    }

    throw new Error(`Unknown QA mode: ${mode}`)
  } catch (error) {
    publish({
      status: 'error',
      mode,
      error: String(error?.stack || error?.message || error),
    })
  }
}
