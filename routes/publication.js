const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('./utils')

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
 *         enum: ['Publication']
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
 *       replies:
 *         type: array
 *         items:
 *           type: string
 *           format: url
 *       description:
 *         type: string
 *       datePublished:
 *         type: string
 *         format: timestamp
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
 *       json:
 *         type: object
 *       readerId:
 *         type: string
 *         format: url
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
   * /publication-{id}:
   *   get:
   *     tags:
   *       - publications
   *     description: GET /publication-:id
   *     parameters:
   *       - in: path
   *         name: id
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
   *         description: 'No Publication with ID {id}'
   *       403:
   *         description: 'Access to publication {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/publication-:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Publication.byId(id)
        .then(publication => {
          if (!publication || publication.deleted) {
            res.status(404).send(`No publication with ID ${id}`)
          } else if (!utils.checkReader(req, publication.reader)) {
            res.status(403).send(`Access to publication ${id} disallowed`)
          } else {
            debug(publication)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
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
