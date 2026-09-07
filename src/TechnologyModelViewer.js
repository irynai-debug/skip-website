'use client'

import React, { useEffect, useRef, useState } from 'react'
import { advanceRotationInertia, applyDragRotation } from './technologyModelInteraction.js'

const VIEWER_LABEL = 'Interactive 3D model of the MO/GO powered wearable support system. Drag or use arrow keys to rotate.'

export function TechnologyModelViewer({ modelSrc, onError, onReady }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    let disposed = false
    let renderer
    let resizeObserver
    let inertiaFrame = 0
    let firstPaintFrame = 0
    let modelRoot
    const listeners = []

    const initialize = async () => {
      try {
        const [THREE, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
          import('three'),
          import('three/addons/loaders/GLTFLoader.js'),
          import('three/addons/libs/meshopt_decoder.module.js'),
        ])
        if (disposed) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100)
        const pivot = new THREE.Group()
        pivot.rotation.order = 'YXZ'
        scene.add(pivot)

        const computedStyle = window.getComputedStyle(canvas)
        const lightColor = new THREE.Color(computedStyle.getPropertyValue('--ds-color-surface').trim())
        const darkColor = new THREE.Color(computedStyle.getPropertyValue('--ds-color-ink').trim())

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          canvas,
          powerPreference: 'high-performance',
        })
        renderer.setClearColor(darkColor, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.12

        scene.add(new THREE.HemisphereLight(lightColor, darkColor, 2.35))
        const keyLight = new THREE.DirectionalLight(lightColor, 4.2)
        keyLight.position.set(3.5, 4.5, 5)
        scene.add(keyLight)
        const fillLight = new THREE.DirectionalLight(lightColor, 2.1)
        fillLight.position.set(-4, 1.5, 3)
        scene.add(fillLight)
        const rimLight = new THREE.DirectionalLight(lightColor, 2.8)
        rimLight.position.set(1.5, 3, -4)
        scene.add(rimLight)

        const loader = new GLTFLoader()
        loader.setMeshoptDecoder(MeshoptDecoder)
        const gltf = await loader.loadAsync(modelSrc)
        if (disposed) {
          gltf.scene.traverse((object) => object.geometry?.dispose?.())
          return
        }

        modelRoot = gltf.scene
        const bounds = new THREE.Box3().setFromObject(modelRoot)
        const center = bounds.getCenter(new THREE.Vector3())
        const size = bounds.getSize(new THREE.Vector3())
        modelRoot.position.sub(center)
        pivot.add(modelRoot)

        const rotation = {
          rotationX: 0,
          rotationY: 0,
          velocityX: 0,
          velocityY: 0,
        }
        const pointer = { active: false, id: null, x: 0, y: 0 }

        const render = () => renderer?.render(scene, camera)
        const applyRotation = () => {
          pivot.rotation.x = THREE.MathUtils.degToRad(rotation.rotationX)
          pivot.rotation.y = THREE.MathUtils.degToRad(rotation.rotationY)
          canvas.dataset.rotationX = rotation.rotationX.toFixed(2)
          canvas.dataset.rotationY = rotation.rotationY.toFixed(2)
          render()
        }
        const fitCamera = () => {
          const width = Math.max(canvas.clientWidth, 1)
          const height = Math.max(canvas.clientHeight, 1)
          const aspect = width / height
          camera.aspect = aspect
          const verticalFov = THREE.MathUtils.degToRad(camera.fov)
          const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
          const fitHeight = size.y / (2 * Math.tan(verticalFov / 2))
          const fitWidth = size.x / (2 * Math.tan(horizontalFov / 2))
          const distance = Math.max(fitHeight, fitWidth) * 1.08 + size.z * 0.5
          camera.position.set(0, 0, distance)
          camera.near = Math.max(distance / 100, 0.01)
          camera.far = distance * 100
          camera.updateProjectionMatrix()
          camera.lookAt(0, 0, 0)
          renderer.setSize(width, height, false)
          render()
        }
        const stopInertia = () => {
          if (inertiaFrame) window.cancelAnimationFrame(inertiaFrame)
          inertiaFrame = 0
        }
        const continueInertia = () => {
          const next = advanceRotationInertia(rotation)
          Object.assign(rotation, next)
          applyRotation()
          if (next.moving && !disposed) {
            inertiaFrame = window.requestAnimationFrame(continueInertia)
          } else {
            inertiaFrame = 0
          }
        }
        const startInertia = () => {
          stopInertia()
          if (Math.abs(rotation.velocityX) <= 0.01 && Math.abs(rotation.velocityY) <= 0.01) return
          inertiaFrame = window.requestAnimationFrame(continueInertia)
        }
        const onPointerDown = (event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          stopInertia()
          pointer.active = true
          pointer.id = event.pointerId
          pointer.x = event.clientX
          pointer.y = event.clientY
          canvas.setPointerCapture(event.pointerId)
          canvas.dataset.interacting = 'true'
        }
        const onPointerMove = (event) => {
          if (!pointer.active || event.pointerId !== pointer.id) return
          event.preventDefault()
          const next = applyDragRotation({
            ...rotation,
            deltaX: event.clientX - pointer.x,
            deltaY: event.clientY - pointer.y,
          })
          Object.assign(rotation, next, {
            velocityX: Math.max(-4, Math.min(4, next.velocityX)),
            velocityY: Math.max(-4, Math.min(4, next.velocityY)),
          })
          pointer.x = event.clientX
          pointer.y = event.clientY
          applyRotation()
        }
        const endPointer = (event) => {
          if (!pointer.active || event.pointerId !== pointer.id) return
          pointer.active = false
          pointer.id = null
          canvas.dataset.interacting = 'false'
          if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
          startInertia()
        }
        const onKeyDown = (event) => {
          const keyDelta = {
            ArrowLeft: { x: -8, y: 0 },
            ArrowRight: { x: 8, y: 0 },
            ArrowUp: { x: 0, y: -8 },
            ArrowDown: { x: 0, y: 8 },
          }[event.key]
          if (!keyDelta) return
          event.preventDefault()
          stopInertia()
          const next = applyDragRotation({
            ...rotation,
            deltaX: keyDelta.x / 0.35,
            deltaY: keyDelta.y / 0.35,
          })
          Object.assign(rotation, next, { velocityX: 0, velocityY: 0 })
          applyRotation()
        }
        const onContextLost = (event) => {
          event.preventDefault()
          onError()
        }
        const listen = (type, handler, options) => {
          canvas.addEventListener(type, handler, options)
          listeners.push([type, handler, options])
        }

        listen('pointerdown', onPointerDown)
        listen('pointermove', onPointerMove, { passive: false })
        listen('pointerup', endPointer)
        listen('pointercancel', endPointer)
        listen('keydown', onKeyDown)
        listen('webglcontextlost', onContextLost)

        resizeObserver = new ResizeObserver(fitCamera)
        resizeObserver.observe(canvas)
        fitCamera()
        applyRotation()
        firstPaintFrame = window.requestAnimationFrame(() => {
          if (disposed) return
          canvas.dataset.modelReady = 'true'
          setReady(true)
          onReady()
        })
      } catch {
        if (!disposed) onError()
      }
    }

    initialize()

    return () => {
      disposed = true
      if (inertiaFrame) window.cancelAnimationFrame(inertiaFrame)
      if (firstPaintFrame) window.cancelAnimationFrame(firstPaintFrame)
      resizeObserver?.disconnect()
      listeners.forEach(([type, handler, options]) => canvas.removeEventListener(type, handler, options))
      modelRoot?.traverse((object) => {
        object.geometry?.dispose?.()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => value?.isTexture && value.dispose())
          material.dispose?.()
        })
      })
      renderer?.dispose()
      renderer?.forceContextLoss()
    }
  }, [modelSrc, onError, onReady])

  return React.createElement('canvas', {
    'aria-hidden': ready ? undefined : 'true',
    'aria-label': ready ? VIEWER_LABEL : undefined,
    className: 'technology__canvas',
    ref: canvasRef,
    role: ready ? 'group' : undefined,
    tabIndex: ready ? 0 : -1,
  })
}
