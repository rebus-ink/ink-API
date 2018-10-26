'use strict'

const express = require('express')
const app = express()
const compression = require('compression')
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn
// const cookieSession = require('cookie-session')
const passport = require('passport')
const helmet = require('helmet')
// const csrf = require('csurf')
const { Strategy, ExtractJwt } = require('passport-jwt')

const setupPassport = () => {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
  opts.secretOrKey = process.env.SECRETORKEY
  opts.issuer = process.env.ISSUER
  opts.audience = process.env.AUDIENCE
  passport.use(
    new Strategy(opts, (jwt, callback) => {
      callback(null, jwt.sub)
    })
  )
}

setupPassport()

// Security settings
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        imgSrc: ['*', 'data:', 'https:'],
        frameSrc: [
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com'
        ],
        fontSrc: ["'self'"],
        formAction: ["'self'", 'https://rebus.auth0.com/'],
        frameAncestors: ["'none'"]
      }
    }
  })
)

// Basic Settings
app.enable('strict routing')
app.set('trust proxy', true)
app.use(express.urlencoded({ extended: true }))
app.use(
  express.json({
    type: [
      'application/json',
      'application/activity+json',
      'application/ld+json'
    ]
  })
)
app.use(compression())
app.use(passport.initialize())

app.get('/', function (req, res, next) {
  return res.format({
    'text/html': function () {
      res.send('Running!')
    },
    'application/json': function () {
      return res.send({ running: true })
    }
  })
})

app.use('/', require('./routes/activity'))
app.use('/', require('./routes/document'))
app.use('/', require('./routes/inbox'))
app.use('/', require('./routes/outbox'))
app.use('/', require('./routes/publication'))
app.use('/', require('./routes/user'))
app.use('/', require('./routes/user-library'))
app.use('/', require('./routes/user-streams'))

module.exports = {
  // Export app for reuse in other express apps/servers
  app,
  // The actual server start code
  start (port) {
    app.listen(port, () => console.log('Listening'))
  }
}
