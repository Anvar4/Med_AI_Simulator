/**
 * Dependency-free smoke tests for case security helpers.
 * Run with: npm run test  (uses tsx + Node's built-in test runner)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  escapeRegex,
  PROTECTED_CASE_FIELDS,
  resolveCaseStatus,
  stripProtectedFields,
} from '../controllers/caseSecurity'

test('escapeRegex neutralizes ReDoS / regex metacharacters', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c')
  assert.equal(escapeRegex('(a+)+'), '\\(a\\+\\)\\+')
  // A literal search string must match itself when used as a regex source.
  const evil = '(((((((((('
  const re = new RegExp(escapeRegex(evil))
  assert.ok(re.test(evil))
})

test('stripProtectedFields removes every protected field', () => {
  const payload: Record<string, unknown> = {
    title: 'Keep me',
    createdBy: 'attacker-id',
    status: 'published',
    caseId: 'forged',
    _id: 'forged',
    authorName: 'spoofed',
  }
  stripProtectedFields(payload)
  for (const field of PROTECTED_CASE_FIELDS) {
    assert.equal(field in payload, false, `${field} should be stripped`)
  }
  assert.equal(payload.title, 'Keep me')
})

test('instructors can never publish a case', () => {
  assert.equal(resolveCaseStatus(false, 'published'), 'draft')
  assert.equal(resolveCaseStatus(false, 'rejected'), 'draft')
  assert.equal(resolveCaseStatus(false, 'review'), 'review')
  assert.equal(resolveCaseStatus(false, 'draft'), 'draft')
  assert.equal(resolveCaseStatus(false, undefined), 'draft')
})

test('admins may set any valid status, with a sane fallback', () => {
  assert.equal(resolveCaseStatus(true, 'published'), 'published')
  assert.equal(resolveCaseStatus(true, 'rejected'), 'rejected')
  assert.equal(resolveCaseStatus(true, 'garbage'), 'published')
  assert.equal(resolveCaseStatus(true, 'garbage', 'draft'), 'draft')
})
