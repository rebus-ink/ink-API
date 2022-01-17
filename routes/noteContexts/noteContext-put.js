const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { urlToId, checkOwnership } = require('../../utils/utils')
const { NoteContext } = require('../../models/NoteContext')

module.exports = function (app) {
  /**
   * @swagger
   * /noteContexts/:id:
   *   put:
   *     tags:
   *       - noteContexts
   *     description: Update a noteContext
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/noteContext-input'
   *     responses:
   *       200:
   *         description: Successfully updated NoteContext
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
   *       404:
   *         description: no NoteContext found with id {id}
   */
  app.use('/', router)
  router.route('/noteContexts/:id').put(jwtAuth, function (req, res, next) {
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

        // check owndership of NoteContext
        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(
              `Access to NoteContext ${req.params.id} disallowed`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        body.id = req.params.id
        body.readerId = urlToId(reader.id)

        let updatedNoteContext
        try {
          updatedNoteContext = await NoteContext.update(body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update NoteContext: ${err.message}`,
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

        if (!updatedNoteContext) {
          return next(
            boom.notFound(`No NoteContext found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedNoteContext.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
