const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { ReadActivity } = require('../models/ReadActivity')
const { checkOwnership } = require('../utils/utils')

/**
 * @swagger
 * definition:
 *   readActivity:
 *     properties:
 *       'oa:hasSelector':
 *         type: object
 *       json:
 *         type: object
 **/

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}/readActivity:
   *   post:
   *     tags:
   *       - publications
   *     description: POST /publications/:pubId/readActivity
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
          if (!reader) {
            return next(
              boom.unauthorized(`No user found for this token`, {
                type: 'Reader',
                activity: 'Create ReadActivity'
              })
            )
          }

          if (!checkOwnership(reader.id, pubId)) {
            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
                type: 'Publication',
                id: pubId,
                activity: 'Create ReadActivity'
              })
            )
          }

          if (!req.is('application/ld+json')) {
            return next(
              boom.badRequest('Body must be JSON-LD', {
                activity: 'Create ReadActivity'
              })
            )
          }

          const body = req.body
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(
              boom.badRequest('Body must be a JSON object', {
                activity: 'Create ReadActivity',
                type: 'ReadActivity'
              })
            )
          }
          const object = {
            selector: body['oa:hasSelector'],
            json: body.json
          }

          const createdReadActivity = await ReadActivity.createReadActivity(
            reader.id,
            pubId,
            object
          )

          if (createdReadActivity instanceof ValidationError) {
            // rename selector to oa:hasSelector
            if (createdReadActivity.data && createdReadActivity.data.selector) {
              createdReadActivity.data['oa:hasSelector'] =
                createdReadActivity.data.selector
              createdReadActivity.data[
                'oa:hasSelector'
              ][0].params.missingProperty =
                'oa:hasSelector'
              delete createdReadActivity.data.selector
            }
            return next(
              boom.badRequest('Validation error on create ReadActivity: ', {
                type: 'Publication',
                activity: 'Read',
                validation: createdReadActivity.data
              })
            )
          }

          if (createdReadActivity instanceof Error) {
            if (createdReadActivity.message === 'no publication') {
              return next(
                boom.notFound(`no publication found with id ${pubId}`, {
                  type: 'Publication',
                  id: pubId,
                  activity: 'Create Read Activity'
                })
              )
            }

            return next(
              boom.badRequest(createdReadActivity.message, {
                activity: 'Create ReadActivity',
                type: 'ReadActivity'
              })
            )
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(201).end(JSON.stringify(createdReadActivity.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
