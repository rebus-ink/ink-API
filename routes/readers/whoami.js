const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')

module.exports = app => {
  /**
   * @swagger
   * /whoami:
   *   get:
   *     tags:
   *       - readers
   *     description: Get a Reader based on the authentication token.
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: The reader object for the reader currently logged in
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       401:
   *         description: No Authentication
   *       404:
   *         description: 'No Reader with ID {shortId}'
   */
  app.use('/', router)
  router.get(
    '/whoami',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byAuthId(req.user)
        .then(reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            res.setHeader('Location', reader.id)
            res.end(JSON.stringify(reader.toJSON()))
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
