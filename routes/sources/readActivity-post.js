const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { ReadActivity } = require('../../models/ReadActivity')
const { checkOwnership } = require('../../utils/utils')
const { libraryCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}/readActivity:
   *   post:
   *     tags:
   *       - sources
   *     description: Create a ReadActivity for a Source
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/readActivity-input'
   *     responses:
   *       201:
   *         description: Successfully created readActivity
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/readActivity'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to source {sourceId} disallowed'
   */
  app.use('/', router)
  router
    .route('/sources/:sourceId/readActivity')
    .post(jwtAuth, function (req, res, next) {
      const sourceId = req.params.sourceId
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

          if (!checkOwnership(reader.id, sourceId)) {
            return next(
              boom.forbidden(`Access to source ${sourceId} disallowed`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          const body = req.body
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(
              boom.badRequest(
                'Create ReadActivity Error: Body must be a JSON object',
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }

          let createdReadActivity
          try {
            createdReadActivity = await ReadActivity.createReadActivity(
              reader.id,
              sourceId,
              body
            )
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation error on create ReadActivity: ${err.message}`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body,
                    validation: err.data
                  }
                )
              )
            } else {
              if (err.message === 'no source') {
                return next(
                  boom.notFound(`No Source found with id ${sourceId}`, {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  })
                )
              } else {
                boom.badRequest(err.message, {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                })
              }
            }
          }
          await libraryCacheUpdate(reader.authId)

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(201).end(JSON.stringify(createdReadActivity.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
