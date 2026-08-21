import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Route = 'boot' | 'gate' | 'story' | 'deck' | 'arcade' | 'play'
export type QualityTier = 'ultra' | 'high' | 'medium' | 'low'

export interface Achievement {
  id: string
  name: string
  hint: string
  glyph: string
  track: 'story' | 'arcade' | 'explore'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-fix', name: 'Root Caused', hint: 'Diagnose the build failure correctly on the forge floor.', glyph: '⌥', track: 'story' },
  { id: 'shift-left', name: 'Shift Left', hint: 'Isolate the vulnerable fragment inside the security airlock.', glyph: '⌘', track: 'story' },
  { id: 'sealed-image', name: 'Immutable', hint: 'Inspect every image layer before sealing the release capsule.', glyph: '◉', track: 'story' },
  { id: 'release-rider', name: 'Release Rider', hint: 'Ride the release rail at full speed.', glyph: '⇢', track: 'story' },
  { id: 'traffic-controller', name: 'Traffic Controller', hint: 'Shift live traffic to the new release without dropping the path.', glyph: '⇄', track: 'story' },
  { id: 'incident-zero', name: 'Incident Zero', hint: 'Recover production with the fastest safe move.', glyph: '⚠', track: 'story' },
  { id: 'golden-path', name: 'Golden Path', hint: 'Assemble the full delivery pipeline in the correct order.', glyph: '★', track: 'story' },
  { id: 'runner-1k', name: 'Thousand Metre', hint: 'Survive 1000m in Pipeline Runner.', glyph: '▲', track: 'arcade' },
  { id: 'runner-flawless', name: 'Zero Regression', hint: 'Clear 600m in Pipeline Runner without taking damage.', glyph: '◆', track: 'arcade' },
  { id: 'defense-wave5', name: 'Held The Line', hint: 'Survive five waves of Cluster Defense.', glyph: '⬢', track: 'arcade' },
  { id: 'defense-perfect', name: 'Five Nines', hint: 'Finish a Cluster Defense wave with availability above 99%.', glyph: '⬣', track: 'arcade' },
  { id: 'terminal-ace', name: 'Muscle Memory', hint: 'Clear an Incident Command drill with no mistyped commands.', glyph: '❯', track: 'arcade' },
  { id: 'matrix-clear', name: 'Correlated', hint: 'Clear the Root Cause Matrix before the clock runs out.', glyph: '◈', track: 'arcade' },
  { id: 'brief-watched', name: 'Ninety Seconds', hint: 'Watch the recruiter auto-brief all the way through.', glyph: '▶', track: 'explore' },
  { id: 'asked', name: 'Interviewer', hint: 'Ask the profile console a question.', glyph: '?', track: 'explore' },
  { id: 'fit-checked', name: 'Role Fit', hint: 'Run a fit check against a role archetype.', glyph: '≈', track: 'explore' },
  { id: 'constellation', name: 'Cartographer', hint: 'Open a node in the skill constellation.', glyph: '✦', track: 'explore' },
]

export interface Toast {
  id: number
  title: string
  body: string
  glyph: string
  tone: 'unlock' | 'info' | 'warn'
}

interface SystemState {
  route: Route
  previousRoute: Route
  quality: QualityTier
  autoQuality: boolean
  soundOn: boolean
  reducedMotion: boolean
  bootProgress: number
  paletteOpen: boolean
  menuOpen: boolean
  achievements: string[]
  toasts: Toast[]
  visits: number

  go: (route: Route) => void
  setQuality: (q: QualityTier) => void
  degrade: () => void
  setAutoQuality: (on: boolean) => void
  setSound: (on: boolean) => void
  setReducedMotion: (on: boolean) => void
  setBootProgress: (n: number) => void
  setPalette: (open: boolean) => void
  setMenu: (open: boolean) => void
  unlock: (id: string) => void
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  bumpVisit: () => void
}

let toastSeq = 0

export const useSystem = create<SystemState>()(
  persist(
    (set, get) => ({
      route: 'boot',
      previousRoute: 'gate',
      quality: 'high',
      autoQuality: true,
      soundOn: false,
      reducedMotion: false,
      bootProgress: 0,
      paletteOpen: false,
      menuOpen: false,
      achievements: [],
      toasts: [],
      visits: 0,

      go: (route) => set({ previousRoute: get().route, route, menuOpen: false, paletteOpen: false }),
      setQuality: (quality) => set({ quality, autoQuality: false }),
      degrade: () => {
        if (!get().autoQuality) return
        const order: QualityTier[] = ['ultra', 'high', 'medium', 'low']
        const i = order.indexOf(get().quality)
        if (i < order.length - 1) set({ quality: order[i + 1] })
      },
      setAutoQuality: (autoQuality) => set({ autoQuality }),
      setSound: (soundOn) => set({ soundOn }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setBootProgress: (bootProgress) => set({ bootProgress }),
      setPalette: (paletteOpen) => set({ paletteOpen }),
      setMenu: (menuOpen) => set({ menuOpen }),

      unlock: (id) => {
        const { achievements } = get()
        if (achievements.includes(id)) return
        const meta = ACHIEVEMENTS.find((a) => a.id === id)
        set({ achievements: [...achievements, id] })
        if (meta) get().pushToast({ title: meta.name, body: meta.hint, glyph: meta.glyph, tone: 'unlock' })
      },

      pushToast: (t) => {
        const id = ++toastSeq
        set({ toasts: [...get().toasts, { ...t, id }] })
        setTimeout(() => get().dismissToast(id), 5200)
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      bumpVisit: () => set({ visits: get().visits + 1 }),
    }),
    {
      name: 'release-zero-system-v1',
      partialize: (s) => ({
        quality: s.quality,
        autoQuality: s.autoQuality,
        soundOn: s.soundOn,
        achievements: s.achievements,
        visits: s.visits,
      }),
    },
  ),
)

export const totalAchievements = ACHIEVEMENTS.length
