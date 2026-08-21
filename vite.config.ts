import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'zustand'],
          'three-core': ['three', '@react-three/fiber', '@react-three/drei'],
          'three-fx': ['@react-three/postprocessing', 'postprocessing'],
        },
      },
    },
  },
})
