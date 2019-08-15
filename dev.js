const express = require('express')
const app = express()
const morgan = require('morgan')
const URL = require('url').URL

require('dotenv').config()

app.use(morgan('dev'))
const prefix = new URL(process.env.DOMAIN).pathname

app.use(prefix, require('./server.js').app)

require('./server.js')
  .app.initialize(true)
  .then(() => {
    require('./server.js').app.knex.migrate.rollback()
  })
  .then(() => {
    require('./server.js')
      .app.initialize()
      .catch(error => {
        console.error(error)
        throw error
      })
    app.listen(8080, () => console.log('Listening'))
  })
