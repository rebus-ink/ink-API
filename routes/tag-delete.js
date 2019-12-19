const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../models/Tag')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { libraryCacheUpdate } = require('../utils/cache')
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /tags/{tagId}:
   *   delete:
   *     tags:
   *       - tags
   *     description: DELETE /tags/:tagId
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
   *       403:
   *         description: 'Access to tag {id} disallowed'
   *       404:
   *         description: Tag not found
   */
  app.use('/', router)
  router.route('/tags/:tagId').delete(jwtAuth, function (req, res, next) {
    const tagId = req.params.tagId
    Tag.byId(tagId)
      .then(async tag => {
        if (!tag) {
          return next(
            boom.notFound(
              `tag with id ${tagId} does not exist or has been deleted`,
              {
                type: 'Tag',
                id: tagId,
                activity: 'Delete Tag'
              }
            )
          )
        }

        const reader = await Reader.byAuthId(req.user)
        if (!reader || !checkOwnership(reader.id, tagId)) {
          return next(
            boom.forbidden(`Access to tag ${tagId} disallowed`, {
              type: 'Tag',
              id: tagId,
              activity: 'Delete Tag'
            })
          )
        }

        // delete Tag
        const deletedTag = await tag.delete()

        if (deletedTag instanceof Error) {
          return next(
            boom.badRequest(deletedTag.message, {
              activity: 'Delete Tag',
              type: 'Tag'
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
