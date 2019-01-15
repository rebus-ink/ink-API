const app = require('../../server').app

if (process.env.POSTGRE_INSTANCE) {
  app.initialize()
}
