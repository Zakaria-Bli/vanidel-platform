import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

const envFile = resolve(process.cwd(), process.env.DOTENV_CONFIG_PATH ?? '.env.test')

if (!existsSync(envFile)) {
  throw new Error(`Missing ${envFile}. Copy .env.test.example to .env.test before running tests.`)
}

const result = dotenv.config({ path: envFile, override: true })

if (result.error) {
  throw result.error
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in the test environment.')
}

const parsedDatabaseUrl = new URL(databaseUrl)
const databaseName = parsedDatabaseUrl.pathname.replace(/^\/+/, '')
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', 'postgres'])

if (!databaseName.endsWith('_test')) {
  throw new Error('Test DATABASE_URL must target a database whose name ends with "_test".')
}

if (!localHosts.has(parsedDatabaseUrl.hostname) && process.env.ALLOW_REMOTE_TEST_DATABASE !== '1') {
  throw new Error(
    'Test DATABASE_URL must use a local host. Set ALLOW_REMOTE_TEST_DATABASE=1 only for an isolated remote test database.',
  )
}
