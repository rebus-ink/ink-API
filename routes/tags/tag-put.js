const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../../models/Tag')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const {
  libraryCacheUpdate,
  tagsCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')
const { checkOwnership } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /tags/{tagId}:
   *   put:
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
  router.route('/tags/:tagId').put(jwtAuth, function (req, res, next) {
    const tagId = req.params.tagId
    Tag.byId(tagId)
      .then(async tag => {
        if (!tag) {
          return next(
            boom.notFound(`Put Tag Error: No Tag found with id ${tagId}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const reader = await Reader.byAuthId(req.user)
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        if (!checkOwnership(reader.id, tagId)) {
          return next(
            boom.forbidden(`Access to tag ${tagId} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        // update Tag
        let updatedTag
        try {
          updatedTag = await tag.update(body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update Tag: ${err.message}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body,
                  validation: err.data
                }
              )
            )
          } else {
            return next(
              boom.badRequest(err.message, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
        }

        await libraryCacheUpdate(reader.authId)
        await tagsCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedTag.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
