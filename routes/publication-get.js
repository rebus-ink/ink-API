const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')

/**
 * @swagger
 * definition:
 *   annotation:
 *     properties:
 *       name:
 *         type: string
 *       type:
 *         type: string
 *         enum: ['Person', 'Organization']
 *   link:
 *     properties:
 *      href:
 *       type: string
 *      mediaType:
 *       type: string
 *      rel:
 *        type: string
 *      name:
 *        type: string
 *      hreflang:
 *        type: string
 *      height:
 *        type: integer
 *      width:
 *        type: integer
 *   publication:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       author:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       creator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       contributor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       illustrator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       publisher:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       translator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       copyrightHolder:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       replies:
 *         type: array
 *         items:
 *           type: string
 *           format: url
 *       abstract:
 *         type: string
 *       datePublished:
 *         type: string
 *         format: timestamp
 *       numberOfPages:
 *         type: number
 *       encodingFormat:
 *         type: string
 *       url:
 *         type: string
 *       dateModified:
 *         type: string
 *         format: timestamp
 *       bookEdition:
 *         type: string
 *       isbn:
 *         type: string
 *       copyrightYear:
 *         type: number
 *       genre:
 *         type: string
 *       license:
 *         type: string
 *       wordCount:
 *         type: number
 *       description:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['test']
 *       inDirection:
 *         type: string
 *         enum: ['ltr', 'rtl']
 *       readingOrder:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       resources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       links:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       position:
 *         type: object
 *       json:
 *         type: object
 *       readerId:
 *         type: string
 *         format: url
 *       reader:
 *         $ref: '#/definitions/reader'
 *       published:
 *         type: string
 *         format: timestamp
 *       updated:
 *         type: string
 *         format: timestamp
 *
 */

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}:
   *   get:
   *     tags:
   *       - publications
   *     description: GET /publications/{pubId}
   *     parameters:
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
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
   *         description: 'No Publication with ID {pubId}'
   *       403:
   *         description: 'Access to publication {pubId} disallowed'
   */
  app.use('/', router)
  router.get(
    '/publications/:pubId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const pubId = req.params.pubId
      Publication.byId(pubId)
        .then(publication => {
          if (!publication || publication.deleted) {
            return next(
              boom.notFound(`No publication with ID ${pubId}`, {
                type: 'Publication',
                id: pubId,
                activity: 'Get Publication'
              })
            )
          } else if (!utils.checkReader(req, publication.reader)) {
            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
                type: 'Publication',
                id: pubId,
                activity: 'Get Publication'
              })
            )
          } else {
            debug(publication)
            res.setHeader('Content-Type', 'application/ld+json')
            const publicationJson = publication.toJSON()
            res.end(
              JSON.stringify(
                Object.assign(publicationJson, {
                  replies: publication.replies
                    ? publication.replies
                      .filter(note => !note.deleted)
                      .map(note => note.asRef())
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
