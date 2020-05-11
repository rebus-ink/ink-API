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

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}/readActivity:
   *   post:
   *     tags:
   *       - publications
   *     description: Create a ReadActivity for a Publication
   *     parameters:
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/readActivity'
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
   *         description: 'Access to publication {pubId} disallowed'
   */
  app.use('/', router)
  router
    .route('/publications/:pubId/readActivity')
    .post(jwtAuth, function (req, res, next) {
      const pubId = req.params.pubId
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

          if (!checkOwnership(reader.id, pubId)) {
            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
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
              pubId,
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
              if (err.message === 'no publication') {
                return next(
                  boom.notFound(`No Publication found with id ${pubId}`, {
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

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(201).end(JSON.stringify(createdReadActivity.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
