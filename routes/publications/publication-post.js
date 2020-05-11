const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../../models/Publication')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../../utils/cache')

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
            boom.badRequest(
              'Create Publication Error: Request body must be a JSON object',
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        let createdPub
        try {
          createdPub = await Publication.createPublication(reader, body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Publication: ${err.message}`,
                {
                  validation: err.data,
                  requestUrl: req.originalUrl,
                  requestBody: req.body
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
