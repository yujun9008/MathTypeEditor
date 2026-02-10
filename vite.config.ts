import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      fileName: (format) => `math-type-editor.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'antd', 'katex', 'mathlive'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          antd: 'antd',
          katex: 'katex',
          mathlive: 'mathlive',
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true, // 自动打开浏览器
  },
})