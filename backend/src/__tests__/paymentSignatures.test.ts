import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { test } from 'node:test'

import {
  clickSignString,
  paymeAuthOk,
  signaturesMatch,
} from '../controllers/paymentSignatures'

test('clickSignString reproduces the documented MD5 field order (Prepare)', () => {
  const params = {
    clickTransId: '123',
    serviceId: '456',
    secretKey: 'SECRET',
    merchantTransId: 'order1',
    amount: '30000.00',
    action: '0',
    signTime: '2024-01-01 00:00:00',
  }
  const expected = crypto
    .createHash('md5')
    .update('123' + '456' + 'SECRET' + 'order1' + '' + '30000.00' + '0' + '2024-01-01 00:00:00')
    .digest('hex')
  assert.equal(clickSignString(params), expected)
})

test('clickSignString includes merchant_prepare_id on Complete', () => {
  const base = {
    clickTransId: '1',
    serviceId: '2',
    secretKey: 'K',
    merchantTransId: 'o1',
    amount: '100',
    action: '1',
    signTime: 't',
  }
  const withPrepare = clickSignString({ ...base, merchantPrepareId: '99' })
  const without = clickSignString(base)
  assert.notEqual(withPrepare, without)
})

test('signaturesMatch is true only for identical hex strings', () => {
  assert.equal(signaturesMatch('abc123', 'abc123'), true)
  assert.equal(signaturesMatch('abc123', 'abc124'), false)
  assert.equal(signaturesMatch('abc', 'abcd'), false) // length mismatch
  assert.equal(signaturesMatch('', ''), false)
})

test('paymeAuthOk validates Basic Paycom:KEY header', () => {
  const key = 'merchant-secret-key'
  const good = 'Basic ' + Buffer.from('Paycom:' + key).toString('base64')
  assert.equal(paymeAuthOk(good, key), true)

  const wrong = 'Basic ' + Buffer.from('Paycom:wrong').toString('base64')
  assert.equal(paymeAuthOk(wrong, key), false)

  assert.equal(paymeAuthOk(undefined, key), false)
  assert.equal(paymeAuthOk('Bearer xyz', key), false)
  assert.equal(paymeAuthOk(good, ''), false) // no configured key
})
