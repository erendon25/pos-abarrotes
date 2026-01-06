import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pos-abarrotes/', // Si tu repositorio es username.github.io, usa '/'. Si es username.github.io/repo-name, usa '/repo-name/'
})
