import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      meta: [
        {
          name: 'description',
          content: 'A fast, web-based Discord token checker. Find verified, unverified and nitro accounts easily.',
        },
        { name: 'keywords', content: 'Discord, Discord Tokens, Token Stealer, Token Checker, Discord Tools' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#5865F2' },
        { property: 'og:title', content: 'Online Discord Token Checker' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Discord Token Checker' },
        {
          property: 'og:description',
          content: 'A fast, web-based Discord token checker. Find verified, unverified and nitro accounts easily.',
        },
        { name: 'twitter:title', content: 'Online Discord Token Checker' },
        {
          name: 'twitter:description',
          content: 'A fast, web-based Discord token checker. Find verified, unverified and nitro accounts easily.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: ['@nuxtjs/color-mode', '@nuxtjs/tailwindcss'],
  css: ['@fortawesome/fontawesome-svg-core/styles.css'],
  colorMode: {
    classSuffix: '',
    preference: 'dark',
  },
  tailwindcss: {
    viewer: false,
  },
  build: {
    transpile: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/vue-fontawesome',
    ],
  },
  runtimeConfig: {
    public: {
      ANALYTICS_URL: process.env.ANALYTICS_URL,
      GATEWAY_URL: process.env.GATEWAY_URL || 'https://discord.com/api/v9',
    },
  },
});
