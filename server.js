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
const elasticsearchQueue = require('./utils/queue')

const activityRoute = require('./routes/activity')
const publicationRoute = require('./routes/publication')
const readerLibraryRoute = require('./routes/reader-library')
const readerStreamsRoute = require('./routes/reader-streams')
const readerRoute = require('./routes/reader')
const whoamiRoute = require('./routes/whoami')
const inboxRoute = require('./routes/inbox')
const readersRoute = require('./routes/readers')
const getOutboxRoute = require('./routes/outbox-get')
const postOutboxRoute = require('./routes/outbox-post')
const fileUploadRoute = require('./routes/file-upload')
const publicationFileUploadRoute = require('./routes/publication-file-upload')
const noteRoute = require('./routes/note')
const publicationDocumentRoute = require('./routes/publication-document')
const readerNotesRoute = require('./routes/reader-notes')
const searchRoute = require('./routes/search')
const getJobRoute = require('./routes/job-get')
const patchJobRoute = require('./routes/job-patch')
const fileUploadPubRoute = require('./routes/file-upload-pub')

const errorHandling = require('./routes/middleware/error-handling')

const setupKnex = async skip_migrate => {
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
  if (!skip_migrate) {
    await app.knex.migrate.rollback()
    await app.knex.migrate.latest()
  }
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
app.get('/', function (req, res) {
  return res.format({
    'text/html': function () {
      res.send('Running!')
    },
    'application/json': function () {
      return res.send({ running: true })
    }
  })
})

app.initialized = false

app.initialize = async skip_migrate => {
  if (!app.initialized) {
    await setupKnex(skip_migrate)
    app.initialized = true
  }
  return app.initialized
}

app.terminate = async () => {
  if (!app.initialized) {
    throw new Error('App not initialized; cannot terminate')
  }
  app.initialized = false
  if (elasticsearchQueue) {
    elasticsearchQueue.close()
  }
  return await app.knex.destroy()
}

activityRoute(app)
publicationRoute(app)
readerLibraryRoute(app)
readerStreamsRoute(app)
readerRoute(app)
whoamiRoute(app)
inboxRoute(app)
readersRoute(app)
getOutboxRoute(app)
postOutboxRoute(app)
fileUploadRoute(app)
publicationFileUploadRoute(app)
noteRoute(app)
publicationDocumentRoute(app)
readerNotesRoute(app)
searchRoute(app)
getJobRoute(app)
patchJobRoute(app)
fileUploadPubRoute(app)

app.use(errorHandling)

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
