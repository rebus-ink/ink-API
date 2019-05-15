const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const utils = require('./utils')

/**
 * @swagger
 * definition:
 *   reader:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Person']
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       inbox:
 *         type: string
 *         format: url
 *       outbox:
 *         type: string
 *         format: url
 *       name:
 *         type: string
 *       profile:
 *         type: object
 *       preferences:
 *         type: object
 *       json:
 *         type: object
 *       published:
 *         type: string
 *         format: date-time
 *       updated:
 *         type: string
 *         format: date-time
 */
module.exports = app => {
  /**
   * @swagger
   * /reader-{id}:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the id of the reader
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A reader object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       404:
   *         description: 'No Reader with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byId(req.params.id)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${req.params.id}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${req.params.id} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify(
                Object.assign(
                  {
                    '@context': [
                      'https://www.w3.org/ns/activitystreams',
                      { reader: 'https://rebus.foundation/ns/reader' }
                    ]
                  },
                  reader.toJSON()
                )
              )
            )
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
