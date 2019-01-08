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
const publicationRoute = require('./routes/publication')
const readerLibraryRoute = require('./routes/user-library')
const userStreamsRoute = require('./routes/user-streams')
const userRoute = require('./routes/user')
const whoamiRoute = require('./routes/whoami')
const inboxRoute = require('./routes/inbox')
const readersRoute = require('./routes/readers')
const getOutboxRoute = require('./routes/outbox-get')
const postOutboxRoute = require('./routes/outbox-post')
const fileUploadRoute = require('./routes/file-upload')
const swaggerJSDoc = require('swagger-jsdoc')
const path = require('path')

// -- setup up swagger-jsdoc --
const swaggerDefinition = {
  info: {
    title: 'Reader API',
    version: '1.0.0',
    description: ''
  },
  components: {
    securitySchemes: {
      Bearer: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  },
  openapi: '3.0.0'
}
const options = {
  swaggerDefinition,
  apis: ['server.js', './routes/*.js']
}
const swaggerSpec = swaggerJSDoc(options)

const setupKnex = async () => {
  let config
  /* istanbul ignore next */
  if (process.env.POSTGRE_INSTANCE) {
    config = require('./knexfile.js')['postgresql']
  } else if (process.env.NODE_ENV === 'test') {
    config = require('./knexfile.js')['test']
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
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net/npm/redoc@next/'
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        workerSrc: ['blob:'],
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

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - general
 *     description: GET /
 *     produces:
 *       - text/html:
 *     responses:
 *       200:
 *         description: confirmation that the api is running
 *         content:
 *           text/html:
 *             properties:
 *               running:
 *                 type: string
 *                 enum: ['true']
 *
 */
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

// -- routes for docs and generated swagger spec --
/**
 * @swagger
 * /swagger.json:
 *   get:
 *     tags:
 *       - general
 *     description: GET /swagger.json
 *     produces:
 *       - application/json:
 *     responses:
 *       200:
 *         description: this documentation in json format
 *         content:
 *           application/json:
 *             properties:
 *               info:
 *                 type: object
 *               components:
 *                 type: object
 *               openapi:
 *                 type: string
 *                 enum: ['3.0.0']
 *               paths:
 *                 type: object
 *               definitions:
 *                 type: object
 *               tags:
 *                 type: object
 */
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

/**
 * @swagger
 * /docs:
 *   get:
 *     tags:
 *       - general
 *     description: GET /docs
 *     produces:
 *       - text/html:
 *     responses:
 *       200:
 *         description: this documenation in html format
 *
 */
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '/doc/doc.html'))
})

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
userRoute(app)
whoamiRoute(app)
inboxRoute(app)
readersRoute(app)
getOutboxRoute(app)
postOutboxRoute(app)
fileUploadRoute(app)

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
