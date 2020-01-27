'use strict'

const express = require('express')
const app = express()
const compression = require('compression')
const passport = require('passport')
const helmet = require('helmet')
// const csrf = require('csurf')
const { Strategy, ExtractJwt } = require('passport-jwt')
const elasticsearchQueue = require('./processFiles/searchQueue')
const epubQueue = require('./processFiles/index')
const cache = require('./utils/cache')

const whoamiRoute = require('./routes/whoami')
const readersRoute = require('./routes/reader-post')
const fileUploadRoute = require('./routes/file-upload')
const publicationDocumentRoute = require('./routes/publication-document')
const searchRoute = require('./routes/search')
const fileUploadPubRoute = require('./routes/file-upload-pub')
const getTagsRoute = require('./routes/tags-get')
// new routes
const readerGetRoute = require('./routes/reader-get')
const publicationPostRoute = require('./routes/publication-post')
const publicationPatchRoute = require('./routes/publication-patch')
const publicationDeleteRoute = require('./routes/publication-delete')
const publicationPutTagRoute = require('./routes/publication-put-tag')
const publicationDeleteTagRoute = require('./routes/publication-delete-tag')
const publicationGetRoute = require('./routes/publication-get')
const readerLibraryRoute = require('./routes/library-get')
const tagPostRoute = require('./routes/tag-post')
const tagPatchRoute = require('./routes/tag-patch')
const tagDeleteRoute = require('./routes/tag-delete')
const readerNotesRoute = require('./routes/readerNotes-get')
const getJobRoute = require('./routes/job-get')
const getNoteRoute = require('./routes/note-get')
const notePutTagRoute = require('./routes/note-put-tag')
const noteDeleteTagRoute = require('./routes/note-delete-tag')
const readActivityPostRoute = require('./routes/readActivity-post')
const notePostRoute = require('./routes/note-post')
const noteDeleteRoute = require('./routes/note-delete')
const notePutRoute = require('./routes/note-put')

const errorHandling = require('./routes/middleware/error-handling')

const setupKnex = async skip_migrate => {
  let config

  config = require('./knexfile.js')
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
    await elasticsearchQueue.clean(0)
    await elasticsearchQueue.clean(0, 'failed')
    await elasticsearchQueue.empty()
    elasticsearchQueue.close()
  }
  if (epubQueue) {
    await epubQueue.clean(0)
    await epubQueue.clean(0, 'failed')
    await epubQueue.empty()
    epubQueue.close()
  }
  if (cache) {
    cache.quitCache()
  }
  return await app.knex.destroy()
}

whoamiRoute(app)
readersRoute(app)
fileUploadRoute(app)
publicationDocumentRoute(app)
searchRoute(app)
fileUploadPubRoute(app)
getTagsRoute(app)

// new routes
readActivityPostRoute(app)
publicationPostRoute(app)
publicationPatchRoute(app)
publicationDeleteRoute(app)
publicationPutTagRoute(app)
publicationDeleteTagRoute(app)
publicationGetRoute(app)
tagPostRoute(app)
tagPatchRoute(app)
tagDeleteRoute(app)
readerGetRoute(app)
readerLibraryRoute(app)
readerNotesRoute(app)
getJobRoute(app)
getNoteRoute(app)
notePutTagRoute(app)
noteDeleteTagRoute(app)
notePostRoute(app)
noteDeleteRoute(app)
notePutRoute(app)

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
