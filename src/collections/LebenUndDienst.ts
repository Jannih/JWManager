import { type CollectionConfig } from 'payload'

export const LebenUndDienst: CollectionConfig = {
  slug: 'leben-und-dienst',
  admin: {
    useAsTitle: 'datum',
    defaultColumns: ['datum'],
  },
  fields: [
    {
      name: 'datum',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'dd.MM.yyyy',
        },
      },
    },
    {
      name: 'schaetzeAusGottesWort',
      type: 'group',
      label: 'SCHÄTZE AUS GOTTES WORT',
      fields: [
        {
          name: 'aufgabe1',
          type: 'group',
          label: 'Aufgabe 1',
          fields: [
            {
              name: 'text',
              type: 'text',
              label: 'Text',
            },
            {
              name: 'assignedTo',
              type: 'relationship',
              label: 'Zugewiesener Verkündiger',
              relationTo: ['users', 'custom-names'],
              hasMany: false,
            }
          ]
        },
      ],
    },
  ],
} 