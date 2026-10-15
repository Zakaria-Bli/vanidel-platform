import { getTranslations } from 'next-intl/server'

import type { Contest } from '@/payload-types'

/** How to take part, as numbered cream cards: one column on phones, three on wide screens. */
export async function ContestSteps({ steps }: { steps: NonNullable<Contest['steps']> }) {
  if (steps.length === 0) return null
  const t = await getTranslations('contests')

  return (
    <section className="flex flex-col gap-6" aria-labelledby="steps-title">
      <h2 id="steps-title">{t('howToTakePart')}</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.id ?? index}
            className="flex gap-4 rounded-card bg-secondary p-5 md:flex-col md:gap-3 md:p-6"
          >
            <span aria-hidden className="font-heading text-h1 leading-none text-primary">
              {index + 1}
            </span>
            <p className="pt-1 whitespace-pre-line md:pt-0">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
