const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Canvas } = require('../../models/Canvas')
const debug = require('debug')('ink:routes:canvas-delete')
const { metricsQueue } = require('../../utils/metrics')
module.exports = function (app) {
  /**
   * @swagger
   * /canvas/{canvasId}:
   *   delete:
   *     tags:
   *       - canvas
   *     description: Delete a canvas by id
   *     parameters:
   *       - in: path
   *         name: canvasId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Canvas
   *       401:
   *         description: 'No Authentication'
   *       404:
   *         description: Canvas not found
   *       403:
   *         description: 'Access to Canvas {canvasId} disallowed'
   */
  app.use('/', router)
  router.route('/canvas/:canvasId').delete(jwtAuth, function (req, res, next) {
    const canvasId = req.params.canvasId
    debug('canvasId: ', canvasId)
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl
            })
          )
        }
        if (!checkOwnership(reader.id, canvasId)) {
          return next(
            boom.forbidden(`Access to Canvas ${canvasId} disallowed`, {
              requestUrl: req.originalUrl
            })
          )
        }

        const result = await Canvas.delete(canvasId)
        debug('delete result: ', result)
        if (!result) {
          return next(
            boom.notFound(
              `Canvas Delete Error: No Canvas found with id ${canvasId}`,
              {
                requestUrl: req.originalUrl
              }
            )
          )
        }

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'deleteCanvas',
            readerId: urlToId(req.params.canvasId)
          })
        }

        // await notebooksCacheUpdate(reader.authId)
        res.status(204).end()
      })

      .catch(err => {
        next(err)
      })
  })
}
