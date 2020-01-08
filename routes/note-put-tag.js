const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../utils/cache')
const { Publication_Tag } = require('../models/Publications_Tags')
const { Note_Tag } = require('../models/Note_Tag')
const { checkOwnership } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - tags
   *       - notes
   *     description: PUT /notes/:noteId/tags/:tagId
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
   *       404:
   *         description:  note or tag not found
   *       403:
   *         description: 'Access to tag or note disallowed'
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
                type: 'Reader',
                id: readerId,
                activity: 'Add Tag to Publication'
              })
            )
          }

          if (!checkOwnership(reader.id, noteId)) {
            return next(
              boom.forbidden(`Access to Note ${noteId} disallowed`, {
                type: 'Note',
                id: noteId,
                activity: 'Add Tag to Note'
              })
            )
          }
          if (!checkOwnership(reader.id, tagId)) {
            return next(
              boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                type: 'Tag',
                id: tagId,
                activity: 'Add Tag to Note'
              })
            )
          }

          Note_Tag.addTagToNote(noteId, tagId).then(async result => {
            if (result instanceof Error) {
              switch (result.message) {
                case 'duplicate':
                  return next(
                    boom.badRequest(
                      `duplicate Note ${noteId} already asssociated with tag ${tagId}`,
                      {
                        type: `Note_Tag`,
                        target: noteId,
                        object: tagId,
                        activity: 'Add Tag to Note'
                      }
                    )
                  )

                case 'no note':
                  return next(
                    boom.notFound(`no note found with id ${noteId}`, {
                      type: 'Note',
                      id: noteId,
                      activity: 'Add Tag to Note'
                    })
                  )

                case 'no tag':
                  return next(
                    boom.notFound(`no tag found with id ${tagId}`, {
                      type: 'reader:Tag',
                      id: tagId,
                      activity: 'Add Tag to Note'
                    })
                  )

                default:
                  return next(err)
              }
            } else {
              res.status(204).end()
            }
          })
        })
        .catch(err => {
          next(err)
        })
    })
}
