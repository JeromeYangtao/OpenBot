import { defineConfig } from "umi";

export default defineConfig({
  outputPath: process.env.OPENBOT_DEPLOY === 'true' ? '../public' : 'dist',
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
  utoopack: {},
});
