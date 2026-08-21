import { useMemo, useState } from 'react'
import { categoryMeta, roleArchetypes, skills, type SkillCategory } from '../data/profile'
import { useSystem } from '../state/system'
import { sfx } from '../audio/engine'
import { useCountUp } from '../lib/utils'

/** Average operating depth per category, computed from the skill graph. */
const categoryDepth: Record<SkillCategory, number> = (() => {
  const acc = {} as Record<SkillCategory, { sum: number; n: number }>
  skills.forEach((s) => {
    acc[s.category] = acc[s.category] ?? { sum: 0, n: 0 }
    acc[s.category].sum += s.depth
    acc[s.category].n += 1
  })
  const out = {} as Record<SkillCategory, number>
  ;(Object.keys(acc) as SkillCategory[]).forEach((k) => {
    out[k] = Math.round(acc[k].sum / acc[k].n)
  })
  return out
})()

export default function FitCheck() {
  const unlock = useSystem((s) => s.unlock)
  const [roleId, setRoleId] = useState(roleArchetypes[0].id)
  const role = roleArchetypes.find((r) => r.id === roleId)!

  const score = useMemo(() => {
    let total = 0
    let weight = 0
    ;(Object.entries(role.weights) as [SkillCategory, number][]).forEach(([cat, w]) => {
      total += (categoryDepth[cat] ?? 0) * w
      weight += w
    })
    return Math.round(total / (weight || 1))
  }, [role])

  const animated = useCountUp(score, 900, true)

  const rows = (Object.entries(role.weights) as [SkillCategory, number][]).sort((a, b) => b[1] - a[1])

  return (
    <div className="fit">
      <div className="fit-roles">
        {roleArchetypes.map((r) => (
          <button
            key={r.id}
            className={r.id === roleId ? 'on' : ''}
            onClick={() => {
              sfx('click')
              setRoleId(r.id)
              unlock('fit-checked')
            }}
          >
            <b>{r.label}</b>
            <span>{r.blurb}</span>
          </button>
        ))}
      </div>

      <div className="fit-report">
        <span className="eyebrow">FIT AGAINST {role.label.toUpperCase()}</span>
        <div className="fit-score">
          <b>{Math.round(animated)}</b>
          <span>/ 100 WEIGHTED MATCH</span>
        </div>
        <p>{role.pitch}</p>

        <div className="fit-bars">
          {rows.map(([cat, weight]) => {
            const depth = categoryDepth[cat] ?? 0
            return (
              <div className="fit-bar" key={cat}>
                <span>
                  {categoryMeta[cat].label} · {Math.round(weight * 100)}%
                </span>
                <i>
                  <em style={{ width: `${depth}%`, background: categoryMeta[cat].color }} />
                </i>
                <b>{depth}</b>
              </div>
            )
          })}
        </div>

        <div className="fit-gap">
          <span>WHERE THIS ROLE WOULD STRETCH HIM</span>
          <p>{role.gap}</p>
        </div>

        <div className="fit-anchors">
          {role.anchors.map((id) => {
            const s = skills.find((x) => x.id === id)
            return s ? <span key={id}>{s.name}</span> : null
          })}
        </div>
      </div>
    </div>
  )
}
