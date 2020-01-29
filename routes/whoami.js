const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:whoami')
const boom = require('@hapi/boom')

module.exports = app => {
  /**
   * @swagger
   * /whoami:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /whoami
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
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${req.user}`, {
                type: 'Reader',
                authId: req.user,
                activity: 'WhoAmI'
              })
            )
          } else {
            debug(`Got reader ${JSON.stringify(reader)}`)
            res.setHeader('Content-Type', 'application/ld+json')
            debug(`Setting location to ${reader.id}`)
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
