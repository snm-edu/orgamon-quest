/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: "/orgamon-quest/",
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
