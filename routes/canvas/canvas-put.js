const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership, urlToId } = require('../../utils/utils')
const { ValidationError } = require('objection')
const { Canvas } = require('../../models/Canvas')

module.exports = function (app) {
  /**
   * @swagger
   * /canvas/{canvasId}:
   *   put:
   *     tags:
   *       - canvas
   *     description: Update a canvas
   *     parameters:
   *       - in: path
   *         name: canvasId
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/canvas-input'
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Successfully updated Canvas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/canvas'
   *       400:
   *         description: 'Validation Error'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to Canvas {canvasId} disallowed'
   *       404:
   *         description: No canvas found with id {canvasId}
   */
  app.use('/', router)
  router.route('/canvas/:canvasId').put(jwtAuth, function (req, res, next) {
    const canvasId = req.params.canvasId
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
        if (!checkOwnership(reader.id, canvasId)) {
          return next(
            boom.forbidden(`Access to Canvas ${canvasId} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        const canvas = Object.assign(req.body, { id: urlToId(canvasId) })
        canvas.readerId = reader.id
        let updatedCanvas
        try {
          updatedCanvas = await Canvas.update(canvas)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update Canvas: ${err.message}`,
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

        if (!updatedCanvas) {
          return next(
            boom.notFound(
              `Put Canvas Error: No Canvas found with id ${canvasId}`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        // await notebooksCacheUpdate(reader.authId) // maybe??

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedCanvas.toJSON()))
      })

      .catch(err => {
        next(err)
      })
  })
}
