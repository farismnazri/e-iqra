import * as THREE from 'three'
import { anatomy } from './model/anatomy.js'
import { letterPoses } from './letterPoses'
import type { LetterId } from './letterPoses'

/** Owns every renderer/resource for one open popup; no audio, storage or curriculum writes. */
export function createArticulationViewer(host: HTMLElement, letter: LetterId, onUnavailable: () => void) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  const canvas = document.createElement('canvas')
  let renderer: THREE.WebGLRenderer | undefined
  let observer: ResizeObserver | undefined
  let frame = 0
  let disposed = false
  let shaderFailed = false
  const halos: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = []
  let elapsed = 0, previous = performance.now()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const dispose = () => {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    observer?.disconnect()
    motion.removeEventListener('change', motionChanged)
    canvas.removeEventListener('webglcontextlost', contextLost)
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material)
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
      }
    })
    textures.forEach(texture => { texture.dispose(); texture.source.data = null })
    materials.forEach(material => material.dispose())
    geometries.forEach(geometry => geometry.dispose())
    scene.clear()
    renderer?.dispose()
    renderer?.forceContextLoss()
    canvas.remove()
  }
  function contextLost(event: Event) {
    event.preventDefault()
    dispose()
    onUnavailable()
  }
  let model: ReturnType<typeof anatomy.build>
  function motionChanged() {
    if (disposed) return
    cancelAnimationFrame(frame)
    if (motion.matches) {
      model.setPose(letterPoses[letter].pose, true)
      model.update(0)
      elapsed = 1.5
      halos.forEach(halo => { halo.scale.setScalar(1); halo.material.opacity = 0.3 })
      render()
    } else {
      previous = performance.now()
      frame = requestAnimationFrame(animate)
    }
  }
  function animate(now: number) {
    if (disposed) return
    const delta = (now - previous) / 1000
    // Cap redraws at 30 fps; the anatomy itself stops updating once settled.
    if (delta >= 1 / 30) {
      previous = now
      if (elapsed < 1.5) {
        elapsed += delta
        model.update(Math.min(delta, 1 / 30))
        if (elapsed >= 1.5) { model.setPose(letterPoses[letter].pose, true); model.update(0) }
      }
      const breath = (1 - Math.cos(now / 1000 * Math.PI * 2 / 1.6)) / 2
      halos.forEach(halo => {
        halo.scale.setScalar(1 + 0.2 * breath)
        halo.material.opacity = 0.15 + 0.25 * breath
      })
      render()
    }
    if (!disposed) frame = requestAnimationFrame(animate)
  }
  function render() {
    try {
      if (disposed) return
      renderer!.render(scene, camera)
      if (shaderFailed) { dispose(); onUnavailable() }
    }
    catch { dispose(); onUnavailable() }
  }

  try {
    canvas.addEventListener('webglcontextlost', contextLost)
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.debug.onShaderError = () => { shaderFailed = true }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.setClearColor(0xfcfaf4, 0)
    // Standard materials and no shadow passes keep this small on mobile/iPad GPUs.
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6a5048, 1.25))
    const key = new THREE.DirectionalLight(0xfff0dc, 2.1)
    key.position.set(-6, 8, 11)
    const fill = new THREE.DirectionalLight(0xd4e8ff, 0.55)
    fill.position.set(7, -2, 7)
    scene.add(key, fill)
    model = anatomy.build(scene, { resolusi: 100, aniso: 1, mutu: 'hemat' })
    // The supplied model has no pose-controlled glottis. Show only its supplied
    // landmark (also useful for Hamzah/Ha), without fabricating vocal-fold motion.
    for (const [x, y] of letterPoses[letter].landmarks) {
      const marker = new THREE.Group()
      marker.position.set(x, y, 0.13)
      // A cream-edged gold target stays legible against both tissue and cavities.
      // Only the halo breathes; the target centre never moves off its landmark.
      const material = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({
        color, transparent: opacity < 1, opacity, depthTest: false, depthWrite: false,
        toneMapped: false, side: THREE.DoubleSide,
      })
      const outline = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.085, 8, 32), material(0xfff6dc))
      const target = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 32), material(0xb77b24))
      const centre = new THREE.Mesh(new THREE.CircleGeometry(0.065, 24), material(0xb77b24))
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 32), material(0xd6a64e, 0.3))
      outline.renderOrder = 10
      target.renderOrder = centre.renderOrder = 11
      halo.renderOrder = 9
      marker.add(outline, target, centre, halo)
      halos.push(halo)
      model.model.add(marker)
    }
    model.setPose(letterPoses[letter].pose, motion.matches)
    model.update(0)
    host.append(canvas)
    function resize() {
      if (disposed) return
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight)
      renderer!.setSize(width, height, false)
      camera.aspect = width / height
      // Fit the whole cutaway in either portrait or landscape without cropping.
      const distance = Math.max(10.8, 11.8 / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(16)))
      camera.position.set(-0.5, -0.45, distance)
      camera.lookAt(-0.5, -0.45, -0.6)
      camera.updateProjectionMatrix()
      render()
    }
    observer = new ResizeObserver(resize)
    observer.observe(host)
    motion.addEventListener('change', motionChanged)
    resize()
    if (!motion.matches && !disposed) frame = requestAnimationFrame(animate)
    return dispose
  } catch (error) {
    dispose()
    throw error
  }
}
