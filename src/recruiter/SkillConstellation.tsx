import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { categoryMeta, skills, type Skill, type SkillCategory } from '../data/profile'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'
import { labelTexture, seeded } from '../lib/utils'

interface Placed extends Skill {
  home: THREE.Vector3
  orbitSpeed: number
  phase: number
}

/**
 * Nodes are seeded into loose category clusters rather than a sphere,
 * so the shape of the graph says something: delivery and orchestration
 * sit close together because that is how the work actually connects.
 */
function layout(): Placed[] {
  const rng = seeded(20240)
  const cats = Object.keys(categoryMeta) as SkillCategory[]
  const anchors = new Map<SkillCategory, THREE.Vector3>()
  cats.forEach((c, i) => {
    const a = (i / cats.length) * Math.PI * 2
    anchors.set(c, new THREE.Vector3(Math.cos(a) * 4.6, (i % 2 ? 1 : -1) * 1.5, Math.sin(a) * 4.6))
  })
  return skills.map((s) => {
    const base = anchors.get(s.category)!
    return {
      ...s,
      home: base
        .clone()
        .add(new THREE.Vector3((rng() - 0.5) * 3.2, (rng() - 0.5) * 2.6, (rng() - 0.5) * 3.2))
        .multiplyScalar(0.6 + (s.depth / 100) * 0.5),
      orbitSpeed: 0.06 + rng() * 0.09,
      phase: rng() * Math.PI * 2,
    }
  })
}

function Edges({ nodes, filter }: { nodes: Placed[]; filter: SkillCategory | null }) {
  const geometry = useMemo(() => {
    const points: number[] = []
    const colors: number[] = []
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const c = new THREE.Color()
    nodes.forEach((n) => {
      n.linked.forEach((id) => {
        const other = byId.get(id)
        if (!other) return
        points.push(n.home.x, n.home.y, n.home.z, other.home.x, other.home.y, other.home.z)
        c.set(categoryMeta[n.category].color)
        const dim = filter && n.category !== filter && other.category !== filter ? 0.12 : 0.55
        colors.push(c.r * dim, c.g * dim, c.b * dim, c.r * dim, c.g * dim, c.b * dim)
      })
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [nodes, filter])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.55} toneMapped={false} />
    </lineSegments>
  )
}

function Node({
  node,
  active,
  dimmed,
  onPick,
}: {
  node: Placed
  active: boolean
  dimmed: boolean
  onPick: (id: string) => void
}) {
  const group = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const color = categoryMeta[node.category].color
  const tex = useMemo(() => labelTexture(node.name, { color, size: 34, weight: 700, letterSpacing: 1 }), [node.name, color])
  const aspect = useMemo(() => {
    const img = tex.image as HTMLCanvasElement
    return img.width / img.height
  }, [tex])
  const size = 0.14 + (node.depth / 100) * 0.2

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.set(
      node.home.x + Math.sin(t * node.orbitSpeed + node.phase) * 0.26,
      node.home.y + Math.cos(t * node.orbitSpeed * 1.3 + node.phase) * 0.2,
      node.home.z + Math.cos(t * node.orbitSpeed + node.phase) * 0.26,
    )
    g.quaternion.copy(state.camera.quaternion)
    const target = active ? 1.5 : hover ? 1.25 : dimmed ? 0.62 : 1
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 8, dt))
  })

  const opacity = dimmed ? 0.24 : 1

  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          sfx('click')
          onPick(node.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'default'
        }}
      >
        <circleGeometry args={[size, 20]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      {(active || hover) && (
        <mesh>
          <ringGeometry args={[size * 1.5, size * 1.75, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, -size - 0.15, 0]}>
        <planeGeometry args={[0.62, 0.62 / aspect]} />
        <meshBasicMaterial map={tex} transparent opacity={dimmed ? 0.2 : active || hover ? 1 : 0.62} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Graph({ filter, activeId, onPick }: { filter: SkillCategory | null; activeId: string | null; onPick: (id: string) => void }) {
  const nodes = useMemo(layout, [])
  const rig = useRef<THREE.Group>(null)

  useFrame((state, dt) => {
    if (!rig.current) return
    // Slow ambient rotation, nudged by pointer position.
    rig.current.rotation.y += dt * 0.055
    const targetX = state.pointer.y * 0.24
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, targetX, 3, dt)
  })

  return (
    <group ref={rig}>
      <Edges nodes={nodes} filter={filter} />
      {nodes.map((n) => (
        <Node key={n.id} node={n} active={activeId === n.id} dimmed={!!filter && n.category !== filter} onPick={onPick} />
      ))}
    </group>
  )
}

export default function SkillConstellation() {
  const quality = useSystem((s) => s.quality)
  const unlock = useSystem((s) => s.unlock)
  const [filter, setFilter] = useState<SkillCategory | null>(null)
  const [activeId, setActiveId] = useState<string>('openshift')
  const active = skills.find((s) => s.id === activeId)!

  const pick = (id: string) => {
    setActiveId(id)
    unlock('constellation')
  }

  return (
    <div className="constellation">
      <div className="constellation-canvas">
        <Canvas
          dpr={quality === 'low' ? [0.7, 1] : [1, 1.5]}
          camera={{ fov: 50, position: [0, 0.6, 9.4] }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1} />
          <Graph filter={filter} activeId={activeId} onPick={pick} />
          {quality !== 'low' && (
            <EffectComposer multisampling={0}>
              <Bloom luminanceThreshold={0.35} mipmapBlur intensity={0.6} />
            </EffectComposer>
          )}
        </Canvas>
        <div className="constellation-legend">
          <button className={!filter ? 'on' : ''} onClick={() => setFilter(null)} style={{ borderColor: 'var(--line-strong)' }}>
            ALL
          </button>
          {(Object.keys(categoryMeta) as SkillCategory[]).map((c) => (
            <button
              key={c}
              className={filter === c ? 'on' : ''}
              onClick={() => setFilter(filter === c ? null : c)}
              style={{ borderColor: filter === c ? categoryMeta[c].color : undefined, color: filter === c ? categoryMeta[c].color : undefined }}
            >
              {categoryMeta[c].label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <aside className="node-panel">
        <span className="eyebrow" style={{ color: categoryMeta[active.category].color }}>
          {categoryMeta[active.category].label}
        </span>
        <h3>{active.name}</h3>
        <p>{active.proof}</p>
        <div className="node-meta">
          <div>
            <b>{active.years}y</b>
            <span>HANDS ON</span>
          </div>
          <div>
            <b>{active.depth}</b>
            <span>OPERATING DEPTH</span>
          </div>
        </div>
        <div className="depth-bar">
          <i style={{ width: `${active.depth}%`, background: categoryMeta[active.category].color }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--dim)' }}>{categoryMeta[active.category].blurb}</p>
        <div className="node-links">
          {active.linked.map((id) => {
            const s = skills.find((x) => x.id === id)
            if (!s) return null
            return (
              <button key={id} onClick={() => pick(id)}>
                → {s.name}
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
