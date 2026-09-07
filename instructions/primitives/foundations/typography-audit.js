const makeCheck = (id, property, expected, actual, status, reason) => ({
  id,
  selector: 'html',
  property,
  expected,
  actual,
  status,
  ...(reason ? { reason } : {})
});

export function runTypographyAudit({ doc = document } = {}) {
  const view = doc.defaultView;
  const root = doc.documentElement;
  const style = view.getComputedStyle(root);
  const supports = (property, value) => Boolean(view.CSS?.supports?.(property, value));
  const checks = [];

  const auditProperty = (id, property, expected) => {
    const supported = supports(property, expected);
    const actual = style.getPropertyValue(property).trim();
    if (!supported) {
      checks.push(makeCheck(
        id,
        property,
        expected,
        actual || null,
        'documented',
        'current-browser-does-not-support-this-rendering-control'
      ));
      return;
    }
    checks.push(makeCheck(id, property, expected, actual, actual === expected ? 'pass' : 'fail'));
  };

  auditProperty('webkit-font-smoothing', '-webkit-font-smoothing', 'antialiased');
  auditProperty('moz-osx-font-smoothing', '-moz-osx-font-smoothing', 'grayscale');
  auditProperty('text-rendering', 'text-rendering', 'optimizeLegibility');
  auditProperty('font-synthesis', 'font-synthesis', 'none');

  const fontSet = doc.fonts;
  if (!fontSet) {
    checks.push(makeCheck(
      'fonts-ready',
      'document.fonts.status',
      'loaded',
      null,
      'documented',
      'current-browser-does-not-expose-the-css-font-loading-api'
    ));
  } else {
    checks.push(makeCheck(
      'fonts-ready',
      'document.fonts.status',
      'loaded',
      fontSet.status,
      fontSet.status === 'loaded' ? 'pass' : 'fail'
    ));
  }

  const failed = checks.filter((check) => check.status === 'fail');
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    viewport: { width: view.innerWidth, height: view.innerHeight },
    passed: failed.length === 0,
    summary: { checks: checks.length, failed: failed.length },
    checks
  };
}

if (typeof window !== 'undefined') {
  window.SiteTypographyAudit = { runTypographyAudit };
}
