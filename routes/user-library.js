const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { getId } = require('../utils/get-id.js')
const utils = require('./utils')
const _ = require('lodash')
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
    '/reader-:id/library',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Reader.byId(id, '[tags, publications.[attributedTo, tags]]')
        .then(reader => {
          console.log('Found reader')
          if (!reader) {
            res.status(404).send(`No reader with ID ${id}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${id} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            let publications = reader.publications.filter(pub => !pub.deleted)
            if (req.query.stack) {
              publications = publications.filter(pub => {
                const result = _.find(pub.tags, tag => {
                  return (
                    tag.type === 'reader:Stack' && tag.name === req.query.stack
                  )
                })
                return result
              })
            }
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Streams for user with id ${id}`
                },
                type: 'Collection',
                id: getId(`/reader-${idd}/library`),
                totalItems: publications.length,
                items: publications.map(pub => pub.asRef()),
                tags: reader.tags
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
