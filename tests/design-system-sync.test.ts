/**
 * scripts/sync.sh keeps file names with spaces whole: it asks `gh` for the
 * URL-encoded path and writes a correct SHA256SUMS line. A fake `gh` on PATH
 * stands in for GitHub, so the test runs offline.
 *
 * @feature ADR-33
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const filesArray = /files=\([^)]*\)/
const fakeGh = `#!/usr/bin/env bash
for arg; do [[ $arg == repos/* ]] && endpoint=$arg; done
case $endpoint in
  *' '*) echo "unencoded space in $endpoint" >&2; exit 1 ;;
  */commits/*) echo ${'a'.repeat(40)} ;;
  *) printf 'content of %s' "\${endpoint%%\\?*}" ;;
esac
`

test('sync copies a file with a space in its name and sums it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-sync-'))
  mkdirSync(join(dir, 'scripts'))
  mkdirSync(join(dir, 'design-system'))
  mkdirSync(join(dir, 'bin'))
  writeFileSync(join(dir, 'bin', 'gh'), fakeGh)
  chmodSync(join(dir, 'bin', 'gh'), 0o755)
  const script = readFileSync(new URL('../scripts/sync.sh', import.meta.url), 'utf8').replace(
    filesArray,
    "files=('docs/a b.css')",
  )
  writeFileSync(join(dir, 'scripts', 'sync.sh'), script)
  execFileSync('bash', [join(dir, 'scripts', 'sync.sh')], {
    env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env['PATH']}` },
    stdio: 'pipe',
  })
  const copy = readFileSync(join(dir, 'design-system', 'docs', 'a b.css'))
  const sum = createHash('sha256').update(copy).digest('hex')
  assert.equal(
    readFileSync(join(dir, 'design-system', 'SHA256SUMS'), 'utf8'),
    `${sum}  docs/a b.css\n`,
  )
})
