import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeFiles, sourceFiles } from './architecture/source.ts'

const tsxTest = /^tests\/.+\.test\.tsx$/

test('the line limit covers TSX tests in tests/', () => {
  assert.ok(codeFiles().some((f) => tsxTest.test(f)))
})

test('the JSDoc and constants rules cover TSX tests and helpers in tests/', () => {
  const covered = sourceFiles()
  assert.ok(covered.some((f) => tsxTest.test(f)))
  assert.ok(covered.includes('tests/setup-dom.ts'))
})
