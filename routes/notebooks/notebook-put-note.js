const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Note } = require('../../models/Notebook_Note')
const debug = require('debug')('ink:routes:notebook-put-note')
const { notesCacheUpdate, notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/notes/{noteId}:
   *   put:
   *     tags:
   *       - notebook-note
   *     description: Assign a Note to a Notebook
   *     parameters:
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully added Note to Notebook
   *       400:
   *         description: Cannot assign the same note twice
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or note disallowed'
   *       404:
   *         description:  note or notebook not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/notes/:noteId')
    .put(jwtAuth, function (req, res, next) {
      const noteId = req.params.noteId
      const notebookId = req.params.notebookId
      debug('noteId', noteId, 'notebookId', notebookId)
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
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
          if (!checkOwnership(reader.id, notebookId)) {
            return next(
              boom.forbidden(`Access to Notebook ${notebookId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }

          try {
            await Notebook_Note.addNoteToNotebook(notebookId, noteId)
            await notesCacheUpdate(reader.authId)
            await notebooksCacheUpdate(reader.authId)
            res.status(204).end()
          } catch (err) {
            debug('error: ', err.message)
            if (err.message === 'no note') {
              return next(
                boom.notFound(
                  `Add Note to Notebook Error: No Note found with id ${noteId}`,
                  {
                    requestUrl: req.originalUrl
                  }
                )
              )
            } else if (err.message === 'no notebook') {
              return next(
                boom.notFound(
                  `Add Note to Notebook Error: No Notebook found with id ${notebookId}`,
                  {
                    requestUrl: req.originalUrl
                  }
                )
              )
            } else {
              return next(
                boom.badRequest(err.message, {
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
