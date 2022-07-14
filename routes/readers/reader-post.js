const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')

module.exports = function (app) {
  /**
   * @swagger
   * /readers:
   *   post:
   *     tags:
   *       - readers
   *     description: Create a Reader
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/reader-input'
   *     responses:
   *       201:
   *         description: Created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       400:
   *         description: Reader already exists or Validation Error
   *       401:
   *         description: No Authentication
   */
  app.use('/', router)
  router.post(
    '/readers',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      const exists = await Reader.checkIfExistsByAuthId(req.user)
      if (exists) {
        return next(
          boom.badRequest(`Reader already exists with id ${req.user}`, {
            requestUrl: req.originalUrl,
            requestBody: req.body
          })
        )
      }
      let createdReader
      try {
        createdReader = await Reader.createReader(req.user, req.body)
      } catch (err) {
        if (err instanceof ValidationError) {
          return next(
            boom.badRequest(
              `Validation error on create Reader: ${err.message}`,
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
      res.setHeader('Location', createdReader.id)
      res.status(201)
      res.send(JSON.stringify(createdReader.toJSON()))
    }
  )
}
