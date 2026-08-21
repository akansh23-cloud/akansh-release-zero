import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useSystem } from '../state/system'
import { useMission } from '../state/mission'

export default function Effects() {
  const quality = useSystem((s) => s.quality)
  const stage = useMission((s) => s.stage)
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0004), [])

  useFrame((_, dt) => {
    const stressed = stage.startsWith('incident') && stage !== 'incident-recovered'
    const target = stressed ? 0.0032 : stage === 'rail-run' ? 0.0022 : 0.0006
    const v = THREE.MathUtils.damp(offset.x, target, 4, dt)
    offset.set(v, v * 0.72)
  })

  if (quality === 'low') return null

  const bloomIntensity = quality === 'ultra' ? 0.95 : quality === 'high' ? 0.74 : 0.5

  return (
    <EffectComposer multisampling={quality === 'ultra' ? 4 : 0}>
      <Bloom
        luminanceThreshold={0.62}
        luminanceSmoothing={0.24}
        mipmapBlur
        intensity={bloomIntensity}
        radius={quality === 'ultra' ? 0.78 : 0.62}
      />
      <ChromaticAberration offset={offset} />
      {quality !== 'medium' ? <Noise opacity={0.016} blendFunction={BlendFunction.OVERLAY} /> : <></>}
      <Vignette eskil={false} offset={0.2} darkness={0.55} />
    </EffectComposer>
  )
}
