const LogPlayer = require('./lib/log-player')

module.exports = function signalkLogPlayer(app) {
  const plugin = {}
  let _instance = null

  plugin.status = LogPlayer.STATUS
  plugin.LogPlayer = LogPlayer
  plugin.id = 'signalk-log-player'
  plugin.name = 'Signal K Delta Log Player'
  plugin.description = `${plugin.name} - replays log files containing a single SK delta per line`

  plugin.schema = {
    type: 'object',
    required: ['setRate', 'path'],
    properties: {
      setRate: {
        type: 'number',
        title: 'Update rate (Hz)',
        default: 6,
      },
      path: {
        type: 'string',
        title: 'Absolute path to the log file folder',
        default: '/signalk/logs',
      },
    },
  }

  plugin.start = function (options) {
    if (_instance !== null) {
      plugin.stop()
    }

    const opts = {
      setRate: 6,
      path: '',
    }

    if (options && typeof options === 'object') {
      if (typeof options.setRate === 'number') {
        opts.setRate = options.setRate
      }

      if (typeof options.path === 'string' && options.path.startsWith('/')) {
        opts.setRate = options.path
      }
    }

    _instance = new plugin.LogPlayer(opts)

    _instance.on('delta', (delta) => {
      app.handleMessage(plugin.id, delta)
    })

    _instance.on('status', (status) => {
      app.setProviderStatus(
        `${plugin.STATUS[status.status]}${status.data === '' ? '' : `: ${status.data}`}`
      )
    })

    _instance.start()
  }

  plugin.stop = function () {
    if (_instance === null) {
      return
    }
    _instance.stop()
  }

  return plugin
}
