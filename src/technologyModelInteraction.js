const MAX_VERTICAL_ROTATION_DEGREES = 20
const DRAG_SENSITIVITY = 0.35
const INERTIA_DECAY = 0.92
const INERTIA_STOP_THRESHOLD = 0.01

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))
const cleanNumber = (value) => Number(value.toFixed(6))

export function applyDragRotation({
  rotationX,
  rotationY,
  deltaX,
  deltaY,
  sensitivity = DRAG_SENSITIVITY,
}) {
  const proposedX = rotationX + deltaY * sensitivity
  const nextX = clamp(proposedX, -MAX_VERTICAL_ROTATION_DEGREES, MAX_VERTICAL_ROTATION_DEGREES)

  return {
    rotationX: cleanNumber(nextX),
    rotationY: cleanNumber(rotationY + deltaX * sensitivity),
    velocityX: nextX === proposedX ? cleanNumber(deltaY * sensitivity) : 0,
    velocityY: cleanNumber(deltaX * sensitivity),
  }
}

export function advanceRotationInertia({
  rotationX,
  rotationY,
  velocityX,
  velocityY,
  decay = INERTIA_DECAY,
  stopThreshold = INERTIA_STOP_THRESHOLD,
}) {
  if (Math.abs(velocityX) <= stopThreshold && Math.abs(velocityY) <= stopThreshold) {
    return { rotationX, rotationY, velocityX: 0, velocityY: 0, moving: false }
  }

  const proposedX = rotationX + velocityX
  const nextX = clamp(proposedX, -MAX_VERTICAL_ROTATION_DEGREES, MAX_VERTICAL_ROTATION_DEGREES)
  const nextVelocityX = nextX === proposedX ? velocityX * decay : 0
  const nextVelocityY = velocityY * decay
  const moving = Math.abs(nextVelocityX) > stopThreshold || Math.abs(nextVelocityY) > stopThreshold

  return {
    rotationX: cleanNumber(nextX),
    rotationY: cleanNumber(rotationY + velocityY),
    velocityX: moving ? cleanNumber(nextVelocityX) : 0,
    velocityY: moving ? cleanNumber(nextVelocityY) : 0,
    moving,
  }
}

export function shouldStartTechnologyModelLoad({
  isNearViewport,
  reducedMotion,
  webglAvailable,
  failed,
}) {
  return Boolean(isNearViewport && !reducedMotion && webglAvailable && !failed)
}

export function detectWebGLSupport(createCanvas) {
  try {
    const canvas = createCanvas()
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
