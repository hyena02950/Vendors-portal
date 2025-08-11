
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => {
  // Load env vars based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isProduction = mode === 'production';
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:3001';

  return {
    // Base path configuration
    base: '/',
    
    // Server configuration
    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: true,
      hmr: {
        protocol: isProduction ? 'wss' : 'ws'
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },

    // Build configuration
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom']
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },

    // Plugins
    plugins: [
      react(),
      mode === 'development' && componentTagger()
    ].filter(Boolean),

    // Resolve aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@assets': path.resolve(__dirname, './src/assets')
      }
    },

    // Environment variables
    define: {
      'process.env': {
        VITE_API_BASE_URL: JSON.stringify(backendUrl),
        VITE_NODE_ENV: JSON.stringify(mode),
        ...Object.fromEntries(
          Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
        )
      }
    }
  };
});
