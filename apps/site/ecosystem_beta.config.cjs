module.exports = {
  apps: [
    {
      name: "homosite",
      script: "npm",
      args: "start",
      combine_logs: true,
      time: true,
      max_memory_restart: "1G",
    },
  ],
};
