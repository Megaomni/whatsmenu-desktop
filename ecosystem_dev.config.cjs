module.exports = {
  apps: [
    {
      name: 'whatsmenu-api2',
      script: 'adonis',
      args: 'serve --dev',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
    },
  ],
}
