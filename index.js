const express = require('express')
const app = express()
const morgan = require('morgan')

// Only require https if we aren't in dev.
if (process.env.NODE_ENV !== 'development') {
  // app.use(function (req, res, next) {
  //   if (req.protocol !== 'https') {
  //     res.redirect(process.env.DOMAIN + req.path)
  //   } else {
  //     next()
  //   }
  // })
  // We only need to log errors/bans. Build in App Engine logs are enough for the rest.
  app.use(
    morgan('combined', {
      skip: function (req, res) {
        return res.statusCode < 400
      }
    })
  )
} else {
  // Full logs with colours when in dev.
  app.use(morgan('dev'))
}

const prefix = new URL(process.env.DOMAIN).pathname

app.use(prefix, require('./server.js').app)
app.listen(8080, () => console.log('Listening'))
