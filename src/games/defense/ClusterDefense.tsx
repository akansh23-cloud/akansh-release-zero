import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, type GameResult } from '../GameShell'
import { useSystem } from '../../state/system'
import { boom, sfx } from '../../audio/engine'
import { clamp, formatScore } from '../../lib/utils'
import HoloGrid from '../../world/fx/HoloGrid'
import ParticleField from '../../world/fx/Particles'
import { Label3D } from '../../world/fx/Primitives'

type Remedy = 'restart' | 'scale' | 'rotate'
interface FaultKind { id: string; symptom: string; detail: string; remedy: Remedy; color: string }
const FAULTS: FaultKind[] = [
  { id: 'crashloop', symptom: 'CrashLoopBackOff', detail: 'Process dies on boot and the kubelet keeps retrying.', remedy: 'restart', color: '#ff5a3c' },
  { id: 'wedged', symptom: 'Thread pool wedged', detail: 'One replica stopped serving while its peers stay healthy.', remedy: 'restart', color: '#ff5a3c' },
  { id: 'saturated', symptom: 'CPU throttling', detail: 'Every replica is healthy and every replica is at its limit.', remedy: 'scale', color: '#ffb545' },
  { id: 'queue', symptom: 'Consumer lag climbing', detail: 'Messages arrive faster than this deployment can drain them.', remedy: 'scale', color: '#ffb545' },
  { id: 'secret', symptom: 'Secret expired', detail: 'Vault lease ran out and the pod is failing auth downstream.', remedy: 'rotate', color: '#a682ff' },
  { id: 'cert', symptom: 'TLS cert expired', detail: 'Handshakes are failing against the upstream service.', remedy: 'rotate', color: '#a682ff' },
]
const REMEDIES: { id: Remedy; label: string; key: string; hint: string }[] = [
  { id: 'restart', label: 'RESTART POD', key: '1', hint: 'Replace a wedged or crash-looping process.' },
  { id: 'scale', label: 'SCALE OUT', key: '2', hint: 'Add capacity when healthy replicas are saturated.' },
  { id: 'rotate', label: 'ROTATE CREDENTIAL', key: '3', hint: 'Renew expired secret or certificate material.' },
]
interface Pod { id: number; x: number; z: number; fault: FaultKind | null; age: number; flash: number; flashOk: boolean }
interface DefState { pods: Pod[]; availability: number; wave: number; waveClock: number; score: number; resolved: number; mistakes: number; spawnClock: number; selected: number | null; over: boolean; waveBanner: number; bestAvailability: number }
const COLS = 6, ROWS = 4
function makeState(): DefState {
  const pods: Pod[] = []
  for (let i = 0; i < COLS * ROWS; i++) pods.push({ id: i, x: ((i % COLS) - (COLS - 1) / 2) * 1.85, z: (Math.floor(i / COLS) - (ROWS - 1) / 2) * 1.85, fault: null, age: 0, flash: 0, flashOk: false })
  return { pods, availability: 100, wave: 1, waveClock: 0, score: 0, resolved: 0, mistakes: 0, spawnClock: 1.2, selected: null, over: false, waveBanner: 0, bestAvailability: 100 }
}
function Cluster({ state, onSync, onEnd, paused, onSelect }: { state: React.RefObject<DefState>; onSync: (s: DefState) => void; onEnd: () => void; paused: boolean; onSelect: (id: number | null) => void }) {
  const meshes = useRef<THREE.Group[]>([]), syncTimer = useRef(0)
  useFrame((frame, rawDt) => {
    const s = state.current; if (!s || s.over || paused) return
    const dt = Math.min(0.05, rawDt), t = frame.clock.elapsedTime
    s.waveClock += dt; s.waveBanner = Math.max(0, s.waveBanner - dt)
    if (s.waveClock > 26) { s.waveClock = 0; s.wave++; s.waveBanner = 2.4; sfx('sweep') }
    const spawnEvery = Math.max(1.05, 3.4 - s.wave * 0.32); s.spawnClock -= dt
    if (s.spawnClock <= 0) { s.spawnClock = spawnEvery; const healthy = s.pods.filter((p) => !p.fault); if (healthy.length) { const target = healthy[Math.floor(Math.random() * healthy.length)]; target.fault = FAULTS[Math.floor(Math.random() * FAULTS.length)]; target.age = 0; sfx('alarm') } }
    let drain = 0
    s.pods.forEach((p) => { if (p.fault) { p.age += dt; drain += 0.55 + Math.min(1.6, p.age * 0.16) } p.flash = Math.max(0, p.flash - dt * 2.4) })
    s.availability = clamp(s.availability + (drain === 0 ? 1.4 * dt : -drain * dt), 0, 100); s.bestAvailability = Math.min(s.bestAvailability, s.availability)
    if (s.availability <= 0) { s.over = true; boom(1.3); onEnd() }
    s.pods.forEach((p, i) => { const g = meshes.current[i]; if (!g) return; const faulted = !!p.fault; const pulse = faulted ? 1 + Math.sin(t * 7 + i) * 0.09 : 1; const lift = faulted ? 0.18 + Math.sin(t * 3 + i) * 0.06 : 0; g.position.y = THREE.MathUtils.damp(g.position.y, lift, 6, dt); g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, pulse * (s.selected === p.id ? 1.16 : 1), 9, dt)); g.rotation.y += dt * (faulted ? 1.4 : 0.14); const body = g.children[0] as THREE.Mesh; const mat = body.material as THREE.MeshStandardMaterial; const targetColor = p.flash > 0 ? (p.flashOk ? '#4dffa0' : '#ffffff') : faulted ? p.fault!.color : '#1b2b32'; mat.emissive.lerp(new THREE.Color(targetColor), 0.2); mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, p.flash > 0 ? 5 : faulted ? 2.6 : 0.5, 6, dt); const ring = g.children[1] as THREE.Mesh; ring.visible = faulted; ring.rotation.z += dt * 2.2 })
    syncTimer.current += dt; if (syncTimer.current > 0.09) { syncTimer.current = 0; onSync({ ...s, pods: s.pods.map((p) => ({ ...p })) }) }
  })
  return <><ambientLight intensity={0.2} /><directionalLight position={[6, 12, 6]} intensity={1.4} color="#a8d8e6" /><pointLight position={[0, 6, 0]} intensity={22} distance={28} color="#5ce1ff" /><fog attach="fog" args={['#04070b', 14, 42]} /><HoloGrid position={[0, -0.62, 0]} size={60} color="#0a2b3a" accent="#5ce1ff" scale={22} wave={0.15} segments={64} /><ParticleField count={200} spread={22} colorA="#5ce1ff" colorB="#a682ff" rise={0.3} size={2} opacity={0.5} position={[0, 2, 0]} seed={13} /><mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[26, 20]} /><meshStandardMaterial color="#070b0e" metalness={0.8} roughness={0.5} /></mesh>{state.current.pods.map((p, i) => <group key={p.id} ref={(el) => { if (el) meshes.current[i] = el }} position={[p.x, 0, p.z]} onClick={(e) => { e.stopPropagation(); const live = state.current.pods[i]; if (!live.fault) { sfx('deny'); return } sfx('click'); onSelect(live.id) }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = state.current.pods[i].fault ? 'pointer' : 'default' }} onPointerOut={() => { document.body.style.cursor = 'default' }}><mesh><cylinderGeometry args={[0.52, 0.62, 0.72, 6]} /><meshStandardMaterial color="#131c21" metalness={0.86} roughness={0.3} emissive="#1b2b32" emissiveIntensity={0.5} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} visible={false}><torusGeometry args={[0.78, 0.05, 6, 28]} /><meshBasicMaterial color="#ff5a3c" toneMapped={false} transparent opacity={0.85} /></mesh></group>)}<Label3D text="NAMESPACE · PAYMENTS" position={[0, 3.4, -5.2]} height={0.42} color="#33525d" /></>
}
export default function ClusterDefense() {
  const quality = useSystem((s) => s.quality), unlock = useSystem((s) => s.unlock), state = useRef<DefState>(makeState())
  const [view, setView] = useState<DefState>(state.current), [result, setResult] = useState<GameResult | null>(null), [paused, setPaused] = useState(false), [started, setStarted] = useState(false), [notice, setNotice] = useState<string | null>(null)
  const end = useCallback(() => { const s = state.current; if (s.wave >= 5) unlock('defense-wave5'); if (s.bestAvailability >= 99) unlock('defense-perfect'); setResult({ score: Math.round(s.score), verdict: s.wave >= 6 ? 'The cluster held.' : s.wave >= 3 ? 'Contained, eventually.' : 'Availability gone.', lines: [{ label: 'Waves survived', value: String(s.wave) }, { label: 'Faults resolved', value: String(s.resolved) }, { label: 'Wrong remediations', value: String(s.mistakes) }, { label: 'Lowest availability', value: `${s.bestAvailability.toFixed(1)}%` }] }) }, [unlock])
  const applyRemedy = useCallback((remedy: Remedy) => { const s = state.current; if (s.selected === null || s.over) return; const pod = s.pods.find((p) => p.id === s.selected); if (!pod?.fault) return; const correct = pod.fault.remedy === remedy; pod.flash = 1; pod.flashOk = correct; if (correct) { const speedBonus = Math.max(0, 60 - pod.age * 8); s.score += 100 + speedBonus + s.wave * 10; s.resolved++; pod.fault = null; pod.age = 0; sfx('confirm'); setNotice(null) } else { s.mistakes++; s.availability = clamp(s.availability - 6, 0, 100); s.score = Math.max(0, s.score - 40); sfx('deny'); setNotice(`Wrong call. ${pod.fault.symptom} needs ${REMEDIES.find((r) => r.id === pod.fault!.remedy)!.label.toLowerCase()}.`) } s.selected = null; setView({ ...s, pods: s.pods.map((p) => ({ ...p })) }) }, [])
  const select = useCallback((id: number | null) => { state.current.selected = id; setNotice(null); setView({ ...state.current, pods: state.current.pods.map((p) => ({ ...p })) }) }, [])
  const restart = useCallback(() => { state.current = makeState(); setView(state.current); setResult(null); setPaused(false); setNotice(null); setStarted(true) }, [])
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === '1') applyRemedy('restart'); if (e.key === '2') applyRemedy('scale'); if (e.key === '3') applyRemedy('rotate'); if (e.key === 'p') setPaused((p) => !p) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [applyRemedy])
  const selectedPod = view.pods.find((p) => p.id === view.selected), faultCount = view.pods.filter((p) => p.fault).length
  const hud = useMemo(() => <div className="defense-hud"><div className="defense-top"><div className="defense-metric"><b className={view.availability < 40 ? 'critical' : ''}>{view.availability.toFixed(1)}%</b><small>AVAILABILITY</small></div><div className="defense-metric"><b>{formatScore(view.score)}</b><small>SCORE</small></div><div className="defense-metric"><b>{view.wave}</b><small>WAVE</small></div><div className="defense-metric"><b className={faultCount > 3 ? 'critical' : ''}>{faultCount}</b><small>OPEN FAULTS</small></div></div><div className="availability-bar"><i style={{ width: `${view.availability}%`, background: view.availability < 40 ? '#ff5a3c' : '#4dffa0' }} /></div>{view.waveBanner > 0 && <div className="wave-banner">WAVE {view.wave} · PRESSURE UP</div>}<div className="defense-console">{selectedPod?.fault ? <><span className="eyebrow" style={{ color: selectedPod.fault.color }}>POD-{String(selectedPod.id).padStart(2, '0')} · {selectedPod.fault.symptom}</span><p>{selectedPod.fault.detail}</p><div className="remedy-row">{REMEDIES.map((r) => <button key={r.id} onClick={() => applyRemedy(r.id)} title={r.hint}><kbd>{r.key}</kbd>{r.label}</button>)}</div></> : <><span className="eyebrow">TRIAGE CONSOLE</span><p>{notice ?? (faultCount ? 'Select a flashing pod to read its symptom.' : 'Cluster is clean. Availability is recovering.')}</p></>}</div></div>, [view, selectedPod, faultCount, notice, applyRemedy])
  return <GameShell id="defense" hud={started ? hud : null} result={result} onRestart={restart} paused={paused} onTogglePause={() => setPaused((p) => !p)}><Canvas dpr={quality === 'low' ? [0.7, 1] : [1, 1.6]} gl={{ antialias: quality === 'ultra', powerPreference: 'high-performance' }} camera={{ fov: 46, position: [0, 8.4, 9.6], near: 0.1, far: 120 }} onCreated={({ gl, camera }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; camera.lookAt(0, 0, 0) }}><color attach="background" args={['#04070b']} /><Cluster state={state} onSync={setView} onEnd={end} paused={paused || !started || !!result} onSelect={select} />{quality !== 'low' && <EffectComposer multisampling={0}><Bloom luminanceThreshold={0.5} mipmapBlur intensity={0.8} /><Vignette offset={0.2} darkness={0.6} eskil={false} /></EffectComposer>}</Canvas>{!started && !result && <div className="game-over"><div className="game-over-card"><span className="eyebrow" style={{ color: '#5ce1ff' }}>STRATEGY · WAVES</span><h2>Read the symptom.</h2><p className="result-teach">Pods will start failing. Each symptom has exactly one correct remediation — restarting a saturated service does nothing, scaling a crash loop just gives you more crash loops. Wrong calls cost availability.</p><div className="fault-key">{REMEDIES.map((r) => <div key={r.id}><kbd>{r.key}</kbd><b>{r.label}</b><span>{r.hint}</span></div>)}</div><div className="result-actions"><button className="btn-primary" onClick={restart}>START SHIFT</button></div></div></div>}</GameShell>
}
