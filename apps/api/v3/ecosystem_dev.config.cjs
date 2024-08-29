module.exports = {
  apps: [
    {
      name: 'whatsmenu-api3',
      script: 'pnpm',
      args: 'run dev',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
    },
  ],
}
