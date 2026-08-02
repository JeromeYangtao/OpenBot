import { defineConfig } from "umi";

export default defineConfig({
  outputPath: process.env.OPENBOT_DEPLOY === 'true' ? '../public' : 'dist',
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5005',
      changeOrigin: true,
    },
  },
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
  utoopack: {},
});
