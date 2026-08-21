import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uWave;

  void main() {
    vUv = uv;
    vec3 p = position;
    float d = length(p.xy);
    p.z += sin(d * 0.42 - uTime * 1.6) * uWave * exp(-d * 0.045);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;

  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uAccent;
  uniform float uScale;
  uniform float uPulse;
  uniform float uFade;
  uniform float uGlitch;
  uniform vec2  uFocus;

  // Analytic grid lines. Width grows with distance so the mesh does not
  // alias into noise near the horizon — the same job fwidth() would do,
  // without depending on a derivative extension being available.
  float gridLine(vec2 p, float w, float d) {
    vec2 g = abs(fract(p - 0.5) - 0.5);
    float line = min(g.x, g.y);
    float width = w * (1.0 + d * 0.05);
    return 1.0 - smoothstep(0.0, width, line);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 p = (vUv - 0.5) * uScale;
    float d = length(p - uFocus);

    // Two grid frequencies: fine mesh over a heavier chassis grid.
    float fine  = gridLine(p * 4.0, 0.028, d) * 0.30;
    float major = gridLine(p, 0.020, d) * 0.85;

    // Radial scan sweeping outward from the focus point.
    float sweep = fract(d * 0.06 - uTime * 0.11);
    float ring = smoothstep(0.965, 1.0, sweep) * 0.9;

    // Slow breathing pulse tied to scene state.
    float breathe = 0.55 + 0.45 * sin(uTime * 0.7 - d * 0.12);

    // Horizontal tear lines during glitch states.
    float band = step(0.985, hash(vec2(floor(vWorld.z * 3.0), floor(uTime * 14.0))));
    float tear = band * uGlitch;

    float intensity = (fine + major) * breathe + ring;
    vec3 col = mix(uColor, uAccent, clamp(ring * 1.6 + uPulse, 0.0, 1.0));
    col += uAccent * tear * 0.8;

    // Radial falloff so the plane dissolves into fog instead of ending.
    float falloff = 1.0 - smoothstep(uFade * 0.25, uFade, d);
    float alpha = clamp(intensity * falloff, 0.0, 1.0);

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col * (0.55 + intensity * 0.9), alpha);
  }
`

export interface HoloGridProps {
  position?: [number, number, number]
  size?: number
  segments?: number
  color?: string
  accent?: string
  scale?: number
  /** 0–1, pushes the whole grid toward the accent colour */
  pulse?: number
  /** 0–1 glitch tear intensity */
  glitch?: number
  /** vertical wave amplitude */
  wave?: number
  focus?: [number, number]
}

export default function HoloGrid({
  position = [0, -2.5, 0],
  size = 90,
  segments = 96,
  color = '#0d3f52',
  accent = '#5ce1ff',
  scale = 34,
  pulse = 0,
  glitch = 0,
  wave = 0.35,
  focus = [0, 0],
}: HoloGridProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uAccent: { value: new THREE.Color(accent) },
          uScale: { value: scale },
          uPulse: { value: pulse },
          uFade: { value: scale * 0.5 },
          uGlitch: { value: glitch },
          uWave: { value: wave },
          uFocus: { value: new THREE.Vector2(focus[0], focus[1]) },
        },
      }),
    // Uniforms are driven imperatively below; the material itself is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uColor.value.set(color)
    material.uniforms.uAccent.value.set(accent)
    material.uniforms.uScale.value = scale
    material.uniforms.uFade.value = scale * 0.5
    material.uniforms.uWave.value = wave
    material.uniforms.uFocus.value.set(focus[0], focus[1])
  }, [material, color, accent, scale, wave, focus])

  useFrame((state, dt) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPulse.value = THREE.MathUtils.damp(u.uPulse.value as number, pulse, 3, dt)
    u.uGlitch.value = THREE.MathUtils.damp(u.uGlitch.value as number, glitch, 6, dt)
  })

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={material} frustumCulled={false}>
      <planeGeometry args={[size, size, segments, segments]} />
    </mesh>
  )
}
