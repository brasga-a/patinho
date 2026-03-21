/** biome-ignore-all lint/suspicious/noRedeclare: <explanation> */

import { database } from '@/database/client'
import { schema } from '@/database/schemas/better-auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, emailOTP, magicLink, username } from 'better-auth/plugins'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API)

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
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: 'noreply@skelware.com',
          to: email,
          subject: 'Seu link de acesso',
          html: `
                <div>
                  <h2>Patinho</h2>
                  <p>Clique <a href="${url}">aqui</a> para acessar sua conta.</p>
                </div>
          `,
        })
      }
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? "Seu código de acesso"
            : type === "email-verification"
              ? "Verificação de email"
              : "Redefinição de senha"

        await resend.emails.send({
          from: 'noreply@yourdomain.com',
          to: email,
          subject,
          html: `<p>Seu código é: <strong>${otp}</strong></p>`,
        })
      },
    })
  ],
  accountLinking: {
    enabled: true,
    trustedProviders: ["google"],
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // disableSignUp: true,
    },
  },

})