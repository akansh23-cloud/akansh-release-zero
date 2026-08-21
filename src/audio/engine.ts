/**
 * Everything you hear is synthesised at runtime with the Web Audio API.
 * No audio files ship with this site.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambientNodes: { stop: () => void } | null = null
let enabled = false

function ac(): AudioContext {
  if (!ctx) {
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
  }
  return ctx
}

function bus(): GainNode {
  ac()
  return master!
}

async function wake() {
  const c = ac()
  if (c.state === 'suspended') await c.resume()
  return c
}

function noiseBuffer(c: AudioContext, seconds = 2) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

/** A slow, wide drone with a breathing filter — the sound of a datacentre at 3am. */
export async function setAmbient(on: boolean) {
  enabled = on
  if (!on) {
    ambientNodes?.stop()
    ambientNodes = null
    return
  }
  const c = await wake()
  if (ambientNodes) return

  const out = c.createGain()
  out.gain.value = 0
  out.connect(bus())
  out.gain.setTargetAtTime(0.26, c.currentTime, 1.4)

  // Two detuned sub oscillators
  const oscs = [41.2, 61.7, 82.4].map((f, i) => {
    const o = c.createOscillator()
    o.type = i === 2 ? 'triangle' : 'sine'
    o.frequency.value = f
    const g = c.createGain()
    g.gain.value = i === 0 ? 0.16 : i === 1 ? 0.07 : 0.035
    o.connect(g).connect(out)
    o.start()
    return { o, g }
  })

  // Filtered noise floor = server room air
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 4)
  src.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 340
  lp.Q.value = 0.6
  const ng = c.createGain()
  ng.gain.value = 0.02
  src.connect(lp).connect(ng).connect(out)
  src.start()

  // Slow LFO breathing the filter
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.045
  const lfoGain = c.createGain()
  lfoGain.gain.value = 140
  lfo.connect(lfoGain).connect(lp.frequency)
  lfo.start()

  ambientNodes = {
    stop: () => {
      const now = c.currentTime
      out.gain.setTargetAtTime(0, now, 0.25)
      window.setTimeout(() => {
        oscs.forEach(({ o }) => {
          try { o.stop() } catch { /* already stopped */ }
        })
        try { src.stop() } catch { /* already stopped */ }
        try { lfo.stop() } catch { /* already stopped */ }
        out.disconnect()
      }, 700)
    },
  }
}

export type Sfx =
  | 'click'
  | 'hover'
  | 'confirm'
  | 'deny'
  | 'unlock'
  | 'launch'
  | 'alarm'
  | 'seal'
  | 'pickup'
  | 'hit'
  | 'type'
  | 'sweep'

interface Voice {
  type: OscillatorType
  from: number
  to: number
  dur: number
  gain: number
  glide?: number
}

const bank: Record<Sfx, Voice[]> = {
  click: [{ type: 'square', from: 660, to: 660, dur: 0.035, gain: 0.05 }],
  hover: [{ type: 'sine', from: 1180, to: 1240, dur: 0.03, gain: 0.022 }],
  confirm: [
    { type: 'sine', from: 523, to: 523, dur: 0.1, gain: 0.07 },
    { type: 'sine', from: 784, to: 784, dur: 0.16, gain: 0.06 },
  ],
  deny: [{ type: 'sawtooth', from: 196, to: 110, dur: 0.24, gain: 0.07 }],
  unlock: [
    { type: 'triangle', from: 660, to: 660, dur: 0.09, gain: 0.06 },
    { type: 'triangle', from: 880, to: 880, dur: 0.11, gain: 0.055 },
    { type: 'triangle', from: 1320, to: 1320, dur: 0.3, gain: 0.05 },
  ],
  launch: [
    { type: 'sawtooth', from: 70, to: 420, dur: 0.7, gain: 0.09, glide: 0.6 },
    { type: 'sine', from: 140, to: 840, dur: 0.7, gain: 0.05, glide: 0.6 },
  ],
  alarm: [
    { type: 'square', from: 340, to: 240, dur: 0.18, gain: 0.06 },
    { type: 'square', from: 340, to: 240, dur: 0.18, gain: 0.06 },
  ],
  seal: [
    { type: 'sine', from: 320, to: 90, dur: 0.42, gain: 0.09, glide: 0.35 },
  ],
  pickup: [{ type: 'square', from: 880, to: 1320, dur: 0.08, gain: 0.045, glide: 0.06 }],
  hit: [{ type: 'sawtooth', from: 240, to: 60, dur: 0.3, gain: 0.1, glide: 0.24 }],
  type: [{ type: 'square', from: 1500, to: 1500, dur: 0.012, gain: 0.015 }],
  sweep: [{ type: 'sine', from: 200, to: 1800, dur: 0.5, gain: 0.035, glide: 0.45 }],
}

export function sfx(kind: Sfx) {
  if (!enabled) return
  const c = ac()
  if (c.state === 'suspended') { void c.resume() }
  const voices = bank[kind]
  voices.forEach((v, i) => {
    const start = c.currentTime + i * (kind === 'alarm' ? 0.22 : kind === 'unlock' ? 0.07 : kind === 'confirm' ? 0.06 : 0)
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = v.type
    osc.frequency.setValueAtTime(v.from, start)
    if (v.to !== v.from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.to), start + (v.glide ?? v.dur))
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(v.gain, start + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, start + v.dur)
    osc.connect(g).connect(bus())
    osc.start(start)
    osc.stop(start + v.dur + 0.05)
  })
}

/** Impact noise burst — used for collisions and big state changes. */
export function boom(intensity = 1) {
  if (!enabled) return
  const c = ac()
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.6)
  const filt = c.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(1400 * intensity, c.currentTime)
  filt.frequency.exponentialRampToValueAtTime(90, c.currentTime + 0.4)
  const g = c.createGain()
  g.gain.setValueAtTime(0.14 * intensity, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.45)
  src.connect(filt).connect(g).connect(bus())
  src.start()
  src.stop(c.currentTime + 0.5)
}

export function isAudioEnabled() {
  return enabled
}
