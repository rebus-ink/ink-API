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
   * /readers/{readerId}/publications/{pubId}:
   *   patch:
   *     tags:
   *       - publications
   *     description: PATCH /readers/:readerId/publications/:pubId
   *     parameters:
   *       - in: path
   *         name: readerId
   *         schema:
   *           type: string
   *         required: true
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
   *             $ref: '#/definitions/publication'
   *     responses:
   *       200:
   *         description: Successfully updated Publication
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publication'
   *       400:
   *         description: Validation error
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router
    .route('/readers/:readerId/publications/:pubId')
    .patch(jwtAuth, function (req, res, next) {
      const readerId = req.params.readerId
      Reader.byId(readerId)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${readerId}`, {
                type: 'Reader',
                id,
                activity: 'Update Publication'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${readerId} disallowed`, {
                type: 'Reader',
                id,
                activity: 'Update Publication'
              })
            )
          } else {
            if (!req.is('application/ld+json')) {
              return next(
                boom.badRequest('Body must be JSON-LD', {
                  activity: 'Update Publication'
                })
              )
            }

            const body = req.body
            if (typeof body !== 'object' || _.isEmpty(body)) {
              return next(
                boom.badRequest('Body must be a JSON object', {
                  activity: 'Update Publication',
                  type: 'Publication'
                })
              )
            }

            // update publication
            body.id = req.params.pubId
            Publication.update(body)
              .then(updatedPub => {
                if (updatedPub === null) {
                  return next(
                    boom.notFound(`no publication found with id ${body.id}`, {
                      type: 'Publication',
                      id: body.id,
                      activity: 'Update Publication'
                    })
                  )
                }

                if (updatedPub instanceof ValidationError) {
                  return next(
                    boom.badRequest(
                      'Validation Error on Update Publication: ',
                      {
                        activity: 'Update Publication',
                        type: 'Publication',
                        validation: updatedPub.data
                      }
                    )
                  )
                }

                if (updatedPub instanceof Error) {
                  return next(
                    boom.badRequest(updatedPub.message, {
                      activity: 'Update Publication',
                      type: 'Publication'
                    })
                  )
                }

                res.setHeader('Content-Type', 'application/ld+json')
                res.status(200).end(JSON.stringify(updatedPub.toJSON()))
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
