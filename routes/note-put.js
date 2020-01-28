const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const { checkOwnership } = require('../utils/utils')
const { libraryCacheUpdate } = require('../utils/cache')
const { Note } = require('../models/Note')
const { urlToId } = require('../utils/utils')
const { ValidationError } = require('objection')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}:
   *   put:
   *     tags:
   *       - notes
   *     description: PUT /notes/:noteId
   *     parameters:
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note'
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Successfully updated Note
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note'
   *       404:
   *         description: Note not found
   *       403:
   *         description: 'Access to publication {noteId} disallowed'
   */
  app.use('/', router)
  router.route('/notes/:noteId').put(jwtAuth, function (req, res, next) {
    const noteId = req.params.noteId

    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || !checkOwnership(reader.id, noteId)) {
          return next(
            boom.forbidden(`Access to Note ${noteId} disallowed`, {
              type: 'Note',
              id: noteId,
              activity: 'Update Note'
            })
          )
        }

        const note = Object.assign(req.body, { id: urlToId(noteId) })

        const result = await Note.update(note)

        if (result === null) {
          return next(
            boom.notFound(`no note found with id ${noteId}`, {
              type: 'Note',
              id: noteId,
              activity: 'Update Note'
            })
          )
        }

        if (result instanceof ValidationError) {
          return next(
            boom.badRequest('Validation Error on Update Note: ', {
              activity: 'Update Note',
              type: 'Note',
              validation: result.data
            })
          )
        }
        if (result instanceof Error) {
          if (result.message === 'no body') {
            return next(
              boom.badRequest('body is a required property', {
                activity: 'Update Note',
                type: 'Note'
              })
            )
          }

          return next(
            boom.badRequest(result.message, {
              activity: 'Update Note',
              type: 'Note'
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(result.toJSON()))
      })

      .catch(err => {
        next(err)
      })
  })
}
