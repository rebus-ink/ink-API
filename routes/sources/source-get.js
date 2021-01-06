const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Source } = require('../../models/Source')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}:
   *   get:
   *     tags:
   *       - sources
   *     description: Get a single source by id
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: The source object with a list of replies (noteIds) a list of assigned tags
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/source'
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to source {sourceId} disallowed'
   *       404:
   *         description: 'No Source with ID {sourceId}'
   */
  app.use('/', router)
  router.get(
    '/sources/:sourceId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const sourceId = req.params.sourceId
      Source.byId(sourceId)
        .then(source => {
          if (!source || source.deleted) {
            return next(
              boom.notFound(`No Source found with id ${sourceId}`, {
                requestUrl: req.originalUrl
              })
            )
          } else if (!utils.checkReader(req, source.reader)) {
            return next(
              boom.forbidden(`Access to source ${sourceId} disallowed`, {
                type: 'Source',
                requestUrl: req.originalUrl
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            const sourceJson = source.toJSON()
            res.end(
              JSON.stringify(
                Object.assign(sourceJson, {
                  replies: source.replies
                    ? source.replies.map(note => note.id)
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
