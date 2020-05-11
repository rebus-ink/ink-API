const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Pub } = require('../../models/Notebook_Pub')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/publications/{pubId}:
   *   delete:
   *     tags:
   *       - notebooks
   *     description: Remove assignment of Publication to Notebook
   *     parameters:
   *       - in: path
   *         name: pubId
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
   *         description: Successfully removed Publication from Notebook
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or publication disallowed'
   *       404:
   *         description: publication, notebook or pub-notebook relation not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/publications/:pubId')
    .delete(jwtAuth, function (req, res, next) {
      const pubId = req.params.pubId
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
            if (!checkOwnership(reader.id, pubId)) {
              return next(
                boom.forbidden(`Access to Publication ${pubId} disallowed`, {
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
              await Notebook_Pub.removePubFromNotebook(notebookId, pubId)
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
