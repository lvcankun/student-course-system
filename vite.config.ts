import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import importToCDN from 'vite-plugin-cdn-import';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    importToCDN({
      modules: [
        {
          name: 'dayjs',
          var: 'dayjs',
          path: 'https://unpkg.com/dayjs@1.11.13/dayjs.min.js',
        },
        {
          name: 'axios',
          var: 'axios',
          path: 'https://unpkg.com/axios@1.7.7/dist/axios.min.js',
        },
        {
          name: 'echarts',
          var: 'echarts',
          path: 'https://unpkg.com/echarts@5.5.1/dist/echarts.min.js',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'data-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
          }
        },
      },
    },
  },
});
