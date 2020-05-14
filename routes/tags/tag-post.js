const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../../models/Tag')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /tags:
   *   post:
   *     tags:
   *       - tags
   *     description: Create a tag
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/tag'
   *     responses:
   *       201:
   *         description: Successfully created Tag
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/tag'
   *       400:
   *         description: Validation error or Duplicate error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/tags').post(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound(`No reader found with this token`, {
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

        let createdTag
        try {
          createdTag = await Tag.createTag(reader.id, body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Tag: ${err.message}`,
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

        await libraryCacheUpdate(reader.id)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(201).end(JSON.stringify(createdTag.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
