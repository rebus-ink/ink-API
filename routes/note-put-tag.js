const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { Note_Tag } = require('../models/Note_Tag')
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - tag-note
   *     description: Assign a Tag to a Note
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
   *         description: Successfully added Tag to Note
   *       400:
   *         description: Cannot assign the same tag twice
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to tag or note disallowed'
   *       404:
   *         description:  note or tag not found
   */
  app.use('/', router)
  router
    .route('/notes/:noteId/tags/:tagId')
    .put(jwtAuth, function (req, res, next) {
      const noteId = req.params.noteId
      const tagId = req.params.tagId
      Reader.byAuthId(req.user)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with this token`, {
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
          if (!checkOwnership(reader.id, tagId)) {
            return next(
              boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }

          Note_Tag.addTagToNote(noteId, tagId)
            .then(async result => {
              res.status(204).end()
            })
            .catch(err => {
              if (err.message === 'no tag') {
                return next(
                  boom.notFound(
                    `Add Tag to Note Error: No Tag found with id ${tagId}`,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              } else if (err.message === 'no note') {
                return next(
                  boom.notFound(
                    `Add Tag to Note Error: No Note found with id ${noteId}`,
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
            })
        })
        .catch(err => {
          next(err)
        })
    })
}
