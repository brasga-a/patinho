/** biome-ignore-all lint/suspicious/noRedeclare: <explanation> */

import { database } from '@/database/client'
import { schema } from '@/database/schemas/better-auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, username } from 'better-auth/plugins'

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    schema,
    provider: "pg",
    usePlural: true,
    camelCase: false,
    
  }),
  advanced: {
    database: {
      generateId: false
    }
  },
  plugins: [
     username(),
     admin()
  ],
  socialProviders: {
        google: { 
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
})