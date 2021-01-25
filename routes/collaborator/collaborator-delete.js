const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Collaborator } = require('../../models/Collaborator')
const { metricsQueue } = require('../../utils/metrics')
module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/{notebookId}/collaborators/{collaboratorId}:
   *   delete:
   *     tags:
   *       - collaborators
   *     description: Delete a collaborator by id
   *     parameters:
   *       - in: path
   *         name: collaboratorId
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
   *         description: Successfully deleted Collaborator
   *       401:
   *         description: 'No Authentication'
   *       404:
   *         description: Collaborator not found
   *       403:
   *         description: 'Access to Collaborator {collaboratorId} disallowed'
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/collaborators/:collaboratorId')
    .delete(jwtAuth, function (req, res, next) {
      const collaboratorId = req.params.collaboratorId
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound('No reader found with this token', {
                requestUrl: req.originalUrl
              })
            )
          }
          // assume that collaborator deletes their own collaborator object
          if (!checkOwnership(reader.id, collaboratorId)) {
            return next(
              boom.forbidden(
                `Access to Collaborator ${collaboratorId} disallowed`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          }

          const result = await Collaborator.delete(collaboratorId)
          if (!result) {
            return next(
              boom.notFound(
                `Collaborator Delete Error: No Collaborator found with id ${collaboratorId}`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          }

          if (metricsQueue) {
            await metricsQueue.add({
              type: 'deleteCollaborator',
              readerId: urlToId(reader.id)
            })
          }

          res.status(204).end()
        })

        .catch(err => {
          next(err)
        })
    })
}
