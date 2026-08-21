import { create } from 'zustand'
import { useSystem } from './system'

export type Fault = 'dependency' | 'test' | 'config'
export type IncidentAction = 'restart' | 'scale' | 'rollback'

export type Stage =
  | 'cold-start'
  | 'forge-intro'
  | 'forge-diagnose'
  | 'forge-success'
  | 'security-intro'
  | 'security-scan'
  | 'security-success'
  | 'image-intro'
  | 'image-inspect'
  | 'image-sealed'
  | 'rail-intro'
  | 'rail-run'
  | 'cluster-intro'
  | 'cluster-rollout'
  | 'traffic-bridge'
  | 'incident-intro'
  | 'incident-diagnose'
  | 'incident-action'
  | 'incident-recovered'
  | 'nexus-intro'
  | 'nexus-build'
  | 'reveal'

export interface Telemetry {
  releaseHealth: number
  security: number
  reliability: number
  delivery: number
}

export interface LogLine {
  id: number
  t: string
  level: 'ok' | 'warn' | 'err' | 'info'
  text: string
}

export const PIPELINE_ORDER = ['SOURCE', 'BUILD', 'TEST', 'SECURITY', 'PACKAGE', 'DEPLOY', 'VERIFY'] as const
export type PipelineModule = (typeof PIPELINE_ORDER)[number]

export const MISSION_CHAPTERS = [
  { key: 'forge', label: 'Build Forge' },
  { key: 'security', label: 'Security Airlock' },
  { key: 'image', label: 'Image Foundry' },
  { key: 'rail', label: 'Release Rail' },
  { key: 'cluster', label: 'Cluster City' },
  { key: 'traffic', label: 'Traffic Bridge' },
  { key: 'incident', label: 'Incident Zero' },
  { key: 'nexus', label: 'Platform Nexus' },
] as const

const initialTelemetry: Telemetry = { releaseHealth: 38, security: 12, reliability: 44, delivery: 4 }

let logSeq = 0
function stamp() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

interface MissionState {
  stage: Stage
  selectedFault: Fault | null
  securityIsolated: boolean
  openedLayers: string[]
  trafficShift: number
  signalAlignment: [number, number, number]
  incidentAction: IncidentAction | null
  pipelineSequence: PipelineModule[]
  telemetry: Telemetry
  completed: boolean
  log: LogLine[]

  advance: (stage: Stage) => void
  say: (level: LogLine['level'], text: string) => void
  setFault: (fault: Fault) => void
  isolateSecurity: () => void
  toggleLayer: (layer: string) => void
  sealImage: () => void
  startRail: () => void
  startRollout: () => void
  setTrafficShift: (v: number) => void
  commitTraffic: () => void
  setSignal: (index: number, value: number) => void
  chooseIncidentAction: (action: IncidentAction) => void
  addPipelineModule: (m: PipelineModule) => void
  clearPipeline: () => void
  completeNexus: () => void
  reset: () => void
}

export const SIGNAL_TARGETS: [number, number, number] = [68, 34, 82]

