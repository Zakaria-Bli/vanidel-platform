import { createCn } from 'cn/config'

/**
 * Joins class names and resolves Tailwind conflicts. The type roles from globals.css (`text-h1`,
 * `text-body`…) are declared as font sizes, or a colour such as `text-primary` would drop them.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'h1',
            'h2',
            'h3',
            'eyebrow',
            'body-lg',
            'body',
            'small',
            'caption',
            'label',
            'button',
          ],
        },
      ],
    },
  },
})
