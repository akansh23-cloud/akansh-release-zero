import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameId = 'runner' | 'defense' | 'terminal' | 'matrix'

export interface GameMeta {
  id: GameId
  title: string
  kicker: string
  blurb: string
  /** what the game is secretly testing */
  teaches: string
  controls: string
  duration: string
  accent: string
  scoreUnit: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'runner',
    title: 'Pipeline Runner',
    kicker: 'REFLEX · ENDLESS',
    blurb: 'Pilot a release capsule down the deployment tunnel. Dodge failed stages, collect passing gates, hold the line as the tunnel accelerates.',
    teaches: 'Throughput under pressure. Every red gate is a broken build you did not catch.',
    controls: 'A / D or ← → to switch lane · W or Space to jump · S to duck · swipe on touch',
    duration: '2–4 min',
    accent: '#ff5a3c',
    scoreUnit: 'm',
  },
  {
    id: 'defense',
    title: 'Cluster Defense',
    kicker: 'STRATEGY · WAVES',
    blurb: 'A live cluster under attack. Pods fail, load spikes, secrets expire. Read each symptom and apply the right remediation before availability drains away.',
    teaches: 'Triage discipline. The wrong remediation costs more than doing nothing.',
    controls: 'Click a failing pod, then pick the remediation · number keys 1–3 for fast actions',
    duration: '3–6 min',
    accent: '#5ce1ff',
    scoreUnit: 'pts',
  },
  {
    id: 'terminal',
    title: 'Incident Command',
    kicker: 'KNOWLEDGE · TIMED',
    blurb: 'A production incident with a clock on it. Read the alert, type the command that actually helps. No autocomplete, no mouse.',
    teaches: 'Command muscle memory. During an incident you do not get to look things up.',
    controls: 'Keyboard only · Enter to execute · Tab for a hint (costs points)',
    duration: '2–3 min',
    accent: '#4dffa0',
    scoreUnit: 'pts',
  },
  {
    id: 'matrix',
    title: 'Root Cause Matrix',
    kicker: 'MEMORY · LOGIC',
    blurb: 'Twelve nodes, six symptom-to-cause pairings, one clock. Correlate the signal to the failure before the window closes.',
    teaches: 'Correlation under time pressure — the actual skill behind good incident response.',
    controls: 'Click nodes to reveal · match a symptom to its cause',
    duration: '1–2 min',
    accent: '#a682ff',
    scoreUnit: 'pts',
  },
]

export interface ScoreRecord {
  best: number
  runs: number
  lastPlayed: number
}

interface ArcadeState {
  activeGame: GameId | null
  scores: Record<GameId, ScoreRecord>
  launch: (id: GameId) => void
  quit: () => void
  submit: (id: GameId, score: number) => { best: boolean; previous: number }
}

const emptyScores: Record<GameId, ScoreRecord> = {
  runner: { best: 0, runs: 0, lastPlayed: 0 },
  defense: { best: 0, runs: 0, lastPlayed: 0 },
  terminal: { best: 0, runs: 0, lastPlayed: 0 },
  matrix: { best: 0, runs: 0, lastPlayed: 0 },
}

export const useArcade = create<ArcadeState>()(
  persist(
    (set, get) => ({
      activeGame: null,
      scores: emptyScores,
      launch: (id) => set({ activeGame: id }),
      quit: () => set({ activeGame: null }),
      submit: (id, score) => {
        const prev = get().scores[id] ?? { best: 0, runs: 0, lastPlayed: 0 }
        const isBest = score > prev.best
        set({
          scores: {
            ...get().scores,
            [id]: { best: Math.max(prev.best, score), runs: prev.runs + 1, lastPlayed: Date.now() },
          },
        })
        return { best: isBest, previous: prev.best }
      },
    }),
    {
      name: 'release-zero-arcade-v1',
      partialize: (s) => ({ scores: s.scores }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ArcadeState> | undefined
        return { ...current, ...p, scores: { ...emptyScores, ...(p?.scores ?? {}) } }
      },
    },
  ),
)

export function gameMeta(id: GameId) {
  return GAMES.find((g) => g.id === id)!
}
