import { useEffect, useState, type ReactNode } from 'react'
import { gameMeta, useArcade, type GameId } from '../state/arcade'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'
import { formatScore } from '../lib/utils'

export interface GameResult {
  score: number
  lines: { label: string; value: string }[]
  verdict: string
}

export function GameShell({
  id,
  hud,
  children,
  result,
  onRestart,
  paused,
  onTogglePause,
}: {
  id: GameId
  hud?: ReactNode
  children: ReactNode
  result: GameResult | null
  onRestart: () => void
  paused?: boolean
  onTogglePause?: () => void
}) {
  const meta = gameMeta(id)
  const quit = useArcade((s) => s.quit)
  const submit = useArcade((s) => s.submit)
  const scores = useArcade((s) => s.scores)
  const go = useSystem((s) => s.go)
  const [outcome, setOutcome] = useState<{ best: boolean; previous: number } | null>(null)

  useEffect(() => {
    if (result && !outcome) {
      setOutcome(submit(id, result.score))
      sfx(result.score > 0 ? 'unlock' : 'deny')
    }
  }, [result, outcome, submit, id])

  const leave = () => {
    quit()
    go('arcade')
  }

  const restart = () => {
    setOutcome(null)
    onRestart()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game-shell" style={{ ['--game' as string]: meta.accent }}>
      <div className="game-stage">{children}</div>

      <header className="game-bar">
        <button className="ghost-btn" onClick={leave}>
          ← ARCADE
        </button>
        <span className="game-title">{meta.title}</span>
        <div className="game-bar-right">
          {onTogglePause && (
            <button className="ghost-btn" onClick={onTogglePause}>
              {paused ? 'RESUME' : 'PAUSE'}
            </button>
          )}
          <span className="game-best">BEST {formatScore(scores[id]?.best ?? 0)}{meta.scoreUnit}</span>
        </div>
      </header>

      {hud && !result && <div className="game-hud">{hud}</div>}

      {result && (
        <div className="game-over" role="dialog" aria-label="Run complete">
          <div className="game-over-card">
            <span className="eyebrow" style={{ color: meta.accent }}>
              {meta.kicker} · RUN COMPLETE
            </span>
            <h2>{result.verdict}</h2>
            <div className="result-score">
              <b>{formatScore(result.score)}</b>
              <small>{meta.scoreUnit.toUpperCase()}</small>
            </div>
            {outcome?.best && result.score > 0 && <div className="new-best">NEW PERSONAL BEST · PREVIOUS {formatScore(outcome.previous)}</div>}
            <dl className="result-lines">
              {result.lines.map((l) => (
                <div key={l.label}>
                  <dt>{l.label}</dt>
                  <dd>{l.value}</dd>
                </div>
              ))}
            </dl>
            <p className="result-teach">{meta.teaches}</p>
            <div className="result-actions">
              <button className="btn-primary" onClick={restart}>
                RUN AGAIN
              </button>
              <button className="btn-ghost" onClick={leave}>
                BACK TO ARCADE
              </button>
            </div>
          </div>
        </div>
      )}

      {paused && !result && (
        <div className="game-over">
          <div className="game-over-card small">
            <span className="eyebrow">PAUSED</span>
            <h2>Holding.</h2>
            <p className="result-teach">{meta.controls}</p>
            <div className="result-actions">
              <button className="btn-primary" onClick={onTogglePause}>
                RESUME
              </button>
              <button className="btn-ghost" onClick={leave}>
                QUIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
