import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useMission } from '../../state/mission'
import HoloGrid from '../fx/HoloGrid'
import ParticleField from '../fx/Particles'
import { DataStream, EnergyRing, Label3D, LightShaft, MetalBox, Shockwave } from '../fx/Primitives'

function StatusMatrix() {
  const stage = useMission((s) => s.stage)
  const success = stage === 'forge-success'
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const cells = useMemo(() => Array.from({ length: 96 }, (_, i) => ({ x: ((i % 16) - 7.5) * 0.4, y: (Math.floor(i / 16) - 2.5) * 0.36, phase: (i * 37) % 100 })), [])
  useFrame((state) => {
    const m = mesh.current; if (!m) return
    const t = state.clock.elapsedTime
    cells.forEach((c, i) => {
      dummy.position.set(c.x, c.y, 0); dummy.scale.set(0.3, 0.16, 0.04); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
      const wave = Math.sin(t * 2.2 + c.phase * 0.08)
      if (success) color.setHSL(0.38, 0.85, 0.44 + wave * 0.16)
      else color.setHSL(i % 7 === 0 ? 0.02 : 0.52, i % 7 === 0 ? 0.9 : 0.2, i % 7 === 0 ? 0.46 + wave * 0.2 : 0.12)
      m.setColorAt(i, color)
    })
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return <group position={[0, 3.6, -10]}><MetalBox position={[0, 0, -0.12]} scale={[7.2, 2.6, 0.2]} emissive={success ? '#082419' : '#1d0705'} intensity={1.1} /><instancedMesh ref={mesh} args={[undefined, undefined, cells.length]}><boxGeometry /><meshBasicMaterial toneMapped={false} /></instancedMesh><Label3D text={success ? 'BUILD RESTORED' : 'BUILD FAILED'} position={[0, 1.62, 0.1]} height={0.3} color={success ? '#7dffbc' : '#ff6a55'} /></group>
}

function ReleaseCapsule() {
  const stage = useMission((s) => s.stage); const ref = useRef<THREE.Group>(null); const shell = useRef<THREE.Mesh>(null); const ok = stage === 'forge-success'
  useFrame((state, dt) => { const g = ref.current; if (!g) return; const t = state.clock.elapsedTime; g.position.y = 0.62 + Math.sin(t * 0.8) * 0.09; g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ok ? 0 : Math.sin(t * 0.3) * 0.14, 2, dt); g.rotation.z = Math.sin(t * 0.42) * (ok ? 0.01 : 0.05); if (shell.current) { const mat = shell.current.material as THREE.MeshPhysicalMaterial; mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, ok ? 0.7 : 0.25, 3, dt) } })
  return <group ref={ref} position={[0, 0.62, -0.4]}><mesh ref={shell} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.24, 1.24, 3.8, 40, 1, true]} /><meshPhysicalMaterial color="#151c20" metalness={0.94} roughness={0.16} clearcoat={0.9} emissive={ok ? '#0f4a30' : '#3a0d08'} emissiveIntensity={0.25} side={THREE.DoubleSide} /></mesh><EnergyRing position={[0, 0, 0]} scale={1.26} color={ok ? '#4dffa0' : '#ff5a3c'} rotation={[Math.PI / 2, 0, 0]} spin={ok ? 0.9 : 0.25} />{[-1.35, 1.35].map((z) => <mesh key={z} position={[0, z, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.1, 0.04, 10, 56]} /><meshStandardMaterial color="#8d989e" metalness={1} roughness={0.22} /></mesh>)}<mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 3.1, 16]} /><meshStandardMaterial color="#0b1114" emissive={ok ? '#2fd98a' : '#ff3a24'} emissiveIntensity={ok ? 3.2 : 1.6} metalness={0.7} roughness={0.3} toneMapped={false} /></mesh></group>
}

