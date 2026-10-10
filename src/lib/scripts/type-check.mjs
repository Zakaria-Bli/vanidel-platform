import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Clear route types from both modes so deleted routes cannot survive a branch switch.
// Preserve the build and caches; only generated TypeScript artifacts are removed.
for (const path of ['.next/types', '.next/dev/types']) {
  rmSync(path, { recursive: true, force: true })
}

for (const [module, args] of [
  ['next/dist/bin/next', ['typegen']],
  ['typescript/bin/tsc', ['--noEmit']],
]) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(import.meta.resolve(module)), ...args],
    {
      stdio: 'inherit',
    },
  )

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
