import { rmSync } from 'node:fs'

for (const path of ['.next', 'coverage']) {
  rmSync(path, { recursive: true, force: true })
}
