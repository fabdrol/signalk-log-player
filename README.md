# Signal K Log Player

> A Signal K plugin that, given a folder of Signal K delta logs, replays them at a set rate

## Functionality

This plugin replays one or more Signal K log files stored in a folder at a configurable rate. The plugin expects log files that contain a single Signal K delta on each line, such as:

```
{"context":"vessels.urn:mrn:imo:mmsi:244016949","updates":[{"timestamp":"2020-05-14T19:42:30.662Z","values":[{"path":"environment.wind.directionMagnetic","value":2.2165}],"$source":"derived-data"}]}
{"updates":[{"source":{"label":"can1","type":"NMEA2000","pgn":127250,"src":"86"},"timestamp":"2020-05-14T19:42:30.659Z","values":[{"path":"navigation.headingMagnetic","value":1.4486}],"$source":"can1.86"}],"context":"vessels.urn:mrn:imo:mmsi:244016949"}
```

`@mairas` plugin can be used to generate such files (https://www.npmjs.com/package/signalk-data-logger), as well as other methods.

## Installation & usage (as Signal K plugin)

Install this plugin using the Signal K app store or install it manually:

```
// Run this in the Signal K server directory
[sudo] npm install signalk-log-player
```

After installation, you enable & configure the plugin via the plugins page in the Signal K admin UI.

## Installation & usage (standalone)

It's possible to use this plugin standalone, or as part of another application. Install the plugin using NPM:

```
npm install --save signalk-log-player
```

After installation, run the factory method and then you can use the `Ultrasonic` class manually:

```javascript
const { LogPlayer } = require('../')()
const { join } = require('path')

const instance = new LogPlayer({
  setRate: 10, // Hz
  path: join(__dirname, '../logs'),
})

instance.on('status', (status) => {
  // Do something with status message, such as logging to console:
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`Status: ${status}`)
})

instance.on('delta', (delta) => {
  // Do something with delta, such as logging to console:
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`Delta: ${JSON.stringify(delta)}`)
})

instance.start()
```

## License

Copyright 2020 Fabian Tollenaar/Decipher Industries <fabian@decipher.industries> (https://decipher.industries)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
