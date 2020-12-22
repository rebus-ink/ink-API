const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const {
  libraryCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')
const { metricsQueue } = require('../../utils/metrics')

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
   *       - in: query
   *         name: reference
   *         schema:
   *           type: boolean
   *         description: flag a source that you want to keep as a reference for notes. The source will no longer be in the library.
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

        let result
        if (req.query.reference) {
          result = await Source.toReference(sourceId)
        } else {
          result = await Source.delete(sourceId)
        }

        if (!result) {
          return next(
            boom.notFound(`No Source found with id ${sourceId}`, {
              requestUrl: req.originalUrl
            })
          )
        }

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'deleteSource',
            readerId: urlToId(req.params.sourceId)
          })
        }

        await libraryCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)

        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
