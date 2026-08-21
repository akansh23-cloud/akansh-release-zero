import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { seeded } from '../../lib/utils'

const vertex = /* glsl */ `
  attribute float aSeed;
  attribute float aScale;
  varying float vSeed;
  varying float vAlpha;

  uniform float uTime;
  uniform float uSpread;
  uniform float uRise;
  uniform float uSize;
  uniform float uTurbulence;

  void main() {
    vSeed = aSeed;
    vec3 p = position;

    float t = uTime * uRise + aSeed * 100.0;
    p.y = mod(p.y + uTime * uRise * (0.4 + aSeed * 0.9), uSpread) - uSpread * 0.5;
    p.x += sin(t * 0.35 + aSeed * 6.28) * uTurbulence;
    p.z += cos(t * 0.28 + aSeed * 4.13) * uTurbulence;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    vAlpha = smoothstep(0.0, 6.0, dist) * (1.0 - smoothstep(uSpread * 0.5, uSpread * 1.15, dist));
    gl_PointSize = uSize * aScale * (26.0 / max(1.0, dist));
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  precision mediump float;
  varying float vSeed;
  varying float vAlpha;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.5, d);
    vec3 col = mix(uColorA, uColorB, step(0.72, vSeed));
    gl_FragColor = vec4(col, core * core * vAlpha * uOpacity);
  }
`

export interface ParticleFieldProps {
  count?: number
  spread?: number
  colorA?: string
  colorB?: string
  size?: number
  rise?: number
  turbulence?: number
  opacity?: number
  position?: [number, number, number]
  seed?: number
}

export default function ParticleField({
  count = 500,
  spread = 44,
  colorA = '#5ce1ff',
  colorB = '#ff5a3c',
  size = 3.4,
  rise = 0.35,
  turbulence = 1.4,
  opacity = 0.85,
  position = [0, 0, 0],
  seed = 7,
}: ParticleFieldProps) {
  const geometry = useMemo(() => {
    const rng = seeded(seed)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rng() - 0.5) * spread
      positions[i * 3 + 1] = (rng() - 0.5) * spread
      positions[i * 3 + 2] = (rng() - 0.5) * spread
      seeds[i] = rng()
      scales[i] = 0.35 + rng() * 1.4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), spread)
    return g
  }, [count, spread, seed])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpread: { value: spread },
          uRise: { value: rise },
          uSize: { value: size },
          uTurbulence: { value: turbulence },
          uColorA: { value: new THREE.Color(colorA) },
          uColorB: { value: new THREE.Color(colorB) },
          uOpacity: { value: opacity },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    material.uniforms.uSpread.value = spread
    material.uniforms.uRise.value = rise
    material.uniforms.uSize.value = size
    material.uniforms.uTurbulence.value = turbulence
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uColorA.value.set(colorA)
    material.uniforms.uColorB.value.set(colorB)
  }, [material, spread, rise, size, turbulence, opacity, colorA, colorB])

  useEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
    },
    [material, geometry],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return <points position={position} geometry={geometry} material={material} frustumCulled={false} />
}
