const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Source } = require('../../models/Source')
const { Reader } = require('../../models/Reader')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}:
   *   get:
   *     tags:
   *       - sources
   *     description: Get a single Source by id
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
        .then(async source => {
          if (!source || source.deleted) {
            return next(
              boom.notFound(`No Source found with id ${sourceId}`, {
                requestUrl: req.originalUrl
              })
            )
          } else if (!utils.checkReader(req, source.reader)) {
            // if user is not owner, check if it is a collaborator
            const reader = await Reader.byAuthId(req.user)
            const collaborator = utils.checkNotebookCollaborator(
              reader.id,
              source.notebooks
            )
            if (!collaborator.read) {
              return next(
                boom.forbidden(`Access to source ${sourceId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }
          }

          res.setHeader('Content-Type', 'application/ld+json')
          const sourceJson = source.toJSON()
          res.end(JSON.stringify(sourceJson))
        })
        .catch(next)
    }
  )
}
