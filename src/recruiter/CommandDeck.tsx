import { useState } from 'react'
import { profile, projects, timeline, skills } from '../data/profile'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'
import AutoBrief from './AutoBrief'
import SkillConstellation from './SkillConstellation'
import FitCheck from './FitCheck'
import AskConsole from './AskConsole'

type Tab = 'brief' | 'constellation' | 'fit' | 'timeline' | 'projects' | 'ask' | 'contact'

const TABS: { id: Tab; label: string }[] = [
  { id: 'brief', label: '▶ 71-SEC BRIEF' },
  { id: 'constellation', label: 'SKILL MAP' },
  { id: 'fit', label: 'ROLE FIT' },
  { id: 'timeline', label: 'TIMELINE' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'ask', label: 'ASK' },
  { id: 'contact', label: 'CONTACT' },
]

const METRICS = [
  { value: '50+', label: 'MICROSERVICES', note: 'Independently deployable services on OpenShift, in production.' },
  { value: '20+', label: 'PIPELINE STAGES', note: 'One GitLab release workflow from source to gated promotion.' },
  { value: '3', label: 'YEARS IN BANKING', note: 'Regulated delivery where an outage is an audit trail.' },
  { value: '16', label: 'SERVICES EXTRACTED', note: 'Monolith split with zero downtime, on personal time.' },
]

function Timeline() {
  const [activeId, setActiveId] = useState(timeline[2].id)
  const active = timeline.find((t) => t.id === activeId)!
  return (
    <div className="timeline">
      <div className="timeline-rail">
        {timeline.map((t) => (
          <button
            key={t.id}
            className={`tl-item ${t.kind}${t.id === activeId ? ' on' : ''}`}
            onClick={() => {
              sfx('click')
              setActiveId(t.id)
            }}
          >
            <span className="tl-year">{t.year}</span>
            <span className="tl-dot" />
            <span className="tl-body">
              <b>{t.title}</b>
              <span>{t.org}</span>
            </span>
          </button>
        ))}
      </div>
      <article className="tl-detail">
        <span className="eyebrow">{active.kind === 'work' ? 'EMPLOYMENT' : active.kind === 'cert' ? 'CERTIFICATION' : 'PERSONAL BUILD'}</span>
        <h3>{active.title}</h3>
        <p className="mono">
          {active.org} · {active.period}
        </p>
        <p>{active.summary}</p>
        <ul>
          {active.detail.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </article>
    </div>
  )
}

function Projects() {
  return (
    <div className="proj-grid">
      {projects.map((p) => (
        <article className="proj" key={p.id}>
          <div>
            <span className="eyebrow">{p.tag}</span>
            <h3>{p.title}</h3>
            <p>{p.copy}</p>
            <div className="stack-cloud">
              {p.stack.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
          <div className="proj-signals">
            {p.signals.map((sig) => (
              <div key={sig.label}>
                <b>{sig.value}</b>
                <span>{sig.label.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.links.emailPlain)
      setCopied(true)
      sfx('confirm')
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = profile.links.email
    }
  }
  return (
    <>
      <div className="contact-grid">
        <a href={profile.links.resume} target="_blank" rel="noreferrer">
          <b>DOWNLOAD RESUME</b>
          <span>PDF · the canonical version of everything on this page</span>
        </a>
        <button onClick={copy}>
          <b>{copied ? 'COPIED ✓' : 'COPY EMAIL'}</b>
          <span>{profile.links.emailPlain}</span>
        </button>
        <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
          <b>LINKEDIN</b>
          <span>Full history, recommendations and current role</span>
        </a>
        <a href={profile.links.github} target="_blank" rel="noreferrer">
          <b>GITHUB</b>
          <span>Infrastructure, pipelines and the projects listed here</span>
        </a>
      </div>
      <div style={{ marginTop: 22 }}>
        <span className="eyebrow">FULL STACK LIST</span>
        <div className="stack-cloud" style={{ marginTop: 12 }}>
          {skills.map((s) => (
            <span key={s.id}>{s.name}</span>
          ))}
        </div>
      </div>
    </>
  )
}

export default function CommandDeck() {
  const [tab, setTab] = useState<Tab>('brief')
  const go = useSystem((s) => s.go)

  return (
    <main className="deck">
      <div className="deck-inner">
        <header className="deck-hero">
          <div>
            <span className="eyebrow">RECRUITER DECK · NO SCROLLING REQUIRED</span>
            <h1>{profile.name}</h1>
            <h2>{profile.role} · {profile.location}</h2>
            <p>{profile.summary}</p>
            <div className="deck-avail">{profile.availability}</div>
          </div>
          <div className="deck-actions">
            <a className="accent" href={profile.links.resume} target="_blank" rel="noreferrer">
              RESUME PDF
            </a>
            <a href={profile.links.email}>EMAIL</a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN
            </a>
            <button onClick={() => go('arcade')}>PLAY THE ARCADE</button>
          </div>
        </header>

        <div className="metric-strip">
          {METRICS.map((m) => (
            <div key={m.label}>
              <b>{m.value}</b>
              <span>{m.label}</span>
              <small>{m.note}</small>
            </div>
          ))}
        </div>

        <nav className="deck-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'on' : ''}
              onClick={() => {
                sfx('click')
                setTab(t.id)
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="deck-body">
          {tab === 'brief' && <AutoBrief />}
          {tab === 'constellation' && <SkillConstellation />}
          {tab === 'fit' && <FitCheck />}
          {tab === 'timeline' && <Timeline />}
          {tab === 'projects' && <Projects />}
          {tab === 'ask' && <AskConsole />}
          {tab === 'contact' && <Contact />}
        </div>

        <footer className="deck-foot">
          <span>BUILT WITH REACT 19 · TYPESCRIPT · THREE.JS · NO 3D ASSETS DOWNLOADED</span>
          <span>SIMULATION FIGURES ARE FICTIONAL · CAREER FACTS ARE NOT</span>
        </footer>
      </div>
    </main>
  )
}
