const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { NoteContext } = require('../models/NoteContext')

module.exports = function (app) {
  /**
   * @swagger
   * /outlines:
   *   post:
   *     tags:
   *       - outlines
   *     description: Create an Outline
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/outline'
   *     responses:
   *       201:
   *         description: Successfully created Outline
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
   */
  app.use('/', router)
  router.route('/outlines').post(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader) {
          return next(
            boom.unauthorized(`No user found for this token`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const body = req.body
        if (typeof body !== 'object') {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        body.type = 'outline'

        let createdOutline
        try {
          createdOutline = await NoteContext.createNoteContext(body, reader.id)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Outline: ${err.message}`,
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
        res.status(201).end(JSON.stringify(createdOutline.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
