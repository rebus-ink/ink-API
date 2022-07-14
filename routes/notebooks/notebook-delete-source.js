const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Source } = require('../../models/Notebook_Source')
const {
  libraryCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/sources/{sourceId}:
   *   delete:
   *     tags:
   *       - notebook-source
   *     description: Remove assignment of Source to Notebook.
   *        This does not delete the source but removes it from the notebook.
   *     parameters:
   *       - in: path
   *         name: sourceId
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
   *         description: Successfully removed Source from Notebook
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or source disallowed'
   *       404:
   *         description: source, notebook or source-notebook relation not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/sources/:sourceId')
    .delete(jwtAuth, function (req, res, next) {
      const sourceId = req.params.sourceId
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
            if (!checkOwnership(reader.id, sourceId)) {
              return next(
                boom.forbidden(`Access to Source ${sourceId} disallowed`, {
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
              await Notebook_Source.removeSourceFromNotebook(
                notebookId,
                sourceId
              )
              await libraryCacheUpdate(reader.authId)
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
