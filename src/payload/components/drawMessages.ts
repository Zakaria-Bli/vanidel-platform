import type { DrawErrorCode } from '@/modules/contests/services/draws'

// Admin texts of the draw panel and the re-draw field, in each admin language.

type Language = 'fr' | 'en' | 'ar'

const messages = {
  fr: {
    title: 'Lancer un tirage',
    help: 'Seules les périodes terminées peuvent être tirées, une seule fois chacune. Les participations éligibles sont celles envoyées pendant la période (heure d’Alger).',
    period: 'Période',
    choose: 'Choisir une période…',
    week: 'Période',
    drawn: 'déjà tirée',
    noPeriod: 'Aucune période terminée pour le moment.',
    run: 'Lancer le tirage',
    running: 'Tirage en cours…',
    confirmRun: 'Lancer le tirage de cette période ? Il ne pourra pas être refait.',
    redrawTitle: 'Annuler et retirer au sort',
    redrawHelp:
      'Annule ce gagnant (le tirage d’origine reste inchangé) et tire un remplaçant parmi les participations de la même période qui n’ont jamais gagné.',
    reason: 'Motif de l’annulation',
    redraw: 'Annuler et retirer au sort',
    confirmRedraw: 'Annuler ce gagnant et tirer un remplaçant ? Cette action est définitive.',
    failed: 'Le tirage a échoué. Réessayez.',
    verifyTitle: 'Vérification',
    verifyHelp:
      'La participation tirée, telle qu’envoyée. Vérifiez que le ticket montre bien un produit Vanidel acheté pendant la période.',
    entryName: 'Nom',
    entryPhone: 'Téléphone',
    entryWilaya: 'Wilaya',
    entrySubmittedAt: 'Envoyée le',
    receipt: 'Ticket de caisse',
    openReceipt: 'Ouvrir en taille réelle',
    noReceipt: 'Ticket introuvable.',
    errors: {
      'contest-not-found': 'Concours introuvable.',
      'period-not-found':
        'Cette période n’existe plus : les réglages du concours ont changé. Rechargez la page.',
      'period-not-ended': 'Cette période n’est pas encore terminée.',
      'already-drawn': 'Cette période, ou une partie, a déjà été tirée.',
      'empty-pool': 'Aucune participation éligible pour cette période.',
      'winner-not-found': 'Gagnant introuvable.',
      'winner-voided': 'Ce gagnant est déjà annulé.',
      'reason-required': 'Indiquez le motif de l’annulation.',
    },
  },
  en: {
    title: 'Run a draw',
    help: 'Only ended periods can be drawn, once each. Eligible participations are those submitted during the period (Algiers time).',
    period: 'Period',
    choose: 'Choose a period…',
    week: 'Period',
    drawn: 'already drawn',
    noPeriod: 'No period has ended yet.',
    run: 'Run the draw',
    running: 'Drawing…',
    confirmRun: 'Run the draw for this period? It cannot be run again.',
    redrawTitle: 'Void and re-draw',
    redrawHelp:
      'Voids this winner (the original draw stays unchanged) and draws a replacement among the same period’s participations that have never won.',
    reason: 'Reason for voiding',
    redraw: 'Void and re-draw',
    confirmRedraw: 'Void this winner and draw a replacement? This cannot be undone.',
    failed: 'The draw failed. Try again.',
    verifyTitle: 'Verification',
    verifyHelp:
      'The drawn participation, as submitted. Check that the receipt shows a Vanidel product bought during the period.',
    entryName: 'Name',
    entryPhone: 'Phone',
    entryWilaya: 'Wilaya',
    entrySubmittedAt: 'Submitted at',
    receipt: 'Receipt',
    openReceipt: 'Open full size',
    noReceipt: 'Receipt not found.',
    errors: {
      'contest-not-found': 'Contest not found.',
      'period-not-found':
        'This period no longer exists: the contest settings changed. Reload the page.',
      'period-not-ended': 'This period has not ended yet.',
      'already-drawn': 'This period, or part of it, has already been drawn.',
      'empty-pool': 'No eligible participation for this period.',
      'winner-not-found': 'Winner not found.',
      'winner-voided': 'This winner is already voided.',
      'reason-required': 'Enter the reason for voiding.',
    },
  },
  ar: {
    title: 'إجراء سحب',
    help: 'لا يمكن السحب إلا على الفترات المنتهية، ومرة واحدة لكل فترة. المشاركات المؤهلة هي التي أُرسلت خلال الفترة (بتوقيت الجزائر).',
    period: 'الفترة',
    choose: 'اختر فترة…',
    week: 'الفترة',
    drawn: 'تم السحب',
    noPeriod: 'لم تنته أي فترة بعد.',
    run: 'إجراء السحب',
    running: 'جارٍ السحب…',
    confirmRun: 'إجراء السحب لهذه الفترة؟ لا يمكن إعادته.',
    redrawTitle: 'إلغاء وإعادة السحب',
    redrawHelp:
      'يلغي هذا الفائز (يبقى السحب الأصلي دون تغيير) ويسحب بديلًا من مشاركات الفترة نفسها التي لم تفز من قبل.',
    reason: 'سبب الإلغاء',
    redraw: 'إلغاء وإعادة السحب',
    confirmRedraw: 'إلغاء هذا الفائز وسحب بديل؟ لا يمكن التراجع عن ذلك.',
    failed: 'فشل السحب. حاول مرة أخرى.',
    verifyTitle: 'التحقق',
    verifyHelp:
      'المشاركة المسحوبة كما أُرسلت. تحقّق من أن التذكرة تُظهر منتج Vanidel تم شراؤه خلال الفترة.',
    entryName: 'الاسم',
    entryPhone: 'الهاتف',
    entryWilaya: 'الولاية',
    entrySubmittedAt: 'أُرسلت في',
    receipt: 'تذكرة الشراء',
    openReceipt: 'فتح بالحجم الكامل',
    noReceipt: 'التذكرة غير موجودة.',
    errors: {
      'contest-not-found': 'المسابقة غير موجودة.',
      'period-not-found': 'هذه الفترة لم تعد موجودة: تغيّرت إعدادات المسابقة. أعد تحميل الصفحة.',
      'period-not-ended': 'هذه الفترة لم تنته بعد.',
      'already-drawn': 'تم السحب على هذه الفترة أو على جزء منها من قبل.',
      'empty-pool': 'لا توجد مشاركات مؤهلة في هذه الفترة.',
      'winner-not-found': 'الفائز غير موجود.',
      'winner-voided': 'هذا الفائز ملغى من قبل.',
      'reason-required': 'أدخل سبب الإلغاء.',
    },
  },
} satisfies Record<Language, { errors: Record<DrawErrorCode, string> } & Record<string, unknown>>

export type DrawMessages = (typeof messages)['fr']

export function drawMessages(language: string): DrawMessages {
  return language in messages ? messages[language as Language] : messages.fr
}

/** The message for an endpoint's error response, or the generic failure. */
export function drawErrorMessage(t: DrawMessages, code: unknown): string {
  return typeof code === 'string' && code in t.errors ? t.errors[code as DrawErrorCode] : t.failed
}
