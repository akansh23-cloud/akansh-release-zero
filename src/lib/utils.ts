import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const rand = (min: number, max: number) => min + Math.random() * (max - min)
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Deterministic pseudo-random so scene layouts stay stable across reloads. */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** requestAnimationFrame loop with delta, auto-paused when the tab is hidden. */
export function useRaf(cb: (dt: number, elapsed: number) => void, active = true) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!document.hidden) ref.current(dt, (now - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

export function useKeys(): React.RefObject<Set<string>> {
  const keys = useRef<Set<string>>(new Set())
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase())
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
  return keys
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** Counts a number up when it enters view. Used for the recruiter stat blocks. */
export function useCountUp(target: number, duration = 1100, run = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, run])
  return value
}

const labelCache = new Map<string, THREE.CanvasTexture>()

/**
 * Draws a text label onto a 2D canvas and returns it as a texture.
 * Keeps every in-world label crisp without shipping or fetching a font file.
 */
export function labelTexture(
  text: string,
  opts: { color?: string; bg?: string; size?: number; weight?: number; pad?: number; letterSpacing?: number } = {},
) {
  const { color = '#e8f4f8', bg = 'transparent', size = 64, weight = 700, pad = 24, letterSpacing = 2 } = opts
  const key = `${text}|${color}|${bg}|${size}|${weight}|${pad}|${letterSpacing}`
  const hit = labelCache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = `${weight} ${size}px ui-monospace, "JetBrains Mono", Menlo, monospace`
  ctx.font = font
  const metrics = ctx.measureText(text)
  const w = Math.ceil(metrics.width + letterSpacing * text.length + pad * 2)
  const h = Math.ceil(size * 1.6)
  canvas.width = Math.max(2, w)
  canvas.height = Math.max(2, h)

  const c = canvas.getContext('2d')!
  if (bg !== 'transparent') {
    c.fillStyle = bg
    c.fillRect(0, 0, canvas.width, canvas.height)
  }
  c.font = font
  c.textBaseline = 'middle'
  c.textAlign = 'left'
  c.fillStyle = color
  c.shadowColor = color
  c.shadowBlur = size * 0.35

  let x = pad
  for (const ch of text) {
    c.fillText(ch, x, canvas.height / 2)
    x += c.measureText(ch).width + letterSpacing
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  tex.needsUpdate = true
  labelCache.set(key, tex)
  return tex
}

export function aspectOf(tex: THREE.CanvasTexture) {
  const img = tex.image as HTMLCanvasElement
  return img.width / img.height
}

/**
 * Element.scrollTo({behavior}) is missing on older Safari and in test
 * environments, so fall back to assigning scrollTop directly.
 */
export function scrollToBottom(el: HTMLElement | null) {
  if (!el) return
  try {
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      return
    }
  } catch {
    /* fall through */
  }
  el.scrollTop = el.scrollHeight
}

export function formatScore(n: number) {
  return Math.round(n).toLocaleString('en-US')
}
