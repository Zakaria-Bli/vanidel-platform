// Admin texts of the dashboard home, in each admin language.

type Language = 'fr' | 'en' | 'ar'

/** "3 أيام", "11 يومًا": Arabic counts change the noun's form with the number. */
function arabicDays(count: number): string {
  const forms: Partial<Record<Intl.LDMLPluralRule, string>> = {
    two: 'يومين',
    few: `${count} أيام`,
    many: `${count} يومًا`,
  }
  return forms[new Intl.PluralRules('ar').select(count)] ?? `${count} يوم`
}

const messages = {
  fr: {
    intlLocale: 'fr-FR',
    // Put around names and titles, which stay in their own writing direction.
    colon: '\u00a0: ',
    comma: ', ',
    hello: (name: string | null) => (name ? `Bonjour ${name}` : 'Bonjour'),
    loading: 'Chargement…',
    failed: 'Ces informations n’ont pas pu être chargées. Rechargez la page.',
    live: {
      title: 'En direct',
      none: 'Aucun concours en cours ni à venir.',
      open: 'En cours',
      scheduled: 'Bientôt',
      endsToday: 'Se termine aujourd’hui',
      endsTomorrow: 'Se termine demain',
      endsIn: (days: number) => `Se termine dans ${days} jours`,
      opensToday: 'Ouvre aujourd’hui',
      opensTomorrow: 'Ouvre demain',
      opensIn: (days: number) => `Ouvre dans ${days} jours`,
      participations: 'Participations',
      today: 'Aujourd’hui',
      uniquePhones: 'Numéros uniques',
      edit: 'Modifier',
      view: 'Voir la page',
      report: 'Rapport (CSV)',
      newTab: '(nouvel onglet)',
    },
    todo: {
      title: 'À faire',
      none: 'Rien à faire pour le moment.',
      draws: (count: number) => (count === 1 ? '1 tirage à lancer' : `${count} tirages à lancer`),
      winners: (count: number) =>
        count === 1 ? '1 gagnant à publier' : `${count} gagnants à publier`,
      draft: 'Brouillon à compléter',
    },
    actions: {
      title: 'Actions rapides',
      newContest: 'Nouveau concours',
      campaignLink: 'Lien de campagne',
      export: 'Exporter les participations',
      media: 'Médias',
    },
  },
  en: {
    intlLocale: 'en-GB',
    colon: ': ',
    comma: ', ',
    hello: (name: string | null) => (name ? `Hello ${name}` : 'Hello'),
    loading: 'Loading…',
    failed: 'This could not be loaded. Reload the page.',
    live: {
      title: 'Live',
      none: 'No contest open or coming up.',
      open: 'Open',
      scheduled: 'Upcoming',
      endsToday: 'Ends today',
      endsTomorrow: 'Ends tomorrow',
      endsIn: (days: number) => `Ends in ${days} days`,
      opensToday: 'Opens today',
      opensTomorrow: 'Opens tomorrow',
      opensIn: (days: number) => `Opens in ${days} days`,
      participations: 'Participations',
      today: 'Today',
      uniquePhones: 'Unique phones',
      edit: 'Edit',
      view: 'View page',
      report: 'Report (CSV)',
      newTab: '(new tab)',
    },
    todo: {
      title: 'To do',
      none: 'Nothing to do right now.',
      draws: (count: number) => (count === 1 ? '1 draw to run' : `${count} draws to run`),
      winners: (count: number) =>
        count === 1 ? '1 winner to publish' : `${count} winners to publish`,
      draft: 'Draft to complete',
    },
    actions: {
      title: 'Quick actions',
      newContest: 'New contest',
      campaignLink: 'Campaign link',
      export: 'Export participations',
      media: 'Media',
    },
  },
  ar: {
    intlLocale: 'ar-DZ',
    colon: ': ',
    comma: '، ',
    hello: (name: string | null) => (name ? `مرحبًا ${name}` : 'مرحبًا'),
    loading: 'جارٍ التحميل…',
    failed: 'تعذّر تحميل هذه المعلومات. أعد تحميل الصفحة.',
    live: {
      title: 'مباشر',
      none: 'لا توجد مسابقة جارية أو قادمة.',
      open: 'جارية',
      scheduled: 'قريبًا',
      endsToday: 'تنتهي اليوم',
      endsTomorrow: 'تنتهي غدًا',
      endsIn: (days: number) => `تنتهي بعد ${arabicDays(days)}`,
      opensToday: 'تُفتح اليوم',
      opensTomorrow: 'تُفتح غدًا',
      opensIn: (days: number) => `تُفتح بعد ${arabicDays(days)}`,
      participations: 'المشاركات',
      today: 'اليوم',
      uniquePhones: 'أرقام فريدة',
      edit: 'تعديل',
      view: 'عرض الصفحة',
      report: 'التقرير (CSV)',
      newTab: '(علامة تبويب جديدة)',
    },
    todo: {
      title: 'للإنجاز',
      none: 'لا شيء للإنجاز حاليًا.',
      // The count after a colon, so the noun never has to agree with it.
      draws: (count: number) => `سحوبات يجب إجراؤها: ${count}`,
      winners: (count: number) => `فائزون يجب نشرهم: ${count}`,
      draft: 'مسودة يجب إكمالها',
    },
    actions: {
      title: 'إجراءات سريعة',
      newContest: 'مسابقة جديدة',
      campaignLink: 'رابط حملة',
      export: 'تصدير المشاركات',
      media: 'الوسائط',
    },
  },
} satisfies Record<Language, unknown>

export type DashboardMessages = (typeof messages)['fr']

export function dashboardMessages(language: string): DashboardMessages {
  return language in messages ? messages[language as Language] : messages.fr
}
