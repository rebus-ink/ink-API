const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../../models/Tag')
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')
const { checkOwnership } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /tags/{tagId}:
   *   delete:
   *     tags:
   *       - tags
   *     description: Delete a Tag by id
   *     parameters:
   *       - in: path
   *         name: tagId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Tag
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag {id} disallowed'
   *       404:
   *         description: No tag found with this id
   */
  app.use('/', router)
  router.route('/tags/:tagId').delete(jwtAuth, function (req, res, next) {
    const tagId = req.params.tagId
    Tag.byId(tagId)
      .then(async tag => {
        if (!tag) {
          return next(
            boom.notFound(`Delete Tag Error: No Tag found with id ${tagId}`, {
              requestUrl: req.originalUrl
            })
          )
        }

        const reader = await Reader.byAuthId(req.user)
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl
            })
          )
        }
        if (!checkOwnership(reader.id, tagId)) {
          return next(
            boom.forbidden(`Access to tag ${tagId} disallowed`, {
              requestUrl: req.originalUrl
            })
          )
        }

        // delete Tag
        try {
          await tag.delete()
        } catch (err) {
          return next(
            boom.badRequest(err.message, {
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
