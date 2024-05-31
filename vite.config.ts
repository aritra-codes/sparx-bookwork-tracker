import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'popup.html',
        contentScript: 'src/contentScript.ts',
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (['contentScript', 'background'].includes(chunkInfo.name)) {
            return '[name].js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
