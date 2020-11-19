const express = require('express')
const router = express.Router()
const passport = require('passport')
const { ReaderNotes } = require('../../models/readerNotes')
const paginate = require('../_middleware/paginate')
const boom = require('@hapi/boom')
const { urlToId } = require('../../utils/utils')
const { notesCacheGet } = require('../../utils/cache')
const debug = require('debug')('ink:routes:readerNotes-get')

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
   *         description: the document the note is associated with. When this filter is used, will not paginate. Will return all results.
   *       - in: query
   *         name: source
   *         schema:
   *           type: string
   *         description: the id of the source the note is associated with
   *       - in: query
   *         name: motivation
   *         schema:
   *           type: string
   *         enum: ['test', 'bookmarking', 'commenting', 'describing', 'editing', 'highlighting', 'replying']
   *       - in: query
   *         name: notMotivation
   *         schema:
   *           type: string
   *         enum: ['test', 'bookmarking', 'commenting', 'describing', 'editing', 'highlighting', 'replying']
   *         description: motivation to filter out. Should not be combined with the motivation filter.
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: word to search for in the content of notes. Not case sensitive.
   *       - in: query
   *         name: notebook
   *         schema:
   *           type: string
   *         description: shortId of the notebook to filter by
   *       - in: query
   *         name: stack
   *         schema:
   *           type: string
   *         description: stack to which notes belong (tag with type 'stack'). Accepts multiple values
   *         style: spaceDelimited
   *         explode: true
   *       - in: query
   *         name: tag
   *         schema:
   *           type: string
   *         description: tagId - for a tag of any type. Accepts multiple values
   *         style: spaceDelimited
   *         explode: true
   *       - in: query
   *         name: flag
   *         schema:
   *           type: string
   *         description: flag assigned to notes (tag with type 'flag'). Accepts multiple values.
   *         enum: ['important', 'question', 'revisit', 'to do', 'idea', 'important term', 'further reading',
   *           'urgent', 'reference']
   *         style: spaceDelimited
   *         explode: true
   *       - in: query
   *         name: colour
   *         schema:
   *           type: string
   *         description: colour assigned to notes (tag with type 'colour')
   *         enum: ['colour1', 'colour2', 'colour3', 'colour4']
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
   *         name: updatedStart
   *         schema:
   *           type: string
   *           format: date
   *         description: the earliest updated time to filter by
   *       - in: query
   *         name: updatedEnd
   *         schema:
   *           type: string
   *           format: date
   *         description: the latest updated time to filter by
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
   *       - in: header
   *         name: If-Modified-Since
   *         schema:
   *           type: string
   *         description: a timestamp of the last response
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
      const filters = {
        source: req.query.source,
        document: req.query.document,
        motivation: req.query.motivation,
        notMotivation: req.query.notMotivation,
        search: req.query.search,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse,
        stack: req.query.stack,
        tag: req.query.tag,
        flag: req.query.flag,
        colour: req.query.colour,
        notebook: req.query.notebook,
        publishedStart: req.query.publishedStart,
        publishedEnd: req.query.publishedEnd,
        updatedStart: req.query.updatedStart,
        updatedEnd: req.query.updatedEnd
      }
      debug('filters: ', filters)
      if (
        (filters.publishedStart &&
          filters.publishedEnd &&
          filters.publishedStart > filters.publishedEnd) ||
        (filters.updatedStart &&
          filters.updatedEnd &&
          filters.updatedStart > filters.updatedEnd)
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
      notesCacheGet(req.user, !!req.headers['if-modified-since'])
        .then(value => {
          if (
            value &&
            req.headers['if-modified-since'] &&
            req.headers['if-modified-since'] > value
          ) {
            res.status(304)
          }
          return ReaderNotes.getNotes(
            req.user,
            req.query.limit,
            req.skip,
            filters
          )
        })
        .then(reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            returnedReader = reader
            debug('returned reader: ', returnedReader)
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
          debug('count: ', count)
          let reader = returnedReader
          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
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
