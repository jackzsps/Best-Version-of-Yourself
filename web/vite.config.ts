/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const port = parseInt(process.env.PORT || env.PORT || '9002');
    
    return {
        base: '/',
        server: {
            port: port,
            host: '0.0.0.0',
            strictPort: true, // Fail if port is already in use
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
