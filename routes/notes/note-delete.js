const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Note } = require('../../models/Note')
const debug = require('debug')('ink:routes:note-delete')
const { notesCacheUpdate, notebooksCacheUpdate } = require('../../utils/cache')

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
   *       - in: query
   *         name: empty
   *         schema:
   *           type: boolean
   *         description: flag a note as emptied. It will be replaced by an empty note
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
   *         description: 'Access to Note {noteId} disallowed'
   */
  app.use('/', router)
  router.route('/notes/:noteId').delete(jwtAuth, function (req, res, next) {
    const noteId = req.params.noteId
    debug('noteId: ', noteId)
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

        let result
        if (req.query.empty) {
          result = await Note.empty(noteId)
        } else {
          result = await Note.delete(noteId)
        }

        debug('delete result: ', result)
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

        await notesCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)
        res.status(204).end()
      })

      .catch(err => {
        next(err)
      })
  })
}
