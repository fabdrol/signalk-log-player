const { LogPlayer } = require('../')()
const { join } = require('path')

const instance = new LogPlayer({
  setRate: 10, // Hz
  path: join(__dirname, '../logs'),
})

instance.on('status', (status) => {
  if (!status.startsWith('Deltas replayed')) {
    console.log(status)
  }

  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`Status: ${status}`)
})

instance.start()
