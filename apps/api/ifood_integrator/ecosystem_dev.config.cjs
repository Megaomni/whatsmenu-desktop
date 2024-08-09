module.exports = {
  apps: [
    {
      name: 'ifood-integrations-service',
      script: 'pnpm',
      args: 'run dev',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
    },
  ],
}
