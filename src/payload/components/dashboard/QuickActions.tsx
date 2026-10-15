import { Download, Images, Link2, Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { Payload } from 'payload'
import { formatAdminURL } from 'payload/shared'

import type { DashboardMessages } from './dashboardMessages'

interface Action {
  href: `/${string}`
  label: string
  Icon: LucideIcon
  allowed: boolean
}

interface Props {
  payload: Payload
  can: {
    createContest: boolean
    createCampaignLink: boolean
    participations: boolean
    media: boolean
  }
  t: DashboardMessages
}

/** Shortcuts to the most frequent tasks, each shown only to users allowed to do it. */
export function QuickActions({ payload, can, t }: Props) {
  const actions: Action[] = [
    {
      href: '/collections/contests/create',
      label: t.actions.newContest,
      Icon: Plus,
      allowed: can.createContest,
    },
    {
      href: '/collections/campaign-links/create',
      label: t.actions.campaignLink,
      Icon: Link2,
      allowed: can.createCampaignLink,
    },
    // The export form sits above the participations list.
    {
      href: '/collections/participations',
      label: t.actions.export,
      Icon: Download,
      allowed: can.participations,
    },
    { href: '/collections/media', label: t.actions.media, Icon: Images, allowed: can.media },
  ]
  const allowed = actions.filter((action) => action.allowed)
  if (allowed.length === 0) return null

  return (
    <section className="vd-dashboard__section" aria-labelledby="vd-dashboard-actions">
      <h2 id="vd-dashboard-actions" className="vd-dashboard__title">
        {t.actions.title}
      </h2>
      <ul className="vd-dashboard__actions">
        {allowed.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={formatAdminURL({ adminRoute: payload.config.routes.admin, path: href })}
              className="vd-dashboard__action"
            >
              <Icon aria-hidden size={18} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
