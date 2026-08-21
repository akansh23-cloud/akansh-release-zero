import { ACHIEVEMENTS, totalAchievements, useSystem } from '../state/system'
import { GAMES, useArcade } from '../state/arcade'
import { sfx } from '../audio/engine'
import { formatScore } from '../lib/utils'

export default function Arcade() {
  const go = useSystem((s) => s.go)
  const unlocked = useSystem((s) => s.achievements)
  const launch = useArcade((s) => s.launch)
  const scores = useArcade((s) => s.scores)

  const totalRuns = Object.values(scores).reduce((n, s) => n + s.runs, 0)

  const play = (id: (typeof GAMES)[number]['id']) => {
    sfx('launch')
    launch(id)
    go('play')
  }

  return (
    <main className="arcade">
      <div className="arcade-inner">
        <header className="arcade-head">
          <div>
            <span className="eyebrow">FOUR SIMULATIONS · ONE RENDERER</span>
            <h1>The arcade.</h1>
            <p>
              Each of these is a real game, and each one is secretly an interview question. They were built on the same Three.js renderer
              driving the rest of this site.
            </p>
          </div>
          <div className="arcade-stat">
            <b>{totalRuns}</b>
            RUNS LOGGED
          </div>
        </header>

        <div className="game-grid">
          {GAMES.map((g) => (
            <button key={g.id} className="game-card" style={{ ['--accent' as string]: g.accent }} onClick={() => play(g.id)}>
              <span className="eyebrow">{g.kicker}</span>
              <h3>{g.title}</h3>
              <p>{g.blurb}</p>
              <p className="game-teach">{g.teaches}</p>
              <div className="game-card-foot">
                <span>{g.controls}</span>
                <b>
                  {scores[g.id]?.best ? `BEST ${formatScore(scores[g.id].best)}${g.scoreUnit}` : `PLAY · ${g.duration}`}
                </b>
              </div>
            </button>
          ))}
        </div>

        <section className="achievements">
          <h2>Achievements</h2>
          <p>
            {unlocked.length} OF {totalAchievements} UNLOCKED
          </p>
          <div className="ach-grid">
            {ACHIEVEMENTS.map((a) => {
              const on = unlocked.includes(a.id)
              return (
                <div className={`ach${on ? ' on' : ''}`} key={a.id}>
                  <i aria-hidden>{on ? a.glyph : '·'}</i>
                  <div>
                    <b>{on ? a.name : 'Locked'}</b>
                    <span>{a.hint}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
