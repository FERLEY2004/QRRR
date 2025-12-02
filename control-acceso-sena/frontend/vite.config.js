import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // abre el navegador por defecto al iniciar el dev server
  },
})

