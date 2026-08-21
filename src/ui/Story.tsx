import { useEffect, useState, type ReactNode } from 'react'
import {
  PIPELINE_ORDER,
  SIGNAL_TARGETS,
  useMission,
  type Fault,
  type IncidentAction,
  type PipelineModule,
  type Stage,
} from '../state/mission'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'

const faultCopy: Record<Fault, string> = {
  dependency: 'Dependency graph resolves cleanly. Lockfile matches the manifest. The fault is somewhere else.',
  test: 'Every test is green, and they were green on the last successful build too. The failure is downstream of verification.',
  config: 'Environment configuration has drifted from the canonical values. Restoring them makes the build reproducible again.',
}

const incidentCopy: Record<IncidentAction, string> = {
  restart: 'Restarting recreates the same broken revision. The pods come back and fail readiness again.',
  scale: 'Scaling adds more copies of the failing revision. Error rate rises with the replica count.',
  rollback: 'The previous known-good revision is restored. Error rate falls immediately.',
}

function Brief({ no, title, copy, children }: { no: string; title: string; copy: string; children: ReactNode }) {
  return (
    <section className="panel panel-brief">
      <span className="eyebrow">{no}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      <div>{children}</div>
    </section>
  )
}

function Next({ to, label }: { to: Stage; label: string }) {
  const advance = useMission((s) => s.advance)
  return <button className="btn-primary" onClick={() => { sfx('confirm'); advance(to) }}>{label}</button>
}

function Timed({ delay, to, children }: { delay: number; to: Stage; children: ReactNode }) {
  const advance = useMission((s) => s.advance)
  useEffect(() => { const t = window.setTimeout(() => advance(to), delay); return () => window.clearTimeout(t) }, [advance, delay, to])
  return <>{children}</>
}

function RailSequence() {
  const advance = useMission((s) => s.advance)
  const [step, setStep] = useState(0)
  const labels = ['BUILD', 'VERIFY', 'APPROVE', 'PACKAGE', 'DEPLOY']
  useEffect(() => {
    const i = window.setInterval(() => setStep((x) => Math.min(labels.length - 1, x + 1)), 540)
    const t = window.setTimeout(() => advance('cluster-intro'), 3500)
    return () => { window.clearInterval(i); window.clearTimeout(t) }
  }, [advance])
  return <div className="rail-hud"><span>RELEASE RAIL · LIVE</span><div>{labels.map((x, i) => <b key={x} className={i <= step ? 'on' : ''}>{x}</b>)}</div></div>
}