function ForgeArms() {
  const stage = useMission((s) => s.stage); const success = stage === 'forge-success'; const arms = useRef<THREE.Group[]>([]); const plates = useRef<THREE.Mesh[]>([]); const sparkRef = useRef<THREE.PointLight>(null)
  useFrame((state, dt) => { const t = state.clock.elapsedTime; arms.current.forEach((arm, i) => { if (!arm) return; const target = success ? (i === 0 ? -0.16 : 0.16) : (i === 0 ? 0.62 : -0.62); arm.rotation.z = THREE.MathUtils.damp(arm.rotation.z, target, 3.2, dt); arm.position.y = 1.1 + Math.sin(t * 1.4 + i) * (success ? 0.03 : 0.09) }); plates.current.forEach((p, i) => { if (!p) return; const targetX = success ? 0 : (i - 1) * 2.25; p.position.x = THREE.MathUtils.damp(p.position.x, targetX, 3, dt); p.rotation.y += (success ? 0.01 : 0.0016) * 60 * dt; p.position.y = 0.85 + Math.sin(t * 1.1 + i) * 0.09 }); if (sparkRef.current) { const flash = success ? 0 : Math.pow(Math.max(0, Math.sin(t * 9.1) * Math.sin(t * 3.3)), 6); sparkRef.current.intensity = flash * 26 } })
  if (!stage.startsWith('forge') && stage !== 'cold-start') return null
  return <group position={[0, 0, -1]}>{[-3.6, 3.6].map((x, i) => <group key={x} ref={(el) => { if (el) arms.current[i] = el }} position={[x, 1.1, 0]} rotation={[0, i ? Math.PI : 0, i ? -0.62 : 0.62]}><mesh scale={[0.32, 2.8, 0.44]}><boxGeometry /><meshStandardMaterial color="#232b2f" metalness={0.95} roughness={0.28} /></mesh><mesh position={[0, 2.7, 0]} scale={[0.82, 0.36, 0.82]}><cylinderGeometry args={[0.62, 0.62, 1, 20]} /><meshStandardMaterial color="#39434a" metalness={0.92} roughness={0.28} /></mesh><mesh position={[0, -1.5, 0]}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#1a2226" metalness={0.9} roughness={0.3} /></mesh></group>)}<pointLight ref={sparkRef} position={[0, 1.4, 0.6]} color="#ffb545" distance={9} intensity={0} />{[0, 1, 2].map((i) => <mesh key={i} ref={(el) => { if (el) plates.current[i] = el }} position={[(i - 1) * 2.25, 0.85, -1.3]} scale={[1.18, 0.11, 0.7]}><boxGeometry /><meshStandardMaterial color="#16242c" metalness={0.72} roughness={0.2} emissive={success ? '#16442e' : '#5a140d'} emissiveIntensity={success ? 1.8 : 1.2} /></mesh>)}<mesh position={[0, 0.15, -1.25]}><cylinderGeometry args={[1.15, 1.35, 0.36, 40]} /><meshStandardMaterial color="#0c1114" metalness={0.94} roughness={0.22} emissive={success ? '#0d5535' : '#4d0b07'} emissiveIntensity={2.2} /></mesh></group>
}

function GantryLights() {
  const stage = useMission((s) => s.stage); const refs = useRef<THREE.PointLight[]>([]); const start = useRef(performance.now()); const points = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ x: ((i % 4) - 1.5) * 5.6, z: -9 + Math.floor(i / 4) * 6.4 })), [])
  useFrame(() => { const elapsed = (performance.now() - start.current) / 1000; refs.current.forEach((l, i) => { if (!l) return; const boot = stage === 'cold-start' ? Math.max(0.04, Math.min(1, (elapsed - i * 0.09) * 2.1)) : 1; l.intensity = (i % 3 === 0 ? 6.4 : 1.2) * boot }) })
  return <>{points.map((p, i) => <pointLight key={i} ref={(el) => { if (el) refs.current[i] = el }} position={[p.x, 5.2, p.z]} color={i % 3 === 0 ? '#ff5a3c' : '#9fb4bd'} distance={9} />)}</>
}

export default function ColdForgeZone() {
  const stage = useMission((s) => s.stage); const success = stage === 'forge-success'; const active = stage === 'cold-start' || stage.startsWith('forge'); if (!active) return null
  return <group><ambientLight intensity={0.1} /><directionalLight position={[6, 9, 4]} intensity={0.7} color="#bcd3da" /><GantryLights /><HoloGrid position={[0, -2.48, -2]} size={90} color={success ? '#0d4033' : '#3a1210'} accent={success ? '#4dffa0' : '#ff5a3c'} scale={30} pulse={success ? 0.4 : 0.1} wave={0.4} /><mesh position={[0, -2.52, -2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[42, 46]} /><meshStandardMaterial color="#080c0e" metalness={0.78} roughness={0.5} /></mesh><ParticleField count={260} spread={30} colorA="#ffb545" colorB="#ff5a3c" rise={0.5} size={2.6} opacity={success ? 0.4 : 0.9} position={[0, 1, -3]} seed={11} />{[-10.5, -7, 7, 10.5].map((x) => <MetalBox key={x} position={[x, 1.6, -1]} scale={[0.42, 9, 20]} emissive="#170604" intensity={0.5} />)}{[-8.2, 6.2].map((z) => <MetalBox key={z} position={[0, 6.4, z]} scale={[13, 0.32, 0.34]} />)}<LightShaft position={[-5.4, 1.6, -4]} height={8} radiusBottom={2.4} color="#ff5a3c" intensity={success ? 0.3 : 0.9} /><LightShaft position={[5.4, 1.6, -4]} height={8} radiusBottom={2.4} color={success ? '#4dffa0' : '#ff5a3c'} intensity={0.7} /><StatusMatrix /><ReleaseCapsule /><ForgeArms /><Shockwave trigger={success ? 1 : 0} position={[0, -2.4, -1]} color="#4dffa0" max={14} speed={1.1} /><DataStream start={[-9, 0.4, -8]} end={[9, 0.4, -8]} count={16} speed={0.09} flow={success ? 1 : 0.25} color="#ffb545" arc={1.4} /><Label3D text="BUILD FORGE" position={[0, 5.1, -9.6]} height={0.42} color="#7d8f97" /></group>
}
