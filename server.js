'use strict'

const express = require('express')
const app = express()
const compression = require('compression')
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn
// const cookieSession = require('cookie-session')
const basicAuth = require('express-basic-auth')
// const passport = require('passport')
const helmet = require('helmet')
// const csrf = require('csurf')
const morgan = require('morgan')

// Public staging and dev servers are locked down with a simple basic auth password
if (
  process.env.DEPLOY_STAGE === 'staging' ||
  process.env.DEPLOY_STAGE === 'development'
) {
  app.use(
    basicAuth({
      challenge: true,
      users: { admin: 'plasticfantasticsecret' }
    })
  )
}

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
app.use(express.json())
app.use(compression())

// Only require https if we aren't in dev.
if (process.env.NODE_ENV !== 'development') {
  app.use(function (req, res, next) {
    if (req.protocol !== 'https') {
      res.redirect(process.env.HTML_DOMAIN + req.path)
    } else {
      next()
    }
  })
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

module.exports = {
  // Export app for reuse in other express apps/servers
  app,
  // The actual server start code
  start (port) {
    app.listen(port, () => console.log('Listening'))
  }
}
