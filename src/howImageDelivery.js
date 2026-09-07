export function advanceHowImageDelivery(deliveredIndexes, activeStepIndex, stepCount) {
  const current = deliveredIndexes instanceof Set ? deliveredIndexes : new Set()
  if (!Number.isInteger(stepCount) || stepCount <= 0) return current

  const active = ((activeStepIndex % stepCount) + stepCount) % stepCount
  const next = (active + 1) % stepCount
  if (current.has(active) && current.has(next)) return current

  const delivered = new Set(current)
  delivered.add(active)
  delivered.add(next)
  return delivered
}
