const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:readers')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')

module.exports = function (app) {
  /**
   * @swagger
   * /readers:
   *   put:
   *     tags:
   *       - readers
   *     description: Update reader
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
   */
  app.use('/', router)
  router.post(
    '/readers',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      const reader = await Reader.byAuthId(req.user)
      let updatedReader
      try {
        updatedReader = await Reader.createReader(urlToId(reader.id), req.body)
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
