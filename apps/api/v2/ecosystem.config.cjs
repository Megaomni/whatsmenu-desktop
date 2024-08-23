module.exports = {
  apps: [
    {
      name: 'whatsmenu-api2',
      script: 'npm',
      args: 'start',
      combine_logs: true,
      time: true,
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
    },
  ],
}
//
