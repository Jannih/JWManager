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
              name: 'assignedUser',
              type: 'select',
              label: 'Zugewiesener Verkündiger',
              hasMany: false,
              options: async ({ payload }) => {
                const users = await payload.find({
                  collection: 'users',
                })
                return users.docs.map(user => ({
                  label: user.name || user.email,  // Adjust based on what field you want to show
                  value: user.id,
                }))
              },
              allowCustomValue: true,  // This allows entering custom text
            }
          ]
        },
      ],
    },
  ],
} 