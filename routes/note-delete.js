const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../utils/utils')
const { Note } = require('../models/Note')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}:
   *   delete:
   *     tags:
   *       - notes
   *     description: Delete a note by id
   *     parameters:
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Note
   *       401:
   *         description: 'No Authentication'
   *       404:
   *         description: Note not found
   *       403:
   *         description: 'Access to publication {noteId} disallowed'
   */
  app.use('/', router)
  router.route('/notes/:noteId').delete(jwtAuth, function (req, res, next) {
    const noteId = req.params.noteId

    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl
            })
          )
        }
        if (!checkOwnership(reader.id, noteId)) {
          return next(
            boom.forbidden(`Access to Note ${noteId} disallowed`, {
              requestUrl: req.originalUrl
            })
          )
        }

        const result = await Note.delete(noteId)
        if (!result) {
          return next(
            boom.notFound(
              `Note Delete Error: No Note found with id ${noteId}`,
              {
                requestUrl: req.originalUrl
              }
            )
          )
        }

        res.status(204).end()
      })

      .catch(err => {
        next(err)
      })
  })
}
