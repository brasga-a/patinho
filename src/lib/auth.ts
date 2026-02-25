/** biome-ignore-all lint/suspicious/noRedeclare: <explanation> */

import { database } from '@/database/client'
import { schema } from '@/database/schemas/better-auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, emailOTP, username } from 'better-auth/plugins'

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
    admin(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          // Send the OTP for sign in
        } else if (type === "email-verification") {
          // Send the OTP for email verification
        } else {
          // Send the OTP for password reset
        }
      },
    })
  ],
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // disableSignUp: true,
    },
  },

})