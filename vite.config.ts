import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [solidPlugin(), wasm(), topLevelAwait()],
  build: {
    target: 'es6',
    polyfillDynamicImport: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use 'sass:math';
          @import './src/styles/base/_all.scss';
        `,
      },
    },
  },
})
