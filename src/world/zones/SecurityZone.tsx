import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useMission } from '../../state/mission'
import { useSystem } from '../../state/system'
import { sfx } from '../../audio/engine'
import HoloGrid from '../fx/HoloGrid'
import ParticleField from '../fx/Particles'
import { EnergyRing, HoloPanel, Label3D, LightShaft, MetalBox, Shockwave } from '../fx/Primitives'

const GATES = ['CODE QUALITY', 'SAST', 'IMAGE SECURITY', 'SECRETS'] as const

/** A plane of light that physically sweeps the chamber during the scan. */
function ScanBeam({ running }: { running: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const sweep = ((t * 0.55) % 2) - 1
    m.position.z = sweep * 4.6
    const mat = m.material as THREE.MeshBasicMaterial
    mat.opacity = running ? 0.24 + Math.sin(t * 6) * 0.06 : 0.03
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8.6, 0.5]} />
      <meshBasicMaterial color="#5ce1ff" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * Fragments orbit inside the chamber. One is vulnerable.
 * The whole point of the mission is that you have to find it, not be shown it.
 */
function FragmentSwarm() {
  const stage = useMission((s) => s.stage)
  const isolate = useMission((s) => s.isolateSecurity)
  const isolated = useMission((s) => s.securityIsolated)
  const say = useMission((s) => s.say)
  const [hovered, setHovered] = useState<number | null>(null)

  const group = useRef<THREE.Group>(null)
  const meshes = useRef<THREE.Mesh[]>([])

  const fragments = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        radius: 1.35 + (i % 3) * 0.42,
        speed: 0.25 + (i % 4) * 0.11,
        offset: (i / 9) * Math.PI * 2,
        y: ((i % 5) - 2) * 0.34,
        bad: i === 5,
      })),
    [],
  )

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    fragments.forEach((f, i) => {
      const m = meshes.current[i]
      if (!m) return
      const a = f.offset + t * f.speed
      m.position.set(Math.cos(a) * f.radius, 0.9 + f.y + Math.sin(t * 0.9 + i) * 0.14, Math.sin(a) * f.radius)
      m.rotation.x += dt * 0.6
      m.rotation.y += dt * 0.9
      const targetScale = f.bad && isolated ? 0.01 : hovered === i ? 1.35 : 1
      m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, targetScale, 6, dt))
    })
    if (group.current) group.current.rotation.y += dt * 0.06
  })

  return (
    <group ref={group}>
      {fragments.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(i)
            document.body.style.cursor = 'crosshair'
            sfx('hover')
          }}
          onPointerOut={() => {
            setHovered(null)
            document.body.style.cursor = 'default'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (stage !== 'security-scan') return
            if (f.bad) {
              sfx('confirm')
              isolate()
            } else {
              sfx('deny')
              say('info', 'fragment clean · signature matches manifest')
            }
          }}
        >
          {f.bad ? <octahedronGeometry args={[0.34, 0]} /> : <icosahedronGeometry args={[0.24, 0]} />}
          <meshStandardMaterial
            color={f.bad ? '#ff4433' : '#6fd6ef'}
            emissive={f.bad ? '#ff1a0c' : '#1c7f9c'}
            emissiveIntensity={f.bad ? 4.2 : 1.1}
            metalness={0.6}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function SecurityZone() {
  const stage = useMission((s) => s.stage)
  const isolated = useMission((s) => s.securityIsolated)
  const quality = useSystem((s) => s.quality)
  const rings = useRef<THREE.Group[]>([])
  const active = stage.startsWith('security')
  const scanning = stage === 'security-scan'

  useFrame((state, dt) => {
    rings.current.forEach((r, i) => {
      if (!r) return
      r.rotation.z += dt * (0.4 + i * 0.14) * (i % 2 ? -1 : 1)
      r.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2
    })
  })

  if (!active) return null

  return (
    <group position={[0, 0, -28]}>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 5, 2]} intensity={11} distance={20} color={isolated ? '#4dffa0' : '#45bfff'} />
      <pointLight position={[0, -1.4, 0]} intensity={5} distance={9} color="#ffb545" />

      <HoloGrid position={[0, -2.48, 0]} size={70} color="#07303f" accent={isolated ? '#4dffa0' : '#5ce1ff'} scale={26} pulse={isolated ? 0.45 : 0.08} />
      <mesh position={[0, -2.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 34]} />
        <meshStandardMaterial color="#060e12" metalness={0.78} roughness={0.44} />
      </mesh>

      <ParticleField count={220} spread={22} colorA="#5ce1ff" colorB="#ffb545" rise={0.28} size={2.2} opacity={0.7} position={[0, 1, 0]} seed={23} />

      {[-8.4, 8.4].map((x) => (
        <MetalBox key={x} position={[x, 1.8, 0]} scale={[0.6, 8, 12]} emissive="#05202c" intensity={0.9} />
      ))}
      <LightShaft position={[0, 3.2, 0]} height={7} radiusTop={0.4} radiusBottom={3.4} color={isolated ? '#4dffa0' : '#5ce1ff'} intensity={scanning ? 1.1 : 0.5} />

      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el
          }}
          position={[0, 0.9, (i - 1.5) * 2.1]}
        >
          <EnergyRing
            position={[0, 0, 0]}
            scale={2.3 - i * 0.14}
            color={isolated ? '#4dffa0' : i === 2 ? '#ffb545' : '#5ce1ff'}
            rotation={[0, 0, 0]}
            thickness={0.05}
            spin={0}
          />
          <mesh>
            <torusGeometry args={[1.72 - i * 0.09, 0.014, 6, 56]} />
            <meshBasicMaterial color="#c7f4ff" transparent opacity={0.22} toneMapped={false} />
          </mesh>
          {quality !== 'low' && (
            <Label3D text={GATES[i]} position={[0, 2.55 - i * 0.14, 0]} height={0.2} color={isolated ? '#8effc4' : '#7fd5ec'} billboard />
          )}
        </group>
      ))}

      <ScanBeam running={scanning} />
      <FragmentSwarm />

      <Shockwave trigger={isolated ? 1 : 0} position={[0, -2.4, 0]} color="#4dffa0" max={12} speed={1.3} />

      <group position={[0, 4.1, -6.2]}>
        <HoloPanel position={[0, 0, -0.1]} size={[6.4, 1.5]} color={isolated ? '#4dffa0' : '#5ce1ff'} opacity={0.4} />
        <Label3D text={isolated ? 'GATE OPEN · ARTIFACT VERIFIED' : 'GATE CLOSED · 1 FINDING'} height={0.3} color={isolated ? '#8cffc6' : '#ff8a72'} />
      </group>
      <Label3D text="SECURITY AIRLOCK" position={[0, 5.4, -6.4]} height={0.4} color="#7d8f97" />
    </group>
  )
}
