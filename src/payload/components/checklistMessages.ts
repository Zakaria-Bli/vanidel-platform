import type { ChecklistItemId } from '@/modules/contests/domain/checklist'

// Admin texts of the contest publish checklist, in each admin language.

type Language = 'fr' | 'en' | 'ar'

interface Messages {
  title: string
  help: string
  saveFirst: string
  required: string
  ready: string
  items: Record<ChecklistItemId, string>
  missing: Record<string, string>
}

const messages: Record<Language, Messages> = {
  fr: {
    title: 'Avant de publier',
    help: 'Mis à jour à chaque enregistrement. Utilisez « Aperçu » pour voir la page.',
    saveFirst: 'Enregistrez le brouillon pour voir ce qu’il reste à faire.',
    required: 'obligatoire',
    ready: 'Tout est prêt.',
    items: {
      translations: 'Textes en français et en arabe',
      steps: 'Au moins une étape « Comment participer »',
      consents: 'Consentements règlement et données, obligatoires',
      dates: 'Dates de début et de fin à venir',
      hero: 'Visuel principal',
      regulation: 'Règlement PDF dans chaque langue',
      prizes: 'Au moins un lot',
      shareImage: 'Image de partage (ou visuel principal)',
      seoDescription: 'Description SEO dans chaque langue',
    },
    missing: {
      fr: 'français',
      ar: 'arabe',
      order: 'la fin doit suivre le début',
      ended: 'la date de fin est passée',
      regulation: 'règlement',
      dataProcessing: 'données',
    },
  },
  en: {
    title: 'Before publishing',
    help: 'Updated on every save. Use "Preview" to see the page.',
    saveFirst: 'Save the draft to see what is left to do.',
    required: 'required',
    ready: 'Everything is ready.',
    items: {
      translations: 'Texts in French and Arabic',
      steps: 'At least one "How to take part" step',
      consents: 'Regulation and data consents, required',
      dates: 'Start and end dates ahead',
      hero: 'Hero image',
      regulation: 'Regulation PDF in each language',
      prizes: 'At least one prize',
      shareImage: 'Share image (or hero image)',
      seoDescription: 'SEO description in each language',
    },
    missing: {
      fr: 'French',
      ar: 'Arabic',
      order: 'the end must come after the start',
      ended: 'the end date has passed',
      regulation: 'regulation',
      dataProcessing: 'data',
    },
  },
  ar: {
    title: 'قبل النشر',
    help: 'يُحدَّث عند كل حفظ. استعمل «معاينة» لرؤية الصفحة.',
    saveFirst: 'احفظ المسودة لرؤية ما تبقّى.',
    required: 'إلزامي',
    ready: 'كل شيء جاهز.',
    items: {
      translations: 'النصوص بالفرنسية والعربية',
      steps: 'خطوة «كيفية المشاركة» واحدة على الأقل',
      consents: 'موافقتا النظام والبيانات، إلزاميتان',
      dates: 'تاريخا البداية والنهاية قادمان',
      hero: 'الصورة الرئيسية',
      regulation: 'نظام المسابقة PDF بكل لغة',
      prizes: 'جائزة واحدة على الأقل',
      shareImage: 'صورة المشاركة (أو الصورة الرئيسية)',
      seoDescription: 'وصف تحسين محركات البحث بكل لغة',
    },
    missing: {
      fr: 'الفرنسية',
      ar: 'العربية',
      order: 'يجب أن تأتي النهاية بعد البداية',
      ended: 'تاريخ النهاية قد مضى',
      regulation: 'النظام',
      dataProcessing: 'البيانات',
    },
  },
}

export type ChecklistMessages = Messages

export function checklistMessages(language: string): ChecklistMessages {
  return language in messages ? messages[language as Language] : messages.fr
}
