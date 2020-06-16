const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')
const { urlToId, checkOwnership } = require('../../utils/utils')
const { NoteContext } = require('../../models/NoteContext')
const debug = require('debug')('ink:routes:outline-put')

module.exports = function (app) {
  /**
   * @swagger
   * /outlines/:id:
   *   put:
   *     tags:
   *       - outlines
   *     description: Update a outline
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/outline'
   *     responses:
   *       200:
   *         description: Successfully updated Outline
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/outline'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no Outline found with id {id}
   */
  app.use('/', router)
  router.route('/outlines/:id').put(jwtAuth, function (req, res, next) {
    debug('outline id: ', req.params.id)
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const body = req.body
        debug('request body: ', body)
        if (typeof body !== 'object') {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        // check owndership of Outline
        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(`Access to Outline ${req.params.id} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (body.type !== 'outline') {
          return next(
            boom.badRequest(`Outline type must be 'outline'`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        body.id = req.params.id
        body.readerId = urlToId(reader.id)

        let updatedOutline
        try {
          updatedOutline = await NoteContext.update(body)
          debug('updated outline: ', updatedOutline)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update Outline: ${err.message}`,
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

        if (!updatedOutline) {
          return next(
            boom.notFound(`No Outline found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedOutline.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