export const useMission = create<MissionState>()((set, get) => ({
  stage: 'cold-start',
  selectedFault: null,
  securityIsolated: false,
  openedLayers: [],
  trafficShift: 0,
  signalAlignment: [0, 0, 0],
  incidentAction: null,
  pipelineSequence: [],
  telemetry: initialTelemetry,
  completed: false,
  log: [{ id: ++logSeq, t: stamp(), level: 'warn', text: 'operator session opened · release candidate held' }],

  say: (level, text) => {
    const next = [...get().log, { id: ++logSeq, t: stamp(), level, text }]
    set({ log: next.slice(-40) })
  },

  advance: (stage) => set({ stage }),

  setFault: (fault) => {
    if (fault === 'config') {
      set({
        selectedFault: fault,
        stage: 'forge-success',
        telemetry: { ...get().telemetry, releaseHealth: 64, delivery: 15 },
      })
      get().say('ok', 'config drift isolated · canonical values restored')
      useSystem.getState().unlock('first-fix')
    } else {
      set({ selectedFault: fault })
      get().say('err', `${fault} path clean · fault still active`)
    }
  },

  isolateSecurity: () => {
    if (get().securityIsolated) return
    set({
      securityIsolated: true,
      stage: 'security-success',
      telemetry: { ...get().telemetry, security: 76, releaseHealth: 71, delivery: 27 },
    })
    get().say('ok', 'vulnerable fragment quarantined before promotion')
    useSystem.getState().unlock('shift-left')
  },

  toggleLayer: (layer) => {
    const cur = get().openedLayers
    const next = cur.includes(layer) ? cur.filter((x) => x !== layer) : [...cur, layer]
    set({ openedLayers: next })
    if (!cur.includes(layer)) get().say('info', `layer ${layer.toLowerCase()} inspected`)
  },

  sealImage: () => {
    if (get().openedLayers.length < 4) return
    set({ stage: 'image-sealed', telemetry: { ...get().telemetry, releaseHealth: 78, delivery: 39 } })
    get().say('ok', 'image sealed · digest pinned · promotion unlocked')
    useSystem.getState().unlock('sealed-image')
  },

  startRail: () => {
    set({ stage: 'rail-run', telemetry: { ...get().telemetry, delivery: 49 } })
    get().say('info', 'release rail armed · five stages executing')
    useSystem.getState().unlock('release-rider')
  },

  startRollout: () => {
    set({ stage: 'cluster-rollout', telemetry: { ...get().telemetry, reliability: 61, delivery: 67 } })
    get().say('info', 'rolling deployment started · namespace payments')
  },

  setTrafficShift: (v) => {
    const value = Math.max(0, Math.min(100, Math.round(v)))
    set({ trafficShift: value })
    if (value >= 80) set({ telemetry: { ...get().telemetry, reliability: 77, delivery: 76 } })
  },

  commitTraffic: () => {
    if (get().trafficShift < 80) return
    set({ stage: 'incident-intro' })
    get().say('ok', `route committed · ${get().trafficShift}% on new release`)
    useSystem.getState().unlock('traffic-controller')
  },

  setSignal: (index, value) => {
    const next = [...get().signalAlignment] as [number, number, number]
    next[index] = value
    set({ signalAlignment: next })
    const aligned = next.every((v, i) => Math.abs(v - SIGNAL_TARGETS[i]) <= 6)
    if (aligned && get().stage === 'incident-diagnose') {
      set({ stage: 'incident-action' })
      get().say('warn', 'signals correlated · readiness regression in new revision')
    }
  },

  chooseIncidentAction: (action) => {
    set({ incidentAction: action })
    if (action === 'rollback') {
      set({
        stage: 'incident-recovered',
        telemetry: { releaseHealth: 92, security: 88, reliability: 91, delivery: 88 },
      })
      get().say('ok', 'previous known-good revision restored · error rate falling')
      useSystem.getState().unlock('incident-zero')
    } else {
      get().say('err', `${action} applied · district still degraded`)
    }
  },

  addPipelineModule: (m) => {
    const seq = get().pipelineSequence
    if (seq.includes(m)) return
    const expected = PIPELINE_ORDER[seq.length]
    if (m === expected) {
      set({ pipelineSequence: [...seq, m] })
      get().say('ok', `module ${m.toLowerCase()} locked into path`)
    } else {
      set({ pipelineSequence: [] })
      get().say('err', `${m.toLowerCase()} out of order · path reset`)
    }
  },

  clearPipeline: () => set({ pipelineSequence: [] }),

  completeNexus: () => {
    if (get().pipelineSequence.length !== PIPELINE_ORDER.length) return
    set({
      stage: 'reveal',
      completed: true,
      telemetry: { releaseHealth: 100, security: 94, reliability: 96, delivery: 100 },
    })
    get().say('ok', 'golden path sealed · delivery is now repeatable')
    useSystem.getState().unlock('golden-path')
  },

  reset: () =>
    set({
      stage: 'cold-start',
      selectedFault: null,
      securityIsolated: false,
      openedLayers: [],
      trafficShift: 0,
      signalAlignment: [0, 0, 0],
      incidentAction: null,
      pipelineSequence: [],
      telemetry: initialTelemetry,
      log: [{ id: ++logSeq, t: stamp(), level: 'warn', text: 'operator session reopened · release candidate held' }],
    }),
}))

export function chapterIndex(stage: Stage) {
  return MISSION_CHAPTERS.findIndex((c) => stage.startsWith(c.key))
}
