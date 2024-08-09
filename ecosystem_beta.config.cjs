module.exports = {
  apps: [
    {
      name: 'ifood-integrations-service-beta',
      script: './build/bin/server.js',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
    },
  ],
}
