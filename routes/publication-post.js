const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')

const utils = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /readers/{id}/publications:
   *   post:
   *     tags:
   *       - publications
   *     description: POST /readers/id/publications
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
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
   *       400:
   *         description: Validation error
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router
    .route('/readers/:id/publications')
    .post(jwtAuth, function (req, res, next) {
      const id = req.params.id
      Reader.byId(id)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${id}`, {
                type: 'Reader',
                id,
                activity: 'Create Publication'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${id} disallowed`, {
                type: 'Reader',
                id,
                activity: 'Create Publication'
              })
            )
          } else {
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

            // create publication
            Publication.createPublication(reader, body)
              .then(createdPub => {
                if (createdPub instanceof ValidationError) {
                  return next(
                    boom.badRequest(
                      'Validation Error on Create Publication: ',
                      {
                        activity: 'Create Publication',
                        type: 'Publication',
                        validation: createdPub.data
                      }
                    )
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

                res.setHeader(
                  'Content-Type',
                  'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
                )
                res.status(201).end(JSON.stringify(createdPub.toJSON()))
              })
              .catch(err => {
                next(err)
              })
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
