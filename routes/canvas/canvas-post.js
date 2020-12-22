const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const debug = require('debug')('ink:routes:canvas-post')
const { metricsQueue } = require('../../utils/metrics')
const { urlToId } = require('../../utils/utils')
const { Canvas } = require('../../models/Canvas')

module.exports = function (app) {
  /**
   * @swagger
   * /canvas:
   *   post:
   *     tags:
   *       - canvas
   *     description: Create a Canvas
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/canvas-input'
   *     responses:
   *       201:
   *         description: Successfully created Canvas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/canvas'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to reader disallowed'
   */
  app.use('/', router)
  router.route('/canvas').post(jwtAuth, function (req, res, next) {
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
        debug('request body: ', body)
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest(
              'Create Canvas Error: Request body must be a JSON object',
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        let createdCanvas
        try {
          createdCanvas = await Canvas.createCanvas(body, urlToId(reader.id))
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Canvas: ${err.message}`,
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

        const finishedCanvas = createdCanvas.toJSON()
        // await notebooksCacheUpdate(reader.authId)  // maybe??

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'createCanvas',
            readerId: finishedCanvas.readerId
          })
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.setHeader('Location', finishedCanvas.id)
        res.status(201).end(JSON.stringify(finishedCanvas))
      })
      .catch(err => {
        next(err)
      })
  })
}
