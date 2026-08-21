import { useCallback, useEffect, useRef, useState } from 'react'
import { briefScript } from '../data/profile'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'

const DURATION = briefScript[briefScript.length - 1].at

export default function AutoBrief() {
  const unlock = useSystem((s) => s.unlock)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [typed, setTyped] = useState('')
  const raf = useRef(0)
  const last = useRef(0)
  const finished = useRef(false)
  const clock = useRef(0)
  clock.current = time

  const beatIndex = Math.max(
    0,
    briefScript.findIndex((b, i) => time >= b.at && (i === briefScript.length - 1 || time < briefScript[i + 1].at)),
  )
  const beat = briefScript[beatIndex]

  /* clock */
  useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    const tick = (now: number) => {
      const dt = ((now - last.current) / 1000) * rate
      last.current = now
      const next = clock.current + dt
      if (next >= DURATION) {
        clock.current = DURATION
        setTime(DURATION)
        setPlaying(false)
        if (!finished.current) {
          finished.current = true
          unlock('brief-watched')
        }
        return
      }
      clock.current = next
      setTime(next)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, rate, unlock])

  /* typewriter for the current beat */
  useEffect(() => {
    const line = beat.line
    const elapsedInBeat = time - beat.at
    const chars = Math.round(Math.min(line.length, (elapsedInBeat / 1.9) * line.length))
    setTyped(line.slice(0, Math.max(0, chars)))
  }, [time, beat])

  const toggle = useCallback(() => {
    sfx('click')
    if (clock.current >= DURATION) {
      clock.current = 0
      setTime(0)
      finished.current = false
    }
    setPlaying((p) => !p)
  }, [])

  const seek = (t: number) => {
    clock.current = t
    setTime(t)
    setPlaying(true)
  }

  const progress = (time / DURATION) * 100

  return (
    <div className="brief">
      <div className="brief-main">
        <span className="brief-cue">{beat.cue}</span>
        <p className="brief-line">
          {typed}
          {playing && typed.length < beat.line.length && <i>▌</i>}
        </p>

        <div className="brief-track">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="brief-controls">
          <button className="btn-primary" onClick={toggle}>
            {playing ? '❚❚ PAUSE' : time >= DURATION ? '↻ REPLAY BRIEF' : '▶ PLAY 71-SECOND BRIEF'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              sfx('click')
              setRate(rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1)
            }}
          >
            {rate}× SPEED
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              clock.current = 0
              setTime(0)
              setPlaying(false)
            }}
          >
            RESET
          </button>
          <span className="brief-time">
            {String(Math.floor(time)).padStart(2, '0')}s / {DURATION}s
          </span>
        </div>
      </div>

      <div className="brief-beats">
        {briefScript.map((b, i) => (
          <button
            key={b.cue}
            className={`brief-beat${i === beatIndex ? ' on' : i < beatIndex ? ' past' : ''}`}
            onClick={() => seek(b.at)}
          >
            <span>{String(b.at).padStart(2, '0')}s</span>
            <span>{b.cue}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
