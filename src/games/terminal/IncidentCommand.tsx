import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameShell, type GameResult } from '../GameShell'
import { useSystem } from '../../state/system'
import { sfx } from '../../audio/engine'
import { clamp, formatScore, scrollToBottom } from '../../lib/utils'

interface Drill {
  id: string
  alert: string
  context: string
  /** the canonical answer, plus any accepted equivalents */
  answers: string[]
  hint: string
  teach: string
}

const DRILLS: Drill[] = [
  {
    id: 'logs',
    alert: 'checkout-api restarted 4 times in 3 minutes',
    context: 'You need the output from the container that died, not the one running now.',
    answers: ['kubectl logs checkout-api --previous', 'kubectl logs checkout-api -p'],
    hint: 'kubectl logs <pod> --previous',
    teach: 'The --previous flag reads the terminated container. Without it you get the healthy restart and learn nothing.',
  },
  {
    id: 'rollback',
    alert: 'error rate spiked immediately after a deploy',
    context: 'The previous revision was healthy. Get back to it before you start investigating.',
    answers: ['kubectl rollout undo deployment/checkout-api', 'kubectl rollout undo deploy/checkout-api'],
    hint: 'kubectl rollout undo deployment/<name>',
    teach: 'Restore first, diagnose second. A rollback stops the customer-impact clock.',
  },
  {
    id: 'scale',
    alert: 'all replicas healthy, p99 latency at 4.2s under load',
    context: 'Nothing is broken. There is simply not enough of it.',
    answers: ['kubectl scale deployment/checkout-api --replicas=6', 'kubectl scale deploy/checkout-api --replicas=6'],
    hint: 'kubectl scale deployment/<name> --replicas=6',
    teach: 'Healthy but saturated is a capacity problem. Restarting would drop the replicas you still have.',
  },
  {
    id: 'describe',
    alert: 'pod stuck in Pending for 6 minutes',
    context: 'Pending means the scheduler has not placed it. The events will say why.',
    answers: ['kubectl describe pod checkout-api', 'kubectl describe pods checkout-api'],
    hint: 'kubectl describe pod <name>',
    teach: 'describe surfaces scheduling events — insufficient CPU, unbound volume, taints. Logs would be empty here.',
  },
  {
    id: 'status',
    alert: 'deploy pipeline is waiting on rollout confirmation',
    context: 'You need to know whether the new revision actually became available.',
    answers: ['kubectl rollout status deployment/checkout-api', 'kubectl rollout status deploy/checkout-api'],
    hint: 'kubectl rollout status deployment/<name>',
    teach: 'rollout status blocks until the deployment converges — which is exactly what a pipeline gate should wait on.',
  },
  {
    id: 'events',
    alert: 'something is wrong in the namespace but nothing is obviously failing',
    context: 'Start wide. Look at what the cluster has been complaining about recently.',
    answers: ['kubectl get events --sort-by=.lastTimestamp', 'kubectl get events --sort-by=.metadata.creationTimestamp'],
    hint: 'kubectl get events --sort-by=.lastTimestamp',
    teach: 'Unsorted events are useless during an incident. Sorting by timestamp turns noise into a timeline.',
  },
  {
    id: 'helm',
    alert: 'the Helm release is reporting a failed upgrade',
    context: 'You want the previous release revision back in place.',
    answers: ['helm rollback checkout-api', 'helm rollback checkout-api 0'],
    hint: 'helm rollback <release>',
    teach: 'Helm keeps release history. Rolling back is a first-class operation, not a manual re-apply.',
  },
  {
    id: 'exec',
    alert: 'need to confirm the mounted config inside a running container',
    context: 'The manifest looks right. Verify what the process actually sees.',
    answers: ['kubectl exec checkout-api -- cat /etc/config/application.yaml', 'kubectl exec -it checkout-api -- cat /etc/config/application.yaml'],
    hint: 'kubectl exec <pod> -- cat /etc/config/application.yaml',
    teach: 'Config drift hides between what was declared and what was mounted. Only the container can settle it.',
  },
]

const ROUNDS = 6
const TIME_PER_DRILL = 22

function normalise(s: string) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

