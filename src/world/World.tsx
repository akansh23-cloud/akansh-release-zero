import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { useSystem } from '../state/system'
import CameraRig from './CameraRig'
import Effects from './Effects'
import ColdForgeZone from './zones/ColdForgeZone'
import SecurityZone from './zones/SecurityZone'
import ImageFoundryZone from './zones/ImageFoundryZone'
import RailZone from './zones/RailZone'
import ClusterZone from './zones/ClusterZone'
import IncidentZone from './zones/IncidentZone'
import NexusZone from './zones/NexusZone'

function Scene() {
  const degrade = useSystem((s) => s.degrade)
  return (
    <>
      <PerformanceMonitor
        bounds={(refreshRate) => (refreshRate > 90 ? [55, 90] : [40, 60])}
        onDecline={degrade}
        onFallback={degrade}
      />
      <CameraRig />
      <fog attach="fog" args={['#03060a', 16, 82]} />
      <ColdForgeZone />
      <SecurityZone />
      <ImageFoundryZone />
      <RailZone />
      <ClusterZone />
      <IncidentZone />
      <NexusZone />
      <Effects />
      <AdaptiveDpr pixelated={false} />
      <Preload all />
    </>
  )
}

export const dprFor = (quality: string): [number, number] =>
  quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.6] : quality === 'medium' ? [1, 1.2] : [0.7, 1]

export default function World() {
  const quality = useSystem((s) => s.quality)
  return (
    <Canvas
      dpr={dprFor(quality)}
      gl={{ antialias: quality === 'ultra', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 50, near: 0.1, far: 460 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          document.documentElement.dataset.webglLost = 'true'
        })
        gl.domElement.addEventListener('webglcontextrestored', () => {
          delete document.documentElement.dataset.webglLost
        })
      }}
    >
      <color attach="background" args={['#03060a']} />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
