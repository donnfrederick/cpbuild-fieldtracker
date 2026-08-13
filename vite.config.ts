import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite'; // Use Vite's version by default
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import type { PluginOption, ViteDevServer } from 'vite';

const generateSWAssetsPlugin = () => {
  interface AssetBundle {
    [fileName: string]: import('rollup').OutputAsset | import('rollup').OutputChunk;
  }

  return {
    name: 'generate-sw-assets',
    generateBundle(
      this: import('rollup').PluginContext,
      _outputOptions: import('rollup').OutputOptions,
      bundle: AssetBundle
    ): void {
      const assetUrls: string[] = [];

      for (const fileName in bundle) {
        if (
          fileName.startsWith('assets/') &&
          (fileName.endsWith('.js') || fileName.endsWith('.css') || /\.(woff2?|ttf|eot|svg|png|jpe?g|gif|webp)$/.test(fileName))
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

export default async () => {
  const isTest = process.env.NODE_ENV === 'test';

  const baseConfig = {
    plugins: [
      vue(),
      generateSWAssetsPlugin(),
      serveOfflineAssetsPlugin(),
    ],
    server: {
      fs: {
        allow: ['.'],
      },
      middlewareMode: false,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
        external: [],
      },
    },
  };

  if (isTest) {
    const { defineConfig: defineVitestConfig } = await import('vitest/config');
    return defineVitestConfig({
      ...baseConfig,
      test: {
        coverage: {
          provider: 'istanbul',
          reporter: ['text', 'json', 'json-summary', 'html'],
          reportsDirectory: './coverage',
        },
        reporters: ['default', 'html'],
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
      },
    });
  }

  return defineConfig(baseConfig);
};