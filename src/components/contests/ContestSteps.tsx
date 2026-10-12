import { getTranslations } from 'next-intl/server'

import type { Contest } from '@/payload-types'

export async function ContestSteps({ steps }: { steps: NonNullable<Contest['steps']> }) {
  if (steps.length === 0) return null
  const t = await getTranslations('contests')

  return (
    <section className="flex flex-col gap-4" aria-labelledby="steps-title">
      <h2 id="steps-title">{t('howToTakePart')}</h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step.id ?? index} className="flex items-start gap-3 rounded-xl bg-secondary p-4">
            <span
              aria-hidden
              className="flex-center size-8 shrink-0 rounded-full bg-primary font-bold text-primary-foreground"
            >
              {index + 1}
            </span>
            <p className="pt-1 whitespace-pre-line">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
