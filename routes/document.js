const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Document } = require('../models/Document')
const debug = require('debug')('hobb:routes:document')
const utils = require('./utils')

/**
 * @swagger
 * definition:
 *   document:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Document']
 *       name:
 *         type: string
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
 *       attributedTo:
 *         type: array
 *       replies:
 *         type: array
 *         items:
 *           $ref: '#/definitions/note'
 *
 */

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /document-{shortId}:
   *   get:
   *     tags:
   *       - documents
   *     description: GET /document-:shortId
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the document
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A Document Object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/document'
   *       404:
   *         description: 'No Document with ID {shortId}'
   *       403:
   *         description: 'Access to document {shortId} disallowed'
   */

  router.get(
    '/document-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Document.byShortId(shortId)
        .then(document => {
          if (!document) {
            res.status(404).send(`No document with ID ${shortId}`)
          } else if (!utils.checkReader(req, document.reader)) {
            res.status(403).send(`Access to document ${shortId} disallowed`)
          } else {
            debug(document)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify(
                Object.assign(document.toJSON(), {
                  '@context': [
                    'https://www.w3.org/ns/activitystreams',
                    { reader: 'https://rebus.foundation/ns/reader' }
                  ],
                  replies: document.replies
                    ? document.replies.map(reply => reply.toJSON())
                    : []
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
