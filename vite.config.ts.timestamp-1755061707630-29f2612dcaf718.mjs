// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const isProduction = mode === "production";
  const backendUrl = env.VITE_API_BASE_URL || "http://localhost:3001";
  return {
    // Base path configuration
    base: "/",
    // Server configuration
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      hmr: {
        protocol: isProduction ? "wss" : "ws"
      },
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path2) => path2
        }
      }
    },
    // Build configuration
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"]
          },
          assetFileNames: "assets/[name]-[hash][extname]",
          entryFileNames: "assets/[name]-[hash].js"
        }
      }
    },
    // Plugins
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    // Resolve aliases
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        "@components": path.resolve(__vite_injected_original_dirname, "./src/components"),
        "@assets": path.resolve(__vite_injected_original_dirname, "./src/assets")
      }
    },
    // Environment variables
    define: {
      "process.env": {
        VITE_API_BASE_URL: JSON.stringify(backendUrl),
        VITE_NODE_ENV: JSON.stringify(mode),
        ...Object.fromEntries(
          Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
        )
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3Yyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gJ2xvdmFibGUtdGFnZ2VyJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiB2YXJzIGJhc2VkIG9uIG1vZGVcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnVklURV8nKTtcbiAgY29uc3QgaXNQcm9kdWN0aW9uID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICBjb25zdCBiYWNrZW5kVXJsID0gZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnO1xuXG4gIHJldHVybiB7XG4gICAgLy8gQmFzZSBwYXRoIGNvbmZpZ3VyYXRpb25cbiAgICBiYXNlOiAnLycsXG4gICAgXG4gICAgLy8gU2VydmVyIGNvbmZpZ3VyYXRpb25cbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIHByb3RvY29sOiBpc1Byb2R1Y3Rpb24gPyAnd3NzJyA6ICd3cydcbiAgICAgIH0sXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGJhY2tlbmRVcmwsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBCdWlsZCBjb25maWd1cmF0aW9uXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgICBzb3VyY2VtYXA6ICFpc1Byb2R1Y3Rpb24sXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgcmVhY3Q6IFsncmVhY3QnLCAncmVhY3QtZG9tJ11cbiAgICAgICAgICB9LFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nLFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gUGx1Z2luc1xuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpXG4gICAgXS5maWx0ZXIoQm9vbGVhbiksXG5cbiAgICAvLyBSZXNvbHZlIGFsaWFzZXNcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgICAnQGNvbXBvbmVudHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpLFxuICAgICAgICAnQGFzc2V0cyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9hc3NldHMnKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudic6IHtcbiAgICAgICAgVklURV9BUElfQkFTRV9VUkw6IEpTT04uc3RyaW5naWZ5KGJhY2tlbmRVcmwpLFxuICAgICAgICBWSVRFX05PREVfRU5WOiBKU09OLnN0cmluZ2lmeShtb2RlKSxcbiAgICAgICAgLi4uT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGVudikubWFwKChba2V5LCB2YWxdKSA9PiBbYHByb2Nlc3MuZW52LiR7a2V5fWAsIEpTT04uc3RyaW5naWZ5KHZhbCldKVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLE9BQU87QUFDaEQsUUFBTSxlQUFlLFNBQVM7QUFDOUIsUUFBTSxhQUFhLElBQUkscUJBQXFCO0FBRTVDLFNBQU87QUFBQTtBQUFBLElBRUwsTUFBTTtBQUFBO0FBQUEsSUFHTixRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsUUFDSCxVQUFVLGVBQWUsUUFBUTtBQUFBLE1BQ25DO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixTQUFTLENBQUNBLFVBQVNBO0FBQUEsUUFDckI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsTUFDYixXQUFXLENBQUM7QUFBQSxNQUNaLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLE9BQU8sQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM5QjtBQUFBLFVBQ0EsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBO0FBQUEsSUFHaEIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLFFBQ3BDLGVBQWUsS0FBSyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLFFBQ3pELFdBQVcsS0FBSyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUNuRDtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsUUFBUTtBQUFBLE1BQ04sZUFBZTtBQUFBLFFBQ2IsbUJBQW1CLEtBQUssVUFBVSxVQUFVO0FBQUEsUUFDNUMsZUFBZSxLQUFLLFVBQVUsSUFBSTtBQUFBLFFBQ2xDLEdBQUcsT0FBTztBQUFBLFVBQ1IsT0FBTyxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLEtBQUssVUFBVSxHQUFHLENBQUMsQ0FBQztBQUFBLFFBQ3JGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
