const { defineConfig } = require('cypress')
const { io } = require('socket.io-client')

const cySocket = io('http://localhost:9090')

// receiving the checkpoint name reached by any test runner
let checkpointName
cySocket.on('checkpoint', (name) => {
  console.log('current checkpoint %s', name)
  checkpointName = name
})

const disconnectTask = {
  disconnect() {
    chatSocket.disconnect()
    return null
  },
}

const checkpointTask = {
  // tasks for syncing multiple Cypress instances together
  checkpoint(name) {
    console.log('emitting checkpoint name "%s"', name)
    cySocket.emit('checkpoint', name)

    return null
  },
}

const waitForCheckpointTask = {
  waitForCheckpoint(name) {
    console.log('waiting for checkpoint "%s"', name)

    // TODO: set maximum waiting time
    return new Promise((resolve) => {
      const i = setInterval(() => {
        console.log('checking, current checkpoint "%s"', checkpointName)
        if (checkpointName === name) {
          console.log('reached checkpoint "%s"', name)
          clearInterval(i)
          resolve(name)
        }
      }, 1000)
    })
  },
}

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    fixturesFolder: false,
    supportFile: false,
    video: false,
    defaultCommandTimeout: 15000,
    $schema: "https://on.cypress.io/cypress.schema.json",
    specPattern: ["**/first-user.js"],
    setupNodeEvents(on, config) {
      on('task', disconnectTask)
      on('task', checkpointTask)
      on('task', waitForCheckpointTask)
    }
  }
})