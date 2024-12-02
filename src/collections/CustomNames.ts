import { type CollectionConfig } from 'payload'

export const CustomNames: CollectionConfig = {
  slug: 'custom-names',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
} 