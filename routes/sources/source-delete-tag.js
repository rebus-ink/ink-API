const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const {
  libraryCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')
const { Source_Tag } = require('../../models/Source_Tag')
const { checkOwnership } = require('../../utils/utils')

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
                await notebooksCacheUpdate(reader.authId)
                await libraryCacheUpdate(reader.authId)
                res.status(204).end()
              })
              .catch(err => {
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
