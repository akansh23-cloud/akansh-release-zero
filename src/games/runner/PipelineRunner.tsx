import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, type GameResult } from '../GameShell'
import { useSystem } from '../../state/system'
import { boom, sfx } from '../../audio/engine'
import { clamp, formatScore, useKeys } from '../../lib/utils'
import ParticleField from '../../world/fx/Particles'
import HoloGrid from '../../world/fx/HoloGrid'
import { Label3D } from '../../world/fx/Primitives'

type EntityKind = 'block' | 'beam' | 'gate' | 'shield'

interface Entity {
  active: boolean
  kind: EntityKind
  lane: number
  z: number
  taken: boolean
}

interface RunState {
  lane: number
  laneX: number
  y: number
  vy: number
  ducking: boolean
  distance: number
  speed: number
  gates: number
  integrity: number
  shield: number
  combo: number
  bestCombo: number
  flawless: boolean
  over: boolean
  hitFlash: number
  entities: Entity[]
  nextSpawn: number
  elapsed: number
}

const LANES = [-1.9, 0, 1.9]
const POOL = 26
const SPAWN_Z = -95
const GRAVITY = -34
const JUMP_V = 12.5

function makeState(): RunState {
  return {
    lane: 1,
    laneX: 0,
    y: 0,
    vy: 0,
    ducking: false,
    distance: 0,
    speed: 15,
    gates: 0,
    integrity: 3,
    shield: 0,
    combo: 0,
    bestCombo: 0,
    flawless: true,
    over: false,
    hitFlash: 0,
    entities: Array.from({ length: POOL }, () => ({ active: false, kind: 'block' as EntityKind, lane: 1, z: 0, taken: false })),
    nextSpawn: -22,
    elapsed: 0,
  }
}

