import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Vite options tailored for Tauri development
  clearScreen: false,

  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@splice/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@splice/types": path.resolve(__dirname, "../../packages/types/src"),
      "@splice/validation": path.resolve(__dirname, "../../packages/validation/src"),
      "@splice/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },
})
