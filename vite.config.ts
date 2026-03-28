import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    // Safely expose process.env.API_KEY to the client
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  }
})