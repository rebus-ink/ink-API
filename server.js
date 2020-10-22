'use strict'

const express = require('express')
const app = express()
const compression = require('compression')
const passport = require('passport')
const helmet = require('helmet')
// const csrf = require('csurf')
const { Strategy, ExtractJwt } = require('passport-jwt')
// const elasticsearchQueue = require('./processFiles/searchQueue')
// const epubQueue = require('./processFiles/index')
const cache = require('./utils/cache')
const errorHandling = require('./routes/_middleware/error-handling')
const { metricsQueue } = require('./utils/metrics')
// Routes

// Reader
const whoamiRoute = require('./routes/readers/whoami') // GET /whoami
const readersRoute = require('./routes/readers/reader-post') // POST /readers
const readerGetRoute = require('./routes/readers/reader-get') // GET /readers/:id
const readerPutRoute = require('./routes/readers/reader-put') // PUT /readers/:id
const readerDeleteRoute = require('./routes/readers/reader-delete') // DELETE /readers/:id

// Sources
const sourcePostRoute = require('./routes/sources/source-post') // POST /sources
const sourcePatchRoute = require('./routes/sources/source-patch') // PATCH /sources/:id
const sourceDeleteRoute = require('./routes/sources/source-delete') // DELETE /sources/:id
const sourcePutTagRoute = require('./routes/sources/source-put-tag') // PUT /sources/:sourceId/tags/:tagId
const sourceDeleteTagRoute = require('./routes/sources/source-delete-tag') // DELETE /sources/:sourceId/tags/:tagId
const sourceGetRoute = require('./routes/sources/source-get') // GET /sources/:id
const readActivityPostRoute = require('./routes/sources/readActivity-post') // POST /sources/:id/readActivity
const sourceBatchUpdate = require('./routes/sources/source-batchUpdate') // PATCH /sources/batchUpdate

// Search
// const searchRoute = require('./routes/search') // not working!

// Tags
const getTagsRoute = require('./routes/tags/tags-get') // GET /tags
const tagPostRoute = require('./routes/tags/tag-post') // POST /tags
const tagPutRoute = require('./routes/tags/tag-put') // PUT /tags/:id
const tagDeleteRoute = require('./routes/tags/tag-delete') // DELETE /tags/:id

// Library
const readerLibraryRoute = require('./routes/sources/library-get') // GET /library

// Notes
const readerNotesRoute = require('./routes/notes/readerNotes-get') // GET /notes
const getNoteRoute = require('./routes/notes/note-get') // GET /notes/:id
const notePutTagRoute = require('./routes/notes/note-put-tag') // PUT /notes/:noteId/tags/:tagId
const noteDeleteTagRoute = require('./routes/notes/note-delete-tag') // DELETE /notes/:noteId/tags/:tagId
const notePostRoute = require('./routes/notes/note-post') // POST /notes
const noteDeleteRoute = require('./routes/notes/note-delete') // DELETE /notes/:id
const notePutRoute = require('./routes/notes/note-put') // PUT /notes/:id

// NoteRelations
const noteRelationPostRoute = require('./routes/noteRelations/noteRelation-post') // POST /noteRelations
const noteRelationPutRoute = require('./routes/noteRelations/noteRelation-put') // PUT /noteRelations/:id
const noteRelationDeleteRoute = require('./routes/noteRelations/noteRelation-delete') // DELETE /noteRelations/:id

// NoteContexts
const noteContextPostRoute = require('./routes/noteContexts/noteContext-post') // POST /noteContexts
const noteContextPutRoute = require('./routes/noteContexts/noteContext-put') // PUT /noteContexts/:id
const noteContextDeleteRoute = require('./routes/noteContexts/noteContext-delete') // DELETE /noteContexts/:id
const noteContextAddNoteRoute = require('./routes/noteContexts/noteContext-addNote') // POST /noteContexts/:id/notes
const noteContextGetRoute = require('./routes/noteContexts/noteContext-get') // GET /noteContexts/:id

// outlines
const outlineGetRoute = require('./routes/outlines/outline-get') // GET /outlines/:id
const outlinePostRoute = require('./routes/outlines/outline-post') // POST /outlines
const outlineDeleteRoute = require('./routes/outlines/outline-delete') // DELETE /outlines/:id
const outlinePutRoute = require('./routes/outlines/outline-put') // PUT /outlines:id
const outlineAddNoteRoute = require('./routes/outlines/outline-addNote') // POST /outlines/:id/notes
const outlineDeleteNoteRoute = require('./routes/outlines/outline-deleteNote') // DELETE /outlines/:id/notes/:noteId
const outlinePatchNoteRoute = require('./routes/outlines/outline-patchNote') // PATCH /outlines/:id/notes/:noteId

