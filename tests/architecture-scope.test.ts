import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeFiles, sourceFiles } from './architecture/source.ts'

test('the line limit covers TSX tests', () => {
  assert.ok(codeFiles().includes('tests/popup/App.test.tsx'))
})

test('the JSDoc and constants rules cover test helpers in tests/', () => {
  assert.ok(sourceFiles().includes('tests/setup-dom.ts'))
})
