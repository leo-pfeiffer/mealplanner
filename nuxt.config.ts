// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    public: {
        appURL: process.env.APP_URL,
        geminiAPIKey: process.env.GEMINI_API_KEY,
        mailjetAPIKey: process.env.MAILJET_API_KEY,
        mailjetSecretKey: process.env.MAILJET_SECRET_KEY,
        mailjetUrl: process.env.MAILJET_URL,
        mailjetFromEmail: process.env.MAILJET_FROM_EMAIL,
    }
  },
})
