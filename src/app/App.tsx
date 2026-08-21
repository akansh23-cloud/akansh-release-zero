import { lazy, Suspense, useEffect, useState } from 'react'
import World from '../world/World'
import { Spine, Telemetry, Ticker, TopBar } from '../ui/Chrome'
import { Boot, CommandPalette, Gate, Toasts } from '../ui/Shell'
import Story from '../ui/Story'
import Arcade from '../ui/Arcade'
import { useSystem } from '../state/system'
import { useArcade } from '../state/arcade'
import { profile, skills } from '../data/profile'

const CommandDeck = lazy(() => import('../recruiter/CommandDeck'))
const PipelineRunner = lazy(() => import('../games/runner/PipelineRunner'))
const ClusterDefense = lazy(() => import('../games/defense/ClusterDefense'))
const IncidentCommand = lazy(() => import('../games/terminal/IncidentCommand'))
const RootCauseMatrix = lazy(() => import('../games/rootcause/RootCauseMatrix'))

function supportsWebGL2() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

/** Everything that matters, with no renderer at all. */
function Fallback() {
  return (
    <main className="fallback">
      <span className="eyebrow">RELEASE//ZERO · TEXT MODE</span>
      <h1>{profile.name}</h1>
      <h2>
        {profile.role} · {profile.location}
      </h2>
      <p>{profile.summary}</p>
      <p style={{ marginTop: 18 }}>
        The interactive version of this portfolio needs WebGL2, which this browser has not made available. Everything essential is below.
      </p>

      {profile.experience.map((e) => (
        <section key={e.company} style={{ marginTop: 30 }}>
          <span className="eyebrow">
            {e.role} · {e.company} · {e.period}
          </span>
          <ul style={{ paddingLeft: 18, marginTop: 12 }}>
            {e.bullets.map((b) => (
              <li key={b} style={{ color: 'var(--steel)', lineHeight: 1.66, marginBottom: 8 }}>
                {b}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section style={{ marginTop: 30 }}>
        <span className="eyebrow">STACK</span>
        <div className="stack-cloud" style={{ marginTop: 12 }}>
          {skills.map((s) => (
            <span key={s.id}>{s.name}</span>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <span className="eyebrow">CERTIFICATIONS</span>
        <ul style={{ paddingLeft: 18, marginTop: 12 }}>
          {profile.certifications.map((c) => (
            <li key={c} style={{ color: 'var(--steel)', lineHeight: 1.66 }}>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <nav>
        <a href={profile.links.resume}>RESUME</a>
        <a href={profile.links.linkedin}>LINKEDIN</a>
        <a href={profile.links.github}>GITHUB</a>
        <a href={profile.links.email}>EMAIL</a>
      </nav>
    </main>
  )
}

function ActiveGame() {
  const activeGame = useArcade((s) => s.activeGame)
  switch (activeGame) {
    case 'runner':
      return <PipelineRunner />
    case 'defense':
      return <ClusterDefense />
    case 'terminal':
      return <IncidentCommand />
    case 'matrix':
      return <RootCauseMatrix />
    default:
      return <Arcade />
  }
}

export default function App() {
  const [webgl, setWebgl] = useState(true)
  const route = useSystem((s) => s.route)
  const setReducedMotion = useSystem((s) => s.setReducedMotion)
  const setQuality = useSystem((s) => s.setQuality)

  useEffect(() => {
    setWebgl(supportsWebGL2())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReducedMotion(true)
      setQuality('low')
    }
    // Small screens start one tier down; the monitor can promote later.
    if (window.innerWidth < 760 && !mq.matches) setQuality('medium')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!webgl) return <Fallback />

  // The world canvas is unmounted while a game runs so the GPU only ever
  // drives one scene at a time.
  const worldVisible = route !== 'play'
  const showChrome = route !== 'boot' && route !== 'play'
  const storyChrome = route === 'story'

  return (
    <div className="app-shell">
      {worldVisible && <World />}
      {worldVisible && <div className="vignette" aria-hidden />}

      {showChrome && (
        <div className="chrome">
          <TopBar />
          {storyChrome && (
            <>
              <Spine />
              <Telemetry />
              <Ticker />
            </>
          )}
        </div>
      )}

      {route === 'boot' && <Boot />}
      {route === 'gate' && <Gate />}
      {route === 'story' && <Story />}
      {route === 'arcade' && <Arcade />}
      {route === 'deck' && (
        <Suspense fallback={<div className="deck" />}>
          <CommandDeck />
        </Suspense>
      )}
      {route === 'play' && (
        <Suspense fallback={<div className="game-shell" />}>
          <ActiveGame />
        </Suspense>
      )}

      <Toasts />
      <CommandPalette />
    </div>
  )
}
