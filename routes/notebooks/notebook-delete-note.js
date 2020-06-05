const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Note } = require('../../models/Notebook_Note')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/notes/{noteId}:
   *   delete:
   *     tags:
   *       - notebook-note
   *     description: Remove assignment of Note to Notebook
   *     parameters:
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully removed Note from Notebook
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or note disallowed'
   *       404:
   *         description: note, notebook or note-notebook relation not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/notes/:noteId')
    .delete(jwtAuth, function (req, res, next) {
      const noteId = req.params.noteId
      const notebookId = req.params.notebookId
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            if (!checkOwnership(reader.id, noteId)) {
              return next(
                boom.forbidden(`Access to Note ${noteId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }
            if (!checkOwnership(reader.id, notebookId)) {
              return next(
                boom.forbidden(`Access to Notebook ${notebookId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }

            try {
              await Notebook_Note.removeNoteFromNotebook(notebookId, noteId)
              res.status(204).end()
            } catch (err) {
              return next(
                boom.notFound(err.message, {
                  requestUrl: req.originalUrl
                })
              )
            }
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
