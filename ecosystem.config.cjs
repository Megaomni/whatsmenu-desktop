module.exports = {
  apps: [
    {
      name: 'ifood-integrations-service',
      script: './build/bin/server.js',
      combine_logs: true,
      time: true,
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
    },
  ],
}
