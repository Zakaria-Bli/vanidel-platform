import { notFound } from 'next/navigation'

// Sends unknown paths under a locale to [locale]/not-found.tsx, so the 404 renders inside the
// localized layout instead of Next's bare default.
export default function CatchAllPage() {
  notFound()
}
