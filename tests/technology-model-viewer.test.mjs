import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const importInteraction = () => import('../src/technologyModelInteraction.js')

function readGlbJson(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  const jsonLength = bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim())
}

const accessorManifest = (glb) => glb.accessors
  .map(({ componentType, count, type }) => `${type}:${componentType}:${count}`)
  .sort()

const primitiveManifest = (glb) => glb.meshes.flatMap((mesh) => mesh.primitives.map((primitive) => ({
  mode: primitive.mode ?? 4,
  material: primitive.material ?? null,
  indices: primitive.indices == null ? null : accessorManifest({ accessors: [glb.accessors[primitive.indices]] })[0],
  attributes: Object.entries(primitive.attributes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([semantic, index]) => [semantic, accessorManifest({ accessors: [glb.accessors[index]] })[0]]),
})))

const materialTextureManifest = (glb) => glb.materials.map((material) => ({
  baseColorTexture: material.pbrMetallicRoughness?.baseColorTexture?.index ?? null,
  metallicRoughnessTexture: material.pbrMetallicRoughness?.metallicRoughnessTexture?.index ?? null,
  normalTexture: material.normalTexture?.index ?? null,
  occlusionTexture: material.occlusionTexture?.index ?? null,
  emissiveTexture: material.emissiveTexture?.index ?? null,
  baseColorFactor: material.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1],
  metallicFactor: material.pbrMetallicRoughness?.metallicFactor ?? 1,
  roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor ?? 1,
}))

test('drag rotation keeps Y unrestricted while clamping X to twenty degrees', async () => {
  const { applyDragRotation } = await importInteraction()

  assert.deepEqual(applyDragRotation({
    rotationX: 18,
    rotationY: 170,
    deltaX: 1200,
    deltaY: 40,
  }), {
    rotationX: 20,
    rotationY: 590,
    velocityX: 0,
    velocityY: 420,
  })
})

test('inertia decays smoothly and stops vertical velocity at the rotation limit', async () => {
  const { advanceRotationInertia } = await importInteraction()

  assert.deepEqual(advanceRotationInertia({
    rotationX: 19,
    rotationY: 10,
    velocityX: 4,
    velocityY: 8,
  }), {
    rotationX: 20,
    rotationY: 18,
    velocityX: 0,
    velocityY: 7.36,
    moving: true,
  })

  assert.deepEqual(advanceRotationInertia({
    rotationX: 0,
    rotationY: 0,
    velocityX: 0.005,
    velocityY: -0.005,
  }), {
    rotationX: 0,
    rotationY: 0,
    velocityX: 0,
    velocityY: 0,
    moving: false,
  })
})

test('viewer hydration starts only near the viewport with motion and WebGL available', async () => {
  const { detectWebGLSupport, shouldStartTechnologyModelLoad } = await importInteraction()
  const allowed = {
    isNearViewport: true,
    reducedMotion: false,
    webglAvailable: true,
    failed: false,
  }

  assert.equal(shouldStartTechnologyModelLoad(allowed), true)
  assert.equal(shouldStartTechnologyModelLoad({ ...allowed, isNearViewport: false }), false)
  assert.equal(shouldStartTechnologyModelLoad({ ...allowed, reducedMotion: true }), false)
  assert.equal(shouldStartTechnologyModelLoad({ ...allowed, webglAvailable: false }), false)
  assert.equal(shouldStartTechnologyModelLoad({ ...allowed, failed: true }), false)

  assert.equal(detectWebGLSupport(() => ({ getContext: (name) => name === 'webgl2' ? {} : null })), true)
  assert.equal(detectWebGLSupport(() => ({ getContext: () => null })), false)
  assert.equal(detectWebGLSupport(() => { throw new Error('canvas unavailable') }), false)
})

test('technology media server output preserves the optimized poster dimensions without a canvas', async () => {
  const [{ TechnologyMedia }, { ASSETS }] = await Promise.all([
    import('../src/TechnologyMedia.js'),
    import('../src/siteContent.js'),
  ])
  const markup = renderToStaticMarkup(React.createElement(TechnologyMedia, {
    modelSrc: ASSETS.technologyModel,
    poster: ASSETS.technology,
  }))

  assert.match(markup, /class="technology__media"/)
  assert.match(markup, /data-model-state="poster"/)
  assert.match(markup, /src="\/assets\/skip\/optimized\/technology-1536\.webp"/)
  assert.match(markup, /width="1536"/)
  assert.match(markup, /height="1024"/)
  assert.doesNotMatch(markup, /<canvas/)
})

