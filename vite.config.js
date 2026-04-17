import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Prueba de commit y push desde Antigravity
export default defineConfig({
  plugins: [react()],
  base: '/',
})
