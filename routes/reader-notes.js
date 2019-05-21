const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { getId } = require('../utils/get-id.js')
const utils = require('../utils/utils')
const paginate = require('./middleware/paginate')

/**
 * @swagger
 * definition:
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
 *           $ref: '#/definitions/note'
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
   *         description: the url of the document the note is associated with
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
        search: req.query.search
      }
      Reader.getNotes(id, req.query.limit, req.skip, filters)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${id}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${id} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            let replies = reader.replies.filter(reply => !reply.deleted)
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Replies for reader with id ${id}`
                },
                type: 'Collection',
                id: getId(`/reader-${id}/notes`),
                totalItems: replies.length,
                items: replies,
                page: req.query.page,
                pageSize: req.query.limit
              })
            )
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
