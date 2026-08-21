import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useMission } from '../../state/mission'
import { sfx } from '../../audio/engine'
import HoloGrid from '../fx/HoloGrid'
import ParticleField from '../fx/Particles'
import { DataStream, HoloPanel, Label3D, LightShaft, MetalBox, Shockwave } from '../fx/Primitives'

const layers = [
  { id: 'BASE', size: 2.95, color: '#8ea3ad', detail: 'ubi9-minimal' },
  { id: 'RUNTIME', size: 2.55, color: '#5ce1ff', detail: 'jdk-21' },
  { id: 'APP', size: 2.15, color: '#ffb545', detail: 'service.jar' },
  { id: 'CONFIG', size: 1.75, color: '#4dffa0', detail: 'values.yaml' },
]

export default function ImageFoundryZone() {
  const stage = useMission((s) => s.stage)
  const opened = useMission((s) => s.openedLayers)
  const toggleLayer = useMission((s) => s.toggleLayer)
  const refs = useRef<THREE.Group[]>([])
  const core = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState<string | null>(null)

  const active = stage.startsWith('image')
  const sealed = stage === 'image-sealed'
  const digest = useMemo(() => 'sha256:4f9c2b' + Math.abs(0x51ab3d).toString(16), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      const isOpen = opened.includes(layers[i].id)
      const spread = sealed ? 0 : isOpen ? (i - 1.5) * 1.5 : (i - 1.5) * 0.2
      g.position.y = THREE.MathUtils.damp(g.position.y, 0.9 + spread, 4.2, dt)
      g.rotation.y += dt * (sealed ? 1.5 : isOpen ? 0.5 : 0.16) * (i % 2 ? -1 : 1)
      const target = sealed ? 0.82 + i * 0.045 : hover === layers[i].id ? 1.07 : 1
      const s = THREE.MathUtils.damp(g.scale.x, target, 5, dt)
      g.scale.setScalar(s)
      if (sealed) g.position.x = Math.sin(t * 0.4 + i) * 0.05
    })
    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, sealed ? 4.5 : 1.1, 3, dt)
      core.current.rotation.y += dt * (sealed ? 1.1 : 0.2)
    }
  })

  if (!active) return null

  return (
    <group position={[0, 0, -56]}>
      <ambientLight intensity={0.13} />
      <pointLight position={[0, 5.4, 3]} intensity={11} distance={18} color="#ffb545" />
      <pointLight position={[-5.5, 2, -3]} intensity={6} distance={12} color="#5ce1ff" />
      <pointLight position={[5.5, 1, 2]} intensity={4} distance={10} color="#4dffa0" />

      <HoloGrid position={[0, -2.48, 0]} size={70} color="#3a2606" accent={sealed ? '#4dffa0' : '#ffb545'} scale={26} pulse={sealed ? 0.5 : 0.12} />
      <mesh position={[0, -2.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 30]} />
        <meshStandardMaterial color="#0a0d0f" metalness={0.82} roughness={0.42} />
      </mesh>

      <ParticleField count={240} spread={24} colorA="#ffb545" colorB="#4dffa0" rise={0.4} size={2.4} opacity={0.75} position={[0, 1, 0]} seed={31} />

      {[-7.4, 7.4].map((x) => (
        <MetalBox key={x} position={[x, 1.4, 0]} scale={[0.55, 7, 11]} emissive="#241305" intensity={0.8} />
      ))}
      <LightShaft position={[0, 4, 0]} height={8} radiusTop={0.3} radiusBottom={3.6} color={sealed ? '#4dffa0' : '#ffb545'} intensity={0.85} />

      <group rotation={[Math.PI / 2, 0, 0]}>
        {layers.map((layer, i) => {
          const isOpen = opened.includes(layer.id)
          return (
            <group key={layer.id} ref={(el) => { if (el) refs.current[i] = el }} position={[0, (i - 1.5) * 0.2, 0]}>
              <mesh
                onClick={(e) => { e.stopPropagation(); if (sealed) return; sfx(isOpen ? 'click' : 'confirm'); toggleLayer(layer.id) }}
                onPointerOver={(e) => { e.stopPropagation(); setHover(layer.id); document.body.style.cursor = 'pointer'; sfx('hover') }}
                onPointerOut={() => { setHover(null); document.body.style.cursor = 'default' }}
              >
                <torusGeometry args={[layer.size, 0.23, 14, 72]} />
                <meshStandardMaterial color={layer.color} emissive={layer.color} emissiveIntensity={isOpen || sealed ? 2.8 : 0.6} metalness={0.7} roughness={0.22} toneMapped={false} />
              </mesh>
              {[0,1,2,3,4,5].map((b) => { const a=(b/6)*Math.PI*2; return <mesh key={b} position={[Math.cos(a)*layer.size,0,Math.sin(a)*layer.size]}><boxGeometry args={[0.16,0.34,0.16]}/><meshStandardMaterial color="#252f34" metalness={0.95} roughness={0.28}/></mesh> })}
            </group>
          )
        })}
        <mesh ref={core}><cylinderGeometry args={[1.08,1.08,3.8,40]}/><meshStandardMaterial color="#141b1f" metalness={0.92} roughness={0.15} emissive={sealed ? '#1c7a4e' : '#5c3908'} emissiveIntensity={1.1}/></mesh>
      </group>

      <Shockwave trigger={sealed ? 1 : 0} position={[0,-2.4,0]} color="#4dffa0" max={13} speed={1.2}/>
      <group position={[0,4.5,-4.6]}>
        <HoloPanel position={[0,0,-0.12]} size={[7.6,2.5]} color={sealed ? '#4dffa0' : '#5ce1ff'} opacity={0.36}/>
        <Label3D text={sealed ? `SEALED  ${digest}` : 'LAYER MANIFEST'} position={[0,0.86,0]} height={0.26} color={sealed ? '#8cffc6' : '#a8d6e4'}/>
        {layers.map((l,i)=><group key={l.id} position={[0,0.34-i*0.42,0]}><Label3D text={`${opened.includes(l.id)||sealed?'✓':'·'}  ${l.id.padEnd(8)} ${l.detail}`} height={0.22} color={opened.includes(l.id)||sealed?l.color:'#54636b'}/></group>)}
      </group>
      <DataStream start={[-8,0.6,-6]} end={[8,0.6,-6]} count={18} speed={0.13} flow={sealed?1:0.4} color="#ffb545" arc={1.2}/>
      <Label3D text="IMAGE FOUNDRY" position={[0,6.2,-4.8]} height={0.4} color="#7d8f97"/>
    </group>
  )
}
