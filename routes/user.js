const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
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
 *       streams:
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
   * /reader-{shortId}:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:shortId
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the reader
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
   *         description: 'No Reader with ID {shortId}'
   *       403:
   *         description: 'Access to reader {shortId} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byShortId(req.params.shortId)
        .then(reader => {
          if (!reader) {
            res.status(404).send('no such user') // TODO: fix error message
          } else if (!utils.checkReader(req, reader)) {
            res
              .status(403)
              .send(`Access to reader ${req.params.shortId} disallowed`)
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
          if (err instanceof NoSuchReaderError) {
            res.status(404).send(err.message)
          } else {
            next(err)
          }
        })
    }
  )
}
