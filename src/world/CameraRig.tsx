import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useMission, type Stage } from '../state/mission'

interface Shot {
  pos: [number, number, number]
  look: [number, number, number]
  fov?: number
  roll?: number
  shake?: number
  /** how fast the camera settles — higher is snappier */
  ease?: number
  /** slow ambient orbit around the look target */
  drift?: number
}

/**
 * Each stage is framed like a shot rather than a camera position.
 * The rig interpolates between them, so moving between missions
 * reads as a continuous flight through one connected facility.
 */
const shots: Record<Stage, Shot> = {
  'cold-start': { pos: [0, 2.0, 11], look: [0, 1.0, -2], fov: 52, drift: 0.16, ease: 1.1 },

  'forge-intro': { pos: [8.2, 3.2, 6.4], look: [0, 0.9, -1], fov: 46, drift: 0.1 },
  'forge-diagnose': { pos: [4.2, 1.35, 5.0], look: [-0.6, 0.9, -1.4], fov: 41, drift: 0.06 },
  'forge-success': { pos: [-6.2, 3.6, 6.6], look: [0, 0.9, -1], fov: 48, roll: -0.04, drift: 0.12 },

  'security-intro': { pos: [0, 2.6, -16.5], look: [0, 0.9, -28], fov: 50, drift: 0.1 },
  'security-scan': { pos: [4.6, 1.4, -20.5], look: [0, 0.9, -28], fov: 38, drift: 0.05 },
  'security-success': { pos: [-4.6, 3.0, -19], look: [0, 0.9, -28], fov: 48, roll: 0.05, drift: 0.12 },

  'image-intro': { pos: [0, 2.6, -44], look: [0, 0.9, -56], fov: 50, drift: 0.1 },
  'image-inspect': { pos: [6.4, 2.1, -48], look: [0, 0.9, -56], fov: 42, drift: 0.06 },
  'image-sealed': { pos: [-5.4, 3.2, -47], look: [0, 0.9, -56], fov: 47, roll: -0.05, drift: 0.14 },

  'rail-intro': { pos: [3.4, 1.6, -70], look: [0, 0.5, -84], fov: 52, drift: 0.08 },
  'rail-run': { pos: [0.2, 0.85, -78.5], look: [0, 0.4, -95], fov: 88, shake: 0.055, ease: 4.6, roll: 0.02 },

  'cluster-intro': { pos: [0, 9.5, -108], look: [0, 0.5, -126], fov: 52, drift: 0.09 },
  'cluster-rollout': { pos: [11.5, 7.5, -114], look: [0, -0.4, -126], fov: 48, drift: 0.14 },
  'traffic-bridge': { pos: [0, 6.4, -112], look: [0, 2.2, -126], fov: 50, drift: 0.06 },

  'incident-intro': { pos: [0, 4.0, -148], look: [0, 1.2, -162], fov: 54, shake: 0.02, drift: 0.08 },
  'incident-diagnose': { pos: [0, 1.9, -151.5], look: [0, 0.9, -162], fov: 46, shake: 0.018 },
  'incident-action': { pos: [7.4, 2.4, -152.5], look: [0, 0.9, -162], fov: 44, shake: 0.03 },
  'incident-recovered': { pos: [-7.4, 4.2, -151], look: [0, 0.9, -162], fov: 50, roll: 0.05, drift: 0.14 },

  'nexus-intro': { pos: [0, 3.8, -184], look: [0, 1.2, -198], fov: 52, drift: 0.1 },
  'nexus-build': { pos: [8.6, 3.2, -188], look: [0, 1.2, -198], fov: 46, drift: 0.08 },
  reveal: { pos: [0, 2.2, -186], look: [0, 1.7, -202], fov: 44, drift: 0.05, ease: 1.0 },
}

const noise = (t: number, o: number) => Math.sin(t * 12.9898 + o) * Math.sin(t * 7.233 + o * 1.7) * Math.sin(t * 3.11 + o * 0.4)

export default function CameraRig() {
  const stage = useMission((s) => s.stage)
  const { camera } = useThree()
  const shot = useMemo(() => shots[stage] ?? shots['cold-start'], [stage])

  const lookAt = useRef(new THREE.Vector3(0, 1, -2))
  const desired = useRef(new THREE.Vector3())
  const punch = useRef(0)
  const lastStage = useRef<Stage>(stage)

  useEffect(() => {
    camera.position.set(0, 2.6, 17)
  }, [camera])

  // Every stage change fires a short FOV punch — reads as a cut without one.
  useEffect(() => {
    if (lastStage.current !== stage) {
      punch.current = 1
      lastStage.current = stage
    }
  }, [stage])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const cam = camera as THREE.PerspectiveCamera
    const ease = shot.ease ?? 1.7
    const shake = shot.shake ?? 0

    // Ambient drift keeps the frame alive even when nothing is happening.
    const drift = shot.drift ?? 0
    const dx = Math.sin(t * 0.21) * drift + noise(t * 0.7, 1) * shake
    const dy = Math.cos(t * 0.17) * drift * 0.5 + noise(t * 0.9, 2) * shake
    const dz = noise(t * 0.6, 3) * shake

    desired.current.set(shot.pos[0] + dx, shot.pos[1] + dy, shot.pos[2] + dz)
    camera.position.lerp(desired.current, 1 - Math.exp(-dt * ease))

    lookAt.current.lerp(new THREE.Vector3(...shot.look), 1 - Math.exp(-dt * (ease * 1.3)))
    camera.lookAt(lookAt.current)

    // Roll has to be applied after lookAt, which zeroes it.
    const roll = (shot.roll ?? 0) + Math.sin(t * 0.31) * drift * 0.06
    camera.rotateZ(roll)

    punch.current = THREE.MathUtils.damp(punch.current, 0, 3.4, dt)
    const targetFov = (shot.fov ?? 47) + punch.current * 9
    cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 6, dt)
    cam.updateProjectionMatrix()
  })

  return null
}
