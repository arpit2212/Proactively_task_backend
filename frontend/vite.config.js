import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
     tailwindcss(),
     

  ],
   server: {
    host: true, // or use '192.168.246.76'
  }
})
