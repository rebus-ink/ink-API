const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../models/Tag')
const { Note } = require('../models/Note')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /notes:
   *   post:
   *     tags:
   *       - notes
   *     description: POST /notes
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note'
   *     responses:
   *       201:
   *         description: Successfully created Note
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note'
   *       400:
   *         description: Validation error
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/notes').post(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader) {
          return next(
            boom.unauthorized(`No user found for this token`, {
              type: 'Reader',
              activity: 'Create Note'
            })
          )
        }

        if (!req.is('application/ld+json')) {
          return next(
            boom.badRequest('Body must be JSON-LD', {
              activity: 'Create Note'
            })
          )
        }

        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              activity: 'Create Note',
              type: 'Note'
            })
          )
        }

        const createdNote = await Note.createNote(reader, body)

        if (createdNote instanceof ValidationError) {
          return next(
            boom.badRequest('Validation Error on Create Note: ', {
              activity: 'Create Note',
              type: 'Note',
              validation: createdNote.data
            })
          )
        }

        if (createdNote instanceof Error) {
          if (createdNote.message === 'no body') {
            return next(
              boom.badRequest('body is a required property', {
                activity: 'Create Note',
                type: 'Note'
              })
            )
          }

          if (createdNote.message === 'no document') {
            return next(
              boom.notFound(
                `no document found with documentUrl: ${body.documentUrl}`,
                {
                  activity: 'Create Note',
                  type: 'Document',
                  id: body.documentUrl
                }
              )
            )
          }

          if (createdNote.message === 'no publication') {
            return next(
              boom.notFound(
                `no publication found with id: ${body.publicationId}`,
                {
                  activity: 'Create Note',
                  type: 'Publication',
                  id: body.publicationId
                }
              )
            )
          }

          if (createdNote.message === 'document without publication') {
            return next(
              boom.badRequest(
                `notes with a documentUrl should also have a publicationId for the corresponding publication. Error for documentUrl: ${
                  body.documentUrl
                }`,
                {
                  activity: 'Create Note',
                  type: 'Document',
                  id: body.documentUrl
                }
              )
            )
          }

          if (createdNote.message === 'document and publication do not match') {
            return next(
              boom.badRequest(
                `document with url: ${
                  body.documentUrl
                } does not belong to publication ${body.publicationId}`,
                {
                  activity: 'Create Note',
                  type: 'Document',
                  id: body.documentUrl
                }
              )
            )
          }

          return next(
            boom.badRequest(createdNote.message, {
              activity: 'Create Note',
              type: 'Note'
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(201).end(JSON.stringify(createdNote.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
