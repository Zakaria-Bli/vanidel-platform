/** Admin label in each admin language: French (the default), English and Arabic. */
export function label(fr: string, en: string, ar: string): Record<'ar' | 'en' | 'fr', string> {
  return { fr, en, ar }
}

export const groups = {
  contests: label('Concours', 'Contests', 'المسابقات'),
  participations: label('Participations', 'Participations', 'المشاركات'),
  content: label('Contenu', 'Content', 'المحتوى'),
  administration: label('Administration', 'Administration', 'الإدارة'),
}
