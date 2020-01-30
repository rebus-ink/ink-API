const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /publications:
   *   post:
   *     tags:
   *       - publications
   *     description: Create a Publication
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/publication'
   *     responses:
   *       201:
   *         description: Successfully created Publication
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publication'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to reader disallowed'
   */
  app.use('/', router)
  router.route('/publications').post(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader) {
          return next(
            boom.unauthorized(`No user found for this token`, {
              type: 'Reader',
              activity: 'Create Publication'
            })
          )
        }

        if (!req.is('application/ld+json')) {
          return next(
            boom.badRequest('Body must be JSON-LD', {
              activity: 'Create Publication'
            })
          )
        }

        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              activity: 'Create Publication',
              type: 'Publication'
            })
          )
        }
        const createdPub = await Publication.createPublication(reader, body)

        if (createdPub instanceof ValidationError) {
          return next(
            boom.badRequest('Validation Error on Create Publication: ', {
              activity: 'Create Publication',
              type: 'Publication',
              validation: createdPub.data
            })
          )
        }

        if (createdPub instanceof Error) {
          return next(
            boom.badRequest(createdPub.message, {
              activity: 'Create Publication',
              type: 'Publication'
            })
          )
        }

        await libraryCacheUpdate(reader.id)

        const finishedPub = createdPub.toJSON()

        res.setHeader('Content-Type', 'application/ld+json')
        res.setHeader('Location', finishedPub.id)
        res.status(201).end(JSON.stringify(finishedPub))
      })
      .catch(err => {
        next(err)
      })
  })
}
