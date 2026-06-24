module.exports = {
  apps: [
    {
      name: "marketplace-infographic",
      cwd: "./marketplace-infographic",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/marketplace-err.log",
      out_file: "./logs/marketplace-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
