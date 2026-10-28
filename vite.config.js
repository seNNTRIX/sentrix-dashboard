import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, process.cwd(), 'SENTRIX_');
 const proxy = { '/api': { target: env.SENTRIX_API_TARGET || 'http://127.0.0.1:8080', changeOrigin: true } };
 return { server: { proxy }, preview: { proxy } };
});
