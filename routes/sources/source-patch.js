const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../../utils/cache')
const { checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:source-patch')

module.exports = function (app) {
  /**
   * @swagger
   * /sources/{sourceId}:
   *   patch:
   *     tags:
   *       - sources
   *     description: Update fields in a source
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
   *             $ref: '#/definitions/source'
   *       description: body should only include fields to be updated
   *     responses:
   *       200:
   *         description: Successfully updated Source
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/source'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to source {id} disallowed'
   *       404:
   *         description: Source not found
   */
  app.use('/', router)
  router.route('/sources/:sourceId').patch(jwtAuth, function (req, res, next) {
    const sourceId = req.params.sourceId
    debug('sourceId: ', sourceId)
    Source.byId(sourceId)
      .then(async source => {
        debug('source retrieved: ', source)
        if (!source) {
          return next(
            boom.notFound(`No Source found with id ${sourceId}`, {
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
        if (!checkOwnership(reader.id, sourceId)) {
          return next(
            boom.forbidden(`Access to source ${sourceId} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const body = req.body
        debug('request body: ', body)
        if (typeof body !== 'object' || Object.keys(body).length === 0) {
          return next(
            boom.badRequest(
              'Patch Source Request Error: Body must be a JSON object',
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        // update source
        let updatedSource
        try {
          updatedSource = await Source.update(source, body)
          debug('updated source: ', updatedSource)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Patch Source: ${err.message}`,
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

        if (updatedSource === null) {
          return next(
            boom.notFound(`No Source found with id ${body.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        await libraryCacheUpdate(reader.id)

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedSource.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
