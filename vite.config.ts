import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { diagnoseCode, generateRoadmap } from './src/server/geminiService.ts';

dotenv.config();

function devApiPlugin(): Plugin {
  return {
    name: 'devmentor-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (req.method === 'POST' && (url === '/api/diagnose' || url === '/api/roadmap')) {
          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              let parsed: any = {};
              if (rawBody && rawBody.trim()) {
                try {
                  parsed = JSON.parse(rawBody);
                } catch {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
                  return;
                }
              }
              if (url === '/api/diagnose') {
                const result = await diagnoseCode(parsed);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } else if (url === '/api/roadmap') {
                const result = await generateRoadmap(parsed);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              }
            } catch (err: any) {
              console.warn('[Vite Dev API Server Notice]:', err?.message || err);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

