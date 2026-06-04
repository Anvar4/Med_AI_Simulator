import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  difficultyToLevel,
  recommendAction,
  unlockedLevel,
  type LevelStat,
} from '../controllers/adaptiveEngine'

test('difficultyToLevel maps 1-5 onto 1-3', () => {
  assert.equal(difficultyToLevel(1), 1)
  assert.equal(difficultyToLevel(2), 1)
  assert.equal(difficultyToLevel(3), 2)
  assert.equal(difficultyToLevel(4), 3)
  assert.equal(difficultyToLevel(5), 3)
})

test('level 1 is always unlocked', () => {
  assert.equal(unlockedLevel([]), 1)
  assert.equal(unlockedLevel([{ level: 1, attempts: 1, avgScore: 30 }]), 1)
})

test('mastering a level unlocks the next', () => {
  assert.equal(unlockedLevel([{ level: 1, attempts: 3, avgScore: 80 }]), 2)
  assert.equal(
    unlockedLevel([
      { level: 1, attempts: 3, avgScore: 80 },
      { level: 2, attempts: 2, avgScore: 90 },
    ]),
    3
  )
})

test('a single passing attempt (>=60) unlocks the next level', () => {
  assert.equal(unlockedLevel([{ level: 1, attempts: 1, avgScore: 100 }]), 2)
  assert.equal(unlockedLevel([{ level: 1, attempts: 1, avgScore: 60 }]), 2)
})

test('scoring below 60 keeps the learner on the current level', () => {
  assert.equal(unlockedLevel([{ level: 1, attempts: 3, avgScore: 59 }]), 1)
})

test('unlock is monotonic — a dip at level 1 does not relock level 2', () => {
  // mastered L1 (avg 80) then unlocks L2; even if we only show L1 dip it stays unlocked
  assert.equal(unlockedLevel([{ level: 1, attempts: 4, avgScore: 78 }]), 2)
})

test('recommendAction: start when nothing attempted', () => {
  assert.deepEqual(recommendAction([]), { action: 'start', targetLevel: 1 })
})

test('recommendAction: reinforce when struggling', () => {
  assert.deepEqual(
    recommendAction([{ level: 1, attempts: 2, avgScore: 40 }]),
    { action: 'reinforce', targetLevel: 1 }
  )
})

test('recommendAction: mastering L1 points to a fresh L2 (start)', () => {
  // L1 mastered -> L2 unlocked, but no L2 attempts yet -> start at L2
  assert.deepEqual(
    recommendAction([{ level: 1, attempts: 3, avgScore: 85 }]),
    { action: 'start', targetLevel: 2 }
  )
})

test('recommendAction: mastered at the top level', () => {
  const stats: LevelStat[] = [
    { level: 1, attempts: 3, avgScore: 85 },
    { level: 2, attempts: 3, avgScore: 85 },
    { level: 3, attempts: 3, avgScore: 85 },
  ]
  assert.deepEqual(recommendAction(stats), { action: 'mastered', targetLevel: 3 })
})

test('recommendAction: reinforce at top level when below the pass score', () => {
  const stats: LevelStat[] = [
    { level: 1, attempts: 3, avgScore: 85 },
    { level: 2, attempts: 3, avgScore: 85 },
    { level: 3, attempts: 2, avgScore: 55 }, // below 60 -> not mastered yet
  ]
  assert.deepEqual(recommendAction(stats), { action: 'reinforce', targetLevel: 3 })
})
