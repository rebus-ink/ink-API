const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { checkOwnership } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}/tags/{tagId}:
   *   delete:
   *     tags:
   *       - tag-publication
   *     description: Remove assignment of Tag to a Publication
   *     parameters:
   *       - in: path
   *         name: pubId
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
   *         description: Successfully removed Tag from Publication
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag or publication disallowed'
   *       404:
   *         description: publication, tag or pub-tag relation not found
   */
  app.use('/', router)
  router
    .route('/publications/:pubId/tags/:tagId')
    .delete(jwtAuth, function (req, res, next) {
      const pubId = req.params.pubId
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
            if (!checkOwnership(reader.id, pubId)) {
              return next(
                boom.forbidden(`Access to Publication ${pubId} disallowed`, {
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

            Publication_Tag.removeTagFromPub(pubId, tagId)
              .then(async result => {
                await libraryCacheUpdate(reader.id)
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
