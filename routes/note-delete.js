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

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}:
   *   delete:
   *     tags:
   *       - notes
   *     description: DELETE /notes/:noteId
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
        if (!reader || !checkOwnership(reader.id, noteId)) {
          return next(
            boom.forbidden(`Access to Note ${noteId} disallowed`, {
              type: 'Note',
              id: noteId,
              activity: 'Delete Note'
            })
          )
        }

        const result = await Note.delete(noteId)
        if (result === null) {
          return next(
            boom.notFound(`no note found with id ${noteId}`, {
              type: 'Note',
              id: noteId,
              activity: 'Delete Note'
            })
          )
        }

        res.status(204).end()
      })

      .catch(err => {
        next(err)
      })
  })
}
