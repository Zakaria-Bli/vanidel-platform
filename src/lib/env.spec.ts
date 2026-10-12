import { describe, expect, it } from 'vitest'

import { parseEnv } from './env'

const base = {
  DATABASE_URL: 'postgresql://payload:secret@127.0.0.1:5432/vanidel',
  PAYLOAD_SECRET: 'x'.repeat(32),
}

const s3 = {
  S3_ENDPOINT: 'http://127.0.0.1:8333',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_BUCKET_PUBLIC: 'vanidel-public',
  S3_BUCKET_PRIVATE: 'vanidel-private',
}

describe('parseEnv', () => {
  it('leaves S3 unset outside production', () => {
    expect(parseEnv({ ...base, NODE_ENV: 'development' }).S3_ENDPOINT).toBeUndefined()
  })

  it('treats blank S3 values as unset', () => {
    expect(
      parseEnv({ ...base, S3_ENDPOINT: '', S3_BUCKET_PUBLIC: '  ' }).S3_ENDPOINT,
    ).toBeUndefined()
  })

  it('accepts a complete S3 configuration with a default region', () => {
    expect(parseEnv({ ...base, ...s3 })).toMatchObject({ ...s3, S3_REGION: 'us-east-1' })
  })

  it('rejects a partial S3 configuration', () => {
    expect(() => parseEnv({ ...base, S3_ENDPOINT: s3.S3_ENDPOINT })).toThrow(
      /S3_BUCKET_PRIVATE is required when any S3 setting is set/,
    )
  })

  it('requires S3 when the production server starts', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(
      /S3_ENDPOINT is required in production/,
    )
  })

  it('requires the public site URL when the production server starts', () => {
    expect(() => parseEnv({ ...base, ...s3, NODE_ENV: 'production' })).toThrow(
      /SITE_URL is required in production/,
    )
    expect(
      parseEnv({ ...base, ...s3, NODE_ENV: 'production', SITE_URL: 'https://vanidel.com' })
        .SITE_URL,
    ).toBe('https://vanidel.com')
  })

  it('does not require S3 during the production build', () => {
    expect(() =>
      parseEnv({ ...base, NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' }),
    ).not.toThrow()
  })
})
