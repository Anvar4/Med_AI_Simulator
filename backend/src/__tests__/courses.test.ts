import assert from 'node:assert/strict'
import { test } from 'node:test'

import { slugify } from '../models/Course'
import { parseYoutubeId } from '../models/Video'
import { shouldComplete } from '../controllers/progressController'

test('parseYoutubeId handles watch / short / embed / bare-id forms', () => {
  assert.equal(parseYoutubeId('https://www.youtube.com/watch?v=EkyLRc8mtII'), 'EkyLRc8mtII')
  assert.equal(parseYoutubeId('https://youtu.be/EkyLRc8mtII'), 'EkyLRc8mtII')
  assert.equal(parseYoutubeId('https://www.youtube.com/embed/EkyLRc8mtII'), 'EkyLRc8mtII')
  assert.equal(parseYoutubeId('https://youtube.com/shorts/EkyLRc8mtII'), 'EkyLRc8mtII')
  assert.equal(parseYoutubeId('EkyLRc8mtII'), 'EkyLRc8mtII')
  assert.equal(parseYoutubeId('not a url'), null)
  assert.equal(parseYoutubeId(''), null)
})

test('slugify produces url-safe slugs', () => {
  assert.equal(slugify("Asosiy klinik ko'nikmalar kursi"), 'asosiy-klinik-konikmalar-kursi')
  assert.equal(slugify('  Hello, World!  '), 'hello-world')
  assert.equal(slugify(''), '')
})

test('shouldComplete: known duration needs >= 90% position (client flag ignored)', () => {
  assert.equal(shouldComplete(89, 100), false)
  assert.equal(shouldComplete(90, 100), true)
  assert.equal(shouldComplete(100, 100), true)
  // Even an explicit flag cannot bypass the position requirement.
  assert.equal(shouldComplete(0, 100, true), false)
})

test('shouldComplete: forged "complete at 0 seconds" is rejected', () => {
  // The certificate-forgery attack: {completed:true, positionSeconds:0}
  assert.equal(shouldComplete(0, 0, true), false)
  // Unknown duration honors completion only after real watch time (>=30s).
  assert.equal(shouldComplete(29, 0, true), false)
  assert.equal(shouldComplete(30, 0, true), true)
  // No explicit flag and unknown duration -> never complete.
  assert.equal(shouldComplete(9999, 0), false)
})
