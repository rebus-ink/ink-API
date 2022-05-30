const {app, start} = require("./server")
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

app.initialize(true).then(() => {
  start(8080)
})

