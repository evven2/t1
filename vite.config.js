import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/t1/',
  plugins: [react()],
  server: {
    port: 3000,
  },
})
