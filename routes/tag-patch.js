const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../models/Tag')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../utils/cache')
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /tags/{tagId}:
   *   patch:
   *     tags:
   *       - tags
   *     description: Update properties of a tag
   *     parameters:
   *       - in: path
   *         name: tagId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/tag'
   *       description: body should only include properties to be updated
   *     responses:
   *       200:
   *         description: Successfully updated Tag
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/tag'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to tag {id} disallowed'
   *       404:
   *         description: Tag not found
   */
  app.use('/', router)
  router.route('/tags/:tagId').patch(jwtAuth, function (req, res, next) {
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
                activity: 'Update Tag'
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
              activity: 'Update Tag'
            })
          )
        }

        // check body
        if (!req.is('application/ld+json')) {
          return next(
            boom.badRequest('Body must be JSON-LD', {
              activity: 'Update Tag'
            })
          )
        }
        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              activity: 'Update Tag',
              type: 'Tag'
            })
          )
        }

        // update Tag
        const updatedTag = await tag.update(body)

        if (updatedTag instanceof ValidationError) {
          return next(
            boom.badRequest('Validation Error on Update Tag: ', {
              activity: 'Update Tag',
              type: 'Tag',
              validation: updatedTag.data
            })
          )
        }
        if (updatedTag instanceof Error) {
          return next(
            boom.badRequest(updatedTag.message, {
              activity: 'Update Tag',
              type: 'Tag'
            })
          )
        }

        await libraryCacheUpdate(reader.id)

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedTag.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
