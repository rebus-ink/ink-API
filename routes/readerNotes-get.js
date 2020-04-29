const express = require('express')
const router = express.Router()
const passport = require('passport')
const { ReaderNotes } = require('../models/readerNotes')
const { getId } = require('../utils/get-id.js')
const paginate = require('./middleware/paginate')
const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')

module.exports = app => {
  /**
   * @swagger
   * /notes:
   *   get:
   *     tags:
   *       - notes
   *     description: Get a collection of Notes for a reader
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *           minimum: 10
   *           maximum: 100
   *         description: the number of notes to return
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *       - in: query
   *         name: document
   *         schema:
   *           type: string
   *         description: the url of the document the note is associated with. When this filter is used, will not paginate. Will return all results.
   *       - in: query
   *         name: publication
   *         schema:
   *           type: string
   *         description: the id of the publication the note is associated with
   *       - in: query
   *         name: motivation
   *         schema:
   *           type: string
   *         enum: ['test', 'bookmarking', 'commenting', 'describing', 'editing', 'highlighting', 'replying']
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: word to search for in the content of notes. Not case sensitive.
   *       - in: query
   *         name: stack
   *         schema:
   *           type: string
   *         description: stack to which notes belong (tag with type 'stack')
   *       - in: query
   *         name: workspace
   *         schema:
   *           type: string
   *         description: workspace to which notes belong (tag with type 'workspace')
   *         enum: ['Research', 'Personal', 'Teaching', 'Public Scholarships']
   *       - in: query
   *         name: flag
   *         schema:
   *           type: string
   *         description: flag assigned to notes (tag with type 'flag')
   *         enum: ['important', 'question', 'revisit', 'to do', 'idea', 'important term', 'further reading',
   *           'urgent', 'reference', 'colour 1', 'colour 2', 'colour 3', 'colour 4']
   *       - in: query
   *         name: publishedStart
   *         schema:
   *           type: string
   *           format: date
   *         description: the earliest publishedAt time to filter by
   *       - in: query
   *         name: publishedEnd
   *         schema:
   *           type: string
   *           format: date
   *         description: the latest publishedAt time to filter by
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: ['created', 'updated']
   *         description: the property to be used to order the notes. By default will return most recent first.
   *       - in: query
   *         name: reverse
   *         schema:
   *           type: boolean
   *         description: modifier for the orderBy query to reverse the order.
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A list of notes for the reader
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/notes'
   *       400:
   *         description: Invalid time range
   *       401:
   *         description: No Authentication
   *       404:
   *         description: 'No Reader with auth token'
   */
  app.use('/', router)
  router.get(
    '/notes',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      const filters = {
        publication: req.query.publication,
        document: req.query.document,
        motivation: req.query.motivation,
        search: req.query.search,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse,
        collection: req.query.stack,
        workspace: req.query.workspace,
        flag: req.query.flag,
        publishedStart: req.query.publishedStart,
        publishedEnd: req.query.publishedEnd
      }
      if (
        filters.publishedStart &&
        filters.publishedEnd &&
        filters.publishedStart > filters.publishedEnd
      ) {
        return next(
          boom.badRequest(
            `Invalid time range: end time should be larger than start time`,
            {
              requestUrl: req.originalUrl
            }
          )
        )
      }
      let returnedReader
      ReaderNotes.getNotes(req.user, req.query.limit, req.skip, filters)
        .then(reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            returnedReader = reader
            const length = reader.replies.length
            if (filters.document) {
              return Promise.resolve(length)
            }
            if (length < req.query.limit && length !== 0) {
              return Promise.resolve(length + req.skip)
            }
            return ReaderNotes.getNotesCount(urlToId(reader.id), filters)
          }
        })
        .then(count => {
          let reader = returnedReader
          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
              id: getId(`/readers/${id}/notes`),
              totalItems: parseInt(count),
              items: reader.replies,
              page: req.query.page,
              pageSize: req.query.limit
            })
          )
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
