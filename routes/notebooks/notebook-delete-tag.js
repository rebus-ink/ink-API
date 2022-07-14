const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Tag } = require('../../models/Notebook_Tag')
const { notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/tags/{tagId}:
   *   delete:
   *     tags:
   *       - notebook-tag
   *     description: Remove assignment of Tag to Notebook.
   *       This does not delete a tag but removes it from the notebook.
   *     parameters:
   *       - in: path
   *         name: tagId
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
   *         description: Successfully removed Tag from Notebook
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or tag disallowed'
   *       404:
   *         description: tag, notebook or tag-notebook relation not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/tags/:tagId')
    .delete(jwtAuth, function (req, res, next) {
      const tagId = req.params.tagId
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
            if (!checkOwnership(reader.id, tagId)) {
              return next(
                boom.forbidden(`Access to Tag ${tagId} disallowed`, {
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
              await Notebook_Tag.removeTagFromNotebook(notebookId, tagId)
              await notebooksCacheUpdate(reader.authId)
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
