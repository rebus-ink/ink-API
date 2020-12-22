const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { Notebook } = require('../../models/Notebook')
const { metricsQueue } = require('../../utils/metrics')
const { notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks:
   *   post:
   *     tags:
   *       - notebooks
   *     description: Create a notebook
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/notebook-input'
   *     responses:
   *       201:
   *         description: Successfully created Notebook
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/notebook'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/notebooks').post(jwtAuth, function (req, res, next) {
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

        const body = req.body
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        let createdNotebook
        try {
          createdNotebook = await Notebook.createNotebook(body, reader.id)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Notebook: ${err.message}`,
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
        if (metricsQueue) {
          await metricsQueue.add({
            type: 'createNotebook',
            readerId: createdNotebook.readerId
          })
        }
        await notebooksCacheUpdate(reader.authId)

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(201).end(JSON.stringify(createdNotebook.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
