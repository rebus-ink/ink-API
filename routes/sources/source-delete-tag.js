const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')
const { Source_Tag } = require('../../models/Source_Tag')
const { checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:source-delete-tag')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}/tags/{tagId}:
   *   delete:
   *     tags:
   *       - tag-source
   *     description: Remove assignment of Tag to a Source
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: tagId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully removed Tag from Source
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag or source disallowed'
   *       404:
   *         description: source, tag or source-tag relation not found
   */
  app.use('/', router)
  router
    .route('/sources/:sourceId/tags/:tagId')
    .delete(jwtAuth, function (req, res, next) {
      const sourceId = req.params.sourceId
      const tagId = req.params.tagId
      debug('sourceId: ', sourceId, 'tagId: ', tagId)
      Reader.byAuthId(req.user)
        .then(reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            if (!checkOwnership(reader.id, sourceId)) {
              return next(
                boom.forbidden(`Access to Source ${sourceId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }
            if (!checkOwnership(reader.id, tagId)) {
              return next(
                boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }

            Source_Tag.removeTagFromSource(sourceId, tagId)
              .then(async () => {
                await libraryCacheUpdate(reader.id)
                res.status(204).end()
              })
              .catch(err => {
                debug('error: ', err.message)
                return next(
                  boom.notFound(err.message, {
                    requestUrl: req.originalUrl
                  })
                )
              })
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
