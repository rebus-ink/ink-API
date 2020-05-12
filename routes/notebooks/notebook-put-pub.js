const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Pub } = require('../../models/Notebook_Pub')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/publications/{pubId}:
   *   put:
   *     tags:
   *       - notebooks
   *     description: Assign a Publication to a Notebook
   *     parameters:
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully added Publication to Notebook
   *       400:
   *         description: Cannot assign the same publication twice
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or publication disallowed'
   *       404:
   *         description:  publication or notebook not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/publications/:pubId')
    .put(jwtAuth, function (req, res, next) {
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
          }

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
            await Notebook_Pub.addPubToNotebook(notebookId, pubId)
            res.status(204).end()
          } catch (err) {
            if (err.message === 'no publication') {
              return next(
                boom.notFound(
                  `Add Publication to Notebook Error: No Publication found with id ${pubId}`,
                  {
                    requestUrl: req.originalUrl
                  }
                )
              )
            } else if (err.message === 'no notebook') {
              return next(
                boom.notFound(
                  `Add Publication to Notebook Error: No Notebook found with id ${notebookId}`,
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
