import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGHPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  plugins: [react()],
  base: isGHPages ? '/Revision-Rack/' : '/',
  server: {
    port: 3000
  }
})
