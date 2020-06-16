const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Note } = require('../../models/Note')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:noteContexts-addNote')

module.exports = function (app) {
  /**
   * @swagger
   * /noteContexts/:id/notes:
   *   post:
   *     tags:
   *       - noteContexts
   *     description: Add a Note to a NoteContext
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *       - in: query
   *         name: source
   *         schema:
   *           type: string
   *         description: id of the note to be copied. When source is used, no body is needed.
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note'
   *     responses:
   *       201:
   *         description: Successfully added Note to Context
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: Source (from note.sourceId) not found. Or Context not found
   */
  app.use('/', router)
  router
    .route('/noteContexts/:id/notes')
    .post(jwtAuth, function (req, res, next) {
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

          // copy
          if (req.query.source) {
            debug('source: ', req.query.source)
            if (!checkOwnership(reader.id, req.query.source)) {
              return next(
                boom.forbidden(
                  `Access to Note ${req.query.source} disallowed`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            }

            let copiedNote
            try {
              copiedNote = await Note.copyToContext(
                req.query.source,
                req.params.id
              )
              debug('copied note: ', copiedNote)
            } catch (err) {
              debug('error: ', err.message)
              if (err.message === 'no context') {
                return next(
                  boom.notFound(
                    `Add Note to Context Error: No Context found with id: ${
                      req.params.id
                    }`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              } else if (err.message === 'no note') {
                return next(
                  boom.notFound(
                    `Add Note to Context Error: No Note found with id: ${
                      req.query.source
                    }`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              }
            }

            res.setHeader('Content-Type', 'application/ld+json')
            res.setHeader('Location', copiedNote.id)
            res.status(201).end(JSON.stringify(copiedNote.toJSON()))
          }

          // create new note
          const body = req.body
          debug('creating a new note: ', body)
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(
              boom.badRequest('Body must be a JSON object', {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          body.contextId = req.params.id
          let createdNote
          try {
            createdNote = await Note.createNote(reader, body)
            debug('created note: ', createdNote)
          } catch (err) {
            debug('error: ', err.message)
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Add Note to Context: ${err.message}`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body,
                    validation: err.data
                  }
                )
              )
            } else if (err.message === 'no source') {
              return next(
                boom.notFound(
                  `Add Note to Context Error: No Source found with id: ${
                    body.sourceId
                  }`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            } else if (err.message === 'no context') {
              return next(
                boom.notFound(
                  `Add Note to Context Error: No Context found with id: ${
                    req.params.id
                  }`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
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
          res.setHeader('Location', createdNote.id)
          res.status(201).end(JSON.stringify(createdNote.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
