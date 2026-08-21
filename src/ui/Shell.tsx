import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSystem, totalAchievements } from '../state/system'
import { useMission } from '../state/mission'
import { useArcade, GAMES } from '../state/arcade'
import { profile } from '../data/profile'
import { sfx } from '../audio/engine'

/* ==================================================================
   Boot
   ================================================================== */

const BOOT_LINES = [
  'mounting renderer · webgl2',
  'compiling shaders · grid, holo, particles',
  'loading zone graph · 7 environments',
  'arming simulation telemetry',
  'operator console ready',
]

export function Boot() {
  const go = useSystem((s) => s.go)
  const bumpVisit = useSystem((s) => s.bumpVisit)
  const visits = useSystem((s) => s.visits)
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const finish = useCallback(() => {
    bumpVisit()
    go('gate')
  }, [go, bumpVisit])

  useEffect(() => {
    // Returning visitors get a much shorter runway.
    const pace = visits > 0 ? 200 : 480
    const stepper = window.setInterval(() => setStep((s) => Math.min(BOOT_LINES.length, s + 1)), pace)
    const bar = window.setInterval(() => setProgress((p) => Math.min(100, p + 100 / ((pace * BOOT_LINES.length) / 60))), 60)
    const done = window.setTimeout(finish, pace * BOOT_LINES.length + 320)
    return () => {
      window.clearInterval(stepper)
      window.clearInterval(bar)
      window.clearTimeout(done)
    }
  }, [finish, visits])

  useEffect(() => {
    const onKey = () => finish()
    window.addEventListener('keydown', onKey, { once: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  return (
    <div className="boot" role="status">
      <div className="boot-mark">
        RELEASE<em>//</em>ZERO
      </div>
      <div className="boot-lines">
        {BOOT_LINES.slice(0, step).map((l) => (
          <div key={l}>
            <b>ok</b> {l}
          </div>
        ))}
      </div>
      <div className="boot-bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <button className="ghost-btn boot-skip" onClick={finish}>
        SKIP →
      </button>
    </div>
  )
}

/* ==================================================================
   Entry gate
   ================================================================== */

const MODES = [
  {
    id: 'deck' as const,
    kicker: 'FASTEST · 90 SECONDS',
    title: 'Recruiter Deck',
    copy: 'Press play and watch a guided brief. Or interrogate the profile directly.',
    accent: 'var(--plasma)',
  },
  {
    id: 'story' as const,
    kicker: 'FLAGSHIP · 8 MISSIONS',
    title: 'Story Mode',
    copy: 'Operate one release from commit to production. Break it. Recover it.',
    accent: 'var(--signal)',
  },
  {
    id: 'arcade' as const,
    kicker: 'PLAYABLE · 4 GAMES',
    title: 'Arcade',
    copy: 'Endless runner, cluster defence, terminal triage, root-cause matrix.',
    accent: 'var(--violet)',
  },
]

export function Gate() {
  const go = useSystem((s) => s.go)
  const achievements = useSystem((s) => s.achievements)
  const soundOn = useSystem((s) => s.soundOn)
  const reset = useMission((s) => s.reset)
  const completed = useMission((s) => s.completed)
  const [selected, setSelected] = useState<(typeof MODES)[number]['id']>('deck')

  const enter = (id: (typeof MODES)[number]['id']) => {
    sfx('confirm')
    if (id === 'story') reset()
    go(id)
  }

  return (
    <main className="gate">
      <div className="eyebrow">THE SYSTEM IS LIVE. THE RELEASE IS NOT.</div>
      <h1>
        Operator <em>required.</em>
      </h1>
      <p>
        {profile.name} is a {profile.role.toLowerCase()} in {profile.location}. This is his portfolio, built as a working operations
        console. Pick how much of it you want.
      </p>

      <div className="gate-grid">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-card${selected === m.id ? ' selected' : ''}`}
            style={{ ['--accent' as string]: m.accent }}
            onMouseEnter={() => {
              setSelected(m.id)
              if (soundOn) sfx('hover')
            }}
            onFocus={() => setSelected(m.id)}
            onClick={() => enter(m.id)}
          >
            <small>{m.kicker}</small>
            <strong>{m.title}</strong>
            <span>{m.copy}</span>
          </button>
        ))}
      </div>

      <div className="gate-foot">
        <button className="btn-primary" onClick={() => enter(selected)}>
          ENTER {MODES.find((m) => m.id === selected)!.title.toUpperCase()}
        </button>
        <span className="mono">
          {achievements.length}/{totalAchievements} ACHIEVEMENTS
          {completed ? ' · CAMPAIGN COMPLETE' : ''}
        </span>
      </div>
    </main>
  )
}

/* ==================================================================
   Toasts
   ================================================================== */

export function Toasts() {
  const toasts = useSystem((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <i aria-hidden>{t.glyph}</i>
          <div>
            <span className="mono">{t.tone === 'unlock' ? 'ACHIEVEMENT UNLOCKED' : 'SYSTEM'}</span>
            <b>{t.title}</b>
            <span>{t.body}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ==================================================================
   Command palette
   ================================================================== */

interface Command {
  label: string
  hint: string
  run: () => void
}

export function CommandPalette() {
  const { paletteOpen, setPalette, go, setSound, soundOn } = useSystem()
  const reset = useMission((s) => s.reset)
  const launch = useArcade((s) => s.launch)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const commands: Command[] = useMemo(
    () => [
      { label: 'Open recruiter deck', hint: 'DECK', run: () => go('deck') },
      { label: 'Start story mode', hint: 'STORY', run: () => { reset(); go('story') } },
      { label: 'Open arcade', hint: 'ARCADE', run: () => go('arcade') },
      ...GAMES.map((g) => ({
        label: `Play ${g.title}`,
        hint: 'GAME',
        run: () => {
          launch(g.id)
          go('play')
        },
      })),
      { label: 'Download resume', hint: 'PDF', run: () => window.open(profile.links.resume, '_blank') },
      { label: 'Email Akansh', hint: 'MAIL', run: () => { window.location.href = profile.links.email } },
      { label: 'Open GitHub', hint: 'LINK', run: () => window.open(profile.links.github, '_blank') },
      { label: 'Open LinkedIn', hint: 'LINK', run: () => window.open(profile.links.linkedin, '_blank') },
      { label: soundOn ? 'Mute audio' : 'Enable audio', hint: 'AUDIO', run: () => setSound(!soundOn) },
      { label: 'Back to entry', hint: 'HOME', run: () => go('gate') },
    ],
    [go, reset, launch, setSound, soundOn],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT'
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === 'k' && !typing && !paletteOpen)) {
        e.preventDefault()
        setPalette(true)
      }
      if (e.key === 'Escape' && paletteOpen) setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen, setPalette])

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setCursor(0)
    }
  }, [paletteOpen])

  if (!paletteOpen) return null

  const exec = (c: Command) => {
    sfx('click')
    setPalette(false)
    c.run()
  }

  return (
    <div className="palette-scrim" onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <input
          autoFocus
          value={query}
          placeholder="jump to anything…"
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(filtered.length - 1, c + 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(0, c - 1))
            }
            if (e.key === 'Enter' && filtered[cursor]) exec(filtered[cursor])
          }}
        />
        <ul>
          {filtered.map((c, i) => (
            <li key={c.label}>
              <button className={i === cursor ? 'on' : ''} onMouseEnter={() => setCursor(i)} onClick={() => exec(c)}>
                {c.label}
                <span>{c.hint}</span>
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li>
              <button disabled>no match</button>
            </li>
          )}
        </ul>
        <div className="palette-foot">↑↓ navigate · ENTER run · ESC close</div>
      </div>
    </div>
  )
}
