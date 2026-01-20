/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: '/', // Changed back to '/' as it's more standard for SPA routing unless subpath is required
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@shared': path.resolve(__dirname, '../shared'),
            }
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/vitest.setup.ts',
            css: true, 
        },
    };
});
