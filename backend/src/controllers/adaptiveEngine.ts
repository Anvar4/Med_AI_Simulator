/**
 * Pure, dependency-free adaptive learning logic.
 *
 * The platform exposes three learning *levels* (1–3) mapped onto a case's raw
 * 1–5 `difficulty`:
 *   Level 1  ← difficulty 1–2  (foundational)
 *   Level 2  ← difficulty 3    (intermediate)
 *   Level 3  ← difficulty 4–5  (advanced)
 *
 * A learner unlocks the next level within a category by demonstrating mastery
 * (a high enough average over enough attempts) at the current level. Poor
 * performance keeps them at the current level and triggers extra practice.
 */

export type Level = 1 | 2 | 3

// Passing threshold: a learner must score at least 60 to clear a level and
// unlock the next. Below 60 they stay on the current level (reinforcement).
export const PASS_SCORE = 60
export const MASTERY_SCORE = 60 // avg score needed to advance to the next level
export const MIN_ATTEMPTS_TO_ADVANCE = 1 // a single passing attempt unlocks the next level
export const STRUGGLING_SCORE = 60 // below this -> needs reinforcement, stay on level

/** Map a raw case difficulty (1–5) to a learning level (1–3). */
export function difficultyToLevel(difficulty: number): Level {
  if (difficulty <= 2) return 1
  if (difficulty === 3) return 2
  return 3
}

export interface LevelStat {
  level: Level
  attempts: number
  avgScore: number
}

/**
 * Given a learner's per-level stats *within a single category*, return the
 * highest level they may currently access. Level 1 is always unlocked. A level
 * unlocks only when the level below it is mastered (enough attempts + avg ≥
 * MASTERY_SCORE). Unlocking is monotonic — a later dip doesn't re-lock.
 */
export function unlockedLevel(stats: LevelStat[]): Level {
  const byLevel = new Map<Level, LevelStat>()
  for (const s of stats) byLevel.set(s.level, s)

  let unlocked: Level = 1
  for (const level of [1, 2] as Level[]) {
    const s = byLevel.get(level)
    const mastered = !!s && s.attempts >= MIN_ATTEMPTS_TO_ADVANCE && s.avgScore >= MASTERY_SCORE
    if (mastered) unlocked = (level + 1) as Level
    else break
  }
  return unlocked
}

export type Recommendation = 'start' | 'reinforce' | 'continue' | 'mastered'

/**
 * Decide the next action for a category. `targetLevel` is always the learner's
 * highest unlocked level (mastery of a level auto-unlocks the next, so the
 * recommendation always points at the frontier they should be practising).
 * - `start`     : no attempts yet at the unlocked level → begin here.
 * - `reinforce` : struggling at the unlocked level → more practice needed.
 * - `continue`  : making progress but not yet mastered → keep going.
 * - `mastered`  : already mastered the top level (3) → nothing left to unlock.
 */
export function recommendAction(stats: LevelStat[]): { action: Recommendation; targetLevel: Level } {
  const level = unlockedLevel(stats)
  const current = stats.find(s => s.level === level)

  if (!current || current.attempts === 0) return { action: 'start', targetLevel: level }
  if (current.avgScore < STRUGGLING_SCORE) return { action: 'reinforce', targetLevel: level }
  if (
    level === 3 &&
    current.attempts >= MIN_ATTEMPTS_TO_ADVANCE &&
    current.avgScore >= MASTERY_SCORE
  ) {
    return { action: 'mastered', targetLevel: 3 }
  }
  return { action: 'continue', targetLevel: level }
}
