module.exports = {
  apps: [
    {
      name: 'whatsmenu-api3-beta',
      script: './build/bin/server.js',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
    },
  ],
}
