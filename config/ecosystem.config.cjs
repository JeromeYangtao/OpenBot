const path = require('node:path');
const config = require('./env.json');

const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'openbot',
      script: 'dist/src/main.js',
      cwd: projectRoot,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || config.port,
      },
    },
  ],
};
