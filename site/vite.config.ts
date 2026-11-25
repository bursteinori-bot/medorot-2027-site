import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mockApi } from './dev/mockApi'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.MOCK_API ? [mockApi()] : [])],
  server: { port: 5273 },
})
