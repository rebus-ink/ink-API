const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('./utils')
const _ = require('lodash')
/**
 * @swagger
 * definition:
 *   document-ref:
 *     properties:
 *       type:
 *         type: string
 *         enum: ['Document']
 *       name:
 *         type: string
 *       id:
 *         type: string
 *         format: url
 *       published:
 *         type: string
 *         format: date-time
 *       updated:
 *         type: string
 *         format: date-time
 *       attributedTo:
 *         type: array
 *   publication:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['reader:Publication']
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       totalItems:
 *         type: integer
 *       orderedItems:
 *         type: array
 *         items:
 *           $ref: '#/definitions/document-ref'
 *       attachment:
 *         type: array
 *         items:
 *           $ref: '#/definitions/document-ref'
 *       replies:
 *         type: array
 *         items:
 *           type: string
 *           format: url
 *
 */

module.exports = function (app) {
  /**
   * @swagger
   * /publication-{shortId}:
   *   get:
   *     tags:
   *       - publications
   *     description: GET /publication-:shortId
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the publication
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: The publication objects, with a list of document references (document object without the content field)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publication'
   *       404:
   *         description: 'No Publication with ID {shortId}'
   *       403:
   *         description: 'Access to publication {shortId} disallowed'
   */
  app.use('/', router)
  router.get(
    '/publication-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Publication.byShortId(shortId)
        .then(publication => {
          if (!publication || publication.deleted) {
            res.status(404).send(`No publication with ID ${shortId}`)
          } else if (!utils.checkReader(req, publication.reader)) {
            res.status(403).send(`Access to publication ${shortId} disallowed`)
          } else {
            debug(publication)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            const publicationJson = publication.toJSON()
            // get latest read position from the attached documents
            let positionObject = {}
            const readActivities = []
            publication.attachment.forEach(document => {
              if (document.outbox && document.outbox.length > 0) {
                document.outbox.forEach(act => {
                  if (act.type === 'Read') readActivities.push(act)
                })
              }
            })
            if (readActivities.length > 0) {
              let position = _.maxBy(readActivities, o => o.published)
              positionObject = {
                documentId: position.json.object.id,
                value: position.json['oa:hasSelector'].value
              }
            }

            res.end(
              JSON.stringify(
                Object.assign(publicationJson, {
                  orderedItems: publicationJson.orderedItems.map(doc =>
                    doc.asRef()
                  ),
                  attachment: publication.attachment.map(doc => doc.asRef()),
                  '@context': [
                    'https://www.w3.org/ns/activitystreams',
                    { reader: 'https://rebus.foundation/ns/reader' },
                    { schema: 'https://schema.org/' }
                  ],
                  replies: publication.replies
                    ? publication.replies
                      .filter(note => !note.deleted)
                      .map(note => note.asRef())
                    : [],
                  tags: publication.tags,
                  position: positionObject
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
