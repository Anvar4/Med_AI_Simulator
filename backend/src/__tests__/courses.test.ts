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

test('shouldComplete respects the 90% threshold and explicit flag', () => {
  // explicit flag always wins
  assert.equal(shouldComplete(0, 0, true), true)
  assert.equal(shouldComplete(0, 100, true), true)
  // duration known: needs >= 90%
  assert.equal(shouldComplete(89, 100), false)
  assert.equal(shouldComplete(90, 100), true)
  assert.equal(shouldComplete(100, 100), true)
  // duration unknown and no explicit flag -> not complete
  assert.equal(shouldComplete(9999, 0), false)
})
