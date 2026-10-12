import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { defaultLocale, getDirection, localeMetadata, locales } from '@/i18n/config'
import ar from '@/i18n/messages/ar.json'
import fr from '@/i18n/messages/fr.json'
import proxy, { config as proxyConfig } from '@/proxy'

const messages = { fr, ar }

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('locale config', () => {
  it('includes the default locale and describes every locale', () => {
    expect(locales).toContain(defaultLocale)
    expect(Object.keys(localeMetadata).sort()).toEqual([...locales].sort())
  })

  it('derives direction from the metadata', () => {
    expect(getDirection('fr')).toBe('ltr')
    expect(getDirection('ar')).toBe('rtl')
  })
})

describe('messages', () => {
  it.each(locales)('has the same keys in %s as in the default locale', (locale) => {
    expect(leafKeys(messages[locale]).sort()).toEqual(leafKeys(messages[defaultLocale]).sort())
  })

  it.each(locales)('has no empty strings in %s', (locale) => {
    const empty = leafKeys(messages[locale]).filter((key) => {
      const value = key.split('.').reduce<unknown>((node, part) => {
        return (node as Record<string, unknown>)[part]
      }, messages[locale])
      return typeof value !== 'string' || value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})

describe('proxy', () => {
  function request(path: string, headers: Record<string, string> = {}) {
    return proxy(new NextRequest(`http://localhost:3000${path}`, { headers }))
  }

  it('redirects the unprefixed QR entry URL to the default locale', async () => {
    const response = await request('/concours/summer-2026')

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/fr/concours/summer-2026')
  })

  it('redirects the QR entry URL to the locale from Accept-Language', async () => {
    const response = await request('/concours/summer-2026', { 'accept-language': 'ar-DZ,ar;q=0.9' })

    expect(response.headers.get('location')).toBe('http://localhost:3000/ar/concours/summer-2026')
  })

  it('prefers the saved locale cookie over Accept-Language', async () => {
    const response = await request('/concours/summer-2026', {
      'accept-language': 'fr',
      cookie: 'NEXT_LOCALE=ar',
    })

    expect(response.headers.get('location')).toBe('http://localhost:3000/ar/concours/summer-2026')
  })

  it('falls back to the default locale for unsupported languages', async () => {
    const response = await request('/concours/summer-2026', { 'accept-language': 'en-US,en;q=0.9' })

    expect(response.headers.get('location')).toBe('http://localhost:3000/fr/concours/summer-2026')
  })

  it('keeps UTM parameters when redirecting the QR entry URL', async () => {
    const response = await request('/concours/summer-2026?utm_source=qr&utm_medium=packaging')

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/fr/concours/summer-2026?utm_source=qr&utm_medium=packaging',
    )
  })

  it('redirects the site root to a locale', async () => {
    const response = await request('/')

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/fr')
  })

  it('does not redirect already localized paths', async () => {
    const response = await request('/ar/concours/summer-2026')

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  describe('matcher', () => {
    const [matcher] = proxyConfig.matcher
    const matches = (path: string) => new RegExp(`^${matcher}$`).test(path)

    it.each(['/', '/fr', '/ar/concours/summer-2026', '/concours/summer-2026', '/administration'])(
      'localizes %s',
      (path) => {
        expect(matches(path)).toBe(true)
      },
    )

    it.each([
      '/api',
      '/api/health',
      '/api/media/file/photo.png',
      '/admin',
      '/admin/collections/users',
      '/_next/static/chunks/main.js',
      '/favicon.ico',
    ])('skips %s', (path) => {
      expect(matches(path)).toBe(false)
    })
  })
})