function Runner({
  state,
  onSync,
  onEnd,
  paused,
}: {
  state: React.RefObject<RunState>
  onSync: (s: RunState) => void
  onEnd: () => void
  paused: boolean
}) {
  const keys = useKeys()
  const player = useRef<THREE.Group>(null)
  const shieldMesh = useRef<THREE.Mesh>(null)
  const slots = useRef<THREE.Group[]>([])
  const tunnel = useRef<THREE.Mesh[]>([])
  const syncTimer = useRef(0)
  const prevKeys = useRef({ left: false, right: false, up: false })

  const spawn = useCallback((s: RunState) => {
    const slot = s.entities.find((e) => !e.active)
    if (!slot) return
    const difficulty = clamp(s.distance / 1400, 0, 1)
    const roll = Math.random()
    let kind: EntityKind = 'block'
    if (roll < 0.12 + difficulty * 0.06) kind = 'beam'
    else if (roll < 0.46) kind = 'gate'
    else if (roll < 0.5 && s.shield <= 0) kind = 'shield'
    else kind = 'block'

    slot.active = true
    slot.kind = kind
    slot.taken = false
    slot.lane = Math.floor(Math.random() * 3)
    slot.z = SPAWN_Z
  }, [])

  useFrame((_, rawDt) => {
    const s = state.current
    if (!s || s.over || paused) return
    const dt = Math.min(0.033, rawDt)
    s.elapsed += dt

    const k = keys.current
    const left = k.has('arrowleft') || k.has('a')
    const right = k.has('arrowright') || k.has('d')
    const up = k.has('arrowup') || k.has('w') || k.has(' ')
    s.ducking = k.has('arrowdown') || k.has('s')

    if (left && !prevKeys.current.left && s.lane > 0) {
      s.lane--
      sfx('click')
    }
    if (right && !prevKeys.current.right && s.lane < 2) {
      s.lane++
      sfx('click')
    }
    if (up && !prevKeys.current.up && s.y <= 0.01) {
      s.vy = JUMP_V
      sfx('pickup')
    }
    prevKeys.current = { left, right, up }

    s.laneX = THREE.MathUtils.damp(s.laneX, LANES[s.lane], 12, dt)
    s.vy += GRAVITY * dt
    s.y = Math.max(0, s.y + s.vy * dt)
    if (s.y === 0) s.vy = 0

    s.speed = Math.min(38, 15 + s.distance * 0.0125)
    s.distance += s.speed * dt
    if (s.shield > 0) s.shield = Math.max(0, s.shield - dt)
    s.hitFlash = Math.max(0, s.hitFlash - dt * 3)

    const gap = Math.max(7.5, 17 - s.distance * 0.004)
    if (s.distance > s.nextSpawn + gap) {
      s.nextSpawn = s.distance
      spawn(s)
      if (Math.random() < clamp(s.distance / 2600, 0, 0.4)) spawn(s)
    }

    s.entities.forEach((e) => {
      if (!e.active) return
      e.z += s.speed * dt
      if (e.z > 8) {
        e.active = false
        return
      }
      if (e.taken) return
      if (Math.abs(e.z) > 1.05) return
      if (e.lane !== s.lane) return

      if (e.kind === 'gate') {
        if (s.y < 2.2) {
          e.taken = true
          s.gates++
          s.combo++
          s.bestCombo = Math.max(s.bestCombo, s.combo)
          sfx('pickup')
        }
        return
      }
      if (e.kind === 'shield') {
        if (s.y < 2.2) {
          e.taken = true
          s.shield = 6
          sfx('confirm')
        }
        return
      }
      const cleared = e.kind === 'block' ? s.y > 1.05 : s.ducking
      if (cleared) return

      e.taken = true
      s.combo = 0
      if (s.shield > 0) {
        s.shield = 0
        s.hitFlash = 0.6
        sfx('deny')
        return
      }
      s.integrity--
      s.flawless = false
      s.hitFlash = 1
      boom(1)
      sfx('hit')
      if (s.integrity <= 0) {
        s.over = true
        onEnd()
      }
    })

    const p = player.current
    if (p) {
      p.position.x = s.laneX
      p.position.y = 0.7 + s.y
      p.rotation.z = THREE.MathUtils.damp(p.rotation.z, (LANES[s.lane] - s.laneX) * 0.35, 8, dt)
      p.scale.y = THREE.MathUtils.damp(p.scale.y, s.ducking && s.y <= 0.02 ? 0.5 : 1, 14, dt)
      p.rotation.x = -s.vy * 0.02
    }
    if (shieldMesh.current) {
      const target = s.shield > 0 ? 1 : 0.001
      shieldMesh.current.scale.setScalar(THREE.MathUtils.damp(shieldMesh.current.scale.x, target, 10, dt))
      shieldMesh.current.rotation.y += dt * 2
    }

    s.entities.forEach((e, i) => {
      const g = slots.current[i]
      if (!g) return
      g.visible = e.active && !(e.taken && (e.kind === 'gate' || e.kind === 'shield'))
      if (!g.visible) return
      g.position.set(LANES[e.lane], e.kind === 'beam' ? 2.05 : e.kind === 'block' ? 0.55 : 1.1, e.z)
      g.rotation.z += dt * (e.kind === 'gate' ? 1.4 : e.kind === 'shield' ? 2.2 : 0)
      g.children.forEach((child, ci) => {
        child.visible = ci === ['block', 'beam', 'gate', 'shield'].indexOf(e.kind)
      })
    })

    tunnel.current.forEach((m, i) => {
      if (!m) return
      m.position.z = ((i * 8 + s.distance * 1) % 96) - 88
      m.rotation.z = s.elapsed * 0.1 + i
    })

    syncTimer.current += dt
    if (syncTimer.current > 0.08) {
      syncTimer.current = 0
      onSync({ ...s })
    }
  })

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 5, 4]} intensity={30} distance={26} color="#5ce1ff" />
      <pointLight position={[0, 1, -30]} intensity={40} distance={60} color="#ff5a3c" />
      <fog attach="fog" args={['#04070b', 22, 90]} />

      <HoloGrid position={[0, -0.4, -40]} size={120} color="#0a2b3a" accent="#ff5a3c" scale={40} wave={0} segments={64} />
      <ParticleField count={420} spread={60} colorA="#5ce1ff" colorB="#ffffff" rise={2.4} size={2} turbulence={0.4} opacity={0.7} position={[0, 2, -30]} seed={97} />

      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) tunnel.current[i] = el
          }}
          position={[0, 1.4, -i * 8]}
        >
          <torusGeometry args={[5.4, 0.06, 6, 40]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#ff5a3c' : '#1d6070'} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}

      {LANES.map((x, i) => (
        <mesh key={i} position={[x, -0.34, -42]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 110]} />
          <meshBasicMaterial color="#0c2c37" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}

      <group ref={player} position={[0, 0.7, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.4, 0.7, 6, 18]} />
          <meshStandardMaterial color="#182126" metalness={0.9} roughness={0.2} emissive="#0d4a5c" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 0.5, 18]} />
          <meshStandardMaterial color="#2a353b" metalness={0.95} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0, -0.8]}>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshBasicMaterial color="#ffd8a8" toneMapped={false} />
        </mesh>
        <pointLight color="#ff8a5c" intensity={12} distance={6} position={[0, 0, -0.9]} />
        <mesh ref={shieldMesh} scale={0.001}>
          <sphereGeometry args={[1.05, 20, 20]} />
          <meshBasicMaterial color="#4dffa0" transparent opacity={0.16} wireframe toneMapped={false} />
        </mesh>
      </group>

      {Array.from({ length: POOL }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) slots.current[i] = el
          }}
          visible={false}
        >
          <mesh>
            <boxGeometry args={[1.35, 1.05, 0.55]} />
            <meshStandardMaterial color="#3d1512" metalness={0.7} roughness={0.35} emissive="#ff2d18" emissiveIntensity={2.4} />
          </mesh>
          <mesh>
            <boxGeometry args={[1.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#3d2b12" metalness={0.7} roughness={0.35} emissive="#ffb545" emissiveIntensity={2.4} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.62, 0.09, 8, 26]} />
            <meshStandardMaterial color="#0d3a26" emissive="#4dffa0" emissiveIntensity={3.2} metalness={0.6} roughness={0.2} toneMapped={false} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.44, 0]} />
            <meshStandardMaterial color="#123043" emissive="#5ce1ff" emissiveIntensity={3.4} metalness={0.6} roughness={0.2} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <Label3D text="RELEASE TUNNEL" position={[0, 4.6, -34]} height={0.7} color="#26454f" />
    </>
  )
}

