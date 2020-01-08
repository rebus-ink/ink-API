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
   *   delete:
   *     tags:
   *       - tags
   *       - notes
   *     description: DELETE /notes/:noteId/tags/:tagId
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
          if (!reader) {
            return next(
              boom.notFound(`No reader with this token`, {
                type: 'Reader',
                activity: 'Remove Tag from Note'
              })
            )
          } else {
            if (!checkOwnership(reader.id, noteId)) {
              return next(
                boom.forbidden(`Access to Note ${noteId} disallowed`, {
                  type: 'Note',
                  id: noteId,
                  activity: 'Remove Tag from Note'
                })
              )
            }
            if (!checkOwnership(reader.id, tagId)) {
              return next(
                boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                  type: 'Tag',
                  id: tagId,
                  activity: 'Remove Tag from Note'
                })
              )
            }
            Note_Tag.removeTagFromNote(noteId, tagId).then(async result => {
              if (result instanceof Error) {
                switch (result.message) {
                  case 'no note':
                    return next(
                      boom.notFound(`no note found with id ${noteId}`, {
                        type: 'Note',
                        id: noteId,
                        activity: 'Remove Tag from Note'
                      })
                    )

                  case 'no tag':
                    return next(
                      boom.notFound(`no tag found with id ${tagId}`, {
                        type: 'reader:Tag',
                        id: tagId,
                        activity: 'Remove Tag from Note'
                      })
                    )

                  case 'not found':
                    return next(
                      boom.notFound(
                        `no relationship found between Tag ${tagId} and Note ${noteId}`,
                        {
                          type: 'Note_Tag',
                          activity: 'Remove Tag from Note'
                        }
                      )
                    )

                  default:
                    return next(err)
                }
              } else {
                res.status(204).end()
              }
            })
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