test('the Technology section integrates the 3D media without changing its six annotations', async () => {
    const { Technology } = await import('../src/Site.jsx')
    const markup = renderToStaticMarkup(React.createElement(Technology))
    const leftIndex = markup.indexOf('technology__features--left')
    const viewerIndex = markup.indexOf('data-model-state="poster"')
    const rightIndex = markup.indexOf('technology__features--right')

    assert.ok(leftIndex >= 0)
    assert.ok(viewerIndex > leftIndex)
    assert.ok(rightIndex > viewerIndex)
    assert.equal((markup.match(/class="technology-feature technology-feature--/g) ?? []).length, 6)
    assert.deepEqual(
      Array.from(markup.matchAll(/data-technology-feature-index="(\d{2})"/g), (match) => match[1]),
      ['01', '02', '03', '04', '05', '06'],
    )
    assert.deepEqual(
      Array.from(markup.matchAll(/<path d="([^"]+)"[^>]+pathLength="1"/g), (match) => match[1]),
      [
        'M0 28 H118 L190 86 H220',
        'M0 52 H220',
        'M0 44 H124 L188 18 H220',
        'M220 28 H102 L30 86 H0',
        'M220 42 H112 L34 66 H0',
        'M220 38 H116 L38 -25 H0',
      ],
    )
    assert.deepEqual(
      Array.from(markup.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="4\.5"/g), (match) => [Number(match[1]), Number(match[2])]),
      [[220, 86], [220, 52], [220, 18], [0, 86], [0, 66], [0, -25]],
    )
    assert.equal((markup.match(/--technology-connector-delay:/g) ?? []).length, 6)
    assert.equal((markup.match(/--technology-body-delay:/g) ?? []).length, 6)
    assert.match(markup, /data-technology-depth="static"/)
    assert.match(markup, /data-model-interacting="false"/)
    assert.doesNotMatch(markup, /data-product-tilt/)
})

test('the audited Meshopt candidate is the production GLB while the source copy stays untouched', async () => {
  const { ASSETS } = await import('../src/siteContent.js')
  assert.equal(ASSETS.technologyModel, '/assets/skip/mogo-device.meshopt.glb')

  const [source, originalCopy, production] = await Promise.all([
    readFile(new URL('../input/mogo-device.glb', import.meta.url)),
    readFile(new URL('../public/assets/skip/mogo-device.glb', import.meta.url)),
    readFile(new URL('../public/assets/skip/mogo-device.meshopt.glb', import.meta.url)),
  ])
  const digest = (value) => createHash('sha256').update(value).digest('hex')

  assert.equal(originalCopy.byteLength, 13_429_772)
  assert.equal(digest(originalCopy), digest(source))
  assert.equal(digest(source), '1a7fe9efa005ce6c1c02cabce63637becbfe3848385c97f5c711d802c45dbdf4')
  assert.equal(digest(production), '1468b9bfe3f03b18da7d9117b09f0e767f3c4e35e7aeb63133525cfc468e755d')
  assert.ok(production.byteLength < originalCopy.byteLength * 0.75)

  const originalGlb = readGlbJson(originalCopy)
  const glb = readGlbJson(production)
  assert.ok(glb.extensionsUsed.includes('EXT_meshopt_compression'))
  assert.ok(!glb.extensionsUsed.includes('KHR_mesh_quantization'))
  assert.equal(glb.meshes.length, 1)
  assert.equal(glb.materials.length, 1)
  assert.equal(glb.images.length, 3)
  assert.deepEqual(accessorManifest(glb), accessorManifest(originalGlb))
  assert.deepEqual(primitiveManifest(glb), primitiveManifest(originalGlb))
  assert.deepEqual(materialTextureManifest(glb), materialTextureManifest(originalGlb))

  const approval = JSON.parse(await readFile(new URL('../.site-builder/audits/production-performance/glb-comparison.json', import.meta.url), 'utf8'))
  assert.equal(approval.source.sha256, digest(source))
  assert.equal(approval.candidate.sha256, digest(production))
  assert.deepEqual(approval.candidate.gltfpackOptions, ['-c', '-noq', '-kn', '-km', '-kv', '-af', '0'])
  for (const [key, relativePath] of Object.entries(approval.visualComparison.files)) {
    const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url))
    assert.equal(digest(bytes), approval.visualComparison.sha256[key])
  }
})

test('the viewer uses existing design-system colors for neutral studio lighting', async () => {
  const source = await readFile(new URL('../src/TechnologyModelViewer.js', import.meta.url), 'utf8')

  assert.match(source, /getPropertyValue\('--ds-color-surface'\)/)
  assert.match(source, /getPropertyValue\('--ds-color-ink'\)/)
  assert.match(source, /MeshoptDecoder/)
  assert.match(source, /setMeshoptDecoder\(MeshoptDecoder\)/)
  assert.doesNotMatch(source, /OrbitControls|autoRotate|enablePan|enableZoom/)
  assert.doesNotMatch(source, /0x071421/)
})
