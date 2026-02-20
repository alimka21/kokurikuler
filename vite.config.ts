import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'components': '/components',
      'contexts': '/contexts',
      'store': '/store',
      'utils': '/utils',
      'services': '/services',
      'constants': '/constants.tsx',
      'types': '/types.ts',
    },
  },
  build: {
    outDir: 'dist',
  }
})