const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { NoteRelation } = require('../../models/NoteRelation')
const { checkOwnership, urlToId } = require('../../utils/utils')
const debug = require('debug')('ink:routes:noteRelation-post')

module.exports = function (app) {
  /**
   * @swagger
   * /noteRelations:
   *   post:
   *     tags:
   *       - noteRelations
   *     description: Create a noteRelation
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/noteRelation'
   *     responses:
   *       201:
   *         description: Successfully created NoteRelation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/noteRelation'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no Note or NoteRelation found with id passed to 'to', 'from', 'previous' or 'next'
   */
  app.use('/', router)
  router.route('/noteRelations').post(jwtAuth, function (req, res, next) {
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
        debug('request body', body)
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        body.from = urlToId(body.from)
        body.to = urlToId(body.to)
        // check owndership of 'to', 'from', 'previous', 'next' resources
        if (body.from && !checkOwnership(reader.id, body.from)) {
          return next(
            boom.forbidden(
              `Access to Note in 'from' property disallowed: ${body.from}`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        if (body.to && !checkOwnership(reader.id, body.to)) {
          return next(
            boom.forbidden(
              `Access to Note in 'to' property disallowed: ${body.to}`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        let createdNoteRelation
        try {
          createdNoteRelation = await NoteRelation.createNoteRelation(
            body,
            reader.id
          )
          debug('created Note Relation', createdNoteRelation)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create NoteRelation: ${err.message}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body,
                  validation: err.data
                }
              )
            )
          } else {
            let isNotFound
            if (err.message === 'no to') {
              err.message = `No Note found with id passed into 'to': ${body.to}`
              isNotFound = true
            }
            if (err.message === 'no from') {
              err.message = `No Note found with id passed into 'from': ${
                body.from
              }`
              isNotFound = true
            }

            if (isNotFound) {
              return next(
                boom.notFound(err.message, {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                })
              )
            }

            return next(
              boom.badRequest(err.message, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(201).end(JSON.stringify(createdNoteRelation.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