// canvas
const canvasPostRoute = require('./routes/canvas/canvas-post')
const canvasPutRoute = require('./routes/canvas/canvas-put')
const canvasDeleteRoute = require('./routes/canvas/canvas-delete')
const canvasGetByIdRoute = require('./routes/canvas/canvas-getById')
const canvasGetAllRoute = require('./routes/canvas/canvas-getAll')
// notebooks
const notebookPostRoute = require('./routes/notebooks/notebook-post') // POST /notebooks
const notebookGetRoute = require('./routes/notebooks/notebook-get') // GET /notebooks/:id
const notebooksGetRoute = require('./routes/notebooks/notebooks.get') // GET /notebooks
const notebookPutRoute = require('./routes/notebooks/notebook-put') // PUT /notebooks/:id
const notebookDeleteRoute = require('./routes/notebooks/notebook-delete') // DELETE /notebooks/:id
const notebookPutSourceRoute = require('./routes/notebooks/notebook-put-source') // PUT /notebooks/:id/sources/:sourceId
const notebookDeleteSourceRoute = require('./routes/notebooks/notebook-delete-source') // DELETE /notebooks/:id/sources/:sourceId
const notebookPutNoteRoute = require('./routes/notebooks/notebook-put-note') // PUT /notebooks/:id/notes/:noteId
const notebookDeleteNoteRoute = require('./routes/notebooks/notebook-delete-note') // DELETE /notebooks/:id/notes/:noteId
const notebookPostNoteRoute = require('./routes/notebooks/notebook-note-post') // POST /notebooks/:id/notes
const notebookPutTagRoute = require('./routes/notebooks/notebook-put-tag') // PUT /notebooks/:id/tags/:tagId
const notebookDeleteTagRoute = require('./routes/notebooks/notebook-delete-tag') // DELETE /notebooks/:id/tags/:tagId
const notebookPostSourceRoute = require('./routes/notebooks/notebook-source-post')

const hardDeleteRoute = require('./routes/hardDelete')

const metricsGetRoute = require('./routes/metrics-get')

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
  if (metricsQueue) {
    await metricsQueue.clean(0)
    await metricsQueue.clean(0, 'failed')
    await metricsQueue.empty()
    metricsQueue.close()
  }
  // if (elasticsearchQueue) {
  //   await elasticsearchQueue.clean(0)
  //   await elasticsearchQueue.clean(0, 'failed')
  //   await elasticsearchQueue.empty()
  //   elasticsearchQueue.close()
  // }
  // if (epubQueue) {
  //   await epubQueue.clean(0)
  //   await epubQueue.clean(0, 'failed')
  //   await epubQueue.empty()
  //   epubQueue.close()
  // }
  if (cache) {
    cache.quitCache()
  }
  return await app.knex.destroy()
}

whoamiRoute(app)
readersRoute(app)
getTagsRoute(app)

// new routes
readActivityPostRoute(app)
sourcePostRoute(app)
sourceBatchUpdate(app)
sourcePatchRoute(app)
sourceDeleteRoute(app)
sourcePutTagRoute(app)
sourceDeleteTagRoute(app)
sourceGetRoute(app)
tagPostRoute(app)
tagPutRoute(app)
tagDeleteRoute(app)
readerGetRoute(app)
readerLibraryRoute(app)
readerNotesRoute(app)
getNoteRoute(app)
notePutTagRoute(app)
noteDeleteTagRoute(app)
notePostRoute(app)
noteDeleteRoute(app)
notePutRoute(app)
noteRelationPostRoute(app)
noteRelationPutRoute(app)
noteRelationDeleteRoute(app)
noteContextPostRoute(app)
noteContextPutRoute(app)
noteContextDeleteRoute(app)
noteContextAddNoteRoute(app)
noteContextGetRoute(app)
outlineGetRoute(app)
outlinePostRoute(app)
outlineDeleteRoute(app)
outlinePutRoute(app)
outlineAddNoteRoute(app)
outlineDeleteNoteRoute(app)
outlinePatchNoteRoute(app)
readerPutRoute(app)
readerDeleteRoute(app)
notebookPostRoute(app)
notebookGetRoute(app)
notebooksGetRoute(app)
notebookPutRoute(app)
notebookDeleteRoute(app)
notebookPutSourceRoute(app)
notebookDeleteSourceRoute(app)
notebookPutNoteRoute(app)
notebookDeleteNoteRoute(app)
notebookPostNoteRoute(app)
notebookPutTagRoute(app)
notebookDeleteTagRoute(app)
notebookPostSourceRoute(app)
hardDeleteRoute(app)
metricsGetRoute(app)
canvasPostRoute(app)
canvasPutRoute(app)
canvasDeleteRoute(app)
canvasGetByIdRoute(app)
canvasGetAllRoute(app)

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
