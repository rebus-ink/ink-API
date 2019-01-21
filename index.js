const express = require('express')
const app = express()
const morgan = require('morgan')
const URL = require('url').URL

require('dotenv').config()

app.use(
  morgan('combined', {
    skip: function (req, res) {
      return res.statusCode < 400
    }
  })
)

const prefix = new URL(process.env.DOMAIN).pathname

app.use(prefix, require('./server.js').app)
require('./server.js')
  .app.initialize()
  .catch(error => {
    console.error(error)
    throw error
  })
app.listen(8080, () => console.log('Listening'))
