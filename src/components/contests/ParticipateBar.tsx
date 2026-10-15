'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { participationAnchor } from './anchors'

/**
 * A bottom bar on phones with the time left and a button to the form, so the action stays one tap
 * away on a long page. It shows only between the hero's button, once scrolled away, and the form,
 * and steps aside while the cookie banner is open (Tracking sets the html attribute).
 */
export function ParticipateBar({
  countdown,
  label,
  heroSelector,
}: {
  countdown?: string
  label: string
  /** The hero's participation button, which makes the bar redundant while it is on screen. */
  heroSelector: string
}) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.querySelector(heroSelector)
    const form = document.getElementById(participationAnchor)
    if (!hero || !form) return
    const onScreen = new Map<Element, boolean>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) onScreen.set(entry.target, entry.isIntersecting)
      // Between the two: the hero button scrolled up past the top, the form still further down.
      const heroAbove = !onScreen.get(hero) && hero.getBoundingClientRect().bottom < 0
      const formBelow = !onScreen.get(form) && form.getBoundingClientRect().top > 0
      setShown(heroAbove && formBelow)
    })
    observer.observe(hero)
    observer.observe(form)
    return () => observer.disconnect()
  }, [heroSelector])

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-raised backdrop-blur md:hidden in-data-[cookie-banner=open]:hidden',
        'transition-transform duration-200 ease-brand motion-reduce:transition-none',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        {countdown && <p className="flex-1 text-label text-primary-ink">{countdown}</p>}
        <a
          href={`#${participationAnchor}`}
          className={buttonVariants({ className: cn(countdown ? 'shrink-0' : 'w-full') })}
        >
          {label}
          <ArrowDown aria-hidden />
        </a>
      </div>
    </div>
  )
}
