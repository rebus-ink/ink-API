const app = require('../../server').app

const init = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize()
    return app
  } else {
    return app
  }
}

app = init()

module.exports = app
