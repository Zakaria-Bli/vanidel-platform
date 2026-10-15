// Admin texts of the sign-in screen and the navigation, in each admin language.

type Language = 'fr' | 'en' | 'ar'

const messages = {
  fr: {
    loginTitle: 'Espace équipe',
    loginLead: 'Gérez les concours, les participations et les tirages Vanidel.',
    noAccess: 'Pas encore d’accès ? Demandez-le à l’administrateur.',
    viewSite: 'Voir le site',
    newTab: '(s’ouvre dans un nouvel onglet)',
  },
  en: {
    loginTitle: 'Team area',
    loginLead: 'Manage Vanidel contests, participations and draws.',
    noAccess: 'No access yet? Ask the administrator.',
    viewSite: 'View the site',
    newTab: '(opens in a new tab)',
  },
  ar: {
    loginTitle: 'فضاء الفريق',
    loginLead: 'أدِر مسابقات Vanidel ومشاركاتها وسحوباتها.',
    noAccess: 'ليس لديك حساب بعد؟ اطلبه من المسؤول.',
    viewSite: 'عرض الموقع',
    newTab: '(يُفتح في علامة تبويب جديدة)',
  },
} satisfies Record<Language, Record<string, string>>

export type BrandMessages = (typeof messages)['fr']

export function brandMessages(language: string): BrandMessages {
  return language in messages ? messages[language as Language] : messages.fr
}
