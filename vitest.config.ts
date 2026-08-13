import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import type { PluginOption, ViteDevServer } from 'vite';

/**
 * --------------------------
 * Build-time SW assets list
 * --------------------------
 */
const generateSWAssetsPlugin = () => {
  interface AssetBundle {
    [fileName: string]:
      | import('rollup').OutputAsset
      | import('rollup').OutputChunk;
  }

  return {
    name: 'generate-sw-assets',
    generateBundle(
      this: import('rollup').PluginContext,
      _outputOptions: import('rollup').OutputOptions,
      bundle: AssetBundle
    ) {
      const assetUrls: string[] = [];

      for (const fileName in bundle) {
        if (
          fileName.startsWith('assets/') &&
          (fileName.endsWith('.js') ||
            fileName.endsWith('.css') ||
            /\.(woff2?|ttf|eot|svg|png|jpe?g|gif|webp)$/.test(fileName))
        ) {
          assetUrls.push('/' + fileName);
        }
      }

      const outputPath = path.resolve(__dirname, 'dist', 'sw-assets.json');
      fs.writeFileSync(outputPath, JSON.stringify(assetUrls, null, 2));
      console.log(`🛠️  Generated sw-assets.json with ${assetUrls.length} assets`);
    },
  };
};

/**
 * --------------------------
 * Dev middleware to serve SW
 * --------------------------
 */
const serveOfflineAssetsPlugin = (): PluginOption => {
  return {
    name: 'serve-offline-assets',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/sw-assets.json') {
          const filePath = path.resolve(__dirname, 'dist', 'sw-assets.json');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(filePath));
            return;
          }
        }

        if (req.url === '/service-worker.js') {
          const filePath = path.resolve(__dirname, 'public', 'service-worker.js');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/javascript');
            res.end(fs.readFileSync(filePath));
            return;
          }
        }

        next();
      });
    },
  };
};

export default defineConfig({
  plugins: [vue(), generateSWAssetsPlugin(), serveOfflineAssetsPlugin()],
  server: { fs: { allow: ['.'] }, middlewareMode: false },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
      external: [],
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',

    // keep mocks tidy between tests
    clearMocks: true,
    restoreMocks: true,

    // 🔇 filter the jsdom XHR AggregateError noise
    onConsoleLog(log, type) {
      if (
        type === 'stderr' &&
        (log.includes('XMLHttpRequest-impl.js') ||
          log.includes('xhr-utils.js') ||
          log.includes('helpers/http-request.js')) &&
        log.includes('AggregateError')
      ) {
        return false; // suppress
      }
    },

    coverage: {
      // Let CI turn coverage on via script; locally you can run `npm run test:coverage`
      enabled: false,
      provider: 'c8', // set provider here; don't pass via CLI
      reporter: ['text', 'lcov', 'json-summary', 'html'],
      reportsDirectory: './coverage',
     exclude: [
      'node_modules/**',
      'dist/**',
      'src/shared/service-proxies/base-service-proxy.ts',
      'src/shared/service-proxies/service-proxies.ts',
      'src/shared/service-proxies/injectBaseApiClientImport.ts'
    ]
    },
    // reporters: ['default'], // keep commented so CI can pass --reporter
  },
});