import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(), // CSS 会被注入到 JS 中，用户无需单独导入
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@src': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MathTypeEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : 'cjs'}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'antd', 'katex', 'mathlive', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd',
          katex: 'katex',
          mathlive: 'mathlive',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css'
          return assetInfo.name || ''
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true, // 自动打开浏览器
  },
})