export default function PipelineRunner() {
  const quality = useSystem((s) => s.quality)
  const unlock = useSystem((s) => s.unlock)
  const state = useRef<RunState>(makeState())
  const [view, setView] = useState<RunState>(state.current)
  const [result, setResult] = useState<GameResult | null>(null)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)

  const end = useCallback(() => {
    const s = state.current
    const score = Math.round(s.distance + s.gates * 12 + s.bestCombo * 8)
    if (s.distance >= 1000) unlock('runner-1k')
    if (s.flawless && s.distance >= 600) unlock('runner-flawless')
    setResult({
      score,
      verdict: s.distance > 1200 ? 'Shipped clean.' : s.distance > 600 ? 'Made it to production.' : 'Rolled back.',
      lines: [
        { label: 'Distance', value: `${formatScore(s.distance)} m` },
        { label: 'Gates passed', value: String(s.gates) },
        { label: 'Best streak', value: String(s.bestCombo) },
        { label: 'Integrity left', value: `${Math.max(0, s.integrity)} / 3` },
      ],
    })
  }, [unlock])

  const restart = useCallback(() => {
    state.current = makeState()
    setView(state.current)
    setResult(null)
    setPaused(false)
    setStarted(true)
  }, [])

  useEffect(() => {
    let sx = 0
    let sy = 0
    const start = (e: TouchEvent) => {
      sx = e.touches[0].clientX
      sy = e.touches[0].clientY
    }
    const end2 = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx
      const dy = e.changedTouches[0].clientY - sy
      const s = state.current
      if (!s || s.over) return
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 28 && s.lane < 2) s.lane++
        if (dx < -28 && s.lane > 0) s.lane--
      } else if (dy < -28 && s.y <= 0.01) {
        s.vy = JUMP_V
      }
    }
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end2, { passive: true })
    return () => {
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchend', end2)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p') setPaused((p) => !p)
      if (e.key === ' ') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hud = useMemo(
    () => (
      <>
        <div className="runner-hud">
          <div className="runner-metric"><b>{formatScore(view.distance)}</b><small>METRES</small></div>
          <div className="runner-metric"><b>{view.gates}</b><small>GATES</small></div>
          <div className="runner-metric"><b>×{view.combo}</b><small>STREAK</small></div>
          <div className="runner-integrity" aria-label={`Integrity ${view.integrity} of 3`}>
            {[0, 1, 2].map((i) => <i key={i} className={i < view.integrity ? 'on' : ''} />)}
            <small>INTEGRITY</small>
          </div>
          {view.shield > 0 && <div className="runner-shield">SHIELD {view.shield.toFixed(1)}s</div>}
        </div>
        <div className="runner-touch">
          <button aria-label="Move left" onClick={() => { const s = state.current; if (s.lane > 0) s.lane-- }}>◀</button>
          <button aria-label="Jump" onClick={() => { const s = state.current; if (s.y <= 0.01) s.vy = JUMP_V }}>▲</button>
          <button aria-label="Duck" onPointerDown={() => { state.current.ducking = true }} onPointerUp={() => { state.current.ducking = false }}>▼</button>
          <button aria-label="Move right" onClick={() => { const s = state.current; if (s.lane < 2) s.lane++ }}>▶</button>
        </div>
      </>
    ),
    [view],
  )

  return (
    <GameShell id="runner" hud={started ? hud : null} result={result} onRestart={restart} paused={paused} onTogglePause={() => setPaused((p) => !p)}>
      <div className={`runner-flash${view.hitFlash > 0.4 ? ' on' : ''}`} />
      <Canvas dpr={quality === 'low' ? [0.7, 1] : [1, 1.6]} gl={{ antialias: quality === 'ultra', powerPreference: 'high-performance' }} camera={{ fov: 74, position: [0, 3.1, 7], near: 0.1, far: 200 }} onCreated={({ gl, camera }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; camera.lookAt(0, 1.1, -14) }}>
        <color attach="background" args={['#04070b']} />
        <Runner state={state} onSync={setView} onEnd={end} paused={paused || !started || !!result} />
        {quality !== 'low' && <EffectComposer multisampling={0}><Bloom luminanceThreshold={0.55} mipmapBlur intensity={0.85} /><Vignette offset={0.18} darkness={0.6} eskil={false} /></EffectComposer>}
      </Canvas>

      {!started && !result && (
        <div className="game-over"><div className="game-over-card small"><span className="eyebrow" style={{ color: '#ff5a3c' }}>REFLEX · ENDLESS</span><h2>Ride the release.</h2><p className="result-teach">Red blocks are failed stages — jump them. Amber beams are blocked promotions — duck under. Green rings are passing gates. Three hits and the release rolls back.</p><div className="key-legend"><span><kbd>A</kbd><kbd>D</kbd> lane</span><span><kbd>W</kbd> jump</span><span><kbd>S</kbd> duck</span><span><kbd>P</kbd> pause</span></div><div className="result-actions"><button className="btn-primary" onClick={restart}>START RUN</button></div></div></div>
      )}
    </GameShell>
  )
}
