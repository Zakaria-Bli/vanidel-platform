'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { buttonVariants } from '@/components/ui/button'

import { winnersAnchor } from './anchors'

/** Height animation for a Base UI collapsible panel; instant for visitors who ask for less motion. */
export const collapsiblePanelClass =
  'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-250 ease-brand data-ending-style:h-0 data-starting-style:h-0'

/**
 * The winners list, folded under its header: a draw can have up to 25 winners, so the page stays
 * short until a visitor asks for them. It opens on its own for links to `#gagnants` (the hero's
 * "Voir les gagnants"), and for the browser's find-in-page.
 */
export function WinnersDisclosure({
  header,
  showLabel,
  hideLabel,
  children,
}: {
  header: ReactNode
  showLabel: string
  hideLabel: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const openOnHash = () => {
      if (window.location.hash === `#${winnersAnchor}`) setOpen(true)
    }
    openOnHash()
    window.addEventListener('hashchange', openOnHash)
    return () => window.removeEventListener('hashchange', openOnHash)
  }, [])

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {header}
        <CollapsibleTrigger
          className={buttonVariants({
            variant: 'inverse',
            className: 'group/trigger shrink-0 self-start sm:self-auto',
          })}
        >
          {open ? hideLabel : showLabel}
          <ChevronDown
            aria-hidden
            className="transition-transform duration-200 ease-brand group-data-panel-open/trigger:rotate-180"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent hiddenUntilFound className={collapsiblePanelClass}>
        <div className="pt-8">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
