/**
 * signalk-calypso-ultrasonic
 *
 * @description   Signal K node.js server plugin to configure and read data from
 *                a Calypso Instruments wireless (BLE) ultrasonic anemometer
 * @module        signalk-calypso-ultrasonic
 * @author        Fabian Tollenaar <fabian@decipher.industries> (https://decipher.industries)
 * @copyright     Fabian Tollenaar, Decipher Industries & the Signal K organisation, 2018
 * @license       Apache-2.0
 */

const EventEmitter = require('events')
const debug = require('debug')('signalk-log-player')
const lineByLine = require('n-readlines')
const { join } = require('path')
const fs = require('fs')

const EStatus = {
  NO_LOG_FILES: 'No logfiles found in the given folder',
  NO_ACCESS: "Can't access the folder with the log files",
  INITIALISING: 'Initialising...',
  OK: 'Replaying log files at the set rate',
  STOPPED: 'Log replay stopped',
  ERROR: 'An error occured',
}

class LogPlayer extends EventEmitter {
  constructor(opts) {
    super()

    this.options = Object.assign({ setRate: 6, path: '' }, opts)

    if (typeof this.options.setRate !== 'number' || this.options.setRate < 0) {
      this.options.setRate = 6
    }

    if (this.options.setRate > 100) {
      this.options.setRate = 100
    }

    this.playing = false
    this.files = []
    this.last = -1
    this.rateDelta = Math.round(1000 / this.options.setRate)
    this.path = this.options.path
    this.error = false
    this.cursor = 0
    this.count = 0

    debug(`Initialised LogPlayer with options: ${JSON.stringify(this.options)}`)
    debug(`Rate delta is: ${this.rateDelta}`)

    this.emitStatus(EStatus.INITIALISING)
    this.listLogfiles()
    this.startReading()
  }

  listLogfiles() {
    if (this.error !== false) {
      return
    }

    try {
      let files = fs.readdirSync(this.path, 'utf-8')

      if (!Array.isArray(files)) {
        files = []
      }

      files
        .filter((name) => name.includes('.log'))
        .forEach((name) => {
          this.files.push(join(this.path, name))
        })

      debug(
        `Found ${this.files.length} logfiles in ${this.path}: ${files
          .filter((n) => n.endsWith('.log'))
          .join(', ')}`
      )
    } catch (err) {
      this.emitStatus(EStatus.ERROR)
      this.error = `Error listing files: ${err.message}`
      debug(this.error)
    }

    if (this.files.length === 0) {
      this.emitStatus(EStatus.NO_LOG_FILES)
      this.error = `No log files found in path: ${this.path}`
      debug(this.error)
    }
  }

  async startReading() {
    if (this.error !== false) {
      return
    }

    if (this.cursor === this.files.length) {
      this.cursor = 0
    }

    const currentFile = this.files[this.cursor]

    debug(`Reading file ${this.cursor + 1} / ${this.files.length}: ${currentFile}`)

    const liner = new lineByLine(currentFile)

    this.count = 0
    let line = ''

    while ((line = liner.next())) {
      this.count += 1
      const timeSinceLast = Date.now() - this.last

      if (timeSinceLast <= this.rateDelta) {
        await this.delay(Math.ceil(this.rateDelta - timeSinceLast))
      }

      try {
        await this.emitDelta(JSON.parse(line))
      } catch (err) {
        debug(`Error parsing line ${this.count} or sending delta: ${err.message}`)
      }
    }

    this.cursor += 1
    this.startReading()
  }

  delay(time, value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), time))
  }

  start() {
    this.playing = true
  }

  stop() {
    this.playing = false
    this.emitStatus(EStatus.STOPPED)
  }

  emitStatus(status) {
    this.emit('status', EStatus.hasOwnProperty(status) ? EStatus[status] : status)
  }

  async emitDelta(delta) {
    if (this.playing === false || this.error !== false) {
      throw new Error(this.error ? this.error : 'Plugin stopped')
    }

    // debug(`Emitting delta ${this.count}`)

    const last = this.last
    const rate = Date.now() - last

    this.last = Date.now()
    this.emit('delta', delta)

    this.emitStatus(
      `Deltas replayed: ${this.count} from file ${this.files[this.cursor]
        .split('/')
        .pop()}; rate: ~${(1000 / rate).toFixed(2)} Hz`
    )

    return delta
  }
}

LogPlayer.STATUS = EStatus
module.exports = LogPlayer
