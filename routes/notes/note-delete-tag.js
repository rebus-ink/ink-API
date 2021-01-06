const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { Note_Tag } = require('../../models/Note_Tag')
const { checkOwnership } = require('../../utils/utils')
const { notesCacheUpdate, notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}/tags/{tagId}:
   *   delete:
   *     tags:
   *       - tag-note
   *     description: Remove assignment of a Tag to a Note
   *     parameters:
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: tagId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully removed Tag from Note
   *       401:
   *         description: 'No Authentication'
   *       404:
   *         description: note, tag or note-tag relation not found
   *       403:
   *         description: 'Access to tag or note disallowed'
   */
  app.use('/', router)
  router
    .route('/notes/:noteId/tags/:tagId')
    .delete(jwtAuth, function (req, res, next) {
      const noteId = req.params.noteId
      const tagId = req.params.tagId
      Reader.byAuthId(req.user)
        .then(reader => {
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
            if (!checkOwnership(reader.id, tagId)) {
              return next(
                boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }
            Note_Tag.removeTagFromNote(noteId, tagId)
              .then(async () => {
                await notebooksCacheUpdate(reader.authId)
                await notesCacheUpdate(reader.authId)
                res.status(204).end()
              })
              .catch(err => {
                return next(
                  boom.notFound(err.message, {
                    requestUrl: req.originalUrl
                  })
                )
              })
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
