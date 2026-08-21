import { useCallback, useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'
import { scrollToBottom } from '../lib/utils'
import { resolveAnswer } from '../lib/qa'

interface Line {
  kind: 'q' | 'a' | 'sys'
  text: string
}

const SUGGESTIONS = [
  'How deep is the Kubernetes experience?',
  'What does the CI/CD ownership cover?',
  'How is security handled in the pipeline?',
  'What happens when production degrades?',
  'Where are the honest gaps?',
  'How do I get in touch?',
]


export default function AskConsole() {
  const unlock = useSystem((s) => s.unlock)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'sys', text: 'profile console · answers are drawn from a fixed knowledge base, not generated' },
    { kind: 'sys', text: 'ask about kubernetes, ci/cd, security, incidents, cloud, projects, gaps or contact' },
  ])
  const [entry, setEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom(windowRef.current)
  }, [lines])

  const ask = useCallback(
    (question: string) => {
      const q = question.trim()
      if (!q || busy) return
      unlock('asked')
      sfx('click')
      setEntry('')
      setBusy(true)
      setLines((l) => [...l, { kind: 'q', text: q }])

      const found = resolveAnswer(q)
      const response = found
        ? found.answer.response
        : [
            'No entry for that one — this console only answers from a fixed set of facts rather than improvising.',
            `Try kubernetes, ci/cd, security, incidents, cloud, projects, strengths, gaps or contact. Or just email ${profile.links.emailPlain}.`,
          ]

      // Reveal the answer line by line so it reads like a response, not a dump.
      response.forEach((text, i) => {
        window.setTimeout(() => {
          setLines((l) => [...l, { kind: 'a', text }])
          if (i === response.length - 1) setBusy(false)
        }, 240 + i * 420)
      })
    },
    [busy, unlock],
  )

  return (
    <div className="ask">
      <div className="ask-window" ref={windowRef}>
        {lines.map((l, i) => (
          <p key={i} className={l.kind}>
            {l.text}
          </p>
        ))}
        {busy && <p className="sys">…</p>}
      </div>

      <div className="ask-input">
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') ask(entry)
          }}
          placeholder="ask about the profile…"
          aria-label="Ask a question about the profile"
          spellCheck={false}
        />
        <button className="btn-primary" onClick={() => ask(entry)}>
          ASK
        </button>
      </div>

      <div className="ask-suggest">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
