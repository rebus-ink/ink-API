const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')
const { Source_Tag } = require('../../models/Source_Tag')
const { checkOwnership } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - tag-source
   *     description: Assign a Tag to a Source
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
   *         description: Successfully added Tag to Source
   *       400:
   *         description: Cannot assign the same tag twice
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag or source disallowed'
   *       404:
   *         description:  source or tag not found
   */
  app.use('/', router)
  router
    .route('/sources/:sourceId/tags/:tagId')
    .put(jwtAuth, function (req, res, next) {
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
          }

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

          Source_Tag.addTagToSource(sourceId, tagId)
            .then(async result => {
              await libraryCacheUpdate(reader.id)
              res.status(204).end()
            })
            .catch(err => {
              if (err.message === 'no source') {
                return next(
                  boom.notFound(
                    `Add Tag to Source Error: No Source found with id ${sourceId}`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              } else if (err.message === 'no tag') {
                return next(
                  boom.notFound(
                    `Add Tag to Source Error: No Tag found with id ${tagId}`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              } else {
                return next(
                  boom.badRequest(err.message, {
                    requestUrl: req.originalUrl
                  })
                )
              }
            })
        })
        .catch(err => {
          next(err)
        })
    })
}
