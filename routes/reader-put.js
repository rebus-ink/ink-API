const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:readers')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')
const { urlToId } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /readers/{id}:
   *   put:
   *     tags:
   *       - readers
   *     description: Update reader
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the id of the reader
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/reader'
   *     responses:
   *       200:
   *         description: Updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       400:
   *         description: Validation Error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: access to Reader forbidden (mismatch between reader id and authentication token)
   *       404:
   *         description: Reader not found
   */
  app.use('/', router)
  router.put(
    '/readers/:id',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      const reader = await Reader.byAuthId(req.user)
      // check ownership
      if (urlToId(reader.id) !== req.params.id) {
        const exists = await Reader.checkIfExistsById(req.params.id)
        if (!exists) {
          return next(
            boom.notFound(`No Reader found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        return next(
          boom.forbidden(`Access to reader ${req.params.id} disallowed`, {
            requestUrl: req.originalUrl,
            requestBody: req.body
          })
        )
      }
      let updatedReader
      try {
        updatedReader = await Reader.update(req.params.id, req.body)
      } catch (err) {
        if (err instanceof ValidationError) {
          return next(
            boom.badRequest(
              `Validation error on update Reader: ${err.message}`,
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

      res.setHeader('Content-Type', 'application/ld+json')
      res.status(200)
      res.send(JSON.stringify(updatedReader.toJSON()))
    }
  )
}