export default function Story() {
  const s = useMission()
  const go = useSystem((state) => state.go)
  const { stage } = s

  switch (stage) {
    case 'cold-start':
      return <section className="panel panel-center"><div className="cold-lines"><span>BUILD READY.</span><span>SECURITY NOT VERIFIED.</span><span>TARGET CLUSTER DEGRADED.</span><span>OPERATOR REQUIRED.</span></div><h1>The release is waiting.</h1><div style={{ marginTop: 26 }}><button className="btn-danger" onClick={() => { sfx('launch'); s.advance('forge-intro') }}>TAKE THE CONSOLE</button></div></section>
    case 'forge-intro':
      return <Brief no="MISSION 01 · BUILD FORGE" title="Restore the build." copy="The artifact core stalled during assembly. Three subsystems report differently. Only one of them is lying."><Next to="forge-diagnose" label="INSPECT THE FORGE" /></Brief>
    case 'forge-diagnose':
      return <section className="panel panel-work"><span className="eyebrow">BUILD FORGE · DIAGNOSTIC</span><h1>Three paths. One broken contract.</h1><p>{s.selectedFault ? faultCopy[s.selectedFault] : 'Pick a subsystem to interrogate. The forge reacts to your diagnosis.'}</p><div className="choice-grid">{(['dependency','test','config'] as Fault[]).map((f,i) => <button key={f} onClick={() => { sfx(f === 'config' ? 'confirm' : 'deny'); s.setFault(f) }}><span>0{i+1}</span>{f.toUpperCase()}</button>)}</div>{s.selectedFault && s.selectedFault !== 'config' && <div className="feedback">NO FIX APPLIED · CONTINUE DIAGNOSIS</div>}</section>
    case 'forge-success':
      return <Brief no="BUILD FORGE · RESTORED" title="Repeatability restored." copy="Canonical configuration is back in place. The same commit now produces the same artifact — which is the entire point."><Next to="security-intro" label="MOVE TO SECURITY AIRLOCK" /></Brief>
    case 'security-intro':
      return <Brief no="MISSION 02 · SECURITY AIRLOCK" title="Nothing unverified crosses." copy="Four rings inspect code quality, SAST, image security and secrets. One fragment orbiting inside the chamber carries a finding. Find it in the 3D scene — the gate will not open until it is physically removed."><Next to="security-scan" label="START SECURITY SCAN" /></Brief>
    case 'security-scan':
      return <section className="panel panel-work"><span className="eyebrow">SECURITY AIRLOCK · LIVE SCAN</span><h1>Isolate the finding.</h1><p>Nine fragments are circulating in the chamber. Eight match their manifest signature. Click the one that does not. Clean fragments will tell you so.</p><div className="chip-row">{['CODE QUALITY','SAST','IMAGE SECURITY','SECRETS'].map((g,i) => <span className={`chip${i < 2 ? ' done' : ''}`} key={g}>{g}</span>)}</div><div className="scan-bar"><i /></div><div className="row-end"><button className="text-link" onClick={s.isolateSecurity}>SKIP · USE ACCESSIBLE CONTROL</button></div></section>
    case 'security-success':
      return <Brief no="SECURITY AIRLOCK · VERIFIED" title="Gate cleared." copy="The vulnerable fragment was quarantined before promotion rather than after an incident. That difference is the whole argument for shift-left."><Next to="image-intro" label="ENTER IMAGE FOUNDRY" /></Brief>
    case 'image-intro':
      return <Brief no="MISSION 03 · IMAGE FOUNDRY" title="A container is a contract." copy="Four layers decide whether runtime behaviour is reproducible: base image, runtime, application and configuration. Open each one before you seal it."><Next to="image-inspect" label="OPEN THE IMAGE" /></Brief>
    case 'image-inspect':
      return <section className="panel panel-work"><span className="eyebrow">IMAGE FOUNDRY · LAYER INSPECTION</span><h1>Pull the image apart.</h1><p>Click all four rings in the 3D scene to expose the layers. Sealing is only available once every layer has been inspected.</p><div className="chip-row">{['BASE','RUNTIME','APP','CONFIG'].map((x) => <span className={`chip${s.openedLayers.includes(x) ? ' done' : ''}`} key={x}>{x}</span>)}</div><button className="btn-primary" disabled={s.openedLayers.length < 4} onClick={() => { sfx('seal'); s.sealImage() }}>SEAL IMAGE {s.openedLayers.length < 4 ? `· ${s.openedLayers.length}/4` : ''}</button></section>
    case 'image-sealed':
      return <Brief no="IMAGE FOUNDRY · HARDENED" title="Runtime sealed." copy="The layers collapse into one immutable capsule with a pinned digest. From here, what runs in production is exactly what was scanned."><Next to="rail-intro" label="LOAD RELEASE RAIL" /></Brief>
    case 'rail-intro':
      return <Brief no="MISSION 04 · RELEASE RAIL" title="The window is open." copy="Build, verify, approve, package and deploy execute as one sequence. Once it starts you are watching, not steering — which is exactly how a good pipeline should feel."><button className="btn-danger" onClick={() => { sfx('launch'); s.startRail() }}>INITIATE RELEASE</button></Brief>
    case 'rail-run': return <RailSequence />
    case 'cluster-intro':
      return <Brief no="MISSION 05 · CLUSTER CITY" title="Buildings are workloads." copy="Districts are namespaces. Roads are service paths. You are about to replace a city block while traffic keeps moving through it."><button className="btn-primary" onClick={() => { sfx('launch'); s.startRollout() }}>ROLL OUT RELEASE</button></Brief>
    case 'cluster-rollout':
      return <Timed delay={5200} to="traffic-bridge"><section className="panel panel-brief"><span className="eyebrow">ROLLING DEPLOYMENT · IN PROGRESS</span><h1>The city is changing under live traffic.</h1><p>A wave sweeps the payments district. Old towers retract, new revisions rise taller, readiness lights come up behind it.</p><div className="scan-bar"><i /></div></section></Timed>
    case 'traffic-bridge':
      return <section className="panel panel-work"><span className="eyebrow">TRAFFIC BRIDGE · RELEASE ASSURANCE</span><h1>Shift traffic without dropping the path.</h1><p>Move validation traffic onto the new release and watch the packet flow above the city redistribute. Reach 80% to commit.</p><div className="slider-row"><span>OLD {100-s.trafficShift}%</span><input type="range" min={0} max={100} value={s.trafficShift} aria-label="Traffic shift to new release" onChange={(e) => s.setTrafficShift(Number(e.target.value))}/><span>NEW {s.trafficShift}%</span></div><button className="btn-primary" disabled={s.trafficShift < 80} onClick={() => { sfx('confirm'); s.commitTraffic() }}>COMMIT ROUTE</button></section>
    case 'incident-intro':
      return <Brief no="MISSION 06 · INCIDENT ZERO" title="Production is degrading." copy="Error rate is climbing and one district has gone dark. Move to the observability deck and correlate the three signals before you touch anything."><Next to="incident-diagnose" label="OPEN OBSERVABILITY DECK" /></Brief>
    case 'incident-diagnose':
      return <section className="panel panel-work"><span className="eyebrow">OBSERVABILITY · SIGNAL ALIGNMENT</span><h1>Logs. Metrics. Traces.</h1><p>Each wall is noise until it is tuned. Align all three and the waveforms resolve into a readable signal — that convergence is what root cause actually feels like.</p><div className="signal-stack">{['LOGS','METRICS','TRACES'].map((name,i) => { const locked=Math.abs(s.signalAlignment[i]-SIGNAL_TARGETS[i])<=6; return <label key={name}><span className="signal-name">{name}<b>{s.signalAlignment[i]}</b></span><input type="range" min={0} max={100} value={s.signalAlignment[i]} aria-label={`${name} alignment`} onChange={(e) => s.setSignal(i,Number(e.target.value))}/><small className={locked ? 'locked' : ''}>{locked ? 'LOCKED' : `target ≈${SIGNAL_TARGETS[i]}`}</small></label> })}</div></section>
    case 'incident-action':
      return <section className="panel panel-work"><span className="eyebrow">ROOT PATH FOUND · READINESS REGRESSION</span><h1>Choose the recovery move.</h1><p>{s.incidentAction ? incidentCopy[s.incidentAction] : 'The new revision fails readiness across the affected district. One of these restores service fastest — the other two make it worse.'}</p><div className="choice-grid">{(['restart','scale','rollback'] as IncidentAction[]).map((a) => <button key={a} onClick={() => { sfx(a === 'rollback' ? 'confirm' : 'deny'); s.chooseIncidentAction(a) }}>{a.toUpperCase()}</button>)}</div>{s.incidentAction && s.incidentAction !== 'rollback' && <div className="feedback">SYSTEM STILL DEGRADED · TRY ANOTHER PATH</div>}</section>
    case 'incident-recovered':
      return <Brief no="INCIDENT ZERO · RECOVERED" title="Reliability is designed." copy="The previous known-good revision is serving again and the error rate is falling. Nothing here was luck — it was a rollback path that existed before it was needed."><Next to="nexus-intro" label="ENTER PLATFORM NEXUS" /></Brief>
    case 'nexus-intro':
      return <Brief no="FINAL MISSION · PLATFORM NEXUS" title="Shipping is a system." copy="You used every tool individually. Now assemble the reusable path so the next engineer never has to repeat any of it."><Next to="nexus-build" label="BUILD THE GOLDEN PATH" /></Brief>
    case 'nexus-build':
      return <section className="panel panel-work"><span className="eyebrow">PIPELINE BUILDER · ORDERED ASSEMBLY</span><h1>Assemble the path.</h1><p>Select the modules in release order. One wrong move resets the machine, because a pipeline out of order is not a pipeline.</p><div className="seq-grid">{PIPELINE_ORDER.map((m,i) => <button key={m} className={s.pipelineSequence.includes(m) ? 'locked' : ''} onClick={() => { sfx(PIPELINE_ORDER[s.pipelineSequence.length] === m ? 'click' : 'deny'); s.addPipelineModule(m as PipelineModule) }}><span>{String(i+1).padStart(2,'0')}</span>{m}</button>)}</div><div className="seq-out">{s.pipelineSequence.join('  →  ')}</div><div className="row-end"><button className="text-link" onClick={s.clearPipeline}>RESET</button><button className="btn-primary" disabled={s.pipelineSequence.length !== PIPELINE_ORDER.length} onClick={() => { sfx('unlock'); s.completeNexus() }}>LOCK GOLDEN PATH</button></div></section>
    case 'reveal':
      return <section className="panel reveal"><span className="eyebrow">ARCHITECTURE SOURCE FOUND</span><h1>AKANSH MOWAR</h1><h2>DevOps · Platform · Cloud Engineer</h2><p>Every mission you just operated maps to something he does in production: reproducible builds, blocking security gates, immutable images, pipeline delivery, orchestration, traffic control, incident recovery and platform standardisation.</p><div className="reveal-actions"><button className="btn-primary" onClick={() => go('deck')}>OPEN RECRUITER DECK</button><button className="btn-ghost" onClick={() => go('arcade')}>PLAY THE ARCADE</button></div></section>
    default: return null
  }
}
