const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { getId } = require('../utils/get-id.js')
const utils = require('../utils/utils')
const paginate = require('./middleware/paginate')
const boom = require('@hapi/boom')

/**
 * @swagger
 * definition:
 *   noteWithPub:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Note']
 *       noteType:
 *         type: string
 *       'oa:hasSelector':
 *         type: object
 *       content:
 *         type: string
 *       '@context':
 *         type: array
 *       published:
 *         type: string
 *         format: date-time
 *       updated:
 *         type: string
 *         format: date-time
 *       publication:
 *         properties:
 *           id:
 *             type: string
 *             format: url
 *           author:
 *             type: array
 *             items:
 *               $ref: '#/definitions/annotation'
 *           editor:
 *             type: array
 *             items:
 *               $ref: '#/definitions/annotation'
 *           description:
 *             type: string
 *           datePublished:
 *             type: string
 *             format: timestamp
 *       inReplyTo:
 *         type: string
 *         format: url
 *         description: The url of the document
 *       context:
 *         type: string
 *         format: url
 *         description: The url of the publication
 *       json:
 *         type: object
 *   notes:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Collection']
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteWithPub'
 *
 */
module.exports = app => {
  /**
   * @swagger
   * /reader-{id}/notes:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:id/notes
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the reader
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *           minimum: 10
   *           maximum: 100
   *         description: the number of library items to return
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
   *         name: type
   *         schema:
   *           type: string
   *         description: the type of note
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: keyword to search for in the content of notes. Not case sensitive.
   *       - in: query
   *         name: stack
   *         schema:
   *           type: string
   *         description: the collection (tag with type 'reader:Stack')
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
   *         description: modifier for the orderBy query to return the oldest notes first.
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
   *       404:
   *         description: 'No Reader with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:id/notes',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      const filters = {
        publication: req.query.publication,
        document: req.query.document,
        type: req.query.type,
        search: req.query.search,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse,
        collection: req.query.stack
      }
      let returnedReader
      Reader.getNotes(id, req.query.limit, req.skip, filters)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${id}`, {
                type: 'Reader',
                id,
                activity: 'Get Notes'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.notFound(`Access to reader ${id} disallowed`, {
                type: 'Reader',
                id,
                activity: 'Get Notes'
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
            return Reader.getNotesCount(id, filters)
          }
        })
        .then(count => {
          let reader = returnedReader
          res.setHeader(
            'Content-Type',
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          let replies = reader.replies
          res.end(
            JSON.stringify({
              '@context': 'https://www.w3.org/ns/activitystreams',
              summaryMap: {
                en: `Replies for reader with id ${id}`
              },
              type: 'Collection',
              id: getId(`/reader-${id}/notes`),
              totalItems: parseInt(count),
              items: replies,
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
