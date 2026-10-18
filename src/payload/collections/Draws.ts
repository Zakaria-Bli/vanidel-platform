import type { CollectionConfig } from 'payload'

import { isStaff, nobody } from '../access'
import { groups, label } from '../fields/label'
import { readOnly } from '../fields/readOnly'
import { runDraw } from '../endpoints/draws'

/**
 * Audit record of one draw (SPECIFICATION §10.2). Written once by the draw service and never
 * changed or deleted; a re-draw is a new record pointing at the one it replaces.
 */
export const Draws: CollectionConfig = {
  slug: 'draws',
  labels: {
    singular: label('Tirage', 'Draw', 'السحب'),
    plural: label('Tirages', 'Draws', 'السحوبات'),
  },
  admin: {
    hideAPIURL: true,
    group: groups.contests,
    defaultColumns: ['contest', 'periodStart', 'periodEnd', 'eligibleCount', 'executedAt'],
    components: {
      beforeListTable: ['/payload/components/DrawPanel#DrawPanel'],
    },
  },
  endpoints: [runDraw],
  access: {
    read: isStaff,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    // First on the page: who won. Rows open the winner, with the receipt to verify.
    {
      name: 'winners',
      label: label('Gagnants', 'Winners', 'الفائزون'),
      type: 'join',
      collection: 'winners',
      on: 'draw',
      defaultSort: 'rank',
      admin: {
        allowCreate: false,
        defaultColumns: ['rank', 'publicDisplayName', 'participation', 'published', 'voided'],
      },
    },
    ...readOnly([
      {
        name: 'contest',
        label: label('Concours', 'Contest', 'المسابقة'),
        type: 'relationship',
        relationTo: 'contests',
        required: true,
        index: true,
      },
      {
        name: 'periodStart',
        label: label('Début de période', 'Period start', 'بداية الفترة'),
        type: 'date',
        required: true,
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
      {
        name: 'periodEnd',
        label: label(
          'Fin de période (exclue)',
          'Period end (exclusive)',
          'نهاية الفترة (غير مشمولة)',
        ),
        type: 'date',
        required: true,
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
      {
        name: 'poolStart',
        label: label('Participations depuis', 'Entries since', 'المشاركات منذ'),
        type: 'date',
        required: true,
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
          description: label(
            'Le tirage porte sur les participations envoyées entre cette date et la fin de période.',
            'The draw picks among entries submitted from this time to the period end.',
            'يشمل السحب المشاركات المرسلة بين هذا التاريخ ونهاية الفترة.',
          ),
        },
      },
      {
        name: 'status',
        label: label('Statut', 'Status', 'الحالة'),
        type: 'select',
        options: [{ value: 'completed', label: label('Terminé', 'Completed', 'مكتمل') }],
        defaultValue: 'completed',
        required: true,
      },
      {
        name: 'eligibleCount',
        label: label('Participations éligibles', 'Eligible participations', 'المشاركات المؤهلة'),
        type: 'number',
        required: true,
      },
      {
        name: 'poolHash',
        label: label('Empreinte du panier', 'Pool hash', 'بصمة مجموعة المشاركات'),
        type: 'text',
        required: true,
        admin: {
          description: label(
            'SHA-256 de la liste ordonnée des participations éligibles.',
            'SHA-256 of the ordered list of eligible participation IDs.',
            'بصمة SHA-256 للقائمة المرتبة لمعرّفات المشاركات المؤهلة.',
          ),
        },
      },
      {
        name: 'executedAt',
        label: label('Exécuté le', 'Executed at', 'نُفّذ في'),
        type: 'date',
        required: true,
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
      {
        name: 'executedBy',
        label: label('Exécuté par', 'Executed by', 'نُفّذ من طرف'),
        type: 'relationship',
        relationTo: 'users',
        required: true,
      },
      {
        name: 'algorithmVersion',
        label: label('Version de l’algorithme', 'Algorithm version', 'إصدار الخوارزمية'),
        type: 'text',
        required: true,
      },
      { name: 'randomnessMetadata', label: label('Aléa', 'Randomness', 'العشوائية'), type: 'json' },
      {
        name: 'redrawOf',
        label: label('Remplace le tirage', 'Re-draw of', 'إعادة سحب لـ'),
        type: 'relationship',
        relationTo: 'draws',
      },
    ]),
  ],
}
