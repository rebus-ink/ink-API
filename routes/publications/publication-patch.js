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
const { checkOwnership } = require('../../utils/utils')

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
            boom.notFound(`No Publication found with id ${pubId}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        const reader = await Reader.byAuthId(req.user)
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
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
        if (typeof body !== 'object' || Object.keys(body).length === 0) {
          return next(
            boom.badRequest(
              'Patch Publication Request Error: Body must be a JSON object',
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        // update pub
        let updatedPub
        try {
          updatedPub = await Publication.update(pub, body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Patch Publication: ${err.message}`,
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

        if (updatedPub === null) {
          return next(
            boom.notFound(`No Publication found with id ${body.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
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
