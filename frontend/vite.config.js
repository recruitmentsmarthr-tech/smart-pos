import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react' // Changed this to the standard one

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // This enables automatic updates on Windows
    },
  },
})