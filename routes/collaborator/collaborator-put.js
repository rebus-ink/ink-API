const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { ValidationError } = require('objection')
const { Collaborator } = require('../../models/Collaborator')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/{notebookId}/collaborators/{collaboratorId}:
   *   put:
   *     tags:
   *       - collaborators
   *     description: Update a collaborator for a notebook
   *     parameters:
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: collaboratorId
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/collaborator-input'
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Successfully updated Collaborator
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/collaborator'
   *       400:
   *         description: 'Validation Error'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to Collaborator {collaboratorId} disallowed'
   *       404:
   *         description: No collaborator found with id {collaboratorId}
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/collaborators/:collaboratorId')
    .put(jwtAuth, function (req, res, next) {
      const collaboratorId = req.params.collaboratorId
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound('No reader found with this token', {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
          // we assume that people will be updating their own collaborator object, not the owner of the notebook
          if (!checkOwnership(reader.id, collaboratorId)) {
            return next(
              boom.forbidden(
                `Access to Collaborator ${collaboratorId} disallowed`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }
          const body = req.body
          body.id = collaboratorId

          let updatedCollab
          try {
            updatedCollab = await Collaborator.update(
              body,
              req.params.notebookId
            )
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Update Collaborator: ${err.message}`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body,
                    validation: err.data
                  }
                )
              )
            } else {
              return next(
                boom.badRequest(err.message, {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                })
              )
            }
          }
          if (!updatedCollab) {
            return next(
              boom.notFound(
                `Put Collaborator Error: No Collaborator found with id ${collaboratorId}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(200).end(JSON.stringify(updatedCollab.toJSON()))
        })

        .catch(err => {
          next(err)
        })
    })
}
