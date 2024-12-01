import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import { LebenUndDienst } from './src/collections/LebenUndDienst'

export default buildConfig({
  editor: lexicalEditor(),
  collections: [LebenUndDienst],
  secret: process.env.PAYLOAD_SECRET || '',
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || ''
  }),
  sharp,
})
