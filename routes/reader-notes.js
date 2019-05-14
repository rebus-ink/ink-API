const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { getId } = require('../utils/get-id.js')
const utils = require('./utils')
const _ = require('lodash')
const paginate = require('express-paginate')
const { Note } = require('../models/Note')

/**
 * @swagger
 * definition:
 *   publication-ref:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Publication']
 *       name:
 *         type: string
 *       attributedTo:
 *         type: array
 *   library:
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
 *           $ref: '#/definitions/publication-ref'
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
  app.use(paginate.middleware())
  router.get(
    '/reader-:id/notes',
    paginate.middleware(10, 100),
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      if (req.query.limit < 10) req.query.limit = 10 // prevents people from cheating by setting limit=0 to get everything
      Reader.getNotes(id, req.query.limit, req.skip)
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
            // if (req.query.stack) {
            //   publications = publications.filter(pub => {
            //     const result = _.find(pub.tags, tag => {
            //       return (
            //         tag.type === 'reader:Stack' && tag.name === req.query.stack
            //       )
            //     })
            //     return result
            //   })
            // }
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Replies for user with id ${id}`
                },
                type: 'Collection',
                id: getId(`/reader-${id}/notes`),
                totalItems: replies.length,
                items: replies,
                page: res.locals.paginate.page,
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
