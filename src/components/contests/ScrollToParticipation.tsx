'use client'

import { useEffect } from 'react'

import { participationAnchor } from './anchors'

/**
 * Brings the form into view when an open contest's page loads, so visitors arriving from a
 * packaging QR code or a post land on it; the details stay one scroll up. A link to a section of
 * the page (`#gagnants`) wins.
 */
export function ScrollToParticipation() {
  useEffect(() => {
    if (window.location.hash) return
    const form = document.getElementById(participationAnchor)
    if (!form) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // After the router's own scroll to the top of a newly opened page.
    const frame = requestAnimationFrame(() =>
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }),
    )
    return () => cancelAnimationFrame(frame)
  }, [])

  return null
}
