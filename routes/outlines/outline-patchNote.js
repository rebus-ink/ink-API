const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Note } = require('../../models/Note')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { checkOwnership, urlToId } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /outlines/:id/notes/:noteId:
   *   patch:
   *     tags:
   *       - outlines
   *     description: Update a Note that is in an Outline, including updating position information.
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note-outline-input'
   *         description: should only include properties that are being updated
   *     responses:
   *       200:
   *         description: Successfully updated Note
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note-outline'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: Source (from note.sourceId) Context or Note not found
   */
  app.use('/', router)
  router
    .route('/outlines/:id/notes/:noteId')
    .patch(jwtAuth, function (req, res, next) {
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
          if (!checkOwnership(reader.id, req.params.id)) {
            return next(
              boom.forbidden(`Access to Outline ${req.params.id} disallowed`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          if (!checkOwnership(reader.id, req.params.noteId)) {
            return next(
              boom.forbidden(`Access to Note ${req.params.noteId} disallowed`, {
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

          // get Note
          const note = await Note.byId(req.params.noteId)
          if (!note || note.deleted) {
            return next(
              boom.notFound(`No Note found with id: ${req.params.noteId}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
          if (note.contextId !== req.params.id) {
            return next(
              boom.badRequest(
                `Note ${req.params.noteId} does not belong to outline ${
                  req.params.id
                }`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }

          // linked list adjustments
          if (note.previous) {
            const previousNote = await Note.byId(note.previous)
            await Note.update(
              Object.assign(previousNote, { next: urlToId(note.next) })
            )
          }
          if (note.next) {
            const nextNote = await Note.byId(note.next)
            await Note.update(
              Object.assign(nextNote, { previous: urlToId(note.previous) })
            )
          }

          let updatedNote
          try {
            updatedNote = await Note.update(Object.assign(note, body))
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Update Note in Outline: ${err.message}`,
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
                  `Update Note in Outline Error: No Source found with id: ${
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
                  `Update Note in Outline Error: No Outline found with id: ${
                    req.params.id
                  }`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            } else if (err.message === 'no previous') {
              return next(
                boom.notFound(
                  `Update Note in Outline Error: No Note found with for previous property: ${
                    req.body.previous
                  }`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            } else if (err.message === 'no next') {
              return next(
                boom.notFound(
                  `Update Note in Outline Error: No Note found with for next property: ${
                    req.body.next
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
          // if updatedNote.previous
          if (updatedNote.previous) {
            const previousNote = await Note.byId(updatedNote.previous)
            const changes = { next: urlToId(updatedNote.id) }
            if (previousNote.previous === urlToId(updatedNote.id)) { changes.previous = null }
            await Note.update(Object.assign(previousNote, changes))
          }

          // if updatedNote.next
          if (updatedNote.next) {
            const nextNote = await Note.byId(updatedNote.next)
            const changes = { previous: urlToId(updatedNote.id) }
            if (nextNote.next === urlToId(updatedNote.id)) changes.next = null
            await Note.update(Object.assign(nextNote, changes))
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.setHeader('Location', updatedNote.id)
          res.status(200).end(JSON.stringify(updatedNote.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
