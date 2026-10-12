/**
 * Admin label in French (the admin's default language) and English. Arabic admin users see the
 * English label until Arabic ones are added here.
 */
export function label(fr: string, en: string): Record<'en' | 'fr', string> {
  return { fr, en }
}

export const groups = {
  contests: label('Concours', 'Contests'),
  participations: label('Participations', 'Participations'),
  content: label('Contenu', 'Content'),
  administration: label('Administration', 'Administration'),
}
