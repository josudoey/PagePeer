// @ts-check
import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'

import react from '@astrojs/react'

import tailwindcss from '@tailwindcss/vite'

const env = loadEnv('', process.cwd(), '')
const base = env.ASTRO_BASE ?? '/'

// https://astro.build/config
export default defineConfig({
  base,
  srcDir: './app',
  integrations: [react()],
  server: {
    host: '0.0.0.0'
  },

  vite: {
    plugins: [tailwindcss()]
  }
})


