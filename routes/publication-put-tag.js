const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../utils/cache')
const { Publication_Tag } = require('../models/Publications_Tags')
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - tag-publication
   *     description: Assign a Tag to a Publication
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
   *         description: Successfully added Tag to Publication
   *       400:
   *         description: Cannot assign the same tag twice
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag or publication disallowed'
   *       404:
   *         description:  publication or tag not found
   */
  app.use('/', router)
  router
    .route('/publications/:pubId/tags/:tagId')
    .put(jwtAuth, function (req, res, next) {
      const pubId = req.params.pubId
      const tagId = req.params.tagId
      Reader.byAuthId(req.user)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with this token`, {
                requestUrl: req.originalUrl
              })
            )
          }

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

          Publication_Tag.addTagToPub(pubId, tagId)
            .then(async result => {
              await libraryCacheUpdate(reader.id)
              res.status(204).end()
            })
            .catch(err => {
              if (err.message === 'no publication') {
                return next(
                  boom.notFound(
                    `Add Tag to Publication Error: No Publication found with id ${pubId}`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              } else if (err.message === 'no tag') {
                return next(
                  boom.notFound(
                    `Add Tag to Publication Error: No Tag found with id ${tagId}`,
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
