const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const { getId } = require('../utils/get-id.js')
const utils = require('./utils')
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
 *         enum: ['reader:Publication']
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
   * /reader-{shortId}/library:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:shortId/library
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
   *         description: A list of publications for the reader
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/library'
   *       404:
   *         description: 'No Reader with ID {shortId}'
   *       403:
   *         description: 'Access to reader {shortId} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:shortId/library',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId, ['publications.attributedTo'])
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${shortId}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${shortId} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Streams for user with id ${shortId}`
                },
                type: 'Collection',
                id: getId(`/reader-${shortId}/library`),
                totalItems: reader.publications.length,
                items: reader.publications.map(pub => pub.asRef())
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
