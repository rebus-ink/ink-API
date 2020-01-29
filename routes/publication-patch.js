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
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}:
   *   patch:
   *     tags:
   *       - publications
   *     description: Update fields in a publication
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
   *             $ref: '#/definitions/publication'
   *       description: body should only include fields to be updated
   *     responses:
   *       200:
   *         description: Successfully updated Publication
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publication'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to publication {id} disallowed'
   *       404:
   *         description: Publication not found
   */
  app.use('/', router)
  router.route('/publications/:pubId').patch(jwtAuth, function (req, res, next) {
    const pubId = req.params.pubId
    Publication.byId(pubId)
      .then(async pub => {
        if (!pub) {
          return next(
            boom.notFound(
              `publication with id ${pubId} does not exist or has been deleted`,
              {
                type: 'Publication',
                id: pubId,
                activity: 'Update Publication'
              }
            )
          )
        }
        const reader = await Reader.byAuthId(req.user)
        if (!reader || !checkOwnership(reader.id, pubId)) {
          return next(
            boom.forbidden(`Access to publication ${pubId} disallowed`, {
              type: 'Publication',
              id: pubId,
              activity: 'Update Publication'
            })
          )
        }
        // check body
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

        // update pub
        const updatedPub = await pub.update(body)
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
            boom.badRequest('Validation Error on Update Publication: ', {
              activity: 'Update Publication',
              type: 'Publication',
              validation: updatedPub.data
            })
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

        await libraryCacheUpdate(reader.id)

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedPub.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
