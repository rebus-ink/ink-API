const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { NoteContext } = require('../../models/NoteContext')

module.exports = function (app) {
  /**
   * @swagger
   * /noteContexts:
   *   post:
   *     tags:
   *       - noteContexts
   *     description: Create a noteContext
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/noteContext-input'
   *     responses:
   *       201:
   *         description: Successfully created NoteContext
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/noteContext-return'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/noteContexts').post(jwtAuth, function (req, res, next) {
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
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        let createdNoteContext
        try {
          createdNoteContext = await NoteContext.createNoteContext(
            body,
            reader.id
          )
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create NoteContext: ${err.message}`,
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

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(201).end(JSON.stringify(createdNoteContext.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
