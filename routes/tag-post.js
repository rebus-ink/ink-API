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

module.exports = function (app) {
  /**
   * @swagger
   * /tags:
   *   post:
   *     tags:
   *       - tags
   *     description: POST /tags
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
   *         description: Validation error
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/tags').post(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader) {
          return next(
            boom.unauthorized(`No user found for this token`, {
              type: 'Reader',
              activity: 'Create Tag'
            })
          )
        }

        if (!req.is('application/ld+json')) {
          return next(
            boom.badRequest('Body must be JSON-LD', {
              activity: 'Create Tag'
            })
          )
        }

        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              activity: 'Create Tag',
              type: 'Tag'
            })
          )
        }
        const createdTag = await Tag.createTag(reader.id, body)
        if (createdTag instanceof ValidationError) {
          return next(
            boom.badRequest('Validation Error on Create Tag: ', {
              activity: 'Create Tag',
              type: 'Tag',
              validation: createdTag.data
            })
          )
        }

        if (createdTag instanceof Error) {
          if (createdTag.message === 'duplicate') {
            return next(
              boom.badRequest(
                `duplicate error: stack ${body.name} already exists`,
                { activity: 'Create Tag', type: 'Tag' }
              )
            )
          }

          return next(
            boom.badRequest(createdTag.message, {
              activity: 'Create Tag',
              type: 'Tag'
            })
          )
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
