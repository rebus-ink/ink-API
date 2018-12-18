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
const activityRoute = require('./routes/activity')
const documentRoute = require('./routes/document')
const publicationRoute = require('./routes/document')
const readerLibraryRoute = require('./routes/user-library')
const userStreamsRoute = require('./routes/user-streams')

const setupKnex = async () => {
  let config
  /* istanbul ignore next */
  if (process.env.POSTGRE_INSTANCE) {
    config = require('./knexfile.js')['postgresql']
  } else {
    config = require('./knexfile.js')['development']
  }
  app.knex = require('knex')(config)
  await app.knex.migrate.latest()
  const objection = require('objection')
  const Model = objection.Model
  Model.knex(app.knex)
  return null
}

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
    ],
    limit: '100mb'
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

// FIXME: this needs to be first because it also matches the :userID production

app.use('/', require('./routes/whoami'))
app.use('/', require('./routes/readers'))

app.use('/', require('./routes/inbox'))
app.use('/', require('./routes/outbox'))
app.use('/', require('./routes/user'))
app.use('/', require('./routes/file-upload'))

app.initialized = false

app.initialize = async () => {
  if (!app.initialized) {
    await setupKnex()
    app.initialized = true
  }
  return app.initialized
}

app.terminate = async () => {
  if (!app.initialized) {
    throw new Error('App not initialized; cannot terminate')
  }
  app.initialized = false
  return app.knex.destroy()
}

activityRoute(app)
documentRoute(app)
publicationRoute(app)
readerLibraryRoute(app)
userStreamsRoute(app)

app.start = port => {
  app.listen(port, () => console.log('Listening'))
}

module.exports = {
  // Export app for reuse in other express apps/servers
  app,
  start (port) {
    app.start(port)
  }
}
