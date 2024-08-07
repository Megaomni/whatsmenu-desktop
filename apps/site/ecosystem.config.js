module.exports = {
  apps : [{
    name: 'site',
    script: 'server.js',
    watch: false,
    instances : "max",
    exec_mode : "cluster"
  }]
};
