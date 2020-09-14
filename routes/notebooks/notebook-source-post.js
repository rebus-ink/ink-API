const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:notebook-note-post')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/{notebookId}/sources:
   *   post:
   *     tags:
   *       - notebook-source
   *     description: Create a source and assign it to a Notebook
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: path
   *         name: notebookId
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/source'
   *     responses:
   *       201:
   *         description: Successfully created Source and assigned it to Notebook
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/source'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: Notebook not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/sources')
    .post(jwtAuth, function (req, res, next) {
      const notebookId = req.params.notebookId
      debug('notebookId', notebookId)
      debug('request body: ', req.body)
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

          if (!checkOwnership(reader.id, notebookId)) {
            return next(
              boom.forbidden(`Access to Notebook ${notebookId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }

          const body = req.body
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(
              boom.badRequest('Body must be a JSON object', {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          let createdSource
          try {
            createdSource = await Source.createSourceInNotebook(
              reader,
              notebookId,
              body
            )
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Create Source: ${err.message}`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body,
                    validation: err.data
                  }
                )
              )
            } else if (err.message === 'no notebook') {
              return next(
                boom.notFound(
                  `Create Source Error: No Notebook found with id: ${notebookId}`,
                  {
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

          res.setHeader('Content-Type', 'application/ld+json')
          res.setHeader('Location', createdSource.id)
          res.status(201).end(JSON.stringify(createdSource.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    })
}
