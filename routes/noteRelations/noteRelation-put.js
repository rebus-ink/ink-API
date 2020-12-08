const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { NoteRelation } = require('../../models/NoteRelation')
const { urlToId, checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:noteRelation-put')
const { notesCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /noteRelations/:id:
   *   put:
   *     tags:
   *       - noteRelations
   *     description: Update a noteRelation
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/noteRelation-input'
   *     responses:
   *       200:
   *         description: Successfully updated NoteRelation
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
  router.route('/noteRelations/:id').put(jwtAuth, function (req, res, next) {
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
        debug('request body: ', body)
        debug('id: ', req.params.id)
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        // check owndership of 'to', 'from', 'previous', 'next' resources and the NoteRelation itself
        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(
              `Access to NoteRelation ${req.params.id} disallowed`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
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
        if (body.previous && !checkOwnership(reader.id, body.previous)) {
          return next(
            boom.forbidden(
              `Access to NoteRelation in 'previous' property disallowed: ${
                body.previous
              }`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        if (body.next && !checkOwnership(reader.id, body.next)) {
          return next(
            boom.forbidden(
              `Access to NoteRelation in 'next' property disallowed: ${
                body.next
              }`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        body.id = req.params.id
        body.readerId = urlToId(reader.id)
        debug('readerId: ', body.readerId)
        let updatedNoteRelation
        try {
          updatedNoteRelation = await NoteRelation.updateNoteRelation(body)
          debug('updated Note Relation: ', updatedNoteRelation)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update NoteRelation: ${err.message}`,
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
            if (err.message === 'no previous') {
              err.message = `No NoteRelation found with id passed into 'previous': ${
                body.previous
              }`
              isNotFound = true
            }
            if (err.message === 'no next') {
              err.message = `No NoteRelation found with id passed into 'next': ${
                body.next
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

        if (!updatedNoteRelation) {
          return next(
            boom.notFound(`No NoteRelation found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        await notesCacheUpdate(reader.authId)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedNoteRelation.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
