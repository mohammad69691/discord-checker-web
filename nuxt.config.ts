import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
  head: {
    meta: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1',
      },
      { name: 'robots', content: 'index,follow' },
      { name: 'theme-color', content: '#5865F2' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },
  modules: ['@nuxtjs/color-mode', '@nuxtjs/tailwindcss', '@unocss/nuxt'],
  colorMode: {
    classSuffix: '',
    preference: 'dark',
  },
  tailwindcss: {
    viewer: false,
  },
  unocss: {
    preflight: false,
    uno: false,
    icons: {
      scale: 1.3,
    },
    attributify: false,
  },
});
