import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        __SENTRY_RELEASE__: JSON.stringify(process.env.SENTRY_RELEASE || 'development'),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: './',
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    maplibre: ['maplibre-gl', 'react-map-gl'],
                },
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            reportsDirectory: 'coverage',
        },
    },
});
