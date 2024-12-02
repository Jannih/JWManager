import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import { LebenUndDienst } from './src/collections/LebenUndDienst'
import { CustomNames } from './src/collections/CustomNames'

export default buildConfig({
  editor: lexicalEditor(),
  collections: [
    LebenUndDienst,
    CustomNames
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    autoPluralization: false
  }),
  sharp,
})