export default function IncidentCommand() {
  const unlock = useSystem((s) => s.unlock)
  const [queue, setQueue] = useState<Drill[]>([])
  const [round, setRound] = useState(0)
  const [entry, setEntry] = useState('')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(TIME_PER_DRILL)
  const [feed, setFeed] = useState<{ text: string; tone: 'in' | 'ok' | 'bad' | 'sys' }[]>([])
  const [hintsUsed, setHintsUsed] = useState(0)
  const [misses, setMisses] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const scoreRef = useRef(0)
  const missRef = useRef(0)
  const hintRef = useRef(0)

  scoreRef.current = score
  missRef.current = misses
  hintRef.current = hintsUsed

  const drill = queue[round]

  const push = useCallback((text: string, tone: 'in' | 'ok' | 'bad' | 'sys') => {
    setFeed((f) => [...f.slice(-40), { text, tone }])
  }, [])

  const start = useCallback(() => {
    const shuffled = [...DRILLS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    setQueue(shuffled)
    setRound(0)
    setScore(0)
    setEntry('')
    setTime(TIME_PER_DRILL)
    setHintsUsed(0)
    setMisses(0)
    setResult(null)
    setStarted(true)
    setPaused(false)
    setFeed([
      { text: 'incident bridge opened · you have the keyboard', tone: 'sys' },
      { text: `${ROUNDS} alerts queued · ${TIME_PER_DRILL}s each`, tone: 'sys' },
    ])
    setTimeout(() => input.current?.focus(), 60)
  }, [])

  const finish = useCallback(
    (finalScore: number, finalMisses: number, finalHints: number) => {
      if (finalMisses === 0 && finalHints === 0) unlock('terminal-ace')
      setResult({
        score: Math.max(0, Math.round(finalScore)),
        verdict: finalMisses === 0 ? 'Clean bridge.' : finalMisses <= 2 ? 'Incident closed.' : 'Rough shift.',
        lines: [
          { label: 'Alerts handled', value: `${ROUNDS - finalMisses} / ${ROUNDS}` },
          { label: 'Missed', value: String(finalMisses) },
          { label: 'Hints taken', value: String(finalHints) },
        ],
      })
    },
    [unlock],
  )

  const nextRound = useCallback(
    (nextScore: number, nextMisses: number, nextHints: number) => {
      if (round + 1 >= queue.length) finish(nextScore, nextMisses, nextHints)
      else { setRound((r) => r + 1); setTime(TIME_PER_DRILL); setEntry('') }
    },
    [round, queue.length, finish],
  )

  const submit = useCallback(() => {
    if (!drill) return
    const value = normalise(entry)
    if (!value) return
    push(`❯ ${entry}`, 'in')
    const correct = drill.answers.some((a) => normalise(a) === value)
    if (correct) {
      const gained = 120 + Math.round(time * 6)
      setScore((s) => s + gained)
      push(`✓ ${drill.teach}`, 'ok')
      sfx('confirm')
      setEntry('')
      nextRound(score + gained, misses, hintsUsed)
    } else {
      setMisses((m) => m + 1)
      setScore((s) => Math.max(0, s - 30))
      push(`✗ not that. correct: ${drill.answers[0]}`, 'bad')
      push(`· ${drill.teach}`, 'sys')
      sfx('deny')
      setEntry('')
      nextRound(Math.max(0, score - 30), misses + 1, hintsUsed)
    }
  }, [drill, entry, time, score, misses, hintsUsed, nextRound, push])

  useEffect(() => {
    if (!started || result || paused || !drill) return
    let remaining = TIME_PER_DRILL
    setTime(TIME_PER_DRILL)
    const id = window.setInterval(() => {
      remaining -= 0.1
      if (remaining <= 0) {
        window.clearInterval(id)
        push(`✗ timed out. correct: ${drill.answers[0]}`, 'bad')
        push(`· ${drill.teach}`, 'sys')
        sfx('alarm')
        const nextMisses = missRef.current + 1
        setMisses(nextMisses)
        nextRound(scoreRef.current, nextMisses, hintRef.current)
        return
      }
      setTime(remaining)
    }, 100)
    return () => window.clearInterval(id)
  }, [started, result, paused, drill, nextRound, push])

  useEffect(() => { scrollToBottom(feedRef.current) }, [feed])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (!drill) return
      setHintsUsed((h) => h + 1)
      setScore((s) => Math.max(0, s - 45))
      push(`? hint: ${drill.hint}`, 'sys')
      sfx('click')
    }
  }

  const urgency = clamp(1 - time / TIME_PER_DRILL, 0, 1)
  const hud = useMemo(() => (
    <div className="term-hud">
      <div className="term-metric"><b>{formatScore(score)}</b><small>SCORE</small></div>
      <div className="term-metric"><b>{round + 1}/{ROUNDS}</b><small>ALERT</small></div>
      <div className="term-metric"><b className={time < 6 ? 'critical' : ''}>{time.toFixed(1)}s</b><small>WINDOW</small></div>
    </div>
  ), [score, round, time])

  return (
    <GameShell id="terminal" hud={started ? hud : null} result={result} onRestart={start} paused={paused} onTogglePause={() => setPaused((p) => !p)}>
      <div className="terminal-stage">
        <div className="terminal-scanlines" aria-hidden />
        {started && drill && <>
          <div className="alert-card" style={{ borderColor: `rgba(255,90,60,${0.25 + urgency * 0.6})` }}>
            <span className="eyebrow">PAGERDUTY · P1 · NS/PAYMENTS</span><h3>{drill.alert}</h3><p>{drill.context}</p>
            <div className="urgency-bar"><i style={{ width: `${(1 - urgency) * 100}%`, background: time < 6 ? '#ff5a3c' : '#4dffa0' }} /></div>
          </div>
          <div className="terminal-feed" ref={feedRef}>{feed.map((line, i) => <p key={i} className={`t-${line.tone}`}>{line.text}</p>)}</div>
          <div className="terminal-input"><span>❯</span><input ref={input} value={entry} onChange={(e) => { setEntry(e.target.value); sfx('type') }} onKeyDown={onKeyDown} spellCheck={false} autoComplete="off" autoCapitalize="off" aria-label="Command entry" placeholder="type the command that helps" /><button className="btn-ghost" onClick={submit}>RUN</button></div>
          <div className="terminal-legend"><kbd>Enter</kbd> execute · <kbd>Tab</kbd> hint (−45) · <kbd>Esc</kbd> quit</div>
        </>}
      </div>
      {!started && !result && <div className="game-over"><div className="game-over-card"><span className="eyebrow" style={{ color: '#4dffa0' }}>KNOWLEDGE · TIMED</span><h2>You have the keyboard.</h2><p className="result-teach">Six alerts, twenty-two seconds each. Read what is actually broken and type the command that helps. Every answer here is a command you would really run — the wrong ones are wrong for real reasons, and the game tells you why.</p><div className="key-legend"><span><kbd>Enter</kbd> execute</span><span><kbd>Tab</kbd> hint</span><span><kbd>Esc</kbd> quit</span></div><div className="result-actions"><button className="btn-primary" onClick={start}>JOIN THE BRIDGE</button></div></div></div>}
    </GameShell>
  )
}
