const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { metricsQueue } = require('../../utils/metrics')
const { Collaborator } = require('../../models/Collaborator')
const { checkOwnership } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/{notebookId}/collaborators:
   *   post:
   *     tags:
   *       - collaborators
   *     description: Create a Collaborator
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/collaborator-input'
   *     responses:
   *       201:
   *         description: Successfully created Collaborator
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/collaborator'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to reader disallowed'
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/collaborators')
    .post(jwtAuth, function (req, res, next) {
      const notebookId = req.params.notebookId
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          // for now, assume only owner of notebook can create collaborators
          if (!checkOwnership(reader.id, notebookId)) {
            return next(
              boom.forbidden(`Access to notebook ${notebookId} disallowed`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          const body = req.body
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(
              boom.badRequest(
                'Create Collaborator Error: Request body must be a JSON object',
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }
          let createdCollaborator
          try {
            createdCollaborator = await Collaborator.create(body, notebookId)
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Create Collaborator: ${err.message}`,
                  {
                    validation: err.data,
                    requestUrl: req.originalUrl,
                    requestBody: req.body
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

          if (metricsQueue) {
            await metricsQueue.add({
              type: 'createCollaborator',
              readerId: createdCollaborator.readerId
            })
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(201).end(JSON.stringify(createdCollaborator))
        })
        .catch(err => {
          next(err)
        })
    })
}
