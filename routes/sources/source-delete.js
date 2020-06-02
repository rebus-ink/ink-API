const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { libraryCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}:
   *   delete:
   *     tags:
   *       - sources
   *     description: Delete a source by id
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Source
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to source {sourceId} disallowed'
   *       404:
   *         description: Source not found
   */
  app.use('/', router)
  router.route('/sources/:sourceId').delete(jwtAuth, function (req, res, next) {
    const sourceId = req.params.sourceId
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl
            })
          )
        }

        if (!checkOwnership(reader.id, sourceId)) {
          const source = await Source.byId(sourceId)
          if (!source) {
            return next(
              boom.notFound(`No Source found with id ${sourceId}`, {
                requestUrl: req.originalUrl
              })
            )
          }

          return next(
            boom.forbidden(`Access to source ${sourceId} disallowed`, {
              requestUrl: req.originalUrl
            })
          )
        }

        const result = await Source.delete(sourceId)
        if (!result) {
          return next(
            boom.notFound(`No Source found with id ${sourceId}`, {
              requestUrl: req.originalUrl
            })
          )
        }

        await libraryCacheUpdate(reader.id)
        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
