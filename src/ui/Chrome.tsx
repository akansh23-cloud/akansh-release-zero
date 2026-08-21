import { useEffect } from 'react'
import { useSystem, type QualityTier, totalAchievements } from '../state/system'
import { chapterIndex, MISSION_CHAPTERS, useMission } from '../state/mission'
import { setAmbient, sfx } from '../audio/engine'

const QUALITIES: QualityTier[] = ['ultra', 'high', 'medium', 'low']

export function TopBar() {
  const { route, go, menuOpen, setMenu, soundOn, setSound, quality, setQuality, setAutoQuality, autoQuality, achievements, setPalette } =
    useSystem()
  const completed = useMission((s) => s.completed)
  const reset = useMission((s) => s.reset)

  const toggleSound = () => {
    const next = !soundOn
    setSound(next)
    void setAmbient(next)
    if (next) sfx('confirm')
  }

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('.menu-panel') && !el.closest('[data-menu-toggle]')) setMenu(false)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menuOpen, setMenu])

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => go('gate')} aria-label="Back to entry">
          <span className="pulse-dot" />
          RELEASE//ZERO
          <small>· OPERATIONS THEATRE</small>
        </button>
        <div className="top-actions">
          <button className={`ghost-btn${route === 'deck' ? ' active' : ''}`} onClick={() => go('deck')}>
            RECRUITER
          </button>
          <button className={`ghost-btn${route === 'arcade' || route === 'play' ? ' active' : ''}`} onClick={() => go('arcade')}>
            ARCADE
          </button>
          <button className="ghost-btn" onClick={() => setPalette(true)} title="Command palette (K)">
            ⌘K
          </button>
          <button className="ghost-btn" onClick={toggleSound}>
            SOUND {soundOn ? 'ON' : 'OFF'}
          </button>
          <button className="ghost-btn" data-menu-toggle onClick={() => setMenu(!menuOpen)}>
            MENU
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="menu-panel">
          <button onClick={() => go('gate')}>
            ENTRY <span>HOME</span>
          </button>
          <button
            onClick={() => {
              reset()
              go('story')
            }}
          >
            {completed ? 'REPLAY STORY' : 'START STORY'} <span>8 MISSIONS</span>
          </button>
          <button onClick={() => go('deck')}>
            RECRUITER DECK <span>90 SEC</span>
          </button>
          <button onClick={() => go('arcade')}>
            ARCADE <span>4 GAMES</span>
          </button>
          <hr />
          <div className="menu-group">
            RENDER QUALITY {autoQuality ? '· AUTO' : '· MANUAL'}
          </div>
          <div className="quality-row">
            {QUALITIES.map((q) => (
              <button key={q} className={quality === q ? 'on' : ''} onClick={() => setQuality(q)}>
                {q.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={() => setAutoQuality(true)}>
            RE-ENABLE AUTO <span>ADAPTIVE</span>
          </button>
          <hr />
          <button onClick={() => go('arcade')}>
            ACHIEVEMENTS{' '}
            <span>
              {achievements.length} / {totalAchievements}
            </span>
          </button>
        </nav>
      )}
    </>
  )
}

export function Spine() {
  const stage = useMission((s) => s.stage)
  const idx = chapterIndex(stage)
  const done = stage === 'reveal'
  return (
    <nav className="spine" aria-label="Mission progress">
      {MISSION_CHAPTERS.map((c, i) => (
        <div
          key={c.key}
          className={`spine-node${done || i < idx ? ' done' : ''}${i === idx && !done ? ' current' : ''}`}
          aria-current={i === idx ? 'step' : undefined}
        >
          <i />
          <span>{c.label.toUpperCase()}</span>
        </div>
      ))}
    </nav>
  )
}

export function Telemetry() {
  const stage = useMission((s) => s.stage)
  const telemetry = useMission((s) => s.telemetry)
  const idx = chapterIndex(stage)
  const labels: Record<string, string> = {
    releaseHealth: 'RELEASE',
    security: 'SECURITY',
    reliability: 'RELIABILITY',
    delivery: 'DELIVERY',
  }
  const colors: Record<string, string> = {
    releaseHealth: 'var(--signal)',
    security: 'var(--amber)',
    reliability: 'var(--violet)',
    delivery: 'var(--verify)',
  }
  return (
    <aside className="telemetry" aria-label="Simulation telemetry">
      <div className="telemetry-head">
        <span>SIMULATION TELEMETRY</span>
        <b>{stage === 'reveal' ? 'COMPLETE' : `MISSION ${String(Math.max(0, idx) + 1).padStart(2, '0')}/08`}</b>
      </div>
      {Object.entries(telemetry).map(([k, v]) => (
        <div className="telemetry-row" key={k}>
          <span>{labels[k]}</span>
          <i>
            <em style={{ width: `${v}%`, background: colors[k] }} />
          </i>
          <b>{v}%</b>
        </div>
      ))}
    </aside>
  )
}

export function Ticker() {
  const log = useMission((s) => s.log)
  const last = log[log.length - 1]
  if (!last) return null
  return (
    <div className="ticker" aria-live="polite">
      <span className="ticker-label">EVENT LOG</span>
      <span className={`ticker-line ${last.level}`}>
        <b>{last.t}</b>
        {last.text}
      </span>
      <span className="ticker-right">SIMULATED · NOT EMPLOYMENT TELEMETRY</span>
    </div>
  )
}
