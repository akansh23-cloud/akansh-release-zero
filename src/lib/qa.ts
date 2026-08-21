import { answers, type Answer } from '../data/profile'

/**
 * Normalises to space-delimited alphanumeric tokens so that keys match on word
 * boundaries. Plain substring matching was wrong in a way that mattered:
 * "security" contains "ci", so a security question scored against the CI/CD
 * entry. Punctuation is flattened too, which lets "ci/cd" match the key "ci cd".
 */
function normalise(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim()} `
}

export interface Resolution {
  answer: Answer
  score: number
  matched: string[]
}

export function resolveAnswer(question: string): Resolution | null {
  const q = normalise(question)
  let best: Resolution | null = null

  for (const answer of answers) {
    const matched: string[] = []
    let score = 0
    for (const key of answer.match) {
      const token = normalise(key).trim()
      if (!token) continue
      if (q.includes(` ${token} `)) {
        matched.push(key)
        // Longer keys are more specific, so weight them superlinearly.
        score += token.length * token.length
      }
    }
    // A second independent keyword is stronger evidence than one long word.
    if (matched.length > 1) score += matched.length * 24
    if (score > (best?.score ?? 0)) best = { answer, score, matched }
  }

  return best
}
